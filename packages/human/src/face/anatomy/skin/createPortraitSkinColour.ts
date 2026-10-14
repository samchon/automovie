import type { IPortraitComponentHost } from "../../surface/structures/IPortraitComponentHost";
import { createPortraitColourField } from "./createPortraitColourField";
import type { IPortraitSkinColourRegion } from "./structures/IPortraitSkinColourRegion";
import type { PortraitSkinColourSite } from "./structures/PortraitSkinColourSite";

/**
 * Landmarks of the fixed 478-landmark basis that stand for each named site. The
 * identities are the basis's own: the forehead centre, the zygomatic
 * prominences, the mid cheeks, the nasal tip and the pogonion.
 */
const landmarks: Record<PortraitSkinColourSite, number> = {
  forehead: 151,
  rightCheekbone: 116,
  leftCheekbone: 345,
  rightCheek: 205,
  leftCheek: 425,
  noseTip: 4,
  chin: 199,
};

/** Support radius of every site, as a fraction of the bizygomatic breadth. */
const extent: number = 0.2;

/**
 * Compile named skin-site colours against an immutable reference host. Each
 * site is a landmark of the fixed basis; its support is an ellipsoid whose
 * three radii are one fifth of the host's bizygomatic breadth (landmarks 234 and
 * 454), an authored convention that scales with the face and is not a caller
 * input. Sampling happens after reference-coordinate refinement, so a narrow
 * region between control vertices is not lost by interpolating white endpoint
 * RGB. Sites fix product order by name, making declaration order irrelevant.
 * Gains lie in [0,1]: this path has no material to fold a lightening into.
 * The host uses millimetres; the sampler reads reference points in the same unit.
 *
 * @evidence contracts/common.md#principled-implementation Seven named fixed-basis landmarks locate pigmentation envelopes; one-fifth bizygomatic breadth sets conventional support radii and the shared colour-field compiler supplies deterministic reference-space gains.
 * @evidence contracts/common.md#clear-and-simple-design This adapter owns site-to-landmark mapping and procedural [0,1] gain restriction while the shared field owner handles finite admission, product ordering and sampling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Landmark ids belong to the supported 478-point basis, not a named person or test fixture; 0.2 breadth extent is an authored convention, and missing landmarks, unknown sites or lightening gains refuse.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies basis mapping, millimetre reference frame, conventional extent, post-refinement sampling and the absence of a material-lightening path.
 * @evidence contracts/performance.md#efficient-algorithms F region records become fixed-size field records once; the shared compiler adds O(F log F) sorting and O(F) per refined reference-point sample, with no independently painted vertex or texture population.
 * @evidence contracts/performance.md#reuse-equivalent-work Copied regions and landmark centres compile into one reusable field sampler; changed reference geometry or region values require recompilation rather than deriving colour centres from performed positions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned sampler owns O(F) copied field data and keeps no mutable host pointer; temporary region records are collectible and failed compilation changes no caller host or region.
 */
export function createPortraitSkinColour(
  host: IPortraitComponentHost,
  input: readonly IPortraitSkinColourRegion[],
): (reference: readonly number[]) => number[] {
  const regions: readonly IPortraitSkinColourRegion[] = structuredClone(input);
  const point: (id: number) => readonly number[] = (
    id: number,
  ): readonly number[] => {
    const p: number[] = host.positions[id];
    if (p === undefined || p.length !== 3 || !p.every(Number.isFinite))
      throw new Error("Skin colour requires a finite reference landmark.");
    return p;
  };
  const breadth: number = Math.abs(point(454)[0] - point(234)[0]);
  if (!(breadth > 0))
    throw new Error("Skin colour needs a positive bizygomatic breadth.");
  const radius: number = extent * breadth;
  const fields: {
    name: PortraitSkinColourSite;
    center: [number, number, number];
    radius: [number, number, number];
    gain: [number, number, number];
    strength: number;
  }[] = regions.map(
    (
      r: IPortraitSkinColourRegion,
    ): {
      name: PortraitSkinColourSite;
      center: [number, number, number];
      radius: [number, number, number];
      gain: [number, number, number];
      strength: number;
    } => {
      if (!Object.hasOwn(landmarks, r.site))
        throw new Error("Skin colour needs one of the named skin sites.");
      const id: number = landmarks[r.site];
      if (r.gain.some((value: number): boolean => value > 1))
        throw new Error("Skin colour region gains lie in [0,1].");
      return {
        name: r.site,
        center: [...point(id)] as [number, number, number],
        radius: [radius, radius, radius] as [number, number, number],
        gain: r.gain,
        strength: r.strength,
      };
    },
  );
  return createPortraitColourField(fields);
}
