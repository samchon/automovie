import { physicalBalanceSense as physicalBalanceSenseImplementation } from "./internal/physicalBalanceSense";
import { type AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import { physicalCentroidalTask as physicalCentroidalTaskImplementation } from "./internal/physicalCentroidalTask";
import { physicalIcpControllerQp as physicalIcpControllerQpImplementation } from "./internal/physicalIcpControllerQp";
import { preparePhysicalDisturbanceSpan as preparePhysicalDisturbanceSpanImplementation } from "./internal/preparePhysicalDisturbanceSpan";

import { physicalBalanceExhaustion as physicalBalanceExhaustionImplementation } from "./internal/physicalBalanceExhaustion";
import { physicalBalanceBracing as physicalBalanceBracingImplementation } from "./internal/physicalBalanceBracing";
import { physicalBalanceReference as physicalBalanceReferenceImplementation } from "./internal/physicalBalanceReference";
import { planPhysicalBalanceTargets as planPhysicalBalanceTargetsImplementation } from "./internal/planPhysicalBalanceTargets";

import type { AutoMovieEnginePhysicalBalanceTypes } from "./AutoMovieEnginePhysicalBalanceTypes";
import { type IAutoMoviePhysicalBalance, type IAutoMoviePhysicalSupportPatch, type IAutoMovieVector3, type IAutoMoviePhysicalBalanceExhaustion, type IAutoMoviePhysicalBalanceBracing, type IAutoMoviePhysicalBalanceReference, type IAutoMoviePlanPhysicalSupportTargets, type IAutoMoviePlanPhysicalBalanceTargets } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { convexHull2D } from "../math/internal/convexHull2D";
import { AutoMovieEnginePhysicalStanceSupport } from "./AutoMovieEnginePhysicalStanceSupport";
import { physicalBalanceAssessment as Assessment } from "./internal/physicalBalanceAssessment";
import { physicalBalanceCandidate as Candidate } from "./internal/physicalBalanceCandidate";
import { physicalBalancePair as Pair } from "./internal/physicalBalancePair";
import { advancePhysicalBalance as advanceImplementation } from "./internal/advancePhysicalBalance";
import { physicalBalanceHandoff as handoffImplementation } from "./internal/physicalBalanceHandoff";
import { physicalBalanceRamp as rampImplementation } from "./internal/physicalBalanceRamp";
import { physicalBalancePlan as planImplementation } from "./internal/physicalBalancePlan";
import { physicalBalanceSettle as settleImplementation } from "./internal/physicalBalanceSettle";
import { physicalBalanceStance as stanceImplementation } from "./internal/physicalBalanceStance";
import { physicalBalanceSwing as swingPhaseImplementation } from "./internal/physicalBalanceSwing";

/**
 * Linear-inverted-pendulum capture-point balance over an arbitrary support
 * polygon (Pratt et al., 2006). It predicts horizontal recovery only; solved
 * contacts and the subsequent simulation decide whether a step actually lands.
 * Every body's plan assesses with it on the hull of its planted contacts
 * (`AutoMoviePhysicalBalance.plan`), whatever their number.
 */
export namespace AutoMoviePhysicalBalance {
  /**
   * The peak acceleration of a minimum-jerk transfer of unit distance in unit
   * time: 10 sqrt(3) / 3 (Flash and Hogan 1985). A swing over d in T peaks at
   * MINIMUM_JERK d / T^2.
   */
  export const MINIMUM_JERK: number = (10 * Math.sqrt(3)) / 3;

  /**
   * The peak vertical acceleration of a swing's clearance h 16 (p (1 - p))^2 of
   * unit height in unit time, at lift-off and touchdown
   * (`samplePhysicalRecoveryGoal`): a clearance h in T peaks at CLEARANCE h /
   * T^2.
   */
  export const CLEARANCE: number = 32;

  /** The shortest swing, seconds (Khadiv et al. 2017, Section V). */
  export const MINIMUM_SWING: number = 0.3;

  /**
   * The balance controller's plan phase (`AutoMoviePhysicalBalance.advance`), one for every
   * body whatever its contacts: the pendulum's rate, the plan's capture point and
   * the assessment the settle phase reads. A step out of a fall is the prepared
   * disturbance response's (`preparePhysicalDisturbanceSpan`), never this
   * phase's.
   *
   * - The pendulum's rate is IHMC's omega0, sqrt(g / z0), z0 the authored centre of
   *   mass's height over the floor at the controller's first update, held for the
   *   run as IHMC holds it from its nominal height (201903
   *   `HighLevelHumanoidControllerToolbox` l.155, l.204;
   *   `WalkingControllerParameters.getOmega0` l.45-51), the authored motion being
   *   this engine's nominal.
   * - The plan's capture point is the authored motion's
   *   (`physicalAuthoredCapture`), the authored motion playing the planner's
   *   role, which the root's capture-point controller tracks
   *   (`AutoMovieEnginePhysicalBipedPressure`).
   * - The assessment is the capture point against the planted contacts' hull
   *   (`AutoMovieEnginePhysicalSupportSpanContacts.hull`).
   *
   * @param input The recovery's state after the ramp phase, the body's readings,
   *   the stance read from that state and the trace to record into, if any.
   * @returns The state after the plan, a new one; no held goals; and the
   *   assessment the settle phase reads. The input is never written.
   */
  export function plan(input: Parameters<typeof planImplementation.run>[0]): ReturnType<typeof planImplementation.run> {
    return planImplementation.run(input);
  }

  /**
   * The pendulum's rate, IHMC's omega0: sqrt(g / z0), z0 the authored centre of
   * mass's height over the floor (`physicalAuthoredCapture.center`).
   *
   * @param sense The body's readings.
   * @param state The recovery's state.
   * @returns The rate, per second.
   */
  export function planOmega(
    sense: Parameters<typeof planImplementation.omega>[0],
    state: Parameters<typeof planImplementation.omega>[1],
  ): ReturnType<typeof planImplementation.omega> {
    return planImplementation.omega(sense, state);
  }

  /**
   * The balance controller's settle phase (`AutoMoviePhysicalBalance.advance`): the
   * endpoint goals of the limbs no step holds, and the root's tracking strength.
   *
   * A landed foot is held by the floor and its leg's joints alone: no endpoint
   * servo pulls it toward its goal outside the support solve, which already
   * holds it (Feng et al. 2013, Section III-D: no orientation tracking on a
   * loaded foot); its goal is its landed place. Once a landing has moved the
   * root, every other limb's goal is its authored endpoint moved by its own
   * offset. The root's tracking is withdrawn once unrecoverable support loss
   * has lasted its policy's duration (`physicalBalanceExhaustion`), or set by the
   * bracing policy where one is declared (`physicalBalanceBracing`).
   *
   * @param input The recovery's state after the swing phase, the body's
   *   readings, the goals the plan and swing phases set and the stance's
   *   assessment.
   * @returns The state with its loss timer advanced, a new one; every goal,
   *   those given first; and the root's strength and bracing shift. The input is
   *   never written.
   */
  export function settle(input: Parameters<typeof settleImplementation.run>[0]): ReturnType<typeof settleImplementation.run> {
    return settleImplementation.run(input);
  }

  /**
   * The stance the balance controller decides and swings from this substep
   * (`AutoMoviePhysicalBalance.advance`), read once the steps that lift have lifted and
   * shared by the plan and swing phases: the supports planted, the pendulum's
   * floor and rate, the capture point's shift for the body's rotation, a landed
   * foot's ramping share, the trunk's tilt and whether it asks for a step, the
   * stance feet's heading, the step's timing, and the assessment the step choices
   * ask of `AutoMoviePhysicalBalance.assess`.
   *
   * Support is what the controller has planted, not what touches this step: every
   * planted limb, a limb asked to step among them until it lifts, bounds where
   * the centre of pressure can return by its own outline, whether or not a
   * tipping body has lifted it for a moment, so the classification does not
   * flicker with momentary contact.
   *
   * @param input The recovery's state after the lift phase and the body's
   *   readings.
   * @returns The stance; nothing is written.
   */
  export function stance(input: Parameters<typeof stanceImplementation.run>[0]): ReturnType<typeof stanceImplementation.run> {
    return stanceImplementation.run(input);
  }

  /**
   * The balance controller's swing phase (`AutoMoviePhysicalBalance.advance`): each lifted
   * limb's path sampled and its drive's feed-forward asked for. The landing is
   * placed by the prepared span (`preparePhysicalDisturbanceSpan`).
   *
   * A biped's recovery swing's clearance is lowered to what the stance can carry
   * at its peak in the swing's time (`AutoMovieEnginePhysicalStanceSwing.clearance`); a
   * quadruped's step carries its own ground clearance (IHMC 201903
   * `QuadrupedSwingState` l.357), which the path rises by. Either is the sole's:
   * a foot pitched so its lowest point hangs further below its endpoint than when
   * planted flat has the endpoint raised by the difference (Pratt et al., M2V2,
   * Section VII-D1). The joints track the path with their own servos, within
   * their caps; the drive adds only the path's feed-forward through J^T
   * (`AutoMovieEnginePhysicalStanceSwing.swingForce`).
   *
   * The path is this phase's own, a known non-port: IHMC 201903 swings a biped by
   * an optimized two-waypoint trajectory (`TwoWaypointSwingGenerator`) and a
   * quadruped by a blended two-waypoint one (`QuadrupedSwingState`), each tracked
   * by a whole-body task in space, which this engine does not have.
   *
   * @param input The recovery's state after the plan phase, the body's readings
   *   and the trace to record into, if any.
   * @returns The state, the input itself; each lifted limb's endpoint goal; the
   *   drives to apply, in the swings' order; and the path the joints' reference
   *   fits (`trackPhysicalBalanceTargets`), the first swing's and a second's as
   *   `pair`. The input is never written.
   */
  export function swingPhase(input: Parameters<typeof swingPhaseImplementation.run>[0]): ReturnType<typeof swingPhaseImplementation.run> {
    return swingPhaseImplementation.run(input);
  }

/**
   * Advance one body's generic recovery controller from actual floor manifolds.
   * Root tracking is withdrawn on unrecoverable support loss. Recovery requests
   * use the shared support-swing interpolator and bounded endpoint motors; their
   * completed placements remain offsets on subsequent authored goals, so the
   * planner and physical support do not snap apart at landing.
   *
   * The controller is a machine of phases, each a function from the state and the
   * body's readings (`physicalBalanceSense`) to the next state and its commands,
   * none writing its input, run in this order: authored handoff
   * (`AutoMoviePhysicalBalance.handoff`), the stance feet's seating
   * (`AutoMoviePhysicalBalance.ramp`), the stance (`AutoMoviePhysicalBalance.stance`), the plan
   * (`AutoMoviePhysicalBalance.plan`), the swing (`AutoMoviePhysicalBalance.swingPhase`) and settling
   * (`AutoMoviePhysicalBalance.settle`). The swing's drives are applied here, and the
   * caller's state becomes the last phase's.
   *
   * One machine serves every body whatever its contacts: the plan balances on the
   * planted contacts' hull, and a step out of a fall is the disturbance's
   * prepared response (`preparePhysicalDisturbanceSpan`), its inputs recorded
   * here on the substep after a stated push.
   */
  export function advance(input: Parameters<typeof advanceImplementation>[0]): ReturnType<typeof advanceImplementation> {
    return advanceImplementation(input);
  }

  /**
   * The balance controller's handoff phase (`AutoMoviePhysicalBalance.advance`): authored
   * motion taking endpoints back. A step under way on an endpoint the authored
   * motion now owns cancels every step under way, counted neither as a landing
   * nor as a fall; an endpoint's retained landing offset is handed back to the
   * authored motion and the handoff recorded.
   *
   * @param input The recovery's state, the endpoints authored motion owns this
   *   substep, the present local seconds and the trace to record into, if any.
   * @returns The state after the handoff, a new one, or the input itself when
   *   nothing is handed back; the input is never written.
   */
  export function handoff(input: Parameters<typeof handoffImplementation>[0]): ReturnType<typeof handoffImplementation> {
    return handoffImplementation(input);
  }

  /**
   * The balance controller's landing-ramp phase (`AutoMoviePhysicalBalance.advance`): each
   * stance foot's seating advanced by one substep (`AutoMovieEnginePhysicalStanceSeat`), its
   * sole's seating, its low-passed measured load, which decides lift-off and
   * touchdown, and its bearing, flatness and entry shares by geometry, each
   * ramping over `AutoMovieEnginePhysicalStanceBalance.FADE`; a landed foot starts full, as
   * both of IHMC 201903's controllers seat it at touchdown,
   * and a foot seated anew otherwise ramps in from nothing here. A first stance
   * starts borne and flat. A foot's world
   * orientation is latched where it actually stands when its stance begins, at
   * the first step or on landing, its planted-foot hold
   * (`AutoMovieEnginePhysicalStanceJointTarget`), and latched again when it touches again after
   * leaving the holds, added with zero error where it stands as a landed foot is
   * (design-4017-qp3, Section 3, rules 2 and 3).
   *
   * The sole's spread is how far the highest of the main foot carrier's sole
   * vertices stands above the lowest, actual heights only, the toes (a jointed
   * segment of their own) left out: a flat foot's sole lies level, an edge
   * lifting raises the spread (Coros, Beaudoin and van de Panne 2010, Section
   * 3.3). The plant only names which vertices form the sole.
   *
   * @param input The recovery's state and the body's readings.
   * @returns The state with every limb not asked to step seated, a new one, or
   *   the input itself when every limb is asked to step; the input is never
   *   written.
   */
  export function ramp(input: Parameters<typeof rampImplementation>[0]): ReturnType<typeof rampImplementation> {
    return rampImplementation(input);
  }

/**
   * The quickest swing over a distance with a clearance under an acceleration
   * bound, seconds: the longer of the minimum-jerk transfer's and the
   * clearance's, sqrt(max(MINIMUM_JERK d, CLEARANCE h) / a), and no shorter
   * than `MINIMUM_SWING`.
   */
  export function duration(
    distance: number,
    height: number,
    acceleration: number,
  ): number {
    return Math.max(
      MINIMUM_SWING,
      Math.sqrt(
        Math.max(MINIMUM_JERK * distance, CLEARANCE * height) / acceleration,
      ),
    );
  }

  /**
   * How far a point lies outside a convex floor polygon, metres: zero inside,
   * else its distance to the nearest edge; a polygon of fewer than three
   * vertices has no inside.
   */
  export function excess(
    polygon: readonly IAutoMovieVector3[],
    point: IAutoMovieVector3,
  ): number {
    let inside: boolean = polygon.length >= 3;
    let outside: number = Infinity;
    for (let i: number = 0; i < polygon.length; i++) {
      const a: IAutoMovieVector3 = polygon[i]!;
      const b: IAutoMovieVector3 = polygon[(i + 1) % polygon.length]!;
      const dx: number = b.x - a.x;
      const dz: number = b.z - a.z;
      const denominator: number = dx * dx + dz * dz;
      const t: number =
        denominator === 0
          ? 0
          : Math.max(
              0,
              Math.min(
                1,
                ((point.x - a.x) * dx + (point.z - a.z) * dz) / denominator,
              ),
            );
      outside = Math.min(
        outside,
        Math.hypot(
          point.x - a.x - dx * t,
          point.z - a.z - dz * t,
        ),
      );
      if (dx * (point.z - a.z) - dz * (point.x - a.x) < 0) inside = false;
    }
    return inside ? 0 : outside;
  }

  /**
   * The outline the stance holds its centre of pressure inside: the support
   * shrunk by the inset (Koolen et al., Corollary 3).
   */
  export function held(
    scope: Pick<Assessment.IAssessment, "inset">,
    outline: IAutoMovieVector3[],
  ): IAutoMovieVector3[] {
    return scope.inset > 0
      ? AutoMovieEnginePhysicalStanceSupport.shrink(outline, scope.inset)
      : outline;
  }

  /**
   * A swing over distance d lands after the unloading ramp and the quickest
   * minimum-jerk transfer the leg's acceleration bound allows.
   */
  export function swing(
    scope: Assessment.IAssessment,
    distance: number,
  ): number {
    return scope.timing
      ? duration(distance, scope.timing.height, scope.timing.acceleration)
      : (scope.input.swingSeconds ?? 0);
  }

  /**
   * The capture point diverges through the unloading ramp, the swing and the
   * landed foot's ramp-in, less what a swing under way has spent: the target is
   * where it will be once the new foot bears (Khadiv et al. 2017, Section
   * III-B; Herzog et al. 2016, Section 5.3).
   */
  export function until(
    scope: Assessment.IAssessment,
    distance: number,
  ): number {
    return Math.max(
      0,
      (scope.timing?.ramp ?? 0) +
        swing(scope, distance) +
        (scope.timing?.landing ?? 0) -
        scope.spent,
    );
  }
  /**
   * Choose the recovery step once the capture point leaves the shrunken
   * support: a capturing step before one that is not, one whose remaining
   * supports already hold the commanded centre of pressure before one that must
   * first be unloaded, the one that landed last only after any other, then the
   * shortest travel, the lead along the capture point's direction and the
   * declared footfall phase; its target is where the capture point will be when
   * it can land, clamped to the reach. Young adults recover a lateral push
   * mostly by a single side step of the limb the push loaded (Mille et al.
   * 2005, Clinical Biomechanics), which the controller unloads over a short
   * ramp before lifting (`AutoMoviePhysicalBalance.advance`). A four-support body none of
   * whose capturing steps can be unloaded at once steps the chosen limb with
   * its diagonal, when that pair captures (Chen et al. 2022, Section 2.1,
   * Example 1).
   */
  export function assess(
    input: IAutoMoviePhysicalBalance.IAssessInput,
  ): IAutoMoviePhysicalBalance.IResult {
    const height: number = input.center.y - input.floor;
    if (
      input.gravity <= 0 ||
      input.maximumStep <= 0 ||
      input.margin < 0 ||
      (input.inset !== undefined && input.inset < 0)
    )
      throw new Error("Invalid physical balance state or limits");
    const omega: number =
      height > 0 ? Math.sqrt(input.gravity / height) : Infinity;
    const capturePoint: IAutoMovieVector3 = {
      x: input.center.x + input.velocity.x / omega + (input.spin?.x ?? 0),
      y: input.floor,
      z: input.center.z + input.velocity.z / omega + (input.spin?.z ?? 0),
    };
    const polygon: IAutoMovieVector3[] = convexHull2D(
      input.supports.flatMap(
        (support: (typeof input.supports)[number]): IAutoMovieVector3[] =>
          support.points,
      ),
    );
    // The capture point needs a step once it leaves the outline the stance
    // holds its centre of pressure inside (Koolen et al., Corollary 3).
    const inset: number = input.inset ?? 0;
    const outside: number = AutoMoviePhysicalBalance.excess(
      polygon,
      capturePoint,
    );
    const beyond: number = AutoMoviePhysicalBalance.excess(
      AutoMoviePhysicalBalance.held({ inset }, polygon),
      capturePoint,
    );
    const result: IAutoMoviePhysicalBalance.IResult = {
      state: "unrecoverable",
      capturePoint,
      polygon,
      outside,
      beyond,
    };
    if (height <= 0 || polygon.length === 0) return result;
    if (beyond <= input.margin && !input.force)
      return { ...result, state: "supported" };
    const centroid: IAutoMovieVector3 = Vector3.scale(
      input.supports.reduce(
        (
          sum: IAutoMovieVector3,
          support: IAutoMoviePhysicalSupportPatch,
        ): IAutoMovieVector3 => Vector3.add(sum, support.position),
        { x: 0, y: 0, z: 0 },
      ),
      1 / input.supports.length,
    );
    const direction: IAutoMovieVector3 = {
      x: capturePoint.x - centroid.x,
      y: 0,
      z: capturePoint.z - centroid.z,
    };
    const denominator: number = direction.x ** 2 + direction.z ** 2;
    // A swing over distance d lands after the unloading ramp and the
    // quickest minimum-jerk transfer the leg's acceleration bound allows.
    const timing: IAutoMoviePhysicalBalance.IAssessInput["swing"] =
      input.swing &&
      input.swing.acceleration > 0 &&
      input.swing.ramp >= 0 &&
      input.swing.height >= 0 &&
      (input.swing.landing === undefined || input.swing.landing >= 0)
        ? input.swing
        : undefined;
    // A swing under way lands its elapsed time sooner than a fresh one.
    const scope: Assessment.IAssessment = {
      input,
      omega,
      capturePoint,
      inset,
      result,
      centroid,
      direction,
      denominator,
      timing,
      spent: Math.max(0, timing?.elapsed ?? 0),
    }; // A pair under way is planned again as that pair.
    if (input.pair) {
      const lead: IAutoMoviePhysicalSupportPatch | undefined =
        input.supports.find(
          (support: (typeof input.supports)[number]): boolean =>
            support.bone === input.pair![0],
        );
      const partner: IAutoMoviePhysicalSupportPatch | undefined =
        input.supports.find(
          (support: (typeof input.supports)[number]): boolean =>
            support.bone === input.pair![1],
        );
      return lead && partner && lead !== partner
        ? Pair.paired(scope, lead, partner, Pair.pair(scope, lead, partner))
        : result;
    }
    const candidates: Candidate.ICandidate[] = input.supports.flatMap(
      (support: (typeof input.supports)[number]): Candidate.ICandidate[] =>
        Candidate.candidate(scope, support),
    );
    candidates.sort(
      (
        a: (typeof candidates)[number],
        b: (typeof candidates)[number],
      ): number =>
        Number(b.viable) - Number(a.viable) ||
        // Among steps none of which captures, the one that leaves the capture
        // point least past its new support at landing: viability is soft, its
        // violation minimized (Khadiv et al. 2017, Section III-B).
        (!a.viable && !b.viable ? a.violation - b.violation : 0) ||
        // Unloading ranks capturing steps only: a limb that can leave the
        // commanded centre of pressure but cannot capture is no help, as a
        // rear foot under a forward push, already unloaded but unable to
        // extend the support toward the push.
        Number(b.viable && b.unloadable) - Number(a.viable && a.unloadable) ||
        Number(a.support.bone === input.recent) -
          Number(b.support.bone === input.recent) ||
        a.distance - b.distance ||
        b.lead - a.lead ||
        a.phase - b.phase,
    );
    const chosen: (typeof candidates)[number] | undefined = candidates[0];
    if (!chosen || input.supports.length - 1 < input.pattern.minimumSupports)
      return result;
    // A four-support body whose every capturing step still bears the
    // commanded centre of pressure steps the chosen limb with its diagonal
    // instead, when that pair captures: the limb across the supports'
    // centroid from it, so the other diagonal is left holding (Chen et al.
    // 2022, Section 2.1, Example 1; design-4017-pair). Without a commanded
    // centre of pressure no limb is known to bear it, and a biped has no
    // pair.
    if (
      timing &&
      input.pressure !== undefined &&
      input.supports.length === 4 &&
      input.supports.length - 2 >= input.pattern.minimumSupports &&
      !candidates.some(
        (candidate: (typeof candidates)[number]): boolean =>
          candidate.viable && candidate.unloadable,
      )
    ) {
      const across = (other: IAutoMoviePhysicalSupportPatch): number => {
        const a: IAutoMovieVector3 = Vector3.subtract(
          chosen.support.position,
          centroid,
        );
        const b: IAutoMovieVector3 = Vector3.subtract(other.position, centroid);
        const lengths: number = Math.hypot(a.x, a.z) * Math.hypot(b.x, b.z);
        return lengths > 0 ? (a.x * b.x + a.z * b.z) / lengths : 1;
      };
      const partner: IAutoMoviePhysicalSupportPatch | undefined = input.supports
        .filter(
          (other: (typeof input.supports)[number]): boolean =>
            other !== chosen.support &&
            !input.unavailable.includes(other.bone) &&
            input.pattern.limbs.some(
              (limb: (typeof input.pattern.limbs)[number]): boolean =>
                limb.bone === other.bone,
            ),
        )
        .sort(
          (
            a: IAutoMoviePhysicalSupportPatch,
            b: IAutoMoviePhysicalSupportPatch,
          ): number => across(a) - across(b),
        )[0];
      const planned: Pair.IPair | undefined = partner
        ? Pair.pair(scope, chosen.support, partner)
        : undefined;
      if (partner && planned?.viable)
        return planned.distance < (input.inset ?? 0)
          ? { ...result, state: "supported" }
          : Pair.paired(scope, chosen.support, partner, planned);
      // With no step capturing, the pair is taken when it leaves the capture
      // point less past its new support than the best single step (Khadiv et
      // al. 2017, Section III-B).
      if (
        partner &&
        planned &&
        !chosen.viable &&
        planned.violation < chosen.violation
      )
        return Pair.paired(scope, chosen.support, partner, planned);
    }
    // A capturing step shorter than the margin is no step: the margin is the
    // centre-of-pressure law's buffer, so the body holds in double support
    // (Pratt et al., M2V2, Section VII-E1: stop in double support).
    if (timing && chosen.viable && chosen.distance < (input.inset ?? 0))
      return { ...result, state: "supported" };
    return {
      ...result,
      state: "recovery",
      step: {
        bone: chosen.support.bone,
        target: chosen.target,
        ...(timing
          ? {
              seconds: chosen.seconds,
              viable: chosen.viable,
              violation: chosen.violation,
            }
          : {}),
      },
    };
  }

  /**
   * The step a request plans next while its limb has not lifted: the best step
   * when its own limb has none, or when the best captures and its own does not;
   * but once its limb has begun unloading, only its own, its place and time
   * planned again and its limb kept, none when its own has no step. A step is
   * committed at its trigger and adapted, never handed to another limb
   * (design-4017-landing, decision 2; Khadiv et al. 2017 and Griffin et al.
   * 2017 adapt throughout but never cancel): moving the request after its load
   * has started to leave bounds both limbs' ramps at once.
   *
   * @param input Whether the requested limb has begun unloading, its own limb's
   *   step if it has one, and the best step over every limb.
   * @returns The step to request, or undefined to keep the request as it is.
   */
  export function retarget(input: {
    unloading: boolean;
    own?: NonNullable<IAutoMoviePhysicalBalance.IResult["step"]>;
    best: NonNullable<IAutoMoviePhysicalBalance.IResult["step"]>;
  }): IAutoMoviePhysicalBalance.IResult["step"] {
    if (input.unloading) return input.own;
    return input.own === undefined ||
      (input.best.viable === true && input.own.viable !== true)
      ? input.best
      : input.own;
  }

  /**
   * The capture point a time ahead while the supports hold their centre of
   * pressure at their point nearest it. With the centre of pressure u fixed,
   * the inverted pendulum's capture point moves as u + (xi - u) e^(omega t)
   * (Hof, Gazendam and Sinke 2005, Eq. 3 written for x + v / omega); Pratt et
   * al. (2006) capture at xi only by an instantaneous step.
   *
   * @param capture The present capture point, world metres.
   * @param polygon The supports' convex hull; empty leaves the capture point
   *   where it is.
   * @param elapsed The time ahead times the pendulum frequency, dimensionless.
   * @returns The capture point then, world metres, at the capture point's
   *   height.
   */
  export function diverge(
    capture: IAutoMovieVector3,
    polygon: readonly IAutoMovieVector3[],
    elapsed: number,
  ): IAutoMovieVector3 {
    if (polygon.length === 0 || !(elapsed > 0)) return { ...capture };
    const pressure: IAutoMovieVector3 = nearest(polygon, capture);
    const growth: number = Math.exp(elapsed);
    return {
      x: pressure.x + (capture.x - pressure.x) * growth,
      y: capture.y,
      z: pressure.z + (capture.z - pressure.z) * growth,
    };
  }

  /**
   * The point of a horizontal convex polygon nearest a point: the point itself
   * inside, else its projection on the nearest edge.
   *
   * @param polygon The counter-clockwise hull, world metres.
   * @param point The point, world metres.
   * @returns The nearest polygon point at the given point's height.
   */
  export function nearest(
    polygon: readonly IAutoMovieVector3[],
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    if (polygon.length === 1)
      return { x: polygon[0]!.x, y: point.y, z: polygon[0]!.z };
    let inside: boolean = polygon.length >= 3;
    let best: IAutoMovieVector3 = { ...point };
    let distance: number = Infinity;
    for (let i: number = 0; i < polygon.length; i++) {
      const a: IAutoMovieVector3 = polygon[i]!;
      const b: IAutoMovieVector3 = polygon[(i + 1) % polygon.length]!;
      const dx: number = b.x - a.x;
      const dz: number = b.z - a.z;
      const denominator: number = dx * dx + dz * dz;
      const t: number =
        denominator === 0
          ? 0
          : Math.max(
              0,
              Math.min(
                1,
                ((point.x - a.x) * dx + (point.z - a.z) * dz) / denominator,
              ),
            );
      const x: number = a.x + dx * t;
      const z: number = a.z + dz * t;
      const gap: number = Math.hypot(point.x - x, point.z - z);
      if (gap < distance) {
        distance = gap;
        best = { x, y: point.y, z };
      }
      if (dx * (point.z - a.z) - dz * (point.x - a.x) < 0) inside = false;
    }
    return inside ? { ...point } : best;
  }

  /**
   * Whether bounded support recovery is exhausted at one tick.
   *
   * Continuously unrecoverable support starts a clock at its first tick and keeps
   * that start while it lasts; any other assessment clears it. Recovery is
   * exhausted once the clock has run for the policy's duration, inclusive, or at
   * once after a failed landing, which withdraws support rather than inventing a
   * success.
   */
  export function exhaustion(input: IAutoMoviePhysicalBalanceExhaustion.IInput): IAutoMoviePhysicalBalanceExhaustion.IResult {
    return physicalBalanceExhaustionImplementation(input);
  }

  /**
   * Capture-point feedback toward the actual support hull under an explicit
   * root-target travel bound. This requests a bounded motor target adjustment,
   * never an extra force or a pose write. A failed step alone cannot turn off
   * remaining effort: withdrawal additionally requires the declared measured
   * COM-height recovery limit. The provider owns that limit and its meaning.
   */
  export function bracing(input: IAutoMoviePhysicalBalanceBracing.IInput): IAutoMoviePhysicalBalanceBracing.IResult {
    return physicalBalanceBracingImplementation(input);
  }

  /**
   * The completed fitted balance reference at a replan boundary and the authored
   * placements at that same boundary. A replan in the next interval starts from
   * the previous plan's endpoint; a revision inside the interval starts at the
   * preceding native tick of the previous plan. Without a contiguous previous
   * plan there is no completed reference.
   */
  export function reference(input: IAutoMoviePhysicalBalanceReference.IInput): IAutoMoviePhysicalBalanceReference.IResult {
    return physicalBalanceReferenceImplementation(input);
  }

  /**
   * Fit world support intent in the measured floating-base frame. Reach-derived
   * lowering remains a separate root motor request; no lowered virtual root is
   * passed off as the actual stance frame.
   */
  export function planTargets(input: IAutoMoviePlanPhysicalBalanceTargets.IInput): IAutoMoviePlanPhysicalSupportTargets.IResult {
    return planPhysicalBalanceTargetsImplementation(input);
  }

  /**
   * What the balance controller reads of one body this substep, shared by its
   * phases (`AutoMoviePhysicalBalance.advance`): the segments' actual state, the supports'
   * measured loads, the authored placements and the policy's limbs. Every reading
   * is a function of the input alone; nothing here writes a body or the
   * recovery's state, and a reading that depends on the state takes the part of
   * it that it reads as an argument.
   *
   * @param input The body's profile, segments, policy, authored placements and
   *   endpoint velocities, the endpoints authored motion owns, the present local
   *   seconds, the substep, gravity's magnitude, the floor's height and the
   *   supports.
   * @returns The readings: the mass centre's position and velocity and the root
   *   segment found now, the rest computed when asked for.
   */
  export function sense(input: AutoMovieEnginePhysicalBalanceTypes.ISenseInput): AutoMovieEnginePhysicalBalanceTypes.ISense {
    return physicalBalanceSenseImplementation(input);
  }

  /**
   * The whole-body momentum task of a root under internal actuation: the ground
   * reaction the supports should give, about the mass center.
   *
   * The ground reaction changes the whole body's momentum, so the task that asks
   * it is a momentum task (Herzog, Rotella, Mason, Grimminger, Schaal and
   * Righetti 2016; Orin, Goswami and Lee 2013, "Centroidal dynamics of a humanoid
   * robot"): its force tracks the mass center, `F = K (c_ref - c) - D (c' -
   * c'_ref) - m g`, and its moment about the mass center, where gravity has none,
   * is the trunk's orientation demand. The reference is the mass center the
   * target pose puts there once its root stands at the root's goal, so the root's
   * own shifts (recovery, lowering) move it with the root. A root error read on
   * the root body alone would leave the mass center free whenever the limbs carry
   * it while the root holds still.
   *
   * @param input The body's segments, goals, gains and demands.
   * @returns The task: the mass center, the force and the moment.
   */
  export function centroidalTask(input: AutoMovieEnginePhysicalBalanceTypes.ICentroidalTaskInput): AutoMovieXpbdWorld.IRootTask {
    return physicalCentroidalTaskImplementation(input);
  }

  /**
   * One solve of IHMC's capture-point feedback program over x = (dCoP, dCMP): the
   * centre of pressure's offset from its feed-forward and the pivot's offset from
   * the centre of pressure, with the angular momentum on, as Zulu's
   * `useAngularMomentum` sets it.
   *
   * Every term is in the reference's 1/2 x^T H x - h^T x form
   * (`ICPControllerQPSolver` l.45-53, l.861): a task (x - o)^T W (x - o) adds W
   * to H and W o to h. The program is strictly convex, the CoP and CMP feedback
   * weights being positive definite, so its minimizer is unique and the
   * reference's warm-started active set (l.865-866) changes only the iterations;
   * `solveDenseActiveSet` solves it cold.
   *
   * A program the solver cannot solve gives null, as `solve()` returns false then
   * (l.871-882).
   *
   * @param input The program's terms. Points and matrices are in the caller's
   *   horizontal frame, metres; weights are the reference's, the rate weights
   *   already divided by the control period squared.
   * @returns The feedback pair, or null.
   */
  export function icpControllerQp(input: AutoMovieEnginePhysicalBalanceTypes.IIcpControllerQpInput): AutoMovieEnginePhysicalBalanceTypes.IIcpControllerQpSolution | null {
    return physicalIcpControllerQpImplementation(input);
  }

  /**
   * A biped's response to a stated disturbance, prepared once for the span: IHMC
   * 201903's push recovery and capture-point plans laid from the state just after
   * the first push, every moving span a closed-form curve between the few branch
   * points where the response changes, and `sample(t)` a pure evaluation at any
   * time in any order.
   *
   * Branch points, and what each does as the reference's states do:
   *
   * - A push: the centre of mass's velocity jumps by the push's impulse over the
   *   mass, the capture point by that over omega. In double support the push
   *   recovery's fall test runs (`AutoMovieEnginePhysicalPushRecovery.doubleSupport`), and a
   *   fall triggers a step the policy's reaction time after the capture point
   *   left the support; in single support the footstep is checked again against
   *   the capture region with the swing time left and, when it moves, the plan is
   *   made again from then (`WalkingSingleSupportState` l.136-163) and the swing
   *   foot's cubic re-aimed from where it is.
   * - The trigger: the footstep in the support foot's one-step capture region
   *   (`AutoMovieEnginePhysicalPushRecovery.checkAndUpdate`) and the single-support plan to it
   *   (`AutoMovieEnginePhysicalIcpPlanner.singleSupport`).
   * - The touchdown, the swing time after the trigger (`ZULU.swingTime`): the
   *   transfer to standing (`AutoMovieEnginePhysicalIcpPlanner.toStanding`), done once its
   *   duration has run and the capture point is within `maxErrorToStanding` of
   *   its hold (`TransferToStandingState.isDone`), found in closed form from the
   *   error's decay.
   * - A fall: no capturable footstep, the one-step capture region empty at the
   *   trigger or after a push in single support, ends the response there; the
   *   body is handed back to the physics, which takes the fall's contacts.
   * - Standing: the cubic to the authored capture point
   *   (`AutoMovieEnginePhysicalIcpPlanner.standing`), and at its end the authored capture point
   *   at rest.
   *
   * Between them each plan's capture point xi_d is a chain of closed forms read
   * off the built plan on fixed soles: an exponential from a constant pivot, q +
   * r e^(omega t), or a cubic, a0 + a1 t + a2 t^2 + a3 t^3. The ICP controller
   * acts on the error e = xi - xi_d (`AutoMovieEnginePhysicalIcpController`, Zulu's gains):
   *
   * - Its proportional law, the pivot xi_d - xi_d' / omega + (1 + K_p) e, gives
   *   e(t) = e0 e^(-omega K_p t) along and across the plan's motion, split at
   *   each piece's start, a plan at rest taking the across gain both ways.
   * - Its centre-of-pressure constraint: while that pivot lies outside the support,
   *   the program holds it on the support, the projection of the unconstrained
   *   one taken as the piece starts, and xi(t) = cmp + (xi0 - cmp) e^(omega t)
   *   (`CapturePointTools.computeDesiredCapturePointPosition`) until the
   *   unconstrained pivot comes back inside, found in closed form where xi_d has
   *   a constant pivot, its path then a line; over a cubic it is held to the
   *   cubic's end.
   *
   * The centre of mass follows c' = omega (xi - c) in closed form on each piece:
   * a constant pivot's response (`CoMIntegrationTools
   * .integrateCoMPositionWithConstantCMP`), a cubic's
   * (`integrateCoMPositionOverPolynomial`), and an error term b e^(-lambda t)'s,
   * b omega / (omega - lambda) e^(-lambda t), with the homogeneous e^(-omega t)
   * term carrying the piece's initial value. The ground's reaction is the
   * pendulum's: m omega^2 (c - cmp) across the floor and the weight up, at the
   * pivot, shared between two planted feet by the pivot's place along the line
   * between them.
   *
   * A swing foot follows the planner's velocity-constrained cubic to its footstep
   * at rest (`AutoMovieEnginePhysicalIcpPlannerTools.cubic`), on the floor as the recovery
   * step's clearance is zero.
   *
   * Points are world floor points (x, z), metres; times local seconds.
   *
   * @param input The state just after the first push and the pushes after it.
   * @returns The prepared span.
   */
  export function prepareDisturbanceSpan(input: AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanInput): AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanResult {
    return preparePhysicalDisturbanceSpanImplementation(input);
  }

}
