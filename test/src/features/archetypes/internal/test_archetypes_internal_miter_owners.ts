import type {
  IAutoMovieProfilePoint,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { AutoMovieArchetypePassageSearch } from "../../../../../packages/archetypes/src/core/internal/AutoMovieArchetypePassageSearch";
import { buildingWalkable } from "../../../../../packages/archetypes/src/environments/buildings/buildingWalkable";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Metre tolerance for the several-unit planar coordinates and their offsets. */
const EPSILON: number = 1e-12;

/**
 * Keeps each owner's signed corner offsets and exceptional cases.
 *
 * Scenarios:
 *
 * 1. A concave room's orthogonal wall lines inset by 0.25 m. An existing slab
 *    opening stays fixed and a narrower room refuses a collapsed wall inset.
 * 2. A nearly straight convex hull corner grows outward by 0.25 m, measured
 *    perpendicular to either incident edge.
 * 3. Degenerate point and line hulls retain their square and rectangular
 *    envelopes, and zero distance retains the original coordinates.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes concave room insets, fixed openings, inadmissible collapse, outward hull growth and degenerate passage inputs.
 * @evidence contracts/development/testing.md#behavioral-verification Calls each actual offset consumer directly with in-memory points. Observes returned rings and passage hulls and the room's collapse refusal.
 * @evidence contracts/development/testing.md#independent-expectations Orthogonal offset lines set literal coordinates. Symmetric sloped edges meet at the middle x, with the vertical shift equal to distance divided by the edge normal's vertical component.
 */
export function test_archetypes_internal_miter_owners(): void {
  const room: IAutoMovieProfilePoint[] = [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 2 },
    { x: 2, y: 2 },
    { x: 2, y: 4 },
    { x: 0, y: 4 },
  ];
  const opening: IAutoMovieProfilePoint[] = [
    { x: 0.8, y: 0.8 },
    { x: 0.8, y: 1.2 },
    { x: 1.2, y: 1.2 },
    { x: 1.2, y: 0.8 },
  ];
  const anchor: IAutoMovieProfilePoint = { x: 0.5, y: 0.5 };
  const floor: ReturnType<typeof buildingWalkable> = buildingWalkable(
    [room],
    [room, opening],
    anchor,
    0.25,
    "test",
  );
  const inset: IAutoMovieProfilePoint[] = [
    { x: 0.25, y: 0.25 },
    { x: 3.75, y: 0.25 },
    { x: 3.75, y: 1.75 },
    { x: 1.75, y: 1.75 },
    { x: 1.75, y: 3.75 },
    { x: 0.25, y: 3.75 },
  ];
  TestValidator.predicate(
    "inside edge lines meet at the concave corner",
    sameRing(floor.rings[0], inset),
  );
  TestValidator.predicate(
    "slab opening and valid anchor are held intact",
    sameRing(floor.rings[1], opening) &&
      nclose(floor.anchor.x, anchor.x, EPSILON) &&
      nclose(floor.anchor.y, anchor.y, EPSILON),
  );
  const narrow: IAutoMovieProfilePoint[] = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 3 },
    { x: 0, y: 3 },
  ];
  assert.throws(
    (): unknown => buildingWalkable([narrow], [narrow], anchor, 0.6, "test"),
    /has a collapsed wall setback/,
  );

  const sag: number = 2 ** -20;
  const hull: IAutoMovieVector3[] = [
    { x: 0, y: 0, z: 0 },
    { x: 2, y: 0, z: -sag },
    { x: 4, y: 0, z: 0 },
    { x: 4, y: 0, z: 3 },
    { x: 0, y: 0, z: 3 },
  ];
  const grown: IAutoMovieVector3[] = AutoMovieArchetypePassageSearch.mitre(
    hull,
    0.25,
  );
  TestValidator.predicate(
    "outward intersection stays centred across the shallow fold",
    vclose(
      grown[1]!,
      { x: 2, y: 0, z: -sag - 0.25 * Math.hypot(1, sag / 2) },
      EPSILON,
    ),
  );
  const point: IAutoMovieVector3 = { x: 2, y: 0, z: 3 };
  const other: IAutoMovieVector3 = { x: 3, y: 0, z: 3 };
  const square: IAutoMovieVector3[] = AutoMovieArchetypePassageSearch.mitre(
    [point],
    0.25,
  );
  const rectangle: IAutoMovieVector3[] = AutoMovieArchetypePassageSearch.mitre(
    [point, other],
    0.25,
  );
  TestValidator.predicate(
    "degenerate expansion retains the square and line ends",
    square.length === 4 &&
      rectangle.length === 4 &&
      vclose(square[0]!, { x: 1.75, y: 0, z: 2.75 }, EPSILON) &&
      vclose(square[2]!, { x: 2.25, y: 0, z: 3.25 }, EPSILON) &&
      vclose(rectangle[0]!, { x: 1.75, y: 0, z: 2.75 }, EPSILON) &&
      vclose(rectangle[2]!, { x: 3.25, y: 0, z: 3.25 }, EPSILON),
  );
  const unchanged: IAutoMovieVector3[] = AutoMovieArchetypePassageSearch.mitre(
    hull,
    0,
  );
  TestValidator.predicate(
    "zero distance retains all original hull corners",
    unchanged.length === hull.length &&
      unchanged.every((vertex, i) => vclose(vertex, hull[i]!, EPSILON)),
  );
}

function sameRing(
  actual: readonly IAutoMovieProfilePoint[] | undefined,
  expected: readonly IAutoMovieProfilePoint[],
): boolean {
  return (
    actual !== undefined &&
    actual.length === expected.length &&
    actual.every(
      (point, i) =>
        nclose(point.x, expected[i]!.x, EPSILON) &&
        nclose(point.y, expected[i]!.y, EPSILON),
    )
  );
}
