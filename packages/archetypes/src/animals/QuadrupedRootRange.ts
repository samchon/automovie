import type { IAutoMovieVector3 } from "@automovie/interface";

import { QuadrupedBody } from "./QuadrupedBody";
import type { QuadrupedLimb } from "./QuadrupedLimb";

/**
 * A common vertical body-root interval satisfying four fixed limb attachments.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines model-space metre constraints, one shared vertical translation, the above-foot branch and refusal of an empty intersection.
 * @evidence contracts/development/design.md#principled-representation Each limb combines its fixed neutral attachment, unchanged terminal goal and actual folded-chain reach; all four constrain the same scalar root translation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns vertical feasibility only; limb reach, contact goals, neutral body construction and actual pose lowering retain their separate owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No limb root moves independently, no foot target is clipped and no species, speed, seed or clinical limit supplies a substitute reach.
 */
export namespace QuadrupedRootRange {
  /**
   * One fixed attachment and its unchanged model-space terminal target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines metre coordinates before the shared vertical translation and the actual folded-chain radial interval.
   * @evidence contracts/development/design.md#principled-representation A complete attachment/goal/reach tuple constrains one limb without encoding a second skeleton or a preferred fitted pose.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Consumed by the common body-root intersection; reach imports the exact limb owner's contract.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts All three quantities are required and are checked for finite representability; a missing limb cannot be replaced by a default.
   */
  export interface IConstraint {
    /** Neutral model-space proximal endpoint, metres. */
    attachment: IAutoMovieVector3;
    /** Unchanged model-space distal endpoint goal, metres. */
    goal: IAutoMovieVector3;
    /** Actual chain's inclusive radial reach at its current fold, metres. */
    reach: QuadrupedLimb.IRange;
  }

  /**
   * Inclusive vertical translation of the single whole-body root, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Both endpoints are finite model-space translations, possibly negative, and minimum never exceeds maximum.
   * @evidence contracts/development/design.md#principled-representation An interval represents the complete feasible above-foot branch shared by all four limbs and the supplied body-floor lower bound.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Reports feasibility to the body-root trajectory owner without choosing, clamping or retaining its preferred path.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The interval is not an anatomical range, an error tolerance or permission to change a requested root trajectory.
   */
  export interface IRange {
    /** Lowest admissible shared root translation, metres. */
    minimum: number;
    /** Highest admissible shared root translation, metres. */
    maximum: number;
  }

  /**
   * Intersect actual four-limb reach with one whole-body floor requirement.
   *
   * The proximal joint stays above its terminal target. For horizontal offset q
   * and radial interval [r,R], its vertical drop is exactly
   * [sqrt(max(0,r²-q²)), sqrt(R²-q²)]. Subtracting the neutral attachment height
   * from the goal height converts that drop into the shared root translation.
   *
   * @param constraints All four actual attachments, terminal targets and fold-dependent reaches.
   * @param floorMinimum Lowest root translation clearing the actual non-limb body geometry, metres.
   * @returns The inclusive intersection; this operation does not select a trajectory.
   * @throws {RangeError} For malformed/nonrepresentable geometry, horizontal overreach or incompatible whole-body constraints.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Gives the exact geometric interval, above-foot branch, metre frames and physical floor requirement, distinguishing feasibility from path selection.
   * @evidence contracts/development/implementation.md#principled-implementation Derive each limb's vertical-drop interval from its actual radial reach and fixed horizontal separation, translate it into root coordinates and intersect all four with the actual body-floor lower bound.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit each complete constraint, derive its two bounds once and accumulate their intersection before one final emptiness check.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Targets, attachments and reach radii remain unchanged. Squared-radius arithmetic is normalized to avoid avoidable overflow; an empty or unrepresentable interval is refused rather than padded or projected.
   * @evidence contracts/development/implementation.md#efficient-algorithms Exactly four constant-size constraints take O(1) work and storage with no root search, event enumeration, physical simulation or retained samples.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each horizontal norm and folded reach is used for both vertical bounds; the exact limb owner supplies the already prepared radial interval.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one fresh scalar interval and retains no model, input record, frame cache, process or external handle.
   */
  export function intersect(
    constraints: Readonly<Record<QuadrupedBody.Limb, IConstraint>>,
    floorMinimum: number,
  ): IRange {
    if (!Number.isFinite(floorMinimum))
      throw new RangeError(
        "The quadruped body-floor root bound must be finite",
      );
    let minimum: number = floorMinimum;
    let maximum: number = Infinity;
    for (const limb of QuadrupedBody.LIMBS) {
      const constraint: IConstraint | undefined = constraints?.[limb];
      if (
        constraint === undefined ||
        constraint === null ||
        constraint.attachment === undefined ||
        constraint.attachment === null ||
        constraint.goal === undefined ||
        constraint.goal === null ||
        constraint.reach === undefined ||
        constraint.reach === null
      )
        throw new RangeError(`The ${limb} root constraint is incomplete`);
      const attachment: IAutoMovieVector3 = constraint.attachment;
      const goal: IAutoMovieVector3 = constraint.goal;
      const radial: QuadrupedLimb.IRange = constraint.reach;
      if (
        ![
          attachment.x,
          attachment.y,
          attachment.z,
          goal.x,
          goal.y,
          goal.z,
          radial.minimum,
          radial.maximum,
        ].every(Number.isFinite) ||
        radial.minimum < 0 ||
        !(radial.maximum > 0 && radial.maximum >= radial.minimum)
      )
        throw new RangeError(
          `The ${limb} root constraint is not finite geometry`,
        );

      const horizontal: number = Math.hypot(
        goal.x - attachment.x,
        goal.z - attachment.z,
      );
      if (!(Number.isFinite(horizontal) && horizontal <= radial.maximum))
        throw new RangeError(
          `The ${limb} horizontal goal ${horizontal} m exceeds its ${radial.maximum} m folded reach`,
        );
      const offset: number = goal.y - attachment.y;
      const low: number =
        offset +
        (horizontal < radial.minimum
          ? vertical(radial.minimum, horizontal)
          : 0);
      const high: number = offset + vertical(radial.maximum, horizontal);
      if (!(Number.isFinite(low) && Number.isFinite(high)))
        throw new RangeError(`The ${limb} root interval is not representable`);
      minimum = Math.max(minimum, low);
      maximum = Math.min(maximum, high);
    }
    if (!(minimum <= maximum))
      throw new RangeError(
        `The four quadruped limbs and body floor have no common root height: [${minimum}, ${maximum}] m`,
      );
    return { minimum, maximum };
  }

  /** Recover a nonnegative vertical leg without squaring a large radius. */
  function vertical(radius: number, horizontal: number): number {
    const ratio: number = horizontal / radius;
    return radius * Math.sqrt((1 - ratio) * (1 + ratio));
  }
}
