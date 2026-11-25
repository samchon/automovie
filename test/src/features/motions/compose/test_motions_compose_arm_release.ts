import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanArmChain,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";

/**
 * A prepared arm hands its joint pose back to the authored arm on release.
 *
 * Scenarios:
 * 1. The held wrist goal is removed and retains the distinct bent elbow.
 * 2. Immediately before release the joints approach the unforced endpoint.
 * 3. Digits interpolate to the unforced hand on the same two-knot clock.
 */
export async function test_motions_compose_arm_release(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const held: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: { leftLowerArm: [80, 0, 0], leftIndexProximal: [10, 0, 0] },
    limbs: {},
  };
  const placed: ReturnType<typeof poseBones> = poseBones(
    body,
    resolveHumanPosture(body, held),
    undefined,
    new Set<AutoMovieHumanoidBone>(["leftLowerArm", "leftHand"]),
  );
  const active: IAutoMovieMotionHumanPosture = {
    ...held,
    limbs: {
      leftArm: {
        point: placed.get("leftHand")!.worldPosition,
        bend: placed.get("leftLowerArm")!.worldPosition,
      },
    },
  };
  const native: IAutoMovieMotionHumanPosture = {
    ...held,
    joints: { leftLowerArm: [25, 0, 0], leftIndexProximal: [30, 0, 0] },
  };

  // One interval shorter than the course's regular step contains just these
  // two instants. The declared clinical elbow is a hinge, so its blend is
  // linear, as are the stored finger angles.
  const release: number = 1 / 64;
  const read: ReturnType<typeof AutoMovieMotionHumanArmChain.continued> =
    AutoMovieMotionHumanArmChain.continued(
      body,
      release,
      (t: number): IAutoMovieMotionHumanPosture => (t < release ? active : native),
      ["left"],
      "angles",
    );
  const first: IAutoMovieMotionHumanPosture = read(0, active);
  const middle: IAutoMovieMotionHumanPosture = read(release / 2, active);
  const before: IAutoMovieMotionHumanPosture = read(
    release * (1 - 1e-6),
    active,
  );
  const last: IAutoMovieMotionHumanPosture = read(release, native);
  TestValidator.predicate(
    "the held arm uses the bent elbow and consumes its wrist goal",
    first.limbs.leftArm === undefined && first.joints.leftLowerArm![0] > 60,
  );
  TestValidator.predicate(
    "the last interval approaches the authored 25 degree release elbow",
    before.limbs.leftArm === undefined &&
      nclose(before.joints.leftLowerArm![0], 25, 0.001) &&
      nclose(last.joints.leftLowerArm![0], 25, 1e-9),
  );
  TestValidator.predicate(
    "the prepared fingers move from 10 degrees to 30 degrees via 20 degrees",
    nclose(first.joints.leftIndexProximal![0], 10, 1e-9) &&
      nclose(middle.joints.leftIndexProximal![0], 20, 1e-9) &&
      nclose(last.joints.leftIndexProximal![0], 30, 1e-9),
  );
}
