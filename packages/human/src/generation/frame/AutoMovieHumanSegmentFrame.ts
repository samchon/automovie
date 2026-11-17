import type {
  AutoMovieMatrix3Tuple,
  AutoMovieVector3Tuple,
  IAutoMovieHumanSegmentFrame,
  IAutoMovieHumanSegmentJoint,
} from "@automovie/interface";

/**
 * The segment-frame law: a body segment's frame built from its landmarks by a written definition, and the chain that hangs the segments
 * on their parents by one rotation per joint.
 *
 * A frame is an origin and three unit axes X, Y, Z, all in the figure's frame (millimetres), right-handed: Z = X x Y. The ISB
 * recommendations write every segment so (Wu et al. 2002, J Biomech 35:543-548; Wu et al. 2005, J Biomech 38:981-992): X anterior, Y
 * along the segment toward its proximal end (cranial for the trunk), Z to the right. The figure keeps one side, the stored side (+Z), and
 * its twin is the reflection in z = 0 ({@link mirror}); ISB's right-side definitions read on the stored side.
 *
 * A joint's zero is the child's axes parallel to its parent's, the zero of ISB's joint coordinate systems (the anatomical position).
 * With the axes as the columns of a matrix A, a joint's rotation is `R = A_parent^T A_child`, the child's axes written in its parent's
 * frame, and a pose is one rotation per joint: {@link world} composes `A_child = A_parent R` down the tree, so the reference rotations
 * return the reference frames and identity rotations the neutral body. A segment's origin is the joint centre it pivots about; its place
 * in its parent's frame, `A_parent^T (o_child - o_parent)`, is a constant of the body.
 */
export namespace AutoMovieHumanSegmentFrame {
  /** A frame from an exact Y and a hint for Z: Z is the hint made square to Y, X = Y x Z. */
  export function fromYZ(
    origin: AutoMovieVector3Tuple,
    y: AutoMovieVector3Tuple,
    z: AutoMovieVector3Tuple,
  ): IAutoMovieHumanSegmentFrame {
    const Y: AutoMovieVector3Tuple = unit(y);
    const Z: AutoMovieVector3Tuple = perpendicular(z, Y);
    return { origin, axes: [cross(Y, Z), Y, Z] };
  }

  /** A frame from an exact Y and a hint for X: X is the hint made square to Y, Z = X x Y. */
  export function fromYX(
    origin: AutoMovieVector3Tuple,
    y: AutoMovieVector3Tuple,
    x: AutoMovieVector3Tuple,
  ): IAutoMovieHumanSegmentFrame {
    const Y: AutoMovieVector3Tuple = unit(y);
    const X: AutoMovieVector3Tuple = perpendicular(x, Y);
    return { origin, axes: [X, Y, cross(X, Y)] };
  }

  /** A frame from an exact X and a hint for Y: Y is the hint made square to X, Z = X x Y. */
  export function fromXY(
    origin: AutoMovieVector3Tuple,
    x: AutoMovieVector3Tuple,
    y: AutoMovieVector3Tuple,
  ): IAutoMovieHumanSegmentFrame {
    const X: AutoMovieVector3Tuple = unit(x);
    const Y: AutoMovieVector3Tuple = perpendicular(y, X);
    return { origin, axes: [X, Y, cross(X, Y)] };
  }

  /** A frame at `origin` with the axes of `parent`: a segment rigid to and parallel with its parent. */
  export function parallel(
    origin: AutoMovieVector3Tuple,
    parent: IAutoMovieHumanSegmentFrame,
  ): IAutoMovieHumanSegmentFrame {
    return {
      origin,
      axes: [[...parent.axes[0]], [...parent.axes[1]], [...parent.axes[2]]],
    };
  }

  /**
   * The humerus, Wu et al. 2005 2.3.4 option 1, on the stored side: Y from the epicondyles' midpoint to the glenohumeral centre, X the
   * normal of the plane through GH, EL and EM, forward, Z = X x Y. With EL lateral (+Z) and EM medial, `(EL - GH) x (EM - GH)` points
   * forward, so no hint is needed. ISB's origin is GH, which is also the joint the segment pivots about.
   */
  export function humerus(
    gh: AutoMovieVector3Tuple,
    el: AutoMovieVector3Tuple,
    em: AutoMovieVector3Tuple,
  ): IAutoMovieHumanSegmentFrame {
    const Y: AutoMovieVector3Tuple = unit(sub(gh, mid(el, em)));
    const X: AutoMovieVector3Tuple = perpendicular(
      cross(sub(el, gh), sub(em, gh)),
      Y,
    );
    return { origin: gh, axes: [X, Y, cross(X, Y)] };
  }

