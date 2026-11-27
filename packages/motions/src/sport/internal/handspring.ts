import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanGymnasticsWheel,
  IAutoMovieMotionHumanHandspring,
  IAutoMovieMotionHumanPlayback,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { jump } from "../../actions/internal/jump";
import { stand } from "../../actions/internal/stand";
import { AutoMovieMotionHumanInterrupt } from "../../compose/AutoMovieMotionHumanInterrupt";
import { ExerciseKey } from "../../exercise/ExerciseKey";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanPreparedPlayback } from "../../perform/HumanPreparedPlayback";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { StrikingBody } from "../../striking/StrikingBody";
import { GymnasticsFlight } from "../GymnasticsFlight";
import { GymnasticsWheel } from "../GymnasticsWheel";
import { handspringKeys } from "./handspringKeys";
import { handspringLanding } from "./handspringLanding";
import { prepareGymnasticsPlacement } from "./prepareGymnasticsPlacement";
import { salto } from "./salto";

/**
 * A front handspring: from standing, the body reaches forward into a lunge,
 * turns head over heels in pitch over its hands, leaves them and flies to its
 * feet, landing arched and rising to stand.
 *
 * Two phases, each turning about one axis, the body's left one:
 *
 * 1. Supported: the body rolls as a wheel (`GymnasticsWheel`) over its feet, its
 *    leading foot and its two hands, its shape going from standing to the lunge
 *    `lunged` by the angle `REACH` and from there to the arched line `arched`
 *    by `RELEASE`, where the hands leave. The angle grows with constant angular
 *    acceleration from rest, so it arrives at the release with the rate the
 *    flight keeps.
 * 2. Flight: the centre of mass follows the parabola of the velocity the wheel
 *    gave it at the release, and the arched body keeps turning at the release's
 *    rate, its kept angular momentum, until the centre comes down to the height
 *    it has standing arched at `LAND`. That rate is the one whose turn over
 *    that flight time brings the body from `RELEASE` to `LAND`, found by
 *    bisection, since the flight time itself grows with the rate the wheel
 *    throws the centre at.
 *
 * Landing, the feet are planted where they came down, the body absorbs and
 * rises to stand over the jump's `ABSORB` and `RISE` seconds while its tip
 * comes up from `LAND`, the arched landing of the skill, with the root carrying
 * the touchdown velocity out.
 *
 * A rate past the salto's bound (`salto.RATE`) is refused. With the hands on a
 * prop's `surface` the same law is the vault (`vault`).
 *
 * First pass: the body is rigid through the flight (no repulsion from the
 * shoulders, no change of shape), so its pitch rate and its centre's speed are
 * tied by the wheel's radius and the flight is longer and faster than a
 * gymnast's, who shortens the body and pushes off the hands; the hands and feet
 * are carried by the shape and not laid flat by a solve.
 *
 * Events: `handsDown`, `release` (the hands leave), `touchdown`, `settled` and
 * `relax`.
 */
export namespace handspring {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "handspring";

  /**
   * Cancel table: from the end, into standing, walking, another handspring or a
   * salto.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      walk: ["fromRelax", "smooth"],
      handspring: ["fromRelax", "smooth"],
      salto: ["fromRelax", "smooth"],
    });

  /**
   * The angle by which the lunge is reached, degrees of forward tip
   * (provisional).
   */
  export const REACH: number = 110;

  /**
   * The angle at which the hands leave, degrees of forward tip (provisional:
   * before the handstand, where the wheel still lifts the centre).
   */
  export const RELEASE: number = 145;

  /**
   * The tip at which the feet come down, degrees: arched, the trunk 30 degrees
   * behind upright (provisional).
   */
  export const LAND: number = 330;

  /**
   * The body-dependent lunge with the left leg leading, constructed by
   * `handspringKeys.lunged` with the law's existing provisional angles.
   */
  export const lunged: typeof handspringKeys.lunged = handspringKeys.lunged;

  /**
   * The body-dependent arched line of the wheel and flight, constructed by
   * `handspringKeys.arched` with the law's existing provisional angles.
   */
  export const arched: typeof handspringKeys.arched = handspringKeys.arched;

  /** The angle between two rows of the wheel's table, degrees. */
  const STEP: number = 5;

