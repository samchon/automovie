import type { IAutoMovieVector3 } from "@automovie/interface";

import type { Student } from "../../entities/cast/student/Student";
import type { IStageProp } from "../../entities/props/IStageProp";
import type { IStageSet } from "../../entities/sets/IStageSet";
import { BodyFrame } from "../../laws/body/BodyFrame";
import { IBodyState } from "../../laws/body/IBodyState";
import { EverydayLaw } from "../../laws/everyday/EverydayLaw";
import { Gait } from "../../laws/everyday/Gait";
import type { StageAction } from "../../laws/staging/StageAction";
import type { StageContext } from "../staging/StageContext";
import { WalkRoute } from "./WalkRoute";

/**
 * The everyday actions' laws on the stage: how long each takes from the
 * state it starts in, where it ends, and which outcome the habit and
 * handover rules decide. Walks plan whole steps from the gait law to a
 * place, a person or a seat's front; seats, handover points and floor points
 * come from the set and the counterpart's placed state.
 *
 * ```ts
 * const t = EverydaySteps.time(action, from, context, student);
 * const end = EverydaySteps.end(action, from, context, student, t);
 * ```
 *
 * @evidence docs/research/everyday/walking.md#law Whole-step walks at the paces; turns in place of one or two steps; conversational 0.8-1.2 m and handing 0.5-0.9 m distances.
 * @evidence docs/research/everyday/sitting.md#law Sitting, rising and shifting durations; calves at the seat edge before sitting.
 * @evidence docs/research/everyday/handover.md#law Offer, receive, release, withdraw, drop, pick-up and the crane's glide.
 * @evidence docs/body/settings/cast/carina-malfoy.md#withdraws-first-offer The first offer of something personal to a person in a scene stops a handspan short and returns to her chest.
 * @evidence contracts/development/behaviors.md#studied-laws Every duration is the everyday law's value.
 * @evidence contracts/development/behaviors.md#relational-goals Destinations and handover points resolve from places and the counterpart's placed state.
 * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure functions of the placed entries.
 * @evidence contracts/development/common.md#meaningful-documentation States the two functions and what they read.
 */
export namespace EverydaySteps {
  /** An action's own timing from its start state. */
  export interface ITime {
    /** Seconds. */
    duration: number;

    /** Contact offset, seconds. */
    contact?: number;

    /** A walk's plan. */
    walk?: Gait.IPlan;

    /** The outcome class decided by the laws. */
    outcome?: string;

    /** A world point the action reaches. */
    point?: IAutoMovieVector3;

    /** The resolved end position and heading of a move. */
    move?: { position: IAutoMovieVector3; heading: number };

    /** A flight's route points from the start position. */
    route?: IAutoMovieVector3[];
  }



