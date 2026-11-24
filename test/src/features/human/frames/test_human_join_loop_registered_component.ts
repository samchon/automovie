import { AutoMovieHumanJoinLoop } from "@automovie/human";

import { HumanTransverseCylinder } from "./HumanTransverseCylinder";

/**
 * @evidence contracts/development/testing.md#behavioral-verification The registered +Z component of a transverse two-cylinder crossing owns its actual source stations.
 * @evidence contracts/development/testing.md#independent-expectations The larger wall has z=sqrt(100^2-x^2) on the positive side and the transverse cylinder has |x|<=20.
 * @evidence contracts/development/testing.md#distinguishing-cases The opposite physical crossing has negative world Z and must not supply the selected contact.
 * @evidence contracts/development/testing.md#execution-ownership One synchronous made paired-source fixture.
 */
export function test_human_join_loop_registered_component(): void {
  const { host, crossing, phases } = HumanTransverseCylinder();
  const selected = AutoMovieHumanJoinLoop.originalGerm(host, crossing, phases, 32, 1e-3, 0.01,
    () => true, (curve): boolean => curve.points.every((point): boolean => point.point[2] > 0));
  if (!selected.curve.points.every((q): boolean => q.s > 240 && q.s <= 251) ||
      !(selected.centre[0] > 180 && selected.centre[0] < 220))
    throw new Error("the source-selected positive contact component did not contain the actual transverse cylinder crossing");
}
