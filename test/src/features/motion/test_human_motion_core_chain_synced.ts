import { HumanChain } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * A chain's operators on its last action say what is wrong with it: an
 * action already synced is named as such, not as a missing action.
 *
 * Scenarios, on a person's chain:
 * 1. `sync` after an action already synced throws, naming the instant it
 *    is synced to.
 * 2. `until` after a synced action throws, saying to cut it before syncing.
 * 3. `over` after a synced action throws, saying to put the overlays on it
 *    before syncing.
 * 4. `sync`, `until` and `over` on an empty chain throw "append one first".
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public chain's operators and reads the thrown messages; a synced action reported as a missing one fails.
 * @evidence contracts/development/testing.md#independent-expectations The expected words are what each operator's documentation states as its refusal.
 * @evidence contracts/development/testing.md#distinguishing-cases Each operator on a synced action, and each on no action.
 * @evidence contracts/development/testing.md#execution-ownership Builds chains in memory, with no body or performance, in milliseconds.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 4 scenarios.
 */
export function test_human_motion_core_chain_synced(): void {
  const message = (run: () => unknown): string => {
    try {
      run();
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
    return "no error";
  };
  const synced = (): HumanChain =>
    HumanChain.subject("b")
      .stand()
      .flinch()
      .sync({ of: "strike", event: "contact" });
  const complaints: string[] = [];
  const expect = (what: string, got: string, words: string): void => {
    if (!got.includes(words))
      complaints.push(`${what}: "${got}", expected it to say "${words}"`);
  };

  // 1 to 3. On a synced action.
  expect(
    "sync after sync",
    message(() => synced().sync({ of: "music", event: "beat" })),
    "already synced to strike",
  );
  expect(
    "until after sync",
    message(() => synced().until({ share: 0.5 })),
    "cut it first, then sync it",
  );
  expect(
    "over after sync",
    message(() =>
      synced().over(
        (u: HumanChain): HumanChain =>
          u.look({
            target: { kind: "person", subject: "a", region: "sternum" },
          }),
      ),
    ),
    "put the overlays on it first, then sync it",
  );

  // 4. On no action.
  const empty = (): HumanChain => HumanChain.subject("a");
  for (const [what, run] of [
    ["sync", () => empty().sync({ of: "strike" })],
    ["until", () => empty().until({ share: 0.5 })],
    ["over", () => empty().over((u: HumanChain): HumanChain => u)],
  ] as const)
    expect(`${what} on an empty chain`, message(run), "append one first");
  TestValidator.equals(
    "an operator names an already synced action",
    complaints,
    [],
  );
}
