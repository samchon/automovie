import { IAutoMovieFilmTimeline } from "@automovie/interface";

import { autoMovieRenderDigest } from "../../render/internal/autoMovieRenderDigest";
import { AutoMovieEngineCanonicalJson } from "../../text/AutoMovieEngineCanonicalJson";

/**
 * Identify the normalized edit state shared by planning and film effects.
 *
 * The digest is SHA-256 over the UTF-8 bytes of the canonical JSON v2 of a
 * record tagged `automovie.production-render-edit.v2` that carries the
 * timeline's id, `fps`, `frameRate`, `totalFrames`, segments, omissions and
 * tracks. Builder provenance (`version`, `builder`, `inputFingerprint`,
 * `sourceDigest`) is left out, so recompiling an unchanged edit keeps its edit
 * identity. The engine computes it without a Node built-in, and the bytes and
 * digest equal what the Node builder path produces for the same edit, so a
 * browser viewer and the render planner compare one identity.
 */
export function productionFilmEffectEditFingerprint(
  timeline: IAutoMovieFilmTimeline,
): string {
  return autoMovieRenderDigest(
    AutoMovieEngineCanonicalJson.canonicalize({
      protocol: "automovie.production-render-edit.v2",
      id: timeline.id,
      fps: timeline.fps,
      frameRate: timeline.frameRate,
      totalFrames: timeline.totalFrames,
      segments: timeline.segments,
      omissions: timeline.omissions,
      tracks: timeline.tracks,
    }),
  );
}
