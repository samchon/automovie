import type {
  IAutoMovieJointAxes,
  IAutoMovieJointAxesIssue,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { validateJointAxesBasis } from "./validateJointAxesBasis";

/**
 * Validate a joint-axis basis and return it with unit-length axes, ready for
 * quaternion composition and decomposition.
 *
 * The axes must pass {@link validateJointAxesBasis}: finite, non-zero and
 * mutually orthogonal, with a known `twistPlacement`. Otherwise the first issue
 * is thrown as `<path> <expected>`, such as
 * `jointToQuaternion axes.twist must have non-zero length`. The result has
 * unit axes, `twistPlacement` copied only when the input declares it; it is
 * frozen and may be shared between calls on the same axes record.
 *
 * A rig's axes are a handful of constant records read for every bone of
 * every pose, so the admitted basis is remembered per record. A remembered
 * basis is returned only while the record still holds the nine components and
 * the placement it was admitted with, compared exactly, so a record edited
 * since is validated again; a basis that fails is never remembered, and the
 * path, which only words a failure, plays no part in the result.
 *
 * @param axes Basis to check; read, never modified.
 * @param path Diagnostic path prefix naming the caller's input.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Normalizing each axis by its length turns a validated orthogonal basis into an orthonormal one, the premise every Euler composition and extraction in this module relies on; `Vector3.normalize` rescales extreme components before measuring, so axes that pass the non-zero check never divide by an underflowed length.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Turns the issue list of `validateJointAxesBasis`, which retargeting reports as violations, into the throwing guard the quaternion functions need, so the basis rules live in one place.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A skewed or degenerate basis throws instead of being orthogonalized or replaced by the default, and no bone or caller is special-cased; a remembered basis is the one the same values gave, so the result is the same number for number.
 * @evidence contracts/development/common.md#meaningful-documentation States the accepted basis, the thrown message shape with an example, that the result is frozen and may be shared, and when a remembered basis is reused.
 * @evidence contracts/development/implementation.md#efficient-algorithms An exact immutable output of this producer costs one weak membership lookup. Other remembered records cost ten scalar comparisons; new or edited ones validate three axes and normalize them, then register the produced immutable result. Prepared FK and inverse metadata use genuine outputs without probing arbitrary caller records; runtime speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The admitted basis of a raw record is remembered with its actual scalars, since poses and limb fits reuse axes. Private weak membership identifies only this producer's successfully frozen own-data outputs, so normalization itself and inverse handedness metadata can reuse them without re-reading immutable values. Arbitrary copies, proxies and caller-created frozen bases keep their existing live comparisons and admission.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One remembered basis per axes record remains in a weak map; one weak membership entry per produced immutable basis adds no strong lifetime. Both release with their owning records, and no skeleton, pose, angle or quaternion result population is retained.
 */
export function normalizeJointAxes(
  axes: IAutoMovieJointAxes,
  path: string,
): IAutoMovieJointAxes {
  if (OWNED.has(axes)) return axes;
  const known: IRemembered | undefined = ADMITTED.get(axes);
  if (known !== undefined && same(known, axes)) return known.basis;
  const issues: IAutoMovieJointAxesIssue[] = validateJointAxesBasis(axes, path);
  if (issues.length !== 0) {
    const issue: IAutoMovieJointAxesIssue = issues[0]!;
    throw new Error(`${issue.path} ${issue.expected}`);
  }
  const basis: IAutoMovieJointAxes = Object.freeze({
    flexion: Object.freeze(Vector3.normalize(axes.flexion)),
    abduction: Object.freeze(Vector3.normalize(axes.abduction)),
    twist: Object.freeze(Vector3.normalize(axes.twist)),
    ...(axes.twistPlacement === undefined
      ? {}
      : { twistPlacement: axes.twistPlacement }),
  });
  ADMITTED.set(axes, {
    values: [
      axes.flexion.x,
      axes.flexion.y,
      axes.flexion.z,
      axes.abduction.x,
      axes.abduction.y,
      axes.abduction.z,
      axes.twist.x,
      axes.twist.y,
      axes.twist.z,
    ],
    placement: axes.twistPlacement,
    basis,
  });
  OWNED.add(basis);
  return basis;
}

/**
 * Immutable-output provenance of {@link normalizeJointAxes}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes exact ownership of successfully produced frozen bases, without probing or admitting arbitrary candidate records.
 * @evidence contracts/development/design.md#principled-representation A weak membership fact identifies the normalizer's actual own-data results; it neither infers immutability from caller-controlled descriptors nor represents a second axis basis.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One read-only membership query serves inverse handedness, direct OnBasis fixed-axis readers and prepared inner/outer cardinal support. Only this normalizer registers actual frozen outputs; arithmetic consumers still own their current input/frame checks.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No user basis, copied or proxied record gains trust from matching shape or values, and membership bypasses no normalization or numerical validation of raw inputs.
 */
export namespace normalizeJointAxes {
  /**
   * Whether this exact record is an immutable own-data output of this producer.
   * Weak identity lookup invokes no input getter or metadata trap; a wrapper,
   * copy or user-created frozen record is not its target's identity. The query
   * admits no input, mutates no membership and retains nothing.
   */
  export function owns(basis: IAutoMovieJointAxes): boolean {
    return OWNED.has(basis);
  }
}

/** An admitted basis with the values of the record it was admitted from. */
interface IRemembered {
  /** The record's nine components, flexion, abduction and twist, each x, y, z. */
  values: readonly number[];

  /** The record's twist placement. */
  placement: IAutoMovieJointAxes["twistPlacement"];

  /** The normalized basis. */
  basis: IAutoMovieJointAxes;
}

/** The admitted basis of each axes record. */
const ADMITTED: WeakMap<IAutoMovieJointAxes, IRemembered> = new WeakMap();

/** Only this module's successfully created, frozen own-data basis records. */
const OWNED: WeakSet<IAutoMovieJointAxes> = new WeakSet();

/** Whether a record still holds the values its remembered basis was admitted from, compared exactly (`Object.is`, so a NaN or a signed zero counts as itself). */
const same: (known: IRemembered, axes: IAutoMovieJointAxes) => boolean = (
  known: IRemembered,
  axes: IAutoMovieJointAxes,
): boolean =>
  Object.is(known.values[0], axes.flexion.x) &&
  Object.is(known.values[1], axes.flexion.y) &&
  Object.is(known.values[2], axes.flexion.z) &&
  Object.is(known.values[3], axes.abduction.x) &&
  Object.is(known.values[4], axes.abduction.y) &&
  Object.is(known.values[5], axes.abduction.z) &&
  Object.is(known.values[6], axes.twist.x) &&
  Object.is(known.values[7], axes.twist.y) &&
  Object.is(known.values[8], axes.twist.z) &&
  known.placement === axes.twistPlacement;
