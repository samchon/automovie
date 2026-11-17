import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanBend,
  AutoMovieMotionHumanDrinkingArm,
  AutoMovieMotionHumanDrinkingSwivel,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";

/**
 * An elbow hint bounded into the drinking range on its swivel circle
 * (`AutoMovieMotionHumanDrinkingSwivel.bounded`), on the average man in the
 * quiet stance, the right arm, the hanging arm's hint, and wrist places on a
 * grid ahead of the right shoulder: 0.1 to 0.4 m ahead, 0.25 m below to 0.15
 * m above, 0.15 m inward to 0.05 m outward, every 0.05 m.
 *
 * Scenarios, at every wrist place the arm reaches:
 * 1. A moved hint lies on the circle the wrist leaves the elbow, the upper
 *    arm's length from the shoulder and the forearm's from the wrist within
 *    1e-9 m, and its shoulder reads inside the range by the source's measure
 *    (`AutoMovieMotionHumanDrinkingArm.measured`) within 1e-6 degrees, at
 *    its edge or the swivel's resolution inside it (0.0062 degrees of
 *    swivel, the width a fit keeps a hint's swivel to), where the bound
 *    stands a moved hint so that the fitted elbow lands inside: the greater
 *    excess over `FLEXION` and `ABDUCTION` is 0 within 1e-6 at the hint or
 *    at the elbow that resolution along the circle from it.
 * 2. A kept hint is the hint itself, and the elbow at its swivel reads
 *    inside the range within 1e-6 degrees, or no swivel of the circle does
 *    (read every degree).
 * 3. Both cases occur on the grid.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public bound and reads the shoulder by the drinking arm's own measure; a hint moved off the circle, out of the range or short of its edge, or a hint kept out of a range the circle reaches, fails with its place.
 * @evidence contracts/development/testing.md#independent-expectations The oracle is the source's measure on the elbow's points and the circle's two distances, not the bound's sinusoids.
 * @evidence contracts/development/testing.md#distinguishing-cases Places whose hint is moved and places whose hint is kept.
 * @evidence contracts/development/testing.md#execution-ownership In memory, about a second; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the body, the arm, the grid and the 3 scenarios with their bounds.
 */
