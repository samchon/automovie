import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSurface,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanSurfaceGlide } from "./HumanSurfaceGlide";
import { pivotSurfaceFoot } from "./pivotSurfaceFoot";

/** Left and right legs fitted against the moving ice plane. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/** Canonical axes before the foot or carrier rotation. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
const CROSS: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

type Skate = IAutoMovieMotionHumanSurface.ISkateParams;
type Curl = IAutoMovieMotionHumanSurface.ICurlDeliveryParams;
type Plan = IAutoMovieMotionHumanActionPlan;
type Posture = IAutoMovieMotionHumanPosture;

/**
 * One ice glide with fitted runner edges, an optional step, or a low curling
 * delivery. The bilateral glide owns path, speed, entry and stopping. Ice
 * footwork owns each foot's support window and the point which a shoe or
 * blade rotates around. Instrumented short-track turns distinguish
 * stroke phases (van der Kruk et al., 2018,
 * https://doi.org/10.1080/14763141.2018.1441898). Curling delivery uses a
 * loaded flat leading shoe and a trailing forefoot as described by Hua et
 * al. (2025, Figure 2, https://doi.org/10.3389/fnhum.2025.1587118).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the two activities, shared path, independent contacts and measured reference stance.
 * @evidence contracts/development/design.md#principled-representation A rotated effector keeps its real contact pivot. A step separates the released foot's flight from the other foot's continuing load. The trailing curling shoe hinges on its ball.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Uses the existing glide sampler and changes only the authored ankle and pelvis goals of ice actions.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Optional pivots come from equipment geometry. Released skates lose their support windows and return at the moved endpoint.
 */
