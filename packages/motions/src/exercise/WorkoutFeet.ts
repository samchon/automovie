import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import { HumanFoot } from "../posture/HumanFoot";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { WorkoutKind } from "./WorkoutKind";

/**
 * The feet of a workout that stands: a foot the kind never moves is held by
 * the leg's solve on the place it stands on at the entry, and a foot the
 * body turns on stays on its ball, turned by the key's own turn.
 *
 * A key's legs are joint angles, and the stance a body is entered in has its
 * own width and toe-out, so the keyed feet stand a few centimetres from the
 * real ones; the solve puts each bearing foot back on its own place, which
 * is what the first run of the workout signature test measured as 42 mm of
 * slip without it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is kept, how, and the measured fault it answers.
 * @evidence contracts/development/design.md#principled-representation One function from a placed posture to the same posture with its bearing legs as planted goals, so the workout law places the body and this keeps its feet.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one function the workout law calls.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The places are the entry's own feet, never a stance rebuilt from the keys.
 */
export namespace WorkoutFeet {
  /**
   * The keeper of a kind's feet.
   *
   * @param context The action's context.
   * @param kind The exercise.
   * @param yaw The heading the exercise is entered on, degrees.
   * @returns What gives a placed posture its bearing legs' goals; the posture itself for a kind that is not anchored on its stance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation A `plant` support of a `stance` kind that does not stride is a planted leg goal on the entry's ankle and rotation; a `pivot` support is a planted goal on the foot turned about its ball by the posture's turn from the entry heading.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two lists of sides, read once, and one goal per side per posture.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A striding kind's feet are left to its keys, which solve its stance on the body.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per posture.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Postures are evaluated independently.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The keeper closes over the entry's feet.
   */
  export function keep(
    context: Pick<IHumanActionContext, "body" | "entry">,
    kind: WorkoutKind,
    yaw: number,
  ): (placed: IHumanPosture) => IHumanPosture {
    const bearing = (
      how: WorkoutKind.ISupport["kind"],
    ): readonly ("left" | "right")[] =>
      kind.anchor !== "stance"
        ? []
        : (["left", "right"] as const).filter(
            (side: "left" | "right"): boolean =>
              kind.supports.some(
                (support: WorkoutKind.ISupport): boolean =>
                  support.part === `${side}Foot` && support.kind === how,
              ),
          );
    const planted: readonly ("left" | "right")[] =
      kind.strides === true ? [] : bearing("plant");
    const pivots: readonly ("left" | "right")[] = bearing("pivot");
    return (placed: IHumanPosture): IHumanPosture => {
      const limbs: IHumanPosture["limbs"] = { ...placed.limbs };
      for (const side of [...planted, ...pivots]) {
        const stance: HumanFoot.IPlacement = {
          ankle: context.entry.feet[side].ankle,
          rotation: context.entry.feet[side].rotation,
        };
        limbs[`${side}Leg`] = AutoMovieMotionHumanLeg.goal(
          context.body,
          placed,
          side,
          planted.includes(side)
            ? stance
            : HumanFoot.pivot(
                context.body,
                side,
                "mtp",
                HumanFoot.point(context.body, side, "mtp", stance),
                HumanFoot.heading(stance.rotation) + (placed.yaw - yaw),
                0,
              ),
          true,
        );
      }
      return { ...placed, limbs };
    };
  }
}
