import type { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import type { AutoMovieArchetypeQuadrupedLimb } from "./AutoMovieArchetypeQuadrupedLimb";
import { QuadrupedPelvis } from "./QuadrupedPelvis";
import { QuadrupedScapula } from "./QuadrupedScapula";

/**
 * A common vertical body-root interval satisfying four fixed limb attachments.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines model-space metre constraints, one shared vertical translation, the above-foot branch and refusal of an empty intersection.
 * @evidence contracts/development/design.md#principled-representation Each limb combines its fixed neutral attachment, unchanged terminal goal and folded-chain reach; all four constrain the same scalar root translation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns vertical feasibility only; limb reach, contact goals, neutral body construction and pose lowering retain their separate owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No limb root moves independently, no foot target is clipped and no species, speed, seed or clinical limit supplies a substitute reach.
 */
export namespace AutoMovieArchetypeQuadrupedRootRange {
  /**
   * One fixed attachment and its unchanged model-space terminal target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines metre coordinates before the shared vertical translation and the folded-chain radial interval.
   * @evidence contracts/development/design.md#principled-representation A complete attachment/goal/reach tuple constrains one limb without encoding a second skeleton or a preferred fitted pose.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Consumed by the common body-root intersection; reach imports the exact limb owner's contract.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts All three quantities are required and are checked for finite representability; a missing limb cannot be replaced by a default.
   */
  export interface IConstraint {
    /** Neutral model-space proximal endpoint, metres. */
    attachment: IAutoMovieVector3;
    /** Unchanged model-space distal endpoint goal, metres. */
    goal: IAutoMovieVector3;
    /** Chain's inclusive radial reach at its current fold, metres. */
    reach: AutoMovieArchetypeQuadrupedLimb.IRange;

    /** The requested carpus or hock fold, degrees, which 
elax may lower for a swinging limb. */
    fold?: number;

    /** A fore limb's shoulder blade, whose turn within range may carry the attachment toward the goal and so raise the upper bound. */
    scapula?: QuadrupedScapula.IJoint;

    /** A hind limb's hip on the pelvis (`QuadrupedPelvis`), whose turn within the pelvis's range may carry the attachment toward the goal and so raise the upper bound. */
    pelvis?: QuadrupedScapula.IJoint;
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
   * Intersect four-limb reach with one whole-body floor requirement.
   *
   * The proximal joint stays above its terminal target. For horizontal offset q
   * and radial interval [r,R], its vertical drop is exactly
   * [sqrt(max(0,r²-q²)), sqrt(R²-q²)]. Subtracting the neutral attachment height
   * from the goal height converts that drop into the shared root translation.
   *
   * @param constraints All four attachments, terminal targets and fold-dependent reaches.
   * @param floorMinimum Lowest root translation clearing the non-limb body geometry, metres.
   * @returns The inclusive intersection; this operation does not select a trajectory.
   * @throws {RangeError} For malformed/nonrepresentable geometry, horizontal overreach or incompatible whole-body constraints.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Gives the exact geometric interval, above-foot branch, metre frames and physical floor requirement, distinguishing feasibility from path selection.
   * @evidence contracts/development/implementation.md#principled-implementation Derive each limb's vertical-drop interval from its radial reach and fixed horizontal separation, translate it into root coordinates and intersect all four with the body-floor lower bound. A fore limb with a shoulder blade takes the highest bound its blade reaches within range (`QuadrupedScapula.high`), and the two hinds the highest at which one turn of the pelvis within its range lets both reach (`QuadrupedPelvis.high`); that shared turn is chosen once the root is (`QuadrupedPelvis.turn`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit each complete constraint, derive its two bounds once and accumulate their intersection before one final emptiness check.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Targets, attachments and reach radii remain unchanged. Squared-radius arithmetic is normalized to avoid avoidable overflow; an empty or unrepresentable interval is refused rather than padded or projected.
   * @evidence contracts/development/implementation.md#efficient-algorithms Exactly four constant-size constraints take O(1) work and storage with no root search, event enumeration, physical simulation or retained samples.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each horizontal norm and folded reach is used for both vertical bounds; the exact limb owner supplies the already prepared radial interval.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one fresh scalar interval and retains no model, input record, frame cache, process or external handle.
   */
  export function intersect(
    constraints: Readonly<
      Record<AutoMovieArchetypeQuadrupedBody.Limb, IConstraint>
    >,
    floorMinimum: number,
  ): IRange {
    const bound: IBound = bounds(constraints, floorMinimum);
    if (bound.maximum === -Infinity)
      throw new RangeError(
        `The ${bound.highest} horizontal goal exceeds its ${constraints[bound.highest!].reach.maximum} m folded reach`,
      );
    if (!(bound.minimum <= bound.maximum))
      throw new RangeError(
        `The four quadruped limbs and body floor have no common root height: [${bound.minimum}, ${bound.maximum}] m, the lower bound set by ${bound.lowest ?? "body floor"} and the upper by ${bound.highest ?? "none"}${bound.lowest === undefined ? "" : ` (${bound.lowest} goal ${JSON.stringify(constraints[bound.lowest].goal)} from ${JSON.stringify(constraints[bound.lowest].attachment)}, reach ${JSON.stringify(constraints[bound.lowest].reach)})`}${bound.highest === undefined ? "" : ` (${bound.highest} goal ${JSON.stringify(constraints[bound.highest].goal)} from ${JSON.stringify(constraints[bound.highest].attachment)}, reach ${JSON.stringify(constraints[bound.highest].reach)})`}`,
      );
    return { minimum: bound.minimum, maximum: bound.maximum };
  }

  /**
   * Intersect as `intersect` does, first unfolding a swinging limb that cannot reach down to the common root.
   *
   * A swinging limb's carpus or hock fold is the gait's requested peak; folded, its longest reach can fall short of a goal the planted limbs hold the root too low for. Such a limb folds only as far as the root allows: the largest fold not above its request whose upper bound meets the others' lower bound, as a folding limb is checked by the trunk above it.
   *
   * @param constraints The four constraints, each with its requested fold.
   * @param floorMinimum The body floor's lowest root translation, metres.
   * @param reach A limb's radial reach at a fold, degrees.
   * @param margin The coordinate roundoff budget, metres: an unfolded limb keeps this much reach beyond the common root so the exact limb solve admits it.
   * @returns The interval and the constraints with any fold lowered.
   * @throws {RangeError} As intersect refuses when even unfolded limbs leave no common height.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the conflict, the relaxation and its bound.
   * @evidence contracts/development/implementation.md#principled-implementation The fold is a requested swing carriage and the limb's upper bound rises monotonically as it unfolds, so the largest admissible fold is found by bisection between none and the request; planted limbs, goals and attachments never move.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Bound, find the binding swinging limb, unfold it, repeat for at most the four limbs.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No goal, attachment or reach is padded; a fold is only lowered, never raised.
   * @evidence contracts/development/implementation.md#efficient-algorithms Only a conflicting sample unfolds: 48 halvings of one fold per binding limb, at most four.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the per-limb bounds intersect computes.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh record.
   */
  export function relax(
    constraints: Readonly<
      Record<AutoMovieArchetypeQuadrupedBody.Limb, IConstraint>
    >,
    floorMinimum: number,
    reach: (
      limb: AutoMovieArchetypeQuadrupedBody.Limb,
      fold: number,
    ) => AutoMovieArchetypeQuadrupedLimb.IRange,
    margin: number,
  ): IRelaxed {
    const current: Record<AutoMovieArchetypeQuadrupedBody.Limb, IConstraint> = {
      ...constraints,
    };
    for (
      let pass: number = 0;
      pass < AutoMovieArchetypeQuadrupedBody.LIMBS.length;
      pass++
    ) {
      const bound: IBound = bounds(current, floorMinimum);
      const limb: AutoMovieArchetypeQuadrupedBody.Limb | undefined =
        bound.highest;
      if (bound.minimum <= bound.maximum || limb === undefined) break;
      const requested: number = current[limb].fold ?? 0;
      if (!(requested > 0)) break;
      const at = (fold: number): IConstraint => ({
        ...current[limb],
        fold,
        reach: reach(limb, fold),
      });
      let low: number = 0;
      let high: number = requested;
      if (limbBounds(limb, at(0))[1] < bound.minimum + margin) high = 0;
      else
        for (let k: number = 0; k < 48; k++) {
          const middle: number = (low + high) / 2;
          if (limbBounds(limb, at(middle))[1] >= bound.minimum + margin)
            low = middle;
          else high = middle;
        }
      current[limb] = at(high === 0 ? 0 : low);
    }
    return {
      range: intersect(current, floorMinimum),
      constraints: current,
    };
  }

  /**
   * The relaxed interval and the constraints it was found with.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both members.
   * @evidence contracts/development/design.md#principled-representation The interval and each limb's fold as used.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by relax.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IRelaxed {
    /** The common root interval. */
    range: IRange;
    /** Each limb's constraint, its fold possibly lowered. */
    constraints: Readonly<
      Record<AutoMovieArchetypeQuadrupedBody.Limb, IConstraint>
    >;
  }

  /** The intersection and the limbs setting its two bounds. */
  interface IBound extends IRange {
    /** The limb setting the lower bound; absent when the body floor does. */
    lowest?: AutoMovieArchetypeQuadrupedBody.Limb;
    /** The limb setting the upper bound. */
    highest?: AutoMovieArchetypeQuadrupedBody.Limb;
  }

  /** Intersect the four limbs' bounds with the body floor, naming the binding limbs. */
  function bounds(
    constraints: Readonly<
      Record<AutoMovieArchetypeQuadrupedBody.Limb, IConstraint>
    >,
    floorMinimum: number,
  ): IBound {
    if (!Number.isFinite(floorMinimum))
      throw new RangeError(
        "The quadruped body-floor root bound must be finite",
      );
    const bound: IBound = { minimum: floorMinimum, maximum: Infinity };
    for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
      const [low, high] = limbBounds(limb, constraints?.[limb]);
      if (low > bound.minimum) [bound.minimum, bound.lowest] = [low, limb];
      if (high < bound.maximum) [bound.maximum, bound.highest] = [high, limb];
    }
    // Both hips ride one pelvis: the hinds bound the root jointly.
    const left: IConstraint | undefined = constraints?.leftHind;
    const right: IConstraint | undefined = constraints?.rightHind;
    if (left?.pelvis !== undefined && right?.pelvis !== undefined) {
      const shared: number = QuadrupedPelvis.high([
        { joint: left.pelvis, goal: left.goal, reach: left.reach },
        { joint: right.pelvis, goal: right.goal, reach: right.reach },
      ]);
      if (shared < bound.maximum)
        [bound.maximum, bound.highest] = [
          shared,
          limbBounds("leftHind", left)[1] <= limbBounds("rightHind", right)[1]
            ? "leftHind"
            : "rightHind",
        ];
    }
    return bound;
  }

  /** One limb's lowest and highest root translation. */
  function limbBounds(
    limb: AutoMovieArchetypeQuadrupedBody.Limb,
    constraint: IConstraint | undefined,
  ): [number, number] {
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
    const radial: AutoMovieArchetypeQuadrupedLimb.IRange = constraint.reach;
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
    const high: number =
      constraint.scapula !== undefined
        ? QuadrupedScapula.high(constraint.scapula, goal, radial)
        : constraint.pelvis !== undefined
          ? QuadrupedScapula.high(
              constraint.pelvis,
              goal,
              radial,
              QuadrupedPelvis.RANGE,
            )
          : horizontal <= radial.maximum
            ? goal.y - attachment.y + vertical(radial.maximum, horizontal)
            : -Infinity;
    if (!Number.isFinite(horizontal))
      throw new RangeError(`The ${limb} horizontal goal is not finite`);
    const low: number =
      goal.y -
      attachment.y +
      (horizontal < radial.minimum ? vertical(radial.minimum, horizontal) : 0);
    if (
      !(Number.isFinite(low) && (Number.isFinite(high) || high === -Infinity))
    )
      throw new RangeError(`The ${limb} root interval is not representable`);
    return [low, high];
  }

  /** Recover a nonnegative vertical leg without squaring a large radius. */
  function vertical(radius: number, horizontal: number): number {
    const ratio: number = horizontal / radius;
    return radius * Math.sqrt((1 - ratio) * (1 + ratio));
  }
}
