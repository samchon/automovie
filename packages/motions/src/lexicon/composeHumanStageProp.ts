import type {
  IAutoMovieChain,
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanStageFight,
  IAutoMovieMotionHumanStageProp,
} from "@automovie/interface";

import { HumanStageProp } from "./HumanStageProp";

/**
 * Append a visual prop beat and, when authored, a second performer's response.
 *
 * The partner's flinch starts at the prop beat's named `stroke` event, plus
 * any authored delay. Omit the response for a solo display or a passing
 * beat without a reaction. The timing adds no contact between performers.
 *
 * @param performer The performer carrying the digital prop.
 * @param beat The visual pose and prop mark.
 * @param cue An anchor unique within the scene.
 * @param response The optional responding performer and reaction timing.
 * @returns The composed performance chains.
 * @throws {Error} For a blank cue, a self-response or an invalid delay.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the two chains, cue ownership, refusal and omission behavior.
 * @evidence contracts/development/implementation.md#principled-implementation The stage law owns the accent. The existing chain synchronizer places a separate flinch on its cue.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Validate identities and timing, append the beat, then append and synchronize the optional response.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No collision tests or implicit reactions enter the composition.
 * @evidence contracts/development/implementation.md#efficient-algorithms Appends one or two intents using existing immutable chain operations.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the existing flinch, synchronizer and stage-law name.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Pure composition with no external resource.
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
    if (!Number.isFinite(delay) || delay < 0)
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
