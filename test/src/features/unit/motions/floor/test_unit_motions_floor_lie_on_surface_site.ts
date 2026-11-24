import type { IAutoMovieAffordance } from "@automovie/interface";
import { HumanRefusal, lieOnSurfaceSite } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

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
export function test_unit_motions_floor_lie_on_surface_site(): void {
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
