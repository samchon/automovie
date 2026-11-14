import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionKey } from "../HumanActionKey";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { ExerciseKey } from "../exercise/ExerciseKey";
import { lieDown } from "../floor/lieDown";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanProp } from "../perform/IHumanProp";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { knockdown } from "../reaction/knockdown";
import { GymnasticsFlight } from "./GymnasticsFlight";
import { GymnasticsMat } from "./GymnasticsMat";
import { GymnasticsTakeoff } from "./GymnasticsTakeoff";

/**
 * A high jump in the Fosbury flop (#3377): a one-foot take-off, a half turn
 * that puts the back to the bar, a backward lay-out over it with the back
 * arched, the legs lifted after the hips pass, and a landing on the back.
 *
 * The take-off is the jump's push-off (`GymnasticsTakeoff`), aimed so the
 * centre of mass peaks at the bar's height and comes down at the landing
 * place at the height it has lying on its back there. The flight is
 * ballistic in the centre of mass (`GymnasticsFlight`), and its rotation runs
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
 * The arch is keyed: the joints go from the take-off's to `ARCHED` at the
 * apex and to `PIKED`, the legs lifted, after it. The body comes down when
 * the lowest of its shapes reaches the landing surface, and lies on its
 * back there (`GymnasticsMat`).
 *
 * The bar is the scene's high jump, a prop whose `bar` affordance is the
 * crossbar (`createHighJump`'s): the centre of mass peaks at its axis's
 * height, read where the prop stands at the action's start. A prop without
 * a `bar` is refused, and so is a bar no higher than the take-off's centre,
 * or one that needs a vertical take-off speed past `RISE`. The horizontal
 * take-off speed is not stated: it follows from the landing place the
 * author gives, which world-class finalists reach leaving the floor at
 * 4.14 ± 0.37 m/s (the same table of Nicholson et al. 2022).
 *
 * First pass: no curved run-up and no lean into the take-off; the arms do
 * not lead; the angular momentum appears at the take-off instead of being
 * built over the push; the apex falls where the landing place puts it, the
 * crossbar's place along the run unchecked. The push-off's own flight, which
 * aims the take-off, leaves 20 to 24 mm from its take-off pose, so the flight
 * starts from that pose's centre with the vertical speed that peaks it at the
 * bar, and the body does not step at the take-off.
 *
 * Events: `takeoff`, `apex` (the bar), `touchdown`, `settled`, `relax`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the figure, the take-off's aim, the flight's physics, the one-axis turns and the follow-up, the keyed arch, the landing, the bar's place, the refusals and the first pass.
 * @evidence contracts/development/design.md#principled-representation The jump's push-off, a parabola from it and a posture of joints turned and placed on it; the rates follow from the flight time.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the bound, the turn's share, the keyed postures, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The bar and the landing place are the author's; every speed and time follows from them.
 */
export namespace highJump {
  /** The action's name. */
  export const name: HumanActionKey = "highJump";

