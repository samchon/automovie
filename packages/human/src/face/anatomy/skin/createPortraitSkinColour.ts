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