  /**
   * Plan a front handspring on the floor.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the hands do not come down before the release,
   *   or no rate up to the bound lands the body.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanHandspring.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    return over(context, {
      height: 0,
      support: { kind: "ground" },
      within: (): void => {},
    });
  }

  /**
   * Plan a front handspring whose hands land on a surface.
   *
   * @param context The action's context.
   * @param surface What the hands land on.
   * @param landingSurface Where the feet land. Omitted uses the entry's ground
   *   height.
   * @returns The plan.
   * @throws {HumanRefusal} When the hands do not come down before the release,
   *   come down off the surface, or no rate up to the bound lands the body.
   */
  export function over(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanHandspring.IParams>,
    surface: IAutoMovieMotionHumanHandspring.ISurface,
    landingSurface?: IAutoMovieMotionHumanHandspring.ISurface,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const model: IAutoMovieResolveCenterOfMass.IModel =
      GymnasticsFlight.model(body);
    const left: boolean = context.params.lead !== "right";
    const standing: IAutoMovieMotionHumanPosture = stand
      .plan({ ...context, params: { hold: 1 } })
      .posture(0);
    const yaw: number = standing.yaw;
    const ease: (x: number) => number = (x: number): number =>
      minimumJerk.share(x);
    const reached: IAutoMovieMotionHumanExerciseKey.IKey = left
      ? lunged(body)
      : ExerciseKey.mirror(lunged(body));
    const line: IAutoMovieMotionHumanExerciseKey.IKey = arched(body);
    const stood: IAutoMovieMotionHumanExerciseKey.IKey =
      ExerciseKey.standing(body);
    const entering: ReturnType<typeof ExerciseKey.prepareBlend> =
      ExerciseKey.prepareBlend(stood, reached);
    const arching: ReturnType<typeof ExerciseKey.prepareBlend> =
      ExerciseKey.prepareBlend(reached, line);
    const rising: ReturnType<typeof ExerciseKey.prepareBlend> =
      ExerciseKey.prepareBlend(line, stood);

    // The shape at an angle of forward tip.
    const shaped: (angle: number) => IAutoMovieMotionHumanPosture = (
      angle: number,
    ): IAutoMovieMotionHumanPosture => ({
      ...ExerciseKey.posed(
        angle <= REACH
          ? entering(ease(angle / REACH))
          : arching(ease((angle - REACH) / (RELEASE - REACH))),
        yaw,
      ),
      pitch: angle,
    });

    // The spokes: both feet, the leading foot, the other, both hands.
    const footBones: ReadonlySet<AutoMovieHumanoidBone> = new Set([
      "leftFoot",
      "rightFoot",
    ]);
    const entered: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(body, context.entry.pose, undefined, footBones);
    const ankle: number =
      (entered.get("leftFoot")!.worldPosition.y +
        entered.get("rightFoot")!.worldPosition.y) /
      2;
    const ground: IAutoMovieMotionHumanContactWindow.Support = {
      kind: "ground",
    };
    const riseOfMat: number =
      landingSurface === undefined
        ? 0
        : landingSurface.height - (ankle - body.measure.ankleHeight);
    const spokes: IAutoMovieMotionHumanGymnasticsWheel.ISpoke[] = [
      { bones: ["leftFoot", "rightFoot"], height: ankle, support: ground },
      {
        bones: [left ? "leftFoot" : "rightFoot"],
        height: ankle,
        support: ground,
      },
      {
        bones: [left ? "rightFoot" : "leftFoot"],
        height: ankle,
        support: ground,
      },
      {
        bones: ["leftHand", "rightHand"],
        height: surface.height + GymnasticsWheel.laid(body),
        support: surface.support,
      },
    ];
    const hands: number = 3;
    const wheel: IAutoMovieMotionHumanGymnasticsWheel.IWheel =
      GymnasticsWheel.roll({
        body,
        shaped,
        spokes,
        start: standing.root,
        until: RELEASE,
        step: STEP,
      });
    const placedAt: (angle: number) => IAutoMovieMotionHumanPosture = (
      angle: number,
    ): IAutoMovieMotionHumanPosture => ({
      ...shaped(angle),
      root: wheel.root(angle),
    });

    // The hands must bear by the release, on the surface.
    const down: IAutoMovieMotionHumanGymnasticsWheel.IRow | undefined =
      wheel.rows.find(
        (row: IAutoMovieMotionHumanGymnasticsWheel.IRow): boolean =>
          row.bears === hands,
      );
    if (down === undefined || wheel.rows.at(-1)!.bears !== hands)
      throw new HumanRefusal({
        kind: "reach",
        axis: "hands",
        value: surface.height,
        reason: `the hands do not bear on a surface ${surface.height.toFixed(2)} m high by the release at ${RELEASE} degrees of tip`,
        fix: "lower the surface, or place the hands' support where the lunge reaches",
      });
    const placing: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      StrikingBody.trunk(
        body,
        placedAt(down.angle),
        undefined,
        new Set<AutoMovieHumanoidBone>(["leftHand", "rightHand"]),
      );
    surface.within(
      Vector3.lerp(
        placing.get("leftHand")!.worldPosition,
        placing.get("rightHand")!.worldPosition,
        0.5,
      ),
    );

    // The release: the centre and its change with the angle, per degree.
    const launch: IOverLaunch = ((): IOverLaunchResult => {
      const read: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution();
      const projection: ReturnType<typeof prepareHumanPostureProjection> =
        prepareHumanPostureProjection(body);
      const centre: IAutoMovieVector3 = GymnasticsFlight.centre(
        body,
        model,
        placedAt(RELEASE),
        read,
        projection,
      );
      return {
        centre,
        slope: Vector3.subtract(
          centre,
          GymnasticsFlight.centre(
            body,
            model,
            placedAt(RELEASE - 1),
            read,
            projection,
          ),
        ),
      };
    })();
    const cr: IAutoMovieVector3 = launch.centre;
    const slope: IAutoMovieVector3 = launch.slope;

    // The landing's centre height: the arched body at `LAND` stood on its
    // ankles.
    const landing: IAutoMovieMotionHumanPosture = {
      ...ExerciseKey.posed(line, yaw),
      pitch: LAND,
    };
    const feet: IAutoMovieVector3 = ExerciseKey.mean(body, landing, [
      "leftFoot",
      "rightFoot",
    ]);
    const standingOn: IAutoMovieMotionHumanPosture = {
      ...landing,
      root: { x: 0, y: ankle + riseOfMat - feet.y, z: 0 },
    };
    const height: number = GymnasticsFlight.centre(body, model, standingOn).y;

    // The rate, degrees a second, whose turn over the fall time reaches the
    // landing tip.
    const turn: number = LAND - RELEASE;
    const miss: (rate: number) => number = (rate: number): number => {
      const t: number | null = GymnasticsFlight.fall(
        cr.y,
        slope.y * rate,
        height,
      );
      return t === null ? -turn : rate * t - turn;
    };
    // No rate the body can turn at (the salto's bound) lands it: the turn it
    // makes at the bound falls short. A higher top to push from gives the
    // flight more time; the floor has no other surface, so a floor
    // handspring is refused on the base it is thrown from.
    const bound: number = salto.RATE * 360;
    const boundMiss: number = miss(bound);
    if (boundMiss < 0) {
      const reached: number = boundMiss + turn;
      const prop: boolean = surface.support.kind === "prop";
      throw new HumanRefusal({
        kind: prop ? "reach" : "base",
        axis: prop ? "on" : "base",
        value: prop ? surface.height : reached,
        feasible: prop
          ? {
              kind: "range",
              minimum: surface.height,
              maximum: null,
              unit: "m",
              open: "minimum",
            }
          : { kind: "range", minimum: turn, maximum: null, unit: "degrees" },
        reason: `turning at its fastest, ${bound} degrees a second, the body turns ${reached.toFixed(0)} of the ${turn} degrees from ${RELEASE} to ${LAND} before its centre comes down${prop ? `, pushing from a top ${surface.height.toFixed(2)} m high` : " from the floor"}`,
        fix: prop
          ? "vault from a higher top, whose push gives the flight the time to turn"
          : "throw it over a vault's top (`vault`), whose push gives the flight the time to turn, or answer with a round-off or a salto",
      });
    }
    let low: number = 1;
    let high: number = bound;
    for (let i: number = 0; i < 40; i++) {
      const middle: number = (low + high) / 2;
      if (miss(middle) < 0) low = middle;
      else high = middle;
    }
    const rate: number = high;
    const velocity: IAutoMovieVector3 = Vector3.scale(slope, rate);
    const flight: number = GymnasticsFlight.fall(cr.y, velocity.y, height)!;

    // Timing: constant angular acceleration from rest to the release's rate.
    const support: number = (2 * RELEASE) / rate;
    const touchdown: number = support + flight;
    const settled: number = touchdown + jump.ABSORB;
    const duration: number = settled + jump.RISE;
    const angleAt: (t: number) => number = (t: number): number =>
      RELEASE * Math.min(1, t / support) ** 2;
    const share: (angle: number) => number = (angle: number): number =>
      (support * Math.sqrt(angle / RELEASE)) / duration;

    // The flight posture at seconds since the release.
    const placeFlight: ReturnType<typeof prepareGymnasticsPlacement> =
      prepareGymnasticsPlacement(body, model, ExerciseKey.posed(line, yaw));
    const flying: (t: number) => IAutoMovieMotionHumanPosture = (
      t: number,
    ): IAutoMovieMotionHumanPosture =>
      placeFlight(
        { yaw: yaw + line.yaw, pitch: RELEASE + rate * t, roll: line.roll },
        GymnasticsFlight.at(cr, velocity, t),
      );

    const after: ReturnType<typeof handspringLanding> = handspringLanding({
      body,
      standing,
      entered,
      footBones,
      landingSurface,
      riseOfMat,
      yaw,
      flying,
      flight,
      rising,
      ease,
      land: LAND,
    });

    const contacts: IAutoMovieMotionHumanContactWindow[] = [
      ...GymnasticsWheel.contacts(wheel, spokes, share),
      ...(["leftFoot", "rightFoot"] as const).map(
        (part: OverContactsPart): IAutoMovieMotionHumanContactWindow => ({
          part,
          kind: "plant",
          from: touchdown / duration,
          to: 1,
          support: landingSurface?.support ?? ground,
        }),
      ),
    ];
    const events: IAutoMovieMotionEvent[] = [
      { name: "handsDown", share: share(down.angle) },
      { name: "release", share: support / duration },
      { name: "touchdown", share: touchdown / duration },
      { name: "settled", share: settled / duration },
      { name: "relax", share: 1 },
    ];
    const result: IAutoMovieMotionHumanActionPlan = {
      duration,
      events,
      contacts,
      contact: touchdown,
      posture: (
        seconds: number,
        _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      ): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        if (t < support) return placedAt(angleAt(t));
        if (t < touchdown) return flying(t - support);
        return after(t - touchdown, resolution);
      },
    };

