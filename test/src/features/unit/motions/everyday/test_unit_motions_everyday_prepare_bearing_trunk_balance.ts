import type {
  AutoMovieHumanoidRegion,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBalance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import { prepareBearingTrunkBalance } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";

/**
 * `prepareBearingTrunkBalance` prepares a lumbar balance over the contacts that
 * bear inside its window: the bearing contacts, their surfaces' bones and the
 * trunk balance over them are all read when it is prepared, so a contact whose
 * surface the body does not declare is refused there, not at a later read; no
 * window, or a second outside it, leaves the posture as it is.
 *
 * The body is built whole (`humanFixtureBody`): the balance reads the trunk's
 * rig and the bearing surfaces.
 *
 * Scenarios, a 1 s action whose left foot plants through it:
 *
 * 1. With no window, the write returns its posture.
 * 2. With a hips window over 0.2 to 0.8 s, a write at 0.1 s, outside it, returns
 *    its posture.
 * 3. On a body whose surfaces lack the left sole, preparing the balance throws.
 */
export async function test_unit_motions_everyday_prepare_bearing_trunk_balance(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const contacts: IAutoMovieMotionHumanContactWindow[] = [
    {
      part: "leftFoot",
      kind: "plant",
      from: 0,
      to: 1,
      support: { kind: "ground" },
    },
  ];
  const posture: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const window: IAutoMovieMotionHumanBalance.IWindow = {
    from: 0.2,
    to: 0.8,
    by: "hips",
    weight: 1,
    ramp: { in: 0.1, out: 0.1 },
  };
  TestValidator.predicate(
    "outside the window",
    prepareBearingTrunkBalance(body, null, 1, contacts)(posture, 0.5) ===
      posture &&
      prepareBearingTrunkBalance(body, window, 1, contacts)(posture, 0.1) ===
        posture,
  );
  const regions: Partial<
    Record<AutoMovieHumanoidRegion, IAutoMovieHumanoidSurfaces.IFrame>
  > = { ...body.surfaces.regions };
  delete regions.soleLeft;
  const soleless: IAutoMovieMotionHumanBody = {
    ...body,
    surfaces: {
      ...body.surfaces,
      regions: regions as IAutoMovieHumanoidSurfaces.ISurfaces["regions"],
    },
  };
  TestValidator.error("an undeclared surface", (): void => {
    prepareBearingTrunkBalance(soleless, window, 1, contacts);
  });
}
