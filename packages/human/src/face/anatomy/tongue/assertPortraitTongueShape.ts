import { IPortraitTongueShape } from "./IPortraitTongueShape";
import { portraitTongueParameters } from "./portraitTongueParameters";

/**
 * Admit a complete optional tongue before allocating its surface. The median
 * depression cannot consume the upper half of the body.
 *
 * @evidence contracts/common.md#principled-implementation The surface formulas need finite dimensions inside the editing envelopes, a groove strictly shallower than the half thickness so the depression cannot consume the upper half of the body, and a nonempty material identity; the function refuses exactly those before any allocation.
 * @evidence contracts/common.md#clear-and-simple-design One admission shared by the builder and the editor's controls through `portraitTongueParameters`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The bounds are the envelope table and the groove relation; no subject or fixture appears.
 * @evidence contracts/common.md#meaningful-documentation The comment states what is admitted and why the groove is bounded; the refusal names the parameter and its range.
 * @evidence contracts/modeling.md#spatial-conventions Dimensions are millimetres.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function admits a profile and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel; it validates the dimensions documented on the shape type.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines no input through which a caller shapes a face; it refuses values of inputs declared on the shape type.
 */
export function assertPortraitTongueShape(shape: IPortraitTongueShape): void {
  for (const p of portraitTongueParameters)
    if (
      !Number.isFinite(shape[p.id]) ||
      shape[p.id] < p.minimum ||
      shape[p.id] > p.maximum
    )
      throw new Error(
        `Tongue ${p.id} must be finite in [${p.minimum},${p.maximum}] mm.`,
      );
  if (shape.grooveDepth >= shape.halfThickness)
    throw new Error(
      "Tongue groove depth must be less than its half thickness.",
    );
  if (shape.material.trim().length === 0)
    throw new Error("Tongue needs a nonempty resident material identity.");
}
