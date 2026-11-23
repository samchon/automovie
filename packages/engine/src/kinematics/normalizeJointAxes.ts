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
 * mutually orthogonal, with a supported rotation order and compatible twist
 * placement. Otherwise the first issue is thrown as `<path> <expected>`, such
 * as `jointToQuaternion axes.twist must have non-zero length`. The result has
 * unit axes and any declared placement and rotation order. It is frozen and may
 * be shared between calls on the same axes record.
 *
 * A rig's axes are a handful of constant records read for every bone of every
 * pose, so the admitted basis is remembered per record. A remembered basis is
 * returned only while the record still holds the nine components and the
 * placement and order it was admitted with, compared exactly, so a record
 * edited since is validated again; a basis that fails is never remembered, and
 * the path, which only words a failure, plays no part in the result.
 *
 * @param axes Basis to check; read, never modified.
 * @param path Diagnostic path prefix naming the caller's input.
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
    ...(axes.rotationOrder === undefined
      ? {}
      : { rotationOrder: axes.rotationOrder }),
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
    order: axes.rotationOrder,
    basis,
  });
  OWNED.add(basis);
  return basis;
}

/** Immutable-output provenance of {@link normalizeJointAxes}. */
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

  /** The record's explicit rotation order, when declared. */
  order: IAutoMovieJointAxes["rotationOrder"];

  /** The normalized basis. */
  basis: IAutoMovieJointAxes;
}

/** The admitted basis of each axes record. */
const ADMITTED: WeakMap<IAutoMovieJointAxes, IRemembered> = new WeakMap();

/** Only this module's successfully created, frozen own-data basis records. */
const OWNED: WeakSet<IAutoMovieJointAxes> = new WeakSet();

/**
 * Whether a record still holds the values its remembered basis was admitted
 * from, compared exactly (`Object.is`, so a NaN or a signed zero counts as
 * itself).
 */
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
  known.placement === axes.twistPlacement &&
  known.order === axes.rotationOrder;
