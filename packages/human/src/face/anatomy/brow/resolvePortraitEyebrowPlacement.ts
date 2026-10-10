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
