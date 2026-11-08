import {
  type IAutoMovieIntent,
  type IAutoMovieSchedule,
  checkAutoMovieLegality,
  resolveAutoMovieOutcome,
  resolveAutoMovieSchedule,
  resolveAutoMovieZone,
} from "@automovie/engine";

import type { Fighter } from "../../entities/cast/fighter/Fighter";
import { KickboxingAction } from "../../laws/kickboxing/KickboxingAction";
import { KickboxingLegality } from "../../laws/kickboxing/KickboxingLegality";
import { KickboxingOutcome } from "../../laws/kickboxing/KickboxingOutcome";
import { KickboxingRange } from "../../laws/kickboxing/KickboxingRange";
import { KickboxingTiming } from "../../laws/kickboxing/KickboxingTiming";
import { RingFootwork } from "../../laws/kickboxing/RingFootwork";
import { StanceShape } from "../../laws/kickboxing/StanceShape";
import { KnockdownCount } from "../../laws/officiating/KnockdownCount";
import { RefereePosition } from "../../laws/officiating/RefereePosition";
import type { IRingCast } from "./IRingCast";
import { boutTiming } from "./boutTiming";

/**
 * The bout's schedule laws for the engine's resolver: timing from the
 * timing laws, each answer's outcome from the outcome table, and each
 * fighter's stance origin after every movement from the footwork law,
 * relative to the opponent's origin at the movement's start. The state is
 * the explicit snapshot every later second reads; nothing is integrated
 * during playback.
 *
 * ```ts
 * const schedule = BoutLaws.resolve(cast, composition);
 * BoutLaws.origin(schedule, "a", 12.5); // A's stance origin then
 * ```
 *
 * @evidence docs/research/kickboxing/exchanges.md#outcomes The outcome of each answer.
 * @evidence docs/research/kickboxing/ring-generalship.md#movements Movements relative to the opponent and ropes.
 * @evidence docs/research/officiating/referee.md#knockdown The farthest neutral corner from the fallen fighter.
 * @evidence docs/body/settings/sets/ring.md#corners Fighters start near centre on their own sides.
 */
export namespace BoutLaws {
  /** A fighter's state after an entry. */
  export interface IState {
    /** His stance origin on the floor. */
    origin: RingFootwork.IPoint;
  }

  /**
   * Resolve a bout composition.
   *
   * @param cast The cast.
   * @param composition The film's composition.
   * @returns The frozen schedule.
   */
  export function resolve(
    cast: IRingCast,
    composition: Parameters<typeof resolveAutoMovieSchedule>[0],
  ): IAutoMovieSchedule {
    const start: Record<string, RingFootwork.IPoint> = initial(cast);
    return resolveAutoMovieSchedule(composition, {
      timing: boutTiming,
      outcome: (entry: IAutoMovieSchedule.IEntry): string | undefined => {
        if (entry.intent.capability !== "answer") return undefined;
        const action: KickboxingAction.IAction = KickboxingAction.read(
          entry.intent,
        );
        if (action.kind !== "answer") return undefined;
        const strike: IAutoMovieIntent = KickboxingAction.intent("attacker", {
          kind: "strike",
          technique: action.against,
        });
        return resolveAutoMovieOutcome(KickboxingOutcome.table, [
          strike,
          entry.intent,
        ]).outcome;
      },
      state: (
        entry: IAutoMovieSchedule.IEntry,
        context: resolveAutoMovieSchedule.IContext,
      ): IState | undefined => {
        if (entry.intent.capability !== "move") return undefined;
        const action: KickboxingAction.IAction = KickboxingAction.read(
          entry.intent,
        );
        if (action.kind !== "move") return undefined;
        const mover: Fighter = fighter(cast, entry.subject);
        const opponent: Fighter = mover === cast.a ? cast.b : cast.a;
        const from: RingFootwork.IPoint =
          latest(context.entries, mover.id, entry.start) ?? start[mover.id]!;
        const against: RingFootwork.IPoint =
          latest(context.entries, opponent.id, entry.start) ??
          start[opponent.id]!;
        // Walking to the corner and the victory steps are ordinary walking at a
        // comfortable speed, not the fighting stance's short steps.
        const walking: boolean =
          action.movement === "corner" || action.movement === "celebrate";
        const ring: RingFootwork.IRing = {
          half: cast.ring.half,
          margin: StanceShape.margin(mover.body.measure),
          step: walking
            ? RefereePosition.SPEED * KickboxingTiming.STEP_PERIOD
            : StanceShape.step(mover.body.measure),
        };
        const target: RingFootwork.IPoint | undefined =
          action.movement === "corner"
            ? floor(KnockdownCount.corner(corners(cast), against))
            : action.movement === "celebrate"
              ? floor(
                  resolveAutoMovieZone(
                    cast.ring.zones,
                    `${mover.profile.corner}-corner`,
                  ),
                )
              : undefined;
        return {
          origin: RingFootwork.move(action, from, against, ring, target),
        };
      },
    });
  }

