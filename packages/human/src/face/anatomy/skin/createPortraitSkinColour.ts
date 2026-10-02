import type { IPortraitComponentHost } from "../../surface/structures/IPortraitComponentHost";
import { createPortraitColourField } from "./createPortraitColourField";
import {
  type IPortraitSkinColourRegion,
  type PortraitSkinColourSite,
} from "./structures/IPortraitSkinColourRegion";

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
const extent = 0.2;

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
 * @evidence contracts/common.md#principled-implementation Sites resolve to fixed landmarks of the basis and one shared support scaled by the host's own breadth, then the compact kernel of createPortraitColourField weights each gain; sampling on reference coordinates keeps the colour from sliding with expression.
 * @evidence contracts/common.md#clear-and-simple-design It resolves a closed site set to fields and delegates sampling to createPortraitColourField.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is named; an unknown or repeated site, a missing or nonfinite landmark and a gain above one refuse.
 * @evidence contracts/common.md#meaningful-documentation States the site landmarks through the site type, the support rule, the ordering rule, the gain limit and the unit.
 * @evidence contracts/modeling.md#spatial-conventions Head-frame millimetres for the host and the sampled points; gains are linear RGB.
 * @evidence contracts/anatomy.md#parametric-authority Every input is a named skin site with linear gains and a strength; no input addresses a vertex, offsets a centre or sets a radius, and the site landmarks and the support fraction are fixed by the basis and this owner.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It compiles a colour function and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines and consumes no parameter channel of a form; the sites are colour envelopes.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It constructs no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation It owns no displayed part; the skin part that samples it is observed by its owner.
 */
export function createPortraitSkinColour(
  host: IPortraitComponentHost,
  input: readonly IPortraitSkinColourRegion[],
): (reference: readonly number[]) => number[] {
  const regions = structuredClone(input);
  const point = (id: number): readonly number[] => {
    const p = host.positions[id];
    if (p === undefined || p.length !== 3 || !p.every(Number.isFinite))
      throw new Error("Skin colour requires a finite reference landmark.");
    return p;
  };
  const breadth = Math.abs(point(454)[0] - point(234)[0]);
  if (!(breadth > 0))
    throw new Error("Skin colour needs a positive bizygomatic breadth.");
  const radius = extent * breadth;
  const fields = regions.map((r) => {
    if (!Object.hasOwn(landmarks, r.site))
      throw new Error("Skin colour needs one of the named skin sites.");
    const id = landmarks[r.site];
    if (r.gain.some((value) => value > 1))
      throw new Error("Skin colour region gains lie in [0,1].");
    return {
      name: r.site,
      center: [...point(id)] as [number, number, number],
      radius: [radius, radius, radius] as [number, number, number],
      gain: r.gain,
      strength: r.strength,
    };
  });
  return createPortraitColourField(fields);
}
