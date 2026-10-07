import type { IPortraitEyebrowPlacement } from "./IPortraitEyebrowPlacement";
import type { IPortraitEyebrowProfile } from "./IPortraitEyebrowProfile";
import { createPortraitEyebrowFlow } from "./createPortraitEyebrowFlow";
import { resolvePortraitEyebrowFlowPattern } from "./resolvePortraitEyebrowFlowPattern";

/**
 * Resolve where a profile's shafts root, how its ends thin and which way its
 * hairs run, from whichever spelling the profile uses.
 *
 * A profile states each of the three either by its named numbers
 * (`rootLower` and `rootUpper`, `medialFade` and `lateralFade`, `grain`) or
 * by the older tuple and witness-list fields (`rootBand`, `endFade`, `flow`)
 * that existing documents carry. This is the one place the two spellings
 * meet. Stating both spellings of one quantity refuses, because neither could
 * be said to win. A named root bound given alone takes the other from the
 * default band [0.1, 0.22]; a named fade given alone leaves the other end
 * unfaded. No field at all gives the default band, no fade and no flow.
 *
 * @evidence contracts/common.md#principled-implementation Each quantity has exactly one resolved value and one refusal for a contradictory statement, so the shaft builder and the admission cannot read different spellings.
 * @evidence contracts/common.md#clear-and-simple-design One resolver returns one record; consumers no longer default the tuples themselves.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The older spelling is admitted because documents carry it, a supported difference; nothing is guessed when both are present.
 * @evidence contracts/common.md#meaningful-documentation States both spellings, the defaults and the refusal.
 * @evidence contracts/modeling.md#parameter-channels Root extent, end thinning and grain stay three independent traits in either spelling.
 * @evidence contracts/modeling.md#spatial-conventions Fractions of the registered band and of the brow's length pass through unchanged.
 * @evidence contracts/anatomy.md#parametric-authority The named numbers are the authoring inputs; the conversion to the detailed tuple and witness form is deterministic and has no inverse for witness lists the four-number grain cannot state.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The resolver carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The profile admission bounds the resolved values.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The resolver defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The resolver emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The resolver builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The brow assembly observes the result.
 */
export function resolvePortraitEyebrowPlacement(
  shape: IPortraitEyebrowProfile,
): IPortraitEyebrowPlacement {
  const namedRoots =
    shape.rootLower !== undefined || shape.rootUpper !== undefined;
  const namedFades =
    shape.medialFade !== undefined || shape.lateralFade !== undefined;
  if (
    (namedRoots && shape.rootBand !== undefined) ||
    (namedFades && shape.endFade !== undefined) ||
    (shape.grain !== undefined && shape.flow !== undefined)
  )
    throw new Error(
      "An eyebrow states its roots, fades and grain either by named numbers or by the tuple and witness fields, not both.",
    );
  const profile =
    shape.grain !== undefined
      ? resolvePortraitEyebrowFlowPattern(shape.grain)
      : shape.flow;
  return {
    rootBand: namedRoots
      ? [shape.rootLower ?? 0.1, shape.rootUpper ?? 0.22]
      : (shape.rootBand ?? [0.1, 0.22]),
    endFade: namedFades
      ? [shape.medialFade ?? 0, shape.lateralFade ?? 0]
      : (shape.endFade ?? [0, 0]),
    flow:
      profile === undefined ? undefined : createPortraitEyebrowFlow(profile),
  };
}
