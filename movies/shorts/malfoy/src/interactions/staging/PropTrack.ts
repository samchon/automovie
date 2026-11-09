import type { IAutoMovieSchedule } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { BodyFrame } from "../../laws/body/BodyFrame";
import { EverydayLaw } from "../../laws/everyday/EverydayLaw";
import { BroomLaw } from "../../laws/flight/BroomLaw";
import { StageAction } from "../../laws/staging/StageAction";
import type { IStageWorld } from "./IStageWorld";

/**
 * Where every prop is over the film, decided from the schedule by the
 * ownership rule: a prop rests where it was placed, rides the hand that holds
 * it, passes to a receiver only when the receiver's grip closed before the
 * giver's release, otherwise falls (a sheet flutters at 1.5 s per metre); it
 * glides when launched until a catch closes on it; it rests where it was put
 * down. Forms and fill change at their actions' contacts: a crane opens
 * halfway, opens fully and folds once; tea goes down a sip at a time.
 *
 * ```ts
 * const props = PropTrack.resolve(world, schedule);
 * props.owner("note", 40); // "harry", or null when it lies on the paving
 * ```
 *
 * @evidence docs/research/everyday/handover.md#ownership Ownership passes only when the receiver closes before the giver opens.
 * @evidence docs/research/everyday/handover.md#dropped A sheet falls 1 m in 1.2-1.8 s and lies flat.
 * @evidence docs/research/everyday/handover.md#crane The crane glides at 1.0-1.5 m/s until a hand closes on it.
 * @evidence docs/body/settings/props/paper-crane.md#stages Crane, half, open, folded.
 * @evidence docs/body/settings/props/tea-cups.md#tea-level The tea drops only when someone drinks.
 * @evidence contracts/development/behaviors.md#relational-goals Ownership follows from the paired intents' contacts, not from positions.
 * @evidence contracts/development/behaviors.md#deterministic-evaluation Resolved once from the schedule; every query is pure.
 * @evidence contracts/development/implementation.md#efficient-algorithms One pass over the entries sorted by contact; a query scans that prop's few segments.
 * @evidence contracts/development/common.md#meaningful-documentation States the rules and the queries.
 */
export class PropTrack {
  private readonly segments: Map<string, PropTrack.ISegment[]> = new Map();

  private readonly forms: Map<string, { at: number; form: string }[]> = new Map();

  private readonly levels: Map<string, { from: number; to: number; level: number; start: number }[]> = new Map();

  /** Build an empty track. */
  private constructor() {}

