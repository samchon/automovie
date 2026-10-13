import {
  AutoMovieContentDigest,
  IAutoMovieFilmTimeline,
} from "@automovie/interface";

import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";
import { canonicalizeAutoMovieJson } from "../text/canonicalizeAutoMovieJson";

/**
 * Identify the normalized edit state shared by planning and film effects.
 *
 * The digest is SHA-256 over the UTF-8 bytes of the protocol-tagged canonical
 * JSON v2 edit. The engine computes it without a Node built-in, and the bytes
 * and digest equal what the Node builder path produces for the same edit, so a
 * browser viewer and the render planner compare one identity.
 */
export const productionFilmEffectEditFingerprint = (
  timeline: IAutoMovieFilmTimeline,
): AutoMovieContentDigest =>
  autoMovieRenderDigest(
    canonicalizeAutoMovieJson({
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
