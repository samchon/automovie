import type { IAutoMovieJointPose } from "@automovie/interface";

/**
 * Whether a joint record is one the range clamp issued for a constraint on
 * which clamping again returns the same values: clamping it again may be
 * left out.
 *
 * `clampJointRom` marks a record it returns (`clampJointSettled.issue`) only
 * where clamping that record again gives back its own values. A box axis is
 * a `min`/`max` clamp, which returns an angle already in its interval as it
 * is, and an immobile axis returns its zero again. A swing cone with both
 * anchors at zero writes `0 + (v - 0) * t`, which is `v` when `t` is 1, and
 * `swingConeBlend` returns exactly 1 for a point inside the cone — which a
 * point it blended is, being the bracket's admitted end. A zero may come back
 * with its sign dropped, the same angle. A cone with an anchor off zero
 * (`anchor + (v - anchor) * t` need not be `v`) and a swing-twist joint
 * (projected again) are never marked.
 *
 * @param joint A joint record.
 * @returns Whether it is such a record.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which records are marked, why clamping them again returns their values, and which never are.
 * @evidence contracts/development/implementation.md#principled-implementation Idempotence read off the clamp's own expressions: `clampAxis` on an in-range angle, the cone's blend at `t = 1` with zero anchors, and `swingConeBlend`'s exact 1 inside the cone.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One weak set written by the clamp and read here.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only the clamp's own output is marked, so an edited or foreign record is clamped as before; the cases whose idempotence is not exact are not marked.
 * @evidence contracts/development/implementation.md#efficient-algorithms One weak-set lookup in place of a joint's clamp.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The record is its own clamp's result; nothing else is kept.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Records are held weakly and released with their poses.
 */
export function clampJointSettled(joint: IAutoMovieJointPose): boolean {
  return SETTLED.has(joint);
}

/**
 * The clamp's side of the settled records: marking one as it is issued.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States who marks and what.
 * @evidence contracts/development/design.md#principled-representation The mark is membership of the record itself in a weak set, so it travels with the record and nothing else.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One writer, the clamp; one reader, `clampJointSettled`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No value, pose or bone name is kept beside the record.
 */
export namespace clampJointSettled {
  /**
   * Mark a record the clamp issued as settled.
   *
   * @param joint The record, fresh from the clamp.
   * @returns The same record.
   */
  export function issue(joint: IAutoMovieJointPose): IAutoMovieJointPose {
    SETTLED.add(joint);
    return joint;
  }
}

/** The records the clamp issued as settled. */
const SETTLED: WeakSet<IAutoMovieJointPose> = new WeakSet();
