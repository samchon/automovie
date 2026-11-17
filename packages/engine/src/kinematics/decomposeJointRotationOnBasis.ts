import type {
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointRotationDomain,
  IAutoMovieQuaternion,
  IAutoMovieResolvedJointAngles,
  IAutoMovieRestFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { nearestAngleAlias } from "../math/nearestAngleAlias";
import { readRotatedVector } from "../math/readRotatedVector";
import { toClinicalAngle } from "../rom/toClinicalAngle";
import { alternateRigJointAngles } from "./alternateRigJointAngles";
import { jointRomOvershoot } from "./jointRomOvershoot";
import { normalizeJointAxes } from "./normalizeJointAxes";

/** Degrees per radian for the closed-form angle extraction. */
const RAD2DEG: number = 180 / Math.PI;

/** Quaternion components in their existing finite-admission order. */
const QUATERNION_AXES: readonly ["x", "y", "z", "w"] = ["x", "y", "z", "w"];

/** Keep all original rotations before any dot, without per-column vector records. */
function appendRotation(
  x: number,
  y: number,
  z: number,
  columns: number[],
): void {
  columns.push(x, y, z);
}

/** Original dot read/multiply/add order against one completed private column. */
function columnDot(
  axis: IAutoMovieVector3,
  columns: readonly number[],
  offset: number,
): number {
  return (
    axis.x * columns[offset]! +
    axis.y * columns[offset + 1]! +
    axis.z * columns[offset + 2]!
  );
}

/** Three lazy successful affine readings, independent of every quaternion/chart. */
type IClinicalReaders = Readonly<
  Record<
    keyof IAutoMovieResolvedJointAngles,
    ReturnType<typeof toClinicalAngle.prepare>
  >
>;

/**
 * Projected cosine at or below which the gimbal convention pins one outer
 * angle: the square root of the binary64 unit roundoff, about 1.5e-8.
 *
 * With a projected cosine `c`, the two outer angles are read from matrix
 * entries of size `c` that carry a rounding error of about one unit roundoff
 * `e`, so each is uncertain by about `e / c` radians; pinning one of them to
 * zero instead rebuilds the rotation within `c` times the pinned angle. The
 * two errors meet at `c = sqrt(e)`, the usual balance of a rounding against a
 * truncation error, where both are near 1e-8 radian. A narrower band leaves
 * turns whose outer angles are rounding noise, tens of degrees at `c` near
 * 1e-15, which a caller that holds one of the two (a hinge's immobile
 * abduction clamped to zero) then shows as a rotation error of that size: an
 * elbow held at a right angle read a different forearm twist every call.
 * Resolvable near-gimbal turns, from about a millionth of a degree off the
 * right angle, stay active.
 */
const GIMBAL_COSINE_EPSILON: number = Math.sqrt(Number.EPSILON);

/** Reject the first nonfinite component at the inverse's existing diagnostic path. */
const assertFiniteQuaternion: (q: IAutoMovieQuaternion) => void = (
  q: IAutoMovieQuaternion,
): void => {
  for (const axis of QUATERNION_AXES) {
    const value: number = q[axis];
    if (!Number.isFinite(value))
      throw new Error(
        `decomposeJointRotation quaternion.${axis} must be finite, but was ${value}`,
      );
  }
};

/**
 * {@link decomposeJointRotation} on a basis its caller already admitted and
 * normalized through {@link normalizeJointAxes}: the extraction itself, with
 * no validation of the basis.
 *
 * A solver that decomposes hundreds of candidate rotations of one joint
 * normalizes that joint's basis once and calls this for each candidate, so
 * the basis is checked once per solve rather than once per candidate. The
 * angles, the gimbal convention, the handedness correction, the frame lift
 * and the chart choice are `decomposeJointRotation`'s, which documents them
 * and is this function behind one normalization.
 *
 * Throws on a non-finite quaternion component. A basis that is not
 * orthonormal gives angles that do not rebuild the rotation; nothing here
 * detects it.
 *
 * @param q Bone-local articulation rotation; unit length expected.
 * @param basis Orthonormal clinical axis basis, as `normalizeJointAxes` returns it.
 * @param frame Rest frame lifting rest-relative angles to clinical ones;
 *   omitted, the angles stay rest-relative.
 * @param domain Bone and resolved ROM that choose among equivalent charts;
 *   omitted or with a `null` constraint, the principal chart is returned.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the caller's prior basis admission, shared inverse conventions, error/invalid-basis behavior and optional domain. prepareQueries documents unchanged rig metadata, no constructor numerical admission, original first-use clinical ordering, independent query readers and fresh outputs/release lifetime.
 * @evidence contracts/development/implementation.md#principled-implementation Closed-form Euler extraction reads each angle's sine and projected cosine through atan2; a projected cosine within the square root of the binary64 unit roundoff, where a rounding error and the pin's truncation error meet, takes the undetermined-angle convention. Among the principal chart, the alternate chart and each angle's full-turn alias nearest its range, the least ROM overshoot wins, and every candidate is the same rotation. Nonnegative fault distances prove that an exact zero score is an unbeatable lower bound under the existing strict-improvement tie rule. A constraint's `swingTwist` is set aside while the readings are ranked, since both readings of one rotation lie equally inside such a gate; the three-angle box ranks them, so the reading a pose reports stays the one it always was.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Direct/prepared readers share one extraction owner. The shared math rotation owner writes three completed columns into one query-local numeric array; original dots follow all rotations through one column reader. Clinical/align/lift helpers receive actual metadata/affine readers without per-call closures; conversion, scoring and aliases retain their owners and raw decomposition still admits the basis first.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Selection compares the caller's unchanged constraint and never clamps an angle into range; the gimbal pin is the standard convention for an undetermined pair and no bone is special-cased. Only exact zero terminates further alias construction/scoring; quaternion admission and the principal chart's conversion keep their original order, and the alternate chart, three sums of the finite principal angles through the frame the principal admitted, is converted only where the principal overshoots, since it can neither fail nor improve on a zero. prepareQueries reads no numerical input at construction, shares successful affine operands only under declared unchanged frame lifetime and admits replaced axis-frame objects at their next actual conversion. Failed admission installs no successful reading. No quaternion, extracted angle, alias, score or target result crosses queries. Pure numeric aliases that cannot improve zero need not be built, and no tolerance/projected answer is substituted. Weak handedness provenance recognizes only the normalizer's actual owned records, never caller-controlled freeze/descriptors or matching values.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three rotations/fixed dots and at most three ROM scores remain constant work. One nine-cell column array replaces three temporary vector records, with no per-rotation closure. Exact zero stops further aliases/scoring, saving at most two aliases/six turn calculations/two fault scans and the former candidate array; a principal inside the box omits the alternate chart and its conversion. Fixed projectors share three lazy affine readers. Genuine owned handedness hits omit snapshots/nine comparisons; unowned inputs retain all nine reads first. Gated-box hits keep original key/count/member checks. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller supplies an admitted basis. The actual projector's prepareQueries shares only successful fixed toClinicalAngle operands; every quaternion still extracts/ranks its own charts. Weak handedness trusts only genuine normalizer-owned immutable results. Unowned/copy/inherited/user-frozen/accessor bases complete the original nine reads once before comparing local snapshots, including misses. A known gated constraint completes Object.keys before private-count gating; only equal counts enter the original ordered member predicate. First misses keep the original spread without a preceding input key pass. No added descriptor-based trust, prototype enumeration or target-dependent result establishes reuse.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Outputs are fresh local angles; one nine-cell column array stays query-local. A prepared source borrows basis/frame/domain, owns three affine closures with at most one frame/two scalars each and one stateless closure per query; release those with the source/query. Direct calls retain no such preparation. Existing weak maps keep one nine-scalar handedness snapshot/signed twist vector/owner flag per basis and one member-box/key-count record per gated constraint; provenance stays weak. No quaternion, extracted coordinate, alias, score, output history, handle or task is retained.
 */
export function decomposeJointRotationOnBasis(
  q: IAutoMovieQuaternion,
  basis: IAutoMovieJointAxes,
  frame?: IAutoMovieRestFrame | undefined,
  domain?: IAutoMovieJointRotationDomain | undefined,
): IAutoMovieResolvedJointAngles {
  return extract(q, basis, frame, domain);
}

/** All actual quaternion admission, extraction, clinical lift and chart selection. */
function extract(
  q: IAutoMovieQuaternion,
  basis: IAutoMovieJointAxes,
  frame?: IAutoMovieRestFrame,
  domain?: IAutoMovieJointRotationDomain,
  readers?: IClinicalReaders,
): IAutoMovieResolvedJointAngles {
  assertFiniteQuaternion(q);

  // Right-handedness of the basis: +1 when flex × abd = +twist. A left-handed
  // triple is made right-handed by extracting against −twist, then negating the
  // recovered twist (a rotation about −t by θ is one about t by −θ).
  const { handed, twistAxis }: IHandedness = handednessOf(basis);

  const columns: number[] = [];
  readRotatedVector(q, basis.flexion, appendRotation, columns);
  readRotatedVector(q, basis.abduction, appendRotation, columns);
  readRotatedVector(q, twistAxis, appendRotation, columns);

  // Entries of R' = Mᵀ R M (M = [flex|abd|twist]): R'[i][j] = axisᵢ · (R axisⱼ).
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
  );
}

