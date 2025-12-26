def parse_intent(text: str):
    t = text.lower()

    if "remove silence" in t:
        return "REMOVE_SILENCE"
    if "cut" in t:
        return "CUT"
    if "play" in t:
        return "PLAY"
    if "pause" in t:
        return "PAUSE"

    return "UNKNOWN"


def confidence_score(intent, signals):
    if intent == "REMOVE_SILENCE":
        return min(0.95, signals.get("silence_ratio", 0.4) + 0.3)
    if intent in ("CUT", "PLAY", "PAUSE"):
        return 0.85
    return 0.6