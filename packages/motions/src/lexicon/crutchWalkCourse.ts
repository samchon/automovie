import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanAidWalk,
  IAutoMovieMotionHumanCrutchWalk,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/** World vertical. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/**
 * The crutch walk's clock and each crutch's course over its stations, shared
 * by the law's plan and the track the scene's crutch props read, so both
 * derive every crutch frame from the same stations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the clock and the course are and who reads them.
 * @evidence contracts/development/design.md#principled-representation A clock of station instants and per-crutch advances between two floor frames.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The clock, the station carry, the advances, the frame reader and the refusal the law and its track share.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No crutch frame is authored apart from the stations.
 */
export namespace crutchWalkCourse {
  /** The crutch's visible lift as it swings forward, metres (provisional, as the aided walk's). */
  export const LIFT: number = 0.04;

  /** The share of each station the crutches take to advance before the body swings (provisional: the crutches lead, the swing follows). */
  export const ADVANCE: number = 1 / 3;

  /**
   * One crutch advance: when it lifts, when its tip plants, and its two
   * floor frames.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member, its unit and timebase.
   * @evidence contracts/development/design.md#principled-representation An advance is a timed move between two floor frames.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The fields the frame reader and the hand carry read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Both frames come from the stations.
   */
  export interface IAdvance {
    /** Lift begins, action seconds. */
    from: number;

    /** The tip plants, action seconds. */
    to: number;

    /** The floor frames before and after. */
    floor: readonly [IAutoMovieRigidTransform, IAutoMovieRigidTransform];
  }

  /**
   * The crutches' common clock: when the grip is settled and each station's
   * advance and swing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member and its timebase.
   * @evidence contracts/development/design.md#principled-representation The opening stance's length and one record of instants per station.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the plan's stances and the advances read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Every instant follows from the authored station times.
   */
  export interface IClock {
    /** The opening stance's seconds, a quarter of the first station's. */
    ready: number;

    /** Each station's crutch advance window and its body swing's end, action seconds. */
    stations: readonly IStationClock[];
  }

  /**
   * One station's instants, action seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each instant and its timebase.
   * @evidence contracts/development/design.md#principled-representation Three ordered instants of one station.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The instants the stances and advances read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Derived from the station's own seconds and `ADVANCE`.
   */
  export interface IStationClock {
    /** The crutches lift. */
    lift: number;

    /** The crutches plant. */
    plant: number;

    /** The feet land. */
    land: number;
  }

  /**
   * Refuse a crutch or route setting with its reason.
   *
   * @param axis The refused setting.
   * @param value Its value.
   * @param reason Why it is refused.
   * @returns Never; it throws.
   * @throws {HumanRefusal} Always, an affordance refusal with the staging fix.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the thrown refusal.
   * @evidence contracts/development/implementation.md#principled-implementation One affordance refusal naming the setting and the staging that fixes it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One construction shared by the clock and the plan.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is clamped or defaulted in place of the refusal.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function refuse(axis: string, value: unknown, reason: string): never {
    throw new HumanRefusal({
      kind: "affordance",
      axis,
      value,
      reason,
      fix: "stage both crutches on the floor beside the body, each with a grip and a tip, and give finite stations",
    });
  }

  /**
   * The common clock of a crutch walk's stations: an opening stance of a
   * quarter of the first station, then per station the crutches' advance
   * over `ADVANCE` of its time and the body's swing over the rest.
   *
   * @param params The walk.
   * @returns The clock.
   * @throws {HumanRefusal} When there is no station, or a station is not finite or has no positive time.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the clock's shares and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Cumulative station times split by the advance share.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the stations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A malformed station is refused, never skipped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the stations.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The plan and each track build their own clock from the same inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh clock and retains nothing.
   */
  export function clock(params: IAutoMovieMotionHumanCrutchWalk): IClock {
    if (!Array.isArray(params.stations) || params.stations.length === 0)
      return refuse("stations", 0, "a crutch walk needs at least one station");
    const ready: number = params.stations[0]!.seconds / 4;
    let t: number = ready;
    return {
      ready,
      stations: params.stations.map(
        (
          station: IAutoMovieMotionHumanAidWalk.IStation,
          i: number,
        ): IStationClock => {
          if (
            ![station.x, station.z, station.turn ?? 0, station.seconds].every(
              Number.isFinite,
            ) ||
            station.seconds <= 0
          )
            return refuse(
              "stations",
              i,
              "the station coordinates and heading must be finite and its time positive",
            );
          const at: IStationClock = {
            lift: t,
            plant: t + ADVANCE * station.seconds,
            land: t + station.seconds,
          };
          t += station.seconds;
          return at;
        },
      ),
    };
  }

