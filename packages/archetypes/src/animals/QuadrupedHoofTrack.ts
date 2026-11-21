import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type ArchetypeCourse,
  ArchetypeFrame,
  ArchetypeRefusal,
} from "../core";
import type { QuadrupedFooting } from "./QuadrupedFooting";
import type { QuadrupedGait } from "./QuadrupedGait";
import { QuadrupedMotion } from "./QuadrupedMotion";
import type { QuadrupedRideClock } from "./QuadrupedRideClock";
import type { QuadrupedRidePose } from "./QuadrupedRidePose";
import type { QuadrupedStridePlan } from "./QuadrupedStridePlan";

/**
 * One hoof's anchored position and orientation through a turn or grounded departure.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Owns the articulation goals derived from native landing frames and signed stance travel.
 * @evidence contracts/development/design.md#principled-representation A landed body frame, centre offset and interval determine a fixed hoof target. A following stance is present during swing only.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the ride's curved footprint path. Gait, stance timing and exact terminal geometry remain in their existing owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contact moves only during the declared swing and the model-space relative orientation uses the original landing frame.
 */
export namespace QuadrupedHoofTrack {
  /**
   * A committed stance, before it is converted into a world footprint.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the state at landing, signed stance travel and duty fraction.
   * @evidence contracts/development/design.md#principled-representation The course owns the rigid landing frame and signed metres. The gait owns the stride fraction.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The ride uses duty to distinguish stance/swing and this owner reads the geometry and signed travel.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts It stores no current body frame or previous sample.
   */
  export interface IStance {
    /** Fraction of a stride between this hoof's landing and lifting. */
    duty: number;
    /** Body state at actual touchdown, including its rigid world placement. */
    landed: ArchetypeCourse.IState;
    /** Signed metres the body travels over the entire stance. */
    travel: number;

    /** Body placement at release, read when the body heading departs from the travel heading; the hoof is then centred between its neutral points at landing and release. */
    lifted?: IAutoMovieTransform;

    /** The body-frame shift of a crossing leg's stance in a two-track figure; absent elsewhere. */
    across?: ICross;
  }

