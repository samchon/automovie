import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBallSport,
  IAutoMovieMotionHumanPlaced,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionManner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanLean } from "../../compose/internal/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanPlaced } from "../../compose/internal/AutoMovieMotionHumanPlaced";
import { AutoMovieMotionHumanTouchEffector } from "../../compose/internal/AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTrunk } from "../../compose/internal/AutoMovieMotionHumanTrunk";
import { AutoMovieMotionManner } from "../../compose/internal/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../../compose/internal/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../../law/internal/HumanBound";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { ballCourt } from "./ballCourt";
import { courtStroke } from "./courtStroke";
import { throwInRelease } from "./throwInRelease";

/*
 * Team ball skills. The original stationary dribble, volleyball dig and set,
 * and football throw-in retain their implied-ball poses. With a held prop the
 * throw-in releases it through `at` at the specified elevation. Performance
 * reads the actual held frame at release. Basketball dribble release, chest
 * pass, bounce pass and set shot, and the grounded handball throw use
 * `ballCourt`. It publishes the spherical collision shape and keeps one prop
 * through release and flight. A planted basketball contest raises and waves
 * both hands and plants the body: it cannot ride a walk or run, so it follows a
 * run cut by `until` or a stand. The volleyball serve, spike, block, receive
 * and set use `courtStroke`.
 *
 * - Dribble: the knees give a twentieth of the stature (provisional), the palm
 *   faces down at the hand's side ahead of the hip, pushes down a quarter of
 *   the arm and rises again `count` times at 2 bounces a second (provisional).
 * - Dig: in a crouch, both arms reach from the displayed shoulders, nearly
 *   straight, to a platform pointing 40 degrees below the horizontal, the palms
 *   together; the platform lifts 10 degrees at the contact.
 * - Set: in a crouch, both hands stand above the forehead, palms up and forward;
 *   at the contact the legs extend and the hands rise overhead.
 * - Throw-in: both feet stay on the ground (the Laws of the Game), both hands are
 *   drawn behind the head while the trunk arches back about the hips, and they
 *   come over the head and forward as the trunk flexes, along a line rising at
 *   30 degrees, the distance-best release angle (Linthorne and Everett 2006),
 *   to where it meets the arms' reach about the flexed shoulders.
 *
 * The original implied skills share a ready position, stroke and return. The
 * court and volleyball families define their own phase durations and use the
 * same action clock and composing primitives.
 */
export namespace ballSport {
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionName = "ballSport";

  /*
   * Cancel table. A staged catch may cut in from the stroke, once the ball has
   * left the hands: a dribbler gathers the rebound, a passer takes the return.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      ballSport: ["fromRelax", "smooth"],
      walk: ["fromRelax", "smooth"],
      stageCatch: ["fromStroke", "smooth"],
    });

  /*
   * Dribble bounces per second (provisional).
   */
  export const BOUNCES: number = 2;

  /*
   * How far behind the head's joint the throw-in's hands are drawn, arm lengths
   * (provisional).
   */
  export const BEHIND: number = 0.15;

  /*
   * The throw-in's backward arch of the trunk about the hips at `ready`,
   * degrees (provisional).
   */
  export const ARCH: number = 10;

  /*
   * The throw-in's forward flexion of the trunk about the hips at the release,
   * degrees (provisional).
   */
  export const FLEX: number = 15;

  /*
   * The rise of the throw-in's hand path, degrees: the distance-best release
   * angle (Linthorne and Everett 2006).
   */
  export const RELEASE: number = 30;

  /*
   * A football's radius, metres (size 5, 68 to 70 cm around, the Laws of the
   * Game).
   */
  export const BALL: number = 0.11;

  /*
   * How far below the horizontal the dig's platform points before the contact,
   * degrees (provisional).
   */
  export const PLATFORM: number = 40;

  /*
   * How far the dig's platform lifts at the contact, degrees (provisional).
   */
  export const LIFT: number = 10;

  /*
   * The share of the arm's length the hands of a dig or a throw-in's release
   * reach from the shoulders (provisional).
   */
  export const REACH: number = 0.9;

  /*
   * The set position's entry and the return, seconds (provisional).
   */
  export const READY: number = 0.5;