  /**
   * Resolve every prop's track from a schedule.
   *
   * @param world The world.
   * @param schedule The resolved schedule.
   * @returns The track.
   */
  public static resolve(world: IStageWorld, schedule: IAutoMovieSchedule): PropTrack {
    const track: PropTrack = new PropTrack();
    // A prop's own intent (a path or a rest) takes no time beyond its lead, so it happens at its entry's end: its absolute start.
    const at = (e: IAutoMovieSchedule.IEntry): number => (world.props.has(e.subject) ? e.end : (e.contact ?? e.start));
    const events: IAutoMovieSchedule.IEntry[] = [...schedule.entries].sort((a, b) => at(a) - at(b) || a.index - b.index);
    const receipts: Map<string, { subject: string; hand: "left" | "right"; at: number }> = new Map();
    const push = (prop: string, segment: PropTrack.ISegment): void => {
      const list: PropTrack.ISegment[] = track.segments.get(prop) ?? [];
      const last: PropTrack.ISegment | undefined = list[list.length - 1];
      if (last) last.end = segment.start;
      list.push(segment);
      track.segments.set(prop, list);
    };
    const step = (e: IAutoMovieSchedule.IEntry): IStageWorld.IStudentStep | undefined => (e.state as IStageWorld.Step | undefined)?.kind === "student" ? (e.state as IStageWorld.IStudentStep) : undefined;
    for (const e of events) {
      const action: StageAction.Action = StageAction.read(e.intent);
      const t: number = at(e);
      const s = step(e);
      if (world.props.has(e.subject) && action.kind === "rest") {
        const point: IAutoMovieVector3 = (e.state as IStageWorld.IPropStep).point;
        push(e.subject, { kind: "rest", start: t, end: Infinity, point });
        continue;
      }
      if (world.props.has(e.subject) && action.kind === "path") {
        const route: IAutoMovieVector3[] = action.route.map((r) => ("place" in r ? world.set.places[r.place]!.point : "point" in r ? r.point : { x: 0, y: 0, z: 0 }));
        const previous = track.segments.get(e.subject)?.at(-1);
        const start: IAutoMovieVector3 | undefined = previous ? PropTrack.point(previous.kind === "held" ? { kind: "rest", start: t, end: Infinity, point: route[0]! } : previous, t) : undefined;
        push(e.subject, { kind: "path", start: t, end: Infinity, route: start ? [start, ...route] : route, speed: action.speed });
        continue;
      }
      if (!s) continue;
      switch (action.kind) {
        case "enter":
          for (const side of ["left", "right"] as const) {
            const prop: string | undefined = action.holds?.[side];
            if (prop !== undefined) push(prop, { kind: "held", start: t, end: Infinity, subject: e.subject, hand: side });
          }
          break;
        case "receive":
          receipts.set(action.prop, { subject: e.subject, hand: action.hand, at: t });
          break;
        case "catch":
          push(action.prop, { kind: "held", start: t, end: Infinity, subject: e.subject, hand: action.hand });
          break;
        case "pickUp":
          action.props.forEach((prop: string, k: number) => push(prop, { kind: "held", start: t, end: Infinity, subject: e.subject, hand: action.hands[k] ?? "right" }));
          break;
        case "release": {
          const receipt = receipts.get(action.prop);
          if (receipt !== undefined && receipt.subject !== e.subject && receipt.at <= t + 1e-9) {
            push(action.prop, { kind: "held", start: t, end: Infinity, subject: receipt.subject, hand: receipt.hand });
            receipts.delete(action.prop);
          } else push(action.prop, fall(e.subject, s, t));
          break;
        }
        case "drop":
          push(action.prop, fall(e.subject, s, t));
          break;
        case "pass": {
          const from: IAutoMovieVector3 = { x: s.from.position.x, y: s.from.position.y + 0.6, z: s.from.position.z };
          const receiver = schedule.entries.filter((r) => r.subject === action.to && r.start <= t && (r.state as IStageWorld.Step | undefined)?.kind === "student").at(-1);
          const at: IAutoMovieVector3 = receiver ? (receiver.state as IStageWorld.IStudentStep).to.position : from;
          const to: IAutoMovieVector3 = { x: at.x, y: at.y + 0.6, z: at.z };
          // A pass flies at about 12 m/s on a shallow arc: 8-15 m in 0.8-1.5 s.
          const seconds: number = Math.max(0.4, Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z) / 12);
          push(action.ball, { kind: "throw", start: t, end: Infinity, from, to, seconds });
          push(action.ball, { kind: "held", start: t + seconds, end: Infinity, subject: action.to, hand: "right" });
          break;
        }
        case "putDown":
          push(action.prop, { kind: "rest", start: t, end: Infinity, point: { ...s.point!, y: s.point!.y } });
          break;
        case "launch": {
          const from: IAutoMovieVector3 = s.to.hands.right.point ?? s.to.position;
          const toward: IAutoMovieVector3 = s.point ?? from;
          const d: number = Math.min(EverydayLaw.CRANE_RANGE, Math.hypot(toward.x - from.x, toward.z - from.z));
          const h: number = BodyFrame.headingTo(from, toward);
          const to: IAutoMovieVector3 = BodyFrame.toWorld(from, h, { forward: d, left: 0, up: 0 });
          push(action.prop, { kind: "glide", start: t, end: Infinity, from, to, speed: EverydayLaw.CRANE_SPEED });
          break;
        }
        case "unfold":
          track.form(action.prop, t, action.until === "half" ? "half" : "open");
          break;
        case "fold":
          track.form(action.prop, t, "folded");
          break;
        case "drink": {
          const list = track.levels.get(action.prop) ?? [];
          const level: number = list.length === 0 ? 1 : list[list.length - 1]!.level;
          list.push({ start: t, from: level, to: Math.max(0, level - 0.3), level: Math.max(0, level - 0.3) });
          track.levels.set(action.prop, list);
          break;
        }
        case "bend":
        case "cast":
        case "deflect":
        case "drawBack":
        case "escort":
        case "fail":
        case "fly":
        case "footwork":
        case "giveRoom":
        case "grip":
        case "guard":
        case "guide":
        case "hide":
        case "hold":
        case "hover":
        case "letGo":
        case "levitate":
        case "look":
        case "lowerHand":
        case "mount":
        case "offer":
        case "offerRear":
        case "openPalm":
        case "parry":
        case "path":
        case "pocket":
        case "pushGlasses":
        case "raise":
        case "reach":
        case "reachAfter":
        case "read":
        case "rest":
        case "rise":
        case "run":
        case "say":
        case "scene":
        case "shield":
        case "shift":
        case "shot":
        case "sit":
        case "slip":
        case "step":
        case "stopPlay":
        case "straighten":
        case "strike":
        case "swingArm":
        case "touchForehead":
        case "liftChin":
        case "transfer":
        case "turn":
        case "turnUnder":
        case "until":
        case "walk":
        case "wand":
        case "withdraw":
          break;
      }
    }
    return track;

