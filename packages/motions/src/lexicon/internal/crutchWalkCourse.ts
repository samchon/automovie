import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanAidWalk,
  IAutoMovieMotionHumanCrutchWalk,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";

/** World vertical. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/**
 * The crutch walk's clock and each crutch's course over its stations, shared by
 * the law's plan and the track the scene's crutch props read, so both derive
 * every crutch frame from the same stations.
 */
export namespace crutchWalkCourse {
  /**
   * The crutch's visible lift as it swings forward, metres (provisional, as the
   * aided walk's).
   */
  export const LIFT: number = 0.04;

  /**
   * The share of each station the crutches take to advance before the body
   * swings (provisional: the crutches lead, the swing follows).
   */
  export const ADVANCE: number = 1 / 3;

  /**
   * One crutch advance: when it lifts, when its tip plants, and its two floor
   * frames.
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
   */
  export interface IClock {
    /** The opening stance's seconds, a quarter of the first station's. */
    ready: number;

    /**
     * Each station's crutch advance window and its body swing's end, action
     * seconds.
     */
    stations: readonly IStationClock[];
  }

  /** One station's instants, action seconds. */
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
   * quarter of the first station, then per station the crutches' advance over
   * `ADVANCE` of its time and the body's swing over the rest.
   *
   * @param params The walk.
   * @returns The clock.
   * @throws {HumanRefusal} When there is no station, or a station is not finite
   *   or has no positive time.
   */
  export function clock(params: IAutoMovieMotionHumanCrutchWalk): IClock {
    if (params.stations.length === 0)
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
          if (!(station.seconds > 0))
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
   * A frame carried rigidly with the walker from its entry pose to a station:
   * displaced by the station's `x` and `z` and turned by its `turn` about the
   * pivot, p' = p + d + (R - I)(p - pivot).
   *
   * @param start The entry frame.
   * @param pivot The point the turn is about, world metres.
   * @param station The station, or none for the entry frame itself.
   * @returns The carried frame.
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
   * The named tip in a crutch's displayed frame, in world metres. The origin of
   * a tip-rooted crutch already names this point.
   */
  export function tipAt(
    frame: IAutoMovieRigidTransform,
    localTip?: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return localTip === undefined
      ? frame.position
      : Vector3.add(
          frame.position,
          Quaternion.rotateVector(frame.rotation, localTip),
        );
  }

  /**
   * The point a crutch turns about at each station: the walk's entry station
   * (`origin`), or the crutch's own tip on the floor when the walk gives none.
   *
   * @param start The crutch's staged frame.
   * @param params The walk.
   * @param localTip The named tip in the crutch's frame, or its origin.
   * @returns The pivot, world metres.
   */
  export function pivot(
    start: IAutoMovieRigidTransform,
    params: IAutoMovieMotionHumanCrutchWalk,
    localTip?: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return params.origin ?? tipAt(start, localTip);
  }

  /**
   * One crutch's advances over the walk, from its staged frame: each station's
   * advance moves it from the frame the station before left it in to its carry
   * to this station.
   *
   * @param start The crutch's staged frame.
   * @param params The walk.
   * @param timing The walk's clock.
   * @param localTip The named tip in the crutch's frame, or its origin.
   * @returns One advance per station.
   */
  export function advances(
    start: IAutoMovieRigidTransform,
    params: IAutoMovieMotionHumanCrutchWalk,
    timing: IClock,
    localTip?: IAutoMovieVector3,
  ): IAdvance[] {
    const centre: IAutoMovieVector3 = pivot(start, params, localTip);
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
        const blend: number = AutoMovieEngineMotionSampling.minimumJerkShare(share);
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
              LIFT * AutoMovieEngineMotionSampling.minimumJerkShare(2 * Math.min(share, 1 - share)),
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