  /**
   * The timing of an everyday action.
   *
   * @param action The action.
   * @param from The student's state before it.
   * @param context The stage context.
   * @param student The student.
   * @returns Its own timing, before any absolute lead.
   */
  export function time(action: StageAction.Everyday, from: IBodyState, context: StageContext, student: Student): ITime {
    const T = EverydayLaw.TIMES;
    switch (action.kind) {
      case "enter":
        return { duration: 0 };
      case "hold":
        return { duration: action.seconds };
      case "say":
        // A line is a marker: the body goes on with its next action while the words are spoken.
        return { duration: 0 };
      case "until":
        return { duration: Math.max(0, action.seconds - context.time) };
      case "walk": {
        const pace: Gait.Pace = action.mood === "embarrassed" ? "hesitant" : action.pace;
        // A walk to a person ends where that person is on arrival: aim once at where they are now, then at where they will be when that walk ends.
        const first = WalkRoute.destination(action, from, context);
        const ahead: number = Gait.plan(Math.hypot(first.position.x - from.position.x, first.position.z - from.position.z), student.measure, pace).duration;
        const move = "subject" in action.to && context.world.students.has(action.to.subject) ? WalkRoute.destination(action, from, context, context.time + ahead) : first;
        // Around anyone standing in the straight line's way.
        const via: IAutoMovieVector3 | undefined = WalkRoute.detour(from.position, move.position, action, context, student);
        const route: IAutoMovieVector3[] | undefined = via === undefined ? undefined : [from.position, via, move.position];
        const distance: number =
          via === undefined
            ? Math.hypot(move.position.x - from.position.x, move.position.z - from.position.z)
            : Math.hypot(via.x - from.position.x, via.z - from.position.z) + Math.hypot(move.position.x - via.x, move.position.z - via.z);
        const walk: Gait.IPlan = Gait.plan(distance, student.measure, pace);
        const turnSteps: number = walk.steps === 0 ? Gait.turnSteps(BodyFrame.turn(from.heading, move.heading)) : 0;
        return { duration: walk.duration + turnSteps * walk.period, walk, move, ...(route === undefined ? {} : { route }) };
      }
      case "turn": {
        const heading: number = BodyFrame.headingTo(from.position, context.point(action.toward));
        const steps: number = Gait.turnSteps(BodyFrame.turn(from.heading, heading));
        return { duration: steps * (60 / Gait.PACES.ordinary.cadence), move: { position: from.position, heading } };
      }
      case "step": {
        const move = stepped(action.direction, action.metres, from, action.away === undefined ? undefined : context.point(action.away));
        const walk: Gait.IPlan = Gait.plan(action.metres, student.measure, action.quick ? "hurried" : "ordinary");
        return { duration: Math.max(walk.duration, 2 * walk.period), walk, move };
      }
      case "giveRoom": {
        const away: IAutoMovieVector3 = context.point(action.from);
        const move = stepped("back", action.metres, { ...from, heading: BodyFrame.headingTo(from.position, away) }, away);
        return { ...T.giveRoom, move };
      }
      case "sit":
        return { ...T.sit, move: { position: context.place(action.seat).point, heading: seat(context.place(action.seat), action.seat).facing } };
      case "rise":
        return { ...T.rise };
      case "shift":
        return { duration: EverydayLaw.shift(action.metres) };
      case "look":
        return { ...T.look };
      case "offer": {
        const point: IAutoMovieVector3 = offerPoint(action, from, context, student);
        if (withdrawsByHabit(action, context, student))
          return { duration: T.offer.duration + T.withdraw.duration, contact: T.offer.contact, outcome: "withdrawn", point };
        return { ...T.offer, point };
      }
      case "withdraw":
        return { ...T.withdraw };
      case "receive": {
        const giver: IBodyState = context.body(action.from, context.time + T.receive.contact);
        const side: IBodyState.Side | null = IBodyState.holding(giver, action.prop);
        const point: IAutoMovieVector3 =
          side !== null && giver.hands[side].point !== null
            ? giver.hands[side].point!
            : midpoint(from, giver, student);
        return {
          duration: T.receive.duration + (action.pull ? T.pull.duration : 0),
          contact: T.receive.contact,
          point,
          ...(action.pull ? { outcome: "buckled" } : {}),
        };
      }
      case "release":
        return { ...T.release };
      case "openPalm":
        return { ...T.openPalm, point: palmPoint(action.toward, from, context, student) };
      case "lowerHand":
        return { ...T.lowerHand };
      case "pocket":
        return { ...T.pocket };
      case "hide":
        return { ...T.hide };
      case "drop":
        return { ...T.drop };
      case "pickUp": {
        const place: IAutoMovieVector3 = context.point({ subject: action.props[0]! });
        return place.y > 0.3 ? { ...T.pickUpSill, point: place } : { ...T.pickUpFloor, point: place };
      }
      case "putDown":
        return { ...T.putDown, point: context.place(action.on).point };
      case "unfold":
        return action.until === "half" ? { ...T.unfoldHalf } : { ...T.unfoldOpen };
      case "fold":
        return { ...T.fold };
      case "raise":
        return { ...T.raise };
      case "drink":
        return { ...T.drink };
      case "read":
        return { ...T.read };
      case "launch":
        return { ...T.launch, point: context.point(action.toward) };
      case "reachAfter":
        return { ...T.reachAfter };
      case "drawBack":
        return { ...T.drawBack };
      case "catch":
        return catchTime(action, from, context, student);
      case "touchForehead":
        return { ...T.touchForehead };
      case "liftChin":
        return { duration: Math.max(0.6, action.seconds + 0.4), contact: 0.2 };
      case "pushGlasses":
        return { ...T.pushGlasses };
      case "bend": {
        const point: IAutoMovieVector3 = context.point(action.toward);
        if (action.meet === undefined) return { ...T.bend, point: { x: point.x, y: 0, z: point.z } };
        // Bend exactly as far as the head meets the other bending head halfway between the two.
        const other: IAutoMovieVector3 = context.body(action.meet, context.time + T.bend.duration).position;
        const gap: number = Math.hypot(other.x - from.position.x, other.z - from.position.z);
        const depth: number = EverydayLaw.meetDepth(student.measure, gap);
        return { ...T.bend, point: { x: point.x, y: 0, z: point.z }, outcome: depth < 1 ? "met" : "reached", move: { position: from.position, heading: depth } };
      }
      case "straighten":
        return { ...T.straighten };
    }
  }

