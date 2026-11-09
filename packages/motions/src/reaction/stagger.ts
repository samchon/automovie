import { Vector3, minimumJerk } from "@automovie/engine";
import type { AutoMovieMotionTarget, IAutoMovieMotionEvent, IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { HumanFoot } from "../posture/HumanFoot";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { StrikingStance } from "../striking/StrikingStance";
import { StrikingTarget } from "../striking/StrikingTarget";

/**
 * A stagger: a blow pushes the centre of mass past the base of support and
 * one unplanned step catches it.
 *
 * The step follows the extrapolated centre of mass (Hof, Gazendam and Sinke
 * 2005, J Biomech 38:1): a body moving at `v` over a pendulum of length `l`
 * stays balanced only if the base reaches `x + v / omega0`, `omega0 =
 * sqrt(g / l)`, so the stepping foot lands that far along the push from the
 * centre of mass plus the foot's own half length as margin, and the root
 * travels there and settles. The pendulum length is the hip height, a
 * standing body's centre-of-mass height to a few centimetres (Winter,
 * Biomechanics and Motor Control of Human Movement, ch. 4). The stepping foot
 * is the one whose step crosses least: the foot on the push's side, or the
 * rear foot for a push backward. The step lands at 0.35 s, inside the 0.3 to
 * 0.4 s reactive-step times of perturbation studies (Maki and McIlroy 1997,
 * Phys Ther 77:488), and the body settles by 0.8 s.
 *
 * A push whose capture step would exceed one leg length cannot be caught in
 * one step; the law rejects it, naming the knockdown instead.
 */
export namespace stagger {
  /** The action's name. */
  export const name: HumanActionName = "stagger";

  /** Cancel table: a stagger flows into a guard or a knockdown. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    guard: [{ window: ["caught", 1], kind: "inertialize", entry: 0, blend: 0.15 }],
    knockdown: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.1 }],
  };

  /** Parameters. */
  export interface IParams {
    /** Where the blow comes from: the body is pushed away from it. */
    from: AutoMovieMotionTarget;

    /** The centre of mass's speed after the blow, m/s. */
    speed: number;
  }

  /** The capture step's landing, seconds (Maki and McIlroy 1997). */
  export const LANDING: number = 0.35;

  /** The whole stagger, seconds. */
  export const DURATION: number = 0.8;

  /**
   * The capture step's length from the centre of mass: the extrapolated
   * centre of mass's lead `v / sqrt(g / l)` plus a margin.
   *
   * @param speed The centre of mass's speed, m/s.
   * @param height The pendulum length, metres.
   * @param margin The margin beyond the extrapolated centre, metres.
   * @returns Metres.
   */
  export function capture(speed: number, height: number, margin: number): number {
    return speed / Math.sqrt(9.81 / height) + margin;
  }

  /**
   * Plan a stagger.
   *
   * @param context The action's context.
   * @returns The plan.
   */
  export function plan(context: IHumanActionContext<IParams>): IHumanActionPlan {
    const p: IParams = context.params;
    if (!(p.speed > 0)) throw new Error("A stagger's speed is positive");
    const body = context.body;
    const m = body.measure;
    const reach: number = capture(p.speed, m.hipHeight, m.footLength / 2);
    if (reach > m.thigh + m.shank) throw new Error(`A ${p.speed} m/s push needs a ${reach.toFixed(2)} m step, beyond one leg; use a knockdown`);
    const entry: IHumanPosture = context.entry.posture;
    const lead: "left" | "right" = StrikingTarget.lead(context.entry);
    const feet: Record<"left" | "right", HumanFoot.IPlacement> = StrikingTarget.feet(context.entry);
    let built: { push: IAutoMovieVector3; stepper: "left" | "right"; landing: IAutoMovieVector3 } | undefined;
    const geometry = () => {
      if (built !== undefined) return built;
      const threat: IAutoMovieVector3 = context.aim(p.from, context.start).point;
      const d: IAutoMovieVector3 = { x: entry.root.x - threat.x, y: 0, z: entry.root.z - threat.z };
      const push: IAutoMovieVector3 = Vector3.length(d) > 1e-6 ? Vector3.normalize(d) : { x: 0, y: 0, z: -1 };
      const along = (side: "left" | "right"): number => Vector3.dot(Vector3.subtract(feet[side].ankle, entry.root), push);
      const stepper: "left" | "right" = along("left") > along("right") ? "left" : "right";
      const landing: IAutoMovieVector3 = Vector3.add(feet[stepper].ankle, Vector3.scale(push, Math.max(0, reach - along(stepper))));
      built = { push, stepper, landing };
      return built;
    };
    const events: IAutoMovieMotionEvent[] = [{ name: "caught", share: LANDING / DURATION }];
    return {
      duration: DURATION,
      events,
      get contacts(): IHumanContactWindow[] {
        const { stepper } = geometry();
        const other: "left" | "right" = stepper === "left" ? "right" : "left";
        return [
          { part: `${other}Foot`, kind: "plant", from: 0, to: 1, support: { kind: "ground" } },
          { part: `${stepper}Foot`, kind: "plant", from: LANDING / DURATION, to: 1, support: { kind: "ground" } },
        ];
      },
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(DURATION, Math.max(0, seconds));
        const { push, stepper, landing } = geometry();
        const s: number = minimumJerk(t / LANDING).s;
        const settle: number = minimumJerk(t / DURATION).s;
        const lift: number = 0.02 * m.stature * 4 * s * (1 - s);
        const moved: HumanFoot.IPlacement = { ankle: { ...Vector3.lerp(feet[stepper].ankle, landing, s), y: feet[stepper].ankle.y + (t < LANDING ? lift : 0) }, rotation: feet[stepper].rotation };
        const placed: Record<"left" | "right", HumanFoot.IPlacement> = stepper === "left" ? { left: moved, right: feet.right } : { left: feet.left, right: moved };
        const centre: IAutoMovieVector3 = Vector3.scale(Vector3.add(placed.left.ankle, placed.right.ankle), 0.5);
        const travel: number = Vector3.dot(Vector3.subtract({ ...centre, y: 0 }, { ...entry.root, y: 0 }), push);

        // The trunk tips with the push while the body is carried, and rights
        // itself once the step has caught it.
        const tip: number = 10 * (minimumJerk(t / (0.5 * LANDING)).s - minimumJerk((t - LANDING) / (DURATION - LANDING)).s);
        const r: number = (entry.yaw * Math.PI) / 180;
        const forward: IAutoMovieVector3 = { x: Math.sin(r), y: 0, z: Math.cos(r) };
        const left: IAutoMovieVector3 = { x: Math.cos(r), y: 0, z: -Math.sin(r) };
        const posture: IHumanPosture = {
          root: Vector3.add(entry.root, Vector3.scale(push, Math.max(0, travel) * settle)),
          yaw: entry.yaw,
          pitch: entry.pitch + tip * Vector3.dot(push, forward),
          roll: entry.roll - tip * Vector3.dot(push, left),
          joints: { ...entry.joints, ...StrikingStance.joints() },
          limbs: StrikingStance.legs(body, placed, { left: stepper !== "left" || t >= LANDING, right: stepper !== "right" || t >= LANDING }),
        };
        return { ...posture, limbs: { ...posture.limbs, ...StrikingStance.guard(body, posture, { lead }) } };
      },
    };
  }
}
