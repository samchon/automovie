import {
  AutoMovieArchetypeKeyboard,
  AutoMovieArchetypeLaptop,
} from "@automovie/archetypes";
import type { IAutoMovieAffordance } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/** Roundoff of the lid's rigid rotation over sub-metre distances. */
const POSITION: number = 1e-9;

/**
 * Closing a stock laptop moves the screen and grasp with its rigid lid.
 *
 * At the closed travel the screen lies on the rear hinge's deck plane and
 * points down. The keyboard retains its open-model position.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the rigid lid, closing travel, displayed surface, grip and fixed keyboard cases.
 * @evidence contracts/development/testing.md#behavioral-verification Uses the public archetype's named points and public articulated pose for the laptop recipe.
 * @evidence contracts/development/testing.md#independent-expectations A rigid close preserves the screen-to-grip separation and brings the screen down to the fixed pivot's deck height.
 */
export function test_archetype_laptop_hinge(): void {
  const open = AutoMovieArchetypeLaptop.create({ model: "air13" });
  const saved = AutoMovieArchetypeKeyboard.create({
    kind: "laptop",
    model: "air13",
  });
  TestValidator.equals(
    "saved keyboard has its original fixed contacts",
    saved.affordances?.map(({ id, rides }) => [id, rides]),
    [
      ["keys", undefined],
      ["homeRow", undefined],
      ["screen", undefined],
      ["lid", undefined],
    ],
  );
  TestValidator.equals(
    "saved and named models share the same open screen frame",
    saved.affordance("screen").frame,
    open.affordance("screen").frame,
  );
  const pivot: IAutoMovieAffordance = open.affordance("hinge");
  const closed = open.articulate({ hinge: pivot.travel! });
  TestValidator.equals(
    "the lift side is the closed hinge pose",
    pivot.travel,
    110,
  );
  TestValidator.equals("lid geometry is the driven part", pivot.parts, ["lid"]);
  TestValidator.equals(
    "the keyboard keeps its declared frame",
    closed.affordance("homeRow").frame,
    open.affordance("homeRow").frame,
  );
  const face: IAutoMovieAffordance = closed.affordance("screen");
  TestValidator.predicate(
    "the screen meets the deck plane",
    vclose(
      face.frame.translation,
      { x: 0, y: open.dimensions.height, z: 0 },
      POSITION,
    ),
  );
  TestValidator.predicate(
    "the moving grasp reaches the front edge",
    Math.abs(
      closed.affordance("lid").frame.translation.z - open.dimensions.depth / 2,
    ) <= POSITION,
  );
  TestValidator.predicate(
    "the zero-travel model remains open",
    open.affordance("screen").frame.translation.y > open.dimensions.height,
  );
  TestValidator.error("excess closing travel is refused", () =>
    open.articulate({ hinge: 111 }),
  );
}
