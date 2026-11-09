import {
  checkAutoMovieLegality,
  resolveAutoMovieOutcome,
  resolveAutoMovieSchedule,
  resolveAutoMovieZone,
  type IAutoMovieIntent,
  type IAutoMovieSchedule,
} from "@automovie/engine";

import type { Fighter } from "../../entities/cast/fighter/Fighter";
import { KickboxingAction } from "../../laws/kickboxing/KickboxingAction";
import { KickboxingLegality } from "../../laws/kickboxing/KickboxingLegality";
import { KickboxingOutcome } from "../../laws/kickboxing/KickboxingOutcome";
import { KickboxingRange } from "../../laws/kickboxing/KickboxingRange";
import { KickboxingTiming } from "../../laws/kickboxing/KickboxingTiming";
import { KickboxingVariation } from "../../laws/kickboxing/KickboxingVariation";
import { KnockdownShape } from "../../laws/kickboxing/KnockdownShape";
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
 * relative to the opponent's origin at the movement's start, and each
 * strike's, answer's and step-in's seeded variation from the film seed and
 * the entry's stable anchor. The state is the explicit snapshot every later
 * second reads; nothing is integrated during playback.
 *
 * ```ts
 * const schedule = BoutLaws.resolve(cast, composition, "kickboxing");
 * BoutLaws.origin(schedule, "a", 12.5); // A's stance origin then
 * ```
 *
 * @evidence docs/research/kickboxing/exchanges.md#outcomes The outcome of each answer.
 * @evidence docs/research/kickboxing/ring-generalship.md#movements Movements relative to the opponent and ropes.
 * @evidence docs/research/officiating/referee.md#knockdown The farthest neutral corner from the fallen fighter.
 * @evidence docs/body/settings/sets/ring.md#corners Fighters start near centre on their own sides.
 */
export namespace BoutLaws {
  /** The state an entry leaves: a movement's stance origin, or the seeded variation of a strike or answer. */
  export interface IState {
    /** After a movement: his stance origin on the floor. */
    origin?: RingFootwork.IPoint;

    /** For a strike: its drawn contact offset and recoil. */
    strike?: KickboxingVariation.IStrike;

    /** For an answer: its drawn lateness and coverage. */
    answer?: KickboxingVariation.IAnswer;

    /** For a step-in: the drawn angle, radians, between its first direction and the straight line to where it lands. */
    angle?: number;
  }