  /*
   * Plan a ball skill.
   * Parameter context: The action's context.
   * Returns: The plan.
   * When the count is invalid or a modeled release lacks
   * its required reachable aim or prop.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBallSport.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanBallSport.IParams = context.params;
    switch (p.kind) {
      case "dribbleRelease":
      case "chestPass":
      case "bouncePass":
      case "setShot":
      case "handballThrow":
      case "highHandContest":
        return ballCourt(context, p.kind);
      case "volleyballServe":
      case "volleyballSpike":
      case "volleyballBlock":
      case "volleyballReceive":
      case "volleyballSet":
        return courtStroke(
          context,
          p.kind,
          p.contactAt === undefined ? {} : { contact: p.contactAt },
        );
      case "dribble":
      case "dig":
      case "set":
      case "throwIn":
        break;
    }
    const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
    const m: IAutoMovieMotionHumanActionContext["body"]["measure"] =
      body.measure;
    const count: number = HumanBound.whole("count", p.count ?? 4);
    const modifiers: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner(
      context,
      p.manner,
    );
    const attack: number =
      p.kind === "dribble"
        ? count / BOUNCES
        : p.kind === "throwIn"
          ? 0.35
          : 0.25;
    const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: p.kind === "throwIn" ? 0.7 : READY,
        attack,
        follow: 0.2,
        hold: 0.2,
        retract: READY,
      }),
      modifiers,
    );
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const into: (s: number) => number = (s: number): number =>
      clock.envelope(["start", "ready"], ["relax", "end"], s);
    // The span the arms are planned over: the reach to the place, the hold and the return.
    const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
      start: clock.at("start"),
      ready: clock.at("ready"),
      relax: clock.at("relax"),
      end: clock.at("end"),
    };
    const stroke: (s: number) => number = (s: number): number =>
      clock.progress("strokeStart", "stroke", s);
    const arm: number = m.upperArm + m.forearm;
    const local: (
      posture: IAutoMovieMotionHumanPosture,
      v: IAutoMovieVector3,
    ) => IAutoMovieVector3 = (
      posture: IAutoMovieMotionHumanPosture,
      v: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      HumanFrame.point({ origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw }, v);
    const rest: (
      side: AutoMovieHumanSide,
    ) => IAutoMovieMotionHumanArmAngles.IAngles = (
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanArmAngles.IAngles =>
      AutoMovieMotionHumanArm.angles(context.entry.pose, side);
    // Each arm's group: the clock is the law's own, lengthened by a slower
    // tempo, so a course too fast for its pace is handed back at once.
    const stretching: () => IAutoMovieMotionHumanArmPlanned.ITogether =
      (): IAutoMovieMotionHumanArmPlanned.ITogether =>
        AutoMovieMotionHumanArm.together(context.handover, true, context.tempo);
    const crouch: (
      depth: number,
      pitch: number,
    ) => IAutoMovieMotionHumanPrimitive = (
      depth: number,
      pitch: number,
    ): IAutoMovieMotionHumanPrimitive =>
      AutoMovieMotionHumanTrunk.crouch({
        body,
        standing: entry,
        clock,
        rise: ["start", "ready"],
        fall: [
          p.kind === "set" ? "strokeStart" : "relax",
          p.kind === "set" ? "stroke" : "end",
        ],
        depth: depth * m.stature * modifiers.extent,
        pitch,
      });
    const primitives: IAutoMovieMotionHumanPrimitive[] = [];

    // A throw-in's real ball: its grips and its launch.
    let thrown: ReturnType<typeof throwInRelease> = undefined;
    switch (p.kind) {
      case "dribble": {
        const side: AutoMovieHumanSide = p.hand ?? "right";
        primitives.push(
          crouch(0.05, 15),
          ...AutoMovieMotionHumanPlaced.arm({
            body,
            side,
            from: 0,
            to: clock.duration,
            rest: rest(side),
            weight: into,
            span,
            together: stretching(),
            // The dribbling elbow bends forward, as the court releases bend
            // it (`ballCourt`), so the hand's goal names its bend instead of
            // searching one at every second the ball's flight is swept.
            bend: "forward",
            place: (posture: IAutoMovieMotionHumanPosture, s: number) => {
              const u: number = clock.linear("strokeStart", "strokeEnd", s);
              const down: number =
                0.25 *
                arm *
                modifiers.extent *
                Math.sin(Math.PI * count * u) ** 2;
              const at: IAutoMovieVector3 = AutoMovieMotionHumanPlaced.grid(
                body,
                posture,
                side,
                {
                  height: "waist",
                  lateral: "outside",
                  distance: "near",
                },
              );
              return {
                point: { ...at, y: at.y - down },
                facing: { x: 0, y: -1, z: 0 },
              };
            },
          }),
        );
        break;
      }
      case "dig": {
        const pad: number = AutoMovieMotionHumanTouchEffector.pad(
          body,
          "right",
          {
            surface: "palm",
            shape: "flat",
          },
        );
        primitives.push(crouch(0.08, 25));
        for (const side of ["left", "right"] as const)
          primitives.push(
            ...AutoMovieMotionHumanPlaced.arm({
              body,
              side,
              from: 0,
              to: clock.duration,
              rest: rest(side),
              weight: into,
              span,
              together: stretching(),
              place: (
                posture: IAutoMovieMotionHumanPosture,
                s: number,
                resolution?: Parameters<
                  IAutoMovieMotionHumanActionPlan["posture"]
                >[2],
              ): ReturnType<IAutoMovieMotionHumanPlaced.IArm["place"]> => {
                // The platform: nearly straight arms from the displayed shoulders, lifted at the contact.
                const below: number =
                  ((PLATFORM - LIFT * stroke(s)) * Math.PI) / 180;
                const along: IAutoMovieVector3 = local(posture, {
                  x: 0,
                  y: -Math.sin(below),
                  z: Math.cos(below),
                });
                return {
                  point: AutoMovieEngineVector3.add(
                    AutoMovieEngineVector3.add(
                      AutoMovieMotionHumanPlaced.shoulders(
                        body,
                        posture,
                        resolution,
                      ),
                      AutoMovieEngineVector3.scale(along, REACH * arm),
                    ),
                    local(posture, {
                      x: (side === "left" ? 1 : -1) * pad,
                      y: 0,
                      z: 0,
                    }),
                  ),
                  facing: local(posture, {
                    x: side === "left" ? -1 : 1,
                    y: 0,
                    z: 0,
                  }),
                  forward: along,
                };
              },
              bend: "forward",
            }),
          );
        break;
      }
      case "set":
        primitives.push(crouch(0.05, 5));
        for (const side of ["left", "right"] as const)
          primitives.push(
            ...AutoMovieMotionHumanPlaced.arm({
              body,
              side,
              from: 0,
              to: clock.duration,
              rest: rest(side),
              weight: into,
              span,
              together: stretching(),
              place: (posture: IAutoMovieMotionHumanPosture, s: number) => ({
                point: AutoMovieEngineVector3.lerp(
                  AutoMovieMotionHumanPlaced.grid(body, posture, side, {
                    height: "crown",
                    lateral: "inside",
                    distance: "close",
                  }),
                  AutoMovieMotionHumanPlaced.grid(body, posture, side, {
                    height: "overhead",
                    lateral: "inside",
                    distance: "close",
                  }),
                  stroke(s),
                ),
                facing: { x: 0, y: 1, z: 0 },
                forward: local(posture, { x: 0, y: 0, z: 1 }),
              }),
              bend: "raised",
            }),
          );
        break;
      case "throwIn": {
        primitives.push(
          AutoMovieMotionHumanLean.sway({
            body,
            from: 0,
            to: clock.duration,
            angles: (s: number) => ({
              pitch: into(s) * (-ARCH + (ARCH + FLEX) * stroke(s)),
              roll: 0,
            }),
          }),
        );
        const heading: IAutoMovieVector3 = local(entry, { x: 0, y: 0, z: 1 });
        const tilted: (pitch: number) => IAutoMovieMotionHumanPosture = (
          pitch: number,
        ): IAutoMovieMotionHumanPosture =>
          AutoMovieMotionHumanLean.pivot(body, entry, { pitch, roll: 0 });
        // Behind the head as the arched trunk carries it, at the head's middle.
        const drawn: IAutoMovieVector3 = AutoMovieEngineVector3.add(
          AutoMovieMotionHumanPlaced.joint(body, tilted(-ARCH), "head"),
          AutoMovieEngineVector3.add(AutoMovieEngineVector3.scale(heading, -BEHIND * arm), {
            x: 0,
            y: m.headRadius,
            z: 0,
          }),
        );
        // The release lies where the line rising at RELEASE from there meets the arms' reach about the flexed shoulders.
        const rise: number = (RELEASE * Math.PI) / 180;
        const line: IAutoMovieVector3 = AutoMovieEngineVector3.add(
          AutoMovieEngineVector3.scale(heading, Math.cos(rise)),
          { x: 0, y: Math.sin(rise), z: 0 },
        );
        const from: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
          drawn,
          AutoMovieMotionHumanPlaced.shoulders(body, tilted(FLEX)),
        );
        const b: number = AutoMovieEngineVector3.dot(from, line);
        const travel: number =
          -b +
          Math.sqrt(
            Math.max(0, b * b - AutoMovieEngineVector3.dot(from, from) + (REACH * arm) ** 2),
          );
        const released: IAutoMovieVector3 = AutoMovieEngineVector3.add(
          drawn,
          AutoMovieEngineVector3.scale(line, travel),
        );

        thrown = throwInRelease(p, clock, released, RELEASE);
        for (const side of ["left", "right"] as const) {
          const beside: IAutoMovieVector3 = local(entry, {
            x: (side === "left" ? 1 : -1) * BALL,
            y: 0,
            z: 0,
          });
          primitives.push(
            ...AutoMovieMotionHumanPlaced.arm({
              body,
              side,
              from: 0,
              to: clock.duration,
              rest: rest(side),
              weight: into,
              span,
              together: stretching(),
              place: (_posture: IAutoMovieMotionHumanPosture, s: number) => ({
                point: AutoMovieEngineVector3.add(
                  AutoMovieEngineVector3.lerp(drawn, released, stroke(s)),
                  beside,
                ),
                facing: local(entry, {
                  x: side === "left" ? -1 : 1,
                  y: 0,
                  z: 0,
                }),
                forward: { x: 0, y: 1, z: 0 },
              }),
              bend: "raised",
            }),
          );
        }
        break;
      }
    }
    const planned: IAutoMovieMotionHumanActionPlan =
      composeAutoMovieMotionHumanAction({
        base: AutoMovieMotionHumanBase.still(
          clock.duration,
          entry,
          AutoMovieMotionHumanBase.plants(),
        ),
        clock,
        primitives,
        contact: "stroke",
      });
    return thrown === undefined
      ? planned
      : {
          ...planned,
          contacts: [...planned.contacts, ...thrown.contacts],
          launches: [...(planned.launches ?? []), ...thrown.launches],
        };
  }
}
