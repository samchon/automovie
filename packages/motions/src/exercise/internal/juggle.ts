import { AutoMovieGravity, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionClockInstant,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanJuggle,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionPropLaunch,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBall } from "../../ballStrike/HumanBall";
import { AutoMovieMotionClock } from "../../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanElbowPlace } from "../../compose/AutoMovieMotionHumanElbowPlace";
import { AutoMovieMotionHumanInterrupt } from "../../compose/AutoMovieMotionHumanInterrupt";
import { composeAutoMovieMotionHumanAction } from "../../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../../law/HumanBound";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanFrame } from "../../posture/HumanFrame";
import { HumanHand } from "../../posture/HumanHand";
import { juggleTiming } from "./juggleTiming";

/**
 * Toss juggling standing still.
 *
 * The pattern's times follow Shannon's theorem `(F + D) H = (V + D) N` for two
 * hands with the dwell ratio `D / (D + V)` held at `DWELL` (Beek and Lewbel,
 * The Science of Juggling, 1995, report about three quarters in the cascade):
 * the flight `F` is the throw's to its height `h`, `sqrt(8 h / g)` between
 * hands level with each other, so the dwell is `2 k F / (N - 2 k)` and the
 * vacancy `(1 - k) / k` of it.
 *
 * - Cascade (odd `N`): the hands throw in turn, each from inside (`INSIDE` of the
 *   hands' spacing toward the middle) to the other hand's outside catch point;
 *   a caught ball is carried in a scoop, down `SCOOP` metres and in, to its
 *   throw.
 * - Shower (two balls): the right hand throws high to the left, the left passes
 *   low back to the right in a third of the high flight.
 *
 * Every throw is a launch aimed at the catching hand's point at the catch, and
 * every hold a grip on the ball from its catch to its throw; a dropped throw
 * (`drops`) has no catch and falls to the floor, and its ball is not thrown
 * again. A vacancy shorter than `VACANCY` leaves the hand no time to get to its
 * catch and is refused with the height that gives it.
 *
 * Events: `throw{n}`, `catch{n}` for each throw's catch, `relax`.
 */
export namespace juggle {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "juggle";

  /** Cancel table: once the last ball is down or caught, into standing. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      juggle: ["fromRelax", "smooth"],
    });

  /** The dwell ratio, `D / (D + V)`. */
  export const DWELL: number = 0.75;

  /**
   * The shortest vacancy that lets a hand reach its catch, seconds
   * (provisional).
   */
  export const VACANCY: number = 0.12;

  /**
   * How far a throw leaves inside the hand's point, a share of the hands'
   * spacing.
   */
  export const INSIDE: number = 0.2;

  /** The scoop's dip, metres (provisional). */
  export const SCOOP: number = 0.06;

  /**
   * The hands' points before the body: half apart, high and ahead, shares of
   * the stature.
   */
  export const HANDS: Readonly<IAutoMovieVector3> = {
    x: 0.11,
    y: 0.58,
    z: 0.22,
  };

  /**
   * Where a hand holds its ball at the start: the ball's centre in world
   * metres. The first ball rests in the right hand, the second in the left and
   * a third on top of the first.
   *
   * @param body The juggler's body.
   * @param root The juggler's root on the floor, world metres.
   * @param yaw The juggler's heading, degrees.
   * @param index The ball's place in `balls`, from 0.
   * @param radius The ball's radius, metres.
   * @returns The ball's centre.
   */
  export function start(
    body: IAutoMovieMotionHumanBody,
    root: IAutoMovieVector3,
    yaw: number,
    index: number,
    radius: number,
  ): IAutoMovieVector3 {
    const side: AutoMovieHumanSide = index % 2 === 0 ? "right" : "left";
    return Vector3.add(point(body, { ...root, y: 0 }, yaw, side, 0), {
      x: 0,
      y: radius * (1 + 2 * Math.floor(index / 2)),
      z: 0,
    });
  }

