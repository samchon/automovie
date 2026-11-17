import type {
  IAutoMovieChain,
  IAutoMovieMotionHumanBladeExchange,
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanLexiconBladeParams,
} from "@automovie/interface";

import { HumanBlade } from "./HumanBlade";

/**
 * Compose a blocked opening and an optional reply for a staged blade exchange.
 * Register the cut and parry rows of HumanBlade with HumanPerformance and
 * register riposte when the exchange has a reply. Each chain prepares its
 * performer and prop. The block starts at the authored lead before the
 * opening's decisive cue, and a reply starts when the block ends. The block's
 * stroke cue comes from the resolved action timing.
 *
 * @param opening Entry chain of the opening performer.
 * @param responding Entry chain of the responding performer.
 * @param exchange Stable cue id, held-prop subjects, stage marks and block lead in film seconds.
 * @returns Parallel composition of the two performers, with unchanged entry chains.
 * @throws {Error} When cast or props coincide, an id is blank, or the lead is invalid.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the registration and entry requirements, synchronization, continuation and refusal conditions.
 * @evidence contracts/development/implementation.md#principled-implementation The existing registered action, sync and parallel chain operators compile an author-declared block and optional reply. The performance owns placement, reach and prop admission when it plans the composition.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Emit the anchored opening, align the responder's block to it and append any reply to that same chain. HumanBlade supplies the three law identities.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Stage marks are inputs. The composer adds no trajectory constants, geometry fitting or inferred outcomes.
 * @evidence contracts/development/implementation.md#efficient-algorithms Appends at most three intents. Copying the entry sequences is linear in their part counts. The scheduler can place the block once because its start is an authored offset from a placed cue.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Independent composition calls coordinate no work. The existing chain operators retain the entry nodes by reference.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Inputs and new intent records are retained by the returned composition. The composer keeps no state or resources between calls.
 */
export function composeHumanBladeExchange(
  opening: IAutoMovieMotionHumanChainCore,
  responding: IAutoMovieMotionHumanChainCore,
  exchange: IAutoMovieMotionHumanBladeExchange,
): IAutoMovieChain {
  if (opening.subject === responding.subject)
    throw new Error("Stage a blade exchange between two distinct performers");
  if (
    exchange.openingProp.trim() === "" ||
    exchange.respondingProp.trim() === "" ||
    exchange.openingProp === exchange.respondingProp
  )
    throw new Error("Give each performer a distinct stage prop");
  if (exchange.cue.trim() === "")
    throw new Error("Name the staged blade exchange with a nonblank cue");
  if (
    !Number.isFinite(exchange.blockLeadSeconds) ||
    exchange.blockLeadSeconds < 0
  )
    throw new Error("Give the staged block a finite nonnegative lead in seconds");

  const openingCue: string = `${exchange.cue}.opening`;
  const cue: IAutoMovieMotionHumanLexiconBladeParams["cut"] = {
    blade: exchange.openingProp,
    target: exchange.openingMark,
    outcome: "parried",
  };
  const blocked: IAutoMovieMotionHumanLexiconBladeParams["parry"] = {
    blade: exchange.respondingProp,
    against: openingCue,
  };
  const lead: IAutoMovieMotionHumanChainCore = opening.registered(
    HumanBlade.cut.name,
    cue,
    openingCue,
  );
  const answer: IAutoMovieMotionHumanChainCore = responding
    .registered(HumanBlade.parry.name, blocked, `${exchange.cue}.block`)
    .sync({ of: openingCue, offset: -exchange.blockLeadSeconds });
  if (exchange.replyMark === undefined) return lead.with(answer);

  const reply: IAutoMovieMotionHumanLexiconBladeParams["riposte"] = {
    blade: exchange.respondingProp,
    target: exchange.replyMark,
  };
  return lead.with(
    answer.registered(HumanBlade.riposte.name, reply, `${exchange.cue}.reply`),
  );
}
