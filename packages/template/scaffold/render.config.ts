import type { IAutoMovieViewerVideoOptions } from "@automovie/render/node";
import ffmpeg from "ffmpeg-static";

import type { IFilm } from "./src/IFilm";
import { films } from "./src/films";
import { selectFilm } from "./src/selectFilm";

/**
 * Exact-time export options for one film of the running production Viewer,
 * written to `media/automovie/<film>/videos/`; the production owns the optional
 * soundtrack.
 */
export default function renderConfig(
  requested: string | null,
): IAutoMovieViewerVideoOptions & { film: string } {
  const selected: { name: string; film: IFilm } = selectFilm(films, requested);
  const name: string = selected.name;
  const url: URL = new URL(process.env.VIEWER_URL ?? "http://127.0.0.1:5173/");
  url.searchParams.set("capture", "1");
  url.searchParams.set("w", "1280");
  url.searchParams.set("h", "720");
  url.searchParams.set("film", name);
  return {
    film: name,
    url: url.href,
    spec: {
      target: "production",
      frameFormat: { width: 1280, height: 720, fps: 30 },
      toneMapping: "none",
      codec: "h264",
      pixelFormat: "yuv420p",
      crf: 18,
    },
    durationSeconds: selected.film.durationSeconds,
    frameDir: `.cache/render/${name}`,
    outputPath: `media/automovie/${name}/videos/film.mp4`,
    chromeExecutable: process.env.CHROME_PATH ?? "",
    ffmpegExecutable: process.env.FFMPEG_PATH ?? ffmpeg ?? "",
    viewSelector: "#view",
  };
}
