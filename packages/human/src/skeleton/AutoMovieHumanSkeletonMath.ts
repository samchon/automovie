import type { AutoMovieHumanJointCentres } from "./AutoMovieHumanJointCentres";

/** Existing registered-frame clinical axes and rigid-transform arithmetic, shared by skeleton preparation and FK.
 * Extracted without changing formulas, operation order or conventions; it owns no pose evaluation or body calibration.
 */
export namespace AutoMovieHumanSkeletonMath {
  /** A 3-vector. */
  export type Vector = [number, number, number];

  /** A unit quaternion `[x, y, z, w]`. */
  export type Quaternion = [number, number, number, number];

  /** Three orthonormal clinical axes of one bone in its rest frame. */
  export interface IAxes {
    /** Axis flexion turns about. */
    flexion: Vector;

    /** Axis abduction turns about. */
    abduction: Vector;

    /** Axis twist turns about, the long axis. */
    twist: Vector;
  }

  /** Body directions of the registered frame. */
  const FORWARD: Vector = [1, 0, 0];
  const UP: Vector = [0, 1, 0];
  const LEFT: Vector = [0, 0, 1];

  /**
   * Clinical axes of one bone from its rest direction d.
   *
   * Flexion turns d toward `flex`, abduction toward `abd` orthogonalized
   * against flexion, twist runs along d with the given sign.
   */
  export function boneAxes(
    bone: string,
    d: Vector,
    byBone: Map<string, AutoMovieHumanJointCentres.IJoint>,
  ): IAxes {
    const s: number = bone.startsWith("right") ? -1 : 1;
    const side: string = bone.startsWith("right") ? "right" : "left";
    const toward: (flex: Vector, abd: Vector, twistSign: number) => IAxes = (
      flex: Vector,
      abd: Vector,
      twistSign: number,
    ): IAxes => {
      const f: Vector = unit(cross(d, perp(flex, d)));
      const a0: Vector = unit(cross(d, perp(abd, d)));
      return {
        flexion: f,
        abduction: unit(sub(a0, times(f, dot(a0, f)))),
        twist: times(d, twistSign),
      };
    };
    const foot: () => IAxes = (): IAxes => {
      const f: Vector = unit(cross(d, perp(UP, d)));
      return {
        flexion: f,
        abduction: times(d, -s),
        twist: times(unit(cross(f, d)), -s),
      };
    };

    // Midline column and pelvis: flex forward, bend right, turn the face left.
    if (["hips", "spine", "chest", "neck", "atlas", "head"].includes(bone))
      return toward(FORWARD, times(LEFT, -1), -1);
    if (bone === "jaw") return toward(times(UP, -1), LEFT, 1);
    if (bone.endsWith("Eye"))
      return { flexion: LEFT, abduction: FORWARD, twist: times(UP, -1) };
    if (bone.endsWith("Scapula"))
      return {
        flexion: times(FORWARD, -s),
        abduction: UP,
        twist: times(LEFT, s),
      };
    if (bone.endsWith("Shoulder")) return toward(FORWARD, UP, 1);
    if (bone.endsWith("UpperArm") || bone.endsWith("UpperLeg"))
      return toward(FORWARD, times(LEFT, s), s);
    if (bone.endsWith("LowerArm")) return toward(FORWARD, times(LEFT, s), -s);
    if (bone.endsWith("LowerLeg"))
      return toward(times(FORWARD, -1), times(LEFT, s), s);
    if (
      bone.endsWith("Foot") ||
      bone.endsWith("Subtalar") ||
      bone.endsWith("Midfoot")
    )
      return foot();
    if (bone.includes("Hallux") || bone.includes("Toe"))
      return toward(
        times(UP, -1),
        times(LEFT, bone.includes("Hallux") ? -s : s),
        1,
      );

    // Hand and digits: palmar and radial directions of this hand at rest.
    const at: (name: string) => Vector = (name: string): Vector =>
      byBone.get(`${side}${name}`)!.position;
    const radial: Vector = unit(sub(at("IndexProximal"), at("LittleProximal")));
    const palmar: Vector = times(
      unit(cross(radial, unit(sub(at("MiddleProximal"), at("Hand"))))),
      s,
    );
    if (bone.includes("Thumb"))
      return toward(
        times(radial, -1),
        palmar,
        bone.endsWith("Metacarpal") ? -s : 1,
      );
    const ulnar: boolean = bone.includes("Ring") || bone.includes("Little");
    return toward(palmar, times(radial, ulnar ? -1 : 1), 1);
  }

