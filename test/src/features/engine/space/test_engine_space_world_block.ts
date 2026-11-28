import { AutoMovieEngineWorld } from "@automovie/engine";
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
 * 3. The box bounds agree with the translated shape even when its represented
 *    center and top round. A center that lands on an exterior face or moves the
 *    bottom beyond contact precision refuses.
 * 4. A decimal base remains admissible when rounding moves it only one ulp.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the placed model and bounds for ordinary, coarse-coordinate, and decimal bases, plus invalid geometry and color.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieEngineWorld.block` with authored records and reads its box size, model and material links, node center, and world bounds. Each invalid size, offset, or color is checked separately against its diagnostic.
 * @evidence contracts/development/testing.md#independent-expectations A 3 by 4 by 5 m box with base (8, 1, 8) has center (8, 3, 8) and corners (6.5, 1, 5.5) and (9.5, 5, 10.5). Binary64 rounding at 2^53 puts the center of the 6 m box at base plus 4 and its top at base plus 8. At 2^54 the 1 m width cannot separate its edges. The 0.3 m base shifts by one unit in its last place when reconstructed from the represented center 0.4.
 */
export function test_engine_space_world_block(): void {
  const input: IAutoMovieWorldBlock.IInput = {
    id: "house",
    kind: "building",
    base: { x: 8, y: 1, z: 8 },
    size: { x: 3, y: 4, z: 5 },
    color: "#665544",
  };
  const block: IAutoMovieWorldBlock = AutoMovieEngineWorld.block(input);
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
  const highBase: number = 2 ** 53;
  const high: IAutoMovieWorldBlock = AutoMovieEngineWorld.block({
    ...input,
    base: { ...input.base, y: highBase },
    size: { ...input.size, y: 6 },
  });
  // A 3 m half-height puts the represented center at base + 4. Moving
  // 3 m either way from there rounds to base and base + 8 respectively.
  TestValidator.predicate(
    "the upper envelope follows the actual high box translation",
    nclose(high.node.transform.translation.y, highBase + 4, 0) &&
      nclose(high.bounds.min.y, highBase, 0) &&
      nclose(high.bounds.max.y, highBase + 8, 0),
  );
  const decimal: IAutoMovieWorldBlock = AutoMovieEngineWorld.block({
    ...input,
    base: { ...input.base, y: 0.3 },
    size: { ...input.size, y: 0.2 },
  });
  TestValidator.predicate(
    "decimal rounding keeps the box grounded within contact precision",
    nclose(decimal.node.transform.translation.y, 0.4, 0) &&
      nclose(decimal.bounds.min.y, 0.3 + 2 ** -54, 0) &&
      nclose(decimal.bounds.max.y, 0.5, 0),
  );

  const invalid: readonly [Partial<IAutoMovieWorldBlock.IInput>, string][] = [
    [{ size: { x: 0, y: 4, z: 5 } }, "size.x must be positive"],
    [{ base: { x: NaN, y: 1, z: 8 } }, "base must be finite"],
    [
      { base: { x: 2 ** 54, y: 1, z: 8 }, size: { x: 1, y: 4, z: 5 } },
      "representable positive distance",
    ],
    [
      { base: { ...input.base, y: highBase }, size: { ...input.size, y: 2 } },
      "representable center",
    ],
    [
      {
        base: { ...input.base, y: highBase + 2 },
        size: { ...input.size, y: 6 },
      },
      "bottom within",
    ],
    [{ color: "white" }, "color must be #RRGGBB"],
  ];
  for (const [fields, message] of invalid)
    TestValidator.predicate(
      message,
      throwsError(
        () => AutoMovieEngineWorld.block({ ...input, ...fields }),
        message,
      ),
    );
}