    function fall(subject: string, s: IStageWorld.IStudentStep, t: number): PropTrack.ISegment {
      const hand: IAutoMovieVector3 = s.from.hands.right.point ?? BodyFrame.toWorld(s.from.position, s.from.heading, { forward: 0.25, left: -0.2, up: 0.8 });
      const height: number = Math.max(0.05, hand.y);
      const drift: IAutoMovieVector3 = BodyFrame.forward(s.from.heading);
      void subject;
      return {
        kind: "fall",
        start: t,
        end: Infinity,
        from: hand,
        to: { x: hand.x + drift.x * EverydayLaw.PAPER_DRIFT, y: 0.002, z: hand.z + drift.z * EverydayLaw.PAPER_DRIFT },
        seconds: EverydayLaw.paperFall(height),
      };
    }
  }

  /** The segment under way for a prop at a second. */
  public at(prop: string, seconds: number): PropTrack.ISegment | undefined {
    const list: PropTrack.ISegment[] | undefined = this.segments.get(prop);
    if (!list) return undefined;
    let found: PropTrack.ISegment | undefined;
    for (const s of list) if (s.start <= seconds + 1e-9) found = s;
    return found;
  }

  /** Who holds a prop at a second, or null when nobody does. */
  public owner(prop: string, seconds: number): string | null {
    const s: PropTrack.ISegment | undefined = this.at(prop, seconds);
    return s?.kind === "held" ? s.subject : null;
  }

  /** The form a prop shows at a second. */
  public formAt(prop: string, seconds: number, initial: string): string {
    let form: string = initial;
    for (const f of this.forms.get(prop) ?? []) if (f.at <= seconds) form = f.form;
    return form;
  }

  /** The fill share of a cup at a second. */
  public levelAt(prop: string, seconds: number): number {
    let level: number = 1;
    for (const l of this.levels.get(prop) ?? [])
      if (l.start <= seconds) level = seconds >= l.start + 0.8 ? l.to : l.from + (l.to - l.from) * ((seconds - l.start) / 0.8);
    return level;
  }

  /**
   * A free prop's world point at a second: resting, falling or gliding.
   *
   * @param segment A segment that is not held.
   * @param seconds Film seconds.
   * @returns World metres.
   */
  public static point(segment: Exclude<PropTrack.ISegment, PropTrack.IHeld>, seconds: number): IAutoMovieVector3 {
    if (segment.kind === "rest") return segment.point;
    if (segment.kind === "path") {
      const path = BroomLaw.path(segment.route);
      const s: number = (seconds - segment.start) * segment.speed;
      const end: IAutoMovieVector3 = path.at(Math.min(path.length, s));
      // A ball at the route's end hovers with a small bob.
      return s <= path.length ? end : { ...end, y: end.y + 0.15 * Math.sin(3 * (seconds - segment.start)) };
    }
    if (segment.kind === "throw") {
      const k: number = Math.min(1, (seconds - segment.start) / segment.seconds);
      return { x: segment.from.x + (segment.to.x - segment.from.x) * k, y: segment.from.y + (segment.to.y - segment.from.y) * k + 1.2 * Math.sin(Math.PI * k), z: segment.from.z + (segment.to.z - segment.from.z) * k };
    }
    if (segment.kind === "fall") {
      const k: number = Math.min(1, (seconds - segment.start) / segment.seconds);
      const sway: number = 0.08 * Math.sin(k * Math.PI * 3) * (1 - k);
      return { x: segment.from.x + (segment.to.x - segment.from.x) * k + sway, y: segment.from.y + (segment.to.y - segment.from.y) * k, z: segment.from.z + (segment.to.z - segment.from.z) * k };
    }
    const d: number = Math.hypot(segment.to.x - segment.from.x, segment.to.z - segment.from.z);
    const k: number = d < 1e-6 ? 1 : Math.min(1, ((seconds - segment.start) * segment.speed) / d);
    const settle: number = k >= 1 ? Math.min(1, (seconds - segment.start - d / segment.speed) / 1.0) : 0;
    return {
      x: segment.from.x + (segment.to.x - segment.from.x) * k,
      y: segment.from.y * (1 - settle) + 0.03 * settle,
      z: segment.from.z + (segment.to.z - segment.from.z) * k,
    };
  }

  private form(prop: string, at: number, form: string): void {
    const list = this.forms.get(prop) ?? [];
    list.push({ at, form });
    this.forms.set(prop, list);
  }
}
export namespace PropTrack {
  /** Resting at a point. */
  export interface IRest {
    kind: "rest";
    start: number;
    end: number;
    point: IAutoMovieVector3;
  }

  /** Held in a hand. */
  export interface IHeld {
    kind: "held";
    start: number;
    end: number;
    subject: string;
    hand: "left" | "right";
  }

  /** Falling from a hand. */
  export interface IFall {
    kind: "fall";
    start: number;
    end: number;
    from: IAutoMovieVector3;
    to: IAutoMovieVector3;
    seconds: number;
  }

  /** Gliding after a launch. */
  export interface IGlide {
    kind: "glide";
    start: number;
    end: number;
    from: IAutoMovieVector3;
    to: IAutoMovieVector3;
    speed: number;
  }

  /** Flying a route at a speed. */
  export interface IPath {
    kind: "path";
    start: number;
    end: number;
    route: IAutoMovieVector3[];
    speed: number;
  }

  /** Thrown from one point to another. */
  export interface IThrow {
    kind: "throw";
    start: number;
    end: number;
    from: IAutoMovieVector3;
    to: IAutoMovieVector3;
    seconds: number;
  }

  /** Any segment. */
  export type ISegment = IRest | IHeld | IFall | IGlide | IPath | IThrow;
}
