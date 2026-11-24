import { AutoMovieHumanJoinLoop } from "@automovie/human";

import { HumanTransverseCylinder } from "./HumanTransverseCylinder";

/**
 * @evidence contracts/development/testing.md#behavioral-verification Admitting both real saddle curves refuses the attachment as ambiguous.
 * @evidence contracts/development/testing.md#independent-expectations The two cylinder intersections have disjoint world-Z signs.
 * @evidence contracts/development/testing.md#distinguishing-cases The same fixture with the +Z registry has one component in test_human_join_loop_registered_component.
 * @evidence contracts/development/testing.md#execution-ownership One synchronous made paired-source fixture.
 */
export function test_human_join_loop_competing_components(): void {
  const { host, crossing, phases } = HumanTransverseCylinder();
  try {
    AutoMovieHumanJoinLoop.originalGerm(host, crossing, phases, 32, 1e-3, 0.01, () => true, () => true);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("2 registered closed components")) return;
    throw error;
  }
  throw new Error("two bounded material components supplied a single registered contact");
}
