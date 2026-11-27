import type {
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointRotationDomain,
  IAutoMovieQuaternion,
  IAutoMovieResolvedJointAngles,
  IAutoMovieRestFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import { nearestAngleAlias } from "../../math/internal/nearestAngleAlias";
import { AutoMovieEngineClinicalAngle } from "../../rom/internal/AutoMovieEngineClinicalAngle";
import { alternateRigJointAngles } from "./alternateRigJointAngles";
import { jointRomOvershoot } from "./jointRomOvershoot";

/*
 * decomposeJointRotation on a basis its caller already admitted and
 * normalized through normalizeJointAxes: the extraction itself, with no
 * validation of the basis.
 *
 * A solver that decomposes hundreds of candidate rotations of one joint
 * normalizes that joint's basis once and calls this for each candidate, so the
 * basis is checked once per solve rather than once per candidate. The angles,
 * the gimbal convention, the handedness correction, the frame lift and the
 * chart choice are `decomposeJointRotation`'s, which documents them and is this
 * function behind one normalization.
 *
 * A basis that is not orthonormal gives angles that do not rebuild the
 * rotation; nothing here detects it.
 * Parameter q: Bone-local articulation rotation; unit length expected.
 * Parameter basis: Orthonormal clinical axis basis, as `normalizeJointAxes` returns
 * it.
 * Parameter frame: Rest frame lifting rest-relative angles to clinical ones;
 * omitted, the angles stay rest-relative.
 * Parameter domain: Bone and resolved ROM that choose among equivalent charts;
 * omitted or with a `null` constraint, the principal chart is returned.
 */
export namespace decomposeJointRotationOnBasis {
  /*
   * Read clinical joint angles from a quaternion on its admitted basis.
   */
  export function run(
    q: IAutoMovieQuaternion,
    basis: IAutoMovieJointAxes,
    frame?: IAutoMovieRestFrame | undefined,
    domain?: IAutoMovieJointRotationDomain | undefined,
  ): IAutoMovieResolvedJointAngles {
    return extract(q, basis, frame, domain);
  }

  /*
   * Fixed-rig metadata for independent inverse queries.
   */

  /*
   * Borrow one unchanged admitted basis/frame/domain and return independent
   * stateless readers. Construction reads no numerical input. Every actual q
   * still receives finite admission, extraction and principal/alternate
   * clinical conversion in the original order; only successful affine metadata
   * is shared. A fixed operation may reuse its stateless reader; release it
   * with the source. Outputs remain fresh and local, with no target-specific
   * state in a reader.
   */
  export function prepareQueries(
    basis: IAutoMovieJointAxes,
    frame?: IAutoMovieRestFrame,
    domain?: IAutoMovieJointRotationDomain,
  ): () => (q: IAutoMovieQuaternion) => IAutoMovieResolvedJointAngles {
    const readers: IClinicalReaders = {
      flexion: AutoMovieEngineClinicalAngle.prepareToClinicalAngle(),
      abduction: AutoMovieEngineClinicalAngle.prepareToClinicalAngle(),
      twist: AutoMovieEngineClinicalAngle.prepareToClinicalAngle(),
    };
    return (): ((q: IAutoMovieQuaternion) => IAutoMovieResolvedJointAngles) =>
      (q: IAutoMovieQuaternion): IAutoMovieResolvedJointAngles =>
        extract(q, basis, frame, domain, readers);
  }

  /*
   * The same decomposition with the ROM overshoot its chart choice scored for
   * the reading it returns, written into `into`: the gate's own sum
   * (`jointRomOvershoot`) of the returned angles under the domain's constraint,
   * which a caller ranking the reading by that sum need not scan again.
   * Undefined where the choice scored no such sum: no domain or a null
   * constraint, or a constraint gated by swing and twist, whose readings are
   * ranked by its box alone.
   * Parameter q: Bone-local articulation rotation; unit length expected.
   * Parameter basis: Orthonormal clinical axis basis, as `normalizeJointAxes`
   * returns it.
   * Parameter frame: Rest frame lifting rest-relative angles to clinical ones.
   * Parameter domain: Bone and resolved ROM that choose among equivalent charts.
   * Parameter into: Receives the overshoot, degrees, or undefined.
   * Returns: The angles `decomposeJointRotationOnBasis` returns.
   */
  export function scored(
    q: IAutoMovieQuaternion,
    basis: IAutoMovieJointAxes,
    frame: IAutoMovieRestFrame | undefined,
    domain: IAutoMovieJointRotationDomain | undefined,
    into: IScore,
  ): IAutoMovieResolvedJointAngles {
    into.overshoot = undefined;
    return extract(q, basis, frame, domain, undefined, into);
  }

  /*
   * Where `scored` collects the reading's overshoot: degrees, undefined where
   * the chart choice scored none.
   */
  export interface IScore {
    /*
     * The overshoot, degrees, or undefined.
     */
    overshoot: number | undefined;
  }
}

/*
 * Degrees per radian for the closed-form angle extraction.
 */
const RAD2DEG: number = 180 / Math.PI;

/*
 * Projected cosine at or below which the gimbal convention pins one outer
 * angle: the square root of the binary64 unit roundoff, about 1.5e-8.
 *
 * With a projected cosine `c`, the two outer angles are read from matrix
 * entries of size `c` that carry a rounding error of about one unit roundoff
 * `e`, so each is uncertain by about `e / c` radians; pinning one of them to
 * zero instead rebuilds the rotation within `c` times the pinned angle. The two
 * errors meet at `c = sqrt(e)`, the usual balance of a rounding against a
 * truncation error, where both are near 1e-8 radian. A narrower band leaves
 * turns whose outer angles are rounding noise, tens of degrees at `c` near
 * 1e-15, which a caller that holds one of the two (a hinge's immobile abduction
 * clamped to zero) then shows as a rotation error of that size: an elbow held
 * at a right angle read a different forearm twist every call. Resolvable
 * near-gimbal turns, from about a millionth of a degree off the right angle,
 * stay active.
 */
const GIMBAL_COSINE_EPSILON: number = Math.sqrt(Number.EPSILON);

/*
 * The axis rotated by `q`, `readRotatedVector`'s expressions, into three cells
 * from `offset`.
 */
function rotateInto(
  q: IAutoMovieQuaternion,
  v: IAutoMovieVector3,
  columns: Float64Array,
  offset: number,
): void {
  const tx: number = 2 * (q.y * v.z - q.z * v.y);
  const ty: number = 2 * (q.z * v.x - q.x * v.z);
  const tz: number = 2 * (q.x * v.y - q.y * v.x);
  columns[offset] = v.x + q.w * tx + (q.y * tz - q.z * ty);
  columns[offset + 1] = v.y + q.w * ty + (q.z * tx - q.x * tz);
  columns[offset + 2] = v.z + q.w * tz + (q.x * ty - q.y * tx);
}

/*
 * Original dot read/multiply/add order against one completed private column.
 */
function columnDot(
  axis: IAutoMovieVector3,
  columns: Float64Array,
  offset: number,
): number {
  return (
    axis.x * columns[offset]! +
    axis.y * columns[offset + 1]! +
    axis.z * columns[offset + 2]!
  );
}

/*
 * All actual quaternion admission, extraction, clinical lift and chart
 * selection.
 */
function extract(
  q: IAutoMovieQuaternion,
  basis: IAutoMovieJointAxes,
  frame?: IAutoMovieRestFrame,
  domain?: IAutoMovieJointRotationDomain,
  readers?: IClinicalReaders,
  into?: decomposeJointRotationOnBasis.IScore,
): IAutoMovieResolvedJointAngles {
  // Right-handedness of the basis: +1 when flex × abd = +twist. A left-handed
  // triple is made right-handed by extracting against −twist, then negating the
  // recovered twist (a rotation about −t by θ is one about t by −θ).
  const { handed, twistAxis }: IHandedness = handednessOf(basis);

  // The three rotated axes in nine cells: every dot below reads them before
  // `lift` runs.
  const columns: Float64Array = new Float64Array(9);
  rotateInto(q, basis.flexion, columns, 0);
  rotateInto(q, basis.abduction, columns, 3);
  rotateInto(q, twistAxis, columns, 6);

  // Entries of R' = Mᵀ R M (M = [flex|abd|twist]): R'[i][j] = axisᵢ · (R axisⱼ).
  if (basis.rotationOrder === "flexion-abduction-twist") {
    // R = Rx(f)·Ry(a)·Rz(h*t) in the same right-handed basis.
    const m02: number = columnDot(basis.flexion, columns, 6);
    const m12: number = columnDot(basis.abduction, columns, 6);
    const m22: number = columnDot(twistAxis, columns, 6);
    const cosine: number = Math.hypot(m12, m22);
    return lift(
      cosine <= GIMBAL_COSINE_EPSILON
        ? {
            // With the last angle pinned, the rotated abduction axis gives flexion.
            flexion:
              Math.atan2(
                columnDot(twistAxis, columns, 3),
                columnDot(basis.abduction, columns, 3),
              ) * RAD2DEG,
            abduction: m02 > 0 ? 90 : -90,
            twist: 0,
          }
        : {
            flexion: Math.atan2(-m12, m22) * RAD2DEG,
            abduction: Math.atan2(m02, cosine) * RAD2DEG,
            twist:
              handed *
              Math.atan2(
                -columnDot(basis.flexion, columns, 3),
                columnDot(basis.flexion, columns, 0),
              ) *
              RAD2DEG,
          },
      basis,
      handed,
      frame,
      domain,
      readers,
      into,
    );
  }
  if (basis.twistPlacement === "distal") {
    // R = Ry(a)·Rx(f)·Rz(t): R12 = −sin f, R02 = sin a cos f, R22 = cos a cos f,
    // R10 = cos f sin t, R11 = cos f cos t (row i: basis axis i, column j:
    // basis axis j rotated)
    const r12: number = columnDot(basis.abduction, columns, 6);
    const r10: number = columnDot(basis.abduction, columns, 0);
    const r11: number = columnDot(basis.abduction, columns, 3);
    const cosine: number = Math.hypot(r10, r11);
    if (cosine <= GIMBAL_COSINE_EPSILON) {
      // with abduction pinned to 0, R = Rx(±90°)·Rz(t): R00 = cos t, R01 = −sin t
      const r00: number = columnDot(basis.flexion, columns, 0);
      const r01: number = columnDot(basis.flexion, columns, 3);
      return lift(
        {
          flexion: r12 < 0 ? 90 : -90,
          abduction: 0,
          twist: handed * Math.atan2(-r01, r00) * RAD2DEG,
        },
        basis,
        handed,
        frame,
        domain,
        readers,
        into,
      );
    }
    return lift(
      {
        flexion: Math.atan2(-r12, cosine) * RAD2DEG,
        abduction:
          Math.atan2(
            columnDot(basis.flexion, columns, 6),
            columnDot(twistAxis, columns, 6),
          ) * RAD2DEG,
        twist: handed * Math.atan2(r10, r11) * RAD2DEG,
      },
      basis,
      handed,
      frame,
      domain,
      readers,
      into,
    );
  }

  const m00: number = columnDot(basis.flexion, columns, 0);
  const m10: number = columnDot(basis.abduction, columns, 0);
  const m20: number = columnDot(twistAxis, columns, 0);
  const m21: number = columnDot(twistAxis, columns, 3);
  const m22: number = columnDot(twistAxis, columns, 6);

  const cosine: number = Math.hypot(m00, m10);
  if (cosine <= GIMBAL_COSINE_EPSILON) {
    // Gimbal: abduction = ±90°, flexion folds into twist. Pin flexion = 0.
    const m01: number = columnDot(basis.flexion, columns, 3);
    const m11: number = columnDot(basis.abduction, columns, 3);
    // Both gimbals leave only (twist ± flexion) determined; with flexion pinned
    // to 0, twist = −atan2(R'[0][1], R'[1][1]) reconstructs the rotation.
    const abduction: number = m20 < 0 ? 90 : -90;
    const twist: number = -Math.atan2(m01, m11) * RAD2DEG;
    return lift(
      { flexion: 0, abduction, twist: handed * twist },
      basis,
      handed,
      frame,
      domain,
      readers,
      into,
    );
  }

  return lift(
    {
      flexion: Math.atan2(m21, m22) * RAD2DEG,
      abduction: Math.atan2(-m20, cosine) * RAD2DEG,
      twist: handed * Math.atan2(m10, m00) * RAD2DEG,
    },
    basis,
    handed,
    frame,
    domain,
    readers,
    into,
  );
}

/*
 * Lift the three numerical rig angles through the unchanged clinical frame.
 */
function clinical(
  rig: IAutoMovieResolvedJointAngles,
  frame: IAutoMovieRestFrame | undefined,
  readers: IClinicalReaders | undefined,
): IAutoMovieResolvedJointAngles {
  // toClinicalAngle only returns null for a null input; these are numbers.
  if (readers !== undefined)
    return {
      flexion: readers.flexion(rig.flexion, frame?.flexion)!,
      abduction: readers.abduction(rig.abduction, frame?.abduction)!,
      twist: readers.twist(rig.twist, frame?.twist)!,
    };
  return {
    flexion: AutoMovieEngineClinicalAngle.toClinicalAngle(
      rig.flexion,
      frame?.flexion,
    )!,
    abduction: AutoMovieEngineClinicalAngle.toClinicalAngle(
      rig.abduction,
      frame?.abduction,
    )!,
    twist: AutoMovieEngineClinicalAngle.toClinicalAngle(
      rig.twist,
      frame?.twist,
    )!,
  };
}

/*
 * Read each candidate's full-turn alias against its corresponding box interval.
 */
function align(
  candidate: IAutoMovieResolvedJointAngles,
  constraint: IAutoMovieJointConstraint,
): IAutoMovieResolvedJointAngles {
  return {
    flexion: nearestAngleAlias(candidate.flexion, constraint.flexion),
    abduction: nearestAngleAlias(candidate.abduction, constraint.abduction),
    twist: nearestAngleAlias(candidate.twist, constraint.twist),
  };
}

/*
 * Preserve principal/alternate chart construction, score order and
 * principal-on-tie selection.
 */
function lift(
  rig: IAutoMovieResolvedJointAngles,
  basis: IAutoMovieJointAxes,
  handed: 1 | -1,
  frame: IAutoMovieRestFrame | undefined,
  domain: IAutoMovieJointRotationDomain | undefined,
  readers: IClinicalReaders | undefined,
  into: decomposeJointRotationOnBasis.IScore | undefined,
): IAutoMovieResolvedJointAngles {
  const principal: IAutoMovieResolvedJointAngles = clinical(
    rig,
    frame,
    readers,
  );
  if (domain === undefined || domain.constraint === null) return principal;

  // Both Euler readings of one rotation share its swing-twist status; the
  // unchanged three-angle box ranks only the readings the pose can report.
  const constraint: IAutoMovieJointConstraint = boxOf(domain.constraint);
  let selected: IAutoMovieResolvedJointAngles = principal;
  let overshoot: number = jointRomOvershoot(
    { bone: domain.bone, ...selected },
    constraint,
  );

  // A principal reading inside the box is the answer, and the alternate
  // chart, three sums of these finite angles through the frame the principal
  // has just admitted, can neither fail nor improve on it: it is read only
  // where the principal overshoots.
  if (overshoot === 0) {
    if (into !== undefined && constraint === domain.constraint)
      into.overshoot = 0;
    return selected;
  }
  const alternate: IAutoMovieResolvedJointAngles = clinical(
    alternateRigJointAngles(
      rig,
      basis.rotationOrder === "flexion-abduction-twist"
        ? undefined
        : basis.twistPlacement,
      handed,
    ),
    frame,
    readers,
  );
  for (let index: number = 0; index < 2; index++) {
    // Nonnegative ROM fault distances cannot improve an exact zero score.
    // Both clinical charts already passed their original frame admission.
    // Numeric aliases cannot improve zero and therefore need no allocation.
    if (overshoot === 0) break;
    const candidate: IAutoMovieResolvedJointAngles = align(
      index === 0 ? principal : alternate,
      constraint,
    );

    // An unchanged alias scores the same and cannot be strictly better.
    if (
      Object.is(candidate.flexion, selected.flexion) &&
      Object.is(candidate.abduction, selected.abduction) &&
      Object.is(candidate.twist, selected.twist)
    )
      continue;
    const next: number = jointRomOvershoot(
      { bone: domain.bone, ...candidate },
      constraint,
    );
    if (next < overshoot) {
      selected = candidate;
      overshoot = next;
    }
  }
  if (into !== undefined && constraint === domain.constraint)
    into.overshoot = overshoot;
  return selected;
}

/*
 * A basis's handedness and signed twist axis, one cross product and one dot
 * product read directly from the basis.
 */
const handednessOf: (basis: IAutoMovieJointAxes) => IHandedness = (
  basis: IAutoMovieJointAxes,
): IHandedness => {
  // Right-handedness of the basis: +1 when flex × abd = +twist. A left-handed
  // triple is made right-handed by extracting against −twist, then negating the
  // recovered twist (a rotation about −t by θ is one about t by −θ).
  const handed: 1 | -1 =
    AutoMovieEngineVector3.dot(basis.twist, AutoMovieEngineVector3.cross(basis.flexion, basis.abduction)) >= 0
      ? 1
      : -1;
  return { handed, twistAxis: AutoMovieEngineVector3.scale(basis.twist, handed) };
};

/*
 * A constraint as the readings are ranked by: itself, or for one gated by swing
 * and twist a copy with that gate set aside.
 */
const boxOf: (
  constraint: IAutoMovieJointConstraint,
) => IAutoMovieJointConstraint = (
  constraint: IAutoMovieJointConstraint,
): IAutoMovieJointConstraint =>
  constraint.swingTwist === undefined || constraint.swingTwist === null
    ? constraint
    : { ...constraint, swingTwist: null };

/*
 * Three lazy successful affine readings, independent of every quaternion/chart.
 */
type IClinicalReaders = Readonly<
  Record<
    keyof IAutoMovieResolvedJointAngles,
    ReturnType<typeof AutoMovieEngineClinicalAngle.prepareToClinicalAngle>
  >
>;

/*
 * A basis's handedness and the twist axis an extraction reads against.
 */
interface IHandedness {
  /*
   * +1 when flexion × abduction = +twist, else -1.
   */
  handed: 1 | -1;

  /*
   * The twist axis times the handedness.
   */
  twistAxis: IAutoMovieVector3;
}
