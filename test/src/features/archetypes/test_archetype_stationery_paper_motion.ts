import { createStationery } from "@automovie/archetypes";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../internal/archetypeExtent";
import { nclose, vclose } from "../internal/predicates";

/**
 * One leaf turns independently of its supported cover, and a map panel swings
 * around a single crease and lies flat alongside its base.
 *
 * Scenarios:
 * 1. On a 130 mm book, fully opening the cover preserves the leaf and its edge. A
 *    quarter-turn puts the fore-edge one leaf width above the spine. A half-turn
 *    places the leaf on the other side without moving the opened cover or spine grip.
 * 2. On the 110 mm folded map, a quarter-turn raises its moving layer's edge by
 *    one panel width. A half-turn doubles its width and leaves both panels flat
 *    without moving its single-layer supporting edge. The closed-stack grip
 *    still spans both layers. Posing again at rest closes the fold.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the support, dimensions, angles and observed outcomes.
 * @evidence contracts/development/testing.md#behavioral-verification Reads public contact origins and collider bounds through actual artwork states, catching a leaf coupled to the cover, a flat map with no unfolding panel or a moving supporting edge.
 * @evidence contracts/development/testing.md#independent-expectations A right angle lifts the fore-edge by the width and a half turn puts it on the far side of the fixed hinge. The map width and folded stack thickness are the producer's stated physical dimensions. One micrometre bounds numerical error in those constructed poses.
 * @evidence contracts/development/testing.md#distinguishing-cases Closed, upright and flat-open states, independent cover and leaf, and revisiting a closed state.
 * @evidence contracts/development/testing.md#execution-ownership Runs in memory on public archetypes without a process or viewer.
 */
export function test_archetype_stationery_paper_motion(): void {
  const tolerance: number = 1e-6;
  const book: ReturnType<typeof createStationery> = createStationery({
    kind: "book",
    width: 0.13,
    thickness: 0.02,
  });
  const opened: typeof book = book.articulate({ hinge: 180 });
  const turning: typeof book = book.articulate({ hinge: 180, page: 90 });
  const turned: typeof book = book.articulate({ hinge: 180, page: 180 });
  const foreEdge: IAutoMovieVector3 =
    book.affordance("page-edge").frame.translation;
  TestValidator.predicate(
    "opening the cover keeps the leaf on the back block",
    vclose(
      opened.affordance("page-edge").frame.translation,
      foreEdge,
      tolerance,
    ) &&
      nclose(archetypeExtent(opened, "x", ["leaf"]).low, -0.065, tolerance) &&
      nclose(archetypeExtent(opened, "x", ["leaf"]).high, 0.065, tolerance),
  );
  TestValidator.predicate(
    "the single leaf rises around the supported book's spine",
    vclose(
      turning.affordance("page-edge").frame.translation,
      { x: -0.065, y: foreEdge.y + 0.13, z: foreEdge.z },
      tolerance,
    ) &&
      vclose(
        turning.affordance("face").frame.translation,
        opened.affordance("face").frame.translation,
        tolerance,
      ),
  );
  TestValidator.predicate(
    "the turned leaf lies across the spine and the supporting grip stays fixed",
    nclose(archetypeExtent(turned, "x", ["leaf"]).low, -0.195, tolerance) &&
      nclose(archetypeExtent(turned, "x", ["leaf"]).high, -0.065, tolerance) &&
      nclose(archetypeExtent(turned, "y", ["leaf"]).low, 0.01, tolerance) &&
      vclose(
        turned.affordance("grip").frame.translation,
        book.affordance("grip").frame.translation,
        tolerance,
      ),
  );

  const map: ReturnType<typeof createStationery> = createStationery({
    kind: "map",
  });
  const standing: typeof map = map.articulate({ fold: 90 });
  const flat: typeof map = map.articulate({ fold: 180 });
  const base: ReturnType<typeof archetypeExtent> = archetypeExtent(map, "y", [
    "map",
  ]);
  const panel: ReturnType<typeof archetypeExtent> = archetypeExtent(map, "y", [
    "panel",
  ]);
  const support: IAutoMovieAffordance = map.affordance("support-grip");
  const fold: IAutoMovieAffordance = map.affordance("fold-edge");
  const stack: IAutoMovieAffordance = map.affordance("grip");
  TestValidator.predicate(
    "three grips address the base panel, moving panel and closed stack",
    vclose(
      support.frame.translation,
      { x: 0, y: 0.00175, z: 0.125 },
      tolerance,
    ) &&
      nclose(base.low, 0, tolerance) &&
      nclose(panel.low, base.high, tolerance) &&
      nclose(support.aperture!, base.size, tolerance) &&
      nclose(support.length!, 0.11, tolerance) &&
      nclose(fold.aperture!, panel.size, tolerance) &&
      nclose(stack.aperture!, 0.007, tolerance),
  );
  TestValidator.predicate(
    "the moving layer's edge rises one folded width above the crease",
    vclose(
      standing.affordance("fold-edge").frame.translation,
      { x: 0.05675, y: 0.1135, z: 0 },
      tolerance,
    ),
  );
  TestValidator.predicate(
    "the unfolded map lies flat at double the folded width",
    nclose(archetypeExtent(flat, "x").size, 0.22, tolerance) &&
      nclose(archetypeExtent(flat, "y").low, 0, tolerance) &&
      nclose(archetypeExtent(flat, "y").high, 0.0035, tolerance) &&
      vclose(
        flat.affordance("support-grip").frame.translation,
        support.frame.translation,
        tolerance,
      ) &&
      nclose(flat.affordance("support-grip").aperture!, 0.0035, tolerance) &&
      nclose(archetypeExtent(flat.articulate({}), "y").size, 0.007, tolerance),
  );
}