  /**
   * The state an everyday action ends in.
   *
   * @param action The action.
   * @param from The state before it.
   * @param context The stage context.
   * @param student The student.
   * @param t Its timing.
   * @returns The end state.
   */
  export function end(action: StageAction.Everyday, from: IBodyState, context: StageContext, student: Student, t: ITime): IBodyState {
    // An entrance has no prior state; every other action starts from one.
    const base: IBodyState = from ?? IBodyState.standing({ x: 0, y: 0, z: 0 }, 0);
    const hands = { left: { ...base.hands.left }, right: { ...base.hands.right } };
    const next: IBodyState = { ...base, hands };
    const prop = (id: string): IStageProp | undefined => context.world.props.get(id);
    switch (action.kind) {
      case "enter": {
        const at: IAutoMovieVector3 = context.point(action.at);
        const placed: IStageSet.IPlace | undefined = "place" in action.at ? context.place(action.at.place) : undefined;
        const heading: number =
          action.facing !== undefined
            ? BodyFrame.headingTo(at, context.point(action.facing))
            : (action.heading ?? placed?.seat?.facing ?? placed?.facing ?? 0);
        const state: IBodyState = IBodyState.standing(at, heading);
        if (action.seat && placed?.seat) {
          state.support = "seat";
          state.seat = placed.seat.height;
        }
        for (const side of ["left", "right"] as const) {
          const held: string | undefined = action.holds?.[side];
          state.hands[side] = held !== undefined ? { place: "chest", point: null, holds: held } : action.pockets ? { place: "pocket", point: null, holds: null } : state.hands[side];
        }
        if (action.riding !== undefined) {
          state.broom = action.riding;
          state.support = "ride";
          state.position = { x: at.x, y: at.y, z: at.z };
          state.hands = { left: { place: "shaft", point: null, holds: state.hands.left.holds }, right: { place: "shaft", point: null, holds: state.hands.right.holds } };
        }
        return state;
      }
      case "walk":
      case "turn":
      case "step":
      case "giveRoom": {
        next.position = t.move!.position;
        next.heading = t.move!.heading;
        if (action.kind === "walk" && action.pockets)
          for (const side of ["left", "right"] as const) if (hands[side].holds === null) hands[side] = { place: "pocket", point: null, holds: null };
        if (action.kind === "giveRoom")
          for (const side of ["left", "right"] as const) if (hands[side].holds === null) hands[side] = { place: "palms-out", point: null, holds: null };
        next.bend = 0;
        return next;
      }
      case "sit":
        return { ...next, position: t.move!.position, heading: t.move!.heading, support: "seat", seat: seat(context.place(action.seat), action.seat).height, bend: 0 };
      case "rise":
        return { ...next, position: add(from.position, BodyFrame.forward(from.heading), 0.25), support: "stand", seat: 0 };
      case "shift":
        return { ...next, position: add(from.position, BodyFrame.left(from.heading), action.toward === "left" ? action.metres : -action.metres) };
      case "look":
        return {
          ...next,
          gaze:
            action.at === null
              ? null
              : "subject" in action.at && context.world.students.has(action.at.subject)
                ? { kind: "subject", subject: action.at.subject, ...(action.part === undefined || action.part === "head" ? {} : { part: action.part }) }
                : "subject" in action.at
                  ? { kind: "subject", subject: action.at.subject }
                  : { kind: "point", point: context.point(action.at) },
        };
      case "offer":
        hands[action.hand] = t.outcome === "withdrawn" ? { ...hands[action.hand], place: "chest", point: null } : { ...hands[action.hand], place: "extended", point: t.point! };
        return next;
      case "withdraw":
      case "drawBack":
        hands[action.hand] = { ...hands[action.hand], place: "chest", point: null };
        return next;
      case "receive":
        hands[action.hand] = { place: "extended", point: t.point!, holds: action.prop };
        return next;
      case "release":
      case "drop":
      case "putDown":
        for (const side of ["left", "right"] as const)
          if (hands[side].holds === action.prop) hands[side] = { place: "side", point: null, holds: null };
        return next;
      case "openPalm":
        hands[action.hand] = { place: "extended", point: t.point!, holds: null };
        return next;
      case "lowerHand":
        hands[action.hand] = { ...hands[action.hand], place: action.to === "knee" ? "knee" : "side", point: null };
        return next;
      case "pocket":
        for (const side of action.hands) if (hands[side].holds === null) hands[side] = { place: "pocket", point: null, holds: null };
        return next;
      case "hide": {
        const side: IBodyState.Side = IBodyState.holding(from, action.prop) ?? "right";
        hands[side] = { ...hands[side], place: "hip-behind", point: null };
        return next;
      }
      case "pickUp":
        action.props.forEach((id: string, k: number) => {
          const side: IBodyState.Side = action.hands[k] ?? "right";
          hands[side] = { place: prop(id)?.kind === "tea-cup" ? "waist" : "chest", point: null, holds: id };
        });
        return { ...next, bend: 0 };
      case "unfold":
      case "fold":
      case "read":
        for (const side of ["left", "right"] as const) if (hands[side].holds === null || hands[side].holds === action.prop) hands[side] = { ...hands[side], place: "chest", point: null };
        return next;
      case "raise": {
        const side: IBodyState.Side = IBodyState.holding(from, action.prop) ?? "right";
        hands[side] = { ...hands[side], place: "chest", point: null };
        return next;
      }
      case "launch": {
        const side: IBodyState.Side = IBodyState.holding(from, action.prop) ?? "right";
        hands[side] = { place: "extended", point: reachPoint(from, student, t.point!), holds: null };
        return next;
      }
      case "reachAfter":
        return next;
      case "catch":
        hands[action.hand] = { place: "chest", point: null, holds: action.prop };
        return next;
      case "bend":
        return { ...next, bend: action.meet === undefined ? action.depth : t.move!.heading };
      case "straighten":
        return { ...next, bend: 0 };
      case "hold":
      case "until":
      case "say":
      case "drink":
      case "reachAfter":
      case "touchForehead":
      case "pushGlasses":
      case "liftChin":
        return next;
    }
  }

