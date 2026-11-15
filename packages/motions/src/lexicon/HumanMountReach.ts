import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanMountRider } from "./HumanMountRider";

/**
 * How far a seated rider leans the trunk forward to reach what the hands
 * hold (`HumanMountRider.lean`), in closed form: flexing the spine turns
 * everything above it about the spine joint's flexion axis, so each
 * shoulder runs on a circle read from three forward-kinematics passes, and
 * the least flexion bringing a point within reach is where the arc of reach
 * is first entered.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is solved, how, and who reads it.
 * @evidence contracts/development/design.md#principled-representation The solve apart from the rider's seated pose, its circle a record of its own.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function, read by the rider's lean and the ride's hands.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The arm's reach and the most lean are `HumanMountRider`'s.
 */
export namespace HumanMountReach {
  /**
   * How far a seated rider leans the trunk forward to reach what the hands
   * hold: the least flexion of the spine, up to `LEAN`, that brings each
   * shoulder within `ARM` of its arm's length of its point, as a cyclist
   * leans to the bar and a fixed-seat rower to the catch.
   *
   * Flexing the spine turns everything above it rigidly about the spine
   * joint's flexion axis, a line fixed in the world while the other angles
   * hold (`jointToQuaternion` applies flexion innermost), so each shoulder
   * runs on a circle: `s(θ) = a + b cos θ + c sin θ`, with `b` and `c` of
   * one length and at right angles. The three vectors are read once, from
   * the shoulder at three flexions by forward kinematics. A point's squared
   * distance from the shoulder is then `K + B cos θ + C sin θ`, and the least
   * flexion bringing it within the arm's reach is a closed-form arccos root,
   * so a reach that follows a moving grip costs no forward kinematics per
   * instant.
   *
   * @param body The body.
   * @param seated The seated posture.
   * @param sides The holding hands.
   * @returns For what each hand holds, world metres in the seated posture's frame, the degrees of spine flexion to add: 0 when the arms reach as seated, `LEAN` when they do not even then.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is solved, why the shoulder runs on a circle, what is read once and both ends of the result.
   * @evidence contracts/development/implementation.md#principled-implementation A rotation about a fixed axis moves a point on a circle, so the distance to a fixed point is an exact sinusoid in the angle and its threshold crossing is an arccos root; the circle's vectors are solved from three exact forward-kinematics readings.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The circles once, then one root per hand per point set.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Points the arms do not reach at `LEAN` leave the hands short, which the contact audit reports; only the spine flexes, and the pelvis's roll forward that carries most of a rower's or a cyclist's tilt (Agius et al. 2023, Bioengineering 10:774, section 4.1) is not modelled.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three forward-kinematics passes per plan, then constant work per instant and hand.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The circles are read once and shared by every instant of the ride.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned function holds six vectors and two lengths per hand.
   */
  export function reach(
    body: IHumanBody,
    seated: IHumanPosture,
    sides: readonly ("left" | "right")[],
  ): (points: Partial<Record<"left" | "right", IAutoMovieVector3>>) => number {
    // The shoulders at three flexions, 0, half and the whole of `LEAN`.
    const angles: readonly [number, number, number] = [0, HumanMountRider.LEAN / 2, HumanMountRider.LEAN];
    const read: ReturnType<typeof poseBones>[] = angles.map(
      (degrees: number): ReturnType<typeof poseBones> =>
        poseBones(
          body,
          resolveHumanPosture(body, { ...HumanMountRider.leant(seated, degrees), limbs: {} }),
        ),
    );
    const circles: Map<"left" | "right", ICircle> = new Map(
      sides.map((side: "left" | "right"): ["left" | "right", ICircle] => {
        const at = (k: number): IAutoMovieVector3 =>
          read[k]!.get(`${side}UpperArm`)!.worldPosition;
        const elbow: IAutoMovieVector3 = read[0]!.get(
          `${side}LowerArm`,
        )!.worldPosition;
        const wrist: IAutoMovieVector3 = read[0]!.get(
          `${side}Hand`,
        )!.worldPosition;
        return [
          side,
          {
            ...circle(
              angles.map((d: number): number => (d * Math.PI) / 180) as [
                number,
                number,
                number,
              ],
              [at(0), at(1), at(2)],
            ),
            reach:
              HumanMountRider.ARM *
              (Vector3.length(Vector3.subtract(elbow, at(0))) +
                Vector3.length(Vector3.subtract(wrist, elbow))),
          },
        ];
      }),
    );
    const most: number = (HumanMountRider.LEAN * Math.PI) / 180;
    return (
      points: Partial<Record<"left" | "right", IAutoMovieVector3>>,
    ): number => {
      let needed: number = 0;
      for (const [side, c] of circles) {
        const point: IAutoMovieVector3 | undefined = points[side];
        if (point === undefined) continue;
        const off: IAutoMovieVector3 = Vector3.subtract(c.a, point);
        const k: number =
          Vector3.dot(off, off) + Vector3.dot(c.b, c.b) - c.reach * c.reach;
        const cb: number = 2 * Vector3.dot(off, c.b);
        const cs: number = 2 * Vector3.dot(off, c.c);

        // Within reach where k + h cos(θ - phase) <= 0: on the arc from
        // phase + acos(-k / h) round to phase - acos(-k / h). Out of reach at
        // 0, the arc is first entered at its start.
        if (k + cb <= 0) continue;
        const h: number = Math.hypot(cb, cs);
        if (h <= 0 || -k / h < -1) return HumanMountRider.LEAN;
        const phase: number = Math.atan2(cs, cb);
        const start: number = phase + Math.acos(Math.min(1, -k / h));
        const first: number =
          ((start % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        if (first > most) return HumanMountRider.LEAN;
        needed = Math.max(needed, (first * 180) / Math.PI);
      }
      return needed;
    };
  }

  /** A shoulder's circle under the spine's flexion, `a + b cos θ + c sin θ`, world metres, and the arm's reach, metres. */
  interface ICircle {
    /** The circle's centre. */
    a: IAutoMovieVector3;

    /** Its cosine radius. */
    b: IAutoMovieVector3;

    /** Its sine radius. */
    c: IAutoMovieVector3;

    /** The share `ARM` of the arm's length, shoulder to wrist. */
    reach: number;
  }

  /**
   * The circle `a + b cos θ + c sin θ` through three points at three angles:
   * per coordinate, the 3 by 3 linear system of the samples, solved by
   * Cramer's rule.
   *
   * @param angles The three angles, radians, distinct.
   * @param points The points at them.
   * @returns The circle's vectors.
   */
  function circle(
    angles: readonly [number, number, number],
    points: readonly [IAutoMovieVector3, IAutoMovieVector3, IAutoMovieVector3],
  ): Omit<ICircle, "reach"> {
    const rows: [number, number, number][] = angles.map(
      (t: number): [number, number, number] => [1, Math.cos(t), Math.sin(t)],
    );
    const det = (m: readonly (readonly number[])[]): number =>
      m[0]![0]! * (m[1]![1]! * m[2]![2]! - m[1]![2]! * m[2]![1]!) -
      m[0]![1]! * (m[1]![0]! * m[2]![2]! - m[1]![2]! * m[2]![0]!) +
      m[0]![2]! * (m[1]![0]! * m[2]![1]! - m[1]![1]! * m[2]![0]!);
    const whole: number = det(rows);
    const solve = (axis: "x" | "y" | "z"): [number, number, number] =>
      [0, 1, 2].map(
        (column: number): number =>
          det(
            rows.map((row: [number, number, number], i: number): number[] =>
              row.map((v: number, j: number): number =>
                j === column ? points[i]![axis] : v,
              ),
            ),
          ) / whole,
      ) as [number, number, number];
    const x: [number, number, number] = solve("x");
    const y: [number, number, number] = solve("y");
    const z: [number, number, number] = solve("z");
    return {
      a: { x: x[0], y: y[0], z: z[0] },
      b: { x: x[1], y: y[1], z: z[1] },
      c: { x: x[2], y: y[2], z: z[2] },
    };
  }
}
