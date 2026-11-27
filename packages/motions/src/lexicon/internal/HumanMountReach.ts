import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { HumanMountRider } from "./HumanMountRider";

/**
 * How far a seated rider leans the trunk forward to reach what the hands hold
 * (`HumanMountRider.lean`), in closed form: flexing the spine turns everything
 * above it about the spine joint's flexion axis, so each shoulder runs on a
 * circle read from three forward-kinematics passes, and the least flexion
 * bringing both points within reach is found on the intersection of the
 * reachable arcs.
 */
export namespace HumanMountReach {
  /**
   * How far a seated rider leans the trunk forward to reach what the hands
   * hold: the least flexion of the spine, up to `LEAN`, that brings each
   * shoulder within `ARM` of its arm's length of its point, as a cyclist leans
   * to the bar and a fixed-seat rower to the catch.
   *
   * Flexing the spine turns everything above it rigidly about the spine joint's
   * flexion axis, a line fixed in the world while the other angles hold
   * (`jointToQuaternion` applies flexion innermost), so each shoulder runs on a
   * circle: `s(θ) = a + b cos θ + c sin θ`, with `b` and `c` of one length and
   * at right angles. The three vectors are read once, from the shoulder at
   * three flexions by forward kinematics. A point's squared distance from the
   * shoulder is then `K + B cos θ + C sin θ`, and the least flexion bringing it
   * within the arm's reach is a closed-form arccos root, so a reach that
   * follows a moving grip costs no forward kinematics per instant.
   *
   * @param body The body.
   * @param seated The seated posture.
   * @param sides The holding hands.
   * @param bow The optional rotation about the seat or the hips in place of
   *   spine flexion.
   * @param span The bounds of that rotation, degrees from the entered posture.
   * @returns For the hand goals in the seated frame, the rotation nearest the
   *   entered posture that reaches both, or the least worst excess reach when
   *   the arcs do not overlap.
   */
  export function reach(
    body: IAutoMovieMotionHumanBody,
    seated: IAutoMovieMotionHumanPosture,
    sides: readonly AutoMovieHumanSide[],
    bow: (degrees: number) => IAutoMovieMotionHumanPosture = (
      degrees: number,
    ): IAutoMovieMotionHumanPosture => HumanMountRider.leant(seated, degrees),
    span: readonly [number, number] = [0, HumanMountRider.LEAN],
  ): (
    points: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>>,
  ) => number {
    if (sides.length === 0) return (): number => 0;
    // The shoulders at three flexions, 0, half and the whole of `LEAN`.
    const angles: readonly [number, number, number] = [
      0,
      HumanMountRider.LEAN / 2,
      HumanMountRider.LEAN,
    ];
    const read: ReturnType<typeof poseBones>[] = readSamples(
      body,
      bow,
      angles,
      sides,
    );
    const frame: ReturnType<typeof circle> = circle(
      angles.map((degrees: number): number => (degrees * Math.PI) / 180) as [
        number,
        number,
        number,
      ],
    );
    const circles: Map<AutoMovieHumanSide, ICircle> = new Map(
      sides.map((side: AutoMovieHumanSide): [AutoMovieHumanSide, ICircle] => {
        const at: (k: number) => IAutoMovieVector3 = (
          k: number,
        ): IAutoMovieVector3 => read[k]!.get(`${side}UpperArm`)!.worldPosition;
        const elbow: IAutoMovieVector3 = read[0]!.get(
          `${side}LowerArm`,
        )!.worldPosition;
        const wrist: IAutoMovieVector3 = read[0]!.get(
          `${side}Hand`,
        )!.worldPosition;
        return [
          side,
          {
            ...frame([at(0), at(1), at(2)]),
            reach:
              HumanMountRider.ARM *
              (Vector3.length(Vector3.subtract(elbow, at(0))) +
                Vector3.length(Vector3.subtract(wrist, elbow))),
          },
        ];
      }),
    );
    const least: number = (span[0] * Math.PI) / 180;
    const most: number = (span[1] * Math.PI) / 180;
    return (
      points: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>>,
    ): number => {
      const arms: IArc[] = [];
      for (const [side, c] of circles) {
        const point: IAutoMovieVector3 | undefined = points[side];
        if (point === undefined) continue;
        const off: IAutoMovieVector3 = Vector3.subtract(c.a, point);
        arms.push({
          k: Vector3.dot(off, off) + Vector3.dot(c.b, c.b) - c.reach * c.reach,
          cos: 2 * Vector3.dot(off, c.b),
          sin: 2 * Vector3.dot(off, c.c),
        });
      }
      const neutral: boolean = least <= 0 && most >= 0;
      if (neutral && arms.every((arm: IArc): boolean => arm.k + arm.cos <= 0))
        return 0;
      const candidates: number[] = neutral ? [0, least, most] : [least, most];
      const period: number = 2 * Math.PI;
      const add = (t: number): void => {
        const angle: number = t + period * Math.ceil((least - t) / period);
        if (angle <= most) candidates.push(angle);
      };
      const zeroes = (arc: IArc): void => {
        const amplitude: number = Math.hypot(arc.cos, arc.sin);
        if (amplitude === 0 || Math.abs(arc.k) > amplitude) return;
        const phase: number = Math.atan2(arc.sin, arc.cos);
        const t: number = Math.acos(-arc.k / amplitude);
        add(phase - t);
        add(phase + t);
      };
      // The maximum of the two excesses can turn only at a stationary
      // point of an arm or where the arms tie. Include the zeros to find
      // the nearest point inside their overlap (zero excess).
      for (const arc of arms) {
        zeroes(arc);
        const phase: number = Math.atan2(arc.sin, arc.cos);
        add(phase);
        add(phase + Math.PI);
      }
      if (arms.length > 1) {
        const [a, b] = arms as [IArc, IArc];
        zeroes({ k: a.k - b.k, cos: a.cos - b.cos, sin: a.sin - b.sin });
      }
      let best: number = 0;
      let gap: number = Infinity;
      for (const angle of candidates) {
        const sin: number = Math.sin(angle);
        const cos: number = Math.cos(angle);
        let excess: number = 0;
        for (const arm of arms) {
          // An arccos root is exact only to the square root of the machine
          // epsilon near the ends of its range, so a crossing found there
          // reads a residue of that size: within it the arm reaches, or the
          // crossing nearest the posture loses to a deep lean whose excess
          // is exactly none, for a single instant.
          const rounded: number =
            Math.sqrt(Number.EPSILON) *
            (Math.abs(arm.k) + Math.abs(arm.cos) + Math.abs(arm.sin));
          excess = Math.max(
            excess,
            arm.k + arm.cos * cos + arm.sin * sin - rounded,
          );
        }
        if (
          excess < gap ||
          (excess === gap && Math.abs(angle) < Math.abs(best))
        ) {
          best = angle;
          gap = excess;
        }
      }
      if (best === least) return span[0];
      if (best === most) return span[1];
      return (best * 180) / Math.PI;
    };
  }

