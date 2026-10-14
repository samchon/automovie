import type { IAutoMovieVector3 } from "@automovie/interface";

import { humanSkinLandmark } from "../../common/basis/humanSkinLandmark";
import type { IAutoMovieHumanBodyUnderwearCoverageProps } from "../structures/IAutoMovieHumanBodyUnderwearCoverageProps";

/**
 * The coverage field of a garment style on the body at rest: a signed distance-like value in metres, positive where the garment covers the skin.
 *
 * The field is read on the body at rest (the document's shape without its pose), so the garment's edges stay on the same skin whatever the pose, and it is built from the table's landmark rules (`HUMAN_BODY_UNDERWEAR`):
 *
 * - Briefs. Below the waistband height (a fraction from the pelvis up to the lumbar landmark) and above the leg line. The line is read against the hip joints: their mean height, depth and half distance, and the thighs' mean hip-to-knee length. Within the gusset (a distance from the midline, X against the pelvis) it stands at the crotch depth below the hip joints; from there it runs linearly to the outer hip's depth at the outer distance and holds it beyond, so the front view is the brief's V or, with equal depths, the boxer's hem. The outer depth blends from the back value to the front value as the vertex's depth runs from half the hips' half distance behind the hip joints to as far in front, so the back covers the buttock.
 * - Bra (`bra-and-briefs` only). A band from under the breasts (a fraction from the nipple down to the lower chest) to an upper edge a fraction up toward the clavicle, higher in front than behind: the edge blends by depth from the back (at the chest landmark's depth or behind) to the front (at the nipple's depth or ahead). A strap on each side (a band in X around a fraction from the clavicle out to the shoulder) runs from the band over the shoulder. The nipple is one skin vertex of one surface, the skin landmark the bust girth is measured at and not a modelled feature; the body is taken to be symmetric about the pelvis, so its height and depth serve both sides.
 * - Arms. A vertex of which half its skin weight is `arm` (the weight on the table's uncovered bones and their descendants) is outside: the term is `0.5 - arm`, a metre per unit of weight, steep enough never to bind elsewhere, so the bra's arm holes follow the arm's skin and not a plane.
 *
 * Coordinates are metres in the basis frame (+Y up, +Z front, +X the body's left). A missing landmark, or a nipple vertex outside its surface when the style reads it, refuses with the name. The fractions are convention set by rendering, not measured from a garment standard.
 *
 * @evidence contracts/common.md#principled-implementation Signed min/max combinations of source-rest landmark heights, hip/thigh dimensions and optional skin nipple location define style coverage, with uncovered influence excluding arm-dominated skin.
 * @evidence contracts/common.md#clear-and-simple-design Preparation resolves the fixed landmark rule into scalar boundaries, then one constant-cost field callback serves every native rest vertex.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing landmarks and invalid declared skin landmark references refuse; the symmetric authored costume rule is distance-like, not a measured garment fit or exact signed-distance/contact field.
 * @evidence contracts/common.md#meaningful-documentation Style boundaries, basis metre axes, rest-frame evaluation, symmetry, skin-weight exclusion and authored fractions are described.
 * @evidence contracts/performance.md#efficient-algorithms Preparation reads a fixed number of landmarks and two thigh lengths; each field sample performs bounded scalar interpolation and min/max operations without scanning geometry.
 * @evidence contracts/performance.md#reuse-equivalent-work Waist, hip/thigh and optional bra boundary scalars are calculated once for the requested shaped rest body and reused for all coverage samples.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The callback retains only boundary scalars and the referenced small rule/landmark values; it acquires no surface cache, external handle or pending work, and expires with its consumer.
 */