  /**
   * The legality violations of a resolved schedule under the bout's rules.
   *
   * @param schedule The schedule.
   * @returns One text per violation; empty when legal.
   */
  export function check(schedule: IAutoMovieSchedule): string[] {
    return checkAutoMovieLegality(schedule, KickboxingLegality.rules).map(
      (v) => `${v.rule}: ${v.detail}`,
    );
  }

  /**
   * A fighter's stance origin at a second: the end state of his last ended
   * movement, or the movement in progress interpolated along its path.
   *
   * @param schedule The resolved schedule.
   * @param subject The fighter's id.
   * @param seconds Film seconds.
   * @param cast The cast, for starting origins.
   * @returns His origin and, during a movement, its entry and progress.
   */
  export function origin(
    schedule: IAutoMovieSchedule,
    subject: string,
    seconds: number,
    cast: IRingCast,
  ): {
    point: RingFootwork.IPoint;
    moving?: {
      entry: IAutoMovieSchedule.IEntry;
      share: number;
      from: RingFootwork.IPoint;
      about: RingFootwork.IPoint;
    };
  } {
    const start: Record<string, RingFootwork.IPoint> = initial(cast);
    let before: RingFootwork.IPoint = start[subject]!;
    for (const entry of schedule.entries) {
      if (entry.subject !== subject || entry.state === undefined) continue;
      if (entry.end <= seconds) {
        before = (entry.state as IState).origin;
        continue;
      }
      if (entry.start <= seconds) {
        const action: KickboxingAction.IAction = KickboxingAction.read(
          entry.intent,
        );
        if (action.kind !== "move") break;
        const opponent: string = subject === cast.a.id ? cast.b.id : cast.a.id;
        const about: RingFootwork.IPoint =
          latest(schedule.entries, opponent, entry.start) ?? start[opponent]!;
        const share: number =
          (seconds - entry.start) / (entry.end - entry.start);
        // An arc between two points inside the ropes can bulge past them; the
        // fighter stays inside by his margin.
        const fighter: Fighter = subject === cast.a.id ? cast.a : cast.b;
        const limit: number =
          cast.ring.half - StanceShape.margin(fighter.body.measure);
        const p: RingFootwork.IPoint = RingFootwork.along(
          action.movement,
          before,
          (entry.state as IState).origin,
          about,
          share,
        );
        return {
          point: {
            x: Math.max(-limit, Math.min(limit, p.x)),
            z: Math.max(-limit, Math.min(limit, p.z)),
          },
          moving: { entry, share, from: before, about },
        };
      }
      break;
    }
    return { point: before };
  }

  /**
   * The starting origins: both fighters at kicking distance about the
   * centre, A on the red side (toward -x) and B on the cyan side.
   *
   * @param cast The cast.
   * @returns Origins by subject id.
   */
  export function initial(
    cast: IRingCast,
  ): Record<string, RingFootwork.IPoint> {
    const distance: number = kicking(cast);
    return {
      [cast.a.id]: { x: -distance / 2, z: 0 },
      [cast.b.id]: { x: distance / 2, z: 0 },
    };
  }

  /**
   * Kicking distance: the range of the longest kick, the teep, where both fighters reset between exchanges.
   *
   * @param cast The cast.
   * @returns Metres.
   */
  export function kicking(cast: IRingCast): number {
    return KickboxingRange.of(cast.a.body.measure, cast.b.body.measure, "teep");
  }

  function fighter(cast: IRingCast, id: string): Fighter {
    if (id === cast.a.id) return cast.a;
    if (id === cast.b.id) return cast.b;
    throw new Error(`Unknown fighter ${id}`);
  }

  function latest(
    entries: readonly IAutoMovieSchedule.IEntry[],
    subject: string,
    seconds: number,
  ): RingFootwork.IPoint | undefined {
    let found: IAutoMovieSchedule.IEntry | undefined;
    for (const entry of entries)
      if (
        entry.subject === subject &&
        entry.state !== undefined &&
        entry.end <= seconds + 1e-9 &&
        (found === undefined || entry.end >= found.end)
      )
        found = entry;
    return found ? (found.state as IState).origin : undefined;
  }

  function corners(
    cast: IRingCast,
  ): [RingFootwork.IPoint, RingFootwork.IPoint] {
    return [
      floor(
        resolveAutoMovieZone(cast.ring.zones, "neutral-corners", "north-east"),
      ),
      floor(
        resolveAutoMovieZone(cast.ring.zones, "neutral-corners", "south-west"),
      ),
    ];
  }

  function floor(p: { x: number; z: number }): RingFootwork.IPoint {
    return { x: p.x, z: p.z };
  }
}
