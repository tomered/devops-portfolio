from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime


class ChatMessage(BaseModel):
    content: str
    role: str
    timestamp: Optional[datetime] = None


class ChatResponse(BaseModel):
    message: str
    topics: List[str]


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    newMessage: str
    conversationId: str


class ContactForm(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str


class ExportChatRequest(BaseModel):
    email: EmailStr
    message: str
    chatMessages: List[ChatMessage]
    conversationId: str


# Endorsement Models
class OTPRequest(BaseModel):
    email: EmailStr
    action: str  # "endorse" or "delete"
    skillId: Optional[str] = None  # Required for "endorse"
    endorsementId: Optional[str] = None  # Required for "delete"


class EndorsementCreate(BaseModel):
    skillId: str
    name: str
    email: EmailStr
    message: str
    otp: str


class EndorsementDelete(BaseModel):
    email: EmailStr
    otp: str


class Endorsement(BaseModel):
    id: str
    skillId: str
    name: str
    email: str
    message: str
    timestamp: datetime
