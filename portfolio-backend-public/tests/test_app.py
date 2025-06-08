import pytest
from unittest.mock import patch, MagicMock, AsyncMock, mock_open
from app import app, send_email, get_skill_name_by_id
import json
from datetime import datetime
from models import ChatRequest, ContactForm, ExportChatRequest, OTPRequest


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


@pytest.fixture
def mock_smtp():
    with patch("smtplib.SMTP") as mock:
        mock_smtp_instance = MagicMock()
        mock.return_value.__enter__.return_value = mock_smtp_instance
        yield mock_smtp_instance


@pytest.fixture
def mock_llm():
    with patch("app.router") as mock:
        mock.acompletion = AsyncMock(
            return_value={
                "choices": [{"message": {"content": "Test response"}}],
                "usage": {"total_tokens": 10},
            }
        )
        yield mock


@pytest.fixture
def mock_mongo():
    """Mock all MongoDB functions to prevent database connections during tests"""
    with patch("app.log_conversation") as mock_log_conversation, patch(
        "app.log_export"
    ) as mock_log_export, patch("app.log_llm_usage") as mock_log_llm_usage, patch(
        "app.log_api_call"
    ) as mock_log_api_call:
        yield {
            "log_conversation": mock_log_conversation,
            "log_export": mock_log_export,
            "log_llm_usage": mock_log_llm_usage,
            "log_api_call": mock_log_api_call,
        }


# REAL UNIT TESTS - Testing actual business logic
class TestDataValidation:
    """Test Pydantic model validation - real business logic"""

    def test_chat_request_validation_valid(self):
        """Test that valid chat request data passes validation"""
        data = {
            "messages": [
                {
                    "content": "Hello",
                    "role": "user",
                    "timestamp": datetime.now().isoformat(),
                }
            ],
            "newMessage": "How are you?",
            "conversationId": "test-123",
        }

        # This actually tests the Pydantic validation logic
        chat_request = ChatRequest(**data)
        assert chat_request.newMessage == "How are you?"
        assert len(chat_request.messages) == 1
        assert chat_request.conversationId == "test-123"

    def test_chat_request_validation_invalid(self):
        """Test that invalid chat request data fails validation"""
        data = {
            "messages": "invalid",  # Should be a list
            "newMessage": "",  # Empty message
        }

        with pytest.raises(Exception):  # Pydantic validation error
            ChatRequest(**data)

    def test_contact_form_validation_valid(self):
        """Test that valid contact form data passes validation"""
        data = {
            "name": "John Doe",
            "email": "john@example.com",
            "subject": "Test Subject",
            "message": "Test message content",
        }

        contact_form = ContactForm(**data)
        assert contact_form.name == "John Doe"
        assert contact_form.email == "john@example.com"

    def test_contact_form_validation_invalid_email(self):
        """Test that invalid email fails validation"""
        data = {
            "name": "John Doe",
            "email": "invalid-email",  # Invalid email format
            "subject": "Test Subject",
            "message": "Test message",
        }

        with pytest.raises(Exception):  # Pydantic email validation error
            ContactForm(**data)

    def test_otp_request_validation_endorse(self):
        """Test OTP request validation for endorse action"""
        data = {
            "email": "test@example.com",
            "action": "endorse",
            "skillId": "skill-123",
        }

        otp_request = OTPRequest(**data)
        assert otp_request.action == "endorse"
        assert otp_request.skillId == "skill-123"
        assert otp_request.endorsementId is None

    def test_otp_request_validation_delete(self):
        """Test OTP request validation for delete action"""
        data = {
            "email": "test@example.com",
            "action": "delete",
            "endorsementId": "endorsement-456",
        }

        otp_request = OTPRequest(**data)
        assert otp_request.action == "delete"
        assert otp_request.endorsementId == "endorsement-456"
        assert otp_request.skillId is None


