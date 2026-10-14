import type { IAutoMovieWorldRoute } from "@automovie/interface";

/**
 * Preserve the original three ten-metre route legs: east, north, then west.
 *
 * @evidence contracts/testing.md#behavioral-verification The instance-layout unit passes this unchanged route snapshot to actual arc-length placement and its unavailable/zero/infinite-length twins.
 * @evidence contracts/testing.md#independent-expectations Authored waypoints determine thirty metres and four slot midpoints; this constant does not compute the expected positioned members.
 * @evidence contracts/testing.md#distinguishing-cases The same singleton route remains shared by default route placements and shallow-spread negative inputs, retaining original order and width.
 * @evidence contracts/testing.md#execution-ownership Module lifetime owns this unchanged record, borrowed by callers without mutation; it opens no file, host, browser or GPU.
 */
export const INSTANCE_SLOT_TEST_ROAD: IAutoMovieWorldRoute = {
  id: "road",
  waypoints: [
    { x: 0, z: 0 },
    { x: 10, z: 0 },
    { x: 10, z: 10 },
    { x: 0, z: 10 },
  ],
  allowedFormationWidth: 4,
};
