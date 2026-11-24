import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanGrasp,
} from "@automovie/interface";
import { HumanRefusal, pickUpAlong } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** Rounding of a scaled sum, metres. */
const ROUNDING: number = 1e-12;

/** A grasp target's point and axis. */
type Target = Pick<IAutoMovieMotionHumanGrasp.ITarget, "point" | "axis">;

/**
 * `pickUpAlong` slides a grasp target along its handle's band to the share the
 * parameters name, by the share's distance from the middle times the band's
 * length, keeping the rest of the target.
 *
 * Scenarios, a 0.4 m `grip` band whose target sits at (0, 1, 0.3) along +X:
 *
 * 1. No share keeps the target as given.
 * 2. Share 0.75 moves it 0.1 m along the band; share 0 moves it 0.2 m back.
 * 3. A share outside [0, 1] is refused on `along`.
 */
export function test_unit_motions_handling_pick_up_along(): void {
  const grip: IAutoMovieAffordance = {
    id: "grip",
    kind: "handle",
    frame: {
      translation: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    extent: null,
    length: 0.4,
  };
  const context: (along?: number) => pickUpAlong.IContext = (
    along?: number,
  ): pickUpAlong.IContext => ({
    params: {
      prop: "cane",
      handle: "grip",
      ...(along === undefined ? {} : { along }),
    },
    prop: () => ({ prop: { affordances: [grip] } }),
  });
  const target: Target = {
    point: { x: 0, y: 1, z: 0.3 },
    axis: { x: 1, y: 0, z: 0 },
  };
  TestValidator.predicate(
    "no share",
    pickUpAlong(context(), target) === target,
  );
  TestValidator.predicate(
    "along the band",
    vclose(
      pickUpAlong(context(0.75), target).point,
      { x: 0.1, y: 1, z: 0.3 },
      ROUNDING,
    ) &&
      vclose(
        pickUpAlong(context(0), target).point,
        { x: -0.2, y: 1, z: 0.3 },
        ROUNDING,
      ),
  );
  let refused: boolean = false;
  try {
    pickUpAlong(context(1.5), target);
  } catch (error: unknown) {
    refused = error instanceof HumanRefusal && error.axis === "along";
  }
  TestValidator.predicate("outside the band", refused);
}
