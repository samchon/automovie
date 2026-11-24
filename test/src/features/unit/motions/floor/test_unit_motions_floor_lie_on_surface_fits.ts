import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanRefusal, lieOnSurfaceFits } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `lieOnSurfaceFits` refuses a lying surface shorter than the body and its
 * margin, or narrower than its shoulders, both upper arms' radii and a margin
 * either side.
 *
 * Scenarios, a 1.75 m body with shoulders 0.36 m apart and 0.05 m upper arm
 * radius, a 0.05 m margin (needing 1.8 m by 0.56 m):
 *
 * 1. A 2 by 1.4 m bed fits.
 * 2. A 1.7 m long one is refused on `length`.
 * 3. A 0.5 m wide one is refused on `width`.
 */
export function test_unit_motions_floor_lie_on_surface_fits(): void {
  const body: lieOnSurfaceFits.IBody = {
    measure: { stature: 1.75, upperArmRadius: 0.05 },
    rest: new Map<AutoMovieHumanoidBone, IAutoMovieVector3>([
      ["leftUpperArm", { x: 0.18, y: 1.45, z: 0 }],
      ["rightUpperArm", { x: -0.18, y: 1.45, z: 0 }],
    ]),
  };
  const refused = (depth: number, width: number): string | undefined => {
    try {
      lieOnSurfaceFits(body, { depth, width }, 0.05);
    } catch (error: unknown) {
      return error instanceof HumanRefusal ? error.axis : "other";
    }
    return undefined;
  };
  TestValidator.equals(
    "the fits",
    [refused(2, 1.4), refused(1.7, 1.4), refused(2, 0.5)],
    [undefined, "length", "width"],
  );
}
