import type {
  AutoMovieQuaternionTuple,
  AutoMovieVector3Tuple,
  IAutoMovieHumanJointCentres,
  IAutoMovieHumanSkeletonMath,
} from "@automovie/interface";

/**
 * Existing registered-frame clinical axes and rigid-transform arithmetic,
 * shared by skeleton preparation and FK. Extracted without changing formulas,
 * operation order or conventions; it owns no pose evaluation or body
 * calibration.
 */
export namespace AutoMovieHumanSkeletonMath {
  /**
   * Clinical axes of one bone from its rest direction d.
   *
   * Flexion turns d toward `flex`, abduction toward `abd` orthogonalized
   * against flexion, twist runs along d with the given sign.
   */
  export function boneAxes(
    bone: string,
    d: AutoMovieVector3Tuple,
    byBone: Map<string, IAutoMovieHumanJointCentres.IJoint>,
  ): IAutoMovieHumanSkeletonMath.IAxes {
    const s: number = bone.startsWith("right") ? -1 : 1;
    const side: string = bone.startsWith("right") ? "right" : "left";
    function toward(
      flex: AutoMovieVector3Tuple,
      abd: AutoMovieVector3Tuple,
      twistSign: number,
    ): IAutoMovieHumanSkeletonMath.IAxes {
      const f: AutoMovieVector3Tuple = unit(cross(d, perp(flex, d)));
      const a0: AutoMovieVector3Tuple = unit(cross(d, perp(abd, d)));
      return {
        flexion: f,
        abduction: unit(sub(a0, times(f, dot(a0, f)))),
        twist: times(d, twistSign),
      };
    }
    function foot(): IAutoMovieHumanSkeletonMath.IAxes {
      const f: AutoMovieVector3Tuple = unit(cross(d, perp(UP, d)));
      return {
        flexion: f,
        abduction: times(d, -s),
        twist: times(unit(cross(f, d)), -s),
      };
    }

    // Midline column and pelvis: flex forward, bend right, turn the face left.
    if (["hips", "spine", "chest", "neck", "atlas", "head"].includes(bone))
      return toward(FORWARD, times(LEFT, -1), -1);
    if (bone === "jaw") return toward(times(UP, -1), LEFT, 1);
    // A side's axes are the left's reflected as axial vectors (-M a for the
    // mirror M across the median plane), so a twist's sign flips with the side
    // and a pose and its side-swapped mirror move the skin as mirror images.
    if (bone.endsWith("Eye"))
      return {
        flexion: LEFT,
        abduction: times(FORWARD, s),
        twist: times(UP, -s),
      };
    if (bone.endsWith("Scapula"))
      return {
        flexion: times(FORWARD, -s),
        abduction: times(UP, s),
        twist: LEFT,
      };
    if (bone.endsWith("Shoulder")) return toward(FORWARD, UP, s);
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
        s,
      );

    // Hand and digits: palmar and radial directions of this hand at rest.
    function at(name: string): AutoMovieVector3Tuple {
      return byBone.get(`${side}${name}`)!.position;
    }
    const radial: AutoMovieVector3Tuple = unit(
      sub(at("IndexProximal"), at("LittleProximal")),
    );
    const palmar: AutoMovieVector3Tuple = times(
      unit(cross(radial, unit(sub(at("MiddleProximal"), at("Hand"))))),
      s,
    );
    if (bone.includes("Thumb"))
      return toward(
        times(radial, -1),
        palmar,
        bone.endsWith("Metacarpal") ? -s : s,
      );
    const ulnar: boolean = bone.includes("Ring") || bone.includes("Little");
    return toward(palmar, times(radial, ulnar ? -1 : 1), s);
  }
  /** Quaternion of a turn by `degrees` about a unit axis. */
  export function fromAxisAngle(
    axis: AutoMovieVector3Tuple,
    degrees: number,
  ): AutoMovieQuaternionTuple {
    const h: number = (degrees * Math.PI) / 360;
    const s: number = Math.sin(h);
    return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(h)];
  }
  /** Hamilton product p q. */
  export function multiply(
    p: AutoMovieQuaternionTuple,
    q: AutoMovieQuaternionTuple,
  ): AutoMovieQuaternionTuple {
    return [
      p[3] * q[0] + p[0] * q[3] + p[1] * q[2] - p[2] * q[1],
      p[3] * q[1] - p[0] * q[2] + p[1] * q[3] + p[2] * q[0],
      p[3] * q[2] + p[0] * q[1] - p[1] * q[0] + p[2] * q[3],
      p[3] * q[3] - p[0] * q[0] - p[1] * q[1] - p[2] * q[2],
    ];
  }

  /** Rotate v by unit quaternion q. */
  export function rotate(
    q: AutoMovieQuaternionTuple,
    v: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    const r: AutoMovieQuaternionTuple = multiply(
      multiply(q, [v[0], v[1], v[2], 0]),
      [-q[0], -q[1], -q[2], q[3]],
    );
    return [r[0], r[1], r[2]];
  }

  /** Sum a + b. */
  export function add(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  /** Difference a - b. */
  export function sub(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /** Scalar multiple. */
  export function times(
    v: AutoMovieVector3Tuple,
    k: number,
  ): AutoMovieVector3Tuple {
    return [v[0] * k, v[1] * k, v[2] * k];
  }

  /** Unit vector. */
  export function unit(v: AutoMovieVector3Tuple): AutoMovieVector3Tuple {
    const n: number = Math.hypot(...v);
    return [v[0] / n, v[1] / n, v[2] / n];
  }

  /*
   * Body directions of the registered frame.
   */
  const FORWARD: AutoMovieVector3Tuple = [1, 0, 0];

  const UP: AutoMovieVector3Tuple = [0, 1, 0];

  const LEFT: AutoMovieVector3Tuple = [0, 0, 1];

  /*
   * Component of v orthogonal to unit n.
   */
  function perp(
    v: AutoMovieVector3Tuple,
    n: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return sub(v, times(n, dot(v, n)));
  }

  /*
   * Dot product.
   */
  function dot(a: AutoMovieVector3Tuple, b: AutoMovieVector3Tuple): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /*
   * Cross product a x b.
   */
  function cross(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }
}
