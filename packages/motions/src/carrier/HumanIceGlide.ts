import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSurface,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanFootRelax } from "../compose/AutoMovieMotionHumanFootRelax";
import { AutoMovieMotionHumanRange } from "../compose/AutoMovieMotionHumanRange";
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

/**
 * Share of a curling delivery spent lowering into the slide (provisional
 * staging; the cited study gives the stance, not its timing).
 */
const CURL_SET: number = 0.3;

/**
 * Share of a curling delivery at which its `delivery` event is named, mid-slide
 * (provisional staging).
 */
const CURL_DELIVERY: number = 0.5;

type Skate = IAutoMovieMotionHumanSurface.ISkateParams;
type Curl = IAutoMovieMotionHumanSurface.ICurlDeliveryParams;
type Plan = IAutoMovieMotionHumanActionPlan;
type Posture = IAutoMovieMotionHumanPosture;

/**
 * One ice glide with fitted runner edges, an optional step, or a low curling
 * delivery. The bilateral glide owns path, speed, entry and stopping. Ice
 * footwork owns each foot's support window and the point which a shoe or blade
 * rotates around. Instrumented short-track turns distinguish stroke phases (van
 * der Kruk et al., 2018, https://doi.org/10.1080/14763141.2018.1441898).
 * Curling delivery uses a loaded flat leading shoe and a trailing forefoot as
 * described by Hua et al. (2025, Figure 2,
 * https://doi.org/10.3389/fnhum.2025.1587118).
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
    // The released blade rises on `clearance 쨌 sin(?u)` over the step's
    // window, so it stays within the bearing height of the ice for
    // `asin(h / clearance) / ?` of the window at each end: it glides there,
    // still on the ice, and its bearing holds until it clears.
    const grazing: number =
      step === undefined
        ? 0
        : ((step.window[1] - step.window[0]) *
            Math.asin(Math.min(1, HumanFoot.BEARING / step.clearance))) /
          Math.PI;
    const released: number = ((step?.window[0] ?? 0) + grazing) / base.duration;
    const acquired: number = ((step?.window[1] ?? 0) - grazing) / base.duration;
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
              (
                left: IAutoMovieMotionEvent,
                right: IAutoMovieMotionEvent,
              ): number => left.share - right.share,
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
              minimumJerk.share(share / HumanSurfaceGlide.ACQUIRE) *
              (context.params.stop === true
                ? 1 -
                  minimumJerk.share(
                    (share - 1 + HumanSurfaceGlide.BRAKE) /
                      HumanSurfaceGlide.BRAKE,
                  )
                : 1);
        const limbs: Posture["limbs"] = { ...posture.limbs };
        const joints: Posture["joints"] = { ...posture.joints };
        for (const side of SIDES) {
          const id: AutoMovieHumanLimb = `${side}Leg`;
          const goal: IAutoMovieHumanLimbGoal = limbs[id]!;
          const canted: IAutoMovieHumanLimbGoal =
            edge === undefined
              ? goal
              : pivotSurfaceFoot(goal, edge.pivots[side], FORWARD, cant);
          if (step === undefined || side !== step.side) {
            limbs[id] = canted;
            continue;
          }
          const u: number = Math.min(
            1,
            Math.max(
              0,
              (at - step.window[0]) / (step.window[1] - step.window[0]),
            ),
          );
          const phase: number = minimumJerk.share(u);
          const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
            UP,
            posture.yaw,
          );
          const shift: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
            x: step.offset.x * phase,
            y: step.clearance * Math.sin(Math.PI * u),
            z: step.offset.z * phase,
          });
          const moved: IAutoMovieHumanLimbGoal = shifted(canted, shift);
          limbs[id] = sheds(
            context.body,
            posture,
            side,
            moved,
            at <= step.window[0]
              ? AutoMovieMotionHumanFootRelax.load(at, step.window[0])
              : at >= step.window[1]
                ? AutoMovieMotionHumanFootRelax.load(
                    at,
                    Infinity,
                    step.window[1],
                  )
                : 0,
          );
          // The toes extend by the heel's rise, so they stay on the ice
          // ahead of the toes' joint instead of dipping into it.
          if (moved.rotation !== undefined && limbs[id]!.rotation !== undefined)
            joints[`${side}Toes`] = [
              Math.max(
                0,
                HumanFoot.pitch(moved.rotation) -
                  HumanFoot.pitch(limbs[id]!.rotation!),
              ),
              0,
              0,
            ];
        }
        return { ...posture, limbs, joints };
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
    // The toes extend by the heel's rise to stay on the ice, so the rise is
    // bounded by the toes' own extension.
    HumanBound.within(
      "heel",
      params.heel,
      0,
      AutoMovieMotionHumanRange.limit(
        params.lead === "left" ? "rightToes" : "leftToes",
        "flexion",
      ) ?? 90,
      "deg",
      "minimum",
    );
    const side: AutoMovieHumanSide = params.lead === "left" ? "right" : "left";
    const ball: IAutoMovieVector3 = HumanFoot.offset(body, side, "ball");
    const trailing: AutoMovieHumanLimb = `${side}Leg`;
    const leading: AutoMovieHumanLimb = `${params.lead}Leg`;
    return {
      ...base,
      events: [...base.events, { name: "delivery", share: CURL_DELIVERY }].sort(
        (left: IAutoMovieMotionEvent, right: IAutoMovieMotionEvent): number =>
          left.share - right.share,
      ),
      posture: (at: number): Posture => {
        const posture: Posture = base.posture(at);
        const share: number = at / base.duration;
        const set: number =
          minimumJerk.share(share / CURL_SET) *
          (params.stop === true
            ? 1 -
              minimumJerk.share(
                (share - 1 + HumanSurfaceGlide.BRAKE) / HumanSurfaceGlide.BRAKE,
              )
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
          // The trailing shoe's heel rises about its ball; its toes extend
          // by as much, so they lie on the ice ahead of the ball instead of
          // dipping into it.
          joints: {
            ...posture.joints,
            [`${side}Toes`]: [params.heel * set, 0, 0],
          },
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

/**
 * A stepping blade within the dorsal range of the weight it bears
 * (`AutoMovieMotionHumanFootRelax`): as it sheds the body before it leaves, its
 * heel rises about the toes' joint, which stays on the ice, so it leaves within
 * the unloaded ankle's range and flies so; it lowers again as it takes the body
 * back.
 */
function sheds(
  body: IAutoMovieMotionHumanBody,
  posture: Posture,
  side: AutoMovieHumanSide,
  goal: IAutoMovieHumanLimbGoal,
  share: number,
): IAutoMovieHumanLimbGoal {
  if (goal.rotation === undefined) return goal;
  const placed: IAutoMovieMotionHumanFoot.IPlacement =
    AutoMovieMotionHumanFootRelax(
      body,
      posture,
      side,
      { ankle: goal.point, rotation: goal.rotation },
      share,
    );
  return {
    ...shifted(goal, Vector3.subtract(placed.ankle, goal.point)),
    rotation: placed.rotation,
  };
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
