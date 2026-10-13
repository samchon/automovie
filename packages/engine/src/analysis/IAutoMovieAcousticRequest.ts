import { IAutoMovieAnalysisTarget } from "@automovie/interface";

import { IAutoMovieAcousticPartition } from "./IAutoMovieAcousticPartition";
import { IAutoMovieAcousticReceiver } from "./IAutoMovieAcousticReceiver";
import { IAutoMovieAcousticSource } from "./IAutoMovieAcousticSource";
import { IAutoMovieAcousticSurface } from "./IAutoMovieAcousticSurface";

/**
 *
 * Everything one room-acoustic study is configured with.
 *
 * `analyzeAutoMovieAcoustics` throws on a blank id, subject or revision, a
 * non-positive volume, an empty surface list, any malformed or repeated member,
 * more receivers than `AUTOMOVIE_ANALYSIS_MAX_SAMPLES`, or a malformed target.
 * Every field except `id`, `subject` and `inputRevision` enters the settings
 * digest; those three go into the run header.
 *
 * @evidence contracts/common.md#principled-implementation Describes one diffuse-field room by volume and broadband surface absorption, which is exactly what Sabine's equation and the room constant consume.
 * @evidence contracts/common.md#clear-and-simple-design Keeps surfaces, partitions, sources and receivers as separate lists because each feeds a different closed form; empty partition, source and receiver lists are allowed and become gaps.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no frequency bands or impulse response, so the speech transmission index is reported `unsupported` rather than estimated from these fields.
 * @evidence contracts/common.md#meaningful-documentation States what the analyzer refuses, which lists may be empty and what that yields, the receiver bound, and which fields enter the settings digest.
 * @evidenceExclude contracts/performance.md#cost-and-resources An input record; solving is linear in its lists apart from the receiver-by-source distance product, a cost of the analyzer. Each request is solved once into one sealed run; identical requests seal identical digests, yet the engine keeps no cache keyed by them. Owned by the caller; the analyzer copies its fields into a settings string and retains nothing after returning the run.
 * @author Samchon
 */
export interface IAutoMovieAcousticRequest {
  /** Stable run identity; non-blank. */
  id: string;

  /** Logical space being listened to; non-blank. */
  subject: string;

  /** Design revision being read; non-blank. */
  inputRevision: string;

  /** Room volume in m^3; finite and strictly positive. */
  volume: number;

  /** Absorbing surfaces; at least one, ids unique. */
  surfaces: readonly IAutoMovieAcousticSurface[];

  /**
   * Partitions whose composite transmission loss is asked for; empty makes that
   * metric a gap.
   */
  partitions: readonly IAutoMovieAcousticPartition[];

  /** Steady sources inside the room; empty makes every level metric a gap. */
  sources: readonly IAutoMovieAcousticSource[];

  /**
   * Listening positions the field is reported at; at most
   * `AUTOMOVIE_ANALYSIS_MAX_SAMPLES`, and empty makes the level metrics a gap.
   */
  receivers: readonly IAutoMovieAcousticReceiver[];

  /**
   * Targets the production declares for this study; a key naming no reported
   * metric becomes a `target-key-unknown` warning.
   */
  targets: readonly IAutoMovieAnalysisTarget[];
}
