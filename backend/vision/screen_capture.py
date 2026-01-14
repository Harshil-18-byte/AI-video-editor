import mss
import numpy as np
import cv2


def capture_screen():
    # ✅ Create MSS instance INSIDE the function
    with mss.mss() as sct:
        monitor = sct.monitors[1]  # primary monitor
        img = sct.grab(monitor)

    frame = np.array(img)
    frame = cv2.cvtColor(frame, cv2.COLOR_BGRA2BGR)
    return frame
