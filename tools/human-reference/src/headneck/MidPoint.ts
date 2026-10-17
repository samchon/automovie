import type { V3 } from "../geometry/V3.ts";

/**
 * A geometric profile observation whose anatomical name remains an inference.
 *
 * @evidence contracts/common.md#principled-implementation A source position and explicit extraction method define the observation without equating heuristic and clinical landmarks.
 * @evidence contracts/common.md#clear-and-simple-design Location, source-profile correspondence and uncertainty remain in one record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record supplies no baked product landmark index or automatic clinical certification.
 * @evidence contracts/common.md#meaningful-documentation Documents native units, profile index meaning and uncertainty independent of surface proximity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased observation declaration executes no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration coordinates no requests or effects.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Observation arrays and profile lifetime belong to their producing context.
 * @author Samchon
 */
export interface MidPoint {
  /** Conventional geometric proxy label, whose extraction method defines its meaning. */
  name: string;
  /** Position on the native source profile in world millimetres. */
  p: V3;
  /** Source profile segment or vertex index, without product landmark correspondence. */
  i: number;
  /** Source geometry protocol and conventional search limits, without clinical equivalence. */
  method: string;
  /** Confidence of this geometric inference, independent of point-to-skin proximity. */
  confidence: "high" | "medium" | "low";
}
