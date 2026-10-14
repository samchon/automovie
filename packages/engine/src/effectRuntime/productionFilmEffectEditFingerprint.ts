import {
  IAutoMovieFilmTimeline,
} from "@automovie/interface";

import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";
import { canonicalizeAutoMovieJson } from "../text/canonicalizeAutoMovieJson";

/**
 * Identify the normalized edit state shared by planning and film effects.
 *
 * The digest is SHA-256 over the UTF-8 bytes of the canonical JSON v2 of a record tagged `automovie.production-render-edit.v2` that carries the timeline's id, `fps`, `frameRate`, `totalFrames`, segments, omissions and tracks. Builder provenance (`version`, `builder`, `inputFingerprint`, `sourceDigest`) is left out, so recompiling an unchanged edit keeps its edit identity. The engine computes it without a Node built-in, and the bytes and digest equal what the Node builder path produces for the same edit, so a browser viewer and the render planner compare one identity.
 *
 * @evidence contracts/common.md#principled-implementation A content address: canonical JSON orders members by code unit and refuses non-finite numbers and lone surrogates, so equal edits serialize to equal bytes on every runtime and the FIPS 180-4 SHA-256 in `autoMovieRenderDigest` maps them to one digest; an absent `frameRate` is omitted by the canonicalizer, so a legacy integer timeline keeps its prior identity.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the protocol tag and the field selection, and the film-effect writer's caller, the population verifier and the render planner all call it, so no consumer can hash a different subset of the timeline.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The digest is recomputed from the timeline on every call rather than read from any persisted field, and the provenance fields are excluded by an explicit allow-list rather than by deleting keys from a copy.
 * @evidence contracts/common.md#meaningful-documentation States the protocol tag, exactly which timeline fields enter the digest and which are left out and why, the byte encoding and hash, and that the browser and Node paths agree.
 * @evidence contracts/performance.md#efficient-algorithms Canonicalization traverses the timeline and sorts each object's K keys, adding sum(K log K) work to serialization and the linear SHA-256 byte pass; the tagged record is shallow, while the canonicalizer builds its ordered representation and string.
 * @evidence contracts/performance.md#reuse-equivalent-work Recomputes each call because the timeline is a plain mutable record with no version token: an identity-keyed cache could survive an in-place edit. Consumers share the field-selection rule, not a cached computation; the render planner computes its edit identity and its population-verification call computes the digest again.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The canonical string and its byte array are released when the call returns; only the 71-character digest string is retained by the caller.
 */
export function productionFilmEffectEditFingerprint (
  timeline: IAutoMovieFilmTimeline,
): string { return autoMovieRenderDigest(
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
  ); }
