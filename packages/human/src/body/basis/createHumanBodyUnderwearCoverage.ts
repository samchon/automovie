import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyUnderwearCoverageProps } from "../structures/IAutoMovieHumanBodyUnderwearCoverageProps";
import { humanSkinLandmark } from "../../common/basis/humanSkinLandmark";

/**
 * The coverage field of a garment style on the body at rest: a signed
 * distance-like value in metres, positive where the garment covers the skin.
 *
 * The field is read on the body at rest (the document's shape without its
 * pose), so the garment's edges stay on the same skin whatever the pose, and
 * it is built from the table's landmark rules (`HUMAN_BODY_UNDERWEAR`):
 *
 * - **Briefs.** Below the waistband height (a fraction from the pelvis up to
 *   the lumbar landmark) and above the leg line. The line is read against the
 *   hip joints: their mean height, depth and half distance, and the thighs'
 *   mean hip-to-knee length. Within the gusset (a distance from the midline,
 *   X against the pelvis) it stands at the crotch depth below the hip joints;
 *   from there it runs linearly to the outer hip's depth at the outer
 *   distance and holds it beyond, so the front view is the brief's V or, with
 *   equal depths, the boxer's hem. The outer depth blends from the back value
 *   to the front value as the vertex's depth runs from half the hips' half
 *   distance behind the hip joints to as far in front, so the back covers the
 *   buttock.
 * - **Bra** (`bra-and-briefs` only). A band from under the breasts (a fraction
 *   from the nipple down to the lower chest) to an upper edge a fraction up
 *   toward the clavicle, higher in front than behind: the edge blends by depth
 *   from the back (at the chest landmark's depth or behind) to the front (at
 *   the nipple's depth or ahead). A strap on each side (a band in X around a
 *   fraction from the clavicle out to the shoulder) runs from the band over the
 *   shoulder. The nipple is one skin vertex of one surface, the skin landmark
 *   the bust girth is measured at and not a modelled feature; the body is taken
 *   to be symmetric about the pelvis, so its height and depth serve both sides.
 * - **Arms.** A vertex of which half its skin weight is `arm` (the weight on
 *   the table's uncovered bones and their descendants) is outside: the term is
 *   `0.5 - arm`, a metre per unit of weight, steep enough never to bind
 *   elsewhere, so the bra's arm holes follow the arm's skin and not a plane.
 *
 * Coordinates are metres in the basis frame (+Y up, +Z front, +X the body's
 * left). A missing landmark, or a nipple vertex outside its surface when the
 * style reads it, refuses with the name. The fractions are convention set by
 * rendering, not measured from a garment standard.
 *
 * @evidence contracts/common.md#principled-implementation Every edge is an explicit rule on shaped landmarks, so the field scales with the body it is read on; each piece is a signed distance-like value whose zero is the edge and whose sign is inside, so the minimum of the pieces is the intersection and the maximum the union, and the arm term is steep enough never to bind away from the arm. The rules are convention (a blocking-pass costume), stated as such in the table, not a garment standard.
 * @evidence contracts/common.md#clear-and-simple-design One responsibility: turn the landmark rules into a field over a point and its arm weight. The clipping of triangles by the field and the lift belong to their own files.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the table's rules and the document's landmarks enter; no vertex list, body or fixture is named, and the nipple is the basis's named skin point read from the rest skin.
 * @evidence contracts/common.md#meaningful-documentation The comment states every piece of the field, its frame and its sign, what the nipple is and is not, the arm term and the refusals.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function is a field and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry, only a field value.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The fractions are costume convention, and the landmarks are the basis's own; the function carries no anatomical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a human form through this function; the style is a closed choice.
 */
export function createHumanBodyUnderwearCoverage(props: IAutoMovieHumanBodyUnderwearCoverageProps): (x: number, y: number, z: number, arm: number) => number {
  const { table, style, basis, rest } = props;
  const landmark = (id: string): IAutoMovieVector3 => {
    const found = rest.landmarks[id];
    if (found === undefined)
      throw new Error("Body underwear needs the landmark " + id + ".");
    return found;
  };
  const names = table.landmarks;
  const pelvis = landmark(names.pelvis);
  const briefs = table.briefs[style];
  const waist = pelvis.y + briefs.waist * (landmark(names.lumbar).y - pelvis.y);
  // the hip joints' mean height and depth, their half distance and the
  // thighs' mean length
  const hips = [landmark(names.hips.left), landmark(names.hips.right)];
  const knees = [landmark(names.knees.left), landmark(names.knees.right)];
  const hipY = (hips[0].y + hips[1].y) / 2;
  const hipZ = (hips[0].z + hips[1].z) / 2;
  const half = Math.abs(hips[0].x - hips[1].x) / 2;
  const thigh =
    hips
      .map((hip, k) =>
        Math.hypot(
          knees[k].x - hip.x,
          knees[k].y - hip.y,
          knees[k].z - hip.z,
        ),
      )
      .reduce((sum, length) => sum + length, 0) / 2;
  const clamp = (value: number) => Math.min(1, Math.max(0, value));
  // the leg line's height: at the crotch within the gusset, rising (or
  // falling) linearly to the outer hip's height by the outer distance, that
  // height blended from the back to the front over the hip joints' depth
  const legLine = (x: number, z: number) => {
    const outer =
      briefs.back +
      (briefs.front - briefs.back) * clamp(0.5 + (z - hipZ) / half);
    const across = clamp(
      (Math.abs(x - pelvis.x) - briefs.gusset * half) /
        ((briefs.outer - briefs.gusset) * half),
    );
    return hipY - thigh * (briefs.crotch + (outer - briefs.crotch) * across);
  };
  const bra =
    style === "bra-and-briefs"
      ? (() => {
          const rule = table.bra;
          // admitted with the basis, so the named point is a vertex of its surface
          const { surface, vertex } = humanSkinLandmark(basis, rule.nipple);
          const nipple = rest.surfaces[surface].slice(vertex * 3, vertex * 3 + 3);
          const clavicle = landmark(names.clavicle);
          const shoulder = landmark(names.shoulder);
          const chest = landmark(names.lowerChest);
          const up = clavicle.y - nipple[1];
          const reach = Math.abs(shoulder.x - clavicle.x);
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
  return (x, y, z, arm) => {
    let inside = Math.min(waist - y, y - legLine(x, z));
    if (bra !== null) {
      const front = clamp(
        (z - bra.backDepth) / (bra.frontDepth - bra.backDepth),
      );
      const top = bra.back + (bra.front - bra.back) * front;
      const band = Math.min(y - bra.bottom, top - y);
      const strap = Math.min(
        y - bra.bottom,
        bra.strapHalfWidth - Math.abs(Math.abs(x - pelvis.x) - bra.strap),
      );
      inside = Math.max(inside, band, strap);
    }
    return Math.min(inside, 0.5 - arm);
  };
}
