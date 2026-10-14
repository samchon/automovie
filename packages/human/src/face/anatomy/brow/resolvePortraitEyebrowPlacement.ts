import type { IPortraitEyebrowFlowProfile } from "./IPortraitEyebrowFlowProfile";

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
 * @evidence contracts/common.md#principled-implementation Named and legacy tuple/profile spellings resolve into the same root bounds, fades and optional complete flow under explicit omission defaults.
 * @evidence contracts/common.md#clear-and-simple-design One resolver owns spelling conflicts and grain expansion before both admission and shaft construction consume the normalized placement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supplying both spellings refuses instead of silently selecting a winner; partial named bounds/fades retain their documented defaults.
 * @evidence contracts/common.md#meaningful-documentation The prose gives root defaults, unfaded omission, no-flow behavior and each ambiguous spelling refusal.
 * @evidence contracts/performance.md#efficient-algorithms Root/fade selection is constant work; optional flow expansion/copy/admission scales with its at-most-32 witness list.
 * @evidence contracts/performance.md#reuse-equivalent-work All consumers share this same normalization owner, and the returned flow closure owns an admitted copy rather than relying on future caller mutations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned tuple references may borrow legacy readonly input arrays; generated tuples and copied flow closure are caller-owned and no global state is retained.
 */
export function resolvePortraitEyebrowPlacement(
  shape: IPortraitEyebrowProfile,
): IPortraitEyebrowPlacement {
  const namedRoots: boolean =
    shape.rootLower !== undefined || shape.rootUpper !== undefined;
  const namedFades: boolean =
    shape.medialFade !== undefined || shape.lateralFade !== undefined;
  if (
    (namedRoots && shape.rootBand !== undefined) ||
    (namedFades && shape.endFade !== undefined) ||
    (shape.grain !== undefined && shape.flow !== undefined)
  )
    throw new Error(
      "An eyebrow states its roots, fades and grain either by named numbers or by the tuple and witness fields, not both.",
    );
  const profile: IPortraitEyebrowFlowProfile | undefined =
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