  /**
   * The sideways shift a two-track figure gives the stances of the legs away from its movement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the side and the metres.
   * @evidence contracts/development/design.md#principled-representation A body-frame lateral direction, +1 toward the body's left (+x) or -1 toward its right, and a nonnegative distance in metres; it applies to the hooves on the other side of the body.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Produced by `EquineLateral.crossing` and read by `footprint`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ICross {
    /** The body-frame side the figure moves toward: +1 for +x (left), -1 for -x (right). */
    toward: number;
    /** Metres the crossing hoof's neutral point moves toward that side, nonnegative. */
    shift: number;
  }

  /**
   * Read a stance's crossover from its landing and release seconds, its signed travel and its end.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Film seconds, metres and whether the stance is a fore's; undefined outside a two-track figure.
   * @evidence contracts/development/design.md#principled-representation A pure reader over the admitted figures.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Produced by `EquineLateral.crossing`, called by `stances`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Crossing = (
    from: number,
    to: number,
    travel: number,
    fore: boolean,
  ) => ICross | undefined;

  /**
   * The body displacement a swing spanning a hoof-clock hold is carried by, so the hoof travels with the body while the clock stands.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the world displacement and the elapsed share of the hold.
   * @evidence contracts/development/design.md#principled-representation A world vector in metres and a unitless share from zero before the hold to one after it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Supplied by the ride for the swings a jump's flight holds.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ICarry {
    /** World displacement of the body over the whole hold, metres. */
    shift: IAutoMovieVector3;
    /** Share of the hold elapsed at the sample, zero to one. */
    share: number;
  }

  /**
   * Read a stance from the admitted course and its gait clock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Connects actual touchdown phase and hoof duty to the route's signed stance advance.
   * @evidence contracts/development/implementation.md#principled-implementation Read native body states at touchdown and separately at release, and a two-track figure's crossover from the optional `crossing` reader over the same seconds and travel. A rein-back keeps at least one diagonal down.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reusable query combines phase-to-time, course distance and this gait's fore or hind duty.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Forward motion and signed reverse progress read the same route instead of synthesizing stance travel from speed.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two existing course reads and one gait timing read per queried stance.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The existing route and resolved gait supply all geometry and timing.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the tiered course and clock readers stay with the returned sampler until the ride is released.
   */
  export function stances(
    plan: ArchetypeCourse.IPlan,
    clock: QuadrupedRideClock.IClock,
    secondsAt: (phase: number) => number,
    body?: (
      state: ArchetypeCourse.IState,
      seconds: number,
    ) => IAutoMovieTransform,
    crossing?: Crossing,
  ): (
    at: number,
    stride: QuadrupedStridePlan.IStride,
    fore: boolean,
  ) => IStance {
    return (
      at: number,
      stride: QuadrupedStridePlan.IStride,
      fore: boolean,
    ): IStance => {
      const seconds: number = secondsAt(at);
      const route: ArchetypeCourse.IState = plan.at(seconds);
      const timing: QuadrupedGait.ITiming = clock.timing(stride.gait, seconds);
      const observed: number = fore
        ? timing.duty
        : (timing.hindDuty ?? timing.duty);
      const duty: number = stride.reinBack ? Math.max(0.5, observed) : observed;
      const release: number = secondsAt(at + duty);
      const travel: number = plan.at(release).progress - route.progress;
      if (body === undefined) return { duty, landed: route, travel };
      const across: ICross | undefined = crossing?.(
        seconds,
        release,
        travel,
        fore,
      );
      return {
        duty,
        landed: { ...route, placement: body(route, seconds) },
        travel,
        lifted: body(plan.at(release), release),
        ...(across === undefined ? {} : { across }),
      };
    };
  }

  /**
   * The swing height of a landmark gait: the toe raised to its coordinate along the actual neutral cannon, measured above the neutral hoof endpoint.
   *
   * @param chain The limb's actual neutral joint points, model metres, from the top joint to the hoof endpoint.
   * @param landmark The gait's landmark elevation.
   * @param fore Whether the limb is a fore.
   * @returns Metres of swing clearance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, the points and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation The cannon runs from the fetlock (chain point 3) to the carpus or hock (chain point 2); the coordinate interpolates their heights, less the hoof endpoint's.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One interpolation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The heights are the actual rig's; no withers share stands in.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function elevation(
    chain: readonly IAutoMovieVector3[],
    landmark: QuadrupedGait.IElevation,
    fore: boolean,
  ): number {
    const share: number = fore ? landmark.fore : landmark.hind;
    return chain[3]!.y + share * (chain[2]!.y - chain[3]!.y) - chain[4]!.y;
  }

  /**
   * The world point a stance plants its hoof at.
   *
   * @param rest Actual neutral hoof endpoint in model metres.
   * @param support The stance.
   * @returns The world footprint before any authored surface is applied.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame and that terrain is applied afterwards.
   * @evidence contracts/development/implementation.md#principled-implementation Centre the hoof on its stance: half the signed travel ahead of its neutral point at landing, or, when the body heading departs from the travel heading, midway between its neutral points at landing and at release, so the hoof sits under the same body point at both ends. A crossing leg of a two-track figure centres on its neutral point shifted sideways by the stance's `across`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One rigid point or the mean of two.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None; both forms read the stance's own placements.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `ArchetypeFrame.point`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function footprint(
    rest: IAutoMovieVector3,
    support: IStance,
  ): IAutoMovieVector3 {
    // A crossing leg's neutral point moves toward the figure's side; its partner, on that side, keeps its own.
    const x: number =
      support.across !== undefined &&
      Math.sign(rest.x) === -support.across.toward
        ? rest.x + support.across.toward * support.across.shift
        : rest.x;
    if (support.lifted === undefined)
      return ArchetypeFrame.point(support.landed.placement, {
        x,
        y: 0,
        z: rest.z + support.travel / 2,
      });
    const neutral: IAutoMovieVector3 = { x, y: 0, z: rest.z };
    const point: IAutoMovieVector3 = Vector3.lerp(
      ArchetypeFrame.point(support.landed.placement, neutral),
      ArchetypeFrame.point(support.lifted, neutral),
      0.5,
    );
    return { ...point, y: support.landed.placement.translation.y };
  }

  /**
   * Admit an optional stationary departure anchor at the course start.
   *
   * @param plan The owned course plan with the actual initial time and body placement.
   * @param requested The explicit flag for planting the initially neutral hooves.
   * @param archetype Owner printed in the typed course refusal.
   * @returns The initial course state for holding the actual neutral footprints, when requested.
   * @throws {ArchetypeRefusal} If the explicit flag or starting speed cannot represent standing.
   * @evidence contracts/development/common.md#meaningful-documentation Names the actual course frame and admission rule without taking ownership of route math.
   * @evidence contracts/development/implementation.md#principled-implementation Evaluate the native course at its distance-zero time so delayed starts retain the right world placement.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure An absent request exits immediately. One initial state admits the explicit request or reports its conflict.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A moving start never silently reinterprets as a standing start or moves the route mark.
   * @evidence contracts/development/implementation.md#efficient-algorithms Reads one existing course point only for requested departure.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The route owns the initial time and placement through existing queries.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only the requested state escapes. No viewer or external handle exists.
   */
  export function departure(
    plan: ArchetypeCourse.IPlan,
    requested: true | undefined,
    archetype: string,
  ): ArchetypeCourse.IState | undefined {
    if (requested === undefined) return undefined;
    const initial: ArchetypeCourse.IState = plan.at(plan.when(0));
    if (requested === true && initial.speed === 0) return initial;
    throw new ArchetypeRefusal({
      kind: "parameter",
      archetype,
      axis: "startFromStanding",
      value: requested,
      feasible: null,
      reason:
        "standing departure requires a zero-speed start and the explicit true flag",
      fix: "Specify startSpeed 0 with acceleration or omit startFromStanding.",
    });
  }

  /**
   * Read the current planted anchor or its independently sampled swing.
   *
   * @param phase Current stride coordinate, with course start at zero.
   * @param landed Previous contact phase, which can precede course start.
   * @param coming Next real contact phase.
   * @param current Predicted ordinary stance and its admitted duty.
   * @param standing Actual starting placement when the rider requests a stand.
   * @returns Chosen anchor, contact state, and normalized swing displacement/height.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes provisional earlier stance from a hooved neutral standing departure.
   * @evidence contracts/development/implementation.md#principled-implementation Replace a pre-start stance anchor by the real start footprint with no prior advance and begin that hoof swing no earlier than phase zero.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Select the start anchor and lift boundary, then evaluate the existing clearance and interpolation law on the normalized interval.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Do not move the anchored hoof by authoring a virtual step before the course.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time and storage over one stance, with no temporal search.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The existing step law owns minimum jerk and the admitted stance owns ordinary phase/travel.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources No sample or handle is retained.
   */
  export function step(
    phase: number,
    landed: number,
    coming: number,
    current: IStance,
    standing: ArchetypeCourse.IState | undefined,
  ): { from: IStance; planted: boolean; along: number; rise: number } {
    const initial: boolean = standing !== undefined && landed <= 0;
    const local: number = phase - landed;
    const liftOff: number = initial
      ? Math.max(-landed, current.duty)
      : current.duty;
    const planted: boolean = local < liftOff;
    const swing: number = planted
      ? 0
      : (local - liftOff) / (coming - landed - liftOff);
    return {
      from: initial ? { ...current, landed: standing!, travel: 0 } : current,
      planted,
      ...QuadrupedMotion.swing(swing),
    };
  }

  /**
   * Convert the fixed world footprint or world swing to the current body frame.
   *
   * @param state Current course state, including the body's world placement.
   * @param rest Actual neutral hoof endpoints in model metres.
   * @param from Last committed stance.
   * @param to The next committed stance during swing. Omitted during stance.
   * @param amount The smooth swing progression from zero to one.
   * @param worldAnchors Whether turns or a standing start require world anchoring.
   * @param footing Optional independently placed world surfaces and authored obstacles.
   * @param carry The body displacement carrying a swing through a hoof-clock hold, when the swing spans one.
   * @returns Model-space coordinates in metres. The world-anchor path also returns the relative terminal axis rotation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines frames, units and the optional next stance.
   * @evidence contracts/development/implementation.md#principled-implementation Straight signed progress gives the same distance from the half-stance-centred landing in a common basis. World-space points and frames anchor through turns, departures and terrain, then convert to current model space. A terrain landing also retains its support plane. Swing interpolates both adjacent landings.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Plan world points from landed states, optionally blend one next point/rotation, and apply the inverse current body placement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The current yaw establishes only the relative readback and cannot reorient a planted sole in the world.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work over at most two admitted stances.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses existing rigid frame, vector and quaternion arithmetic. The route and gait already own the actual touchdown states.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh footprint and retains nothing between calls.
   */
  export function target(
    state: ArchetypeCourse.IState,
    rest: IAutoMovieVector3,
    from: IStance,
    to: IStance | undefined,
    amount: number,
    worldAnchors: boolean,
    footing?: QuadrupedFooting.IPlan,
    carry?: ICarry,
  ): Pick<QuadrupedRidePose.IGoal, "x" | "z" | "orientation" | "surface"> {
    if (!worldAnchors && footing === undefined)
      return {
        z:
          rest.z +
          (to === undefined
            ? from.travel / 2 - (state.progress - from.landed.progress)
            : -from.travel / 2 + ((from.travel + to.travel) / 2) * amount),
      };
    const foot: IAutoMovieVector3 = footprint(rest, from);
    const landed: IAutoMovieQuaternion = from.landed.placement.rotation;
    const oldGround: QuadrupedFooting.ILanding | undefined = footing?.landing(
      foot,
      landed,
    );
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      state.placement.rotation,
    );
    const nextFoot: IAutoMovieVector3 | undefined =
      to === undefined ? undefined : footprint(rest, to);
    const nextGround: QuadrupedFooting.ILanding | undefined =
      nextFoot === undefined
        ? undefined
        : footing?.landing(nextFoot, to!.landed.placement.rotation);
    const beginning: IAutoMovieVector3 = oldGround?.point ?? foot;
    const arrival: IAutoMovieVector3 | undefined =
      nextFoot === undefined ? undefined : (nextGround?.point ?? nextFoot);

    // A swing the hoof clock holds is carried with the body: the hold's displacement is removed from the arrival and restored by its elapsed share.
    const world: IAutoMovieVector3 =
      arrival === undefined
        ? beginning
        : carry === undefined
          ? Vector3.lerp(beginning, arrival, amount)
          : Vector3.add(
              Vector3.lerp(
                beginning,
                Vector3.subtract(arrival, carry.shift),
                amount,
              ),
              Vector3.scale(carry.shift, carry.share),
            );
    const local: IAutoMovieVector3 = Quaternion.rotateVector(
      inverse,
      Vector3.subtract(world, state.placement.translation),
    );
    return {
      x: local.x,
      z: local.z,
      orientation: Quaternion.multiply(
        inverse,
        to === undefined
          ? (oldGround?.rotation ?? landed)
          : Quaternion.slerp(
              oldGround?.rotation ?? landed,
              nextGround?.rotation ?? to.landed.placement.rotation,
              amount,
            ),
      ),
      ...(oldGround === undefined
        ? {}
        : {
            surface: {
              point: local,
              normal: Quaternion.rotateVector(
                inverse,
                nextGround === undefined
                  ? oldGround.normal
                  : Vector3.normalize(
                      Vector3.lerp(oldGround.normal, nextGround.normal, amount),
                    ),
              ),
            },
          }),
    };
  }
}