export namespace HumanIceGlide {
  /**
   * Add the registered skate's blade work to the shared glide path.
   *
   * @param context The skating route, selected blade edges and optional step.
   * @returns A glide with the actual edge goals and new step events.
   */
  export function skate(
    context: IAutoMovieMotionHumanActionContext<Skate>,
  ): Plan {
    const { edge, step }: Skate = context.params;
    const base: Plan = HumanSurfaceGlide.plan(context);
    if (edge === undefined && step === undefined) return base;
    if (edge !== undefined) {
      HumanBound.within("edge.degrees", edge.degrees, -90, 90, "deg");
      for (const side of SIDES) {
        const pivot: IAutoMovieVector3 = edge.pivots[side];
        if (![pivot.x, pivot.y, pivot.z].every(Number.isFinite))
          throw new HumanRefusal({
            kind: "parameter",
            axis: `edge.pivots.${side}`,
            value: pivot,
            feasible: null,
            reason: "the mounted runner's pivot must be finite",
            fix: "use the selected runner edge in the foot's coordinates",
          });
      }
    }
    if (step !== undefined) {
      HumanBound.least("step.window[0]", step.window[0], 0, "s");
      HumanBound.within(
        "step.window[1]",
        step.window[1],
        step.window[0],
        base.duration,
        "s",
        "minimum",
      );
      const span: number =
        context.body.measure.thigh + context.body.measure.shank;
      HumanBound.within("step.offset.x", step.offset.x, -span, span, "m");
      HumanBound.within("step.offset.z", step.offset.z, -span, span, "m");
      HumanBound.within(
        "step.clearance",
        step.clearance,
        0,
        span,
        "m",
        "minimum",
      );
    }
    const released: number = (step?.window[0] ?? 0) / base.duration;
    const acquired: number = (step?.window[1] ?? 0) / base.duration;
    return {
      ...base,
      events:
        step === undefined
          ? base.events
          : [
              ...base.events,
              { name: "bladeRelease", share: released },
              { name: "bladeAcquire", share: acquired },
            ].sort(
              (left: { share: number }, right: { share: number }): number =>
                left.share - right.share,
            ),
      contacts:
        step === undefined
          ? base.contacts
          : base.contacts.flatMap(
              (
                contact: IAutoMovieMotionHumanContactWindow,
              ): IAutoMovieMotionHumanContactWindow[] =>
                contact.part === `${step.side}Foot` && contact.kind === "bear"
                  ? [
                      { ...contact, to: released },
                      { ...contact, from: acquired },
                    ]
                  : [contact],
            ),
      posture: (at: number): Posture => {
        const posture: Posture = base.posture(at);
        const share: number = Math.min(1, Math.max(0, at / base.duration));
        const cant: number =
          edge === undefined
            ? 0
            : edge.degrees *
              minimumJerk.share(share / 0.2) *
              (context.params.stop === true
                ? 1 - minimumJerk.share((share - 0.65) / 0.35)
                : 1);
        const limbs: Posture["limbs"] = { ...posture.limbs };
        for (const side of SIDES) {
          const id: "leftLeg" | "rightLeg" = `${side}Leg`;
          const goal: IAutoMovieHumanLimbGoal = limbs[id]!;
          const canted: IAutoMovieHumanLimbGoal =
            edge === undefined
              ? goal
              : pivotSurfaceFoot(goal, edge.pivots[side], FORWARD, cant);
          if (step === undefined || side !== step.side) {
            limbs[id] = canted;
            continue;
          }
          const phase: number = minimumJerk.share(
            (at - step.window[0]) / (step.window[1] - step.window[0]),
          );
          const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
            UP,
            posture.yaw,
          );
          const shift: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
            x: step.offset.x * phase,
            y: step.clearance * 16 * phase ** 2 * (1 - phase) ** 2,
            z: step.offset.z * phase,
          });
          limbs[id] = shifted(canted, shift);
        }
        return { ...posture, limbs };
      },
    };
  }

  /**
   * Bring a flat-foot curler into a low delivery on a straight glide.
   *
   * @param context The lead side, trailing shoe and pelvis drop.
   * @returns The straight glide with a distinct forefoot and loaded sole.
   */
  export function curl(
    context: IAutoMovieMotionHumanActionContext<Curl>,
  ): Plan {
    const { body, params }: typeof context = context;
    const base: Plan = HumanSurfaceGlide.plan(context);
    const leg: number = body.measure.thigh + body.measure.shank;
    HumanBound.within("drop", params.drop, 0, leg, "m", "minimum");
    HumanBound.within("trail", params.trail, 0, leg, "m", "minimum");
    HumanBound.within("heel", params.heel, 0, 90, "deg", "minimum");
    const side: AutoMovieHumanSide = params.lead === "left" ? "right" : "left";
    const ball: IAutoMovieVector3 = HumanFoot.offset(body, side, "ball");
    const trailing: "leftLeg" | "rightLeg" = `${side}Leg`;
    const leading: "leftLeg" | "rightLeg" = `${params.lead}Leg`;
    return {
      ...base,
      events: [...base.events, { name: "delivery", share: 0.5 }].sort(
        (left: { share: number }, right: { share: number }): number =>
          left.share - right.share,
      ),
      posture: (at: number): Posture => {
        const posture: Posture = base.posture(at);
        const share: number = at / base.duration;
        const set: number =
          minimumJerk.share(share / 0.3) *
          (params.stop === true
            ? 1 - minimumJerk.share((share - 0.65) / 0.35)
            : 1);
        const facing: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
          UP,
          posture.yaw,
        );
        const back: IAutoMovieVector3 = Quaternion.rotateVector(facing, {
          x: 0,
          y: 0,
          z: -params.trail * set,
        });
        const goal: IAutoMovieHumanLimbGoal = posture.limbs[trailing]!;
        return {
          ...posture,
          root: { ...posture.root, y: posture.root.y - params.drop * set },
          limbs: {
            ...posture.limbs,
            [leading]: shifted(
              posture.limbs[leading]!,
              Vector3.scale(back, -1),
            ),
            [trailing]: shifted(
              pivotSurfaceFoot(goal, ball, CROSS, params.heel * set),
              back,
            ),
          },
        };
      },
    };
  }
}

/** Translate both the ankle target and its knee bend hint with a released foot. */
function shifted(
  goal: IAutoMovieHumanLimbGoal,
  by: IAutoMovieVector3,
): IAutoMovieHumanLimbGoal {
  return {
    ...goal,
    point: Vector3.add(goal.point, by),
    bend: Vector3.add(goal.bend, by),
  };
}