  /**
   * The forearm, Wu et al. 2005 2.3.6, on the stored side: Y from the ulnar styloid US to the epicondyles' midpoint, X the normal of the
   * plane through US, RS and that midpoint, forward, Z = X x Y. With RS lateral of US in the anatomical position, `(E - US) x (RS - US)`
   * points forward. The origin is the elbow centre the segment pivots about; ISB's origin US is a constant translation inside the segment
   * that changes no axis and no joint angle.
   */
  export function forearm(
    elbow: AutoMovieVector3Tuple,
    us: AutoMovieVector3Tuple,
    rs: AutoMovieVector3Tuple,
    el: AutoMovieVector3Tuple,
    em: AutoMovieVector3Tuple,
  ): IAutoMovieHumanSegmentFrame {
    const e: AutoMovieVector3Tuple = mid(el, em);
    const Y: AutoMovieVector3Tuple = unit(sub(e, us));
    const X: AutoMovieVector3Tuple = perpendicular(
      cross(sub(e, us), sub(rs, us)),
      Y,
    );
    return { origin: elbow, axes: [X, Y, cross(X, Y)] };
  }

  /**
   * The femur, Wu et al. 2002 4.4, on the stored side: Y from the femoral epicondyles' midpoint to the hip centre, Z the lateral
   * epicondyle's direction from the medial one made square to Y (in the plane of the hip centre and both epicondyles, to the right on the
   * stored side), X = Y x Z. ISB's origin is the hip centre, the joint the segment pivots about.
   */
  export function femur(
    hip: AutoMovieVector3Tuple,
    lateral: AutoMovieVector3Tuple,
    medial: AutoMovieVector3Tuple,
  ): IAutoMovieHumanSegmentFrame {
    return fromYZ(hip, sub(hip, mid(lateral, medial)), sub(lateral, medial));
  }

  /** The axes as the columns of a matrix. */
  export function matrix(
    frame: IAutoMovieHumanSegmentFrame,
  ): AutoMovieMatrix3Tuple {
    const [x, y, z]: [
      AutoMovieVector3Tuple,
      AutoMovieVector3Tuple,
      AutoMovieVector3Tuple,
    ] = frame.axes;
    return [
      [x[0], y[0], z[0]],
      [x[1], y[1], z[1]],
      [x[2], y[2], z[2]],
    ];
  }

  /** The frame whose axes are the columns of `m`. */
  export function columns(
    origin: AutoMovieVector3Tuple,
    m: AutoMovieMatrix3Tuple,
  ): IAutoMovieHumanSegmentFrame {
    return {
      origin,
      axes: [
        [m[0][0], m[1][0], m[2][0]],
        [m[0][1], m[1][1], m[2][1]],
        [m[0][2], m[1][2], m[2][2]],
      ],
    };
  }

  /** A point of the figure's frame in the segment's frame: `A^T (p - o)`. */
  export function toLocal(
    frame: IAutoMovieHumanSegmentFrame,
    p: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return toLocalDirection(frame, sub(p, frame.origin));
  }

  /** A direction of the figure's frame in the segment's frame: `A^T d`. */
  export function toLocalDirection(
    frame: IAutoMovieHumanSegmentFrame,
    d: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return [
      dot(frame.axes[0], d),
      dot(frame.axes[1], d),
      dot(frame.axes[2], d),
    ];
  }

  /** A point of the segment's frame in the figure's frame: `o + A q`. */
  export function toWorld(
    frame: IAutoMovieHumanSegmentFrame,
    q: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return add(frame.origin, toWorldDirection(frame, q));
  }

  /** A direction of the segment's frame in the figure's frame: `A q`. */
  export function toWorldDirection(
    frame: IAutoMovieHumanSegmentFrame,
    q: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    const [x, y, z]: [
      AutoMovieVector3Tuple,
      AutoMovieVector3Tuple,
      AutoMovieVector3Tuple,
    ] = frame.axes;
    return [
      x[0] * q[0] + y[0] * q[1] + z[0] * q[2],
      x[1] * q[0] + y[1] * q[1] + z[1] * q[2],
      x[2] * q[0] + y[2] * q[1] + z[2] * q[2],
    ];
  }

  /** `child`, written in `parent`'s frame, placed in the figure's frame: the rigid transform `parent o child`. */
  export function compose(
    parent: IAutoMovieHumanSegmentFrame,
    child: IAutoMovieHumanSegmentFrame,
  ): IAutoMovieHumanSegmentFrame {
    return {
      origin: toWorld(parent, child.origin),
      axes: [
        toWorldDirection(parent, child.axes[0]),
        toWorldDirection(parent, child.axes[1]),
        toWorldDirection(parent, child.axes[2]),
      ],
    };
  }

