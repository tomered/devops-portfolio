from flask import Flask, request, jsonify, Blueprint
from flask_cors import CORS
from dotenv import load_dotenv
import os
import json
from models import (
    ChatRequest,
    ContactForm,
    ExportChatRequest,
    ChatMessage,
    ChatResponse,
    OTPRequest,
    EndorsementCreate,
    EndorsementDelete,
)
from mongo import (
    log_conversation,
    log_export,
    log_llm_usage,
    generate_otp,
    store_otp,
    verify_otp,
    cleanup_expired_otps,
    create_endorsement,
    get_all_endorsements,
    get_endorsements_by_skill,
    delete_endorsement,
    get_endorsement_by_id,
    get_metrics_data,
    log_api_call,
)
from llm import router, get_context_prompt
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from prometheus_client import (
    generate_latest,
    CONTENT_TYPE_LATEST,
    Counter,
    Gauge,
    Histogram,
    Info,
)

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Wildcard CORS

# Create API Blueprint
api = Blueprint("api", __name__, url_prefix="/api")

# Prometheus metrics definitions

# LLM Usage Metrics
llm_total_tokens = Gauge("llm_total_tokens", "Total LLM tokens used")
llm_total_prompt_tokens = Gauge(
    "llm_total_prompt_tokens", "Total LLM prompt tokens used"
)
llm_total_completion_tokens = Gauge(
    "llm_total_completion_tokens", "Total LLM completion tokens used"
)

# LLM Usage by Model
llm_tokens_by_model = Gauge(
    "llm_tokens_by_model", "Total tokens used by model", ["model"]
)

# Conversation Metrics
conversations_total = Gauge("conversations_total", "Total conversations")
conversations_total_messages = Gauge(
    "conversations_total_messages", "Total messages in all conversations"
)
conversations_avg_messages = Gauge(
    "conversations_avg_messages", "Average messages per conversation"
)

# Topic Analysis Metrics
conversation_topics_frequency = Gauge(
    "conversation_topics_frequency", "Frequency of conversation topics", ["topic"]
)
conversation_topics_total_unique = Gauge(
    "conversation_topics_total_unique", "Total number of unique topics"
)

# Endorsement Metrics
endorsements_total_active = Gauge(
    "endorsements_total_active", "Total active endorsements"
)
endorsements_total_deleted = Gauge(
    "endorsements_total_deleted", "Total deleted endorsements"
)
endorsements_deletion_rate = Gauge(
    "endorsements_deletion_rate", "Endorsement deletion rate percentage"
)
endorsements_by_skill = Gauge(
    "endorsements_by_skill", "Endorsements count by skill", ["skill_name"]
)
endorsements_by_endorser = Gauge(
    "endorsements_by_endorser", "Endorsements count by endorser email", ["email"]
)

# API Usage Metrics
api_total_calls = Gauge("api_total_calls", "Total API calls")
api_calls_by_endpoint = Gauge(
    "api_calls_by_endpoint", "API calls by endpoint", ["endpoint"]
)
api_calls_by_status = Gauge(
    "api_calls_by_status", "API calls by HTTP status code", ["status_code"]
)

# OTP Metrics
otp_total_generated = Gauge("otp_total_generated", "Total OTP codes generated")
otp_active = Gauge("otp_active", "Currently active OTP codes")
otp_expired = Gauge("otp_expired", "Expired OTP codes")
otp_by_action = Gauge("otp_by_action", "OTP codes by action type", ["action"])

# Export Metrics
exports_total = Gauge("exports_total", "Total chat exports")
contact_submissions_total = Gauge(
    "contact_submissions_total", "Total contact form submissions"
)

# System Health Metrics
system_database_connection = Gauge(
    "system_database_connection",
    "Database connection status (1=connected, 0=disconnected)",
)
system_collections_count = Gauge(
    "system_collections_count", "Number of database collections"
)
system_total_documents = Gauge(
    "system_total_documents", "Total number of documents across all collections"
)


