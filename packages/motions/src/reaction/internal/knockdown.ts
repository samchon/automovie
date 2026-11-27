import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanJoints,
  IAutoMovieMotionHumanKnockdown,
  IAutoMovieMotionHumanLean,
  IAutoMovieMotionHumanPlayback,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanJoints } from "../../compose/internal/AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanLean } from "../../compose/internal/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanRoot } from "../../compose/internal/AutoMovieMotionHumanRoot";
import { AutoMovieMotionHumanTarget } from "../../compose/internal/AutoMovieMotionHumanTarget";
import { AutoMovieMotionPrepared } from "../../compose/internal/AutoMovieMotionPrepared";
import { composeAutoMovieMotionHumanAction } from "../../compose/internal/composeAutoMovieMotionHumanAction";
import { HumanPreparedPlayback } from "../../perform/internal/HumanPreparedPlayback";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { createHumanPostureCurve } from "../../posture/internal/createHumanPostureCurve";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { StrikingTarget } from "../../striking/internal/StrikingTarget";
import { KnockdownFloor } from "./KnockdownFloor";
import { ReactionFeet } from "./ReactionFeet";
import { ReactionSource } from "./ReactionSource";

/**
 * A knockdown: the legs give way and the body goes down away from the blow,
 * sitting onto the floor and falling back to lie supine.
 *
 * The collapse is a buckle, not a dive: the knees and hips fold while the
 * pelvis goes back and down behind the feet (as in the stepping-response
 * failures of Maki and McIlroy 1997, where a push too large for one step ends
 * in a fall), the seat meets the floor at 0.45 s, about the free-fall time of
 * the pelvis from its height slowed by the buckling legs, and the trunk rolls
 * back until the back rests on the floor by 1.1 s, the arms trailing. The feet
 * stay where they stood until the seat lands; then the seat stays where it
 * landed and the heels slide out as the legs straighten.
 *
 * Each pose rests on the floor without penetrating it: the root's height is
 * solved so the lowest point of the body's own collision shapes touches the
 * floor. The seat and the lie are fitted to the body the same way: the knee at
 * the seat is the one that puts the feet on the floor the seat sits on, and the
 * lying arm's extension and elbow are the ones that lay the arm on the floor
 * beside the body, so any stature sits and lies on the floor exactly. The body
 * goes down away from the blow (the `from` target), turned so its back falls
 * toward that direction.
 *
 * The trunk's recline and the hip's fold at the seat are provisional readings;
 * detailed falls belong to tier 2 of the kickboxing research.
 */
export namespace knockdown {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "knockdown";

  /**
   * A knockdown's content is a staged fall, so its balance is judged
   * (`IAutoMovieMotionHumanActionLaw.physical`).
   */
  export const physical: boolean = true;

  /** Cancel table: none; a knocked-down performer stays down for the count. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {};

  /**
   * A reaction interrupts whatever the body was doing, at any instant, as a
   * reflex.
   */
  export const accepts: IAutoMovieMotionHumanActionLaw["accepts"] = {
    any: [AutoMovieMotionHumanInterrupt.row("anytime", "reflex")],
  };

  /** Seat contact, seconds. */
  export const SEATED: number = 0.45;

  /** Back on the floor, seconds. */
  export const DOWN: number = 1.1;

  /**
   * The root height that rests a posture on the floor: its lowest collision
   * point at zero.
   *
   * @param body The body.
   * @param posture The posture, its root height ignored.
   * @param resolution Optional exact FK reader/supplier borrowed from the
   *   current synchronous body's planning operation.
   * @param projection Optional genuine same-body ROM metadata preparation
   *   borrowed from that operation; every current joint remains projected.
   * @returns The root height, metres.
   */
  export function rest(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): number {
    return KnockdownFloor.rest(body, posture, resolution, projection);
  }

  /**
   * Prepare this body's exact floor rest for a support or floor interval.
   *
   * @param body The canonical body with unchanged rig, rest geometry and
   *   profile throughout the owning plan.
   * @returns The native floor reader accepting each current posture and
   *   optional synchronous FK/ROM loans; root Y is ignored and height is in
   *   metres.
   */
  export function prepareRest(
    body: IAutoMovieMotionHumanBody,
  ): ReturnType<typeof KnockdownFloor.prepareRest> {
    return KnockdownFloor.prepareRest(body);
  }

