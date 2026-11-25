import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { StanceVerdicts } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** The scenarios of `test_unit_motions_executable_stance_verdicts_included`. */
namespace ScenarioStanceVerdictsIncluded {
  /** A resolved bone at a world point, unturned. */
  const at = (
    bone: AutoMovieHumanoidBone,
    worldPosition: IAutoMovieVector3,
  ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [
    bone,
    {
      bone,
      localRotation: { x: 0, y: 0, z: 0, w: 1 },
      worldPosition,
      worldRotation: { x: 0, y: 0, z: 0, w: 1 },
    },
  ];

  /**
   * `StanceVerdicts.included` is the angle at a middle joint between the segments
   * to its neighbours, degrees: 180 for a straight limb.
   *
   * Scenarios:
   *
   * 1. A hip, knee and ankle in a straight line read 180.
   * 2. The ankle swung to a right angle reads 90; folded halfway back, 45.
   */
  export function test_unit_motions_executable_stance_verdicts_included(): void {
    const leg = (
      ankle: IAutoMovieVector3,
    ): Parameters<typeof StanceVerdicts.included>[0] => ({
      bones: (): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
        new Map([
          at("leftUpperLeg", { x: 0, y: 1, z: 0 }),
          at("leftLowerLeg", { x: 0, y: 0.5, z: 0 }),
          at("leftFoot", ankle),
        ]),
    });
    const angle = (ankle: IAutoMovieVector3): number =>
      StanceVerdicts.included(
        leg(ankle),
        "a",
        "leftUpperLeg",
        "leftLowerLeg",
        "leftFoot",
        0,
      );
    TestValidator.predicate(
      "straight, right and folded",
      nclose(angle({ x: 0, y: 0, z: 0 }), 180, 1e-9) &&
        nclose(angle({ x: 0, y: 0.5, z: 0.5 }), 90, 1e-9) &&
        nclose(
          angle({ x: 0, y: 0.5 + Math.SQRT1_2, z: Math.SQRT1_2 }),
          45,
          1e-9,
        ),
    );
  }
}

/** The scenarios of `test_unit_motions_executable_stance_verdicts_joint`. */
namespace ScenarioStanceVerdictsJoint {
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
}

/**
 * The `stance_verdicts` family's own logic, one scenario group per namespace
 * above: each group's scenarios are documented on it.
 */
export function test_unit_motions_executable_stance_verdicts(): void {
  ScenarioStanceVerdictsIncluded.test_unit_motions_executable_stance_verdicts_included();
  ScenarioStanceVerdictsJoint.test_unit_motions_executable_stance_verdicts_joint();
}
