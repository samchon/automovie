import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanRefusal, supportTransfer } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `supportTransfer` boards from one surface to another over one bounded
 * two-step interval, 1.2 to 3 s, between two props.
 *
 * Scenarios:
 *
 * 1. A 0.5 s transfer is refused on `seconds`.
 * 2. A 2 s transfer between two surfaces of one prop is refused on `to`.
 */
export async function test_unit_motions_carrier_support_transfer(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const refused = (seconds: number): string | undefined => {
    try {
      supportTransfer(
        motionActionContext(body, {
          from: { prop: "dock", surface: "deck" },
          to: { prop: "dock", surface: "deck" },
          lead: "left" as const,
          seconds,
        }),
      );
    } catch (error: unknown) {
      return error instanceof HumanRefusal ? error.axis : "error";
    }
    return undefined;
  };
  TestValidator.equals(
    "refusals",
    [refused(0.5), refused(2)],
    ["seconds", "to"],
  );
}
