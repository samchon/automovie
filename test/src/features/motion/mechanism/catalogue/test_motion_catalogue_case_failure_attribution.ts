import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanChain, HumanRefusal } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanLawCovering } from "../../../internal/motionHumanLawCovering";
import { motionHumanLawSweep } from "../../../internal/motionHumanLawSweep";
import { rejectsError } from "../../../internal/rejectsError";

/**
 * Shared sweep selection and mirror comparison must not turn invalid input or
 * an actual stage failure into an empty success. Mirrors retain their existing
 * all-refusals policy; no physical feasibility policy changes.
 *
 * Scenarios:
 *
 * 1. Two identical canonical standing scenes with zero sway produce no mirror
 *    complaint at the unchanged 10 mm bound.
 * 2. A deliberately failing left stage yields one complaint naming its actual left
 *    row and original error text.
 * 3. A typed reach refusal from the right stage yields one complaint naming the
 *    right row and refusal reason. It cannot become an empty success.
 * 4. A zero count, a count not divisible by the body count and an index beyond the
 *    selected parts refuse before any scene executes. An empty table cannot
 *    hide an invalid part selection. Whether a part is whole is the caller's:
 *    the parts are counted in integers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the real canonical standing control, the deliberately owned left/right stage failures, malformed partition boundaries and the existing complaint/attribution policy.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual public test harness with owned stages, verifies its successful mirror control and observes attributed ordinary-error/typed-refusal complaints plus invalid part refusals. A swallowed right failure, mislabeled side, fractional no-cell success or unconditional failure fails.
 * @evidence contracts/development/testing.md#independent-expectations Identical zero-sway standing scenes mirror within the existing physical bound. Exactly one owned stage fails in each negative case, so exactly one complaint must retain that side and its supplied message. A discrete partition needs a positive integer count, an integer index in range and equal parts per body; no implementation output supplies an expected trajectory or selector answer.
 * @evidence contracts/development/testing.md#distinguishing-cases A successful pair, failure before the left film and failure after a successful left film distinguish positive behavior and both failure boundaries, including an actual typed HumanRefusal. Fractional/empty/uneven/out-of-range partition requests cannot pass vacuously through an empty table. Conditional allowed-turn refusals remain airborne_signature's separate policy.
 * @evidence contracts/development/testing.md#execution-ownership This discoverable in-memory unit supplies normal stage callbacks to the real shared harness, which uses existing canonical Human fixtures and public standing performances. The table's touch key selects its hand factor only; the test checks harness control flow rather than a touch action. It starts no host or process and replaces no foreign method.
 */
export async function test_motion_catalogue_case_failure_attribution(): Promise<void> {
  const read: (side?: "left" | "right") => Promise<string[]> = (
    side?: "left" | "right",
  ): Promise<string[]> =>
    motionHumanLawCovering.mirrors({
      touch: (
        pick: motionHumanLawSweep.Pick,
        body: IAutoMovieMotionHumanBody,
      ): motionHumanLawSweep.IScene => {
        const actual: string | undefined = pick("hand");
        if (actual === side && side !== undefined) {
          if (side === "left") throw new Error("owned left stage failure");
          throw new HumanRefusal({
            kind: "reach",
            axis: "to",
            value: null,
            reason: "owned right stage refusal",
            fix: "change the owned test stage input",
          });
        }
        return motionHumanLawSweep.solo(
          body,
          HumanChain.subject("a").stand({ hold: 0.05, sway: 0 }),
        );
      },
    });
  TestValidator.equals(
    "an ordinary canonical mirrored pair remains accepted",
    await read(),
    [],
  );
  for (const side of ["left", "right"] as const) {
    const findings: string[] = await read(side);
    TestValidator.equals(
      `${side}: the owned failure remains one finding`,
      findings.length,
      1,
    );
    const reason: string =
      side === "left"
        ? "owned left stage failure"
        : "owned right stage refusal";
    TestValidator.predicate(
      `${side}: preserves row attribution and original reason`,
      findings[0]?.startsWith(`touch | hand=${side} |`) === true &&
        findings[0].includes(reason),
    );
  }
  for (const part of [
    [0, 0],
    [0, 3],
    [4, 4],
  ] as const)
    TestValidator.predicate(
      `invalid discrete part${part.join("/")} cannot pass an empty table`,
      await rejectsError(
        (): Promise<string[]> => motionHumanLawCovering.part({}, part),
      ),
    );
}
