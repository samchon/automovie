import { AutoMovieEngineScene } from "@automovie/engine";
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieRoomVisibility,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { drawingEnvironment } from "../../internal/drawingFixtures";

/** In the hall cell, 10 x 3 x 6 m from the origin. */
const IN_HALL: IAutoMovieVector3 = { x: 5, y: 1.5, z: 3 };

/** In the roof deck cell, 10 x 0.5 x 6 m from (0, 3, 0). */
const IN_DECK: IAutoMovieVector3 = { x: 5, y: 3.2, z: 3 };

/** Far from every space. */
const OUTSIDE: IAutoMovieVector3 = { x: 50, y: 50, z: 50 };

/**
 * The atelier without any opening or connector, so no sight line joins its
 * rooms.
 */
const sealed: () => IAutoMovieBuiltEnvironment =
  (): IAutoMovieBuiltEnvironment => ({
    ...drawingEnvironment(),
    openings: [],
    connectors: [],
  });

/**
 * `roomVisibility` hides the spaces that no declared sight line can
 * reach from the camera's cell, conservatively.
 *
 * Scenarios, on the atelier (a hall and a roof deck under a building, a stair
 * between them, openings in the hall's wall):
 *
 * 1. A camera in the hall is in an interior placement of "hall", and the stair
 *    joins the deck, so nothing is hidden and nothing is inconclusive.
 * 2. With no opening and no connector, the roof deck is unreachable from the hall
 *    and is hidden, the hall and its containing site kept.
 * 3. A camera in the roof deck of the sealed atelier hides the hall instead.
 * 4. A camera outside every leaf keeps all spaces visible and returns an
 *    exterior placement with an inconclusive result.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names connected and sealed interior placements and conservative exterior placement with its reason.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the room-visibility owner with authored atelier connectors or sealed rooms and fixed camera positions, then reads classifications and visibility sets.
 * @evidence contracts/development/testing.md#independent-expectations A staged stair connects hall and roof deck when present. Removing sight lines separates the leaves while preserving their site. The exterior point belongs to neither leaf and leaves all three recorded spaces visible.
 */
export function test_engine_render_room_visibility(): void {
  const connected: IAutoMovieRoomVisibility = AutoMovieEngineScene.autoMovieRoomVisibility({
    environment: drawingEnvironment(),
    camera: IN_HALL,
  });
  TestValidator.equals(
    "a connected camera",
    [
      connected.camera,
      connected.cameraPlacement,
      connected.hidden,
      connected.inconclusive,
    ],
    ["hall", "interior", [], null],
  );
  const apart: IAutoMovieRoomVisibility = AutoMovieEngineScene.autoMovieRoomVisibility({
    environment: sealed(),
    camera: IN_HALL,
  });
  TestValidator.equals(
    "a sealed hall",
    [apart.camera, apart.hidden, apart.visible],
    ["hall", ["roof-deck"], ["hall", "site"]],
  );
  const deck: IAutoMovieRoomVisibility = AutoMovieEngineScene.autoMovieRoomVisibility({
    environment: sealed(),
    camera: IN_DECK,
  });
  TestValidator.equals(
    "a sealed roof deck",
    [deck.camera, deck.hidden],
    ["roof-deck", ["hall"]],
  );
  const outside: IAutoMovieRoomVisibility = AutoMovieEngineScene.autoMovieRoomVisibility({
    environment: drawingEnvironment(),
    camera: OUTSIDE,
  });
  TestValidator.predicate(
    "an exterior camera",
    outside.camera === null &&
      outside.cameraPlacement === "exterior" &&
      outside.hidden.length === 0 &&
      outside.visible.length === 3 &&
      outside.inconclusive !== null,
  );
}
