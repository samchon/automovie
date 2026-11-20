import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
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
  }

  /**
   * Read a stance from the admitted course and its gait clock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Connects actual touchdown phase and hoof duty to the route's signed stance advance.
   * @evidence contracts/development/implementation.md#principled-implementation Read native body states at touchdown and separately at release. A rein-back keeps at least one diagonal down.
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
  ): (
    at: number,
    stride: QuadrupedGait.IStride & { reinBack?: true },
    fore: boolean,
  ) => IStance {
    return (
      at: number,
      stride: QuadrupedGait.IStride & { reinBack?: true },
      fore: boolean,
    ): IStance => {
      const seconds: number = secondsAt(at);
      const landed: ArchetypeCourse.IState = plan.at(seconds);
      const timing: QuadrupedGait.ITiming = clock.timing(stride.gait, seconds);
      const observed: number = fore
        ? timing.duty
        : (timing.hindDuty ?? timing.duty);
      const duty: number = stride.reinBack ? Math.max(0.5, observed) : observed;
      return {
        duty,
        landed,
        travel: plan.at(secondsAt(at + duty)).progress - landed.progress,
      };
    };
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
  ): Pick<QuadrupedRidePose.IGoal, "x" | "z" | "orientation" | "surface"> {
    if (!worldAnchors && footing === undefined)
      return {
        z:
          rest.z +
          (to === undefined
            ? from.travel / 2 - (state.progress - from.landed.progress)
            : -from.travel / 2 + ((from.travel + to.travel) / 2) * amount),
      };
    const foot: IAutoMovieVector3 = anchor(rest, from);
    const landed: IAutoMovieQuaternion = from.landed.placement.rotation;
    const oldGround: QuadrupedFooting.ILanding | undefined = footing?.landing(
      foot,
      landed,
    );
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      state.placement.rotation,
    );
    const nextFoot: IAutoMovieVector3 | undefined =
      to === undefined ? undefined : anchor(rest, to);
    const nextGround: QuadrupedFooting.ILanding | undefined =
      nextFoot === undefined
        ? undefined
        : footing?.landing(nextFoot, to!.landed.placement.rotation);
    const beginning: IAutoMovieVector3 = oldGround?.point ?? foot;
    const world: IAutoMovieVector3 =
      nextFoot === undefined
        ? beginning
        : Vector3.lerp(beginning, nextGround?.point ?? nextFoot, amount);
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

  /** Centre a physical hoof around its stance using the admitted signed advance. */
  function anchor(
    rest: IAutoMovieVector3,
    support: IStance,
  ): IAutoMovieVector3 {
    return ArchetypeFrame.point(support.landed.placement, {
      x: rest.x,
      y: 0,
      z: rest.z + support.travel / 2,
    });
  }
}