  /** Cancel table: once lying, into rising. */
  export const interrupts: IHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      rise: ["fromRelax", "smooth"],
    });

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

  /** The arch over the bar: the back and the hips extended, the head back, the knees bent, the arms by the sides (provisional angles). */
  export const ARCHED: ExerciseKey.IKey = ExerciseKey.of(
    { spine: [-25, 0, 0], chest: [-20, 0, 0], neck: -30 },
    { hip: -20, knee: 80, ankle: -20, shoulder: 10, raise: 15, elbow: 20 },
  );

  /** The legs lifted clear after the hips pass (provisional angles). */
  export const PIKED: ExerciseKey.IKey = ExerciseKey.of(
    { spine: [10, 0, 0], neck: 30 },
    { hip: 80, knee: 10, ankle: -20, shoulder: 10, raise: 15, elbow: 20 },
  );

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and default.
   * @evidence contracts/development/design.md#principled-representation The landing place, its support and the high jump whose crossbar is cleared.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The surface is a prop's subject id, as the jump's.
   */
  export interface IParams {
    /** Where the body comes down on its back, world metres: its height is the landing surface's, the floor's 0 or a mat's top. */
    to: IAutoMovieVector3;

    /** The prop landed on, its subject id; the floor when absent. */
    on?: string;

    /** The high jump's prop subject; its `bar` affordance is the crossbar, whose axis's height the centre of mass peaks at. */
    bar: string;
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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup and one transform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing bar is refused with the prop's contacts, never replaced by a number.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the prop's affordances.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function crossbar(
    context: Pick<IHumanActionContext, "prop" | "start">,
    subject: string,
  ): number {
    const read: IHumanActionContext.IProp = context.prop(subject);
    const found: IAutoMovieAffordance | undefined = (
      read.prop.affordances ?? []
    ).find((a: IAutoMovieAffordance): boolean => a.id === "bar");
    if (found === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "bar",
        value: subject,
        feasible: {
          kind: "alternatives",
          values: (read.prop.affordances ?? []).map(
            (a: IAutoMovieAffordance): string => a.id,
          ),
        },
        reason: `${subject} declares no crossbar named bar`,
        fix: "give the high jump's crossbar the id bar, as createHighJump does",
      });
    const frame: IHumanProp.IFrame = read.frame(context.start);
    return Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, found.frame.translation),
    ).y;
  }

  /**
   * Plan a high jump.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the high jump declares no bar, the bar is no higher than the take-off's centre, needs a take-off speed past `RISE`, or leaves the body no higher than the landing surface at the apex, or when the jump refuses its push-off.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The vertical launch is sqrt(2 g (bar - centre)), the fall time to the lying centre's height closes the horizontal launch, the turns are constant rates over their phases, and the touchdown is the bisected instant the lowest shape meets the surface.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The lying height, the take-off, the flight posture, the touchdown, the landing, then the posture by phase.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every bound refuses with its numbers; nothing is clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four jump plans, about fifteen flight postures for the touchdown, and two forward kinematics per evaluated second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the take-off, flight and mat kernels and `lieDown`'s supine posture.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the take-off plan and the mass model.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const model: GymnasticsFlight.Model = GymnasticsFlight.model(body);
    const p: IParams = context.params;
    const surface: number = p.to.y;
    const bar: number = crossbar(context, p.bar);

    // The centre's height lying on the back on the surface.
    const supine: IHumanPosture = {
      root: { x: 0, y: 0, z: 0 },
      yaw: context.entry.posture.yaw,
      pitch: lieDown.POSES.supine.pitch,
      roll: 0,
      joints: lieDown.POSES.supine.joints,
      limbs: {},
    };
    const lying: number =
      surface +
      GymnasticsFlight.centre(body, model, {
        ...supine,
        root: { x: 0, y: knockdown.rest(body, supine), z: 0 },
      }).y;

    // The take-off: the centre peaks at the bar and comes down at the
    // landing place at its lying height.
    const takeoff: GymnasticsTakeoff.ITakeoff = GymnasticsTakeoff.of(
      context,
      (centre: IAutoMovieVector3): IAutoMovieVector3 => {
        if (!(bar > centre.y))
          throw new HumanRefusal({
            kind: "parameter",
            axis: "bar",
            value: bar,
            feasible: {
              kind: "range",
              minimum: centre.y,
              maximum: null,
              unit: "m",
              open: "minimum",
            },
            reason: `the bar at ${bar.toFixed(2)} m is no higher than the take-off's centre of mass at ${centre.y.toFixed(2)} m`,
            fix: "raise the bar",
          });
        const vy: number = Math.sqrt(
          2 * GymnasticsFlight.G * (bar - centre.y),
        );
        if (vy > RISE)
          throw new HumanRefusal({
            kind: "parameter",
            axis: "bar",
            value: bar,
            feasible: {
              kind: "range",
              minimum: centre.y,
              maximum: centre.y + (RISE * RISE) / (2 * GymnasticsFlight.G),
              unit: "m",
            },
            reason: `a bar at ${bar.toFixed(2)} m needs a vertical take-off speed of ${vy.toFixed(2)} m/s, past ${RISE}`,
            fix: "lower the bar",
          });
        const time: number = GymnasticsFlight.fall(centre.y, vy, lying)!;
        return {
          x: (p.to.x - centre.x) / time,
          y: vy,
          z: (p.to.z - centre.z) / time,
        };
      },
    );
    const off: number = takeoff.seconds;
    // The flight leaves from the take-off posture's own centre, so the body
    // does not step at the take-off where the push-off's flight, which the
    // launch is read from, does not meet its take-off pose; its vertical
    // speed is the one that peaks that centre at the bar.
    const c0: IAutoMovieVector3 = GymnasticsFlight.centre(
      body,
      model,
      takeoff.plan.posture(off),
    );
    HumanBound.above("bar", bar, c0.y, "m");
    const v: IAutoMovieVector3 = {
      ...takeoff.velocity,
      y: Math.sqrt(2 * GymnasticsFlight.G * (bar - c0.y)),
    };
    const rising: number = v.y / GymnasticsFlight.G;
    const from: IHumanPosture = GymnasticsFlight.frozen(
      body,
      takeoff.plan.posture(off),
    );

    // The flight posture at seconds since the take-off: the joints keyed,
    // the half turn over the rise and the somersault through the flight
    // at constant rates from the take-off, the centre on its parabola.
    const start: ExerciseKey.IKey = {
      pitch: 0,
      roll: 0,
      yaw: 0,
      lift: 0,
      joints: from.joints,
    };
    const ease = (x: number): number => {
      const u: number = Math.min(1, Math.max(0, x));
      return u * u * (3 - 2 * u);
    };
    // The somersault eases in over the first half of the rise, as the turn
    // a take-off starts is not at full rate in its first instant, then runs
    // at the constant rate that lays the body level at the apex.
    const ramp: number = 0.5 * rising;
    const spin: number = 90 / (rising - ramp / 2);
    const somersault = (t: number): number =>
      t < ramp ? (spin * t * t) / (2 * ramp) : spin * (t - ramp / 2);
    const flying = (t: number): IHumanPosture => {
      const key: ExerciseKey.IKey =
        t <= rising
          ? ExerciseKey.blend(start, ARCHED, ease(t / rising))
          : ExerciseKey.blend(ARCHED, PIKED, ease((t - rising) / rising));
      return GymnasticsFlight.placed(
        body,
        model,
        {
          ...from,
          joints: key.joints,
          yaw: from.yaw + 180 * ease(t / rising),
          pitch: -somersault(t),
        },
        GymnasticsFlight.at(c0, v, t),
      );
    };

    // The touchdown: the lowest shape meets the surface on the way down.
    const lowest = (t: number): number =>
      GymnasticsFlight.lowest(body, flying(t));
    if (!(lowest(rising) > surface))
      throw new HumanRefusal({
        kind: "reach",
        axis: "bar",
        value: bar,
        reason: `at the apex the body's lowest point is at ${lowest(rising).toFixed(2)} m, no higher than the landing surface at ${surface.toFixed(2)} m`,
        fix: "raise the bar, or land on a lower surface",
      });
    const fallen: number = GymnasticsFlight.fall(c0.y, v.y, surface)!;
    const down: number = GymnasticsFlight.touchdown(
      rising,
      fallen,
      lowest,
      surface,
    );
    const landing: (seconds: number) => IHumanPosture = GymnasticsMat.lie({
      body,
      model,
      from: flying(down),
      velocity: { x: v.x, y: v.y - GymnasticsFlight.G * down, z: v.z },
      height: surface,
    });

    const touchdown: number = off + down;
    const settled: number = touchdown + GymnasticsMat.SETTLE;
    const duration: number = settled + GymnasticsMat.HOLD;
    const pushed: IHumanContactWindow = takeoff.plan.contacts[0]!;
    const contacts: IHumanContactWindow[] = [
      {
        ...pushed,
        from: 0,
        to: off / duration,
      },
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
    return {
      duration,
      events,
      contacts,
      contact: off + rising,
      base: { kind: "lying" },
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        if (t <= off) return takeoff.plan.posture(t);
        if (t < touchdown) return flying(t - off);
        return landing(t - touchdown);
      },
    };
  }
}
