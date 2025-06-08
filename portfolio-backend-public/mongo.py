from pymongo import MongoClient, UpdateOne
import os
import json
from dotenv import load_dotenv
from datetime import datetime, timedelta
import secrets
import string
from bson import ObjectId
import sys
from unittest.mock import MagicMock


# Load environment variables explicitly
load_dotenv()

# MongoDB Configuration
MONGO_URI = os.getenv("MONGO_URI")
MODEL = os.getenv("GOOGLE_MODEL_NAME")

print(f"MongoDB URI: {MONGO_URI}")  # Debugging Line
print(f"Model: {MODEL}")  # Debugging Line

# Detect if running under pytest
RUNNING_TESTS = "pytest" in sys.modules

if not MONGO_URI and not RUNNING_TESTS:
    raise ValueError("MongoDB URI is not set. Please check your .env file.")

if not RUNNING_TESTS:
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        client.admin.command("ping")
        db = client.mydatabase  # The main database
        # Collections
        conversations_collection = db.conversations  # For chat messages
        exports_collection = db.exports  # For exported chats
        llm_usage_collection = db.llm_usage  # For LLM usage logging
        endorsements_collection = db.endorsements  # For endorsements
        otp_collection = db.otp_codes  # For OTP verification
        api_calls_collection = db.api_calls  # For API call tracking
    except Exception as e:
        print(f"[mongo.py] Failed to connect to MongoDB: {e}")
        raise SystemExit(f"Failed to connect to MongoDB: {e}")
else:
    client = None
    db = None
    conversations_collection = MagicMock()
    exports_collection = MagicMock()
    llm_usage_collection = MagicMock()
    endorsements_collection = MagicMock()
    otp_collection = MagicMock()
    api_calls_collection = MagicMock()
    print("[mongo.py] Using MagicMock for all MongoDB collections in test mode.")


def get_skill_name_by_id(skill_id):
    print(f"[get_skill_name_by_id] Called with skill_id={skill_id}")
    try:
        skills_path = os.path.join("external_context", "skills.json")
        with open(skills_path, "r", encoding="utf-8") as file:
            skills_data = json.load(file)
        for category in skills_data["skillCategories"]:
            for skill in category["skills"]:
                if skill["id"] == skill_id:
                    print(f"[get_skill_name_by_id] Found skill name: {skill['name']}")
                    return skill["name"]
        print(f"[get_skill_name_by_id] Skill name not found, returning skill_id")
        return skill_id  # Return ID if name not found
    except Exception as e:
        print(f"[get_skill_name_by_id] Exception: {e}")
        return skill_id


def generate_otp():
    print("[generate_otp] Called")
    otp = "".join(secrets.choice(string.digits) for _ in range(6))
    print(f"[generate_otp] Generated OTP: {otp}")
    return otp


def store_otp(email, action, otp, target_id=None):
    print(
        f"[store_otp] Called with email={email}, action={action}, otp={otp}, target_id={target_id}"
    )
    expiry_time = datetime.utcnow() + timedelta(minutes=10)
    try:
        otp_collection.update_many(
            {
                "email": email.lower(),
                "action": action,
                "target_id": target_id,
                "deleted": {"$ne": True},
            },
            {"$set": {"deleted": True, "deleted_at": datetime.utcnow()}},
        )
        otp_data = {
            "email": email.lower(),
            "action": action,
            "otp": otp,
            "expiry": expiry_time,
            "target_id": target_id,
            "created_at": datetime.utcnow(),
            "deleted": False,
        }
        otp_collection.insert_one(otp_data)
        print(f"[store_otp] OTP stored for {email} with action {action}")
    except Exception as e:
        print(f"[store_otp] Exception: {e}")


