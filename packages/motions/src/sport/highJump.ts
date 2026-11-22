import {
  AutoMovieGravity,
  Vector3,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanGymnasticsTakeoff,
  IAutoMovieMotionHumanHighJump,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { ExerciseKey } from "../exercise/ExerciseKey";
import { lieDown } from "../floor/lieDown";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { knockdown } from "../reaction/knockdown";
import { AthleticsRunUp } from "./AthleticsRunUp";
import { GymnasticsFlight } from "./GymnasticsFlight";
import { GymnasticsMat } from "./GymnasticsMat";
import { GymnasticsTakeoff } from "./GymnasticsTakeoff";
import { highJumpBar } from "./highJumpBar";
import { highJumpFlight } from "./highJumpFlight";
import { prepareGymnasticsFrame } from "./prepareGymnasticsFrame";

/**
 * A high jump in the Fosbury flop (#3377): a one-foot take-off, a half turn
 * that puts the back to the bar, a backward lay-out over it with the back
 * arched, the legs lifted after the hips pass, and a landing on the back.
 * The author may name the final support foot of an incoming approach
 * (World Athletics TR27). The foot must already be planted.
 *
 * The take-off is the jump's push-off (`GymnasticsTakeoff`), aimed so the
 * centre of mass peaks at the bar axis plus the authored reserve. It comes
 * down at the landing place at the height it has lying on its back there.
 * The flight is ballistic in the centre of mass (`GymnasticsFlight`), and its rotation runs
 * through the whole flight from the take-off, as the angular momentum a flop
 * builds during the take-off (Dapena 1980, "Mechanics of rotation in the
 * Fosbury-flop", Med Sci Sports Exerc 12:45-53: most of the somersault's
 * angular momentum is made on the ground) is kept in the air: the half turn
 * about the vertical eased over the whole rise, so the back is to the bar at
 * the apex, and the backward somersault about the body's left axis eased in
 * over the first half of the rise and then at a constant rate, level at the
 * apex and kept to the touchdown. The two overlap from the take-off on; turning them one after
 * the other, each in a fraction of the rise, spun the body upright to
 * inverted in a frame or two.
 * The arch is keyed: the joints go from the take-off's to `arched` at the
 * apex and to `piked`, the legs lifted, after it. The body comes down when
 * the lowest of its shapes reaches the landing surface, and lies on its
 * back there (`GymnasticsMat`).
 *
 * The bar is the scene's high jump, a prop whose `bar` affordance is the
 * crossbar (`createHighJump`'s). Its axis is read where the prop stands at
 * the action's start. The requested apex must exceed the take-off centre
 * and fit within the vertical take-off speed bound `RISE`. The horizontal
 * take-off speed is not stated: it follows from the landing place the
 * author gives, which world-class finalists reach leaving the floor at
 * 4.14 ± 0.37 m/s (the same table of Nicholson et al. 2022).
 *
 * A run-up is a `run`, curved by its `via` points, cut at the take-off
 * foot's footfall (`accepts`). The take-off foot is then the one the run has
 * planted, it must be the foot farther from the bar (`highJumpBar.admit`),
 * and the landing place may ask for no more horizontal take-off speed than
 * the run-up brings: a plant trades run-up speed for lift.
 *
 * First pass: no lean into the curve or the take-off; the arms do
 * not lead; the angular momentum appears at the take-off instead of being
 * built over the push; the apex falls where the landing place puts it, the
 * crossbar's plane can be reached before or after that apex. The
 * `barCrossing` event records the centre's passage within the physical
 * span, when present. The push-off's own flight, which
 * aims the take-off, leaves 20 to 24 mm from its take-off pose, so the flight
 * starts from that pose's centre with the vertical speed for the requested
 * apex, and the body does not step at the take-off.
 *
 * Events: `takeoff`, `apex`, optional `barCrossing`, `touchdown`, `settled`, `relax`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the figure, the take-off's aim, the flight's physics, the one-axis turns and the follow-up, the keyed arch, the landing, the bar's place, the refusals and the first pass.
 * @evidence contracts/development/design.md#principled-representation The jump's push-off, a parabola from it and a posture of joints turned and placed on it; the rates follow from the flight time.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the bound, the turn's share, the keyed postures, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The actual bar sets the crossing geometry. The authored reserve and landing place set the flight with its launch bounds.
 */
export namespace highJump {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "highJump";

  /** Cancel table: once lying, into rising. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      rise: ["fromRelax", "smooth"],
    });

  /** What may be cut into a high jump: a run, at the take-off foot's footfall (`AthleticsRunUp`). */
  export const accepts: IAutoMovieMotionHumanActionLaw["accepts"] = {
    run: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.15 }],
  };

  /**
   * The greatest vertical take-off speed, m/s: the world-class men's mean
   * plus two standard deviations, 4.65 + 2 × 0.20 (Nicholson, Jongerius,
   * Tucker, Thomas, Merlino and Bissas 2022, "The Association Between
   * Hip-Shoulder Separation Angles and Technique Characteristics in
   * World-Class High Jumpers", Front. Sports Act. Living 4:873526, Table 3:
   * the 29 finalists of the 2017 and 2018 World Championships, vertical
   * centre-of-mass velocity at take-off 4.65 ± 0.20 m/s for the men and
   * 3.96 ± 0.17 for the women). The two deviations are this law's choice,
   * so a bar the best measured jumpers clear is never refused.
   */
  export const RISE: number = 5.05;

  /**
   * The arch over the bar on a body: the back and the hips extended, the
   * head back, the knees bent, the arms by the sides (provisional angles).
   *
   * @param body The body.
   * @returns The key.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the shape and that its angles are provisional.
   * @evidence contracts/development/implementation.md#principled-implementation An exercise key on the body (`ExerciseKey.from`), so what it leaves unstated is the body's own standing.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One key.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `ExerciseKey.from`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function arched(
    body: IAutoMovieMotionHumanBody,
  ): IAutoMovieMotionHumanExerciseKey.IKey {
    return ExerciseKey.from(
      body,
      { spine: [-25, 0, 0], chest: [-20, 0, 0], neck: -30 },
      { hip: -20, knee: 80, ankle: -20, shoulder: 10, raise: 15, elbow: 20 },
    );
  }

  /**
   * The legs lifted clear after the hips pass, on a body (provisional
   * angles).
   *
   * @param body The body.
   * @returns The key.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the shape and that its angles are provisional.
   * @evidence contracts/development/implementation.md#principled-implementation An exercise key on the body (`ExerciseKey.from`), so what it leaves unstated is the body's own standing.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One key.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `ExerciseKey.from`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function piked(
    body: IAutoMovieMotionHumanBody,
  ): IAutoMovieMotionHumanExerciseKey.IKey {
    return ExerciseKey.from(
      body,
      { spine: [10, 0, 0], neck: 30 },
      { hip: 80, knee: 10, ankle: -20, shoulder: 10, raise: 15, elbow: 20 },
    );
  }

  /**
   * The crossbar's height: its `bar` affordance's axis on the high jump's
   * prop, where the prop stands at the action's start.
   *
   * @param context The action's context.
   * @param subject The high jump's prop subject.
   * @returns World metres.
   * @throws {HumanRefusal} When the prop declares no `bar`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read, where and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The affordance's translation carried into the world by the prop's frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup and the demanded Y component of the same rigid transform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing bar is refused with the prop's contacts, never replaced by a number.
   * @evidence contracts/development/implementation.md#efficient-algorithms A first-match affordance scan and one world frame read resolve the bar.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the same bar reader as the flight's plane-crossing query.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function crossbar(
    context: Pick<IAutoMovieMotionHumanActionContext, "prop" | "start">,
    subject: string,
  ): number {
    return highJumpBar.of(context, subject).point.y;
  }

  /**
   * Plan a high jump.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the high jump declares no bar, the bar is no higher than the take-off's centre, needs a take-off speed past `RISE`, or leaves the body no higher than the landing surface at the apex, when a run-up is cut where no take-off foot is planted or plants the foot nearer the bar, when the landing place asks for more horizontal speed than the run-up brings, or when the jump refuses its push-off.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The vertical launch is sqrt(2 g (bar - centre)), the fall time to the lying centre's height closes the horizontal launch, the turns are constant rates over their phases, and the touchdown is the bisected instant the lowest shape meets the surface.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The lying height, the take-off, the flight posture, the touchdown, the landing, then the posture by phase.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every bound refuses with its numbers; nothing is clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four jump plans and all touchdown bisection stations remain. One actual take-off canonical solve supplies both COM and frozen joints. Each changing flight query shares its actual COM/floor map; playback omits unused bounds, and synchronous ROM/FK metadata share only prerequisites. No sample changes and speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Existing take-off/flight/mat owners share two fixed key-pair preparations. The ascending key blend and yaw share the same current clipped cubic progress. The initial lying floor/COM observations borrow one local FK/projector source; each changing flight shape shares its own actual COM/floor map without a time memo. Raw callbacks forward only synchronous parent FK/projector loans through take-off, dynamic flight and landing, retaining full current joint projection.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains take-off, mass model and two fixed key-pair readers. Query frame, bones and floor reader release on return/throw; borrowed FK/projector loans stay with their synchronous caller and never enter the plan, floor closure or previous-query state.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanHighJump.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const model: IAutoMovieResolveCenterOfMass.IModel =
      GymnasticsFlight.model(body);
    const prepareFrame: ReturnType<typeof prepareGymnasticsFrame> =
      prepareGymnasticsFrame(body, model);
    const p: IAutoMovieMotionHumanHighJump.IParams = context.params;
    const surface: number = p.to.y;
    const cross: highJumpBar.IBar = highJumpBar.of(context, p.bar);
    const bar: number = cross.point.y;
    const reserve: number = HumanBound.least(
      "apexReserve",
      p.apexReserve ?? 0,
      0,
      "m",
    );
    const apex: number = bar + reserve;

    // A jump cut from a run (`AthleticsRunUp`) takes off from the foot
    // farther from the bar (`highJumpBar.admit`).
    const approach: AthleticsRunUp.IApproach | undefined = AthleticsRunUp.of(
      context,
      0,
      "takeoffFoot",
      p.takeoffFoot,
    );
    if (approach !== undefined) highJumpBar.admit(cross, approach);
    /** Bound the requested apex against the observed takeoff centre. */
    const riseFrom: (height: number) => number = (height: number): number => {
      HumanBound.above("bar", bar, height - reserve, "m");
      const speed: number = Math.sqrt(
        2 * AutoMovieGravity.STANDARD * (apex - height),
      );
      if (speed > RISE) {
        const ceiling: number =
          height + (RISE * RISE) / (2 * AutoMovieGravity.STANDARD);
        if (reserve > 0 && ceiling >= bar)
          HumanBound.within("apexReserve", reserve, 0, ceiling - bar, "m");
        throw new HumanRefusal({
          kind: "parameter",
          axis: "bar",
          value: bar,
          feasible: {
            kind: "range",
            minimum: height - reserve,
            maximum: ceiling - reserve,
            unit: "m",
            open: "minimum",
          },
          reason: `the requested apex at ${apex.toFixed(2)} m needs a vertical take-off speed of ${speed.toFixed(2)} m/s, past ${RISE}`,
          fix: "lower the bar or reduce the apex reserve",
        });
      }
      return speed;
    };

    // The centre's height lying on the back on the surface.
    const supine: IAutoMovieMotionHumanPosture = {
      root: { x: 0, y: 0, z: 0 },
      yaw: context.entry.posture.yaw,
      pitch: lieDown.POSES.supine.pitch,
      roll: 0,
      joints: lieDown.POSES.supine.joints,
      limbs: {},
    };
    const lying: number =
      surface +
      ((): number => {
        const read: ReturnType<typeof prepareHumanPoseResolution> =
          prepareHumanPoseResolution();
        const projection: ReturnType<typeof prepareHumanPostureProjection> =
          prepareHumanPostureProjection(body);
        return GymnasticsFlight.centre(
          body,
          model,
          {
            ...supine,
            root: {
              x: 0,
              y: knockdown.rest(body, supine, read, projection),
              z: 0,
            },
          },
          read,
          projection,
        ).y;
      })();

    // The take-off: the centre reaches the requested apex and comes down at the
    // landing place at its lying height.
    const takeoff: IAutoMovieMotionHumanGymnasticsTakeoff.ITakeoff =
      GymnasticsTakeoff.of(
        context,
        (centre: IAutoMovieVector3): IAutoMovieVector3 => {
          const vy: number = riseFrom(centre.y);
          const time: number = GymnasticsFlight.fall(centre.y, vy, lying)!;
          return {
            x: (p.to.x - centre.x) / time,
            y: vy,
            z: (p.to.z - centre.z) / time,
          };
        },
        p.takeoffFoot ?? approach?.foot,
      );
    const off: number = takeoff.seconds;
    // The flight leaves from the take-off posture's own centre, so the body
    // does not step at the take-off where the push-off's flight, which the
    // launch is read from, does not meet its take-off pose. Its vertical
    // speed takes that centre to the requested apex.
    const launchFrame: {
      posture: IAutoMovieMotionHumanPosture;
      centre: IAutoMovieVector3;
    } = ((): {
      posture: IAutoMovieMotionHumanPosture;
      centre: IAutoMovieVector3;
    } => {
      const read: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution();
      const projection: ReturnType<typeof prepareHumanPostureProjection> =
        prepareHumanPostureProjection(body);
      const frozen: ReturnType<typeof GymnasticsFlight.freeze> =
        GymnasticsFlight.freeze(
          body,
          takeoff.plan.posture(off, undefined, read, projection),
          read,
          projection,
        );
      return {
        posture: frozen.posture,
        centre: resolveAutoMovieCenterOfMass.place(
          model,
          body.colliderBones.map(frozen.pose, read()),
        ),
      };
    })();
    const from: IAutoMovieMotionHumanPosture = launchFrame.posture;
    const c0: IAutoMovieVector3 = launchFrame.centre;
    const v: IAutoMovieVector3 = {
      ...takeoff.velocity,
      y: riseFrom(c0.y),
    };
    const rising: number = v.y / AutoMovieGravity.STANDARD;

    // A plant converts run-up speed into lift and loses horizontal speed
    // (world-class finalists leave at 4.14 m/s from faster approaches,
    // Nicholson et al. 2022, Table 3), so the landing place may not ask for
    // more horizontal speed than the approach brings.
    const across: number = Math.hypot(v.x, v.z);
    if (approach !== undefined && across > approach.speed)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "to",
        value: across,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: approach.speed,
          unit: "m/s",
        },
        reason: `the landing place asks for ${across.toFixed(2)} m/s across the floor at the take-off, more than the ${approach.speed.toFixed(2)} m/s the approach brings`,
        fix: "land nearer the take-off, or run the approach faster",
      });

    const { flying, down }: ReturnType<typeof highJumpFlight> = highJumpFlight({
      body,
      from,
      arch: arched(body),
      pike: piked(body),
      prepareFrame,
      c0,
      v,
      rising,
      surface,
      bar,
    });
    const landing: ReturnType<typeof GymnasticsMat.lie> = GymnasticsMat.lie({
      body,
      model,
      from: flying(down),
      velocity: { x: v.x, y: v.y - AutoMovieGravity.STANDARD * down, z: v.z },
      height: surface,
    });

    const touchdown: number = off + down;
    const settled: number = touchdown + GymnasticsMat.SETTLE;
    const duration: number = settled + GymnasticsMat.HOLD;
    const contacts: IAutoMovieMotionHumanContactWindow[] = [
      ...GymnasticsTakeoff.contacts(takeoff, duration),
      {
        part: "back",
        kind: "lie",
        from: touchdown / duration,
        to: 1,
        support:
          p.on === undefined
            ? { kind: "ground" }
            : { kind: "prop", subject: p.on },
      },
    ];
    const events: IAutoMovieMotionEvent[] = [
      { name: "takeoff", share: off / duration },
      { name: "apex", share: (off + rising) / duration },
      { name: "touchdown", share: touchdown / duration },
      { name: "settled", share: settled / duration },
      { name: "relax", share: settled / duration },
    ];
    // A ballistic flight has constant horizontal velocity, so the plane
    // time is exact even when the authored apex falls before or after it.
    const normal: IAutoMovieVector3 = {
      x: -cross.axis.z,
      y: 0,
      z: cross.axis.x,
    };
    const speed: number = Vector3.dot(v, normal);
    if (cross.length !== undefined && Math.abs(speed) > 1e-6) {
      const away: IAutoMovieVector3 = Vector3.subtract(cross.point, c0);
      const seconds: number = Vector3.dot(away, normal) / speed;
      const axis: IAutoMovieVector3 = { ...cross.axis, y: 0 };
      const along: number = Vector3.dot(
        Vector3.subtract(Vector3.scale(v, seconds), away),
        axis,
      );
      if (
        seconds > 0 &&
        off + seconds < touchdown &&
        Math.abs(along) <= (cross.length * Vector3.dot(axis, axis)) / 2
      ) {
        events.push({ name: "barCrossing", share: (off + seconds) / duration });
        events.sort(
          (a: IAutoMovieMotionEvent, b: IAutoMovieMotionEvent): number =>
            a.share - b.share,
        );
      }
    }
    return {
      duration,
      events,
      contacts,
      contact: off + rising,
      base: { kind: "lying" },
      posture: (
        seconds: number,
        channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        if (t <= off)
          return takeoff.plan.posture(t, channels, resolution, projection);
        if (t < touchdown) return flying(t - off, resolution, projection);
        return landing(t - touchdown, resolution, projection);
      },
    };
  }
}
