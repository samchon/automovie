import { createStationery } from "@automovie/archetypes";
import type {
  IAutoMovieAffordance,
  IAutoMoviePhysicalShape,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../../../features/internal/archetypeExtent";
import { nclose, vclose } from "../../../../features/internal/predicates";

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
 * @evidence contracts/development/testing.md#independent-expectations A right angle lifts the fore-edge by the width and a half turn puts it on the far side of the fixed hinge. The folded map measures 110 by 250 mm with a 7 mm stack. Equal rigid layers and a crease at their common boundary give the standing edge its half-layer horizontal offset and the flat map its doubled width. One micrometre bounds numerical error in those constructed poses.
 * @evidence contracts/development/testing.md#distinguishing-cases Closed, upright and flat-open states, independent cover and leaf, and revisiting a closed state.
 * @evidence contracts/development/testing.md#execution-ownership Runs in memory on public archetypes without a process or viewer.
 */
export function test_motion_mechanism_stationery_paper_motion(): void {
  const tolerance: number = 1e-6;
  const bookWidth: number = 0.13;
  const bookThickness: number = 0.02;
  const spineX: number = -bookWidth / 2;
  const book: ReturnType<typeof createStationery> = createStationery({
    kind: "book",
    width: bookWidth,
    thickness: bookThickness,
  });
  const opened: typeof book = book.articulate({ hinge: 180 });
  const turning: typeof book = book.articulate({ hinge: 180, page: 90 });
  const turned: typeof book = book.articulate({ hinge: 180, page: 180 });
  const openedLeaf: ReturnType<typeof archetypeExtent> = archetypeExtent(
    opened,
    "x",
    ["leaf"],
  );
  const turnedShapes: IAutoMoviePhysicalShape[] = turned.shapes();
  const turnedLeaf: ReturnType<typeof archetypeExtent> = archetypeExtent(
    turnedShapes,
    "x",
    ["leaf"],
  );
  const foreEdge: IAutoMovieVector3 =
    book.affordance("page-edge").frame.translation;
  TestValidator.predicate(
    "opening the cover keeps the leaf on the back block",
    vclose(
      opened.affordance("page-edge").frame.translation,
      foreEdge,
      tolerance,
    ) &&
      nclose(openedLeaf.low, spineX, tolerance) &&
      nclose(openedLeaf.high, -spineX, tolerance),
  );
  TestValidator.predicate(
    "the single leaf rises around the supported book's spine",
    vclose(
      turning.affordance("page-edge").frame.translation,
      { x: spineX, y: foreEdge.y + bookWidth, z: foreEdge.z },
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
    nclose(turnedLeaf.low, spineX - bookWidth, tolerance) &&
      nclose(turnedLeaf.high, spineX, tolerance) &&
      nclose(
        archetypeExtent(turnedShapes, "y", ["leaf"]).low,
        bookThickness / 2,
        tolerance,
      ) &&
      vclose(
        turned.affordance("face").frame.translation,
        { x: -bookWidth, y: 0, z: 0 },
        tolerance,
      ) &&
      vclose(
        turned.affordance("grip").frame.translation,
        book.affordance("grip").frame.translation,
        tolerance,
      ),
  );

  const mapWidth: number = 0.11;
  const mapLength: number = 0.25;
  const stackThickness: number = 0.007;
  const layerThickness: number = stackThickness / 2;
  const map: ReturnType<typeof createStationery> = createStationery({
    kind: "map",
  });
  const standing: typeof map = map.articulate({ fold: 90 });
  const flat: typeof map = map.articulate({ fold: 180 });
  const foldedShapes: IAutoMoviePhysicalShape[] = map.shapes();
  const flatShapes: IAutoMoviePhysicalShape[] = flat.shapes();
  const flatHeight: ReturnType<typeof archetypeExtent> = archetypeExtent(
    flatShapes,
    "y",
  );
  const base: ReturnType<typeof archetypeExtent> = archetypeExtent(
    foldedShapes,
    "y",
    ["map"],
  );
  const panel: ReturnType<typeof archetypeExtent> = archetypeExtent(
    foldedShapes,
    "y",
    ["panel"],
  );
  const support: IAutoMovieAffordance = map.affordance("support-grip");
  const fold: IAutoMovieAffordance = map.affordance("fold-edge");
  const stack: IAutoMovieAffordance = map.affordance("grip");
  TestValidator.predicate(
    "three grips address the base panel, moving panel and closed stack",
    vclose(
      support.frame.translation,
      { x: 0, y: layerThickness / 2, z: mapLength / 2 },
      tolerance,
    ) &&
      nclose(base.low, 0, tolerance) &&
      nclose(panel.low, base.high, tolerance) &&
      nclose(base.size, layerThickness, tolerance) &&
      nclose(panel.size, layerThickness, tolerance) &&
      nclose(support.aperture!, base.size, tolerance) &&
      nclose(support.length!, mapWidth, tolerance) &&
      nclose(fold.aperture!, panel.size, tolerance) &&
      nclose(stack.aperture!, stackThickness, tolerance),
  );
  TestValidator.predicate(
    "the moving layer's edge rises one folded width above the crease",
    vclose(
      standing.affordance("fold-edge").frame.translation,
      {
        x: mapWidth / 2 + layerThickness / 2,
        y: layerThickness + mapWidth,
        z: 0,
      },
      tolerance,
    ),
  );
  TestValidator.predicate(
    "the unfolded map lies flat at double the folded width",
    nclose(archetypeExtent(flatShapes, "x").size, 2 * mapWidth, tolerance) &&
      nclose(flatHeight.low, 0, tolerance) &&
      nclose(flatHeight.high, layerThickness, tolerance) &&
      vclose(
        flat.affordance("support-grip").frame.translation,
        support.frame.translation,
        tolerance,
      ) &&
      nclose(
        flat.affordance("support-grip").aperture!,
        layerThickness,
        tolerance,
      ) &&
      nclose(
        archetypeExtent(flat.articulate({}), "y").size,
        stackThickness,
        tolerance,
      ),
  );
}