  /**
   * Resolve a bout composition.
   *
   * @param cast The cast.
   * @param composition The film's composition.
   * @param seed The film seed every seeded variation derives from.
   * @returns The frozen schedule.
   */
  export function resolve(
    cast: IRingCast,
    composition: Parameters<typeof resolveAutoMovieSchedule>[0],
    seed: string,
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
        if (
          entry.intent.capability !== "move" &&
          entry.intent.capability !== "strike" &&
          entry.intent.capability !== "answer"
        )
          return undefined;
        const action: KickboxingAction.IAction = KickboxingAction.read(
          entry.intent,
        );
        if (action.kind === "strike")
          return {
            strike: KickboxingVariation.strike(
              seed,
              entry.intent.anchor ?? `${entry.subject}@${entry.start}`,
              action.technique,
              fighter(cast, entry.subject).body.measure,
            ),
          };
        if (action.kind === "answer")
          return {
            answer: KickboxingVariation.answer(
              seed,
              action.strike,
              action.answer,
              ready(action),
              fighter(cast, entry.subject).body.measure,
            ),
          };
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
        const walking: boolean = KickboxingTiming.walking(action.movement);
        const ring: RingFootwork.IRing = {
          half: cast.ring.half,
          margin: StanceShape.margin(mover.body.measure),
          step: walking
            ? RefereePosition.SPEED * KickboxingTiming.WALK_PERIOD
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
        const moved: RingFootwork.IPoint = RingFootwork.move(
          action,
          from,
          against,
          ring,
          target,
        );
        if (action.movement !== "approach" || entry.intent.anchor === undefined)
          return { origin: moved };
        // The step-in leaves on a line off the direct one by its drawn angle
        // and lands where the footwork law puts it, so the range never varies.
        return {
          origin: moved,
          angle: KickboxingVariation.approach(
            seed,
            entry.intent.anchor,
            mover.body.measure,
            action.range ??
              Math.hypot(moved.x - against.x, moved.z - against.z),
          ),
        };
      },
    });
  }

  /**
   * Seconds from the answered strike's launch by which an answer is
   * complete: the strike's contact, or for a habit that fires on the rising
   * knee, the kick's chamber key when that comes first.
   *
   * @param action The answer.
   * @returns Seconds from the launch.
   * @evidence docs/body/settings/cast/fighter-b.md#drops-left-arm The elbow is down by the time the knee reaches its chamber.
   */
  export function ready(
    action: Extract<KickboxingAction.IAction, { kind: "answer" }>,
  ): number {
    return action.ready === "chamber"
      ? Math.min(action.lead, KickboxingTiming.KICK_CHAMBER)
      : action.lead;
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
      const moved: RingFootwork.IPoint | undefined = (
        entry.state as IState | undefined
      )?.origin;
      if (entry.subject !== subject || moved === undefined) continue;
      if (entry.end <= seconds) {
        before = moved;
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
        const straight: RingFootwork.IPoint = RingFootwork.along(
          action.movement,
          before,
          moved,
          about,
          share,
        );
        // A step-in's drawn angle bows its path to one side: the bow's
        // tangent at the start makes that angle with the straight line.
        const angle: number = (entry.state as IState).angle ?? 0;
        const dx: number = moved.x - before.x;
        const dz: number = moved.z - before.z;
        const bow: number =
          (Math.tan(angle) / Math.PI) * Math.sin(Math.PI * share);
        const bowed: RingFootwork.IPoint = {
          x: straight.x - dz * bow,
          z: straight.z + dx * bow,
        };
        // A walk after the opponent has fallen goes around his lying body a
        // step clear of it, his feet as well as his origin.
        const lying: KnockdownShape.IFootprint | null = KickboxingTiming.walking(
          action.movement,
        )
          ? fallen(schedule, opponent, entry.start, cast)
          : null;
        const p: RingFootwork.IPoint =
          lying === null
            ? bowed
            : RefereePosition.clear(
                bowed,
                lying,
                StanceShape.step(fighter.body.measure) +
                  fighter.body.measure.hipHalfWidth +
                  fighter.body.measure.foot / 2,
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
   * The floor a fallen fighter's body covers once he has fallen before a
   * second, from his origin and facing when he fell.
   *
   * @param schedule The resolved schedule.
   * @param subject The fighter who may have fallen.
   * @param seconds The second asked about.
   * @param cast The cast.
   * @returns His lying footprint, or null when he has not fallen.
   */
  export function fallen(
    schedule: IAutoMovieSchedule,
    subject: string,
    seconds: number,
    cast: IRingCast,
  ): KnockdownShape.IFootprint | null {
    const fall: IAutoMovieSchedule.IEntry | undefined = schedule.entries.find(
      (e) => {
        if (e.subject !== subject || e.start > seconds) return false;
        if (e.intent.capability !== "phase") return false;
        const action: KickboxingAction.IAction = KickboxingAction.read(
          e.intent,
        );
        return action.kind === "phase" && action.phase === "fall";
      },
    );
    if (fall === undefined) return null;
    const down: Fighter = subject === cast.a.id ? cast.a : cast.b;
    const other: Fighter = down === cast.a ? cast.b : cast.a;
    const here: RingFootwork.IPoint = origin(
      schedule,
      subject,
      fall.start,
      cast,
    ).point;
    const there: RingFootwork.IPoint = origin(
      schedule,
      other.id,
      fall.start,
      cast,
    ).point;
    const dx: number = there.x - here.x;
    const dz: number = there.z - here.z;
    const length: number = Math.hypot(dx, dz) || 1;
    return KnockdownShape.footprint(down.body.measure, here, {
      x: dx / length,
      z: dz / length,
    });
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
        (entry.state as IState | undefined)?.origin !== undefined &&
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