/**
 * Fixed-rig metadata for independent inverse queries.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines an already-admitted unchanged basis/frame/domain, no constructor numerical admission, original first-use frame errors and query-local extraction/chart/output ownership.
 * @evidence contracts/development/design.md#principled-representation Only three successful affine sign/neutral readings depend on the fixed clinical frame; quaternion components, extracted angles, aliases and ROM rankings remain local to each actual inverse call.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepareQueries serves the actual fixed-rig projector's stateless raw-reference inverse without changing raw four-argument decomposition or exposing metadata/result getters.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No caller freeze or dynamic target identity establishes reuse. The raw owner still admits axes before OnBasis, and prepared callers supply that same admitted basis at their original numerical site; no quaternion, branch, alias or target result crosses queries.
 */
export namespace decomposeJointRotationOnBasis {
  /**
   * Borrow one unchanged admitted basis/frame/domain and return independent
   * stateless readers. Construction reads no numerical input. Every actual q still
   * receives finite admission, extraction and principal/alternate clinical
   * conversion in the original order; only successful affine metadata is shared.
   * A fixed operation may reuse its stateless reader; release it with the source.
   * Outputs remain fresh and local, with no target-specific state in a reader.
   */
  export function prepareQueries(
    basis: IAutoMovieJointAxes,
    frame?: IAutoMovieRestFrame,
    domain?: IAutoMovieJointRotationDomain,
  ): () => (q: IAutoMovieQuaternion) => IAutoMovieResolvedJointAngles {
    const readers: IClinicalReaders = {
      flexion: toClinicalAngle.prepare(),
      abduction: toClinicalAngle.prepare(),
      twist: toClinicalAngle.prepare(),
    };
    return (): ((q: IAutoMovieQuaternion) => IAutoMovieResolvedJointAngles) =>
      (q: IAutoMovieQuaternion): IAutoMovieResolvedJointAngles =>
        extract(q, basis, frame, domain, readers);
  }

