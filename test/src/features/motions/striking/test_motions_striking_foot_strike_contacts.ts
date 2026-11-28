import {
  footStrikeContacts
} from "../../../../../packages/motions/src/striking/internal/footStrikeContacts";
import { TestValidator } from "@nestia/e2e";

/**
 * A foot strike's contacts (`footStrikeContacts`): the striking foot stays
 * planted until its release, and the support foot pivots on the ground
 * throughout, or around the flight of a jumping strike.
 *
 * Scenarios:
 *
 * 1. A right strike released at 0.6 of 1.2 s plants the right foot to half the
 *    strike; without a jump the left pivots throughout.
 * 2. Jumping between 0.4 and 0.7, the left pivots before and after the flight.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the virtual foot plant and support pivot windows, including an airborne interruption.
 * @evidence contracts/development/testing.md#behavioral-verification Generates contact windows for the same rig on ground and with a declared flight interval.
 * @evidence contracts/development/testing.md#independent-expectations A 0.6 s release in a 1.2 s clip gives plant progress 0.5. The opposite support stays continuous except between the declared 0.4 and 0.7 flight bounds.
 */
export function test_motions_striking_foot_strike_contacts(): void {
  const base: footStrikeContacts.IPrepared = {
    side: "right",
    support: "left",
    release: 0.6,
    duration: 1.2,
    jump: false,
    flight: [0.4, 0.7],
  };
  TestValidator.equals("on the ground", footStrikeContacts(base), [
    {
      part: "rightFoot",
      kind: "plant",
      from: 0,
      to: 0.5,
      support: { kind: "ground" },
    },
    {
      part: "leftFoot",
      kind: "pivot",
      from: 0,
      to: 1,
      support: { kind: "ground" },
    },
  ]);
  TestValidator.equals(
    "jumping",
    footStrikeContacts({ ...base, jump: true }).slice(1),
    [
      {
        part: "leftFoot",
        kind: "pivot",
        from: 0,
        to: 0.4,
        support: { kind: "ground" },
      },
      {
        part: "leftFoot",
        kind: "pivot",
        from: 0.7,
        to: 1,
        support: { kind: "ground" },
      },
    ],
  );
}
