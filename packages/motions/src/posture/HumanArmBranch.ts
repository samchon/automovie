import { ROM_TOLERANCE } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";

/**
 * A shoulder's clinical triple on the reading nearest another triple.
 *
 * Three clinical angles name a rotation twice over: turning one of them to
 * its supplement and the other two by a half turn names the same rotation.
 * A decode taken alone picks one of the two by the joint's ranges, so two
 * neighbouring rotations of a moving arm can be read on different ones, and
 * a reading whose angles then leave the range is clamped where it is shown:
 * measured on a drink over a held object, the shoulder read
 * (60.4, -42.1, -75.8) and then (119.7, 135.2, 102.8) degrees one sample
 * later, the same rotation within three degrees, and the elbow jumped
 * 104.78 mm. Of the readings that show the rotation itself
 * (`HumanArmGeometry.rotation`, which clamps as the display does), this
 * takes the one nearest the given triple.
 *
 * @param setup The arm.
 * @param shoulder The shoulder's rotation from its rest.
 * @param read Its clinical triple as decoded alone, degrees.
 * @param near The triple to stay near, degrees: the reading before it.
 * @returns The triple, `read` itself when no other reading shows the rotation nearer.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the double naming, why a lone decode changes reading, the measured jump and the choice made.
 * @evidence contracts/development/implementation.md#principled-implementation The supplement identity of a three-angle sequence is tried about each of the three angles, since the sequence's middle one is the rig's own; a candidate counts only when the displayed articulation of it is the rotation within the joints' resolution, and the nearest by wrapped angle differences is taken.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Four candidates, one test, one distance.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No rotation is changed and no range is widened: a candidate the display would clamp to another rotation is refused, and the lone decode stands when it alone shows the rotation.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most three displayed articulations beside the decode, constant work.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the setup's clamp and basis, the display's own; nothing is kept between calls.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one triple and retains nothing.
 */
export function HumanArmBranch(
  setup: G.ISetup,
  shoulder: IAutoMovieQuaternion,
  read: readonly [number, number, number],
  near: readonly [number, number, number],
): [number, number, number] {
  const shown: number = Math.cos((0.5 * ROM_TOLERANCE * Math.PI) / 180);
  let best: [number, number, number] = [read[0], read[1], read[2]];
  let least: number = apart(read, near);
  for (let middle: number = 0; middle < 3; middle++) {
    const other: [number, number, number] = [0, 0, 0];
    for (let k: number = 0; k < 3; k++)
      other[k] = wrap(k === middle ? 180 - read[k]! : read[k]! + 180);
    const distance: number = apart(other, near);
    if (!(distance < least)) continue;
    const made: IAutoMovieQuaternion = G.rotation(
      setup,
      setup.bones.upper,
      other,
    );
    const same: number =
      made.x * shoulder.x +
      made.y * shoulder.y +
      made.z * shoulder.z +
      made.w * shoulder.w;
    if (Math.abs(same) < shown) continue;
    best = other;
    least = distance;
  }
  return best;
}

/** An angle in (-180, 180], degrees. */
function wrap(angle: number): number {
  const turned: number = ((((angle + 180) % 360) + 360) % 360) - 180;
  return turned === -180 ? 180 : turned;
}

/** The sum of the squared wrapped differences of two triples. */
function apart(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
): number {
  let sum: number = 0;
  for (let k: number = 0; k < 3; k++) sum += wrap(a[k]! - b[k]!) ** 2;
  return sum;
}
