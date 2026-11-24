import { createAutoMovieRandom, deriveAutoMovieSeed } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanTouchSite,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanRefusal, touchSite } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** Rounding of a few products, metres. */
const ROUNDING: number = 1e-12;

/**
 * `touchSite` moves a touch's contact over its surface: by an offset up and out
 * in the surface's plane (up the world's +Y laid on it, out across it), not at
 * all along a prop's contact, toward the shoulder by at most `within` for a
 * reach rule, and by a drawn point within `draw` of it.
 *
 * Scenarios, a surface at (0, 1.2, 0.1) facing +Z and the shoulder at (0.2,
 * 1.4, 0):
 *
 * 1. 0.05 m up and 0.02 m out moves the contact to (0.02, 1.25, 0.1).
 * 2. A site along a contact keeps it.
 * 3. A reach rule within 0.1 m moves it 0.1 m toward the shoulder laid on the
 *    surface, `(0.2, 0.2, 0) / |.| * 0.1`; within 1 m all the way, (0.2, 0.2,
 *    0).
 * 4. A drawn site lies on the surface's plane within its 0.05 m.
 * 5. A negative `within` is refused on `site.within`.
 */
export function test_unit_motions_touch_touch_site(): void {
  const context: Parameters<typeof touchSite>[0] = {
    series: () => ({
      random: createAutoMovieRandom(deriveAutoMovieSeed("site")),
      index: 1,
    }),
  };
  const frame: IAutoMovieMotionHumanTouchSite.IFrame = {
    point: { x: 0, y: 1.2, z: 0.1 },
    normal: { x: 0, y: 0, z: 1 },
  };
  const shoulder: IAutoMovieVector3 = { x: 0.2, y: 1.4, z: 0 };
  const at: (
    site: IAutoMovieMotionHumanTouchSite.ISite,
  ) => IAutoMovieVector3 = (
    site: IAutoMovieMotionHumanTouchSite.ISite,
  ): IAutoMovieVector3 => touchSite(context, site)(frame, shoulder).point;
  TestValidator.predicate(
    "up and out",
    vclose(at({ up: 0.05, out: 0.02 }), { x: 0.02, y: 1.25, z: 0.1 }, ROUNDING),
  );
  TestValidator.predicate(
    "along a contact",
    vclose(at({ along: 0.3 }), frame.point, ROUNDING),
  );
  const short: number = 0.1 / Math.hypot(0.2, 0.2);
  TestValidator.predicate(
    "toward the shoulder",
    vclose(
      at({ rule: "reach", within: 0.1 }),
      { x: 0.2 * short, y: 1.2 + 0.2 * short, z: 0.1 },
      ROUNDING,
    ) &&
      vclose(
        at({ rule: "reach", within: 1 }),
        { x: 0.2, y: 1.4, z: 0.1 },
        ROUNDING,
      ),
  );
  const drawn: IAutoMovieVector3 = at({ draw: 0.05 });
  TestValidator.predicate(
    "a drawn point",
    Math.abs(drawn.z - 0.1) <= ROUNDING &&
      Math.hypot(drawn.x, drawn.y - 1.2) <= 0.05 + ROUNDING,
  );
  let refused: boolean = false;
  try {
    touchSite(context, { rule: "reach", within: -1 });
  } catch (error: unknown) {
    refused = error instanceof HumanRefusal && error.axis === "site.within";
  }
  TestValidator.predicate("a negative within", refused);
}