  /**
   * The same decomposition with the ROM overshoot its chart choice scored
   * for the reading it returns, written into `into`: the gate's own sum
   * (`jointRomOvershoot`) of the returned angles under the domain's
   * constraint, which a caller ranking the reading by that sum need not
   * scan again. NaN where the choice scored no such sum: no domain or a null
   * constraint, or a constraint gated by swing and twist, whose readings are
   * ranked by its box alone.
   *
   * @param q Bone-local articulation rotation; unit length expected.
   * @param basis Orthonormal clinical axis basis, as `normalizeJointAxes` returns it.
   * @param frame Rest frame lifting rest-relative angles to clinical ones.
   * @param domain Bone and resolved ROM that choose among equivalent charts.
   * @param into Receives the overshoot, degrees, or NaN.
   * @returns The angles `decomposeJointRotationOnBasis` returns.
   */
  export function scored(
    q: IAutoMovieQuaternion,
    basis: IAutoMovieJointAxes,
    frame: IAutoMovieRestFrame | undefined,
    domain: IAutoMovieJointRotationDomain | undefined,
    into: { overshoot: number },
  ): IAutoMovieResolvedJointAngles {
    into.overshoot = NaN;
    scoring = into;
    try {
      return extract(q, basis, frame, domain);
    } finally {
      scoring = undefined;
    }
  }
}

/** Lift the three numerical rig angles through the unchanged clinical frame. */
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
    flexion: toClinicalAngle(rig.flexion, frame?.flexion)!,
    abduction: toClinicalAngle(rig.abduction, frame?.abduction)!,
    twist: toClinicalAngle(rig.twist, frame?.twist)!,
  };
}

/** Read each candidate's full-turn alias against its corresponding box interval. */
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

/** Preserve principal/alternate chart construction, score order and principal-on-tie selection. */
function lift(
  rig: IAutoMovieResolvedJointAngles,
  basis: IAutoMovieJointAxes,
  handed: 1 | -1,
  frame: IAutoMovieRestFrame | undefined,
  domain: IAutoMovieJointRotationDomain | undefined,
  readers: IClinicalReaders | undefined,
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
    if (scoring !== undefined && constraint === domain.constraint) scoring.overshoot = 0;
    return selected;
  }
  const alternate: IAutoMovieResolvedJointAngles = clinical(
    alternateRigJointAngles(rig, basis.twistPlacement, handed),
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
  if (scoring !== undefined && constraint === domain.constraint) scoring.overshoot = overshoot;
  return selected;
}

/** Where `decomposeJointRotationOnBasis.scored` collects the reading's overshoot, during its one extraction. */
let scoring: { overshoot: number } | undefined;

/** A basis's handedness and the twist axis an extraction reads against. */
interface IHandedness {
  /** +1 when flexion × abduction = +twist, else -1. */
  handed: 1 | -1;