def verify_otp(email, action, otp, target_id=None):
    print(
        f"[verify_otp] Called with email={email}, action={action}, otp={otp}, target_id={target_id}"
    )
    current_time = datetime.utcnow()
    try:
        query = {
            "email": email.lower(),
            "action": action,
            "otp": otp,
            "target_id": target_id,
            "expiry": {"$gt": current_time},
            "deleted": {"$ne": True},
        }
        print(f"[verify_otp] Query: {query}")
        otp_doc = otp_collection.find_one(query)
        print(f"[verify_otp] otp_doc found: {otp_doc}")
        if otp_doc:
            update_result = otp_collection.update_one(
                {"_id": otp_doc["_id"]},
                {"$set": {"deleted": True, "deleted_at": datetime.utcnow()}},
            )
            print(
                f"[verify_otp] OTP verified and marked as deleted for {email}, update_result: {update_result.raw_result}"
            )
            return True
        print(
            f"[verify_otp] OTP verification failed for {email}, no matching document found."
        )
        return False
    except Exception as e:
        print(f"[verify_otp] Exception: {e}")
    print(f"[verify_otp] Returning False due to exception or failure.")
    return False


def cleanup_expired_otps():
    print("[cleanup_expired_otps] Called")
    current_time = datetime.utcnow()
    try:
        result = otp_collection.update_many(
            {"expiry": {"$lt": current_time}, "deleted": {"$ne": True}},
            {"$set": {"deleted": True, "deleted_at": datetime.utcnow()}},
        )
        print(
            f"[cleanup_expired_otps] Marked {result.modified_count} expired OTPs as deleted"
        )
    except Exception as e:
        print(f"[cleanup_expired_otps] Exception: {e}")


def create_endorsement(endorsement_data):
    print(f"[create_endorsement] Called with endorsement_data={endorsement_data}")
    try:
        endorsement_data["timestamp"] = datetime.utcnow()
        endorsement_data["email"] = endorsement_data["email"].lower()
        endorsement_data["deleted"] = False
        result = endorsements_collection.insert_one(endorsement_data)
        endorsement_data["id"] = str(result.inserted_id)
        endorsement_data["_id"] = result.inserted_id
        print(f"[create_endorsement] Endorsement created with ID: {result.inserted_id}")
        return endorsement_data
    except Exception as e:
        print(f"[create_endorsement] Exception: {e}")
        return None


def get_all_endorsements():
    print("[get_all_endorsements] Called")
    try:
        endorsements = list(endorsements_collection.find({"deleted": {"$ne": True}}))
        for endorsement in endorsements:
            endorsement["id"] = str(endorsement["_id"])
            del endorsement["_id"]
            endorsement.pop("deleted", None)
            if isinstance(endorsement["timestamp"], datetime):
                endorsement["timestamp"] = endorsement["timestamp"].isoformat() + "Z"
            print(f"[get_all_endorsements] Returning {len(endorsements)} endorsements")
        return endorsements
    except Exception as e:
        print(f"[get_all_endorsements] Exception: {e}")
        return []


def get_endorsements_by_skill(skill_id):
    print(f"[get_endorsements_by_skill] Called with skill_id={skill_id}")
    try:
        endorsements = list(
            endorsements_collection.find(
                {"skillId": skill_id, "deleted": {"$ne": True}}
            )
        )
        for endorsement in endorsements:
            endorsement["id"] = str(endorsement["_id"])
            del endorsement["_id"]
            endorsement.pop("deleted", None)
            if isinstance(endorsement["timestamp"], datetime):
                endorsement["timestamp"] = endorsement["timestamp"].isoformat() + "Z"
            print(
                f"[get_endorsements_by_skill] Returning {len(endorsements)} endorsements for skill_id={skill_id}"
            )
        return endorsements
    except Exception as e:
        print(f"[get_endorsements_by_skill] Exception: {e}")
        return []


