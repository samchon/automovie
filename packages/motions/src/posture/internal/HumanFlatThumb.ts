import { HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME, Vector3, AutoMovieEngineMath, AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieResolvedJointAngles,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The thumb of a hand laid flat, from the measured extension of the thumb's
 * trapeziometacarpal joint.
 *
 * Cooney, Lucca, Chao and Linscheid 1981 ("The kinesiology of the thumb
 * trapeziometacarpal joint", J Bone Joint Surg 63-A:1371) measured, by biplane
 * roentgenograms of nineteen hands, the first metacarpal in its extension: the
 * thumb "moved radially in a plane parallel with the dorsum of the palm or at
 * least in a plane within 20 degrees of being parallel" (Table III, Extension:
 * flexion -12.6, abduction -26.0, pronation 2.8 degrees against the trapezium),
 * the trapezium itself lying at 48 degrees of flexion, 38 of abduction and 80
 * of pronation against the third metacarpal (Table I, medians). The angles
 * compose as the joint coordinate system the ISB adopted for this joint on
 * Cooney's axes (Wu et al. 2005, J Biomech 38:981, sections 4.3.4 and 4.4.1:
 * flexion about the proximal bone's radial axis, abduction about the floating
 * axis, axial rotation about the distal bone's own axis; X volar, Y proximal, Z
 * radial for a right hand, a left one mirrored), which is the Cardan sequence
 * whose second, rotated axis is the floating one (Wu et al. 2005, section 1: "a
 * linkage representation of a particular Cardan angle sequence; the floating
 * axis is the second, i.e. rotated, axis"): the first rotation about the
 * proximal Z, the second about the once-rotated X, the third about the
 * twice-rotated Y (section 2.1), so the metacarpal's frame is `Rz(flexion)
 * Rx(abduction) Ry(rotation)` of the trapezium's, itself that of the third
 * metacarpal's. Their senses are read from Cooney's own descriptions (an
 * extension radial and within 20 degrees of the palm's plane, an abduction
 * palmar). The whole composed frame is taken, its direction 39.7 degrees radial
 * of the third metacarpal and 8.6 degrees palmar of the palm's plane and its
 * roll as measured. The metacarpophalangeal and interphalangeal joints are at
 * the ISB neutral, their two segments aligned (Wu et al. 2005, section 4.4.1).
 *
 * The rig's metacarpal carries the frame the ISB defines for a metacarpal (Wu
 * et al. 2005, section 4.3.4: Y along the shaft, proximal; Z the axis the next
 * joint flexes about, radial; X = Y x Z, volar) in its own rest data: Y
 * opposite its rest offset to the proximal phalanx, Z the rig's flexion axis of
 * that next joint (`HUMANOID_JOINT_AXES`) made perpendicular to Y. The joint's
 * rotation is the one that carries that rest frame onto the measured one, both
 * in the hand's frame, read in the joint's chart (`decomposeJointRotation`).
 */
export namespace HumanFlatThumb {
  /** A joint coordinate system's three angles, degrees. */
  export interface IJcs {
    /** About the proximal bone's radial axis. */
    flexion: number;

    /** About the floating axis. */
    abduction: number;

    /** About the distal bone's own axis. */
    pronation: number;
  }

  /**
   * The trapezium against the third metacarpal (Cooney et al. 1981, Table I,
   * medians), degrees.
   */
  export const TRAPEZIUM: IJcs = { flexion: 48, abduction: 38, pronation: 80 };

  /**
   * The first metacarpal against the trapezium in extension (Cooney et al.
   * 1981, Table III, means), degrees.
   */
  export const EXTENSION: IJcs = {
    flexion: -12.6,
    abduction: -26.0,
    pronation: 2.8,
  };

  /**
   * The thumb's joint angles of a flat hand on a body.
   *
   * @param body The body.
   * @param side The hand.
   * @returns The carpometacarpal, metacarpophalangeal and interphalangeal
   *   joints' clinical angles, degrees.
   */
  export function angles(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
  ): IThumb {
    const metacarpal: AutoMovieHumanoidBone = `${side}ThumbMetacarpal`;
    const proximal: AutoMovieHumanoidBone = `${side}ThumbProximal`;

    // The measured metacarpal frame in the third metacarpal's (X volar,
    // Y proximal, Z radial), then in the hand's: the canonical rest hand
    // (`HUMANOID_REST_FRAME`) has the fingers along -X for a right hand and
    // +X for a left one, the palm toward -Y and the thumb's side toward +Z,
    // so the third metacarpal's X is the hand's -Y, its Y the hand's +X
    // (right) or -X (left), its Z the hand's +Z.
    const measured: Matrix = composed(composed(IDENTITY, TRAPEZIUM), EXTENSION);
    const sign: number = side === "right" ? 1 : -1;
    const hand = (v: IAutoMovieVector3): IAutoMovieVector3 => ({
      x: sign * v.y,
      y: -v.x,
      z: v.z,
    });
    const target: IFrame = {
      x: hand(column(measured, 0)),
      y: hand(column(measured, 1)),
      z: hand(column(measured, 2)),
    };

    // The rig metacarpal's own ISB frame at rest, in the hand's frame (the
    // rig rests the thumb unrotated in the hand).
    const y: IAutoMovieVector3 = Vector3.normalize(
      Vector3.scale(restOffset(body, proximal), -1),
    );
    const flexing: IAutoMovieVector3 = HUMANOID_JOINT_AXES[proximal]!.flexion;
    const z: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(flexing, Vector3.scale(y, Vector3.dot(flexing, y))),
    );
    // A right hand's ISB frame is right-handed, X = Y x Z; a left one's is
    // its mirror image, as is its measured frame.
    const rest: IFrame = {
      x: side === "right" ? Vector3.cross(y, z) : Vector3.cross(z, y),
      y,
      z,
    };

    // The rotation carrying the rest frame onto the measured one: target
    // times the rest's transpose, both orthonormal and of one handedness.
    const turn: IAutoMovieQuaternion = AutoMovieEngineMath.quaternionFromBasis(
      carry(rest, target, { x: 1, y: 0, z: 0 }),
      carry(rest, target, { x: 0, y: 1, z: 0 }),
      carry(rest, target, { x: 0, y: 0, z: 1 }),
    );
    const cmc: IAutoMovieResolvedJointAngles = AutoMovieEngineKinematics.decomposeJointRotation(
      turn,
      HUMANOID_JOINT_AXES[metacarpal],
      HUMANOID_REST_FRAME[metacarpal],
    );
    return {
      [metacarpal]: [cmc.flexion ?? 0, cmc.abduction ?? 0, cmc.twist ?? 0],
      [proximal]: NEUTRAL,
      [`${side}ThumbDistal`]: NEUTRAL,
    };
  }

  /** The thumb's three joints' clinical angles, degrees, by bone. */
  export type IThumb = Partial<Record<AutoMovieHumanoidBone, Triple>>;
}

/** One joint's clinical angles, degrees. */
type Triple = readonly [number, number, number];

/** A coordinate axis of the third metacarpal's frame. */
type Axis = "x" | "y" | "z";

/** A row-major rotation matrix. */
type Matrix = readonly [Triple, Triple, Triple];

/** A frame's three axes in the hand's frame. */
interface IFrame {
  /** Volar. */
  x: IAutoMovieVector3;

  /** Proximal. */
  y: IAutoMovieVector3;

  /** Radial. */
  z: IAutoMovieVector3;
}

/** The ISB neutral of a thumb joint: its two segments aligned. */
const NEUTRAL: Triple = [0, 0, 0];

/** The identity rotation. */
const IDENTITY: Matrix = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

/**
 * A frame turned by a joint coordinate system's angles on it, as the ISB
 * composes them (Wu et al. 2005, sections 1, 2.1 and 4.4.1; Grood and Suntay
 * 1983): flexion about Z, then abduction about the floating X, then the
 * rotation about the distal Y, with abduction counted toward the radial side as
 * Cooney's extension and abduction read (both radial and palmar of the palm's
 * plane), the opposite of the ISB's ulnar-positive deviation.
 */
function composed(frame: Matrix, jcs: HumanFlatThumb.IJcs): Matrix {
  return times(
    times(times(frame, about("z", jcs.flexion)), about("x", -jcs.abduction)),
    about("y", jcs.pronation),
  );
}

/** A matrix's column: a turned frame's axis in the frame it is turned in. */
function column(m: Matrix, j: number): IAutoMovieVector3 {
  return { x: m[0][j]!, y: m[1][j]!, z: m[2][j]! };
}

/**
 * The image of a hand axis under the rotation carrying one frame onto another:
 * its components on the first frame's axes laid on the second's.
 */
function carry(
  from: IFrame,
  to: IFrame,
  v: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Vector3.add(
    Vector3.add(
      Vector3.scale(to.x, Vector3.dot(from.x, v)),
      Vector3.scale(to.y, Vector3.dot(from.y, v)),
    ),
    Vector3.scale(to.z, Vector3.dot(from.z, v)),
  );
}

/** The rotation about an axis by degrees. */
function about(axis: Axis, degrees: number): Matrix {
  const r: number = (degrees * Math.PI) / 180;
  const c: number = Math.cos(r);
  const s: number = Math.sin(r);
  return axis === "x"
    ? [
        [1, 0, 0],
        [0, c, -s],
        [0, s, c],
      ]
    : axis === "y"
      ? [
          [c, 0, s],
          [0, 1, 0],
          [-s, 0, c],
        ]
      : [
          [c, -s, 0],
          [s, c, 0],
          [0, 0, 1],
        ];
}

/** The product of two matrices. */
function times(a: Matrix, b: Matrix): Matrix {
  function row(i: number): Triple {
    const r: Triple = a[i]!;
    return [
      r[0] * b[0][0] + r[1] * b[1][0] + r[2] * b[2][0],
      r[0] * b[0][1] + r[1] * b[1][1] + r[2] * b[2][1],
      r[0] * b[0][2] + r[1] * b[1][2] + r[2] * b[2][2],
    ];
  }
  return [row(0), row(1), row(2)];
}

/**
 * The rest offset of a thumb bone from its parent, in the hand's rest frame:
 * the metacarpal's direction at rest (the rig rests the hand and thumb
 * unrotated).
 */
function restOffset(
  body: IAutoMovieMotionHumanBody,
  bone: AutoMovieHumanoidBone,
): IAutoMovieVector3 {
  const found: IAutoMovieBone | undefined = body.skeleton.bones.find(
    (b: IAutoMovieBone): boolean => b.bone === bone,
  );
  if (found === undefined) throw new Error(`The rig has no ${bone}`);
  return found.rest.translation;
}
