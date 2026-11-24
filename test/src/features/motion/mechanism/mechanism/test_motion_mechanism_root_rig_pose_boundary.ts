import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { poseBones } from "@automovie/motions/internal";

import { everydayTake } from "../../../internal/everydayTake";
import { joint } from "../../../internal/joint";
import { motionComplaints } from "../../../internal/motionComplaints";
import { motionHumanBody } from "../../../internal/motionHumanBody";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/**
 * A borrowed fixed human rig reads changing world placement and elbow pose.
 *
 * Scenarios:
 *
 * 1. Rigid placement translates both requested bones equally.
 * 2. A local elbow bend moves the wrist while preserving segment length.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents which bones are requested and the expected effects of world translation and elbow flexion.
 * @evidence contracts/development/testing.md#behavioral-verification Requests posed elbow and wrist, observes a live rigid translation and then observes wrist movement under elbow flexion.
 * @evidence contracts/development/testing.md#independent-expectations A common world translation adds its three coordinates exactly. Rotating about the elbow preserves the length of the forearm chord independently of angle convention.
 * @evidence contracts/development/testing.md#distinguishing-cases Distinguishes a whole-body translation from a local articulation and requires the exact requested output names.
 * @evidence contracts/development/testing.md#execution-ownership One anatomical rig, a fixed pair of requested bones and three direct FK reads.
 */
export function test_motion_mechanism_root_rig_pose_boundary(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const names: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    "rightLowerArm",
    "rightHand",
  ]);
  const placed: IAutoMoviePose = {
    skeleton: body.skeleton.id,
    root: null,
    joints: [],
  };
  const translated: IAutoMoviePose = {
    ...placed,
    root: {
      translation: { x: 1, y: 2, z: -1 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
  };
  const straight: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(body, placed, undefined, names);
  const moved: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    translated,
    undefined,
    names,
  );
  const bent: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    { ...translated, joints: [joint("rightLowerArm", { flexion: 60 })] },
    undefined,
    names,
  );
  // The model spans metres. This allows round-off in several transform products.
  const rounding: number = 128 * Number.EPSILON;
  checks.equals(
    "the borrowed rig returns only requested bones",
    [...moved.keys()],
    [...names],
  );
  for (const name of names) {
    try {
      const original: IAutoMovieVector3 = straight.get(name)!.worldPosition;
      checks.check(
        `${name} follows the world translation`,
        vclose(
          moved.get(name)!.worldPosition,
          { x: original.x + 1, y: original.y + 2, z: original.z - 1 },
          rounding,
        ),
      );
    } catch (error: unknown) {
      checks.check(`${String(name)}: ${everydayTake.describe(error)}`, false);
    }
  }
  const elbow: IAutoMovieVector3 = moved.get("rightLowerArm")!.worldPosition;
  const wrist: IAutoMovieVector3 = moved.get("rightHand")!.worldPosition;
  const folded: IAutoMovieVector3 = bent.get("rightHand")!.worldPosition;
  checks.check(
    "elbow articulation moves the wrist along a fixed-length chord radius",
    vclose(bent.get("rightLowerArm")!.worldPosition, elbow, rounding) &&
      distance(wrist, folded) > rounding &&
      nclose(distance(wrist, elbow), distance(folded, elbow), rounding),
  );
  checks.assert("mechanism root rig pose boundary");
}

/** The Euclidean distance between two independently observed world points. */
function distance(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}
