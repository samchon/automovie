import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  supportTransfer
} from "../../../../../packages/motions/src/carrier/internal/supportTransfer";
import { TestValidator } from "@nestia/e2e";

/**
 * Check the duration and distinct-support requirements of a two-step
 * transfer.
 *
 * Scenarios:
 *
 * 1. Admit 1.2 and 3 s between different props that each name the surface
 *    `deck` .
 * 2. At 1.199 and 3.001 s refuse on `seconds` . At 2 s refuse on `to` when
 *    two surface names belong to the same prop.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios specify inclusive durations, refusals and the support identity rule.
 * @evidence contracts/development/testing.md#behavioral-verification The fixture tests inclusive timing and verifies that duration is checked before same-prop identity.
 * @evidence contracts/development/testing.md#independent-expectations The duration values are fixed around the stated 1.2 to 3 s interval, and independent prop and surface names form the identity controls.
 */
export function test_motions_carrier_support_transfer_admission(): void {
  const from: supportTransfer.IAdmission["from"] = {
    prop: "dock",
    surface: "deck",
  };
  const to: supportTransfer.IAdmission["to"] = {
    prop: "boat",
    surface: "deck",
  };
  supportTransfer.admit({ from, to, seconds: 1.2 });
  supportTransfer.admit({ from, to, seconds: 3, docking: "co-moving" });
  const axis = (
    seconds: number,
    destination: supportTransfer.IAdmission["to"],
  ): string | undefined => {
    try {
      supportTransfer.admit({ from, to: destination, seconds });
    } catch (error: unknown) {
      if (!(error instanceof AutoMovieMotionHumanRefusal)) throw error;
      return error.axis;
    }
    return undefined;
  };
  TestValidator.equals(
    "guards in the authored order",
    [
      axis(1.199, from),
      axis(3.001, to),
      axis(2, { ...from, surface: "stern" }),
    ],
    ["seconds", "seconds", "to"],
  );
}
