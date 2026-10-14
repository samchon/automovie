import type { IAutoMovieHumanBodyMeasuredLength } from "./IAutoMovieHumanBodyMeasuredLength";

/**
 * A target internal length or an imaging observation of the same landmarks. The scalar alone cannot determine an individual bone surface or joint pose.
 *
 * @evidence contracts/common.md#principled-implementation Target millimetres and measured lengths preserve distinct provenance over explicitly owned internal landmarks.
 * @evidence contracts/common.md#clear-and-simple-design The length union reuses measured-length acquisition fields instead of defining a second observation protocol.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A scalar internal distance cannot silently determine a unique bone surface or joint pose.
 * @evidence contracts/common.md#meaningful-documentation Comments state millimetre units, landmark ownership and limits of scalar geometry information.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Internal length typing runs no landmark registration or bone-surface optimization.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The anatomical length vocabulary has no solved landmark result to retain or share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Length metadata retains no bone mesh, registration handle or imaging bytes.
 * @author Samchon
 */
export type IAutoMovieHumanBodyAnatomicalLength =
  | {
      /** Desired internal length rather than an imaging observation. */
      readonly kind: "target";

      /** Target distance in millimetres between the owning anatomical landmarks. */
      readonly millimetres: number;
    }
  | IAutoMovieHumanBodyMeasuredLength;
