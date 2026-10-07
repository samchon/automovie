import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import { readHumanEarLength } from "./readHumanEarLength";

/**
 * Read an auricle's inclination, in degrees: "Ear angulation is considered as
 * the angle formed between Super-Aurale (Sup-Au), Sub-Aurale (Sba) and
 * Otobasion Superious (Obs)" (Meleti Venkata Sowmya et al., J Oral Biol
 * Craniofac Res 2023, PMC10432210, study variable 7; 400 selected OPD
 * participants imaged with VECTRA H2 in northern India). No population
 * angle is substituted. Superaurale and subaurale are the named ear area's
 * highest and lowest points (`readHumanEarLength`) and `otobasionSuperius` is
 * the registered landmark. The sentence names three points; the angle is read
 * at the middle-named point, subaurale, a stated convention. A missing or
 * misplaced area refuses by name, and coincident or non-finite angle
 * directions refuse instead of yielding a measured NaN.
 *
 * @evidence contracts/common.md#principled-implementation The two auricle ends are found on each skin; the attachment point is a registered landmark.
 * @evidence contracts/common.md#clear-and-simple-design One angle between two directions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing area refuses; the vertex choice is a documented convention.
 * @evidence contracts/common.md#meaningful-documentation States the protocol sentence, the three points, the vertex convention and the refusal.
 * @evidence contracts/modeling.md#spatial-conventions An angle in degrees between directions of the head frame.
 * @evidence contracts/anatomy.md#anatomical-source Follows the cited 3D auricle study's angulation.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing; its reading carries the points a render marks.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function readHumanEarInclination(head: IAutoMovieHumanHeadSkin, region: string, otobasionSuperius: IAutoMovieVector3): number {
  const { superaurale, subaurale } = readHumanEarLength(head, region).points;
  const a = [superaurale.x - subaurale.x, superaurale.y - subaurale.y, superaurale.z - subaurale.z];
  const b = [otobasionSuperius.x - subaurale.x, otobasionSuperius.y - subaurale.y, otobasionSuperius.z - subaurale.z];
  const denominator = Math.hypot(...a) * Math.hypot(...b);
  if (!Number.isFinite(denominator) || denominator === 0) throw new Error(`The auricle inclination of ${head.id} has no finite angle directions.`);
  const cos = (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / denominator;
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}
