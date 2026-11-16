import { HUMAN_LEXICON, type IHumanActionLaw } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { LexiconRowNet } from "../internal/LexiconRowNet";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionRowVerdicts } from "../internal/motionRowVerdicts";

/**
 * Every shipped verdict holds for the upper-body rows (#3361's first
 * acceptance line): each row of the `emblem` and `habit` families that needs
 * no parameter of its own and no prop its own test stages
 * (`LexiconRowNet.STAGED`), performed after a quiet stance on every body of
 * `EXTREMES`, reads `clean` from the shipped verdict report over both halves
 * of its film, its bounds untouched.
 *
 * Scenarios:
 *
 * 1. For each such row and each of the four bodies, both halves of the
 *    report are clean.
 * 2. The two families hold at least one row needing no parameter.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs each row through the public chain and reads the shipped verdict report of the displayed film (`motionRowVerdicts`).
 * @evidence contracts/development/testing.md#independent-expectations The verdicts' own bounds, which the issue keeps untouched.
 * @evidence contracts/development/testing.md#distinguishing-cases Four bodies of different stature and build, every parameterless row of two families, both halves of each film.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test preparing polygon men; no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the sweep and the two scenarios.
 */
export function test_human_motion_recompose_upper_verdicts(): void {
  const complaints: string[] = [];
  let rows: number = 0;
  for (const family of ["emblem", "habit"])
    for (const law of HUMAN_LEXICON[family] ??
      ([] as readonly IHumanActionLaw<never>[])) {
      // A row that needs a parameter, or a prop its own test stages
      // (`LexiconRowNet.STAGED`, a photograph's camera), is that test's.
      if (
        LexiconRowNet.given(law.name) !== undefined ||
        LexiconRowNet.STAGED.includes(law.name)
      )
        continue;
      ++rows;
      for (const name of motionHumanBody.EXTREMES)
        for (const half of [1, 2] as const) {
          const report: string = motionRowVerdicts(law.name, name, half);
          if (report !== "clean")
            complaints.push(
              `${family} ${law.name} on ${name}, half ${half}: ${report}`,
            );
        }
    }
  if (rows === 0)
    complaints.push("no upper-body row needing no parameter was found");
  TestValidator.equals(
    "every shipped verdict holds for the upper-body rows",
    complaints,
    [],
  );
}
