import type { IAutoMovieViewerVideoOptions } from "@automovie/render/node";
import ffmpeg from "ffmpeg-static";

import { durationSeconds } from "./src/durationSeconds";

/** Exact-time export of the running production viewer; the production owns the optional soundtrack. */
export default {
  url:
    process.env.VIEWER_URL ?? "http://127.0.0.1:5173/?capture=1&w=1280&h=720",
  spec: {
    target: "production",
    frameFormat: { width: 1280, height: 720, fps: 30 },
    toneMapping: "none",
    codec: "h264",
    pixelFormat: "yuv420p",
    crf: 18,
  },
  durationSeconds,
  frameDir: ".cache/render",
  outputPath: "output/film.mp4",
  chromeExecutable: process.env.CHROME_PATH ?? "",
  ffmpegExecutable: process.env.FFMPEG_PATH ?? ffmpeg ?? "",
  viewSelector: "#view",
} satisfies IAutoMovieViewerVideoOptions;
