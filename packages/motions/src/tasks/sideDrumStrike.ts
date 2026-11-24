import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSideDrumStrike,
  IAutoMovieMotionHumanUseTool,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { useTool } from "./useTool";

/**
 * One scenic downstroke and rebound on a stationary batter head. This opt-in
 * row uses the held working-point arc of `useTool`. The up position after the
 * hit follows the rebound stroke taught in Vic Firth Drumset Lessons 1–2
 * (https://ae.vicfirth.com/wp-content/uploads/FA-Drumset-Lessons-1-2.pdf).
 * Register the row with `HumanPerformance` and align `contact1` to a cue using
 * the chain's `sync`. The stroke uses the existing provisional tool cycle and
 * keeps the stick held.
 */
export const sideDrumStrike: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSideDrumStrike> =
  {
    name: "sideDrumStrike",
    interrupts: useTool.interrupts,
    plan,
  };

/**
 * Resolve the stationary head and pass one stroke to the held-tool law. The
 * tool law refuses a missing grip or face and a stick the named hand does not
 * already hold.
 *
 * @param context The stroke's body, entry state and scene prop readers.
 * @returns The held-tool plan with its `contact1` decisive instant.
 * @throws {HumanRefusal} When the hand, stick or drum is absent, or the drum
 *   head is missing, moving or tilted.
 * @evidence contracts/development/common.md#meaningful-documentation States the stage, the inherited motion, the timing seam and the grip outcome.
 */
function plan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSideDrumStrike>,
): IAutoMovieMotionHumanUseTool.IPlan {
  const { hand, stick, drum }: IAutoMovieMotionHumanSideDrumStrike =
    context.params;
  if (hand !== "left" && hand !== "right")
    throw new HumanRefusal({
      kind: "parameter",
      axis: "hand",
      value: hand,
      reason: "the stroke requires the hand already holding the stick",
      fix: 'name the holding hand, "left" or "right"',
    });
  if (typeof stick !== "string" || stick.length === 0)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "stick",
      value: stick,
      reason: "the stroke requires a drumstick subject",
      fix: "name the held drumstick",
    });
  if (typeof drum !== "string" || drum.length === 0)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "drum",
      value: drum,
      reason: "the stroke requires a drum subject",
      fix: "name the fixed side drum",
    });
  const read: IAutoMovieMotionHumanPropReader = context.prop(drum);
  const head: IAutoMovieAffordance | undefined = read.prop.affordances?.find(
    (a: IAutoMovieAffordance): boolean =>
      a.id === "head" && a.kind === "surface",
  );
  if (
    head === undefined ||
    read.prop.fixed !== true ||
    read.prop.motion !== undefined ||
    read.prop.point !== undefined ||
    (read.prop.hasArticulations ?? read.prop.articulate !== undefined) ||
    Quaternion.rotateVector(
      Quaternion.multiply(
        read.frame(context.start).rotation,
        head.frame.rotation,
      ),
      { x: 0, y: 1, z: 0 },
    ).y <
      1 - 1e-9
  )
    throw new HumanRefusal({
      kind: "affordance",
      axis: "drum",
      value: drum,
      reason:
        "the stroke requires a fixed, horizontal, upward-facing head surface",
      fix: "stage an upright side drum as a fixed prop",
    });

  return useTool.plan({
    ...context,
    params: {
      hand,
      prop: stick,
      tool: "hammer",
      on: { kind: "prop", subject: drum, point: "head" },
      count: 1,
    },
  });
}