def log_api_request(endpoint_name):
    """Decorator to log API calls"""
    import asyncio
    import functools

    def decorator(f):
        if asyncio.iscoroutinefunction(f):

            @functools.wraps(f)
            async def async_wrapper(*args, **kwargs):
                try:
                    # Get request info
                    user_agent = request.headers.get("User-Agent")
                    ip_address = request.remote_addr
                    method = request.method

                    # Execute the async function
                    result = await f(*args, **kwargs)

                    # Determine status code
                    if isinstance(result, tuple):
                        status_code = result[1] if len(result) > 1 else 200
                    else:
                        status_code = 200

                    # Log the API call
                    log_api_call(
                        endpoint_name, method, status_code, user_agent, ip_address
                    )

                    return result
                except Exception as e:
                    # Log failed API call
                    log_api_call(
                        endpoint_name,
                        request.method,
                        500,
                        request.headers.get("User-Agent"),
                        request.remote_addr,
                    )
                    raise e

            return async_wrapper
        else:

            @functools.wraps(f)
            def sync_wrapper(*args, **kwargs):
                try:
                    # Get request info
                    user_agent = request.headers.get("User-Agent")
                    ip_address = request.remote_addr
                    method = request.method

                    # Execute the function
                    result = f(*args, **kwargs)

                    # Determine status code
                    if isinstance(result, tuple):
                        status_code = result[1] if len(result) > 1 else 200
                    else:
                        status_code = 200

                    # Log the API call
                    log_api_call(
                        endpoint_name, method, status_code, user_agent, ip_address
                    )

                    return result
                except Exception as e:
                    # Log failed API call
                    log_api_call(
                        endpoint_name,
                        request.method,
                        500,
                        request.headers.get("User-Agent"),
                        request.remote_addr,
                    )
                    raise e

            return sync_wrapper

    return decorator


def send_email(to_email, subject, body):
    print(f"[send_email] Called with to_email={to_email}, subject={subject}")
    try:
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        email_address = os.getenv("EMAIL_ADDRESS")
        email_password = os.getenv("EMAIL_PASSWORD")
        print(f"[send_email] Using email_address={email_address}")
        message = MIMEMultipart()
        message["From"] = email_address
        message["To"] = to_email
        message["Subject"] = subject
        message.attach(MIMEText(body, "plain"))
        print(f"[send_email] Connecting to SMTP server {smtp_server}:{smtp_port}")
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(email_address, email_password)
            print(f"[send_email] Logged in, sending email...")
            server.sendmail(email_address, to_email, message.as_string())
        print(f"[send_email] Email sent successfully to {to_email}")
        return True
    except Exception as e:
        print(f"[send_email] Error sending email: {str(e)}")
        return False


def get_skill_name_by_id(skill_id):
    """Get skill name by ID from skills.json"""
    try:
        skills_path = os.path.join("external_context", "skills.json")
        with open(skills_path, "r", encoding="utf-8") as file:
            skills_data = json.load(file)

        for category in skills_data["skillCategories"]:
            for skill in category["skills"]:
                if skill["id"] == skill_id:
                    return skill["name"]
        return skill_id  # Return ID if name not found
    except:
        return skill_id


