import os
import sys
import pytest
from unittest.mock import patch, MagicMock

# Add the parent directory to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Set test environment variables
os.environ["AI_MODEL_NAME"] = "test-model"
os.environ["EMAIL_ADDRESS"] = "test@example.com"
os.environ["EMAIL_PASSWORD"] = "test-password"
os.environ["MY_EMAIL_ADDRESS"] = "my-test@example.com"
os.environ["MONGO_URI"] = "mongodb://test:test@localhost:27017/test"
os.environ["GOOGLE_MODEL_NAME"] = "gemini-2.0-flash-lite"
os.environ["GOOGLE_API_KEY"] = "test-api-key"
os.environ["REDIS_HOST"] = "localhost"
os.environ["REDIS_PORT"] = "6379"
os.environ["REDIS_PASSWORD"] = "test"
os.environ["PORT"] = "5000"

# Mock the llm module
sys.modules["llm"] = __import__(
    "tests.mock_llm", fromlist=["router", "get_context_prompt"]
)


# Create pytest fixtures for mocking dependencies
@pytest.fixture(autouse=True)
def mock_mongodb():
    with patch("mongo.MongoClient") as mock:
        mock_db = MagicMock()
        mock.return_value.__getitem__.return_value = mock_db
        yield mock_db


@pytest.fixture(autouse=True)
def mock_redis():
    with patch("redis.Redis") as mock:
        yield mock


@pytest.fixture(autouse=True)
def mock_get_context():
    with patch("llm.get_context_prompt", return_value="Test context"):
        yield