  /** The inverse rigid transform: the figure's frame written in the segment's frame, so `compose(frame, inverse(frame))` is the identity. */
  export function inverse(
    frame: IAutoMovieHumanSegmentFrame,
  ): IAutoMovieHumanSegmentFrame {
    const m: AutoMovieMatrix3Tuple = transpose(matrix(frame));
    return columns(scale(multiplyVector(m, frame.origin), -1), m);
  }

  /** `child` written in `parent`'s frame: its origin `A_p^T (o_c - o_p)` and its rotation `A_p^T A_c`. */
  export function relative(
    parent: IAutoMovieHumanSegmentFrame,
    child: IAutoMovieHumanSegmentFrame,
  ): IAutoMovieHumanSegmentFrame.IRelativeResult {
    return {
      offset: toLocal(parent, child.origin),
      rotation: multiply(transpose(matrix(parent)), matrix(child)),
    };
  }

  /**
   * The twin's frame: the reflection `S = diag(1, 1, -1)` in z = 0 of the origin, X and Y, with Z = X' x Y' = -S Z so the twin stays
   * right-handed. Its joint rotations are `D R D` with `D = diag(1, 1, -1)`, since `S A D` replaces `A` on both sides.
   */
  export function mirror(
    frame: IAutoMovieHumanSegmentFrame,
  ): IAutoMovieHumanSegmentFrame {
    const s = (v: AutoMovieVector3Tuple): AutoMovieVector3Tuple => [
      v[0],
      v[1],
      -v[2],
    ];
    const [x, y, z]: [
      AutoMovieVector3Tuple,
      AutoMovieVector3Tuple,
      AutoMovieVector3Tuple,
    ] = frame.axes;
    return { origin: s(frame.origin), axes: [s(x), s(y), scale(s(z), -1)] };
  }

  /**
   * Convert parent-first frames in common figure coordinates into parent-local
   * joint offsets and reference rotations. A root retains figure coordinates.
   */
  export function chain(
    segments: IAutoMovieHumanSegmentFrame.ChainSegments,
  ): IAutoMovieHumanSegmentJoint[] {
    const placed: Map<string, IAutoMovieHumanSegmentFrame> = new Map();
    return segments.map(
      (segment: {
        name: string;
        parent: string | null;
        frame: IAutoMovieHumanSegmentFrame;
      }): IAutoMovieHumanSegmentJoint => {
        placed.set(segment.name, segment.frame);
        if (segment.parent === null)
          return {
            name: segment.name,
            parent: null,
            offset: [...segment.frame.origin],
            rotation: matrix(segment.frame),
          };
        const parent: IAutoMovieHumanSegmentFrame | undefined = placed.get(
          segment.parent,
        );
        if (parent === undefined)
          throw new Error(
            "Segment " +
              segment.name +
              " precedes its parent " +
              segment.parent,
          );
        return {
          name: segment.name,
          parent: segment.parent,
          ...relative(parent, segment.frame),
        };
      },
    );
  }

  /**
   * The frames of a posed chain: `A_child = A_parent R` and `o_child = o_parent + A_parent offset`, parent first. `pose` gives a joint's
   * replacement rotation by name; undefined keeps its reference rotation, so
   * `world(joints, () => undefined)` reconstructs the reference frames. A supplied
   * rotation replaces that reference rather than multiplying it as a delta.
   */
  export function world(
    joints: readonly IAutoMovieHumanSegmentJoint[],
    pose: IAutoMovieHumanSegmentFrame.WorldPose,
  ): Map<string, IAutoMovieHumanSegmentFrame> {
    const out: Map<string, IAutoMovieHumanSegmentFrame> = new Map();
    for (const joint of joints) {
      const rotation: AutoMovieMatrix3Tuple =
        pose(joint.name) ?? joint.rotation;
      if (joint.parent === null) {
        out.set(joint.name, columns([...joint.offset], rotation));
        continue;
      }
      const parent: IAutoMovieHumanSegmentFrame | undefined = out.get(
        joint.parent,
      );
      if (parent === undefined)
        throw new Error(
          "Joint " + joint.name + " precedes its parent " + joint.parent,
        );
      out.set(
        joint.name,
        columns(
          toWorld(parent, joint.offset),
          multiply(matrix(parent), rotation),
        ),
      );
    }
    return out;
  }

  /** The rotation by `angle` radians about the unit axis `axis` (0 X, 1 Y, 2 Z) of the frame it acts in. */
  export function about(axis: 0 | 1 | 2, angle: number): AutoMovieMatrix3Tuple {
    const c: number = Math.cos(angle);
    const s: number = Math.sin(angle);
    if (axis === 0)
      return [
        [1, 0, 0],
        [0, c, -s],
        [0, s, c],
      ];
    if (axis === 1)
      return [
        [c, 0, s],
        [0, 1, 0],
        [-s, 0, c],
      ];
    return [
      [c, -s, 0],
      [s, c, 0],
      [0, 0, 1],
    ];
  }

