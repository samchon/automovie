import { worldBlock } from "@automovie/engine";
import type { IAutoMovieWorldBlock } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError, vclose } from "../../internal/predicates";

/**
 * A grounded block supplies exact occupied bounds and a matching placed box.
 *
 * Scenarios:
 *
 * 1. Width, height and depth determine the model, center and all six bounds.
 * 2. Zero size, a NaN base, collapsed float geometry or invalid color refuses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the box geometry, placement, bounds and refused inputs.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the world block owner directly and observes the actual primitive, linked node, translated center, all bounds and separate refusals.
 * @evidence contracts/development/testing.md#independent-expectations A 3 by 4 by 5 box above (8,1,8) has center (8,3,8) and corners (6.5,1,5.5) and (9.5,5,10.5). IEEE double spacing at 2^54 eliminates the authored one-metre width.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers valid unequal dimensions, absent width, NaN translation, positive width whose two corners round together and malformed color.
 * @evidence contracts/development/testing.md#execution-ownership Uses the actual builder without a world layout, renderer or model registry.
 */
export function test_engine_space_world_block(): void {
  const input: IAutoMovieWorldBlock.IInput = {
    id: "house",
    kind: "building",
    base: { x: 8, y: 1, z: 8 },
    size: { x: 3, y: 4, z: 5 },
    color: "#665544",
  };
  const block: IAutoMovieWorldBlock = worldBlock(input);
  const part: IAutoMovieWorldBlock["model"]["parts"][number] | undefined =
    block.model.parts[0];
  const geometry:
    | IAutoMovieWorldBlock["model"]["parts"][number]["geometry"]
    | undefined = part?.geometry;
  TestValidator.predicate(
    "one skeletonless box has the authored dimensions",
    block.model.parts.length === 1 &&
      block.model.skeleton === null &&
      block.model.materials.length === 1 &&
      part?.material === block.model.materials[0]!.id &&
      geometry?.type === "primitive" &&
      geometry.shape.type === "box" &&
      nclose(geometry.shape.width, 3, 0) &&
      nclose(geometry.shape.height, 4, 0) &&
      nclose(geometry.shape.depth, 5, 0),
  );
  TestValidator.predicate(
    "the node links its model and the occupied bounds start at the base",
    block.id === "house" &&
      block.node.id === "house" &&
      block.node.model === block.model.id &&
      block.model.id.endsWith(":house") &&
      vclose(block.node.transform.translation, { x: 8, y: 3, z: 8 }, 0) &&
      vclose(block.bounds.min, { x: 6.5, y: 1, z: 5.5 }, 0) &&
      vclose(block.bounds.max, { x: 9.5, y: 5, z: 10.5 }, 0),
  );

  const invalid: readonly [Partial<IAutoMovieWorldBlock.IInput>, string][] = [
    [{ size: { x: 0, y: 4, z: 5 } }, "size.x must be positive"],
    [{ base: { x: NaN, y: 1, z: 8 } }, "base must be finite"],
    [
      { base: { x: 2 ** 54, y: 1, z: 8 }, size: { x: 1, y: 4, z: 5 } },
      "representable positive distance",
    ],
    [{ color: "white" }, "color must be #RRGGBB"],
  ];
  for (const [fields, message] of invalid)
    TestValidator.predicate(
      message,
      throwsError(() => worldBlock({ ...input, ...fields }), message),
    );
}
