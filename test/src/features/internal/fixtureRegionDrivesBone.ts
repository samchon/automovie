import { IAutoMovieActionCall } from "@automovie/interface";

import { actionRegion, bodyRegionBones } from "@automovie/engine";

import { FIXTURE_BONE } from "./FIXTURE_BONE";

/**
 * Check whether a non-locomote action's canonical engine body region includes the fixture elbow. Locomotion deliberately has no fixture joints; actual gait content is exercised through the shipped gait owners, not synthesized here.
 */
export function fixtureRegionDrivesBone(action: IAutoMovieActionCall): boolean {
  return (
    action.verb !== "locomote" &&
    bodyRegionBones(actionRegion(action)).includes(FIXTURE_BONE)
  );
}