    // Later branches own their opening second, as in the public reader.
    HumanPreparedPlayback.attach(result, body, {
      mode: "posture",
      phases: [
        {
          from: touchdown,
          to: duration,
          sample: (
            seconds: number,
            _channels?: Parameters<
              IAutoMovieMotionHumanActionPlan["posture"]
            >[1],
            resolution?: Parameters<
              IAutoMovieMotionHumanActionPlan["posture"]
            >[2],
          ): IAutoMovieMotionHumanPlayback.ISample => ({
            posture: after(seconds - touchdown, resolution),
          }),
        },
        {
          from: support,
          to: touchdown,
          sample: (seconds: number): IAutoMovieMotionHumanPlayback.ISample => ({
            posture: flying(seconds - support),
          }),
        },
        {
          from: 0,
          to: support,
          sample: (seconds: number): IAutoMovieMotionHumanPlayback.ISample => ({
            posture: placedAt(angleAt(seconds)),
          }),
        },
      ],
    });
    return result;
  }
}

/** The alternatives of `OverContactsPart`'s site. */
type OverContactsPart = "leftFoot" | "rightFoot";

/** The record of `IOverLaunchResult`'s site. */
type IOverLaunchResult = {
  centre: IAutoMovieVector3;
  slope: IAutoMovieVector3;
};

/** The record of `IOverLaunch`'s site. */
type IOverLaunch = { centre: IAutoMovieVector3; slope: IAutoMovieVector3 };
