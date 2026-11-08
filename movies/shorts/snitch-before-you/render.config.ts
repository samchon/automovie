import type { IAutoMovieViewerVideoOptions } from "@automovie/render";
import ffmpeg from "ffmpeg-static";

import { durationSeconds } from "./src/durationSeconds";

/** Exact-time export of the running production viewer; the production owns the optional soundtrack. */
export default {
  url:
    process.env.VIEWER_URL ?? "http://127.0.0.1:5206/?capture=1&w=720&h=1280",
  spec: {
    target: "production",
    frameFormat: { width: 720, height: 1280, fps: 24 },
    toneMapping: "none",
    codec: "h264",
    pixelFormat: "yuv420p",
    crf: 18,
  },
  durationSeconds,
  frameDir: ".cache/motion-dynamics/render",
  outputPath: "output/motion-dynamics/motion-hint.mp4",
  timeoutMs: 480000,
  chromeExecutable: process.env.CHROME_PATH ?? "",
  ffmpegExecutable: process.env.FFMPEG_PATH ?? ffmpeg ?? "",
  viewSelector: "#view",
} satisfies IAutoMovieViewerVideoOptions;
