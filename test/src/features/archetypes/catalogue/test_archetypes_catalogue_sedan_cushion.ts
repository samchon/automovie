import { AutoMovieArchetypeCar } from "@automovie/archetypes";
import type {
  IAutoMovieAffordance,
  IAutoMoviePhysicalShape,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { strict as assert } from "node:assert";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/**
 * A sedan's driver seat reads the collider of its actual cushion.
 *
 * Scenarios:
 *
 * 1. Fit the low and high Class A seating-reference heights to the two sedan
 *    models.
 * 2. The seat starts at the cushion's front edge and uses the same width and
 *    depth.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the two sedan models, seat height endpoints and contact at the cushion's leading edge.
 * @evidence contracts/development/testing.md#behavioral-verification Builds each sedan, reads its actual driver cushion collider and compares its box dimensions and forward upper edge with the public seat frame.
 * @evidence contracts/development/testing.md#independent-expectations The authored floor and seating-reference height give the vertical contact after the 0.0975 metre offset. The measured box half-extents give the leading edge, full width and depth.
 */
export function test_archetypes_catalogue_sedan_cushion(): void {
  for (const [model, height] of [
    ["corolla", 0.127],
    ["camry", 0.405],
  ] as const) {
    const car: ReturnType<typeof AutoMovieArchetypeCar.create> =
      AutoMovieArchetypeCar.create({
        kind: "sedan",
        model,
        seatHeight: height,
      });
    const cushion: IAutoMoviePhysicalShape | undefined = car
      .shapes()
      .find((shape): boolean => shape.id === "cushion-driver");
    assert.ok(cushion?.kind === "box", `${model} has a driver cushion`);

    const seat: IAutoMovieAffordance = car.affordance("driverSeat");
    const { x, y, z } = cushion.transform.position;
    const half: IAutoMovieVector3 = cushion.halfExtents;
    TestValidator.predicate(
      `the ${model} driver socket stands on the front edge of its cushion`,
      vclose(
        seat.frame.translation,
        { x, y: y + half.y, z: z + half.z },
        1e-9,
      ) &&
        nclose(seat.frame.translation.y, 0.3 + height - 0.0975, 1e-9) &&
        seat.width !== undefined &&
        nclose(seat.width, 2 * half.x, 1e-9) &&
        seat.depth !== undefined &&
        nclose(seat.depth, 2 * half.z, 1e-9),
    );
  }
}
