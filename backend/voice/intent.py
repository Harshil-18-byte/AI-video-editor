def parse_intent(text: str):
    t = text.lower()

    if "remove silence" in t:
        return "REMOVE_SILENCE"
    if "cut" in t or "split" in t:
        return "CUT"
    if "delete" in t or "remove clip" in t:
        return "DELETE_CLIP"
    if "play" in t or "start" in t:
        return "PLAY"
    if "pause" in t or "stop" in t:
        return "PAUSE"
    if "caption" in t or "subtitle" in t:
        return "CAPTION"
    if (
        "cinematic" in t
        or "bright" in t
        or "dark" in t
        or "color" in t
        or "grade" in t
        or "saturat" in t
        or "look" in t
    ):
        return "COLOR_GRADE"
    if (
        "add transition" in t
        or "transition" in t
        or "cross dissolve" in t
        or "fade" in t
    ):
        return "ADD_TRANSITION"
    if "effect" in t or "filter" in t:
        return "ADD_EFFECT"
    if "suggestion" in t or "insight" in t:
        return "APPLY_SUGGESTION"

    return "UNKNOWN"


def confidence_score(intent, signals):
    if intent == "REMOVE_SILENCE":
        return min(0.95, signals.get("silence_ratio", 0.4) + 0.3)
    if intent in ("CUT", "PLAY", "PAUSE"):
        return 0.85
    return 0.6
