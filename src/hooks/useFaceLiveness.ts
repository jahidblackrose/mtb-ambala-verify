import { useEffect, useRef, useState } from "react";

export interface LivenessState {
  faceFound: boolean;
  blinkDetected: boolean;
  /** The model could not be loaded — caller decides on the fallback. */
  modelError: boolean;
}

/**
 * Minimal liveness via MediaPipe FaceLandmarker (self-hosted model + wasm).
 * The library is imported dynamically so it never enters the SSR graph.
 *
 * Blink: eyeBlinkLeft/Right go above 0.5 and back below 0.2 within 10 s.
 * Face: exactly one face, roughly inside the guide oval — a generous box
 * (>= 22% of frame width) so users don't have to lean in precisely.
 */
export function useFaceLiveness(video: HTMLVideoElement | null, active: boolean): LivenessState {
  const [state, setState] = useState<LivenessState>({ faceFound: false, blinkDetected: false, modelError: false });
  const blinkDetectedRef = useRef(false);

  useEffect(() => {
    if (!video || !active) return;
    let disposed = false;
    let raf = 0;
    let landmarker: { close(): void; detectForVideo(v: HTMLVideoElement, ts: number): LandmarkerResult } | null = null;
    let armed = false; // eyes currently above 0.5
    let armedAt = 0;

    type LandmarkerResult = {
      faceBlendshapes?: { categories: { categoryName: string; score: number }[] }[];
      faceLandmarks?: { x: number; y: number }[][];
    };

    (async () => {
      try {
        const vision = await import("@mediapipe/tasks-vision");
        if (disposed) return;

        // Self-hosted fileset: the loader scripts live in /mediapipe, the big
        // .wasm binaries are served from the CDN asset store.
        const simd = (() => {
          try {
            return WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0]));
          } catch {
            return false;
          }
        })();
        const wasmFileset = {
          wasmLoaderPath: simd ? "/mediapipe/vision_wasm_internal.js" : "/mediapipe/vision_wasm_nosimd_internal.js",
          wasmBinaryPath: simd
            ? (await import("@/assets/vision_wasm_internal.wasm.asset.json")).default.url
            : (await import("@/assets/vision_wasm_nosimd_internal.wasm.asset.json")).default.url,
        };

        const created = await vision.FaceLandmarker.createFromOptions(wasmFileset, {
          baseOptions: { modelAssetPath: "/mediapipe/face_landmarker.task", delegate: "GPU" },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: true,
        });
        if (disposed) {
          created.close();
          return;
        }
        landmarker = created as unknown as typeof landmarker;

        let lastTs = -1;
        const loop = () => {
          if (disposed) return;
          raf = requestAnimationFrame(loop);
          if (video.readyState < 2 || video.videoWidth === 0) return;
          const ts = video.currentTime;
          if (ts === lastTs) return;
          lastTs = ts;

          let result: LandmarkerResult;
          try {
            result = landmarker!.detectForVideo(video, ts * 1000) as LandmarkerResult;
          } catch {
            return;
          }
          if (disposed) return;

          const faces = result.faceLandmarks ?? [];
          let faceFound = false;
          if (faces.length === 1 && faces[0]) {
            const pts = faces[0];
            const xs = pts.map((p) => p.x);
            const ys = pts.map((p) => p.y);
            const minX = Math.min(...xs), maxX = Math.max(...xs);
            const minY = Math.min(...ys), maxY = Math.max(...ys);
            const boxW = maxX - minX;
            const cx = (minX + maxX) / 2;
            const cy = (minY + maxY) / 2;
            // Generous bounds so a normal arm's-length selfie counts.
            faceFound = boxW >= 0.22 && cx > 0.15 && cx < 0.85 && cy > 0.08 && cy < 0.8;
          }

          let blink = blinkDetectedRef.current;
          const shapes = result.faceBlendshapes?.[0]?.categories ?? [];
          const byName = new Map(shapes.map((c) => [c.categoryName, c.score]));
          const l = byName.get("eyeBlinkLeft") ?? 0;
          const r = byName.get("eyeBlinkRight") ?? 0;
          const now = performance.now();
          if (!blink) {
            if (!armed && l > 0.5 && r > 0.5) {
              armed = true;
              armedAt = now;
            } else if (armed && now - armedAt > 10_000) {
              armed = false; // held too long without closing; re-arm
            } else if (armed && l < 0.2 && r < 0.2) {
              blink = true;
              blinkDetectedRef.current = true;
              armed = false;
            }
          }

          setState((prev) =>
            prev.faceFound === faceFound && prev.blinkDetected === blink ? prev : { faceFound, blinkDetected: blink, modelError: false },
          );
        };
        raf = requestAnimationFrame(loop);
      } catch {
        if (!disposed) setState((prev) => ({ ...prev, modelError: true }));
      }
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      try {
        landmarker?.close();
      } catch {
        // ignore
      }
    };
  }, [video, active]);

  return state;
}
