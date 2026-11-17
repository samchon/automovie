import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanFoot } from "../posture/IAutoMovieMotionHumanFoot";
import type { IAutoMovieMotionHumanLegChain } from "../posture/IAutoMovieMotionHumanLegChain";
import type { IAutoMovieMotionHumanQuadraticProgram } from "../posture/IAutoMovieMotionHumanQuadraticProgram";

/**
 * The course of a stepping take's stances, solved once when the take is
 * planned as one trajectory optimisation: at every knot the pelvis's drop,
 * each planted foot's pitch about its ball, the trunk's pitch and roll about
 * the hips, and each foot's turn on the floor, so the heel rises, the hips
 * lower and the trunk bends continuously by construction (a course whose
 * second differences are penalised cannot jump; where two minima of one
 * instant trade places the course moves between them smoothly, paying for
 * it).
 *
 * A knot names its pelvis as a function of the trunk's tilt: a take that
 * keeps its centre of mass on a planned course moves the pelvis against the
 * shift the tilt makes, so bending the trunk carries the hips. A take may
 * hold the trunk instead. A foot that lands may turn out on the floor, within
 * the hip's rotation from the pelvis (`walkReach.TWIST`), and keeps that turn
 * while it stands; one already standing keeps its heading.
 *
 * At each knot each planted foot is brought to its ball's place on the floor
 * and pitched about it; the leg from the hip, lowered by the drop, reaches
 * its ankle with the knee bent at least `KNEE` (stance's greatest
 * extension), the ankle stays inside the dorsal range its load allows (from
 * `ANKLE_DORSIFLEXION.unloaded` under no weight to `.loaded` under all of
 * it, in proportion to the foot's share, less `walkLeg.ANKLE`), and the
 * thigh trails no further behind the pelvis
 * than the hip extends (`walkReach.EXTENSION`). Two legs that stand, one of
 * them set down in the take, keep clear of each other as the tangle audit
 * reads them (`walkLegClearance`), so a foot that crosses the other stands in
 * front of or behind it. Where the take names points
 * its feet bear (its centre of pressure, its caught extrapolated centre of
 * mass), a raised heel leaves each no shallower inside the base than the feet
 * as scheduled hold it: a foot bears only the points of its sole within
 * `HumanFoot.BEARING` of the floor (Winter's base of support, as
 * `HumanFoot.base` reads it). A foot in the air carries its pitch and its
 * turn through its swing on the course's acceleration alone, so a stance
 * joins its swing where the course meets it. The cost is:
 * - the ankle's dorsiflexion past the heel-off angle, 10 degrees (the
 *   dorsiflexion walking needs, Kadaba, Ramakrishnan and Wootten 1990, J
 *   Orthop Res 8:383, as cited by the ISB 2005 abstract 0619), on a smooth
 *   hinge as wide as its spread, 4 degrees (stance's peak dorsiflexion 15.9 +-
 *   4.1 degrees, PMC4016931), so the heel rises where more dorsiflexion costs
 *   more than turning about the ball;
 * - turning about the ball, `BALL` degrees costing as much as a spread of
 *   dorsiflexion (provisional);
 * - the drop, `UPRIGHT` metres costing as much (provisional: a body stands as
 *   tall as its stances let it);
 * - the trunk's tilt, `TRUNK` degrees costing as much (provisional: a body
 *   stands upright where its legs let it);
 * - a landing foot's turn, `TURN` degrees costing as much (provisional);
 * - the course's acceleration: each series' second difference over a knot's
 *   step squared, against `ACCELERATION` (provisional).
 *
 * It is solved by penalty sequential convex optimisation with a trust region,
 * TrajOpt's outer loop (Schulman et al. 2014), run by the shared loop
 * (`HumanSequentialConvex`, `optimise`): each subproblem is the cost's
 * Gauss-Newton model with every constraint's linearisation an exact l1
 * penalty, a banded problem on the shared quadratic program under the linear
 * rows, inside the region. It stops once every constraint is met within the
 * joints' tolerance (`MET`), or reports the least excess it reached where the
 * constraints cannot be met together. It starts from a course that stands tall and upright
 * with flat feet. Each leg is read as the posture poses it at the ankle the
 * course places, so the course's knees are the shown ones; a leg that cannot
 * reach its ankle stands on its reachable shell toward it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation pitch: The posture's pitch, degrees, forward positive. roll: The posture's roll, degrees. hips: The hip joints, world metres.
 * @evidence contracts/development/design.md#principled-representation pitch: The posture's pitch, degrees, forward positive. roll: The posture's roll, degrees. hips: The hip joints, world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/walkStanceCourse.ts (walkStanceCourse.at, course); actions/walkStanceModel.ts (walkStanceModel.of, start); actions/walkStanceSolve.ts (walkStanceSolve.solve, start); actions/walkStanceSolve.ts (walkStanceSolve.solve, return); actions/walkStanceSolve.ts (walkStanceSolve.optimise, return); actions/walkStanceSolve.ts (walkStanceSolve.cut, start).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieQuaternion, IAutoMovieVector3, IAutoMovieMotionHumanFoot.IPlacement, IAutoMovieMotionHumanQuadraticProgram.IProblem identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanWalkStanceCourse {
  /**
   * The trunk's tilt about the hips, as the posture's pitch and roll (`AutoMovieMotionHumanLean.pivot`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation pitch: The posture's pitch, degrees, forward positive. roll: The posture's roll, degrees.
   * @evidence contracts/development/design.md#principled-representation pitch: The posture's pitch, degrees, forward positive. roll: The posture's roll, degrees.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: reaction/staggerKnots.ts (staggerKnots.frame, return); reaction/staggerKnots.ts (staggerKnots.frame.root, trunk); reaction/staggerKnots.ts (staggerKnots.frame, trunk).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in staggerKnots.frame.
   */
  export interface ITrunk {
    /** The posture's pitch, degrees, forward positive. */
    pitch: number;

    /** The posture's roll, degrees. */
    roll: number;
  }

  /**
   * The pelvis at a knot under a trunk's tilt, before the drop.
   *
   * @evidence contracts/development/common.md#meaningful-documentation hips: The hip joints, world metres.
   * @evidence contracts/development/design.md#principled-representation hips: The hip joints, world metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/walkStanceGeometry.ts (walkStanceGeometry.of.pelvisAt, return); reaction/staggerKnots.ts (staggerKnots.frame, return); actions/walkStanceGeometry.ts (walkStanceGeometry.of); actions/walkStanceGeometry.ts (walkStanceGeometry.of.pelvisAt); actions/walkStanceGeometry.ts (walkStanceGeometry.of.read); actions/walkStanceModel.ts (walkStanceModel.of).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieQuaternion, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IPelvis {
    /** Its world rotation, the hip joints' frame. */
    rotation: IAutoMovieQuaternion;

    /** The hip joints, world metres. */
    hips: Record<"left" | "right", IAutoMovieVector3>;
  }

  /**
   * A planted foot at a knot.
   *
   * @evidence contracts/development/common.md#meaningful-documentation landing: A landing the course places: the foot slides on the floor from its placement toward `goal`, its ankle inside `region`, and keeps where it lands while it stands; held where it is placed when absent. goal: The ankle the landing is pulled toward, world metres. region: The landing ankle's excesses over its region's bounds, metres, each at most none inside it.
   * @evidence contracts/development/design.md#principled-representation landing: A landing the course places: the foot slides on the floor from its placement toward `goal`, its ankle inside `region`, and keeps where it lands while it stands; held where it is placed when absent. goal: The ankle the landing is pulled toward, world metres. region: The landing ankle's excesses over its region's bounds, metres, each at most none inside it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/walkStanceGeometry.ts (walkStanceGeometry.of.scheduled, s); actions/walkStanceGeometry.ts (walkStanceGeometry.of.soles, s); actions/walkStanceGeometry.ts (walkStanceGeometry.of.shares.far, _); actions/walkStanceGeometry.ts (walkStanceGeometry.of.support, s); actions/walkStanceModel.ts (walkStanceModel.of, s); actions/walkStanceModel.ts (walkStanceModel.of.j, s).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanFoot.IPlacement, IAutoMovieVector3, IAutoMovieMotionHumanWalkStanceCourse.ISwivel identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IStance {
    /** The foot. */
    side: "left" | "right";

    /** Its placement as scheduled. */
    placement: IAutoMovieMotionHumanFoot.IPlacement;

    /** Whether it may turn out on the floor, a foot that has landed in the take; it keeps the turn it lands with while it stands. */
    turning?: boolean;

    /** A landing the course places: the foot slides on the floor from its placement toward `goal`, its ankle inside `region`, and keeps where it lands while it stands; held where it is placed when absent. */
    landing?: {
      /** The ankle the landing is pulled toward, world metres. */
      goal: IAutoMovieVector3;

      /** The landing ankle's excesses over its region's bounds, metres, each at most none inside it. */
      region: (ankle: IAutoMovieVector3) => number[];
    };

    /** The leg's bend branch and swivel as the posture's fit last posed it here (`HumanLegChain`), which the course holds: its knee and its ankle's dorsiflexion are read from the leg so posed, and two legs that both carry one keep clear of each other; the knee is read by `walkLeg.lean` and the legs' clearance is not read when absent. */
    swivel?: IAutoMovieMotionHumanWalkStanceCourse.ISwivel;
  }

  /**
   * A leg's held swivel (`IAutoMovieMotionHumanLegChain.ISwivel`), with its first-order piece
   * when the take linearises the posture's fit about a course: the swivel
   * then moves by `slope` times each of the leg's own variables' change from
   * `about`, in `LEG` order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation slope: The swivel's slope in each of the leg's variables, degrees per unit.
   * @evidence contracts/development/design.md#principled-representation slope: The swivel's slope in each of the leg's variables, degrees per unit.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: reaction/staggerSequential.ts (staggerSequential.solve.kept, return); reaction/staggerSequential.ts (staggerSequential.solve.holding, swivels); reaction/staggerSequential.ts (staggerSequential.solve.problemOf, swivels); reaction/staggerSequential.ts (staggerSequential.solve.piecesOf, return); reaction/staggerSequential.ts (staggerSequential.solve.piecesOf.swivels, return); reaction/staggerSequential.ts (staggerSequential.solve.holding).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in staggerSequential.solve.kept.
   */
  export interface ISwivel extends IAutoMovieMotionHumanLegChain.ISwivel {
    /** The swivel's slope in each of the leg's variables, degrees per unit. */
    slope?: readonly number[];

    /** The variables the piece is taken about. */
    about?: readonly number[];
  }

  /**
   * The geometry of a course's problem over its knots. A knot.
   *
   * @evidence contracts/development/common.md#meaningful-documentation seconds: Seconds since the take's start. trunk: The trunk's tilt the take holds; free when absent. drop: The pelvis's drop the take holds, metres; free when absent.
   * @evidence contracts/development/design.md#principled-representation seconds: Seconds since the take's start. trunk: The trunk's tilt the take holds; free when absent. drop: The pelvis's drop the take holds, metres; free when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/walkStanceGeometry.ts (walkStanceGeometry.of, knots); actions/walkStanceGeometry.ts (walkStanceGeometry.of.scheduled, knot); actions/walkStanceGeometry.ts (walkStanceGeometry.of.soles, knot); actions/walkStanceGeometry.ts (walkStanceGeometry.of.shares, knot); actions/walkStanceModel.ts (walkStanceModel.of, knots); actions/walkStanceRows.ts (walkStanceRows.of, knots).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanWalkStanceCourse.IStance, IAutoMovieMotionHumanWalkStanceCourse.ITrunk, IAutoMovieMotionHumanWalkStanceCourse.IPelvis, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IKnot {
    /** Seconds since the take's start. */
    seconds: number;

    /** The planted feet. */
    stances: readonly IAutoMovieMotionHumanWalkStanceCourse.IStance[];

    /**
     * The pelvis under a trunk's tilt.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanWalkStanceCourse.IKnot.pelvis: The pelvis under a trunk's tilt.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanWalkStanceCourse.IKnot.pelvis is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanWalkStanceCourse.IKnot.pelvis is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanWalkStanceCourse.IKnot.pelvis is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanWalkStanceCourse.IKnot.pelvis is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanWalkStanceCourse.IKnot.pelvis is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanWalkStanceCourse.IKnot.pelvis is used through packages/motions/src/actions/walkStanceCourse.ts.
     */
    pelvis: (
      trunk: IAutoMovieMotionHumanWalkStanceCourse.ITrunk,
    ) => IAutoMovieMotionHumanWalkStanceCourse.IPelvis;

    /** The trunk's tilt the take holds; free when absent. */
    trunk?: IAutoMovieMotionHumanWalkStanceCourse.ITrunk;

    /** The pelvis's drop the take holds, metres; free when absent. */
    drop?: number;

    /** The points the take asks its feet to bear, on the floor, world metres; none when absent. */
    borne?: readonly IAutoMovieVector3[];
  }

  /**
   * A course read at a second, linearly between its knots. The solved course.
   *
   * @evidence contracts/development/common.md#meaningful-documentation drop: The pelvis's drop at each knot, metres. pitch: Each foot's pitch at each knot, degrees, negative heel up; carried through a swing where it does not stand. trunk: The trunk's tilt at each knot, degrees.
   * @evidence contracts/development/design.md#principled-representation drop: The pelvis's drop at each knot, metres. pitch: Each foot's pitch at each knot, degrees, negative heel up; carried through a swing where it does not stand. trunk: The trunk's tilt at each knot, degrees.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/walkStanceCourse.ts (walkStanceCourse.at, course); actions/walkStanceModel.ts (walkStanceModel.of, start); actions/walkStanceSolve.ts (walkStanceSolve.solve, start); actions/walkStanceSolve.ts (walkStanceSolve.solve, return); actions/walkStanceSolve.ts (walkStanceSolve.optimise, return); actions/walkStanceSolve.ts (walkStanceSolve.cut, start).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanWalkStanceCourse.IKnot, IAutoMovieMotionHumanWalkStanceCourse.IPlanted identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ICourse {
    /** The knots. */
    knots: readonly IAutoMovieMotionHumanWalkStanceCourse.IKnot[];

    /** The pelvis's drop at each knot, metres. */
    drop: Float64Array;

    /** Each foot's pitch at each knot, degrees, negative heel up; carried through a swing where it does not stand. */
    pitch: Record<"left" | "right", Float64Array>;

    /** The trunk's tilt at each knot, degrees. */
    trunk: Record<"pitch" | "roll", Float64Array>;

    /** Each foot's turn on the floor at each knot, degrees about +Y. */
    turn: Record<"left" | "right", Float64Array>;

    /** Each foot's slide on the floor from its placement at each knot, world metres. */
    slide: Record<"left" | "right", Record<"x" | "z", Float64Array>>;

    /** The largest excess the course leaves over its constraints, degrees (`MET`); at most `MET` when it meets them all. */
    unmet: number;

    /** Each knot's planted legs as the course stands them, in its stances' order. */
    planted: readonly (readonly IAutoMovieMotionHumanWalkStanceCourse.IPlanted[])[];
  }

  /**
   * A planted leg as the course stands it, the inputs of the posture's leg fit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation hip: The hip joint, lowered by the drop, world metres. ankle: The ankle the course places, world metres; a leg that cannot reach it stands on its reachable shell toward it. heading: The foot's heading, degrees.
   * @evidence contracts/development/design.md#principled-representation hip: The hip joint, lowered by the drop, world metres. ankle: The ankle the course places, world metres; a leg that cannot reach it stands on its reachable shell toward it. heading: The foot's heading, degrees.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/walkStanceGeometry.ts (walkStanceGeometry.of.read, return); actions/walkStanceSolve.ts (walkStanceSolve.record, return); actions/walkStanceSolve.ts (walkStanceSolve.problem, return); reaction/staggerSequential.ts (staggerSequential.solve.fitOf, p); reaction/staggerSequential.ts (staggerSequential.solve.piecesOf.swivels.slope.read.p, q); reaction/staggerSequential.ts (staggerSequential.solve.piecesOf.swivels.slope.read).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieQuaternion, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IPlanted {
    /** The leg. */
    side: "left" | "right";

    /** The pelvis's world rotation, the hip joints' frame. */
    pelvis: IAutoMovieQuaternion;

    /** The hip joint, lowered by the drop, world metres. */
    hip: IAutoMovieVector3;

    /** The requested ankle the course places, world metres; the constraint reader separately poses an unreachable leg on its reachable shell toward it. */
    ankle: IAutoMovieVector3;

    /** The foot's world rotation. */
    rotation: IAutoMovieQuaternion;

    /** The foot's heading, degrees. */
    heading: number;

    /** The pelvis's drop, metres. */
    drop: number;
  }

  /**
   * A course read at a second, linearly between its knots. A course read at a second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation drop: The pelvis's drop, metres. pitch: Each foot's pitch, degrees. turn: Each foot's turn, degrees.
   * @evidence contracts/development/design.md#principled-representation drop: The pelvis's drop, metres. pitch: Each foot's pitch, degrees. turn: Each foot's turn, degrees.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/walkStanceCourse.ts (walkStanceCourse.at, return); reaction/StaggerFeet.ts (StaggerFeet.settle).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanWalkStanceCourse.ITrunk identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IReading {
    /** The pelvis's drop, metres. */
    drop: number;

    /** Each foot's pitch, degrees. */
    pitch: Record<"left" | "right", number>;

    /** The trunk's tilt. */
    trunk: IAutoMovieMotionHumanWalkStanceCourse.ITrunk;

    /** Each foot's turn, degrees. */
    turn: Record<"left" | "right", number>;
  }

  /**
   * A course's evaluation (`problem`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Members state objective/degree-scaled violations and raw ordered constraint intervals at this exact course.
   * @evidence contracts/development/design.md#principled-representation Aggregate merit quantities remain separate from unclamped per-constraint zero-step bounds, so a second-order correction can read actual nonlinear excess instead of a penalty.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The sequential loop reads three original aggregates; its correction consumes the same evaluation's ordered bounds without requesting an unused trial Jacobian/model.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The actual model sweep produces every interval in convexify row order; signed negative excess remains present and no clamped penalty substitutes for a physical constraint reading.
   */
  export interface IEvaluation {
    /** The cost, half the sum of the squared residuals. */
    objective: number;

    /** The constraints' total excess, degrees (`MET`). */
    violation: number;

    /** The largest excess. */
    worst: number;

    /** Every nonlinear constraint's zero-step interval at this exact course, in convexify row order, before clipping violations to nonnegative penalties. A producer may materialize records on first read from this evaluation's own scalar snapshot, without another physical evaluation. */
    bounds: readonly Pick<IAutoMovieMotionHumanQuadraticProgram.IRow, "l" | "u">[];
  }

  /**
   * One fixed-window stance problem consumed by penalty sequential-convex
 * optimization. Coordinates retain their course units and knot layout;
 * only held swivel readings may change under the same fixed geometry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Members define course coordinates, raw/aggregate merit, convex rows, trust units, continuation records and held-prefix behavior.
 * @evidence contracts/development/design.md#principled-representation Separates one physical stance problem from the generic optimizer; world goals and degree-scaled constraints remain the shared course types, while compatible vector lengths and finite inputs are owning-problem premises.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The existing stance solver and stagger sequential consumer read every field; walkStanceCourse.IProblem preserves their original namespace entry while this interface owns the callable contracts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Contains no action/body preset, solver-success override or rounded result key; physical functions and actual optimized coordinates remain authoritative.
   */
  export interface IProblem {
    /** Flat initial variables in the original WIDTH-per-knot layout. */
    start: Float64Array;

    /**
     * The course's evaluation at its variables.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanWalkStanceCourse.IProblem.evaluate: The course's evaluation at its variables.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanWalkStanceCourse.IProblem.evaluate is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanWalkStanceCourse.IProblem.evaluate is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanWalkStanceCourse.IProblem.evaluate is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanWalkStanceCourse.IProblem.evaluate is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanWalkStanceCourse.IProblem.evaluate is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanWalkStanceCourse.IProblem.evaluate is used through packages/motions/src/actions/walkStanceCourse.ts.
     */
    evaluate: (
      x: Float64Array,
    ) => IAutoMovieMotionHumanWalkStanceCourse.IEvaluation;

    /**
     * The convex subproblem in the step about the variables, its soft rows weighted `mu`, without its region (`region`); with `objective` false, the rows alone (`IAutoMovieMotionHumanSequentialConvex.IOptions.restore`).
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanWalkStanceCourse.IProblem.convexify: The convex subproblem in the step about the variables, its soft rows weighted `mu`, without its region (`region`); with `objective` false, the rows alone (`IAutoMovieMotionHumanSequentialConvex.IOptions.restore`).
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanWalkStanceCourse.IProblem.convexify is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanWalkStanceCourse.IProblem.convexify is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanWalkStanceCourse.IProblem.convexify is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanWalkStanceCourse.IProblem.convexify is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanWalkStanceCourse.IProblem.convexify is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanWalkStanceCourse.IProblem.convexify is used through packages/motions/src/actions/walkStanceCourse.ts.
     */
    convexify: (
      x: Float64Array,
      mu: number,
      objective?: boolean,
    ) => IAutoMovieMotionHumanQuadraticProgram.IProblem;

    /**
     * The step's hard rows about the variables within the trust region `radius`, in units of `TRUST` (one is `TRUST`).
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanWalkStanceCourse.IProblem.region: The step's hard rows about the variables within the trust region `radius`, in units of `TRUST` (one is `TRUST`).
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanWalkStanceCourse.IProblem.region is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanWalkStanceCourse.IProblem.region is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanWalkStanceCourse.IProblem.region is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanWalkStanceCourse.IProblem.region is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanWalkStanceCourse.IProblem.region is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanWalkStanceCourse.IProblem.region is used through packages/motions/src/actions/walkStanceCourse.ts.
     */
    region: (
      x: Float64Array,
      radius: number, borrowedRows?: boolean,
    ) => IAutoMovieMotionHumanQuadraticProgram.IRow[];

    /**
     * A step's largest coordinate in the region's units (`TRUST`).
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanWalkStanceCourse.IProblem.length: A step's largest coordinate in the region's units (`TRUST`).
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanWalkStanceCourse.IProblem.length is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanWalkStanceCourse.IProblem.length is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanWalkStanceCourse.IProblem.length is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanWalkStanceCourse.IProblem.length is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanWalkStanceCourse.IProblem.length is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanWalkStanceCourse.IProblem.length is used through packages/motions/src/actions/walkStanceCourse.ts.
     */
    length: (step: Float64Array) => number;

    /**
     * The variables after a step.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanWalkStanceCourse.IProblem.stepped: The variables after a step.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanWalkStanceCourse.IProblem.stepped is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanWalkStanceCourse.IProblem.stepped is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanWalkStanceCourse.IProblem.stepped is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanWalkStanceCourse.IProblem.stepped is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanWalkStanceCourse.IProblem.stepped is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanWalkStanceCourse.IProblem.stepped is used through packages/motions/src/actions/walkStanceCourse.ts.
     */
    stepped: (x: Float64Array, step: Float64Array) => Float64Array;

    /** Degree-scaled excess under which every constraint is met, the unchanged MET. */
    tolerance: number;

    /**
     * The course at its variables.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanWalkStanceCourse.IProblem.course: The course at its variables.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanWalkStanceCourse.IProblem.course is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanWalkStanceCourse.IProblem.course is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanWalkStanceCourse.IProblem.course is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanWalkStanceCourse.IProblem.course is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanWalkStanceCourse.IProblem.course is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanWalkStanceCourse.IProblem.course is used through packages/motions/src/actions/walkStanceCourse.ts.
     */
    course: (
      x: Float64Array,
      unmet: number,
    ) => IAutoMovieMotionHumanWalkStanceCourse.ICourse;

    /**
     * A knot's planted legs at the variables, its index the take's; none for a knot the problem holds.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanWalkStanceCourse.IProblem.planted: A knot's planted legs at the variables, its index the take's; none for a knot the problem holds.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanWalkStanceCourse.IProblem.planted is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanWalkStanceCourse.IProblem.planted is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanWalkStanceCourse.IProblem.planted is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanWalkStanceCourse.IProblem.planted is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanWalkStanceCourse.IProblem.planted is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanWalkStanceCourse.IProblem.planted is used through packages/motions/src/actions/walkStanceCourse.ts.
     */
    planted: (
      x: Float64Array,
      knot: number, side?: "left" | "right",
    ) => IAutoMovieMotionHumanWalkStanceCourse.IPlanted[];

    /**
     * A leg's own variables' indices at a knot (`LEG`), its index the take's.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanWalkStanceCourse.IProblem.variables: A leg's own variables' indices at a knot (`LEG`), its index the take's.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanWalkStanceCourse.IProblem.variables is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanWalkStanceCourse.IProblem.variables is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanWalkStanceCourse.IProblem.variables is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanWalkStanceCourse.IProblem.variables is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanWalkStanceCourse.IProblem.variables is used through packages/motions/src/actions/walkStanceCourse.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanWalkStanceCourse.IProblem.variables is used through packages/motions/src/actions/walkStanceCourse.ts.
     */
    variables: (knot: number, side: "left" | "right") => number[];

    /** First knot this problem moves, indexed in the complete take. */
    first: number;
  }
}