  /**
   * A frame carried rigidly with the walker from its entry pose to a
   * station: displaced by the station's `x` and `z` and turned by its `turn`
   * about the pivot, p' = p + d + (R - I)(p - pivot).
   *
   * @param start The entry frame.
   * @param pivot The point the turn is about, world metres.
   * @param station The station, or none for the entry frame itself.
   * @returns The carried frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rigid carry's formula, frame and units.
   * @evidence contracts/development/implementation.md#principled-implementation A rigid motion of the plane: a yaw about the pivot and a translation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One rotation, one translation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The station's own displacement and heading, nothing approximated.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh frame and retains nothing.
   */
  export function stationed(
    start: IAutoMovieRigidTransform,
    pivot: IAutoMovieVector3,
    station: IAutoMovieMotionHumanAidWalk.IStation | undefined,
  ): IAutoMovieRigidTransform {
    if (station === undefined) return start;
    const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      UP,
      station.turn ?? 0,
    );
    return {
      position: Vector3.add(
        Vector3.add(pivot, { x: station.x, y: 0, z: station.z }),
        Quaternion.rotateVector(turn, Vector3.subtract(start.position, pivot)),
      ),
      rotation: Quaternion.multiply(turn, start.rotation),
    };
  }

  /**
   * The point a crutch turns about at each station: the walk's entry
   * station (`origin`), or the crutch's own tip on the floor when the walk
   * gives none.
   *
   * @param start The crutch's staged frame.
   * @param params The walk.
   * @returns The pivot, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both pivots and when each applies.
   * @evidence contracts/development/implementation.md#principled-implementation The walker's station is the centre a rigidly carried crutch turns about; without it only the crutch's own floor point is known.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One choice.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The tip fallback is stated as matching only a walk that never turns.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function pivot(
    start: IAutoMovieRigidTransform,
    params: IAutoMovieMotionHumanCrutchWalk,
  ): IAutoMovieVector3 {
    return params.origin ?? { ...start.position, y: 0 };
  }

  /**
   * One crutch's advances over the walk, from its staged frame: each
   * station's advance moves it from the frame the station before left it in
   * to its carry to this station.
   *
   * @param start The crutch's staged frame.
   * @param params The walk.
   * @param timing The walk's clock.
   * @returns One advance per station.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each advance joins and when.
   * @evidence contracts/development/implementation.md#principled-implementation Chained rigid carries about the walk's pivot on the shared clock.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the stations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every frame is a station carry.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the stations.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The plan and each track build their own advances from the same inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh advances and retains nothing.
   */
  export function advances(
    start: IAutoMovieRigidTransform,
    params: IAutoMovieMotionHumanCrutchWalk,
    timing: IClock,
  ): IAdvance[] {
    const centre: IAutoMovieVector3 = pivot(start, params);
    let old: IAutoMovieRigidTransform = start;
    return params.stations.map(
      (station: IAutoMovieMotionHumanAidWalk.IStation, i: number): IAdvance => {
        const next: IAutoMovieRigidTransform = stationed(
          start,
          centre,
          station,
        );
        const move: IAdvance = {
          from: timing.stations[i]!.lift,
          to: timing.stations[i]!.plant,
          floor: [old, next],
        };
        old = next;
        return move;
      },
    );
  }

  /**
   * A crutch's frame at an action second: planted, or on one minimum-jerk
   * advance between plants (Flash and Hogan 1985), lifted `LIFT` at its
   * middle.
   *
   * @param moves The crutch's advances.
   * @param start Its staged frame.
   * @param seconds Seconds since the walk's start.
   * @returns The frame, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the planted and moving cases and the lift.
   * @evidence contracts/development/implementation.md#principled-implementation A minimum-jerk blend of position and rotation with a minimum-jerk lift arc.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scan for the current advance.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Before the first advance the staged frame, between advances the last plant.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the advances up to the current one.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each read is its own second's.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh frame and retains nothing.
   */
  export function frameAt(
    moves: readonly IAdvance[],
    start: IAutoMovieRigidTransform,
    seconds: number,
  ): IAutoMovieRigidTransform {
    let stable: IAutoMovieRigidTransform = start;
    for (const move of moves) {
      if (seconds <= move.from) return stable;
      if (seconds < move.to) {
        const share: number = (seconds - move.from) / (move.to - move.from);
        const blend: number = minimumJerk.share(share);
        const position: IAutoMovieVector3 = Vector3.lerp(
          move.floor[0].position,
          move.floor[1].position,
          blend,
        );
        return {
          position: {
            ...position,
            y:
              position.y +
              LIFT * minimumJerk.share(2 * Math.min(share, 1 - share)),
          },
          rotation: Quaternion.slerp(
            move.floor[0].rotation,
            move.floor[1].rotation,
            blend,
          ),
        };
      }
      stable = move.floor[1];
    }
    return stable;
  }
}
