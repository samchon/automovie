import {
  Quaternion,
  ROM_TOLERANCE,
  Vector3,
  curlChainUntilContact,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePhysicalProfile,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { IHumanBody } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import CORPUS from "../internal/MOTION_HUMAN_POSE_CORPUS.json";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanPoseCorpus } from "../internal/motionHumanPoseCorpus";

/**
 * The pose solver's cost work changes no pose beyond the resolution it is
 * solved to: a small fixed corpus of displayed poses
 * (`motionHumanPoseCorpus`: a pick-up, a walk and a punch on the average man
 * and the small woman, each with the other as partner, read at half and three
 * quarters of the film) gives every joint's three clinical angles as the
 * solver gave them when the corpus was recorded.
 *
 * Scenarios:
 * 1. The corpus holds the same poses under the same names, in order.
 * 2. Every angle of every joint is the recorded number within its
 *    tolerance, and a joint the recording left unset is still unset. A
 *    joint's angle is read within the joints' tolerance (`ROM_TOLERANCE`),
 *    the resolution the limb chains are solved to. A digit a grasp curls
 *    until contact follows the hand its limb carries, so its angle is read
 *    within what the limb's resolution moves it by
 *    (`curlChainUntilContact.resolution`): the arm's reach, read from the
 *    rig, over the joint's lever to the digit's tip, read from the rig and
 *    the distal phalanx's capsule.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs real laws through the public performance and reads the displayed pose's joints; a solver change that moves any angle by more than its tolerance fails with the pose, the bone and both numbers.
 * @evidence contracts/development/testing.md#independent-expectations Limitation: the expected values are recorded from the code itself before the cost work (#3517), and re-recorded only where a change meant to move them did, a regression oracle that pins behaviour, not a reference of what a pose should be; the tolerances are the solver's own resolution, read from its owners.
 * @evidence contracts/development/testing.md#distinguishing-cases A hand fitted to a requested rotation (the pick-up), planted legs (the walk) and a strike on a partner (the punch), each on two bodies of opposite build at two instants.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and reads twelve poses in memory, under a minute alone; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the corpus, the oracle's provenance, the tolerances with their owners and the 2 scenarios.
 */
export function test_human_motion_core_pose_regression(): void {
  const recorded: motionHumanPoseCorpus.IPose[] =
    // The recording is the reader's own output, written as JSON.
    CORPUS as unknown as motionHumanPoseCorpus.IPose[];
  const read: motionHumanPoseCorpus.IPose[] = motionHumanPoseCorpus.read();
  const complaints: string[] = [];

  // 1. The same poses.
  const names = (poses: motionHumanPoseCorpus.IPose[]): string =>
    poses.map((p: motionHumanPoseCorpus.IPose): string => p.name).join(" | ");
  if (names(read) !== names(recorded))
    complaints.push(
      `the corpus reads ${names(read)}, recorded ${names(recorded)}`,
    );

  // 2. Every angle, within its tolerance.
  recorded.forEach((was: motionHumanPoseCorpus.IPose, i: number): void => {
    const now: motionHumanPoseCorpus.IPose | undefined = read[i];
    if (now === undefined) return;
    const body: IHumanBody = motionHumanBody(
      was.name.split(" ")[2]!.split("+")[0]! as motionHumanBody.Name,
    );
    const bones: string[] = [
      ...new Set<string>([
        ...Object.keys(was.joints),
        ...Object.keys(now.joints),
      ]),
    ];
    for (const bone of bones)
      for (let k: number = 0; k < 3; k++) {
        const a: number | null | undefined = was.joints[bone]?.[k];
        const b: number | null | undefined = now.joints[bone]?.[k];

        // An unset angle stays unset; a set one is read within its
        // tolerance.
        const same: boolean =
          typeof a === "number" && typeof b === "number"
            ? Math.abs(a - b) <= tolerance(body, bone)
            : a === b;
        if (!same)
          complaints.push(
            `${was.name} ${bone}[${k}]: ${String(b)}, recorded ${String(a)}`,
          );
      }
  });
  TestValidator.equals(
    "the corpus poses as recorded",
    complaints.slice(0, 40),
    [],
  );
}

/**
 * A joint's tolerance, degrees: a curled digit's at its lever to the tip
 * (`curlChainUntilContact.resolution`), every other joint's `ROM_TOLERANCE`.
 */
function tolerance(body: IHumanBody, bone: string): number {
  const digit: RegExpExecArray | null = DIGIT.exec(bone);
  if (digit === null) return ROM_TOLERANCE;
  const side: string = digit[1]!;
  const rest = (name: string): IAutoMovieVector3 =>
    body.rest.get(name as AutoMovieHumanoidBone)!;
  const reach: number =
    Vector3.length(
      Vector3.subtract(rest(`${side}LowerArm`), rest(`${side}UpperArm`)),
    ) +
    Vector3.length(
      Vector3.subtract(rest(`${side}Hand`), rest(`${side}LowerArm`)),
    );
  const chain: string[] = (
    digit[2] === "Thumb"
      ? ["Metacarpal", "Proximal", "Distal"]
      : ["Proximal", "Intermediate", "Distal"]
  ).map((part: string): string => `${side}${digit[2]}${part}`);
  const capsule: IAutoMoviePhysicalProfile.IShape | undefined =
    body.profile.segments
      .find(
        (s: IAutoMoviePhysicalProfile.ISegment): boolean => s.bone === chain[2],
      )
      ?.shapes.find(
        (s: IAutoMoviePhysicalProfile.IShape): boolean => s.kind === "capsule",
      );

  // The distal phalanx reaches its tip at its capsule's far end.
  const tip: number =
    capsule === undefined || capsule.kind !== "capsule"
      ? 0
      : Vector3.length(
          Vector3.add(
            capsule.transform.position,
            Quaternion.rotateVector(capsule.transform.rotation, {
              x: 0,
              y: capsule.halfLength,
              z: 0,
            }),
          ),
        );
  let lever: number = tip;
  for (let j: number = Math.max(0, chain.indexOf(bone)); j < 2; j++)
    lever += Vector3.length(
      Vector3.subtract(rest(chain[j + 1]!), rest(chain[j]!)),
    );
  return lever > 0
    ? curlChainUntilContact.resolution(reach, lever)
    : ROM_TOLERANCE;
}

/** A digit's bone: its side and its digit. */
const DIGIT: RegExp =
  /^(left|right)(Thumb|Index|Middle|Ring|Little)(Metacarpal|Proximal|Intermediate|Distal)$/u;