@api.route("/chat", methods=["POST"])
@log_api_request("chat")
async def chat():
    print("[chat] Called")
    try:
        data = request.json
        print(f"[chat] Received data: {data}")
        chat_request = ChatRequest(**data)
        context = get_context_prompt()
        print(f"[chat] Loaded context prompt")
        context_message = {"role": "system", "content": context}
        llm_messages = [
            context_message,
            *[
                {"role": msg.role, "content": msg.content}
                for msg in chat_request.messages
            ],
        ]
        llm_messages.append({"role": "user", "content": chat_request.newMessage})
        print(f"[chat] LLM messages: {llm_messages}")
        model = os.getenv("GOOGLE_MODEL_NAME", "gemini-2.0-flash-lite")
        print(f"[chat] Using model: {model}")
        llm_response = await router.acompletion(
            model=model,
            messages=llm_messages,
            response_format={"type": "json_object"},
        )
        print(f"[chat] LLM response: {llm_response}")
        llm_usage = llm_response.get("usage", {})
        log_llm_usage(model, chat_request.newMessage, llm_usage)
        try:
            llm_content = llm_response["choices"][0]["message"]["content"]
            parsed_response = json.loads(llm_content)
            message_content = parsed_response.get("message", llm_content)
            topics = parsed_response.get("topics", [])
        except (json.JSONDecodeError, KeyError) as e:
            print(f"[chat] Error parsing LLM JSON response: {e}")
            message_content = llm_response["choices"][0]["message"]["content"]
            topics = []
        response = ChatMessage(content=message_content, role="assistant")
        print(f"[chat] Assistant response: {response}")
        log_conversation(
            {
                "conversation_id": data.get("conversationId", "unknown"),
                "messages": [msg.model_dump() for msg in chat_request.messages],
                "new_message": chat_request.newMessage,
                "response": response.model_dump(),
                "topics": topics,
            }
        )
        print("[chat] Conversation logged")
        return jsonify(response.model_dump()), 200
    except Exception as e:
        print(f"[chat] Error: {str(e)}")
        return jsonify({"error": str(e)}), 400


@api.route("/contact", methods=["POST"])
@log_api_request("contact")
def contact():
    print("[contact] Called")
    try:
        data = request.json
        print(f"[contact] Received data: {data}")
        contact_form = ContactForm(**data)
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        email_address = os.getenv("EMAIL_ADDRESS")
        email_password = os.getenv("EMAIL_PASSWORD")
        smtp_to_email = os.getenv("MY_EMAIL_ADDRESS")
        print(f"[contact] Email config: from={email_address}, to={smtp_to_email}")
        message = MIMEMultipart()
        message["From"] = email_address
        message["To"] = smtp_to_email
        message["Subject"] = f"New Contact Form Submission: {contact_form.subject}"
        email_body = f"""
        You have received a new contact form submission:

        Name: {contact_form.name}
        Email: {contact_form.email}
        Subject: {contact_form.subject}

        Message:
        {contact_form.message}
        """
        message.attach(MIMEText(email_body, "plain"))
        if send_email(smtp_to_email, message["Subject"], message.as_string()):
            print("[contact] Email sent successfully")
            return (
                jsonify(
                    {
                        "success": True,
                        "message": "Contact form submitted successfully and email sent.",
                    }
                ),
                200,
            )
        else:
            print("[contact] Failed to send email")
            return jsonify({"error": "Failed to send the email"}), 500
    except Exception as e:
        print(f"[contact] Error: {str(e)}")
        return jsonify({"error": str(e)}), 400


@api.route("/get-projects", methods=["GET"])
@log_api_request("get_projects")
def get_projects():
    print("[get_projects] Called")
    try:
        projects_path = os.path.join("external_context", "projects.json")
        with open(projects_path, "r", encoding="utf-8") as file:
            projects_data = json.load(file)
        print(f"[get_projects] Loaded projects data: {projects_data}")
        return jsonify(projects_data), 200
    except FileNotFoundError:
        print("[get_projects] Projects file not found")
        return jsonify({"error": "Projects file not found"}), 404
    except json.JSONDecodeError:
        print("[get_projects] Invalid JSON format in projects file")
        return jsonify({"error": "Invalid JSON format in projects file"}), 500
    except Exception as e:
        print(f"[get_projects] Error: {str(e)}")
        return jsonify({"error": str(e)}), 500


@api.route("/get-skills", methods=["GET"])
@log_api_request("get_skills")
def get_skills():
    print("[get_skills] Called")
    try:
        skills_path = os.path.join("external_context", "skills.json")
        with open(skills_path, "r", encoding="utf-8") as file:
            skills_data = json.load(file)
        print(f"[get_skills] Loaded skills data: {skills_data}")
        return jsonify(skills_data), 200
    except FileNotFoundError:
        print("[get_skills] Skills file not found")
        return jsonify({"error": "Skills file not found"}), 404
    except json.JSONDecodeError:
        print("[get_skills] Invalid JSON format in skills file")
        return jsonify({"error": "Invalid JSON format in skills file"}), 500
    except Exception as e:
        print(f"[get_skills] Error: {str(e)}")
        return jsonify({"error": str(e)}), 500


