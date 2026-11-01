import type { IAutoMovieHumanBodyCalibration } from "../generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { AutoMovieHumanJointCentres } from "./AutoMovieHumanJointCentres";
import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/**
 * The anatomical neutral of a generated body, derived from its bind skeleton.
 *
 * Generation achieves a posture: an A-pose with relaxed hands. That posture is
 * an observation and the skin's bind, not a clinical zero. Neutral is the
 * standing body the clinical angles are measured from, reached from the bind by
 * one rotation per bone, and those rotations are the body's achieved offset. A
 * bone that no rule below names rides its parent, so its offset is zero.
 *
 * - Arm: at the side, resting against the trunk. A straight arm hung plumb from
 *   its shoulder would pass through the hip, so the resting angle is the least
 *   abduction that clears this body's own skin.
 * - Elbow, wrist, fingers: straight. The bind's bend gives the elbow's plane,
 *   which neutral lays in the sagittal plane.
 * - Thumb: as it stands. Its carpometacarpal centre is a convention, not a
 *   landmark, and turning about it folds the web, so the thumb's zero is the
 *   achieved thumb and its fields count from there.
 * - Forearm: thumb forward, the mid position its range of motion is measured
 *   from, not palms forward. The turn is shared between elbow and wrist.
 * - Leg: plumb under the hip with the knee forward, sole level, the foot on the
 *   heading tibial torsion gives it. Toes keep their place on the floor, which
 *   puts the metatarsophalangeal joints at zero.
 * - Spine, neck, head, jaw, eyes, girdle: as they stand. A standing column is its
 *   own neutral, and no reference says otherwise.
 *
 * The rig's rest stays the bind, since a skin has one rest frame: neutral is a
 * pose of the rig, and every clinical pose is a further pose of neutral.
 */
export namespace AutoMovieHumanNeutral {
  /** A body's neutral. */
  export interface IOutput {
    /** The skeleton standing at neutral, in the bind's order, mm. */
    joints: AutoMovieHumanJointCentres.IJoint[];

    /** Each bone's world turn from bind to neutral: the achieved offset, inverted. */
    turns: Map<string, Math3D.Quaternion>;

    /** Each arm's resting abduction from the plumb line, degrees. */
    resting: Map<string, number>;

    /** Each forearm's achieved pronation from thumbs forward, degrees. */
    forearms: Map<string, number>;
  }

  /** Share of the forearm's twist the wrist carries. */
  export const WRIST_TWIST: number = 0.5;

