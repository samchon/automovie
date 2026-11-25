import type {
  IAutoMovieComposition,
  IAutoMovieIntent,
  IAutoMovieMotionHumanChain,
} from "@automovie/interface";
import { HumanChain } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/**
 * Build the authoring tree for a cut carrier and its synced overlay.
 *
 * Scenarios:
 *
 * 1. Add a cut to the last intent, mark only the overlay, then time the parallel
 *    group to the requested event with latency on the carrier.
 * 2. The original carrier is immutable. A second sync, or a cut applied after
 *    syncing, refuses before action planning.
 */
export function test_unit_motions_chain_action_composition(): void {
  const original: IAutoMovieMotionHumanChain = HumanChain.subject("lead").stand(
    { hold: 2 },
    "base",
  );
  const cut: IAutoMovieMotionHumanChain = original.until({ share: 0.5 });
  const composed: IAutoMovieMotionHumanChain = cut
    .over(
      (overlay: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
        overlay.gesture({ kind: "palmsTogether" }, "gesture"),
    )
    .sync({
      of: "score",
      event: "beat",
      index: 2,
      offset: 0.25,
      latency: "reaction",
    });
  const node: IAutoMovieComposition = composed.node;
  if (node.kind !== "sequence") throw new Error("Expected a chain sequence");
  const timed: IAutoMovieComposition | undefined = node.parts.at(-1);
  if (timed?.kind !== "at" || timed.part.kind !== "parallel")
    throw new Error("Expected a timed carrier and overlay");
  const [carrier, overlay] = timed.part.parts;
  if (carrier?.kind !== "intent" || overlay?.kind !== "sequence")
    throw new Error("Expected the primary intent and the overlay sequence");
  const gesture: IAutoMovieComposition | undefined = overlay.parts[0];
  const until: IAutoMovieIntent["until"] = carrier.intent.until;
  TestValidator.equals(
    "resolve the requested cue and default start alignment",
    {
      anchor: timed.anchor,
      event: timed.event,
      index: timed.index,
      offset: timed.offset,
      align: timed.align,
    },
    { anchor: "score", event: "beat", index: 2, offset: 0.25, align: "start" },
  );
  TestValidator.predicate(
    "only the last carrier is cut and only the nested overlay is marked",
    carrier.intent.anchor === "base" &&
      carrier.intent.parameters?.latency === "reaction" &&
      carrier.intent.parameters.over === undefined &&
      until !== undefined &&
      "share" in until &&
      until.share === 0.5 &&
      gesture?.kind === "intent" &&
      gesture.intent.anchor === "gesture" &&
      gesture.intent.parameters?.over === true &&
      gesture.intent.parameters.latency === undefined,
  );
  const earlier: IAutoMovieComposition | undefined =
    original.node.kind === "sequence"
      ? original.node.parts.at(-1)
      : original.node;
  TestValidator.predicate(
    "the earlier intent remains uncut and sync is a one-time wrapper",
    earlier?.kind === "intent" &&
      earlier.intent.until === undefined &&
      throwsError(
        (): unknown => composed.sync({ of: "other" }),
        "already synced",
      ) &&
      throwsError(
        (): unknown => composed.until({ share: 0.75 }),
        "cut it first",
      ),
  );
}