  /** The twist axis times the handedness. */
  twistAxis: IAutoMovieVector3;
}

/** One basis's completed handedness and proof of when it can be reused. */
interface IHandednessState {
  /** The nine original component values for bases whose data can change. */
  values: readonly number[];

  /** The pure signed-axis metadata used by every extraction on this basis. */
  read: IHandedness;

  /** Whether the normalizer owns this exact immutable own-data basis. */
  fixed: boolean;
}

/** Each basis's handedness, remembered with the components it was read from. */
const HANDEDNESS: WeakMap<IAutoMovieJointAxes, IHandednessState> =
  new WeakMap();

/** A basis's nine components, flexion, abduction and twist, each x, y, z. */
const componentsOf: (basis: IAutoMovieJointAxes) => number[] = (
  basis: IAutoMovieJointAxes,
): number[] => [
  basis.flexion.x,
  basis.flexion.y,
  basis.flexion.z,
  basis.abduction.x,
  basis.abduction.y,
  basis.abduction.z,
  basis.twist.x,
  basis.twist.y,
  basis.twist.z,
];

/** Compare two completed scalar snapshots without rereading caller components. */
function sameComponents(
  values: readonly number[],
  now: readonly number[],
): boolean {
  return (
    Object.is(values[0], now[0]) &&
    Object.is(values[1], now[1]) &&
    Object.is(values[2], now[2]) &&
    Object.is(values[3], now[3]) &&
    Object.is(values[4], now[4]) &&
    Object.is(values[5], now[5]) &&
    Object.is(values[6], now[6]) &&
    Object.is(values[7], now[7]) &&
    Object.is(values[8], now[8])
  );
}

/**
 * A basis's handedness and signed twist axis, read once per basis record
 * when its normalizer owns the immutable record, otherwise while exact
 * comparisons match the original values. Hundreds of limb-fit
 * candidates therefore share the same metadata without caching any inverse.
 */
const handednessOf: (basis: IAutoMovieJointAxes) => IHandedness = (
  basis: IAutoMovieJointAxes,
): IHandedness => {
  const known: IHandednessState | undefined = HANDEDNESS.get(basis);
  if (known?.fixed === true) return known.read;
  const now: number[] = componentsOf(basis);
  if (known !== undefined && sameComponents(known.values, now))
    return known.read;

  // Right-handedness of the basis: +1 when flex × abd = +twist. A left-handed
  // triple is made right-handed by extracting against −twist, then negating the
  // recovered twist (a rotation about −t by θ is one about t by −θ).
  const handed: 1 | -1 =
    Vector3.dot(basis.twist, Vector3.cross(basis.flexion, basis.abduction)) >= 0
      ? 1
      : -1;
  const read: IHandedness = {
    handed,
    twistAxis: Vector3.scale(basis.twist, handed),
  };
  HANDEDNESS.set(basis, {
    values: now,
    read,
    fixed: normalizeJointAxes.owns(basis),
  });
  return read;
};

/** A private box copy and its invariant own-string-key count. */
interface IBox {
  /** The original constraint's copied fields, with only swingTwist set aside. */
  constraint: IAutoMovieJointConstraint;

  /** This private copy's own enumerable string-key count, unchanged after creation. */
  size: number;
}

/** Each gated constraint's copy without its swing-twist gate. */
const BOXES: WeakMap<IAutoMovieJointConstraint, IBox> = new WeakMap();

/** Collect original own keys/count before reading any compared member value. */
function sameBox(known: IBox, constraint: IAutoMovieJointConstraint): boolean {
  const keys: string[] = Object.keys(constraint);
  return (
    keys.length === known.size &&
    keys.every(
      (key: string): boolean =>
        key === "swingTwist" ||
        Object.is(
          (known.constraint as unknown as Record<string, unknown>)[key],
          (constraint as unknown as Record<string, unknown>)[key],
        ),
    )
  );
}

/**
 * A constraint as the readings are ranked by: itself, or for one gated by
 * swing and twist a copy with that gate set aside, the copy remembered per
 * constraint and returned only while every other member is still the one it
 * was copied from.
 */
const boxOf: (
  constraint: IAutoMovieJointConstraint,
) => IAutoMovieJointConstraint = (
  constraint: IAutoMovieJointConstraint,
): IAutoMovieJointConstraint => {
  if (constraint.swingTwist === undefined || constraint.swingTwist === null)
    return constraint;
  const known: IBox | undefined = BOXES.get(constraint);
  if (known !== undefined && sameBox(known, constraint))
    return known.constraint;
  const box: IAutoMovieJointConstraint = { ...constraint, swingTwist: null };
  BOXES.set(constraint, { constraint: box, size: Object.keys(box).length });
  return box;
};
