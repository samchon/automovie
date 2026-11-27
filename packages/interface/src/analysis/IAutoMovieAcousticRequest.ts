import type { IAutoMovieAcousticPartition } from "./IAutoMovieAcousticPartition";
import type { IAutoMovieAcousticReceiver } from "./IAutoMovieAcousticReceiver";
import type { IAutoMovieAcousticSource } from "./IAutoMovieAcousticSource";
import type { IAutoMovieAcousticSurface } from "./IAutoMovieAcousticSurface";
import type { IAutoMovieAnalysisTarget } from "./IAutoMovieAnalysisTarget";

/**
 * Everything one room-acoustic study is configured with.
 *
 * `analyzeAutoMovieAcoustics` throws on a blank id, subject or revision, a
 * non-positive volume, an empty surface list, any malformed or repeated member,
 * more receivers than `AutoMovieEngineAnalysisMaxSamples`, or a malformed target.
 * Every field except `id`, `subject` and `inputRevision` enters the settings
 * digest; those three go into the run header.
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
   * `AutoMovieEngineAnalysisMaxSamples`, and empty makes the level metrics a gap.
   */
  receivers: readonly IAutoMovieAcousticReceiver[];

  /**
   * Targets the production declares for this study; a key naming no reported
   * metric becomes a `target-key-unknown` warning.
   */
  targets: readonly IAutoMovieAnalysisTarget[];
}