  /**
   * Derive one body's neutral.
   *
   * @param calibration The body whose skin the resting arm must clear.
   * @param joints Its bind skeleton.
   * @returns The neutral skeleton and the turns that reach it.
   */
  export function derive(
    calibration: IAutoMovieHumanBodyCalibration,
    joints: readonly AutoMovieHumanJointCentres.IJoint[],
  ): IOutput {
    const byBone = new Map<string, AutoMovieHumanJointCentres.IJoint>(
      joints.map(
        (j: AutoMovieHumanJointCentres.IJoint): [string, AutoMovieHumanJointCentres.IJoint] => [
          j.bone,
          j,
        ],
      ),
    );
    const direction = (bone: string): Vector => {
      const j: AutoMovieHumanJointCentres.IJoint = byBone.get(bone)!;
      return Math3D.unit(Math3D.sub(j.toward, j.position));
    };
    const between2 = (from: string, to: string): Vector =>
      Math3D.sub(byBone.get(to)!.position, byBone.get(from)!.position);

    const named = new Map<string, Math3D.Quaternion>();
    const resting = new Map<string, number>();
    const forearms = new Map<string, number>();
    for (const side of ["left", "right"] as const) {
      const s: number = side === "left" ? 1 : -1;

      // The arm lays its bend forward and hangs at its resting angle.
      const angle: number = restingAngle(calibration, byBone, side);
      resting.set(`${side}UpperArm`, angle);
      const radians: number = (angle * Math.PI) / 180;
      const down: Vector = [0, -Math.cos(radians), s * Math.sin(radians)];
      const upper: Vector = direction(`${side}UpperArm`);
      const fore: Vector = direction(`${side}LowerArm`);
      const qUpper: Math3D.Quaternion = frame(
        upper,
        Math3D.unit(perpendicular(fore, upper)),
        down,
        FORWARD,
      );
      const qStraight: Math3D.Quaternion = Math3D.multiply(
        arc(Math3D.rotate(qUpper, fore), down),
        qUpper,
      );
      const qHandBent: Math3D.Quaternion = Math3D.multiply(
        arc(Math3D.rotate(qStraight, direction(`${side}Hand`)), down),
        qStraight,
      );

      // The hand's radial side comes to the front; the turn is the achieved
      // forearm rotation.
      const radial: Vector = Math3D.unit(
        perpendicular(
          Math3D.rotate(
            qHandBent,
            between2(`${side}LittleProximal`, `${side}IndexProximal`),
          ),
          down,
        ),
      );
      const rotation: number = Math.atan2(
        dot(cross(radial, FORWARD), down),
        dot(radial, FORWARD),
      );
      forearms.set(`${side}LowerArm`, (s * rotation * 180) / Math.PI);
      const twist = (share: number): Math3D.Quaternion =>
        Math3D.fromAxisAngle(down, (rotation * share * 180) / Math.PI);
      const qHand: Math3D.Quaternion = Math3D.multiply(twist(1), qHandBent);
      named.set(`${side}UpperArm`, qUpper);
      named.set(
        `${side}LowerArm`,
        Math3D.multiply(twist(1 - WRIST_TWIST), qStraight),
      );
      named.set(`${side}Hand`, qHand);

      // Each finger lies along the hand, every phalanx straight on the one
      // before. The thumb rides the hand as it stands.
      for (const finger of ["Index", "Middle", "Ring", "Little"]) {
        let previous: Math3D.Quaternion = qHand;
        for (const phalanx of ["Proximal", "Intermediate", "Distal"]) {
          const bone: string = `${side}${finger}${phalanx}`;
          previous = Math3D.multiply(
            arc(Math3D.rotate(previous, direction(bone)), down),
            previous,
          );
          named.set(bone, previous);
        }
      }

      // The leg hangs plumb by the shortest turn, keeping its forward knee, and
      // the foot keeps the floor and its heading: a foot turned out under a
      // forward knee is tibial torsion, not hip rotation.
      const qThigh: Math3D.Quaternion = arc(direction(`${side}UpperLeg`), DOWN);
      named.set(`${side}UpperLeg`, qThigh);
      named.set(
        `${side}LowerLeg`,
        Math3D.multiply(
          arc(Math3D.rotate(qThigh, direction(`${side}LowerLeg`)), DOWN),
          qThigh,
        ),
      );
      named.set(`${side}Foot`, [0, 0, 0, 1]);
    }

    // Everything else rides its parent.
    const turns = new Map<string, Math3D.Quaternion>();
    const places = new Map<string, Vector>();
    for (const j of joints) {
      const parent: string | null = j.parent;
      const above: Math3D.Quaternion =
        parent === null ? [0, 0, 0, 1] : turns.get(parent)!;
      turns.set(j.bone, named.get(j.bone) ?? above);
      places.set(
        j.bone,
        parent === null
          ? j.position
          : Math3D.add(
              places.get(parent)!,
              Math3D.rotate(
                above,
                Math3D.sub(j.position, byBone.get(parent)!.position),
              ),
            ),
      );
    }

    // The straightened legs change the ankles' height, and the feet stay down.
    const ankles: [string, string] = ["leftFoot", "rightFoot"];
    const fall: number =
      ankles.reduce(
        (a: number, b: string): number =>
          a + byBone.get(b)!.position[1] - places.get(b)![1],
        0,
      ) / ankles.length;
    return {
      joints: joints.map(
        (j: AutoMovieHumanJointCentres.IJoint): AutoMovieHumanJointCentres.IJoint => {
          const at: Vector = Math3D.add(places.get(j.bone)!, [0, fall, 0]);
          const turn: Math3D.Quaternion = turns.get(j.bone)!;
          const moved = (p: Vector): Vector =>
            Math3D.add(at, Math3D.rotate(turn, Math3D.sub(p, j.position)));
          return {
            ...j,
            position: at,
            toward: moved(j.toward),
            tip: j.tip === null ? null : moved(j.tip),
          };
        },
      ),
      turns,
      resting,
      forearms,
    };
  }