  /**
   * The ISB joint-coordinate angles of a Z-X-Y Cardan sequence (Grood and Suntay 1983, as ISB writes the hip, knee and ankle in Wu et al.
   * 2002 and the elbow and wrist in Wu et al. 2005): `R = Rz(a) Rx(b) Ry(c)` with a about the parent's Z (flexion), b about the floating
   * axis (adduction or deviation) and c about the child's Y (axial rotation), radians. From the product,
   * `R[2][1] = sin b`, `R[0][1] = -sin a cos b`, `R[1][1] = cos a cos b`, `R[2][0] = -cos b sin c`, `R[2][2] = cos b cos c`.
   */
  export function cardanZXY(
    r: AutoMovieMatrix3Tuple,
  ): IAutoMovieHumanSegmentFrame.CardanZXYResult {
    return [
      Math.atan2(-r[0][1], r[1][1]),
      Math.asin(Math.max(-1, Math.min(1, r[2][1]))),
      Math.atan2(-r[2][0], r[2][2]),
    ];
  }

  /**
   * The ISB shoulder angles, a Y-X-Y Euler sequence (Wu et al. 2005 2.4.7, the humerus relative to the thorax): `R = Ry(a) Rx(b) Ry(c)`
   * with a the plane of elevation (0 abduction, 90 degrees forward flexion), b the elevation and c the axial rotation (internal
   * positive), radians. The text writes "elevation (negative)", and its footnote 5 that the second rotation is by definition in the
   * negative direction as a consequence of the chosen axes, so the branch with b in [-pi, 0] is returned: an arm raised sideways reads
   * a plane of elevation near 0 and a negative elevation. From the product, `R[1][1] = cos b`, `R[0][1] = sin a sin b`, `R[2][1] = cos a sin b`,
   * `R[1][0] = sin b sin c`, `R[1][2] = -sin b cos c`, so with `sin b <= 0`: `a = atan2(-R[0][1], -R[2][1])`, `c = atan2(-R[1][0], R[1][2])`.
   */
  export function eulerYXY(
    r: AutoMovieMatrix3Tuple,
  ): IAutoMovieHumanSegmentFrame.EulerYXYResult {
    return [
      Math.atan2(-r[0][1], -r[2][1]),
      -Math.acos(Math.max(-1, Math.min(1, r[1][1]))),
      Math.atan2(-r[1][0], r[1][2]),
    ];
  }

  /** Matrix product. */
  export function multiply(
    a: AutoMovieMatrix3Tuple,
    b: AutoMovieMatrix3Tuple,
  ): AutoMovieMatrix3Tuple {
    const row = (i: number): AutoMovieVector3Tuple =>
      [0, 1, 2].map(
        (j: number): number =>
          a[i]![0] * b[0][j]! + a[i]![1] * b[1][j]! + a[i]![2] * b[2][j]!,
      ) as AutoMovieVector3Tuple;
    return [row(0), row(1), row(2)];
  }

  /** Matrix times a vector. */
  export function multiplyVector(
    m: AutoMovieMatrix3Tuple,
    v: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return [dot(m[0], v), dot(m[1], v), dot(m[2], v)];
  }

  /** Transpose. */
  export function transpose(m: AutoMovieMatrix3Tuple): AutoMovieMatrix3Tuple {
    return [
      [m[0][0], m[1][0], m[2][0]],
      [m[0][1], m[1][1], m[2][1]],
      [m[0][2], m[1][2], m[2][2]],
    ];
  }

  /** The identity rotation. */
  export const IDENTITY: AutoMovieMatrix3Tuple = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];

  /** Midpoint. */
  export function mid(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  }

  /** Difference. */
  export function sub(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /** Sum. */
  export function add(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  /** Multiple. */
  export function scale(
    a: AutoMovieVector3Tuple,
    s: number,
  ): AutoMovieVector3Tuple {
    return [a[0] * s, a[1] * s, a[2] * s];
  }

  /** Scalar product. */
  export function dot(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /** Right-handed vector product. */
  export function cross(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  /** Unit vector; a zero vector has no direction and is refused. */
  export function unit(a: AutoMovieVector3Tuple): AutoMovieVector3Tuple {
    const l: number = Math.hypot(a[0], a[1], a[2]);
    if (!(l > 0)) throw new Error("A segment axis has no direction");
    return [a[0] / l, a[1] / l, a[2] / l];
  }

  /** `a` made square to the unit `n`, unit; `a` along `n` has no square part and is refused. */
  export function perpendicular(
    a: AutoMovieVector3Tuple,
    n: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return unit(sub(a, scale(n, dot(a, n))));
  }
}
