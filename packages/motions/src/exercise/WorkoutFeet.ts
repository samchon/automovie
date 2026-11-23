import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanWorkoutKind,
} from "@automovie/interface";

import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { HumanFoot } from "../posture/HumanFoot";

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
 */
export namespace WorkoutFeet {
  /**
   * The keeper of a kind's feet.
   *
   * @param context The action's context.
   * @param kind The exercise.
   * @param yaw The heading the exercise is entered on, degrees.
   * @returns What gives a placed posture its bearing legs' goals; the posture itself for a kind that is not anchored on its stance.
   */
  export function keep(
    context: Pick<IAutoMovieMotionHumanActionContext, "body" | "entry">,
    kind: IAutoMovieMotionHumanWorkoutKind,
    yaw: number,
  ): (placed: IAutoMovieMotionHumanPosture) => IAutoMovieMotionHumanPosture {
    const bearing: (
      how: IAutoMovieMotionHumanWorkoutKind.ISupport["kind"],
    ) => readonly ("left" | "right")[] = (
      how: IAutoMovieMotionHumanWorkoutKind.ISupport["kind"],
    ): readonly ("left" | "right")[] =>
      kind.anchor !== "stance"
        ? []
        : (["left", "right"] as const).filter(
            (side: "left" | "right"): boolean =>
              kind.supports.some(
                (support: IAutoMovieMotionHumanWorkoutKind.ISupport): boolean =>
                  support.part === `${side}Foot` && support.kind === how,
              ),
          );
    const planted: readonly ("left" | "right")[] =
      kind.strides === true ? [] : bearing("plant");
    const pivots: readonly ("left" | "right")[] = bearing("pivot");
    const plans: IPlan[] = [...planted, ...pivots].map(
      (side: "left" | "right"): IPlan => {
        const stance: IAutoMovieMotionHumanFoot.IPlacement = {
          ankle: context.entry.feet[side].ankle,
          rotation: context.entry.feet[side].rotation,
        };
        return planted.includes(side)
          ? {
              side,
              kind: "plant",
              goal: AutoMovieMotionHumanLeg.prepareGoal(
                context.body,
                side,
                stance,
                true,
              ),
            }
          : {
              side,
              kind: "pivot",
              at: HumanFoot.point(context.body, side, "mtp", stance),
              heading: HumanFoot.heading(stance.rotation),
            };
      },
    );
    return (placed: IAutoMovieMotionHumanPosture): IAutoMovieMotionHumanPosture => {
      if (plans.length === 0) return placed;
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...placed.limbs };
      for (const plan of plans) {
        const side: "left" | "right" = plan.side;
        limbs[`${side}Leg`] =
          plan.kind === "plant"
            ? plan.goal(placed)
            : AutoMovieMotionHumanLeg.goal(
                context.body,
                placed,
                side,
                HumanFoot.pivot(
                  context.body,
                  side,
                  "mtp",
                  plan.at,
                  plan.heading + (placed.yaw - yaw),
                  0,
                ),
                true,
              );
      }
      return { ...placed, limbs };
    };
  }

  /** Fixed entry geometry needed by each support's actual contact rule. */
  type IPlan = {
    /** The bearing leg. */
    side: "left" | "right";
  } & (
    | {
        /** An unturned plant. */
        kind: "plant";
        /** The fixed entry placement's goal reader, with its current-root knee hint. */
        goal: ReturnType<typeof AutoMovieMotionHumanLeg.prepareGoal>;
      }
    | {
        /** A turn about the metatarsophalangeal contact. */
        kind: "pivot";
        /** The fixed contact in world metres. */
        at: ReturnType<typeof HumanFoot.point>;
        /** The entry heading in degrees. */
        heading: number;
      }
  );
}