@api.route("/get-about", methods=["GET"])
@log_api_request("get_about")
def get_about():
    print("[get_about] Called")
    try:
        about_path = os.path.join("external_context", "about.json")
        with open(about_path, "r", encoding="utf-8") as file:
            about_data = json.load(file)
        print(f"[get_about] Loaded about data: {about_data}")
        return jsonify(about_data), 200
    except FileNotFoundError:
        print("[get_about] About file not found")
        return jsonify({"error": "About file not found"}), 404
    except json.JSONDecodeError:
        print("[get_about] Invalid JSON format in about file")
        return jsonify({"error": "Invalid JSON format in about file"}), 500
    except Exception as e:
        print(f"[get_about] Error: {str(e)}")
        return jsonify({"error": str(e)}), 500


# Endorsement Endpoints


@api.route("/endorsements/request-otp", methods=["POST"])
@log_api_request("endorsements_request_otp")
def request_otp():
    try:
        # Clean up expired OTPs first
        cleanup_expired_otps()

        data = request.json
        otp_request = OTPRequest(**data)  # Validate with Pydantic

        # Validate action
        if otp_request.action not in ["endorse", "delete"]:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Invalid action. Must be 'endorse' or 'delete'",
                    }
                ),
                400,
            )

        # Validate required fields based on action
        if otp_request.action == "endorse" and not otp_request.skillId:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "skillId is required for endorse action",
                    }
                ),
                400,
            )

        if otp_request.action == "delete" and not otp_request.endorsementId:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "endorsementId is required for delete action",
                    }
                ),
                400,
            )

        # For delete action, verify the endorsement exists and belongs to this email
        if otp_request.action == "delete":
            endorsement = get_endorsement_by_id(otp_request.endorsementId)
            if not endorsement:
                return (
                    jsonify({"success": False, "message": "Endorsement not found"}),
                    404,
                )
            if endorsement["email"].lower() != otp_request.email.lower():
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "You can only delete your own endorsements",
                        }
                    ),
                    403,
                )

        # Generate and store OTP
        otp = generate_otp()
        target_id = (
            otp_request.skillId
            if otp_request.action == "endorse"
            else otp_request.endorsementId
        )
        store_otp(otp_request.email, otp_request.action, otp, target_id)

        # Prepare email content based on action
        if otp_request.action == "endorse":
            skill_name = get_skill_name_by_id(otp_request.skillId)
            subject = "Verify Your Portfolio Endorsement"
            body = f"""Hi there!

Your verification code for endorsing Tomer's {skill_name} skills is: {otp}

This code will expire in 10 minutes.

Thank you for supporting Tomer's professional network!

Best regards,
Tomer's Portfolio"""
        else:  # delete
            subject = "Verify Endorsement Deletion"
            body = f"""Hi there!

Your verification code for deleting your endorsement is: {otp}

This code will expire in 10 minutes.

Best regards,
Tomer's Portfolio"""

        # Send email
        if send_email(otp_request.email, subject, body):
            return (
                jsonify(
                    {"success": True, "message": "Verification code sent to your email"}
                ),
                200,
            )
        else:
            return (
                jsonify(
                    {"success": False, "message": "Failed to send verification email"}
                ),
                500,
            )

    except Exception as e:
        print(f"Error in request_otp: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 400


@api.route("/endorsements", methods=["PUT"])
@log_api_request("endorsements_create")
def create_endorsement_endpoint():
    try:
        data = request.json
        endorsement_request = EndorsementCreate(**data)  # Validate with Pydantic

        # Verify OTP
        if not verify_otp(
            endorsement_request.email,
            "endorse",
            endorsement_request.otp,
            endorsement_request.skillId,
        ):
            return (
                jsonify({"success": False, "message": "Invalid verification code"}),
                400,
            )

        # Verify skill exists
        skill_name = get_skill_name_by_id(endorsement_request.skillId)
        if skill_name == endorsement_request.skillId:  # Skill not found
            return jsonify({"success": False, "message": "Invalid skill ID"}), 400

        # Create endorsement
        endorsement_data = {
            "skillId": endorsement_request.skillId,
            "name": endorsement_request.name.strip(),
            "email": endorsement_request.email.strip(),
            "message": endorsement_request.message.strip(),
        }

        created_endorsement = create_endorsement(endorsement_data)

        # Format response
        response_endorsement = {
            "id": created_endorsement["id"],
            "skillId": created_endorsement["skillId"],
            "name": created_endorsement["name"],
            "email": created_endorsement["email"],
            "message": created_endorsement["message"],
            "timestamp": created_endorsement["timestamp"].isoformat() + "Z",
        }

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Endorsement added successfully",
                    "endorsement": response_endorsement,
                }
            ),
            200,
        )

    except Exception as e:
        print(f"Error in create_endorsement: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 400


@api.route("/endorsements/<endorsement_id>", methods=["DELETE", "OPTIONS"])
@log_api_request("endorsements_delete")
def delete_endorsement_endpoint(endorsement_id):
    print(
        f"[delete_endorsement_endpoint] Called: method={request.method}, path={request.path}, endorsement_id={endorsement_id}"
    )

    # Handle OPTIONS preflight request
    if request.method == "OPTIONS":
        print(f"[delete_endorsement_endpoint] Handling OPTIONS preflight request")
        response = jsonify({})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add(
            "Access-Control-Allow-Headers", "Content-Type,Authorization"
        )
        response.headers.add("Access-Control-Allow-Methods", "DELETE,OPTIONS")
        return response, 200

    if request.method != "DELETE":
        print(
            f"[delete_endorsement_endpoint] Received non-DELETE method: {request.method}"
        )
        return jsonify({"error": "Method not allowed"}), 405

    try:
        data = request.json
        print(f"[delete_endorsement_endpoint] Received data: {data}")
        delete_request = EndorsementDelete(**data)  # Validate with Pydantic

        # Verify the endorsement exists and belongs to this email
        endorsement = get_endorsement_by_id(endorsement_id)
        print(f"[delete_endorsement_endpoint] Fetched endorsement: {endorsement}")
        if not endorsement:
            print(
                f"[delete_endorsement_endpoint] Endorsement not found for id: {endorsement_id}"
            )
            return jsonify({"success": False, "message": "Endorsement not found"}), 404

        if endorsement["email"].lower() != delete_request.email.lower():
            print(
                f"[delete_endorsement_endpoint] Email mismatch: {endorsement['email']} vs {delete_request.email}"
            )
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "You can only delete your own endorsements",
                    }
                ),
                403,
            )

        # Verify OTP
        if not verify_otp(
            delete_request.email, "delete", delete_request.otp, endorsement_id
        ):
            print(
                f"[delete_endorsement_endpoint] Invalid verification code for email: {delete_request.email}"
            )
            return (
                jsonify({"success": False, "message": "Invalid verification code"}),
                400,
            )

        # Delete endorsement
        if delete_endorsement(endorsement_id):
            print(
                f"[delete_endorsement_endpoint] Endorsement deleted successfully: {endorsement_id}"
            )
            return (
                jsonify(
                    {"success": True, "message": "Endorsement deleted successfully"}
                ),
                200,
            )
        else:
            print(
                f"[delete_endorsement_endpoint] Failed to delete endorsement: {endorsement_id}"
            )
            return (
                jsonify({"success": False, "message": "Failed to delete endorsement"}),
                500,
            )

    except Exception as e:
        print(f"Error in delete_endorsement: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 400


@api.route("/endorsements", methods=["GET"])
@log_api_request("endorsements_get")
def get_endorsements():
    print("[get_endorsements] Called")
    try:
        endorsements = get_all_endorsements()
        print(f"[get_endorsements] Returning {len(endorsements)} endorsements")
        return jsonify({"endorsements": endorsements}), 200
    except Exception as e:
        print(f"[get_endorsements] Error: {str(e)}")
        return jsonify({"error": str(e)}), 500


@api.route("/endorsements/skill/<skill_id>", methods=["GET"])
@log_api_request("endorsements_get_by_skill")
def get_endorsements_by_skill_endpoint(skill_id):
    print(f"[get_endorsements_by_skill_endpoint] Called with skill_id={skill_id}")
    try:
        endorsements = get_endorsements_by_skill(skill_id)
        print(
            f"[get_endorsements_by_skill_endpoint] Returning {len(endorsements)} endorsements for skill_id={skill_id}"
        )
        return jsonify({"endorsements": endorsements}), 200
    except Exception as e:
        print(f"[get_endorsements_by_skill_endpoint] Error: {str(e)}")
        return jsonify({"error": str(e)}), 500


@api.route("/export-chat", methods=["POST"])
@log_api_request("export_chat")
def export_chat():
    print("[export_chat] Called")
    try:
        data = request.json
        print(f"[export_chat] Received data: {data}")
        export_request = ExportChatRequest(**data)
        optional_message = (
            f"\nYour message was: '{export_request.message}'\n"
            if export_request.message
            else ""
        )
        message_script = f"""
Hi!

You have requested to export the chat transcript.
{optional_message}
Thank you for checking out my portfolio!

Please see the attached chat transcript.

Best regards,

Tomer Edelsberg
"""
        chat_transcript = ""
        for msg in export_request.chatMessages:
            chat_transcript += f"[{msg.timestamp}] [{'Assistant' if msg.role == 'assistant' else 'You'}] {msg.content}\n\n\n"
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        email_address = os.getenv("EMAIL_ADDRESS")
        email_password = os.getenv("EMAIL_PASSWORD")
        message = MIMEMultipart()
        message["From"] = email_address
        message["To"] = export_request.email
        message["Subject"] = "Exported Chat Transcript"
        message.attach(MIMEText(message_script, "plain"))
        attachment = MIMEText(chat_transcript, "plain")
        attachment.add_header(
            "Content-Disposition", "attachment", filename="chat_transcript.txt"
        )
        message.attach(attachment)
        if send_email(export_request.email, message["Subject"], message.as_string()):
            log_export(
                {
                    "email": export_request.email,
                    "message": export_request.message,
                    "chatMessages": [
                        msg.model_dump() for msg in export_request.chatMessages
                    ],
                }
            )
            print("[export_chat] Chat exported and emailed successfully")
            return (
                jsonify(
                    {
                        "success": True,
                        "message": "Chat exported and emailed successfully.",
                    }
                ),
                200,
            )
        else:
            print("[export_chat] Failed to send the email")
            return jsonify({"error": "Failed to send the email"}), 500
    except Exception as e:
        print(f"[export_chat] Error: {str(e)}")
        return jsonify({"error": str(e)}), 400


def update_prometheus_metrics(metrics_data):
    """Update all Prometheus metrics with data from get_metrics_data"""

    # LLM Usage Basic Metrics
    llm_usage = metrics_data.get("llm_usage", {})
    llm_total_tokens.set(llm_usage.get("total_tokens", 0))
    llm_total_prompt_tokens.set(llm_usage.get("total_prompt_tokens", 0))
    llm_total_completion_tokens.set(llm_usage.get("total_completion_tokens", 0))

    # LLM Usage by Model
    models = llm_usage.get("models", {})
    for model, tokens in models.items():
        llm_tokens_by_model.labels(model=model).set(tokens)

    # Conversation Metrics
    conversations = metrics_data.get("conversations", {})
    conversations_total.set(conversations.get("total", 0))
    conversations_total_messages.set(conversations.get("total_messages", 0))
    conversations_avg_messages.set(
        conversations.get("avg_messages_per_conversation", 0)
    )

    # Topic Analysis Metrics
    topics = metrics_data.get("topics", {})
    topic_frequency = topics.get("frequency", {})
    for topic, count in topic_frequency.items():
        # Sanitize topic name for Prometheus label
        safe_topic = (
            topic.replace(" ", "_").replace("-", "_").lower()[:50]
        )  # Limit length
        conversation_topics_frequency.labels(topic=safe_topic).set(count)
    conversation_topics_total_unique.set(topics.get("total_unique_topics", 0))

    # Endorsement Metrics
    endorsements = metrics_data.get("endorsements", {})
    endorsements_total_active.set(endorsements.get("total_active", 0))
    endorsements_total_deleted.set(endorsements.get("total_deleted", 0))
    endorsements_deletion_rate.set(endorsements.get("deletion_rate", 0))

    # Endorsements by Skill
    by_skill = endorsements.get("by_skill", {})
    for skill_name, count in by_skill.items():
        # Sanitize skill name for Prometheus label
        safe_skill = skill_name.replace(" ", "_").replace("-", "_").lower()[:50]
        endorsements_by_skill.labels(skill_name=safe_skill).set(count)

    # Top Endorsers (limit to top 10 to avoid too many metrics)
    top_endorsers = endorsements.get("top_endorsers", {})
    for email, count in list(top_endorsers.items())[:10]:  # Limit to top 10
        # Hash email for privacy while keeping it identifiable
        import hashlib

        email_hash = hashlib.md5(email.encode()).hexdigest()[:8]
        endorsements_by_endorser.labels(email=f"user_{email_hash}").set(count)

    # API Usage Metrics
    api_usage = metrics_data.get("api_usage", {})
    api_total_calls.set(api_usage.get("total_api_calls", 0))

    # API Calls by Endpoint
    endpoints_total = api_usage.get("endpoints_total", {})
    for endpoint, count in endpoints_total.items():
        safe_endpoint = endpoint.replace("/", "_").replace("-", "_")[:50]
        api_calls_by_endpoint.labels(endpoint=safe_endpoint).set(count)

    # API Calls by Status Code
    status_distribution = api_usage.get("status_code_distribution", {})
    for status_code, count in status_distribution.items():
        api_calls_by_status.labels(status_code=str(status_code)).set(count)

    # OTP Metrics
    otp = metrics_data.get("otp", {})
    otp_total_generated.set(otp.get("total_generated", 0))
    otp_active.set(otp.get("active", 0))
    otp_expired.set(otp.get("expired", 0))

    # OTP by Action Type
    by_action = otp.get("by_action", {})
    for action, count in by_action.items():
        otp_by_action.labels(action=action).set(count)

    # Export and Contact Form Metrics
    exports = metrics_data.get("exports", {})
    exports_total.set(exports.get("total", 0))

    contact_forms = metrics_data.get("contact_forms", {})
    contact_submissions_total.set(contact_forms.get("total_submissions", 0))

    # System Health Metrics
    system_health = metrics_data.get("system_health", {})
    system_database_connection.set(
        1 if system_health.get("database_connection", False) else 0
    )
    system_collections_count.set(system_health.get("collections_count", 0))
    system_total_documents.set(system_health.get("total_documents", 0))


@app.route("/metrics", methods=["GET"])
@log_api_request("metrics")
def metrics():
    # Update metrics before exposing
    metrics_data = get_metrics_data()
    update_prometheus_metrics(metrics_data)
    return generate_latest(), 200, {"Content-Type": CONTENT_TYPE_LATEST}


@api.route("/healthz", methods=["GET"])
def healthz():
    """Liveness probe endpoint for Kubernetes."""
    return "OK", 200


@api.route("/readyz", methods=["GET"])
def readyz():
    """Readiness probe endpoint for Kubernetes. Checks MongoDB connection."""
    try:
        from mongo import client

        client.admin.command("ping")
        return "READY", 200
    except Exception as e:
        print(f"[readyz] MongoDB not ready: {e}")
        return "NOT READY", 500


# Register the API blueprint
app.register_blueprint(api)

try:
    print("[app.py] Successfully connected to MongoDB.")
except SystemExit as e:
    print(f"[app.py] {e}")
    raise
except Exception as e:
    print(f"[app.py] Unexpected error importing mongo.py: {e}")
    raise

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