export function test_motion_compose_drinking_swivel(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const posture: IAutoMovieMotionHumanPosture = stand.posture(
    body,
    { x: 0, y: 0, z: 0 },
    0,
  );
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    resolveHumanPosture(body, { ...posture, limbs: {} }),
  );
  const at = (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
    bones.get(bone)!.worldPosition;
  const distance = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const shoulder: IAutoMovieVector3 = at("rightUpperArm");
  const upper: number = distance(at("rightLowerArm"), shoulder);
  const lower: number = distance(at("rightHand"), at("rightLowerArm"));
  const hint: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
    body,
    posture,
    "right",
  );
  const bound: (
    point: IAutoMovieVector3,
    hint: IAutoMovieVector3,
  ) => IAutoMovieVector3 = AutoMovieMotionHumanDrinkingSwivel.bounded(
    body,
    posture,
    "right",
  );
  // How far an elbow's shoulder lies past the range, degrees.
  const past = (elbow: IAutoMovieVector3): number => {
    const read: { flexion: number; abduction: number } =
      AutoMovieMotionHumanDrinkingArm.measured(
        new Map<AutoMovieHumanoidBone, { worldPosition: IAutoMovieVector3 }>([
          ["rightUpperArm", { worldPosition: shoulder }],
          ["rightLowerArm", { worldPosition: elbow }],
          ["rightUpperLeg", { worldPosition: at("rightUpperLeg") }],
        ]),
        "right",
        posture.yaw,
      );
    return Math.max(
      read.flexion - AutoMovieMotionHumanDrinkingArm.FLEXION,
      read.abduction - AutoMovieMotionHumanDrinkingArm.ABDUCTION,
    );
  };
  // The elbow on a wrist's circle at a swivel from the hint's side, degrees.
  const circle = (
    wrist: IAutoMovieVector3,
  ): ((swivel: number) => IAutoMovieVector3) => {
    const reach: IAutoMovieVector3 = {
      x: wrist.x - shoulder.x,
      y: wrist.y - shoulder.y,
      z: wrist.z - shoulder.z,
    };
    const d: number = Math.hypot(reach.x, reach.y, reach.z);
    const n: IAutoMovieVector3 = {
      x: reach.x / d,
      y: reach.y / d,
      z: reach.z / d,
    };
    const foot: number = (upper * upper - lower * lower + d * d) / (2 * d);
    const r: number = Math.sqrt(upper * upper - foot * foot);
    const h: IAutoMovieVector3 = {
      x: hint.x - shoulder.x,
      y: hint.y - shoulder.y,
      z: hint.z - shoulder.z,
    };
    const along: number = h.x * n.x + h.y * n.y + h.z * n.z;
    const raw: IAutoMovieVector3 = {
      x: h.x - n.x * along,
      y: h.y - n.y * along,
      z: h.z - n.z * along,
    };
    const size: number = Math.hypot(raw.x, raw.y, raw.z);
    const u: IAutoMovieVector3 = {
      x: raw.x / size,
      y: raw.y / size,
      z: raw.z / size,
    };
    const v: IAutoMovieVector3 = {
      x: n.y * u.z - n.z * u.y,
      y: n.z * u.x - n.x * u.z,
      z: n.x * u.y - n.y * u.x,
    };
    return (swivel: number): IAutoMovieVector3 => {
      const a: number = (swivel * Math.PI) / 180;
      return {
        x:
          shoulder.x + n.x * foot + r * (u.x * Math.cos(a) + v.x * Math.sin(a)),
        y:
          shoulder.y + n.y * foot + r * (u.y * Math.cos(a) + v.y * Math.sin(a)),
        z:
          shoulder.z + n.z * foot + r * (u.z * Math.cos(a) + v.z * Math.sin(a)),
      };
    };
  };

  // The width a fit keeps a hint's swivel to, degrees (the engine's
  // `hingedArmSwivel.RESOLUTION`: a two-degree bracket shrunk by the golden
  // ratio until it is within the joints' tolerance of 0.01 degrees).
  const GOLDEN: number = (Math.sqrt(5) - 1) / 2;
  const RESOLUTION: number =
    2 * GOLDEN ** Math.ceil(Math.log(0.01 / 2) / Math.log(GOLDEN));
  let moved: number = 0;
  let kept: number = 0;
  for (let ahead: number = 0.1; ahead <= 0.4 + 1e-9; ahead += 0.05)
    for (let up: number = -0.25; up <= 0.15 + 1e-9; up += 0.05)
      for (let out: number = -0.15; out <= 0.05 + 1e-9; out += 0.05) {
        // The right arm's outward is the body's -X; it faces +Z.
        const wrist: IAutoMovieVector3 = {
          x: shoulder.x - out,
          y: shoulder.y + up,
          z: shoulder.z + ahead,
        };
        const d: number = distance(wrist, shoulder);
        if (!(d < upper + lower) || !(d > Math.abs(upper - lower))) continue;
        const where: string = `wrist (${ahead.toFixed(2)} ahead, ${up.toFixed(2)} up, ${out.toFixed(2)} out)`;
        const result: IAutoMovieVector3 = bound(wrist, hint);
        if (result !== hint) {
          moved++;
          // 1. A moved hint.
          TestValidator.predicate(
            `${where}: the moved hint lies on the elbow's circle`,
            nclose(distance(result, shoulder), upper, 1e-9) &&
              nclose(distance(result, wrist), lower, 1e-9),
          );
          // The hint's swivel on the circle, read off the circle's own points,
          // and the elbow the swivel's resolution to either side of it.
          const on: (swivel: number) => IAutoMovieVector3 = circle(wrist);
          const centre: IAutoMovieVector3 = {
            x: (on(0).x + on(180).x) / 2,
            y: (on(0).y + on(180).y) / 2,
            z: (on(0).z + on(180).z) / 2,
          };
          const along = (to: IAutoMovieVector3): number =>
            (result.x - centre.x) * (to.x - centre.x) +
            (result.y - centre.y) * (to.y - centre.y) +
            (result.z - centre.z) * (to.z - centre.z);
          const swivel: number =
            (Math.atan2(along(on(90)), along(on(0))) * 180) / Math.PI;
          const edge: number = Math.min(
            Math.abs(past(result)),
            Math.abs(past(on(swivel - RESOLUTION))),
            Math.abs(past(on(swivel + RESOLUTION))),
          );
          TestValidator.predicate(
            `${where}: the moved hint's shoulder is inside the range (${past(result).toFixed(6)} degrees past it), at its edge or the swivel's resolution inside it (${edge.toExponential(2)} degrees from the edge there)`,
            past(result) <= 1e-6 && edge <= 1e-6,
          );
        } else {
          kept++;
          // 2. A kept hint.
          const on: (swivel: number) => IAutoMovieVector3 = circle(wrist);
          const reaches: boolean = Array.from(
            { length: 360 },
            (_: unknown, k: number): number => past(on(k)),
          ).some((excess: number): boolean => excess <= 0);
          TestValidator.predicate(
            `${where}: the kept hint's swivel is inside the range, or no swivel is (${past(on(0)).toFixed(6)} degrees past it)`,
            past(on(0)) <= 1e-6 || !reaches,
          );
        }
      }
  // 3. Both cases.
  TestValidator.predicate(
    `both cases occur (${moved} moved, ${kept} kept)`,
    moved > 0 && kept > 0,
  );
}
