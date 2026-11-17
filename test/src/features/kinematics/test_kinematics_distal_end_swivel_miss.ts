import {
  DEFAULT_HUMANOID_ROM,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
  ROM_TOLERANCE,
  Vector3,
  distalEndSwivelMiss,
  jointToQuaternionOnBasis,
  normalizeJointAxes,
} from "@automovie/engine";
import type {
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieRestFrame,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * The least a wrist must miss a requested rotation by, read off where the
 * forearm points.
 *
 * Both hands, with the humanoid axes, rest frames and ranges. A forearm
 * direction in the requested hand rotation's frame is a unit vector on a
 * seeded circle of the unit sphere, as an elbow circling the
 * shoulder-to-wrist line gives it. The oracle poses the wrist itself: every
 * pair of angles on a 2 degree grid of its box (both ends of each interval
 * included) is composed by the rig's own joint composition, and the hand's
 * twist axis carried back by it is one direction the wrist can show; the
 * least angle from the asked direction to those is the miss the grid finds,
 * never less than the true one and within the grid's diagonal of it.
 *
 * Scenarios:
 * 1. At a swivel, the bound never exceeds the miss the grid finds, and lies
 *    within 1.5 degrees plus the joints' tolerance of it: 12 seeded circles
 *    a side, every 15 degrees.
 * 2. Over an interval, the bound never exceeds the miss the grid finds at
 *    any degree inside it: intervals 2 and 10 degrees wide at three seeded
 *    starts a circle.
 * 3. On each side some swivels are bounded at zero and some above it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the real bound and the real joint composition; a bound above a miss the wrist can show, or one that bounds nothing, fails with its side, circle and swivel.
 * @evidence contracts/development/testing.md#independent-expectations The oracle is the rig's own composition of the wrist's angles over its box, not the bound's spherical distance.
 * @evidence contracts/development/testing.md#distinguishing-cases Both sides' rest frames and signs, 12 seeded circles a side from great circles to small ones, swivels inside and outside the box, points and intervals.
 * @evidence contracts/development/testing.md#execution-ownership Seeded and in memory, about a second; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios with their inputs and the behaviour each pins.
 */
export function test_kinematics_distal_end_swivel_miss(): void {
  const random: () => number = seeded(20261117);
  const above: string[] = [];
  const loose: string[] = [];
  const wide: string[] = [];
  const mixed: string[] = [];
  for (const bone of ["leftHand", "rightHand"] as const) {
    const basis: IAutoMovieJointAxes = normalizeJointAxes(HUMANOID_JOINT_AXES[bone]!, "spec axes");
    const frame: IAutoMovieRestFrame | undefined = HUMANOID_REST_FRAME[bone];
    const constraint: IAutoMovieJointConstraint = DEFAULT_HUMANOID_ROM[bone]!;
    const handed: 1 | -1 =
      Vector3.dot(basis.twist, Vector3.cross(basis.flexion, basis.abduction)) >= 0 ? 1 : -1;
    const twist: IAutoMovieVector3 = Vector3.scale(basis.twist, handed);

    // Every direction the wrist can show on the grid of its box.
    const grid = (range: { min: number; max: number }): number[] => {
      const out: number[] = [];
      for (let angle: number = range.min; angle < range.max; angle += 2) out.push(angle);
      out.push(range.max);
      return out;
    };
    const shown: IAutoMovieVector3[] = [];
    for (const flexion of grid(constraint.flexion!))
      for (const abduction of grid(constraint.abduction!))
        shown.push(Quaternion.rotateVector(
          Quaternion.inverse(jointToQuaternionOnBasis({ flexion, abduction, twist: null }, basis, frame)),
          twist,
        ));
    const found = (d: IAutoMovieVector3): number => {
      let most: number = -1;
      for (const s of shown) most = Math.max(most, Vector3.dot(s, d));
      return Math.acos(Math.max(-1, Math.min(1, most))) / Quaternion.DEG2RAD;
    };

    let zero: number = 0;
    let positive: number = 0;
    for (let k: number = 0; k < 12; ++k) {
      const direction: (swivel: number) => IAutoMovieVector3 = circling(random);
      const bound: ((low: number, high: number) => number) | null = distalEndSwivelMiss({
        basis, frame, constraint, axis: twist, direction,
      });
      if (bound === null) { above.push(`${bone} circle ${k}: not applicable`); continue; }
      for (let swivel: number = 0; swivel < 360; swivel += 15) {
        const miss: number = found(direction(swivel));
        const least: number = bound(swivel, swivel);
        if (least > 0) ++positive; else ++zero;
        if (least > miss + 1e-9 && above.length < 10)
          above.push(`${bone} circle ${k} swivel ${swivel}: bound ${least} above the miss ${miss}`);
        if (miss - least > 1.5 + ROM_TOLERANCE && loose.length < 10)
          loose.push(`${bone} circle ${k} swivel ${swivel}: bound ${least} under the miss ${miss}`);
      }
      for (let i: number = 0; i < 3; ++i) {
        const low: number = Math.floor(random() * 360);
        for (const width of [2, 10]) {
          const least: number = bound(low, low + width);
          for (let swivel: number = low; swivel <= low + width; ++swivel) {
            const miss: number = found(direction(swivel));
            if (least > miss + 1e-9 && wide.length < 10)
              wide.push(`${bone} circle ${k} from ${low} over ${width}: bound ${least} above the miss ${miss} at ${swivel}`);
          }
        }
      }
    }
    if (zero === 0 || positive === 0) mixed.push(`${bone}: zero ${zero}, positive ${positive}`);
  }
  TestValidator.equals("the bound never exceeds a miss the wrist can show", above, []);
  TestValidator.equals("the bound lies within the grid of the miss", loose, []);
  TestValidator.equals("an interval's bound never exceeds a miss inside it", wide, []);
  TestValidator.equals("each wrist bounds some swivels at zero and some above", mixed, []);
}

/** A unit direction on a seeded circle of the unit sphere, by swivel in degrees. */
function circling(random: () => number): (swivel: number) => IAutoMovieVector3 {
  const axis: IAutoMovieVector3 = Vector3.normalize({ x: random() - 0.5, y: random() - 0.5, z: random() - 0.5 });
  const seed: IAutoMovieVector3 = Vector3.normalize({ x: random() - 0.5, y: random() - 0.5, z: random() - 0.5 });
  const u: IAutoMovieVector3 = Vector3.normalize(Vector3.subtract(seed, Vector3.scale(axis, Vector3.dot(seed, axis))));
  const v: IAutoMovieVector3 = Vector3.cross(axis, u);
  const along: number = 2 * random() - 1;
  const radius: number = Math.sqrt(1 - along * along);
  return (swivel: number): IAutoMovieVector3 => {
    const angle: number = swivel * Quaternion.DEG2RAD;
    return Vector3.add(
      Vector3.scale(axis, along),
      Vector3.add(Vector3.scale(u, radius * Math.cos(angle)), Vector3.scale(v, radius * Math.sin(angle))),
    );
  };
}

/** A seeded uniform generator on [0, 1) (mulberry32). */
function seeded(seed: number): () => number {
  let state: number = seed >>> 0;
  return (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t: number = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
