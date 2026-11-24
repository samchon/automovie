import {
  DEFAULT_HUMANOID_ROM,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
  Vector3,
  distalEndSwivelArcs,
  jointRomOvershoot,
  jointToQuaternionOnBasis,
  normalizeJointAxes,
  swivelArcs,
} from "@automovie/engine";
import type {
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
  IAutoMovieRestFrame,
  IAutoMovieSwivelArcs,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * The swivels a wrist's box refuses, read off where the forearm points.
 *
 * Both hands, with the humanoid axes, rest frames and ranges. A forearm
 * direction in the hand's frame is a unit vector on a seeded circle of the unit
 * sphere (a fixed part along a seeded axis and a part turning about it by the
 * swivel), as an elbow circling the shoulder-to-wrist line gives it.
 *
 * Scenarios:
 *
 * 1. The reading is the wrist's own: at every degree of 40 seeded circles a side,
 *    the twist-free articulation composed from the two angles the analysis
 *    reads (abduction by the direction's sine on the flexion axis, flexion by
 *    its vector on the abduction and twist axes) carries the hand's twist axis
 *    onto that direction, within 1e-9.
 * 2. With no margin, the refused arcs are exactly the swivels whose two angles lie
 *    past the range: every quarter degree, a swivel inside the arcs scores a
 *    positive overshoot and a swivel outside scores none, except within 1e-6
 *    degree of an arc's end.
 * 3. The arcs refuse some swivels and admit some on each side.
 */
export function test_unit_engine_kinematics_distal_end_swivel_arcs(): void {
  const random: () => number = seeded(20261117);
  const mismatched: string[] = [];
  const wrong: string[] = [];
  const mixed: string[] = [];
  for (const bone of ["leftHand", "rightHand"] as const) {
    const basis: IAutoMovieJointAxes = normalizeJointAxes(
      HUMANOID_JOINT_AXES[bone]!,
      "spec axes",
    );
    const frame: IAutoMovieRestFrame | undefined = HUMANOID_REST_FRAME[bone];
    const constraint: IAutoMovieJointConstraint = DEFAULT_HUMANOID_ROM[bone]!;
    const handed: 1 | -1 =
      Vector3.dot(basis.twist, Vector3.cross(basis.flexion, basis.abduction)) >=
      0
        ? 1
        : -1;
    const twist: IAutoMovieVector3 = Vector3.scale(basis.twist, handed);
    let refused: number = 0;
    let admitted: number = 0;
    for (let k: number = 0; k < 40; ++k) {
      const direction: (swivel: number) => IAutoMovieVector3 = circling(random);
      const arcs: IAutoMovieSwivelArcs.IArc[] | "all" | null =
        distalEndSwivelArcs({
          basis,
          frame,
          constraint,
          axis: twist,
          direction,
          margin: 0,
        });
      if (arcs === null) {
        wrong.push(`${bone} circle ${k}: not applicable`);
        continue;
      }
      for (let quarter: number = 0; quarter < 1440; quarter++) {
        const swivel: number = quarter / 4;
        const d: IAutoMovieVector3 = direction(swivel);
        // The two angles as the analysis reads them, rest-relative degrees.
        const abduction: number =
          -Math.asin(Math.max(-1, Math.min(1, Vector3.dot(d, basis.flexion)))) /
          Quaternion.DEG2RAD;
        const flexion: number =
          Math.atan2(Vector3.dot(d, basis.abduction), Vector3.dot(d, twist)) /
          Quaternion.DEG2RAD;
        const clinical = (rig: number, axis: "flexion" | "abduction"): number =>
          (frame?.[axis]?.neutral ?? 0) + (frame?.[axis]?.sign ?? 1) * rig;
        const joint = {
          bone,
          flexion: clinical(flexion, "flexion"),
          abduction: clinical(abduction, "abduction"),
          twist: null,
        };
        if (quarter % 4 === 0) {
          const articulation: IAutoMovieQuaternion = jointToQuaternionOnBasis(
            joint,
            basis,
            frame,
          );
          const carried: IAutoMovieVector3 = Quaternion.rotateVector(
            Quaternion.inverse(articulation),
            twist,
          );
          const off: number = Vector3.length(Vector3.subtract(carried, d));
          if (off > 1e-9 && mismatched.length < 10)
            mismatched.push(
              `${bone} circle ${k} swivel ${swivel}: direction off by ${off}`,
            );
        }
        const inside: boolean = swivelArcs.covers(arcs, swivel, swivel);
        const edge: boolean =
          arcs !== "all" &&
          arcs.some((arc: IAutoMovieSwivelArcs.IArc): boolean =>
            [arc.from, arc.to].some(
              (end: number): boolean =>
                Math.abs(((end - swivel + 540) % 360) - 180) < 1e-6,
            ),
          );
        const overshoot: number = jointRomOvershoot(joint, constraint);
        if (inside) ++refused;
        else ++admitted;
        if (!edge && inside !== overshoot > 0 && wrong.length < 20)
          wrong.push(
            `${bone} circle ${k} swivel ${swivel}: ${inside ? "refused" : "admitted"}, overshoot ${overshoot}`,
          );
      }
    }
    if (refused === 0 || admitted === 0)
      mixed.push(`${bone}: refused ${refused}, admitted ${admitted}`);
  }
  TestValidator.equals(
    "the two angles read compose the forearm's direction",
    mismatched,
    [],
  );
  TestValidator.equals(
    "the refused arcs are the swivels past the box",
    wrong,
    [],
  );
  TestValidator.equals(
    "each wrist refuses some swivels and admits some",
    mixed,
    [],
  );
}

/** A unit direction on a seeded circle of the unit sphere, by swivel in degrees. */
function circling(random: () => number): (swivel: number) => IAutoMovieVector3 {
  const axis: IAutoMovieVector3 = Vector3.normalize({
    x: random() - 0.5,
    y: random() - 0.5,
    z: random() - 0.5,
  });
  const seed: IAutoMovieVector3 = Vector3.normalize({
    x: random() - 0.5,
    y: random() - 0.5,
    z: random() - 0.5,
  });
  const u: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(seed, Vector3.scale(axis, Vector3.dot(seed, axis))),
  );
  const v: IAutoMovieVector3 = Vector3.cross(axis, u);
  const along: number = 2 * random() - 1;
  const radius: number = Math.sqrt(1 - along * along);
  return (swivel: number): IAutoMovieVector3 => {
    const angle: number = swivel * Quaternion.DEG2RAD;
    return Vector3.add(
      Vector3.scale(axis, along),
      Vector3.add(
        Vector3.scale(u, radius * Math.cos(angle)),
        Vector3.scale(v, radius * Math.sin(angle)),
      ),
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