  function add(p: IAutoMovieVector3, d: IAutoMovieVector3, s: number): IAutoMovieVector3 {
    return { x: p.x + d.x * s, y: p.y, z: p.z + d.z * s };
  }

  function seat(place: IStageSet.IPlace, name: string): IStageSet.ISeat {
    if (!place.seat) throw new Error(`${name} is not a seat`);
    return place.seat;
  }


  /** A step's end: back, forward or sideways from the heading, or straight away from a point. */
  function stepped(
    direction: "back" | "forward" | "left" | "right",
    metres: number,
    from: IBodyState,
    away?: IAutoMovieVector3,
  ): { position: IAutoMovieVector3; heading: number } {
    const f: IAutoMovieVector3 = BodyFrame.forward(from.heading);
    const l: IAutoMovieVector3 = BodyFrame.left(from.heading);
    const d: IAutoMovieVector3 =
      direction === "back" && away !== undefined
        ? BodyFrame.forward(BodyFrame.headingTo(away, from.position))
        : direction === "back"
          ? { x: -f.x, y: 0, z: -f.z }
          : direction === "forward"
            ? f
            : direction === "left"
              ? l
              : { x: -l.x, y: 0, z: -l.z };
    return { position: add(from.position, d, metres), heading: from.heading };
  }

  /** The midpoint handover point between two standing people. */
  function midpoint(a: IBodyState, b: IBodyState, student: Student): IAutoMovieVector3 {
    const distance: number = Math.hypot(a.position.x - b.position.x, a.position.z - b.position.z);
    return {
      x: (a.position.x + b.position.x) / 2,
      y: EverydayLaw.handoverHeight(student.measure, distance),
      z: (a.position.z + b.position.z) / 2,
    };
  }

  /** A point at most 0.85 of the arm's reach from the shoulder toward a target, at the target's height. */
  function reachPoint(from: IBodyState, student: Student, target: IAutoMovieVector3): IAutoMovieVector3 {
    const m = student.measure;
    const shoulderHeight: number = from.support === "seat" ? from.seat + 0.09 + (m.shoulder - m.hip) : m.shoulder;
    const dx: number = target.x - from.position.x;
    const dz: number = target.z - from.position.z;
    const horizontal: number = Math.hypot(dx, dz);
    const reach: number = 0.85 * m.armReach;
    const y: number = Math.max(m.hip - 0.1, Math.min(m.shoulder + 0.2, target.y > 0 ? target.y : shoulderHeight - 0.25));
    const along: number = Math.min(Math.max(0.2, horizontal - 0.05), Math.sqrt(Math.max(0.01, reach * reach - (y - shoulderHeight) ** 2)));
    const k: number = horizontal < 1e-6 ? 0 : along / horizontal;
    return { x: from.position.x + dx * k, y, z: from.position.z + dz * k };
  }