export function createHumanBodyUnderwearCoverage(
  props: IAutoMovieHumanBodyUnderwearCoverageProps,
): (x: number, y: number, z: number, arm: number) => number {
  const { table, style, basis, rest }: typeof props = props;
  const landmark: (id: string) => IAutoMovieVector3 = (
    id: string,
  ): IAutoMovieVector3 => {
    const found: IAutoMovieVector3 | undefined = rest.landmarks[id];
    if (found === undefined)
      throw new Error("Body underwear needs the landmark " + id + ".");
    return found;
  };
  const names: typeof table.landmarks = table.landmarks;
  const pelvis: IAutoMovieVector3 = landmark(names.pelvis);
  const briefs: (typeof table.briefs)[typeof style] = table.briefs[style];
  const waist: number =
    pelvis.y + briefs.waist * (landmark(names.lumbar).y - pelvis.y);
  // the hip joints' mean height and depth, their half distance and the
  // thighs' mean length
  const hips: IAutoMovieVector3[] = [
    landmark(names.hips.left),
    landmark(names.hips.right),
  ];
  const knees: IAutoMovieVector3[] = [
    landmark(names.knees.left),
    landmark(names.knees.right),
  ];
  const hipY: number = (hips[0].y + hips[1].y) / 2;
  const hipZ: number = (hips[0].z + hips[1].z) / 2;
  const half: number = Math.abs(hips[0].x - hips[1].x) / 2;
  const thigh: number =
    hips
      .map((hip: IAutoMovieVector3, k: number): number =>
        Math.hypot(knees[k].x - hip.x, knees[k].y - hip.y, knees[k].z - hip.z),
      )
      .reduce((sum: number, length: number): number => sum + length, 0) / 2;
  const clamp: (value: number) => number = (value: number): number =>
    Math.min(1, Math.max(0, value));
  // the leg line's height: at the crotch within the gusset, rising (or
  // falling) linearly to the outer hip's height by the outer distance, that
  // height blended from the back to the front over the hip joints' depth
  const legLine: (x: number, z: number) => number = (
    x: number,
    z: number,
  ): number => {
    const outer: number =
      briefs.back +
      (briefs.front - briefs.back) * clamp(0.5 + (z - hipZ) / half);
    const across: number = clamp(
      (Math.abs(x - pelvis.x) - briefs.gusset * half) /
        ((briefs.outer - briefs.gusset) * half),
    );
    return hipY - thigh * (briefs.crotch + (outer - briefs.crotch) * across);
  };
  const bra: {
    bottom: number;
    front: number;
    back: number;
    backDepth: number;
    frontDepth: number;
    strap: number;
    strapHalfWidth: number;
  } | null =
    style === "bra-and-briefs"
      ? ((): {
          bottom: number;
          front: number;
          back: number;
          backDepth: number;
          frontDepth: number;
          strap: number;
          strapHalfWidth: number;
        } => {
          const rule: typeof table.bra = table.bra;
          // admitted with the basis, so the named point is a vertex of its surface
          const { surface, vertex }: ReturnType<typeof humanSkinLandmark> =
            humanSkinLandmark(basis, rule.nipple);
          const nipple: number[] = rest.surfaces[surface].slice(
            vertex * 3,
            vertex * 3 + 3,
          );
          const clavicle: IAutoMovieVector3 = landmark(names.clavicle);
          const shoulder: IAutoMovieVector3 = landmark(names.shoulder);
          const chest: IAutoMovieVector3 = landmark(names.lowerChest);
          const up: number = clavicle.y - nipple[1];
          const reach: number = Math.abs(shoulder.x - clavicle.x);
          return {
            bottom: nipple[1] - rule.bottom * (nipple[1] - chest.y),
            front: nipple[1] + rule.front * up,
            back: nipple[1] + rule.back * up,
            backDepth: chest.z,
            frontDepth: nipple[2],
            strap: Math.abs(clavicle.x - pelvis.x) + rule.strap * reach,
            strapHalfWidth: rule.strapHalfWidth * reach,
          };
        })()
      : null;
  return (x: number, y: number, z: number, arm: number): number => {
    let inside: number = Math.min(waist - y, y - legLine(x, z));
    if (bra !== null) {
      const front: number = clamp(
        (z - bra.backDepth) / (bra.frontDepth - bra.backDepth),
      );
      const top: number = bra.back + (bra.front - bra.back) * front;
      const band: number = Math.min(y - bra.bottom, top - y);
      const strap: number = Math.min(
        y - bra.bottom,
        bra.strapHalfWidth - Math.abs(Math.abs(x - pelvis.x) - bra.strap),
      );
      inside = Math.max(inside, band, strap);
    }
    return Math.min(inside, 0.5 - arm);
  };
}