def delete_endorsement(endorsement_id):
    print(f"[delete_endorsement] Called with endorsement_id={endorsement_id}")
    try:
        result = endorsements_collection.update_one(
            {"_id": ObjectId(endorsement_id), "deleted": {"$ne": True}},
            {"$set": {"deleted": True, "deleted_at": datetime.utcnow()}},
        )
        if result.modified_count > 0:
            print(
                f"[delete_endorsement] Endorsement {endorsement_id} marked as deleted successfully"
            )
            return True
        else:
            print(
                f"[delete_endorsement] Endorsement {endorsement_id} not found or already deleted"
            )
            return False
    except Exception as e:
        print(
            f"[delete_endorsement] Error marking endorsement {endorsement_id} as deleted: {str(e)}"
        )
        return False


def get_endorsement_by_id(endorsement_id):
    print(f"[get_endorsement_by_id] Called with endorsement_id={endorsement_id}")
    try:
        endorsement = endorsements_collection.find_one(
            {"_id": ObjectId(endorsement_id), "deleted": {"$ne": True}}
        )
        if endorsement:
            endorsement["id"] = str(endorsement["_id"])
            del endorsement["_id"]
            endorsement.pop("deleted", None)
            print(f"[get_endorsement_by_id] Found endorsement: {endorsement}")
            return endorsement
        print(f"[get_endorsement_by_id] Endorsement not found")
        return None
    except Exception as e:
        print(f"[get_endorsement_by_id] Error: {str(e)}")
        return None


def log_llm_usage(model_name, message, usage):
    print(
        f"[log_llm_usage] Called with model_name={model_name}, message={message}, usage={usage}"
    )
    try:
        usage_entry = {
            "message": message,
            "prompt_tokens": usage.get("prompt_tokens", 0),
            "completion_tokens": usage.get("completion_tokens", 0),
            "total_tokens": usage.get("total_tokens", 0),
            "timestamp": datetime.utcnow(),
        }
        llm_usage_collection.update_one(
            {"model_name": model_name},
            {
                "$setOnInsert": {
                    "model_name": model_name,
                    "total_prompt_tokens": 0,
                    "total_completion_tokens": 0,
                    "total_tokens": 0,
                    "logs": [],
                }
            },
            upsert=True,
        )
        result = llm_usage_collection.update_one(
            {"model_name": model_name},
            {
                "$push": {"logs": usage_entry},
                "$inc": {
                    "total_prompt_tokens": usage_entry["prompt_tokens"],
                    "total_completion_tokens": usage_entry["completion_tokens"],
                    "total_tokens": usage_entry["total_tokens"],
                },
            },
        )
        print(
            f"[log_llm_usage] LLM Usage logged. Model: {model_name}, Prompt Tokens: {usage_entry['prompt_tokens']}, Completion Tokens: {usage_entry['completion_tokens']}, Total Tokens: {usage_entry['total_tokens']}, Matched: {result.matched_count}, Modified: {result.modified_count}"
        )
    except Exception as e:
        print(f"[log_llm_usage] Exception: {e}")


def log_conversation(conversation_data):
    print(f"[log_conversation] Called with conversation_data={conversation_data}")
    try:
        conversation_id = conversation_data.get("conversation_id")
        existing_messages = conversation_data.get("messages", [])
        new_message = conversation_data.get("new_message")
        response = conversation_data.get("response")
        topics = conversation_data.get("topics", [])
        messages_to_add = []
        if new_message:
            messages_to_add.append({"content": new_message, "role": "user"})
        if response:
            messages_to_add.append(
                response.model_dump() if hasattr(response, "model_dump") else response
            )
        existing_conversation = conversations_collection.find_one(
            {"conversation_id": conversation_id}
        )
        if existing_conversation:
            result = conversations_collection.update_one(
                {"conversation_id": conversation_id},
                {
                    "$push": {"messages": {"$each": messages_to_add}},
                    "$set": {"topics": topics, "updated_at": datetime.utcnow()},
                },
            )
            print(f"[log_conversation] Updated existing conversation {conversation_id}")
        else:
            all_messages = [
                msg.model_dump() if hasattr(msg, "model_dump") else msg
                for msg in existing_messages
            ]
            all_messages.extend(messages_to_add)
            result = conversations_collection.insert_one(
                {
                    "conversation_id": conversation_id,
                    "messages": all_messages,
                    "topics": topics,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                }
            )
            print(f"[log_conversation] Created new conversation {conversation_id}")
        print(
            f"[log_conversation] Conversation logged. Conversation ID: {conversation_id}, New messages added: {len(messages_to_add)}"
        )
    except Exception as e:
        print(f"[log_conversation] Exception: {e}")