  /** The offer's hand point: the handover point to a person, or a reach toward a place at the asked height. */
  function offerPoint(
    action: Extract<StageAction.Action, { kind: "offer" }>,
    from: IBodyState,
    context: StageContext,
    student: Student,
  ): IAutoMovieVector3 {
    if ("subject" in action.to && context.world.students.has(action.to.subject)) {
      const point: IAutoMovieVector3 = midpoint(from, context.body(action.to.subject, context.time + EverydayLaw.TIMES.offer.contact), student);
      if (!withdrawsByHabit(action, context, student)) return point;
      const back: IAutoMovieVector3 = BodyFrame.forward(BodyFrame.headingTo(point, from.position));
      return add(point, back, EverydayLaw.HANDSPAN);
    }
    const target: IAutoMovieVector3 = context.point(action.to);
    const height: number =
      action.height === "seatedChest"
        ? target.y + 0.45 + 0.45
        : action.height === "waist"
          ? student.measure.hip + 0.12
          : student.measure.shoulder - 0.2;
    return reachPoint(from, student, { x: target.x, y: height, z: target.z });
  }

  /** An open palm's point toward a person at handing height, or toward a place. */
  function palmPoint(toward: StageAction.Target, from: IBodyState, context: StageContext, student: Student): IAutoMovieVector3 {
    if ("subject" in toward && context.world.students.has(toward.subject)) return midpoint(from, context.body(toward.subject), student);
    const target: IAutoMovieVector3 = context.point(toward);
    return reachPoint(from, student, { x: target.x, y: student.measure.hip + 0.2, z: target.z });
  }

  /** Whether an offer is the first personal offer to that person in the current scene by a student with the habit. */
  function withdrawsByHabit(action: Extract<StageAction.Action, { kind: "offer" }>, context: StageContext, student: Student): boolean {
    if (!student.has("withdraws-first-offer") || !("subject" in action.to) || !context.world.students.has(action.to.subject)) return false;
    if (context.world.props.get(action.prop)?.personal !== true) return false;
    // The scene began at the latest stage scene marker placed so far.
    let sceneStart: number = 0;
    for (const e of context.entries) if (e.intent.capability === "scene" && e.end <= context.time + 1e-9) sceneStart = Math.max(sceneStart, e.end);
    return !context.entries.some((e) => {
      if (e.subject !== student.id || e.intent.capability !== "offer" || e.start < sceneStart - 1e-9) return false;
      const a = e.intent.parameters?.action as StageAction.Action | undefined;
      return a !== undefined && a.kind === "offer" && "subject" in a.to && a.to.subject === (action.to as { subject: string }).subject && context.world.props.get(a.prop)?.personal === true;
    });
  }

  /** A catch closes when the launched crane arrives at the catcher's hand. */
  function catchTime(
    action: Extract<StageAction.Action, { kind: "catch" }>,
    from: IBodyState,
    context: StageContext,
    student: Student,
  ): ITime {
    const launch = context.find((e) => e.intent.capability === "launch" && (e.intent.parameters?.action as { prop?: string } | undefined)?.prop === action.prop);
    if (!launch || launch.contact === undefined) {
      // The first resolution pass may place the catcher before the launcher; a later pass finds the launch.
      if (context.previous === undefined) return { duration: 0.6, contact: 0.4 };
      throw new Error(`${student.id} catches ${action.prop} before it is launched`);
    }
    const launcher = launch.state as { to: IBodyState } | undefined;
    const release: IAutoMovieVector3 = launcher?.to.hands.right.point ?? launcher?.to.hands.left.point ?? context.point({ subject: launch.subject });
    const hand: IAutoMovieVector3 = BodyFrame.toWorld(from.position, from.heading, { forward: 0.4, left: action.hand === "left" ? 0.15 : -0.15, up: student.measure.shoulder - 0.25 });
    const glide: number = Math.min(EverydayLaw.CRANE_RANGE, Math.hypot(hand.x - release.x, hand.z - release.z, hand.y - release.y));
    const arrival: number = launch.contact + glide / EverydayLaw.CRANE_SPEED;
    const contact: number = Math.max(0.05, arrival - context.time);
    return { duration: contact + 0.2, contact, point: hand };
  }
}