class TestBusinessLogic:
    """Test actual business logic functions"""

    def test_get_skill_name_by_id_found(self):
        """Test skill name lookup when skill exists"""
        mock_skills_data = {
            "skillCategories": [
                {
                    "skills": [
                        {"id": "python", "name": "Python Programming"},
                        {"id": "javascript", "name": "JavaScript"},
                    ]
                }
            ]
        }

        with patch("builtins.open", mock_open(read_data=json.dumps(mock_skills_data))):
            result = get_skill_name_by_id("python")
            assert result == "Python Programming"

    def test_get_skill_name_by_id_not_found(self):
        """Test skill name lookup when skill doesn't exist"""
        mock_skills_data = {
            "skillCategories": [
                {"skills": [{"id": "python", "name": "Python Programming"}]}
            ]
        }

        with patch("builtins.open", mock_open(read_data=json.dumps(mock_skills_data))):
            result = get_skill_name_by_id("nonexistent")
            assert result == "nonexistent"  # Returns ID when not found

    def test_get_skill_name_by_id_file_error(self):
        """Test skill name lookup when file can't be read"""
        with patch("builtins.open", side_effect=FileNotFoundError()):
            result = get_skill_name_by_id("python")
            assert result == "python"  # Returns ID on error


class TestEmailFunctionality:
    """Test email sending logic"""

    def test_send_email_success(self):
        """Test successful email sending"""
        with patch("smtplib.SMTP") as mock_smtp_class:
            mock_server = MagicMock()
            mock_smtp_class.return_value.__enter__.return_value = mock_server

            with patch.dict(
                "os.environ",
                {"EMAIL_ADDRESS": "test@example.com", "EMAIL_PASSWORD": "password"},
            ):
                result = send_email(
                    "recipient@example.com", "Test Subject", "Test Body"
                )

                assert result is True
                mock_server.starttls.assert_called_once()
                mock_server.login.assert_called_once_with(
                    "test@example.com", "password"
                )
                mock_server.sendmail.assert_called_once()

    def test_send_email_failure(self):
        """Test email sending failure"""
        with patch("smtplib.SMTP") as mock_smtp_class:
            mock_smtp_class.side_effect = Exception("SMTP Error")

            result = send_email("recipient@example.com", "Test Subject", "Test Body")
            assert result is False


# INTEGRATION TESTS - Testing Flask endpoints with minimal mocking
def test_chat_endpoint(client, mock_llm, mock_mongo):
    data = {
        "messages": [
            {
                "content": "Hello",
                "role": "user",
                "timestamp": datetime.now().isoformat(),
            },
        ],
        "newMessage": "How are you?",
        "conversationId": "test-123",
    }

    response = client.post("/api/chat", json=data)

    assert response.status_code == 200
    response_data = json.loads(response.data)
    assert response_data["content"] == "Test response"
    assert response_data["role"] == "assistant"

    # Verify MongoDB functions were called
    mock_mongo["log_conversation"].assert_called_once()
    mock_mongo["log_llm_usage"].assert_called_once()
    mock_mongo["log_api_call"].assert_called_once()


def test_contact_endpoint(client, mock_smtp, mock_mongo):
    data = {
        "name": "Test User",
        "email": "test@example.com",
        "subject": "Test Subject",
        "message": "Test Message",
    }

    response = client.post("/api/contact", json=data)

    assert response.status_code == 200
    response_data = json.loads(response.data)
    assert response_data["success"] is True
    mock_smtp.sendmail.assert_called_once()

    # Verify MongoDB API logging was called
    mock_mongo["log_api_call"].assert_called_once()


def test_export_chat_endpoint(client, mock_smtp, mock_mongo):
    data = {
        "email": "test@example.com",
        "message": "Please export",
        "chatMessages": [
            {
                "content": "Hello",
                "role": "user",
                "timestamp": datetime.now().isoformat(),
            },
            {
                "content": "Hi there!",
                "role": "assistant",
                "timestamp": datetime.now().isoformat(),
            },
        ],
        "conversationId": "test-123",
    }

    response = client.post("/api/export-chat", json=data)

    assert response.status_code == 200
    response_data = json.loads(response.data)
    assert response_data["success"] is True
    mock_smtp.sendmail.assert_called_once()

    # Verify MongoDB functions were called
    mock_mongo["log_export"].assert_called_once()
    mock_mongo["log_api_call"].assert_called_once()


