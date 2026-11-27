import type { AutoMovieHumanoidBone, IAutoMoviePose, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";
import {
  StanceVerdicts
} from "../../../../../packages/motions/src/executable/cases/StanceVerdicts";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

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
 * The stance captures' verdicts: a joint's displayed clinical angles and the
 * included angle at a middle joint.
 *
 * Scenarios:
 *
 * 1. A knee flexed 40 with its other angles unset reads (40, 0, 0), and a hip the
 *    pose omits reads zeros.
 * 2. A hip at 1 m, a knee at 0.5 m and the ankle swung forward to a right angle
 *    include 90 degrees at the knee.
 */
export function test_motions_executable_stance_verdicts(): void {
  const shown: Pick<Parameters<typeof StanceVerdicts.joint>[0], "pose"> = {
    pose: (): IAutoMoviePose => ({
      skeleton: "s",
      root: null,
      joints: [
        { bone: "leftLowerLeg", flexion: 40, abduction: null, twist: null },
      ],
    }),
  };
  TestValidator.equals(
    "set, unset and omitted",
    [
      StanceVerdicts.joint(shown, "a", "leftLowerLeg", 1.5),
      StanceVerdicts.joint(shown, "a", "leftUpperLeg", 2),
    ],
    [
      [40, 0, 0],
      [0, 0, 0],
    ],
  );
  TestValidator.predicate(
    "the right angle at the knee",
    nclose(
      StanceVerdicts.included(
        {
          bones: (): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
            new Map([
              at("leftUpperLeg", { x: 0, y: 1, z: 0 }),
              at("leftLowerLeg", { x: 0, y: 0.5, z: 0 }),
              at("leftFoot", { x: 0, y: 0.5, z: 0.5 }),
            ]),
        },
        "a",
        "leftUpperLeg",
        "leftLowerLeg",
        "leftFoot",
        0,
      ),
      90,
      1e-9,
    ),
  );
}
