import type {
  IAutoMovieChain,
  IAutoMovieMotionHumanBladeExchange,
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanLexiconBladeParams,
} from "@automovie/interface";

import { HumanBlade } from "./HumanBlade";

/*
 * Compose a blocked opening and an optional reply for a staged blade exchange.
 * Register the cut and parry rows of HumanBlade with AutoMovieMotionHumanPerformance, and
 * bind, riposte, taken and enGarde when the exchange has a reply. Each chain
 * prepares its performer and prop. The block starts at the authored lead before
 * the opening's decisive cue, and a reply starts when the block ends. The
 * block's stroke cue comes from the resolved action timing. Answered, the
 * opening is `taken`: the block is a bind that carries its blade aside, the
 * opener keeps the blade there until the reply ends and then returns to guard.
 * Parameter opening: Entry chain of the opening performer.
 * Parameter responding: Entry chain of the responding performer.
 * Parameter exchange: Stable cue id, held-prop subjects, stage marks and block lead
 * in film seconds.
 * Returns: Parallel composition of the two performers, with unchanged entry
 * chains.
 * When cast or props coincide, an id is blank, or the lead is
 * invalid.
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
    !(exchange.blockLeadSeconds >= 0)
  )
    throw new Error(
      "Give the staged block a finite nonnegative lead in seconds",
    );

  const openingCue: string = `${exchange.cue}.opening`;
  const blockCue: string = `${exchange.cue}.block`;
  const replyCue: string = `${exchange.cue}.reply`;
  const replied: boolean = exchange.replyMark !== undefined;
  const cue: IAutoMovieMotionHumanLexiconBladeParams["cut"] = {
    blade: exchange.openingProp,
    target: exchange.openingMark,
    outcome: "parried",
    ...(replied ? { taken: true } : {}),
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
    .registered(
      replied ? HumanBlade.bind.name : HumanBlade.parry.name,
      blocked,
      blockCue,
    )
    .sync({ of: openingCue, offset: -exchange.blockLeadSeconds });
  if (exchange.replyMark === undefined) return lead.with(answer);

  // Answered, the block is a bind that takes the opening's blade and carries
  // it aside, and the opener keeps it there until the reply ends, then
  // returns to guard.
  const taken: IAutoMovieMotionHumanLexiconBladeParams["taken"] = {
    blade: exchange.openingProp,
    against: blockCue,
    until: replyCue,
  };
  const guard: IAutoMovieMotionHumanLexiconBladeParams["enGarde"] = {
    blade: exchange.openingProp,
  };
  const reply: IAutoMovieMotionHumanLexiconBladeParams["riposte"] = {
    blade: exchange.respondingProp,
    target: exchange.replyMark,
  };
  return lead
    .registered(HumanBlade.taken.name, taken, `${exchange.cue}.taken`)
    .registered(HumanBlade.enGarde.name, guard, `${exchange.cue}.guard`)
    .with(answer.registered(HumanBlade.riposte.name, reply, replyCue));
}