def test_chat_endpoint_error(client, mock_mongo):
    with patch("app.router.acompletion", new_callable=AsyncMock) as mock_acompletion:
        mock_acompletion.side_effect = Exception("Test error")
        data = {
            "messages": [
                {
                    "content": "Hello",
                    "role": "user",
                    "timestamp": datetime.now().isoformat(),
                },
            ],
            "newMessage": "How are you?",
            "conversationId": "test-123",
        }

        response = client.post("/api/chat", json=data)

        assert response.status_code == 400
        response_data = json.loads(response.data)
        assert "error" in response_data

        # Verify API call was still logged even on error
        mock_mongo["log_api_call"].assert_called_once()


def test_contact_endpoint_smtp_error(client, mock_smtp, mock_mongo):
    mock_smtp.sendmail.side_effect = Exception("SMTP error")

    data = {
        "name": "Test User",
        "email": "test@example.com",
        "subject": "Test Subject",
        "message": "Test Message",
    }

    response = client.post("/api/contact", json=data)

    assert response.status_code == 500
    response_data = json.loads(response.data)
    assert "error" in response_data

    # Verify API call was still logged even on error
    mock_mongo["log_api_call"].assert_called_once()


# Simple tests for GET endpoints
def test_get_projects_endpoint(client, mock_mongo):
    with patch(
        "builtins.open", mock_open(read_data='{"projects": [{"name": "Test Project"}]}')
    ):
        response = client.get("/api/get-projects")

        assert response.status_code == 200
        response_data = json.loads(response.data)
        assert "projects" in response_data
        mock_mongo["log_api_call"].assert_called_once()


def test_get_skills_endpoint(client, mock_mongo):
    with patch(
        "builtins.open",
        mock_open(read_data='{"skillCategories": [{"name": "Test Category"}]}'),
    ):
        response = client.get("/api/get-skills")

        assert response.status_code == 200
        response_data = json.loads(response.data)
        assert "skillCategories" in response_data
        mock_mongo["log_api_call"].assert_called_once()


def test_get_about_endpoint(client, mock_mongo):
    with patch(
        "builtins.open", mock_open(read_data='{"name": "Test User", "bio": "Test bio"}')
    ):
        response = client.get("/api/get-about")

        assert response.status_code == 200
        response_data = json.loads(response.data)
        assert "name" in response_data
        mock_mongo["log_api_call"].assert_called_once()


def test_get_endorsements_endpoint(client, mock_mongo):
    with patch("app.get_all_endorsements") as mock_get_endorsements:
        mock_get_endorsements.return_value = [
            {"id": "1", "name": "Test User", "message": "Great work!"}
        ]

        response = client.get("/api/endorsements")

        assert response.status_code == 200
        response_data = json.loads(response.data)
        assert "endorsements" in response_data
        assert len(response_data["endorsements"]) == 1
        mock_mongo["log_api_call"].assert_called_once()


def test_request_otp_endpoint(client, mock_smtp, mock_mongo):
    with patch("app.cleanup_expired_otps") as mock_cleanup, patch(
        "app.generate_otp"
    ) as mock_generate_otp, patch("app.store_otp") as mock_store_otp, patch(
        "app.send_email"
    ) as mock_send_email:

        mock_generate_otp.return_value = "123456"
        mock_send_email.return_value = True

        data = {
            "email": "test@example.com",
            "action": "endorse",
            "skillId": "skill-123",
        }

        response = client.post("/api/endorsements/request-otp", json=data)

        assert response.status_code == 200
        response_data = json.loads(response.data)
        assert response_data["success"] is True
        mock_mongo["log_api_call"].assert_called_once()
