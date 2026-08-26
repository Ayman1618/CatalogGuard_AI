import os
from typing import Any, Dict, Literal
from pydantic import BaseModel, Field


class AISuggestion(BaseModel):
    explanation: str = Field(
        ..., description="Simple explanation of the validation issue in plain language."
    )
    suggestion: str = Field(
        ..., description="Suggested action for the reviewer regarding what to check or change."
    )
    confidence: Literal["low", "medium", "high"] = Field(
        ..., description="Confidence level of the suggestion."
    )


class AIServiceUnavailableError(Exception):
    """Raised when Gemini API key is missing or Gemini API call fails."""

    pass


def generate_validation_suggestion(
    product_data: Dict[str, Any], validation_issue: Dict[str, Any]
) -> AISuggestion:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key.strip() in ("", "your_gemini_api_key"):
        raise AIServiceUnavailableError("AI suggestion service is currently unavailable.")

    sku = product_data.get("sku", "N/A")
    name = product_data.get("name", "N/A")
    category = product_data.get("category", "N/A")
    brand = product_data.get("brand") or "N/A"
    price = product_data.get("price", "N/A")
    currency = product_data.get("currency", "INR")
    inventory = product_data.get("inventory", "N/A")
    image_url = product_data.get("image_url") or "N/A"

    issue_code = validation_issue.get("code", "UNKNOWN")
    issue_field = validation_issue.get("field", "N/A")
    issue_severity = validation_issue.get("severity", "error")
    issue_message = validation_issue.get("message", "")

    prompt = f"""You are assisting a marketplace catalog operations reviewer.
A deterministic validation engine has already identified an issue.
Do not decide whether the product is valid.
Do not invent product information.
Do not modify the product.
Do not approve or reject the product.
Explain the existing issue in simple language and suggest what the reviewer should check or change.

Product Information:
- SKU: {sku}
- Name: {name}
- Category: {category}
- Brand: {brand}
- Price: {price} {currency}
- Inventory: {inventory}
- Image URL: {image_url}

Deterministic Validation Issue:
- Code: {issue_code}
- Field: {issue_field}
- Severity: {issue_severity}
- Message: {issue_message}
"""

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AISuggestion,
                temperature=0.2,
            ),
        )
        if not response or not response.text:
            raise AIServiceUnavailableError("AI suggestion service returned an empty response.")

        return AISuggestion.model_validate_json(response.text)
    except AIServiceUnavailableError:
        raise
    except Exception as e:
        raise AIServiceUnavailableError("AI suggestion service is currently unavailable.") from e
