import type {
  IAutoMovieChain,
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanStageFight,
  IAutoMovieMotionHumanStageProp,
} from "@automovie/interface";

import { HumanStageProp } from "./HumanStageProp";

/*
 * Append a visual prop beat and, when authored, a second performer's response.
 *
 * The partner's flinch starts at the prop beat's named `stroke` event, plus any
 * authored delay. Omit the response for a solo display or a passing beat
 * without a reaction. The timing adds no contact between performers.
 * Parameter performer: The performer carrying the digital prop.
 * Parameter beat: The visual pose and prop mark.
 * Parameter cue: An anchor unique within the scene.
 * Parameter response: The optional responding performer and reaction timing.
 * Returns: The composed performance chains.
 * For a blank cue, a self-response or an invalid delay.
 */
export function composeHumanStageProp(
  performer: IAutoMovieMotionHumanChainCore,
  beat: IAutoMovieMotionHumanStageProp,
  cue: string,
  response?: IAutoMovieMotionHumanStageFight.IResponse,
): IAutoMovieChain {
  if (cue.trim() === "") throw new Error("Name the visual prop beat");
  if (response !== undefined) {
    if (performer.subject === response.performer.subject)
      throw new Error("A stage prop response needs a different performer");
    const delay: number = response.delay ?? 0;
    if (!(delay >= 0))
      throw new Error("Give the stage response a finite nonnegative delay");
  }

  const lead: IAutoMovieMotionHumanChainCore = performer.registered(
    HumanStageProp.name,
    beat,
    cue,
  );
  if (response === undefined) return lead;
  return lead.with(
    response.performer
      .act("flinch", {}, `${cue}.response`)
      .sync({ of: cue, event: "stroke", offset: response.delay ?? 0 }),
  );
}
