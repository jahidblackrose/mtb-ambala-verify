import { useCallback, useEffect, useRef, useState } from "react";

export type Facing = "environment" | "user";
export type CameraErrorKind = "permission" | "notreadable" | "other" | null;

/**
 * Live camera capture for the photo step. Back camera by default,
 * switchable; tracks stop on unmount and when the app goes to background.
 */
export function useCamera() {
  const [facing, setFacing] = useState<Facing>("environment");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<CameraErrorKind>(null);
  const [starting, setStarting] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  const start = useCallback(async (f: Facing) => {
    stop();
    setStarting(true);
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: f },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = s;
      setStream(s);
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") setError("permission");
      else if (name === "NotReadableError" || name === "OverconstrainedError") setError("notreadable");
      else setError("other");
    } finally {
      setStarting(false);
    }
  }, [stop]);

  const switchCamera = useCallback(() => {
    setFacing((f) => (f === "environment" ? "user" : "environment"));
  }, []);

  // Start / restart when the facing mode changes.
  useEffect(() => {
    void start(facing);
  }, [facing, start]);

  // Stop on unmount and when the page goes to the background.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") stop();
      else void start(facing);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stop]);

  return { facing, stream, error, starting, switchCamera, stop, start };
}
