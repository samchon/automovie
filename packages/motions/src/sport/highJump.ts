import type {
  IAutoMovieMotionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionKey } from "../HumanActionKey";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { ExerciseKey } from "../exercise/ExerciseKey";
import { lieDown } from "../floor/lieDown";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
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
 * ballistic in the centre of mass (`GymnasticsFlight`), and the body turns
 * about one axis at a time at a constant rate: first half round about the
 * vertical over the first `TWIST` of the rise, then backward about its left
 * axis so it lies level at the apex, a rate it keeps to the touchdown. The
 * twist and the somersault of a real flop overlap from the take-off on (the
 * figure's common description; no source read); taking them one after the
 * other is this law's simplification, and #3416 keeps the case of both at
 * once.
 * The arch is keyed: the joints go from the take-off's to `ARCHED` at the
 * apex and to `PIKED`, the legs lifted, after it. The body comes down when
 * the lowest of its shapes reaches the landing surface, and lies on its
 * back there (`GymnasticsMat`).
 *
 * The bar's place along the run is where the apex falls; the bar is not a
 * prop. A bar no higher than the take-off's centre is refused, and so is
 * one that needs a vertical take-off speed past `RISE`. The horizontal
 * take-off speed is not stated: it follows from the landing place the
 * author gives, which world-class finalists reach leaving the floor at
 * 4.14 ± 0.37 m/s (the same table of Nicholson et al. 2022).
 *
 * First pass: no curved run-up and no lean into the take-off; the arms do
 * not lead; the angular momentum appears at the take-off instead of being
 * built over the push.
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

  /** The share of the rise over which the half turn about the vertical is made (provisional). */
  export const TWIST: number = 0.5;

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
   * @evidence contracts/development/design.md#principled-representation The landing place, its support and the bar's height.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The surface is a prop's subject id, as the jump's.
   */
  export interface IParams {
    /** Where the body comes down on its back, world metres: its height is the landing surface's, the floor's 0 or a mat's top. */
    to: IAutoMovieVector3;

    /** The prop landed on, its subject id; the floor when absent. */
    on?: string;

    /** The bar's height, metres: the height the centre of mass peaks at. */
    bar: number;
  }

  /**
   * Plan a high jump.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the bar is no higher than the take-off's centre, needs a take-off speed past `RISE`, or leaves the body no higher than the landing surface at the apex, or when the jump refuses its push-off.
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
        if (!(p.bar > centre.y))
          throw new HumanRefusal({
            kind: "parameter",
            axis: "bar",
            value: p.bar,
            feasible: {
              kind: "range",
              minimum: centre.y,
              maximum: null,
              unit: "m",
              open: "minimum",
            },
            reason: `the bar at ${p.bar.toFixed(2)} m is no higher than the take-off's centre of mass at ${centre.y.toFixed(2)} m`,
            fix: "raise the bar",
          });
        const vy: number = Math.sqrt(
          2 * GymnasticsFlight.G * (p.bar - centre.y),
        );
        if (vy > RISE)
          throw new HumanRefusal({
            kind: "parameter",
            axis: "bar",
            value: p.bar,
            feasible: {
              kind: "range",
              minimum: centre.y,
              maximum: centre.y + (RISE * RISE) / (2 * GymnasticsFlight.G),
              unit: "m",
            },
            reason: `a bar at ${p.bar.toFixed(2)} m needs a vertical take-off speed of ${vy.toFixed(2)} m/s, past ${RISE}`,
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
    const c0: IAutoMovieVector3 = takeoff.centre;
    const v: IAutoMovieVector3 = takeoff.velocity;
    const rising: number = v.y / GymnasticsFlight.G;
    const twisted: number = TWIST * rising;
    const from: IHumanPosture = GymnasticsFlight.frozen(
      body,
      takeoff.plan.posture(off),
    );

    // The flight posture at seconds since the take-off: the joints keyed,
    // the half turn and then the lay-out at constant rates, the centre on
    // its parabola.
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
          yaw: from.yaw + 180 * Math.min(1, t / twisted),
          pitch: t <= twisted ? 0 : (-90 * (t - twisted)) / (rising - twisted),
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
        value: p.bar,
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
