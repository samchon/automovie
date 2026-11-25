import { HumanRefusal, backToBackTogether } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `backToBackTogether`, the pairing rule of `backToBack.plan`: two backs leaning
 * on each other must bear and sit up together, within one 24 Hz frame.
 *
 * This lean bears from 1 s to 3 s.
 *
 * Scenarios:
 *
 * 1. A partner bearing from 1.03 s to 2.97 s, within a frame either way, is
 *    admitted.
 * 2. A partner sitting up at 2.5 s, or bearing only from 1.5 s, leaves this back
 *    leaning on nothing: refused on `with`.
 * 3. A partner still leaning until 3.5 s outlasts this back: refused on `hold`.
 */
export function test_unit_motions_touch_back_to_back(): void {
  const mine: backToBackTogether.IWindow = { ready: 1, relax: 3 };
  const refused = (
    partner: backToBackTogether.IWindow,
  ): HumanRefusal["axis"] | undefined => {
    try {
      backToBackTogether(mine, partner, "partner-lean", 1);
      return undefined;
    } catch (error: unknown) {
      return error instanceof HumanRefusal ? error.axis : undefined;
    }
  };
  TestValidator.equals(
    "leans within a frame pair, others are refused on their axis",
    [
      refused({ ready: 1.03, relax: 2.97 }),
      refused({ ready: 1, relax: 2.5 }),
      refused({ ready: 1.5, relax: 3 }),
      refused({ ready: 1, relax: 3.5 }),
    ],
    [undefined, "with", "with", "hold"],
  );
}
