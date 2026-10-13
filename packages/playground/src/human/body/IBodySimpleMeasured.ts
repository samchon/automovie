import type { IAutoMovieHumanBodySimpleShape } from "@automovie/human";

import type { IBodySimpleBody } from "./IBodySimpleBody";

/**
 * The last simple projection, unrounded and paired with the exact body it read. The control owner stores a cloned input and reuses the values only while shape, anatomy and context still match. Keeping full precision lets an untouched input preserve the original numerical target despite rounded display text.
 *
 * @evidence contracts/common.md#principled-implementation Pairing an unrounded projection with its complete body input preserves the provenance needed to distinguish reusable readings from results of a different shape or head context.
 * @evidence contracts/common.md#clear-and-simple-design The accepted-reading record contains only its dependency snapshot and values; in-flight work has a separate pending record because it has no accepted projection yet.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Accepted measurements come from the projection operation, without replacing them with display-rounded values or remembered fixture answers.
 * @evidence contracts/common.md#meaningful-documentation The comment explains snapshot ownership, the three invalidation inputs and why stored values retain more precision than their displayed text.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The accepted-reading type performs no comparison or projection; refresh owns the traversal needed to validate its stored input.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This schema represents one reusable answer but does not coordinate reuse; the control owner compares the input before reading its values.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This value pair has no release operation or external handle; the mounted controls retain at most their latest accepted reading.
 *
 * @author Samchon
 */
export interface IBodySimpleMeasured {
  /** The body read. */
  shape: IBodySimpleBody;

  /** Its simple values. */
  values: IAutoMovieHumanBodySimpleShape;
}
