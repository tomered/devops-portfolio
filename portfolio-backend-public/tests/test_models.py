import pytest
from datetime import datetime
from pydantic import ValidationError
from models import ChatMessage, ChatRequest, ContactForm, ExportChatRequest


def test_chat_message():
    # Test valid chat message
    message = ChatMessage(content="Hello", role="user")
    assert message.content == "Hello"
    assert message.role == "user"
    assert message.timestamp is None

    # Test with timestamp
    now = datetime.now()
    message = ChatMessage(content="Hello", role="user", timestamp=now)
    assert message.timestamp == now

    # Test missing required field
    with pytest.raises(ValidationError):
        ChatMessage(role="user")  # Missing content


def test_chat_request():
    # Test valid chat request
    messages = [
        ChatMessage(content="Hello", role="user"),
        ChatMessage(content="Hi there!", role="assistant"),
    ]
    request = ChatRequest(
        messages=messages, newMessage="How are you?", conversationId="123"
    )
    assert len(request.messages) == 2
    assert request.newMessage == "How are you?"
    assert request.conversationId == "123"

    # Test missing required field
    with pytest.raises(ValidationError):
        ChatRequest(messages=messages, conversationId="123")  # Missing newMessage


def test_contact_form():
    # Test valid contact form
    form = ContactForm(
        name="John Doe",
        email="john@example.com",
        subject="Test Subject",
        message="Test Message",
    )
    assert form.name == "John Doe"
    assert form.email == "john@example.com"
    assert form.subject == "Test Subject"
    assert form.message == "Test Message"

    # Test invalid email
    with pytest.raises(ValidationError):
        ContactForm(
            name="John Doe", email="invalid-email", subject="Test", message="Test"
        )


def test_export_chat_request():
    # Test valid export request
    messages = [
        ChatMessage(content="Hello", role="user"),
        ChatMessage(content="Hi there!", role="assistant"),
    ]
    export_request = ExportChatRequest(
        email="user@example.com",
        message="Please export my chat",
        chatMessages=messages,
        conversationId="123",
    )
    assert export_request.email == "user@example.com"
    assert len(export_request.chatMessages) == 2
    assert export_request.conversationId == "123"

    # Test invalid email
    with pytest.raises(ValidationError):
        ExportChatRequest(
            email="invalid-email",
            message="test",
            chatMessages=messages,
            conversationId="123",
        )
