import { type IAutoMovieSchedule, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { Fighter } from "../../entities/cast/fighter/Fighter";
import { CelebrationShape } from "../../laws/kickboxing/CelebrationShape";
import { DefenseShape } from "../../laws/kickboxing/DefenseShape";
import type { IBoutPosture } from "../../laws/kickboxing/IBoutPosture";
import { KickboxingAction } from "../../laws/kickboxing/KickboxingAction";
import { KickboxingTechnique } from "../../laws/kickboxing/KickboxingTechnique";
import { KickboxingTiming } from "../../laws/kickboxing/KickboxingTiming";
import { KneeSupport } from "../../laws/kickboxing/KneeSupport";
import { KnockdownShape } from "../../laws/kickboxing/KnockdownShape";
import type { RingFootwork } from "../../laws/kickboxing/RingFootwork";
import { StanceShape } from "../../laws/kickboxing/StanceShape";
import { StrikeShape } from "../../laws/kickboxing/StrikeShape";
import { blendPosture } from "../../laws/kickboxing/blendPosture";
import { BoutLaws } from "./BoutLaws";
import { GuardRhythm } from "./GuardRhythm";
import type { IRingCast } from "./IRingCast";
import { PlantedFeet } from "./PlantedFeet";

/**
 * A fighter's shape-prior posture and floor frame at one second, from the
 * schedule alone: his stance origin and facing from the footwork state, his
 * planted feet from the step pattern, the guard, and the active strike,
 * answer or whole-body phase layered on it. A strike's target is the
 * receiver's actual region, given by the caller as a function of time, so
 * the performance reads the receiver's own fitted body.
 *
 * ```ts
 * FighterPosture.at(cast, schedule, "a", 12.3, (subject, region, s) => point);
 * ```
 *
 * @evidence docs/research/kickboxing/techniques.md#laws Shapes in the performer's frame, bent toward the receiver's actual region.
 * @evidence docs/research/kickboxing/ring-generalship.md#movements Origins and facing from the footwork.
 * @evidence docs/research/kickboxing/ring-generalship.md#sources Alternating steps, placed by {@link PlantedFeet}.
 * @evidence docs/research/kickboxing/techniques.md#surfaces Punches track the head until launch; kicks commit at the chamber key.
 */
export namespace FighterPosture {
  /** A posture with its floor frame. */
  export interface IPosed {
    /** The posture in his root frame. */
    posture: IBoutPosture;

    /** Floor origin, facing and planted ankle points. */
    frame: {
      origin: IAutoMovieVector3;
      facing: { x: number; z: number };
      feet: Record<"left" | "right", IAutoMovieVector3>;
    };
  }

  /** Reads a receiver region's world point at a second. */
  export type RegionReader = (
    subject: string,
    region: string,
    seconds: number,
  ) => IAutoMovieVector3;

  /**
   * The posture of a fighter at a second.
   *
   * @param cast The cast.
   * @param schedule The resolved schedule.
   * @param subject The fighter's id.
   * @param seconds Film seconds.
   * @param region Reads the opponent's region points, or null to keep strikes on their shape path.
   * @returns The posture and frame.
   */
  export function at(
    cast: IRingCast,
    schedule: IAutoMovieSchedule,
    subject: string,
    seconds: number,
    region: RegionReader | null,
  ): IPosed {
    const fighter: Fighter = subject === cast.a.id ? cast.a : cast.b;
    const opponent: Fighter = fighter === cast.a ? cast.b : cast.a;
    const measure = fighter.body.measure;
    const here = BoutLaws.origin(schedule, subject, seconds, cast);
    const there = BoutLaws.origin(schedule, opponent.id, seconds, cast);
    const fallen: IAutoMovieSchedule.IEntry | undefined = phaseEntry(
      schedule,
      subject,
      "fall",
    );
    const after: number = fallen ? fallen.start : Infinity;
    // Facing: the opponent while fighting; frozen at the fall when down; the
    // centre in the corner and while celebrating.
    const corner: boolean = movedTo(schedule, subject, seconds, [
      "corner",
      "celebrate",
    ]);
    const look: RingFootwork.IPoint =
      seconds >= after
        ? BoutLaws.origin(schedule, opponent.id, after, cast).point
        : corner
          ? { x: 0, z: 0 }
          : there.point;
    const lookFrom: RingFootwork.IPoint =
      seconds >= after
        ? BoutLaws.origin(schedule, subject, after, cast).point
        : here.point;
    const facing: { x: number; z: number } = unit({
      x: look.x - lookFrom.x,
      z: look.z - lookFrom.z,
    });
    const feet: Record<"left" | "right", IAutoMovieVector3> = PlantedFeet.at(
      fighter,
      schedule,
      here,
      facing,
      cast,
    );
    const origin: IAutoMovieVector3 = {
      x: here.point.x,
      y: 0,
      z: here.point.z,
    };
    const switching = PlantedFeet.switching(here, measure);
    const guard: IBoutPosture =
      switching === null
        ? StanceShape.guard(measure)
        : { ...StanceShape.guard(measure), yaw: switching.yaw };
    const rest: Record<"left" | "right", IAutoMovieVector3> = local(
      feet,
      origin,
      facing,
      guard.yaw,
    );
    let posture: IBoutPosture = guard;
    // The turnover rises onto a straightened support (brazilian-kick.md#law).
    let rising: boolean = false;
    for (const entry of schedule.entries) {
      if (entry.subject !== subject || entry.start > seconds) continue;
      const action = read(entry);
      if (action === null) continue;
      const t: number = seconds - entry.start;
      if (action.kind === "strike") {
        const spec: KickboxingTechnique.ISpec =
          KickboxingTechnique.table[action.technique];
        if (t > entry.end - entry.start + KickboxingTiming.HAND_RECOVERY)
          continue;
        const target: IAutoMovieVector3 | null =
          spec.shows || region === null
            ? null
            : toRoot(
                region(
                  opponent.id,
                  KickboxingTechnique.region(spec),
                  aimInstant(entry, spec, seconds),
                ),
                origin,
                facing,
                guard.yaw,
              );
        const clinch: IAutoMovieVector3 | undefined =
          spec.family === "knee" && region !== null
            ? toRoot(
                region(opponent.id, "head-back", seconds),
                origin,
                facing,
                guard.yaw,
              )
            : undefined;
        const drawn = (entry.state as BoutLaws.IState | undefined)?.strike;
        const struck: IBoutPosture | null = StrikeShape.posture({
          measure,
          guard,
          rest,
          spec,
          ...(action.follows ? { follows: action.follows } : {}),
          seconds: t,
          target,
          ...(clinch ? { clinch } : {}),
          ...(drawn ? { recoil: drawn.recoil } : {}),
          hold: fighter.lingers(
            action.technique,
            answered(schedule, entry.intent.anchor) ?? "",
          ),
        });
        if (struck) {
          posture = merge(posture, struck, guard, rest);
          rising ||= spec.line === "descending";
        }
      } else if (action.kind === "answer") {
        if (seconds >= entry.end) continue;
        const scale: number = action.answer === "take" ? REACTION_SCALE : 1;
        const drawn = (entry.state as BoutLaws.IState | undefined)?.answer;
        const shaped: IBoutPosture | null = DefenseShape.posture({
          measure,
          guard,
          rest,
          answer: action.answer,
          attack: action.against,
          lead: action.lead,
          seconds: t,
          scale,
          onset: drawn?.lateness ?? 0,
          ready: BoutLaws.ready(action),
          coverage: drawn?.coverage ?? 1,
        });
        if (shaped) posture = merge(posture, shaped, guard, rest);
      } else if (action.kind === "touch") {
        if (seconds >= entry.end) continue;
        const reach: number = Math.min(
          1,
          t / action.reach,
          Math.max(0, (action.seconds - t) / (action.seconds - action.reach)),
        );
        const glove: IAutoMovieVector3 = {
          x: measure.armReach * 0.8,
          y: measure.shoulder - guard.drop,
          z: measure.hipHalfWidth,
        };
        posture = blendPosture(
          posture,
          { ...posture, hands: { ...posture.hands, left: { point: glove } } },
          reach,
          rest,
        );
      } else if (action.kind === "phase") {
        // He falls from the posture the blow caught him in.
        if (action.phase === "fall")
          posture = KnockdownShape.fall(measure, posture, rest, t);
        else if (action.phase === "lie" && seconds < entry.end)
          posture = KnockdownShape.lying(measure, guard);
        else if (action.phase === "attempt" && seconds < entry.end)
          posture = KnockdownShape.attempt(
            measure,
            KnockdownShape.lying(measure, guard),
            rest,
            t / action.seconds,
            ATTEMPT_EFFORT,
          );
        else if (action.phase === "victory")
          posture = CelebrationShape.posture(measure, guard, t);
      }
    }
    // Between busy actions the guard keeps its rhythm.
    if (seconds < after && !corner)
      posture = GuardRhythm.apply(posture, measure, schedule, subject, seconds);
    // Standing, the supporting knees keep their least bend: both in the
    // fighting stance; at least one upright in the corner and the
    // celebration, and the support knee under a raised kicking or checking
    // leg, which itself carries no weight. The fall is exempt.
    if (seconds < after && !rising) {
      const raised: boolean =
        posture.feet.left !== null || posture.feet.right !== null;
      const upright: boolean =
        raised || corner || movedTo(schedule, subject, seconds, ["celebrate"]);
      // The planted feet in the root frame of the final body turn. A foot
      // swinging through a step counts at the floor, so the stance's sink is
      // kept while moving and the stepping leg never reaches out straight.
      const turn: number = posture.yaw - guard.yaw;
      const c: number = Math.cos(turn);
      const s: number = Math.sin(turn);
      const planted = (side: "left" | "right"): IAutoMovieVector3 | null =>
        posture.feet[side] !== null
          ? null
          : {
              x: rest[side].x * c - rest[side].z * s,
              y: Math.min(rest[side].y, measure.ankle),
              z: rest[side].x * s + rest[side].z * c,
            };
      posture = {
        ...posture,
        drop: Math.max(
          posture.drop,
          KneeSupport.drop(
            measure,
            KneeSupport.legs(
              measure,
              { left: planted("left"), right: planted("right") },
              posture.shift,
            ),
            // A kick's support knee keeps the upright floor, the turnover's
            // rise onto a straightened support excepted; standing upright
            // takes the weight at the loading-response bend.
            raised
              ? KneeSupport.UPRIGHT
              : upright
                ? KneeSupport.LOADED
                : KneeSupport.STANCE,
            upright ? "one" : "both",
          ),
        ),
      };
    }
    return { posture, frame: { origin, facing, feet } };
  }

  /** Strength of a landed blow's reaction: the full studied reaction (no variation is drawn here). */
  const REACTION_SCALE: number = 1;

  /** Height of an attempt to rise, as a share of the studied push. */
  const ATTEMPT_EFFORT: number = 1;

  /** The instant a strike's target is read: its launch, its chamber key, or now once committed. */
  function aimInstant(
    entry: IAutoMovieSchedule.IEntry,
    spec: KickboxingTechnique.ISpec,
    seconds: number,
  ): number {
    const commit: number =
      spec.aim === "launch"
        ? entry.start
        : entry.start + KickboxingTiming.KICK_CHAMBER;
    return Math.min(seconds, commit);
  }

  /**
   * Layer a shape over the posture so far. Each layer is a full posture
   * over the guard, so its difference from the guard is added: a kick
   * launched while a punch still recovers keeps its whole shape, and two
   * answers on one limb cross-fade as one returns and the other engages.
   */
  function merge(
    current: IBoutPosture,
    layer: IBoutPosture,
    guard: IBoutPosture,
    rest: Record<"left" | "right", IAutoMovieVector3>,
  ): IBoutPosture {
    if (current === guard) return layer;
    const n = (c: number, l: number, g: number): number => c + l - g;
    const record = <T extends Record<string, number>>(c: T, l: T, g: T): T =>
      Object.fromEntries(
        Object.keys(c).map((key: string): [string, number] => [
          key,
          n(c[key]!, l[key]!, g[key]!),
        ]),
      ) as T;
    const point = (
      c: IAutoMovieVector3,
      l: IAutoMovieVector3,
      g: IAutoMovieVector3,
    ): IAutoMovieVector3 => Vector3.add(c, Vector3.subtract(l, g));
    const hand = (side: "left" | "right"): IBoutPosture["hands"]["left"] => {
      const c = current.hands[side];
      const l = layer.hands[side];
      const g = guard.hands[side];
      const elbow: IAutoMovieVector3 | undefined =
        c.elbow && l.elbow && g.elbow
          ? point(c.elbow, l.elbow, g.elbow)
          : (l.elbow ?? c.elbow);
      return {
        point: point(c.point, l.point, g.point),
        ...(elbow ? { elbow } : {}),
      };
    };
    const foot = (side: "left" | "right"): IBoutPosture["feet"]["left"] => {
      const c = current.feet[side];
      const l = layer.feet[side];
      if (l === null) return c;
      if (c === null) return l;
      const knee: IAutoMovieVector3 | undefined = l.knee ?? c.knee;
      return {
        point: point(c.point, l.point, rest[side]),
        ...(knee ? { knee } : {}),
      };
    };
    return {
      drop: n(current.drop, layer.drop, guard.drop),
      shift: record(current.shift, layer.shift, guard.shift),
      yaw: n(current.yaw, layer.yaw, guard.yaw),
      pitch: n(current.pitch, layer.pitch, guard.pitch),
      roll: n(current.roll, layer.roll, guard.roll),
      pelvis: record(current.pelvis, layer.pelvis, guard.pelvis),
      thoracic: record(current.thoracic, layer.thoracic, guard.thoracic),
      lumbar: record(current.lumbar, layer.lumbar, guard.lumbar),
      cervical: record(current.cervical, layer.cervical, guard.cervical),
      hands: { left: hand("left"), right: hand("right") },
      feet: { left: foot("left"), right: foot("right") },
      pivot: n(current.pivot, layer.pivot, guard.pivot),
      jaw: n(current.jaw, layer.jaw, guard.jaw),
      wince: n(current.wince, layer.wince, guard.wince),
    };
  }

  function read(
    entry: IAutoMovieSchedule.IEntry,
  ): KickboxingAction.IAction | null {
    if (
      entry.intent.capability === "signal" ||
      entry.intent.capability === "ring" ||
      entry.intent.capability === "frame"
    )
      return null;
    return KickboxingAction.read(entry.intent);
  }

  /** The outcome of the answer to a strike anchor. */
  function answered(
    schedule: IAutoMovieSchedule,
    anchor: string | undefined,
  ): string | undefined {
    if (anchor === undefined) return undefined;
    return schedule.entries.find((e) => {
      if (e.intent.capability !== "answer") return false;
      const action = KickboxingAction.read(e.intent);
      return action.kind === "answer" && action.strike === anchor;
    })?.outcome;
  }

  function phaseEntry(
    schedule: IAutoMovieSchedule,
    subject: string,
    phase: string,
  ): IAutoMovieSchedule.IEntry | undefined {
    return schedule.entries.find((e) => {
      if (e.subject !== subject || e.intent.capability !== "phase")
        return false;
      const action = KickboxingAction.read(e.intent);
      return action.kind === "phase" && action.phase === phase;
    });
  }

  function movedTo(
    schedule: IAutoMovieSchedule,
    subject: string,
    seconds: number,
    movements: string[],
  ): boolean {
    return schedule.entries.some((e) => {
      if (
        e.subject !== subject ||
        e.start > seconds ||
        e.intent.capability !== "move"
      )
        return false;
      const action = KickboxingAction.read(e.intent);
      return (
        action.kind === "move" &&
        movements.includes(action.movement) &&
        e.start + (e.end - e.start) * 0.5 <= seconds
      );
    });
  }

  /** World points into the posture's root frame (after the posture yaw). */
  function local(
    feet: Record<"left" | "right", IAutoMovieVector3>,
    origin: IAutoMovieVector3,
    facing: { x: number; z: number },
    yaw: number,
  ): Record<"left" | "right", IAutoMovieVector3> {
    return {
      left: toRoot(feet.left, origin, facing, yaw),
      right: toRoot(feet.right, origin, facing, yaw),
    };
  }

  /** A world point in the root frame of a fighter at an origin, facing and posture yaw. */
  function toRoot(
    p: IAutoMovieVector3,
    origin: IAutoMovieVector3,
    facing: { x: number; z: number },
    yaw: number,
  ): IAutoMovieVector3 {
    const heading: number = Math.atan2(-facing.z, facing.x) + yaw;
    const dx: number = p.x - origin.x;
    const dz: number = p.z - origin.z;
    // Inverse of a right-handed turn about +Y by `heading`.
    const c: number = Math.cos(heading);
    const s: number = Math.sin(heading);
    return { x: dx * c - dz * s, y: p.y, z: dx * s + dz * c };
  }

  function unit(v: { x: number; z: number }): { x: number; z: number } {
    const l: number = Math.hypot(v.x, v.z);
    return l === 0 ? { x: 1, z: 0 } : { x: v.x / l, z: v.z / l };
  }
}
