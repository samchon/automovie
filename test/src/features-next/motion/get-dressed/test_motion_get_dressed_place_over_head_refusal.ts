import { createNecklace } from "@automovie/archetypes";
import { HumanRefusal } from "@automovie/motions";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { placeOverHeadScene } from "../../internal/placeOverHeadScene";

/**
 * What the refusal of an unclearable crown names: the original's words, the
 * placeOverHead's documented reason (the hands' highest places against the
 * arm's reach).
 */
const NAMED: RegExp = /beyond the arm's reach/;

/**
 * A small woman cannot set a loop over a standing tall man's head, and can over
 * the same man seated: the refusal case of
 * `test_motion_get_dressed_place_over_head` with its adjacent valid case,
 * entered by the minimal chain pickUp(loop) > placeOverHead, the partner
 * standing, or seated facing the dresser with the dresser walking in.
 *
 * Scenarios:
 *
 * 1. The tall man standing: the placing is refused on the `partner` axis and the
 *    refusal names the arm's reach, the original's check.
 * 2. The tall man seated facing the dresser, the same loop and dresser: the
 *    placing builds without a refusal, since the law hinges down past a seated
 *    partner's crown (`placeOverHead`'s contract).
 *
 * The original's check passes whatever the standing case does while a seated
 * partner is refused on reach too, as the fixer's probe found for the small
 * woman over the seated average man ("447 mm beyond … stand nearer"); the
 * adjacent seated case here makes the refusal distinguish.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original's refusal, why it was vacuous, the adjacent case, the entry and the bodies.
 * @evidence contracts/development/testing.md#behavioral-verification Builds both takes through `HumanPerformance` and reads the refusal's axis and reason or its absence; an admitted unclearable crown, a refusal for another reason or a refused seated partner fails.
 * @evidence contracts/development/testing.md#independent-expectations The placeOverHead's public contract: "a crown the arms cannot clear (a standing tall partner) is refused with the measure, so the partner bows or kneels", and a seated partner's nape is reached by a hinge at the hips; the reason is matched only on the original's words.
 * @evidence contracts/development/testing.md#distinguishing-cases A standing against a seated partner, the input that changes being only the partner's pose; the placings' goals are the front and behind units'.
 * @evidence contracts/development/testing.md#execution-ownership In-memory two-performer performances through the public chain, entered through `test_motion_get_dressed_place_over_head_refusal`.
 */
export function test_motion_get_dressed_place_over_head_refusal(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  const standing: Refused = refusal("stand");
  checks.check(
    `the small woman cannot set a loop over the standing tall man's head (${describe(standing)})`,
    standing !== undefined &&
      standing.axis === "partner" &&
      NAMED.test(standing.message),
  );
  const seated: Refused = refusal("front");
  checks.check(
    `the small woman sets a loop over the seated tall man's head (${describe(seated)})`,
    seated === undefined,
  );
  checks.assert("only a crown beyond the arms is refused");
}

/** A build's refusal, or undefined when it built. */
type Refused = HumanRefusal | undefined;

/**
 * The refusal the small woman's placing over the tall man in a pose throws, if
 * any.
 */
function refusal(pose: placeOverHeadScene.Pose): Refused {
  try {
    placeOverHeadScene
      .scene(
        motionHumanBody("f-small"),
        motionHumanBody("m-tall"),
        createNecklace({ id: "loop", kind: "ribbon" }),
        pose,
        { rise: false },
      )
      .bones("a", 3);
    return undefined;
  } catch (error: unknown) {
    if (error instanceof HumanRefusal) return error;
    throw error;
  }
}

/** A refusal's axis and message, or that the build was admitted. */
function describe(refused: Refused): string {
  return refused === undefined
    ? "admitted"
    : `${refused.axis}: ${refused.message}`;
}
