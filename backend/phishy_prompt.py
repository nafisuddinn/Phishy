def generate_prompt(message: str) -> str: #based off the inputted message (again, constant from frontend)
    return (
        f"You are a security assistant. Analyze the following message and determine "
        f"if it could be a scam, phishing, or deceptive communication."
        f"Message: \"{message}\"\n\n"
        f"Respond with:"
        f"1. Verdict: Is it likely a scam? (Yes it is a scam/No it is not a scam)"
        f"2. Type of scam (e.g., phishing, fake prize, impersonation, etc)"
        f"3. Reasoning:  behind your decision."
        f"Give a confidence score from 0% to 100% on how confident you are that the message is a scam.(Say: Confidence: % Input + Scam)"
        f"Keep your answer short and consice."
    )
