from unittest.mock import MagicMock

# Create a mock router
router = MagicMock()
router.acompletion.return_value = {
    "choices": [{"message": {"content": "Test response"}}],
    "usage": {"total_tokens": 10},
}


def get_context_prompt():
    return "Test context"
