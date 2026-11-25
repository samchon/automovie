import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanRefusal,
  lieOnSurfaceFits,
  lieOnSurfaceSite,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

namespace part_lie_on_surface_fits {
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
  export function run(): void {
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
}

namespace part_lie_on_surface_site {
  /**
   * `lieOnSurfaceSite` finds a bed's affordance by id and kind, refusing a
   * missing seat on `edge` and a missing surface on `surface`.
   *
   * Scenarios, a bed declaring a `leftSide` seat and a `mattress` surface:
   *
   * 1. Each is found by its id and kind.
   * 2. A `rightSide` seat is refused on `edge`; `leftSide` asked as a surface is
   *    refused on `surface`.
   */
  export function run(): void {
    const site = (
      id: string,
      kind: "seat" | "surface",
    ): IAutoMovieAffordance => ({
      id,
      kind,
      frame: {
        translation: { x: 0, y: 0.5, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
      extent: null,
    });
    const seat: IAutoMovieAffordance = site("leftSide", "seat");
    const surface: IAutoMovieAffordance = site("mattress", "surface");
    const reader: Parameters<typeof lieOnSurfaceSite>[0] = {
      prop: { affordances: [seat, surface] },
    };
    TestValidator.predicate(
      "found",
      lieOnSurfaceSite(reader, "leftSide", "seat") === seat &&
        lieOnSurfaceSite(reader, "mattress", "surface") === surface,
    );
    const refused = (
      id: string,
      kind: "seat" | "surface",
    ): string | undefined => {
      try {
        lieOnSurfaceSite(reader, id, kind);
      } catch (error: unknown) {
        return error instanceof HumanRefusal ? error.axis : "other";
      }
      return undefined;
    };
    TestValidator.equals(
      "refused",
      [refused("rightSide", "seat"), refused("leftSide", "surface")],
      ["edge", "surface"],
    );
  }
}

/**
 * `lieOnSurface`'s unit contract: its site and fits.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `lie_on_surface_fits`: `lieOnSurfaceFits` refuses a lying surface shorter
 *   than the body and its margin, or narrower than its shoulders, both upper
 *   arms' radii and a margin either side.
 * - `lie_on_surface_site`: `lieOnSurfaceSite` finds a bed's affordance by id and
 *   kind, refusing a missing seat on `edge` and a missing surface on
 *   `surface`.
 */
export async function test_unit_motions_floor_lie_on_surface(): Promise<void> {
  part_lie_on_surface_fits.run();
  part_lie_on_surface_site.run();
}
