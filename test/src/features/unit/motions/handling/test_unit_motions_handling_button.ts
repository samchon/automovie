import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanButton,
} from "@automovie/interface";
import { HumanRefusal, button } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `button.plan` admits a buttoning before any hand is moved: a nonzero travel
 * and a positive radius, thickness and duration, refused on `travel` as a
 * parameter otherwise.
 *
 * Scenarios, the average man at the origin buttoning a 50 mm travel, a 10 mm
 * button through a 4 mm panel in 0.45 s:
 *
 * 1. No travel is refused on `travel`.
 * 2. A panel of no thickness is refused on `travel`.
 *
 * The body is built whole (`humanFixtureBody`) for the context's entry.
 */
export async function test_unit_motions_handling_button(): Promise<void> {
  // The context's entry reads the whole body's stance.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const params: IAutoMovieMotionHumanButton = {
    garment: "garment",
    opening: "opening",
    rim: "rim",
    button: "center",
    contact: "push",
    travel: 0.05,
    radius: 0.01,
    thickness: 0.004,
    duration: 0.45,
  };
  const refusal = (
    of: IAutoMovieMotionHumanButton,
  ): HumanRefusal | undefined => {
    try {
      button.plan(motionActionContext(body, of));
      return undefined;
    } catch (error: unknown) {
      return error instanceof HumanRefusal ? error : undefined;
    }
  };
  const still = refusal({ ...params, travel: 0 });
  const flat = refusal({ ...params, thickness: 0 });
  TestValidator.predicate(
    "the refusals",
    still?.axis === "travel" &&
      still.kind === "parameter" &&
      flat?.axis === "travel" &&
      flat.kind === "parameter",
  );
}