  /**
   * Clinical angle, on one of a bone's axes, that the bone already has at rest.
   *
   * Arm and thigh: flexion and abduction of d from the vertical. Elbow, knee,
   * wrist, finger and toe joints: the signed angle from the parent's direction
   * to d about the bone's own axis. Ankle: dorsiflexion from the shank's lean
   * with the sole on the floor. Every other bone and axis rests at zero.
   */
  export function restAngle(
    bone: string,
    axis: string,
    direction: (bone: string) => Vector,
    byBone: Map<string, AutoMovieHumanJointCentres.IJoint>,
  ): number {
    const s: number = bone.startsWith("right") ? -1 : 1;
    const deg: number = 180 / Math.PI;
    const d: Vector = direction(bone);
    const parent: string | null = byBone.get(bone)!.parent;
    if (bone.endsWith("UpperArm") || bone.endsWith("UpperLeg")) {
      if (axis === "flexion")
        return Math.atan2(dot(d, FORWARD), -dot(d, UP)) * deg;
      if (axis === "abduction")
        return Math.atan2(s * dot(d, LEFT), -dot(d, UP)) * deg;
      return 0;
    }
    if (bone.endsWith("Foot") && axis === "flexion") {
      const shank: Vector = direction(parent!);
      return Math.atan2(-dot(shank, FORWARD), -dot(shank, UP)) * deg;
    }
    const hinge: boolean =
      /(LowerArm|LowerLeg|Hand|Proximal|Intermediate|Distal)$/.test(bone) &&
      !bone.includes("Thumb") &&
      (axis === "flexion" || (axis === "abduction" && bone.endsWith("Hand")));
    if (!hinge || parent === null) return 0;
    const about: Vector = boneAxes(bone, d, byBone)[axis as "flexion"];
    const a: Vector = unit(perp(direction(parent), about));
    const b: Vector = unit(perp(d, about));
    return Math.atan2(dot(cross(a, b), about), dot(a, b)) * deg;
  }

  /** Quaternion of a turn by `degrees` about a unit axis. */
  export function fromAxisAngle(axis: Vector, degrees: number): Quaternion {
    const h: number = (degrees * Math.PI) / 360;
    const s: number = Math.sin(h);
    return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(h)];
  }

  /** Hamilton product p q. */
  export function multiply(p: Quaternion, q: Quaternion): Quaternion {
    return [
      p[3] * q[0] + p[0] * q[3] + p[1] * q[2] - p[2] * q[1],
      p[3] * q[1] - p[0] * q[2] + p[1] * q[3] + p[2] * q[0],
      p[3] * q[2] + p[0] * q[1] - p[1] * q[0] + p[2] * q[3],
      p[3] * q[3] - p[0] * q[0] - p[1] * q[1] - p[2] * q[2],
    ];
  }

  /** Rotate v by unit quaternion q. */
  export function rotate(q: Quaternion, v: Vector): Vector {
    const r: Quaternion = multiply(multiply(q, [v[0], v[1], v[2], 0]), [
      -q[0],
      -q[1],
      -q[2],
      q[3],
    ]);
    return [r[0], r[1], r[2]];
  }

  /** Component of v orthogonal to unit n. */
  function perp(v: Vector, n: Vector): Vector {
    return sub(v, times(n, dot(v, n)));
  }

  /** Dot product. */
  function dot(a: Vector, b: Vector): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /** Cross product a x b. */
  function cross(a: Vector, b: Vector): Vector {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  /** Sum a + b. */
  export function add(a: Vector, b: Vector): Vector {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  /** Difference a - b. */
  export function sub(a: Vector, b: Vector): Vector {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /** Scalar multiple. */
  export function times(v: Vector, k: number): Vector {
    return [v[0] * k, v[1] * k, v[2] * k];
  }

  /** Unit vector. */
  export function unit(v: Vector): Vector {
    const n: number = Math.hypot(...v);
    return [v[0] / n, v[1] / n, v[2] / n];
  }
}
