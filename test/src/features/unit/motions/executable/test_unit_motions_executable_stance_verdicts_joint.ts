import type { IAutoMoviePose } from "@automovie/interface";
import { StanceVerdicts } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `StanceVerdicts.joint` reads a joint's displayed clinical angles, an unset
 * angle as zero and a joint the pose omits as all zeros.
 *
 * Scenarios:
 *
 * 1. A knee flexed 40 with its other angles unset reads (40, 0, 0).
 * 2. A hip the pose omits reads zeros.
 * 3. The reader is asked for the subject and second given.
 */
export function test_unit_motions_executable_stance_verdicts_joint(): void {
  const asked: [string, number][] = [];
  const shown: Pick<Parameters<typeof StanceVerdicts.joint>[0], "pose"> = {
    pose: (subject: string, seconds: number): IAutoMoviePose => {
      asked.push([subject, seconds]);
      return {
        skeleton: "s",
        root: null,
        joints: [
          { bone: "leftLowerLeg", flexion: 40, abduction: null, twist: null },
        ],
      };
    },
  };
  TestValidator.equals(
    "set, unset and omitted",
    [
      StanceVerdicts.joint(shown, "a", "leftLowerLeg", 1.5),
      StanceVerdicts.joint(shown, "a", "leftUpperLeg", 2),
      asked,
    ],
    [
      [40, 0, 0],
      [0, 0, 0],
      [
        ["a", 1.5],
        ["a", 2],
      ],
    ],
  );
}
