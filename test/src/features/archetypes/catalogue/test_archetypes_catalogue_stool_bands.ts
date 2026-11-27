import { AutoMovieArchetypeSeat } from "@automovie/archetypes";
import type {
  IAutoMoviePhysicalShape,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { strict as assert } from "node:assert";

import { nclose } from "../../internal/nclose";

/**
 * The seat producer realizes both ends of the ordinary and bar stool bands.
 *
 * Scenarios:
 * 1. Set the Blackler stool's and NKBA counter's lower and upper seat heights.
 * 2. Read each emitted disc's full width and placement from its vertices.
 */
export function test_archetypes_catalogue_stool_bands(): void {
  for (const [kind, height, diameter] of [
    ["stool", 0.43, 0.3],
    ["stool", 0.457, 0.35],
    ["barStool", 1.067 - 12 * 0.0254, 0.3],
    ["barStool", 1.067 - 10 * 0.0254, 0.35],
  ] as const) {
    const seat: IAutoMoviePhysicalShape | undefined = AutoMovieArchetypeSeat.create({
      kind,
      seatHeight: height,
      seatWidth: diameter,
    })
      .shapes()
      .find((shape): boolean => shape.id === "seat");
    assert.ok(seat?.kind === "hull", `${kind} has a seat disc`);
    const widths: number[] = seat.points.map((point): number => point.x);
    const top: number =
      seat.transform.position.y +
      Math.max(...seat.points.map((point: IAutoMovieVector3): number => point.y));
    const { x, y, z, w } = seat.transform.rotation;
    TestValidator.predicate(
      `${kind} emits an upright disc ${diameter} m wide at ${height} m`,
      nclose(x, 0, 1e-9) &&
        nclose(y, 0, 1e-9) &&
        nclose(z, 0, 1e-9) &&
        nclose(Math.abs(w), 1, 1e-9) &&
        nclose(top, height, 1e-9) &&
        nclose(Math.max(...widths) - Math.min(...widths), diameter, 1e-9),
    );
  }
}