def log_export(export_data):
    print(f"[log_export] Called with export_data={export_data}")
    try:
        exports_collection.insert_one(export_data)
        print(f"[log_export] Export logged successfully")
    except Exception as e:
        print(f"[log_export] Exception: {e}")


def log_api_call(
    endpoint, method="GET", status_code=200, user_agent=None, ip_address=None
):
    print(
        f"[log_api_call] Called with endpoint={endpoint}, method={method}, status_code={status_code}, user_agent={user_agent}, ip_address={ip_address}"
    )
    try:
        api_call_data = {
            "endpoint": endpoint,
            "method": method,
            "status_code": status_code,
            "timestamp": datetime.utcnow(),
            "user_agent": user_agent,
            "ip_address": ip_address,
        }
        api_calls_collection.insert_one(api_call_data)
        print(f"[log_api_call] API call logged successfully")
    except Exception as e:
        print(f"[log_api_call] Error logging API call: {str(e)}")


def get_metrics_data():
    print("[get_metrics_data] Called")
    try:
        current_time = datetime.utcnow()
        one_hour_ago = current_time - timedelta(hours=1)
        one_day_ago = current_time - timedelta(days=1)
        one_week_ago = current_time - timedelta(weeks=1)
        one_month_ago = current_time - timedelta(days=30)

        # LLM Usage Metrics
        llm_usage_stats = list(llm_usage_collection.find())
        total_tokens = sum(doc.get("total_tokens", 0) for doc in llm_usage_stats)
        total_prompt_tokens = sum(
            doc.get("total_prompt_tokens", 0) for doc in llm_usage_stats
        )
        total_completion_tokens = sum(
            doc.get("total_completion_tokens", 0) for doc in llm_usage_stats
        )

        # Time-based LLM usage metrics
        tokens_last_hour = {"prompt": 0, "completion": 0, "total": 0}
        tokens_last_day = {"prompt": 0, "completion": 0, "total": 0}
        tokens_last_week = {"prompt": 0, "completion": 0, "total": 0}
        tokens_last_month = {"prompt": 0, "completion": 0, "total": 0}
        requests_last_hour = 0
        requests_last_day = 0
        requests_last_week = 0
        requests_last_month = 0

        # Token usage by model and time
        model_usage_by_time = {}

        for doc in llm_usage_stats:
            model_name = doc.get("model_name", "unknown")
            model_usage_by_time[model_name] = {
                "last_hour": {"prompt": 0, "completion": 0, "total": 0, "requests": 0},
                "last_day": {"prompt": 0, "completion": 0, "total": 0, "requests": 0},
                "last_week": {"prompt": 0, "completion": 0, "total": 0, "requests": 0},
                "last_month": {"prompt": 0, "completion": 0, "total": 0, "requests": 0},
            }

            for log in doc.get("logs", []):
                if "timestamp" in log:
                    log_time = log["timestamp"]
                    prompt_tokens = log.get("prompt_tokens", 0)
                    completion_tokens = log.get("completion_tokens", 0)
                    total_tokens = log.get("total_tokens", 0)

                    if log_time >= one_hour_ago:
                        tokens_last_hour["prompt"] += prompt_tokens
                        tokens_last_hour["completion"] += completion_tokens
                        tokens_last_hour["total"] += total_tokens
                        requests_last_hour += 1
                        model_usage_by_time[model_name]["last_hour"][
                            "prompt"
                        ] += prompt_tokens
                        model_usage_by_time[model_name]["last_hour"][
                            "completion"
                        ] += completion_tokens
                        model_usage_by_time[model_name]["last_hour"][
                            "total"
                        ] += total_tokens
                        model_usage_by_time[model_name]["last_hour"]["requests"] += 1

                    if log_time >= one_day_ago:
                        tokens_last_day["prompt"] += prompt_tokens
                        tokens_last_day["completion"] += completion_tokens
                        tokens_last_day["total"] += total_tokens
                        requests_last_day += 1
                        model_usage_by_time[model_name]["last_day"][
                            "prompt"
                        ] += prompt_tokens
                        model_usage_by_time[model_name]["last_day"][
                            "completion"
                        ] += completion_tokens
                        model_usage_by_time[model_name]["last_day"][
                            "total"
                        ] += total_tokens
                        model_usage_by_time[model_name]["last_day"]["requests"] += 1

                    if log_time >= one_week_ago:
                        tokens_last_week["prompt"] += prompt_tokens
                        tokens_last_week["completion"] += completion_tokens
                        tokens_last_week["total"] += total_tokens
                        requests_last_week += 1
                        model_usage_by_time[model_name]["last_week"][
                            "prompt"
                        ] += prompt_tokens
                        model_usage_by_time[model_name]["last_week"][
                            "completion"
                        ] += completion_tokens
                        model_usage_by_time[model_name]["last_week"][
                            "total"
                        ] += total_tokens
                        model_usage_by_time[model_name]["last_week"]["requests"] += 1

                    if log_time >= one_month_ago:
                        tokens_last_month["prompt"] += prompt_tokens
                        tokens_last_month["completion"] += completion_tokens
                        tokens_last_month["total"] += total_tokens
                        requests_last_month += 1
                        model_usage_by_time[model_name]["last_month"][
                            "prompt"
                        ] += prompt_tokens
                        model_usage_by_time[model_name]["last_month"][
                            "completion"
                        ] += completion_tokens
                        model_usage_by_time[model_name]["last_month"][
                            "total"
                        ] += total_tokens
                        model_usage_by_time[model_name]["last_month"]["requests"] += 1

        # Conversation Metrics
        total_conversations = conversations_collection.count_documents({})
        conversations_last_hour = conversations_collection.count_documents(
            {"updated_at": {"$gte": one_hour_ago}}
        )
        conversations_last_day = conversations_collection.count_documents(
            {"updated_at": {"$gte": one_day_ago}}
        )
        conversations_last_week = conversations_collection.count_documents(
            {"updated_at": {"$gte": one_week_ago}}
        )
        conversations_last_month = conversations_collection.count_documents(
            {"updated_at": {"$gte": one_month_ago}}
        )

        # Message count in conversations
        total_messages = 0
        conversation_docs = conversations_collection.find({}, {"messages": 1})
        for doc in conversation_docs:
            total_messages += len(doc.get("messages", []))

        # Export Metrics
        total_exports = exports_collection.count_documents({})
        exports_last_day = (
            exports_collection.count_documents({"timestamp": {"$gte": one_day_ago}})
            if exports_collection.find_one({})
            and "timestamp" in exports_collection.find_one({})
            else 0
        )

        # OTP Metrics
        total_otps_generated = otp_collection.count_documents({})
        active_otps = otp_collection.count_documents(
            {"expiry": {"$gt": current_time}, "deleted": {"$ne": True}}
        )
        expired_otps = otp_collection.count_documents({"expiry": {"$lt": current_time}})
        otps_last_hour = otp_collection.count_documents(
            {"created_at": {"$gte": one_hour_ago}}
        )
        otps_last_day = otp_collection.count_documents(
            {"created_at": {"$gte": one_day_ago}}
        )

        # OTP by action type
        otp_endorse_count = otp_collection.count_documents({"action": "endorse"})
        otp_delete_count = otp_collection.count_documents({"action": "delete"})

        # Endorsement Metrics
        total_endorsements = endorsements_collection.count_documents(
            {"deleted": {"$ne": True}}
        )
        deleted_endorsements = endorsements_collection.count_documents(
            {"deleted": True}
        )
        endorsements_last_day = endorsements_collection.count_documents(
            {"timestamp": {"$gte": one_day_ago}, "deleted": {"$ne": True}}
        )
        endorsements_last_week = endorsements_collection.count_documents(
            {"timestamp": {"$gte": one_week_ago}, "deleted": {"$ne": True}}
        )

        # Endorsements per skill
        endorsements_by_skill = {}
        skill_pipeline = [
            {"$match": {"deleted": {"$ne": True}}},
            {"$group": {"_id": "$skillId", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        skill_results = list(endorsements_collection.aggregate(skill_pipeline))
        for result in skill_results:
            skill_name = get_skill_name_by_id(result["_id"])
            endorsements_by_skill[skill_name] = result["count"]

        # Top endorsers (by email)
        top_endorsers = {}
        endorser_pipeline = [
            {"$match": {"deleted": {"$ne": True}}},
            {"$group": {"_id": "$email", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10},
        ]
        endorser_results = list(endorsements_collection.aggregate(endorser_pipeline))
        for result in endorser_results:
            top_endorsers[result["_id"]] = result["count"]

        # Topic analysis from conversations
        topic_frequency = {}
        topic_pipeline = [
            {"$match": {"topics": {"$exists": True, "$ne": []}}},
            {"$unwind": "$topics"},
            {"$group": {"_id": "$topics", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 20},
        ]
        topic_results = list(conversations_collection.aggregate(topic_pipeline))
        for result in topic_results:
            topic_frequency[result["_id"]] = result["count"]

        # API endpoint usage - ACCURATE DATA ONLY
        api_endpoints_total = {}
        api_endpoints_last_hour = {}
        api_endpoints_last_day = {}

        # Get API call statistics
        api_pipeline_total = [
            {"$group": {"_id": "$endpoint", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        api_total_results = list(api_calls_collection.aggregate(api_pipeline_total))
        for result in api_total_results:
            api_endpoints_total[result["_id"]] = result["count"]

        # Last hour API calls
        api_pipeline_hour = [
            {"$match": {"timestamp": {"$gte": one_hour_ago}}},
            {"$group": {"_id": "$endpoint", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        api_hour_results = list(api_calls_collection.aggregate(api_pipeline_hour))
        for result in api_hour_results:
            api_endpoints_last_hour[result["_id"]] = result["count"]

        # Last day API calls
        api_pipeline_day = [
            {"$match": {"timestamp": {"$gte": one_day_ago}}},
            {"$group": {"_id": "$endpoint", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        api_day_results = list(api_calls_collection.aggregate(api_pipeline_day))
        for result in api_day_results:
            api_endpoints_last_day[result["_id"]] = result["count"]

        # API status code distribution
        status_code_pipeline = [
            {"$group": {"_id": "$status_code", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        status_code_results = list(api_calls_collection.aggregate(status_code_pipeline))
        status_code_distribution = {}
        for result in status_code_results:
            status_code_distribution[result["_id"]] = result["count"]

        # Contact form submissions (accurate count from exports)
        contact_submissions = exports_collection.count_documents({})
        contact_submissions_last_day = (
            exports_collection.count_documents({"timestamp": {"$gte": one_day_ago}})
            if exports_collection.find_one({})
            else 0
        )

        # Hourly token usage trends (last 24 hours)
        hourly_usage = []
        for i in range(24):
            hour_start = current_time - timedelta(hours=i + 1)
            hour_end = current_time - timedelta(hours=i)

            hour_tokens = {"prompt": 0, "completion": 0, "total": 0, "requests": 0}

            for doc in llm_usage_stats:
                for log in doc.get("logs", []):
                    if "timestamp" in log:
                        log_time = log["timestamp"]
                        if hour_start <= log_time < hour_end:
                            hour_tokens["prompt"] += log.get("prompt_tokens", 0)
                            hour_tokens["completion"] += log.get("completion_tokens", 0)
                            hour_tokens["total"] += log.get("total_tokens", 0)
                            hour_tokens["requests"] += 1

            hourly_usage.append(
                {"hour": hour_start.isoformat() + "Z", "usage": hour_tokens}
            )

        # Reverse to get chronological order (oldest to newest)
        hourly_usage.reverse()

        # System health metrics
        health_metrics = {
            "database_connection": True,  # If we got this far, DB is connected
            "collections_count": len(db.list_collection_names()),
            "total_documents": (
                total_conversations
                + total_exports
                + total_otps_generated
                + total_endorsements
                + deleted_endorsements
                + len(llm_usage_stats)
            ),
        }

        # Compile all metrics
        metrics = {
            "timestamp": current_time.isoformat() + "Z",
            "llm_usage": {
                "total_tokens": total_tokens,
                "total_prompt_tokens": total_prompt_tokens,
                "total_completion_tokens": total_completion_tokens,
                "tokens_by_time": {
                    "last_hour": tokens_last_hour,
                    "last_day": tokens_last_day,
                    "last_week": tokens_last_week,
                    "last_month": tokens_last_month,
                },
                "requests_by_time": {
                    "last_hour": requests_last_hour,
                    "last_day": requests_last_day,
                    "last_week": requests_last_week,
                    "last_month": requests_last_month,
                },
                "models": {
                    doc["model_name"]: doc.get("total_tokens", 0)
                    for doc in llm_usage_stats
                },
                "model_usage_by_time": model_usage_by_time,
                "hourly_trends": hourly_usage,
            },
            "conversations": {
                "total": total_conversations,
                "last_hour": conversations_last_hour,
                "last_day": conversations_last_day,
                "last_week": conversations_last_week,
                "last_month": conversations_last_month,
                "total_messages": total_messages,
                "avg_messages_per_conversation": round(
                    total_messages / max(total_conversations, 1), 2
                ),
            },
            "exports": {"total": total_exports, "last_day": exports_last_day},
            "otp": {
                "total_generated": total_otps_generated,
                "active": active_otps,
                "expired": expired_otps,
                "last_hour": otps_last_hour,
                "last_day": otps_last_day,
                "by_action": {"endorse": otp_endorse_count, "delete": otp_delete_count},
            },
            "endorsements": {
                "total_active": total_endorsements,
                "total_deleted": deleted_endorsements,
                "last_day": endorsements_last_day,
                "last_week": endorsements_last_week,
                "by_skill": endorsements_by_skill,
                "top_endorsers": top_endorsers,
                "deletion_rate": round(
                    (
                        deleted_endorsements
                        / max(total_endorsements + deleted_endorsements, 1)
                    )
                    * 100,
                    2,
                ),
            },
            "topics": {
                "frequency": topic_frequency,
                "total_unique_topics": len(topic_frequency),
            },
            "api_usage": {
                "endpoints_total": api_endpoints_total,
                "endpoints_last_hour": api_endpoints_last_hour,
                "endpoints_last_day": api_endpoints_last_day,
                "total_api_calls": sum(api_endpoints_total.values()),
                "total_api_calls_last_hour": sum(api_endpoints_last_hour.values()),
                "total_api_calls_last_day": sum(api_endpoints_last_day.values()),
                "status_code_distribution": status_code_distribution,
            },
            "contact_forms": {
                "total_submissions": contact_submissions,
                "submissions_last_day": contact_submissions_last_day,
            },
            "system_health": health_metrics,
        }
        print("[get_metrics_data] Metrics data generated successfully")
        return metrics
    except Exception as e:
        print(f"[get_metrics_data] Error: {str(e)}")
        return {"error": str(e), "timestamp": datetime.utcnow().isoformat() + "Z"}