  /**
   * A knockdown's timetable: the body rolls back from `ROLLING` of the way to
   * its seat, lands seated `SEATED` in (the `stroke`), is down on its back
   * `DOWN` in (`relax`), and lies `hold` seconds, one by default.
   *
   * @param hold The seconds the body lies.
   * @returns The clock with `rolling`, `seated`, `stroke`, `down` and `relax`.
   * @throws {Error} When the lying time is negative.
   */
  export function timetable(hold: number | undefined): IAutoMovieMotionClock {
    const lie: number = hold ?? 1;
    if (!(lie >= 0)) throw new Error("A knockdown lies a non-negative time");
    return AutoMovieMotionClock(DOWN + lie, [
      { name: "rolling", seconds: ROLLING * SEATED },
      { name: "seated", seconds: SEATED },
      { name: "stroke", seconds: SEATED },
      { name: "down", seconds: DOWN },
      { name: "relax", seconds: DOWN },
    ]);
  }
  /**
   * Plan a knockdown.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the lying time is negative.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanKnockdown.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const clock: IAutoMovieMotionClock = timetable(context.params.hold);
    const duration: number = clock.duration;
    const sit: (seconds: number) => number = AutoMovieMotionClock.prepare(
      clock,
      AutoMovieMotionClock.START,
      "seated",
    ).progress;
    const back: (seconds: number) => number = AutoMovieMotionClock.prepare(
      clock,
      "rolling",
      "down",
    ).progress;

    // The angles this body needs to rest on the floor, and where its ankles
    // and hips are along its heading standing and seated: the feet stay where
    // they stood until the seat lands, and the seat stays where it landed.
    const fitted: KnockdownFloor.IFit = KnockdownFloor.fit(body, back(SEATED));
    const measure: ReturnType<typeof KnockdownFloor.prepareMeasure> =
      KnockdownFloor.prepareMeasure(body);
    const at: (
      seconds: number,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ) => KnockdownFloor.IMeasure = (
      seconds: number,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): KnockdownFloor.IMeasure =>
      measure(
        KnockdownFloor.fold(fitted, sit(seconds), back(seconds)),
        resolution,
        projection,
      );
    const [standing, seated]: readonly [
      KnockdownFloor.IMeasure,
      KnockdownFloor.IMeasure,
    ] = ((): readonly [KnockdownFloor.IMeasure, KnockdownFloor.IMeasure] => {
      const resolution: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution();
      const projection: ReturnType<typeof prepareHumanPostureProjection> =
        prepareHumanPostureProjection(body);
      return [
        at(0, resolution, projection),
        at(SEATED, resolution, projection),
      ];
    })();

    // The heading that faces the blow, so the back falls away from it: the
    // blow is read at the look before the start, solved once the performance
    // is placed (`prepare`); a read before reads it there.
    const solved: AutoMovieMotionPrepared.IValue<number> =
      AutoMovieMotionPrepared((): number => {
        const away: IAutoMovieVector3 = AutoMovieMotionHumanTarget.away(
          ReactionSource.at(
            context,
            context.params.target,
            context.start - StrikingTarget.LOOK,
            entry,
            AutoMovieMotionHumanTarget.DEFAULTS.ahead,
          ),
          entry.root,
          entry.yaw,
        );
        return (Math.atan2(-away.x, -away.z) * 180) / Math.PI;
      });
    const heading: () => number = (): number => solved.read();

    const flat: (yaw: number, forward: number) => IAutoMovieVector3 = (
      yaw: number,
      forward: number,
    ): IAutoMovieVector3 =>
      HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw },
        { x: 0, y: 0, z: forward },
      );
    const plan: IAutoMovieMotionHumanActionPlan =
      composeAutoMovieMotionHumanAction({
        base: {
          ...AutoMovieMotionHumanBase.still(
            duration,
            {
              root: entry.root,
              yaw: entry.yaw,
              pitch: 0,
              roll: 0,
              joints: {},
              limbs: {},
            },
            [
              // The feet stay planted where they stood until the seat lands.
              ...ReactionFeet.plants(SEATED / duration),
              {
                part: "seat",
                kind: "seat",
                from: SEATED / duration,
                to: DOWN / duration,
                support: { kind: "ground" },
              },
              {
                part: "back",
                kind: "lie",
                from: DOWN / duration,
                to: 1,
                support: { kind: "ground" },
              },
            ],
          ),
          prepare: (): void => void solved.prepare(),
        },
        clock,
        primitives: [
          // The pelvis goes back and down behind the feet until the seat
          // lands, the body turning to face the blow; then the seat stays and
          // the heels slide out as the back rolls down. The height rests the
          // pose of each second on the floor.
          {
            channels: ["root"],
            reads: ["root"],
            from: 0,
            to: duration,
            write: (
              posture: IAutoMovieMotionHumanPosture,
              seconds: number,
              _before?: IAutoMovieMotionHumanPrimitive.Reader,
              resolution?: Parameters<
                IAutoMovieMotionHumanActionPlan["posture"]
              >[2],
              projection?: Parameters<
                IAutoMovieMotionHumanActionPlan["posture"]
              >[3],
            ): IAutoMovieMotionHumanPosture => {
              const turn: number = angle(heading() - entry.yaw);
              const now: KnockdownFloor.IMeasure = at(
                seconds,
                resolution,
                projection,
              );
              const landed: boolean = seconds >= SEATED;
              const world: IAutoMovieVector3 = Vector3.add(
                Vector3.subtract(
                  flat(entry.yaw, standing.ankle),
                  flat(
                    entry.yaw + turn * sit(seconds),
                    (landed ? seated : now).ankle,
                  ),
                ),
                flat(entry.yaw + turn, landed ? seated.hips - now.hips : 0),
              );
              return AutoMovieMotionHumanRoot.place(posture, {
                point: {
                  ...HumanFrame.local(
                    { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
                    world,
                  ),
                  y: now.floor - entry.root.y,
                },
                yaw: turn * sit(seconds),
              });
            },
          },
          AutoMovieMotionHumanLean.tilt({
            from: 0,
            to: duration,
            angles: (seconds: number): IAutoMovieMotionHumanLean.IAngles => ({
              pitch: KnockdownFloor.fold(fitted, sit(seconds), back(seconds))
                .pitch,
              roll: 0,
            }),
          }),
          AutoMovieMotionHumanJoints.add({
            channels: ["head", "leftLeg", "rightLeg", "leftArm", "rightArm"],
            from: 0,
            to: duration,
            delta: (seconds: number): IAutoMovieMotionHumanJoints.Angles =>
              KnockdownFloor.fold(fitted, sit(seconds), back(seconds)).joints,
          }),
        ],
      });
    // The fold has reached its grounded endpoint at "down"; an authored
    // lying hold extends only the film clock after that event.
    const defaultSource: boolean = context.params.target === undefined;
    // The fold turns and pitches the body about its root; the feet stay
    // flat where they stood until the seat lands, so no heel skates.
    const out: IAutoMovieMotionHumanActionPlan = {
      ...ReactionFeet.hold(
        plan,
        context.entry,
        body,
        SEATED,
        0.5 * body.measure.hipHeight,
      ),
      ...(defaultSource && duration > DOWN
        ? { still: [DOWN, duration] as const }
        : {}),
      physicalWindow: { from: 0, to: DOWN },
    };
    // The default source is fixed by the entry, and both fold progress
    // functions are identically one throughout the authored lying hold.
    // A directed fall still observes its source at the normal query.
    if (defaultSource && duration > DOWN) {
      let hold: IAutoMovieMotionHumanActionPlan["posture"] | undefined;
      HumanPreparedPlayback.attach(out, body, {
        mode: "posture",
        prepare: (): void => {
          hold = createHumanPostureCurve(plan.posture(DOWN));
        },
        phases: [
          {
            from: DOWN,
            to: duration,
            sample: (
              seconds,
              channels,
            ): IAutoMovieMotionHumanPlayback.ISample | undefined =>
              channels === undefined && hold !== undefined
                ? { posture: hold(seconds) }
                : undefined,
          },
        ],
      });
    }
    return out;
  }

  /** When the trunk starts rolling back, as a share of the time to the seat. */
  const ROLLING: number = 0.6;

  /** A heading difference wrapped into (-180, 180]. */
  function angle(degrees: number): number {
    return ((((degrees + 180) % 360) + 360) % 360) - 180;
  }
}
