import { IAutoMovieAnalysisTarget } from "@automovie/interface";

import { IAutoMovieAcousticPartition } from "./IAutoMovieAcousticPartition";
import { IAutoMovieAcousticReceiver } from "./IAutoMovieAcousticReceiver";
import { IAutoMovieAcousticSource } from "./IAutoMovieAcousticSource";
import { IAutoMovieAcousticSurface } from "./IAutoMovieAcousticSurface";

/**
 * Everything one room-acoustic study is configured with.
 *
 * `analyzeAutoMovieAcoustics` throws on a blank id, subject or revision, a
 * non-positive volume, an empty surface list, any malformed or repeated member,
 * more receivers than `AUTOMOVIE_ANALYSIS_MAX_SAMPLES`, or a malformed target.
 * Every field except `id`, `subject` and `inputRevision` enters the settings
 * digest; those three go into the run header.
 *
 * @evidence contracts/development/design.md#principled-representation A Sabine diffuse-field study: absorption area, reverberation time `0.161 V / A`, room constant and receiver levels follow from the volume and the declared members, and the settings are digested so an identical request seals an identical run.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Run header fields plus one list per physical role, surfaces, partitions, sources and receivers, and the targets, so validation and the settings digest each read one field per concern.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Malformed members throw rather than becoming gaps or unsupported runs, empty optional lists turn their metrics into stated gaps, and no study id or subject is special-cased.
 * @evidence contracts/development/common.md#meaningful-documentation States every throw condition of the analyzer, which fields enter the settings digest and which go into the run header, the units, the at-least-one surface rule, and what each empty list makes a gap.
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