  /** Squared distance in excess of the hand's reach along the shoulder arc. */
  interface IArc {
    k: number;
    cos: number;
    sin: number;
  }

  /**
   * The bones of the seated posture leant by each angle: the first resolution
   * reads the shoulders, elbows and wrists, the others the shoulders alone, all
   * through one forward-kinematics reader and one range-of-motion projector.
   */
  function readSamples(
    body: IAutoMovieMotionHumanBody,
    bow: (degrees: number) => IAutoMovieMotionHumanPosture,
    angles: readonly [number, number, number],
    sides: readonly AutoMovieHumanSide[],
  ): ReturnType<typeof poseBones>[] {
    const prepared: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const projection: ReturnType<typeof prepareHumanPostureProjection> =
      prepareHumanPostureProjection(body);
    const shoulders: Set<AutoMovieHumanoidBone> = new Set(
      sides.map(
        (side: AutoMovieHumanSide): AutoMovieHumanoidBone => `${side}UpperArm`,
      ),
    );
    const measured: Set<AutoMovieHumanoidBone> = new Set(shoulders);
    for (const side of sides) {
      measured.add(`${side}LowerArm`);
      measured.add(`${side}Hand`);
    }
    const shoulderRead: ReturnType<typeof poseBones.prepare> =
      poseBones.prepare(body, shoulders);
    const measuredRead: ReturnType<typeof poseBones.prepare> =
      poseBones.prepare(body, measured);
    return angles.map(
      (degrees: number, index: number): ReturnType<typeof poseBones> => {
        const pose: ReturnType<typeof resolveHumanPosture> =
          resolveHumanPosture.seeded(
            body,
            { ...bow(degrees), limbs: {} },
            undefined,
            undefined,
            prepared,
            undefined,
            projection,
          ).pose;
        return (index === 0 ? measuredRead : shoulderRead)(pose, prepared());
      },
    );
  }

  /**
   * A shoulder's circle under the spine's flexion, `a + b cos θ + c sin θ`,
   * world metres, and the arm's reach, metres.
   */
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
   * per coordinate, the 3 by 3 linear system of the samples, solved by Cramer's
   * rule.
   *
   * @param angles The three angles, radians, distinct.
   * @returns A reader of the three world-metre points, returning their circle
   *   vectors with the fixed matrix rows and denominator shared.
   */
  function circle(
    angles: readonly [number, number, number],
  ): (
    points: readonly [IAutoMovieVector3, IAutoMovieVector3, IAutoMovieVector3],
  ) => Omit<ICircle, "reach"> {
    const rows: [number, number, number][] = angles.map(
      (t: number): [number, number, number] => [1, Math.cos(t), Math.sin(t)],
    );
    const det: (m: readonly (readonly number[])[]) => number = (
      m: readonly (readonly number[])[],
    ): number =>
      m[0]![0]! * (m[1]![1]! * m[2]![2]! - m[1]![2]! * m[2]![1]!) -
      m[0]![1]! * (m[1]![0]! * m[2]![2]! - m[1]![2]! * m[2]![0]!) +
      m[0]![2]! * (m[1]![0]! * m[2]![1]! - m[1]![1]! * m[2]![0]!);
    const whole: number = det(rows);
    return (
      points: readonly [
        IAutoMovieVector3,
        IAutoMovieVector3,
        IAutoMovieVector3,
      ],
    ): Omit<ICircle, "reach"> => {
      const solve: (
        axis: keyof IAutoMovieVector3,
      ) => [number, number, number] = (
        axis: keyof IAutoMovieVector3,
      ): [number, number, number] =>
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
    };
  }
}