  /**
   * Plan a juggle.
   *
   * @param context The action's context.
   * @returns The plan with its launches.
   * @throws {HumanRefusal} When a cascade's count is even, a shower's is not
   *   two, the height leaves no vacancy for the catch, or the throw count is
   *   not a positive whole number.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanJuggle.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanJuggle.IParams = context.params;
    const body: IAutoMovieMotionHumanBody = context.body;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const n: number = p.balls.length;
    if (p.pattern === "cascade" ? n % 2 === 0 || n < 3 : n !== 2)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "balls",
        value: n,
        feasible: {
          kind: "alternatives",
          values: p.pattern === "cascade" ? ["3", "5", "7"] : ["2"],
        },
        reason:
          p.pattern === "cascade"
            ? `a cascade juggles an odd number of balls, not ${n}`
            : `a shower here juggles two balls, not ${n}`,
        fix:
          p.pattern === "cascade"
            ? "juggle three or five balls"
            : "juggle two balls",
      });
    const g: number = AutoMovieGravity.STANDARD;
    const height: number = p.height ?? 0.6;
    HumanBound.above("height", height, 0, "m");
    const timing: juggleTiming.ITiming = juggleTiming({
      pattern: p.pattern,
      balls: n,
      height,
      ratio: DWELL,
      vacancy: VACANCY,
    });
    const flight: number = timing.flight;
    const dwell: number = timing.dwell;
    const vacancy: number = timing.vacancy;
    if (vacancy < VACANCY) {
      const least: number = timing.least;
      throw new HumanRefusal({
        kind: "parameter",
        axis: "height",
        value: height,
        feasible: { kind: "range", minimum: least, maximum: null, unit: "m" },
        reason: `a ${height} m throw leaves the hand ${(vacancy * 1000).toFixed(0)} ms to reach its catch, less than ${VACANCY * 1000} ms`,
        fix: `throw at least ${least.toFixed(2)} m high`,
      });
    }
    const throws: number = HumanBound.whole("throws", p.throws ?? 3 * n);

    // The schedule: throw j from hand j % 2 (right first) every half cycle.
    const radius: number = HumanBall(
      context,
      p.balls[0]!,
      context.start,
      "ball",
    ).radius;
    const root: IAutoMovieVector3 = { ...entry.root, y: 0 };
    const yaw: number = entry.yaw;
    const half: number = (dwell + vacancy) / 2;
    const throwAt: (side: AutoMovieHumanSide) => IAutoMovieVector3 = (
      side: AutoMovieHumanSide,
    ): IAutoMovieVector3 => point(body, root, yaw, side, -INSIDE);
    const catchAt: (side: AutoMovieHumanSide) => IAutoMovieVector3 = (
      side: AutoMovieHumanSide,
    ): IAutoMovieVector3 => point(body, root, yaw, side, INSIDE);
    const held: Record<AutoMovieHumanSide, IHeld[]> = { left: [], right: [] };
    const launches: IAutoMovieMotionPropLaunch[] = [];
    const instants: IAutoMovieMotionClockInstant[] = [];
    const dropped: Set<string> = new Set();
    // Each ball's holder and from when it is held: at the start, one in each
    // hand and any third on the first.
    const since: Map<string, number> = new Map(
      p.balls.map((b: string): [string, number] => [b, 0]),
    );
    const queue: Record<AutoMovieHumanSide, string[]> = {
      right: p.balls.filter((_: string, i: number): boolean => i % 2 === 0),
      left: p.balls.filter((_: string, i: number): boolean => i % 2 === 1),
    };
    let last: number = 0;
    for (let j: number = 0; j < throws; j++) {
      const from: AutoMovieHumanSide =
        p.pattern === "shower"
          ? j % 2 === 0
            ? "right"
            : "left"
          : j % 2 === 0
            ? "right"
            : "left";
      const to: AutoMovieHumanSide = from === "right" ? "left" : "right";
      const t: number = 0.3 + j * half;
      const which: string | undefined = queue[from].shift();
      if (which === undefined) continue;
      const air: number =
        p.pattern === "shower" && from === "left" ? flight / 3 : flight;
      const caught: number = t + air;
      const point0: IAutoMovieVector3 = Vector3.add(throwAt(from), {
        x: 0,
        y: radius,
        z: 0,
      });
      const point1: IAutoMovieVector3 = Vector3.add(catchAt(to), {
        x: 0,
        y: radius,
        z: 0,
      });
      held[from].push({ ball: which, from: since.get(which)!, to: t });
      launches.push({
        prop: which,
        seconds: t,
        point: Vector3.subtract(point0, { x: 0, y: radius, z: 0 }),
        velocity: Vector3.scale(
          Vector3.add(Vector3.subtract(point1, point0), {
            x: 0,
            y: 0.5 * g * air * air,
            z: 0,
          }),
          1 / air,
        ),
        aim: { point: point1, seconds: air },
        sphere: { centre: { x: 0, y: radius, z: 0 }, radius },
      });
      instants.push({ name: `throw${j + 1}`, seconds: t });
      if ((p.drops ?? []).includes(j + 1)) {
        dropped.add(which);
        last = Math.max(last, t);
        continue;
      }
      instants.push({ name: `catch${j + 1}`, seconds: caught });
      since.set(which, caught);
      queue[to].push(which);
      last = Math.max(last, caught);
    }
    // Balls still held at the end stay in their hands.
    const end: number = last + 0.6;
    for (const side of ["left", "right"] as const)
      for (const b of queue[side])
        held[side].push({ ball: b, from: since.get(b)!, to: end });
    instants.push({ name: "relax", seconds: last });

    // Each hand: at its throw point when throwing, its catch point when
    // catching, scooping between, out to the catch in the vacancy.
    const events: (side: AutoMovieHumanSide) => IEvent[] = (
      side: AutoMovieHumanSide,
    ): IEvent[] =>
      held[side]
        .flatMap((h: IHeld): IEvent[] => [
          { at: h.from, kind: "catch" },
          { at: h.to, kind: "throw" },
        ])
        .filter((e: IEvent): boolean => e.at > 0 && e.at < end)
        .sort((a: IEvent, b: IEvent): number => a.at - b.at);
    const left: readonly IEvent[] = events("left");
    const right: readonly IEvent[] = events("right");
    const hand: (side: AutoMovieHumanSide, t: number) => IAutoMovieVector3 = (
      side: AutoMovieHumanSide,
      t: number,
    ): IAutoMovieVector3 => {
      const list: readonly IEvent[] = side === "left" ? left : right;
      const home: IAutoMovieVector3 = point(body, root, yaw, side, 0);
      let before: IEvent = { at: 0, kind: "rest" };
      let after: IEvent = { at: end, kind: "rest" };
      for (const e of list) {
        if (e.at <= t) before = e;
        else {
          after = e;
          break;
        }
      }
      const spot: (e: IEvent) => IAutoMovieVector3 = (
        e: IEvent,
      ): IAutoMovieVector3 =>
        e.kind === "throw"
          ? throwAt(side)
          : e.kind === "catch"
            ? catchAt(side)
            : home;
      const a: IAutoMovieVector3 = spot(before);
      const b: IAutoMovieVector3 = spot(after);
      const u: number = AutoMovieEngineMotionSampling.minimumJerkShare(
        Math.max(
          0,
          Math.min(1, (t - before.at) / Math.max(1e-9, after.at - before.at)),
        ),
      );
      const dip: number =
        before.kind === "catch" && after.kind === "throw"
          ? SCOOP * Math.sin(Math.PI * u)
          : 0;
      return { ...Vector3.lerp(a, b, u), y: a.y + (b.y - a.y) * u - dip };
    };
    const palm: (
      side: AutoMovieHumanSide,
      t: number,
    ) => IAutoMovieMotionHumanArmTarget.ITarget = (
      side: AutoMovieHumanSide,
      t: number,
    ): IAutoMovieMotionHumanArmTarget.ITarget => {
      const at: IAutoMovieVector3 = hand(side, t);
      return {
        surface: "palm",
        shape: "relaxed",
        point: at,
        // The palm cupped up under the ball, the fingers ahead.
        rotation: HumanHand.rotation(side, {
          fingers: HumanFrame.forward(yaw),
          palm: { x: 0, y: 1, z: 0 },
        }),
        bend: Vector3.add(
          at,
          Vector3.scale(
            HumanFrame.point(
              { origin: { x: 0, y: 0, z: 0 }, yaw },
              { x: side === "left" ? 1 : -1, y: -1, z: -1 },
            ),
            0.3,
          ),
        ),
      };
    };
    const contacts: IAutoMovieMotionHumanContactWindow[] = [
      ...AutoMovieMotionHumanBase.plants(),
      ...(["left", "right"] as const).flatMap(
        (side: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow[] =>
          held[side]
            .filter((h: IHeld): boolean => h.to > h.from)
            .map(
              (h: IHeld): IAutoMovieMotionHumanContactWindow => ({
                part: side === "left" ? "leftHand" : "rightHand",
                kind: "grip",
                from: h.from / end,
                to: h.to / end,
                support: { kind: "prop", subject: h.ball },
              }),
            ),
      ),
    ];
    const composed: IAutoMovieMotionHumanActionPlan =
      composeAutoMovieMotionHumanAction({
        base: AutoMovieMotionHumanBase.still(end, entry, contacts),
        clock: AutoMovieMotionClock(end, instants),
        primitives: (["left", "right"] as const).map(
          (side: AutoMovieHumanSide): IAutoMovieMotionHumanPrimitive => ({
            channels: [side === "left" ? "leftArm" : "rightArm"],
            reads: ["root", "trunk"],
            from: 0,
            to: end,
            write: (
              posture: IAutoMovieMotionHumanPosture,
              t: number,
            ): IAutoMovieMotionHumanPosture => ({
              ...posture,
              limbs: {
                ...posture.limbs,
                // The elbow placed out and below the hand, so the hand's
                // rotation cannot flip it across the arm.
                [side === "left" ? "leftArm" : "rightArm"]:
                  AutoMovieMotionHumanElbowPlace(
                    body,
                    posture,
                    side,
                    AutoMovieMotionHumanArm.goal(body, side, palm(side, t)),
                    (): IAutoMovieVector3 =>
                      HumanFrame.point(
                        { origin: { x: 0, y: 0, z: 0 }, yaw },
                        { x: side === "left" ? 1 : -1, y: -1, z: -1 },
                      ),
                  ),
              },
            }),
          }),
        ),
      });
    return { ...composed, launches };
  }

  /** One ball held in a hand. */
  interface IHeld {
    /** The ball's scene id. */
    ball: string;

    /** From when, action seconds. */
    from: number;

    /** Until when. */
    to: number;
  }

  /** What a hand does at an event: catch, throw, or rest at its home point. */
  type Moment = "catch" | "throw" | "rest";

  /** A hand's catch or throw. */
  interface IEvent {
    /** When, action seconds. */
    at: number;

    /** What happens. */
    kind: Moment;
  }

  /**
   * A hand's point in the juggler's frame, moved in or out by a share of the
   * hands' spacing.
   */
  function point(
    body: IAutoMovieMotionHumanBody,
    root: IAutoMovieVector3,
    yaw: number,
    side: AutoMovieHumanSide,
    out: number,
  ): IAutoMovieVector3 {
    const s: number = body.measure.stature;
    const x: number = (side === "left" ? 1 : -1) * HANDS.x * s * (1 + out);
    return HumanFrame.point(
      { origin: root, yaw },
      { x, y: HANDS.y * s, z: HANDS.z * s },
    );
  }
}