  /**
   * The least abduction that lets a straight forearm pass the waist and hip.
   *
   * The skin is read from the elbow down. Above it the arm rests on the ribs,
   * and flesh there gives: at the axilla they are one surface.
   */
  function restingAngle(
    calibration: IAutoMovieHumanBodyCalibration,
    byBone: ReadonlyMap<string, AutoMovieHumanJointCentres.IJoint>,
    side: "left" | "right",
  ): number {
    const s: number = side === "left" ? 1 : -1;
    const at = (bone: string): AutoMovieHumanJointCentres.IJoint =>
      byBone.get(`${side}${bone}`)!;
    const shoulder: Vector = at("UpperArm").position;
    const upper: number = length(shoulder, at("LowerArm").position);
    const fore: number = upper + length(at("LowerArm").position, at("Hand").position);
    const radius: number = at("LowerArm").radius;

    let widest: number = 0;
    for (const chain of calibration.chains) {
      if (chain.name !== "trunk" && chain.name !== `leg.${side}`) continue;
      for (const layer of chain.layers)
        for (const p of AutoMovieHumanLoftChain.ring(chain, layer.y, PHASES)) {
          const t: number = shoulder[1] - p[1];
          if (t < upper || t > fore) continue;
          widest = Math.max(widest, (s * p[2] + radius - s * shoulder[2]) / t);
        }
    }
    return (Math.asin(Math.min(1, widest)) * 180) / Math.PI;
  }
}

type Vector = Math3D.Vector;

/** Forward in the registered frame. */
const FORWARD: Vector = [1, 0, 0];

/** Down in the registered frame. */
const DOWN: Vector = [0, -1, 0];

/** Phases sampling a section when clearing the arm. */
const PHASES: number[] = Array.from(
  { length: 48 },
  (_: unknown, i: number): number => (2 * Math.PI * i) / 48,
);

function dot(a: Vector, b: Vector): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a: Vector, b: Vector): Vector {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

/** Distance between two points. */
function length(a: Vector, b: Vector): number {
  return Math.hypot(...Math3D.sub(a, b));
}

/** The part of v square to unit n. */
function perpendicular(v: Vector, n: Vector): Vector {
  return Math3D.sub(v, Math3D.times(n, dot(v, n)));
}

/** The shortest turn from one direction to another. */
function arc(from: Vector, to: Vector): Math3D.Quaternion {
  const a: Vector = Math3D.unit(from);
  const b: Vector = Math3D.unit(to);
  const c: Vector = cross(a, b);
  const q: [number, number, number, number] = [c[0], c[1], c[2], 1 + dot(a, b)];
  const n: number = Math.hypot(...q);
  return [q[0] / n, q[1] / n, q[2] / n, q[3] / n];
}

/** The turn taking one direction and a square side to another pair. */
function frame(
  from: Vector,
  side: Vector,
  to: Vector,
  toSide: Vector,
): Math3D.Quaternion {
  const first: Math3D.Quaternion = arc(from, to);
  const carried: Vector = Math3D.unit(
    perpendicular(Math3D.rotate(first, side), to),
  );
  const wanted: Vector = Math3D.unit(perpendicular(toSide, to));
  const angle: number = Math.atan2(
    dot(cross(carried, wanted), to),
    dot(carried, wanted),
  );
  return Math3D.multiply(
    Math3D.fromAxisAngle(to, (angle * 180) / Math.PI),
    first,
  );
}
