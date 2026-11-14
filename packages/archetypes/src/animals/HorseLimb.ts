import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { createHorse } from "./createHorse";
import { rideHorse } from "./rideHorse";

/**
 * A horse's limb posed from where its hoof is wanted: the planar two-link solution `rideHorse` poses every limb with.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what it solves and who reads it.
 * @evidence contracts/development/design.md#principled-representation A limb's five joints in its own fore-and-aft plane.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one solver `rideHorse` calls, kept apart so the ride stays readable.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace HorseLimb {
  /**
   * One limb's joints with its hoof at a place: the planar two-link solution, the three lower bones held as one piece folded at the carpus or the hock.
   *
   * @param rest The limb's five rest joints, from the top down.
   * @param fore Whether it is a fore limb, whose elbow stays behind; a hind limb's stifle stays in front.
   * @param z Where the hoof is wanted along the model's Z, metres.
   * @param y How high the hoof is wanted above the model's ground, metres.
   * @param fold How far the carpus or the hock folds beyond its standing angle, degrees.
   * @returns The five joints, in the limb's own fore-and-aft plane.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs' units and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The lower piece's shape from the standing angles and the fold, then the triangle of the upper bone, that piece and the line to the hoof by the law of cosines, the elbow kept behind and the stifle in front; the top joint follows the hoof by `rideHorse.FOLLOW`'s share.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The piece, the triangle, the joints.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A hoof beyond reach draws the top joint along the trunk, so no bone stretches.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function solve(
    rest: readonly IAutoMovieVector3[],
    fore: boolean,
    z: number,
    y: number,
    fold: number,
  ): IAutoMovieVector3[] {
    const x: number = rest[0]!.x;
    const length = (k: number): number =>
      Vector3.length(Vector3.subtract(rest[k + 1]!, rest[k]!));
    const [a, b, c, e]: number[] = [length(0), length(1), length(2), length(3)];
    const stance: readonly number[] = fore
      ? createHorse.STANCE.fore
      : createHorse.STANCE.hind;
    const radians = (degrees: number): number => (degrees * Math.PI) / 180;

    // A direction in the plane by its angle from straight down toward the front, as [z, y].
    const along = (angle: number): [number, number] => [
      Math.sin(angle),
      -Math.cos(angle),
    ];
    const top: [number, number] = [
      rest[0]!.z +
        (fore ? rideHorse.FOLLOW.fore : rideHorse.FOLLOW.hind) * (z - rest[4]!.z),
      rest[0]!.y,
    ];

    // The lower piece from the elbow or stifle to the hoof, with the middle bone pointing straight down.
    const bend: number = radians(stance[2]! - stance[1]! + (fore ? -fold : fold));
    const slope: number = radians(stance[3]! - stance[2]!);
    const piece: [number, number] = [
      c! * along(bend)[0] + e! * along(bend + slope)[0],
      -b! + c! * along(bend)[1] + e! * along(bend + slope)[1],
    ];
    const lower: number = Math.hypot(piece[0], piece[1]);
    const offset: number = Math.atan2(piece[0], -piece[1]);

    // The triangle of the upper bone, the piece and the line to the hoof.
    // A hoof beyond the limb's reach draws the top joint along the trunk until it is within reach: the rest of the swing of the shoulder blade or the pelvis that the follow share leaves out.
    const most: number = a! + lower - 1e-6;
    const drop: number = y - top[1];
    let ahead: number = z - top[0];
    if (Math.hypot(ahead, drop) > most && Math.abs(drop) < most) {
      const within: number =
        Math.sign(ahead) * Math.sqrt(most * most - drop * drop);
      top[0] += ahead - within;
      ahead = within;
    }
    const want: [number, number] = [ahead, drop];
    const distance: number = Math.max(
      Math.abs(a! - lower) + 1e-6,
      Math.min(most, Math.hypot(want[0], want[1])),
    );
    const toward: number = Math.atan2(want[0], -want[1]);
    const corner: number = Math.acos(
      (a! * a! + distance * distance - lower * lower) / (2 * a! * distance),
    );
    const upper: number = toward + (fore ? -corner : corner);
    const hoof: [number, number] = [
      top[0] + distance * along(toward)[0],
      top[1] + distance * along(toward)[1],
    ];
    const elbow: [number, number] = [
      top[0] + a! * along(upper)[0],
      top[1] + a! * along(upper)[1],
    ];
    const middle: number =
      Math.atan2(hoof[0] - elbow[0], -(hoof[1] - elbow[1])) - offset;
    const wrist: [number, number] = [
      elbow[0] + b! * along(middle)[0],
      elbow[1] + b! * along(middle)[1],
    ];
    const fetlock: [number, number] = [
      wrist[0] + c! * along(middle + bend)[0],
      wrist[1] + c! * along(middle + bend)[1],
    ];
    return [top, elbow, wrist, fetlock, hoof].map(
      (p: [number, number]): IAutoMovieVector3 => Vector3.create(x, p[1], p[0]),
    );
  }
}
