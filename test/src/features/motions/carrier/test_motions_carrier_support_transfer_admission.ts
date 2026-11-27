import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  supportTransfer
} from "../../../../../packages/motions/src/carrier/internal/supportTransfer";
import { TestValidator } from "@nestia/e2e";

/**
 * A two-step transfer admits the bounded interval and independent supports.
 *
 * Scenarios:
 *
 * 1. Both duration limits admit distinct props, even with equal surface ids.
 * 2. Values just outside either limit fail first, and two differently named
 *    surfaces of the same prop fail even during an admitted interval.
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
