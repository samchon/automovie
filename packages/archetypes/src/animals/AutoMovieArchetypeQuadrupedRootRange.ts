import type { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import type { AutoMovieArchetypeQuadrupedLimb } from "./AutoMovieArchetypeQuadrupedLimb";
import { QuadrupedPelvis } from "./QuadrupedPelvis";
import { QuadrupedScapula } from "./QuadrupedScapula";

/**
 * A common vertical body-root interval satisfying four fixed limb attachments.
 *
 * Public only so the package's specs can reach it: it is not part of the
 * authoring surface, and it moves to an internal subpath when one exists.
 */
export namespace AutoMovieArchetypeQuadrupedRootRange {
  /** One fixed attachment and its unchanged model-space terminal target. */
  export interface IConstraint {
    /** Neutral model-space proximal endpoint, metres. */
    attachment: IAutoMovieVector3;
    /** Unchanged model-space distal endpoint goal, metres. */
    goal: IAutoMovieVector3;
    /** Chain's inclusive radial reach at its current fold, metres. */
    reach: AutoMovieArchetypeQuadrupedLimb.IRange;

    /**
     * The requested carpus or hock fold, degrees, which elax may lower for a
     * swinging limb.
     */
    fold?: number;

    /**
     * A fore limb's shoulder blade, whose turn within range may carry the
     * attachment toward the goal and so raise the upper bound.
     */
    scapula?: QuadrupedScapula.IJoint;

    /**
     * A hind limb's hip on the pelvis (`QuadrupedPelvis`), whose turn within
     * the pelvis's range may carry the attachment toward the goal and so raise
     * the upper bound.
     */
    pelvis?: QuadrupedScapula.IJoint;

    /**
     * The share of a stance's load the hoof bears, 0 to 1: one planted or at a
     * swing's ends, falling to none mid-swing (`QuadrupedSwingGoal`). An
     * unloaded hoof caps the root's height less, by its share of the leg's
     * reach, and falls short of its goal instead; one when absent.
     */
    load?: number;
  }

  /** Inclusive vertical translation of the single whole-body root, metres. */
  export interface IRange {
    /** Lowest admissible shared root translation, metres. */
    minimum: number;
    /** Highest admissible shared root translation, metres. */
    maximum: number;
  }

  /**
   * Intersect four-limb reach with one whole-body floor requirement.
   *
   * A hoof that bears less than a stance's load caps the root less, by its
   * unloaded share of the leg's reach (`IConstraint.load`); its limb then falls
   * short of its goal (`QuadrupedRidePose`).
   *
   * The proximal joint stays above its terminal target. For horizontal offset q
   * and radial interval [r,R], its vertical drop is exactly
   * [sqrt(max(0,r²-q²)), sqrt(R²-q²)]. Subtracting the neutral attachment
   * height from the goal height converts that drop into the shared root
   * translation.
   *
   * @param constraints All four attachments, terminal targets and
   *   fold-dependent reaches.
   * @param floorMinimum Lowest root translation clearing the non-limb body
   *   geometry, metres.
   * @returns The inclusive intersection; this operation does not select a
   *   trajectory.
   * @throws {RangeError} For malformed/nonrepresentable geometry, horizontal
   *   overreach or incompatible whole-body constraints.
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
   * Intersect as `intersect` does, first unfolding a swinging limb that cannot
   * reach down to the common root.
   *
   * A swinging limb's carpus or hock fold is the gait's requested peak; folded,
   * its longest reach can fall short of a goal the planted limbs hold the root
   * too low for. Such a limb folds only as far as the root allows: the largest
   * fold not above its request whose upper bound meets the others' lower bound,
   * as a folding limb is checked by the trunk above it.
   *
   * @param constraints The four constraints, each with its requested fold.
   * @param floorMinimum The body floor's lowest root translation, metres.
   * @param reach A limb's radial reach at a fold, degrees.
   * @param margin The coordinate roundoff budget, metres: an unfolded limb
   *   keeps this much reach beyond the common root so the exact limb solve
   *   admits it.
   * @returns The interval and the constraints with any fold lowered.
   * @throws {RangeError} As intersect refuses when even unfolded limbs leave no
   *   common height.
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

  /** The relaxed interval and the constraints it was found with. */
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

  /**
   * Intersect the four limbs' bounds with the body floor, naming the binding
   * limbs.
   */
  function bounds(
    constraints: Readonly<
      Record<AutoMovieArchetypeQuadrupedBody.Limb, IConstraint>
    >,
    floorMinimum: number,
  ): IBound {
    const bound: IBound = { minimum: floorMinimum, maximum: Infinity };
    for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
      const [low, high] = limbBounds(limb, constraints?.[limb]);
      // The planted hooves set the body's height and a swinging hoof adapts: the less a hoof bears, the less its reach caps the root.
      const capped: number = slack(high, constraints[limb]!);
      if (low > bound.minimum) [bound.minimum, bound.lowest] = [low, limb];
      if (capped < bound.maximum)
        [bound.maximum, bound.highest] = [capped, limb];
    }
    // Both hips ride one pelvis: the hinds bound the root jointly, exactly while either bears, since one turn of the pelvis serves both.
    const left: IConstraint | undefined = constraints?.leftHind;
    const right: IConstraint | undefined = constraints?.rightHind;
    if (left?.pelvis !== undefined && right?.pelvis !== undefined) {
      const shared: number = slack(
        QuadrupedPelvis.high([
          { joint: left.pelvis, goal: left.goal, reach: left.reach },
          { joint: right.pelvis, goal: right.goal, reach: right.reach },
        ]),
        loaded(left) >= loaded(right) ? left : right,
      );
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

  /**
   * The share of a stance's load a hoof bears, clamped to 0 to 1; one when the
   * constraint states none.
   */
  function loaded(constraint: IConstraint): number {
    return Math.min(1, Math.max(0, constraint.load ?? 1));
  }

  /**
   * A limb's cap on the root height, relaxed by its unloaded share of the leg's
   * reach: exact while the hoof bears, none in effect mid-swing, continuous
   * between.
   */
  function slack(high: number, constraint: IConstraint): number {
    const free: number = 1 - loaded(constraint);
    return free === 0 || high === -Infinity
      ? high
      : high + free * constraint.reach.maximum;
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
    const low: number =
      goal.y -
      attachment.y +
      (horizontal < radial.minimum ? vertical(radial.minimum, horizontal) : 0);
    return [low, high];
  }

  /** Recover a nonnegative vertical leg without squaring a large radius. */
  function vertical(radius: number, horizontal: number): number {
    const ratio: number = horizontal / radius;
    return radius * Math.sqrt((1 - ratio) * (1 + ratio));
  }
}
