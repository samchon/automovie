import { IPortraitTongueShape } from "./IPortraitTongueShape";
import { portraitTongueParameters } from "./portraitTongueParameters";

/**
 * Admit a complete optional tongue before allocating its surface. The median
 * depression cannot consume the upper half of the body.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Refuses incomplete or inverted lingual profiles instead of inventing absent anatomy.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Enforces finite dimensions, positive material identity and the coupled groove-thickness condition.
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
