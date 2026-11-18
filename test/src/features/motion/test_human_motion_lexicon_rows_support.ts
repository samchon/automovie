import type { IAutoMovieMotionHumanSupport } from "@automovie/interface";
import { HumanSupportRows } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * Both edge transfers end on two feet. The scramble climbs onto the ledge and the slide leaves it.
 *
 * Scenarios:
 * 1. The scramble starts with feet on the floor and hands on the ledge, then finishes on the ledge.
 * 2. The slide starts bearing on the seat and hands on the table, then finishes on the floor.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the contact and support change in each direction.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the fixed stance sequence through each installed row's public resolver.
 * @evidence contracts/development/testing.md#independent-expectations The direction of transfer determines which surface takes each endpoint's load.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks entering and leaving an elevated support, including a seated entry.
 * @evidence contracts/development/testing.md#execution-ownership Checks the authored input to the support planner without preparing a rig.
 */
export function test_human_motion_lexicon_rows_support(): void {
  for (const name of ["scramble", "slideOff"] as const) {
    const params = HumanSupportRows[name].resolve!(
      {},
    ) as IAutoMovieMotionHumanSupport;
    const stances = params.stances!;
    const bearing = (stance: IAutoMovieMotionHumanSupport.IStance): string[] =>
      stance.contacts
        .filter((contact) => contact.kind === "bear")
        .map((contact) => contact.part + "/" + (contact.target ?? "floor"))
        .sort();
    TestValidator.equals(
      name + " entry",
      bearing(stances[0]!),
      name === "scramble"
        ? ["leftFoot/floor", "leftHand/on", "rightFoot/floor", "rightHand/on"]
        : ["leftHand/on", "rightHand/on", "seat/on"],
    );
    TestValidator.equals(
      name + " standing exit",
      bearing(stances[stances.length - 1]!),
      name === "scramble"
        ? ["leftFoot/on", "rightFoot/on"]
        : ["leftFoot/floor", "rightFoot/floor"],
    );
  }
}
