import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanCymbalStrike,
  IAutoMovieMotionHumanUseTool,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { struckSurface } from "./struckSurface";
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
 * @throws {HumanRefusal} When either subject is empty, the hand lacks the stick
 *   or its required contacts, or the edge fails admission.
 */
function plan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCymbalStrike>,
): IAutoMovieMotionHumanUseTool.IPlan {
  const { hand, stick, cymbal }: IAutoMovieMotionHumanCymbalStrike =
    context.params;
  if (stick.length === 0)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "stick",
      value: stick,
      reason: "the strike requires a drumstick subject",
      fix: "name the held drumstick",
    });
  if (cymbal.length === 0)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "cymbal",
      value: cymbal,
      reason: "the strike requires a cymbal subject",
      fix: "name the mounted cymbal",
    });

  if (struckSurface(context.prop(cymbal), context.start, "edge") === undefined)
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
