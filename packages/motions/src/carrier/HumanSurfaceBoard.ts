import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSurface,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanSupportCarry } from "./HumanSupportCarry";

/**
 * Carry a two-foot stance on the actual board's film-clock trajectory.
 * Either foot can lead because the law reads the placed posture. Surf transit
 * measurements distinguish hand contact, foot acquisition and settled stance.
 * The board ride enters after acquisition, on an already placed stance.
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC7961430/
 *
 * @param context The placed feet, the board id and the ride duration.
 * @returns The transferred deck-local plants and carried posture.
 * @throws {HumanRefusal} When either foot is unsupported by the selected board
 * or the duration is invalid.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the entry, frame, source, return and refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Stores displayed foot locations, reconstructs planted world goals and uses the engine's rigid support carry to keep both on the prop.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One support check, one two-foot goal snapshot and one carried plan.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No assumed board speed, water displacement or ground-to-deck acquisition.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two goals are placed once and the common rigid carrier owns each frame evaluation.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses standing knee references and the same support carry as an action on a wagon.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains the entered goals and board reader for its own lifetime.
 */
export function HumanSurfaceBoard(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSurface.IBoardRideParams>,
): IAutoMovieMotionHumanActionPlan {
  const { body, entry, params }: typeof context = context;
  const duration: number = HumanBound.above("seconds", params.seconds, 0, "s");
  const sides: readonly ["left", "right"] = ["left", "right"];
  for (const side of sides)
    if (
      !entry.supports.some(
        (support: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
          support.part === `${side}Foot` &&
          (support.kind === "plant" ||
            support.kind === "bear" ||
            support.kind === "pivot") &&
          support.support.kind === "prop" &&
          support.support.subject === params.on,
      )
    )
      throw new HumanRefusal({
        kind: "affordance",
        axis: "on",
        value: params.on,
        feasible: null,
        reason: `board ride needs the ${side} foot on ${params.on} at entry`,
        fix: "place both feet on the named board before riding it",
      });
  context.prop(params.on);

  const ankles: Record<"left" | "right", IAutoMovieVector3> = {
    left: entry.feet.left.ankle,
    right: entry.feet.right.ankle,
  };
  const placed: IAutoMovieMotionHumanPosture = entry.posture;
  const knee: IAutoMovieMotionHumanPosture["limbs"] = stand.legs(
    body,
    placed.root,
    placed.yaw,
    ankles,
  );
  const posture: IAutoMovieMotionHumanPosture = {
    ...placed,
    limbs: {
      ...placed.limbs,
      leftLeg: { ...knee.leftLeg!, rotation: entry.feet.left.rotation },
      rightLeg: { ...knee.rightLeg!, rotation: entry.feet.right.rotation },
    },
  };
  const contacts: IAutoMovieMotionHumanContactWindow[] = sides.map(
    (side: "left" | "right"): IAutoMovieMotionHumanContactWindow => ({
      part: `${side}Foot`,
      kind: "plant",
      from: 0,
      to: 1,
      support: { kind: "ground" },
    }),
  );
  return HumanSupportCarry.on(
    context,
    {
      duration,
      events: [{ name: "ride", share: 0 }],
      contacts,
      physicalWindow: null,
      posture: (): IAutoMovieMotionHumanPosture => posture,
    },
    params.on,
  );
}
