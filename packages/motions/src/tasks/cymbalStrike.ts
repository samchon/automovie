import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanCymbalStrike,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanUseTool,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { useTool } from "./useTool";

/**
 * Strike the near edge of a mounted cymbal with the held stick's working point,
 * then lift the stick from the surface. The RITMO cymbal recordings document
 * struck cymbals and damping as distinct playing conditions
 * (https://zenodo.org/records/21360429). This scenic action uses the existing
 * single-cycle held-tool arc and its provisional timing. Register it with
 * `HumanPerformance` and align `contact1` with the chain's `sync`. Stage the
 * named edge within reach in front of the performer.
 */
export const cymbalStrike: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanCymbalStrike> =
  {
    name: "cymbalStrike",
    interrupts: useTool.interrupts,
    plan,
  };

/**
 * Validate the stationary edge and delegate the approach, strike, rebound and
 * recovery to the existing plan, which also validates the held tool.
 *
 * @param context The action's inputs, body, entry state and prop readers.
 * @returns The held-stick plan with `contact1` as its decisive instant.
 * @throws {HumanRefusal} When the hand or either subject is invalid, the hand
 *   lacks the stick or its required contacts, or the edge fails admission.
 * @evidence contracts/development/common.md#meaningful-documentation States the site, reference, inherited timing, cue and stage premise.
 */
function plan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCymbalStrike>,
): IAutoMovieMotionHumanUseTool.IPlan {
  const { hand, stick, cymbal }: IAutoMovieMotionHumanCymbalStrike =
    context.params;
  if (hand !== "left" && hand !== "right")
    throw new HumanRefusal({
      kind: "parameter",
      axis: "hand",
      value: hand,
      reason: "the strike requires the hand already holding the stick",
      fix: 'name the holding hand, "left" or "right"',
    });
  if (typeof stick !== "string" || stick.length === 0)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "stick",
      value: stick,
      reason: "the strike requires a drumstick subject",
      fix: "name the held drumstick",
    });
  if (typeof cymbal !== "string" || cymbal.length === 0)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "cymbal",
      value: cymbal,
      reason: "the strike requires a cymbal subject",
      fix: "name the mounted cymbal",
    });

  const read: IAutoMovieMotionHumanPropReader = context.prop(cymbal);
  const edge: IAutoMovieAffordance | undefined = read.prop.affordances?.find(
    (a: IAutoMovieAffordance): boolean =>
      a.id === "edge" && a.kind === "surface",
  );
  if (
    edge === undefined ||
    read.prop.fixed !== true ||
    read.prop.motion !== undefined ||
    read.prop.point !== undefined ||
    (read.prop.hasArticulations ?? read.prop.articulate !== undefined) ||
    Quaternion.rotateVector(
      Quaternion.multiply(
        read.frame(context.start).rotation,
        edge.frame.rotation,
      ),
      { x: 0, y: 1, z: 0 },
    ).y <
      1 - 1e-9
  )
    throw new HumanRefusal({
      kind: "affordance",
      axis: "cymbal",
      value: cymbal,
      reason: "the strike requires a fixed, upward-facing horizontal edge",
      fix: "stage an upright mounted cymbal as a fixed prop",
    });

  return useTool.plan({
    ...context,
    params: {
      hand,
      prop: stick,
      tool: "hammer",
      on: { kind: "prop", subject: cymbal, point: "edge" },
      count: 1,
    },
  });
}
