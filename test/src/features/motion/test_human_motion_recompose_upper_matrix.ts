import {
  HUMAN_LEXICON,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  type IHumanActionLaw,
  type IHumanBody,
  seated,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { LexiconRowNet } from "../internal/LexiconRowNet";
import { motionHumanBody } from "../internal/motionHumanBody";

/** The upper-body families of the lexicon the recompose covers (#3361's grammar table: gestures, rest places, touches and hand-to-face acts). */
const FAMILIES: readonly string[] = ["emblem", "habit"];

/** The bases a row is performed on, as chains that end on that base. */
const BASES: readonly string[] = ["standing", "seated", "kneeling"];

/** The manners a row is performed in (#3306, #3343): none, and two of Laban's basic actions. */
const MANNERS: readonly (string | null)[] = [null, "press", "flick"];

/**
 * The composition matrix of the upper-body rows (#3361's acceptance): every
 * row by base {standing, seated, kneeling}, by carrier {none, walk} and by
 * manner {neutral, Effort press, Effort flick} either plans, placed under its
 * own name, or is refused with a reason (a `HumanRefusal`, whose message
 * names the axis and the fix). Any other outcome, a thrown error that is not
 * a refusal or a placed action under another name, is a defect of the row.
 *
 * Scenarios, on the average man, for every row of the `emblem` and `habit`
 * families with the parameters the lexicon net gives it:
 *
 * 1. On each base, with no carrier and each manner, the row plans or is
 *    refused with a reason.
 * 2. Over a walk as its carrier (`over`), standing, with each manner, the row
 *    plans or is refused with a reason.
 * 3. The two families hold at least one row each.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds a performance per cell of the matrix through the public chain and classifies its outcome.
 * @evidence contracts/development/testing.md#independent-expectations The matrix and its rule (plan or refuse with the reason) are the issue's acceptance; no value is read back from a law.
 * @evidence contracts/development/testing.md#distinguishing-cases Three bases, two carriers, three manners, every row of two families.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test preparing one polygon man; no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the matrix, its rule and the three scenarios.
 */
export function test_human_motion_recompose_upper_matrix(): void {
  const complaints: string[] = [];
  const body: IHumanBody = motionHumanBody("m-average");
  const seat: seated.ISeat = {
    at: { x: 0, y: seated.popliteal(body), z: body.rest.get("leftFoot")!.z - 0.1 },
    yaw: 0,
    depth: 0.45,
  };
  const base = (name: string): HumanChain =>
    name === "seated"
      ? HumanChain.subject("a").sit({ seat, seconds: 0.2 })
      : name === "kneeling"
        ? HumanChain.subject("a").kneel()
        : HumanChain.subject("a");
  const classify = (label: string, row: string, build: () => HumanPerformance): void => {
    try {
      const performance: HumanPerformance = build();
      const placed: readonly string[] = [
        ...performance.segments("a").map((s) => s.name),
        ...performance.overlays("a").map((o) => o.name),
      ];
      if (!placed.includes(row)) complaints.push(`${label}: ${row} was placed as ${placed.join(", ")}`);
    } catch (error) {
      if (!(error instanceof HumanRefusal))
        complaints.push(`${label}: ${row} threw ${(error as Error).message}, a plan or a refusal with its reason expected`);
    }
  };
  for (const family of FAMILIES) {
    const rows: readonly IHumanActionLaw<never>[] = HUMAN_LEXICON[family] ?? [];
    if (rows.length === 0) complaints.push(`the family ${family} holds no row`);
    for (const law of rows) {
      const given: object = LexiconRowNet.given(law.name) ?? {};
      for (const manner of MANNERS) {
        const params: object = manner === null ? given : { ...given, manner };
        const perform = (composition: HumanPerformance.IInput["composition"]): HumanPerformance =>
          new HumanPerformance({
            seed: "matrix",
            laws: [...rows],
            performers: [{ subject: "a", body, at: { x: 0, y: 0, z: 0 }, yaw: 0, proficiency: { level: "trained" } }],
            composition,
          });
        for (const b of BASES)
          classify(`${family} on ${b} in ${manner ?? "neutral"}`, law.name, () =>
            perform(base(b).registered(law.name, params).node),
          );
        classify(`${family} over a walk in ${manner ?? "neutral"}`, law.name, () =>
          perform(
            HumanChain.subject("a")
              .walk({ to: { x: 0, y: 0, z: 2 } })
              .over((o) => o.registered(law.name, params)).node,
          ),
        );
      }
    }
  }
  TestValidator.equals("every upper-body row plans or refuses with a reason on every base, carrier and manner", complaints, []);
}
