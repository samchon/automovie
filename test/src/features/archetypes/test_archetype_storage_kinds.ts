import { ArchetypeUnits, createStorage } from "@automovie/archetypes";
import type { IAutoMovieAffordance } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/** HON 510's four drawers of 23 1/2 filing inches, 52 in high. */
const HON: Readonly<{
  drawers: number;
  travel: number;
  height: readonly [number, number];
}> = { drawers: 4, travel: (23 + 1 / 2) * ArchetypeUnits.INCH, height: [52 * ArchetypeUnits.INCH, 52 * ArchetypeUnits.INCH] };

/** Lyon's single-tier lockers: 12 to 18 in wide, 12 to 21 in deep, 72 in high on 6 in legs. */
const LYON: Readonly<{
  width: readonly [number, number];
  depth: readonly [number, number];
  height: number;
  legs: number;
}> = {
  width: [12 * ArchetypeUnits.INCH, 18 * ArchetypeUnits.INCH],
  depth: [12 * ArchetypeUnits.INCH, 21 * ArchetypeUnits.INCH],
  height: 72 * ArchetypeUnits.INCH,
  legs: 6 * ArchetypeUnits.INCH,
};

/** IKEA BILLY: 80 x 28 x 202 cm, one fixed and four adjustable shelves. */
const BILLY: Readonly<Record<string, number>> = {
  width: 0.8,
  depth: 0.28,
  height: 2.02,
  shelves: 5,
};

/**
 * A filing cabinet, a locker and a bookcase stand at their makers' sizes, and their drawers, door and shelves are where and as the makers' give them.
 *
 * Scenarios:
 * 1. A filing cabinet has the HON 510's four drawers, equal up its height, each sliding its front and box out by the drawn filing length; it declares no pull, which no source places.
 * 2. A locker stands Lyon's height on its legs, as wide and deep as Lyon's range, its hat shelf at Penco's 48 in above its bottom; its door hinge states no travel, so any opening is refused, and it declares no handle.
 * 3. A bookcase is the BILLY's size and its five shelves divide its height into six equal steps, each shelf's extent inside the sides.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Measures the produced colliders and contacts and articulates the drawers; a drawer that does not carry its front, a door that opens without a source, or a shelf off its step is caught with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations The expected figures are the makers' (HON, Lyon, IKEA) restated here, and the shelf steps follow from the BILLY's height and shelf count; nothing is read from the producer's bands.
 * @evidence contracts/development/testing.md#distinguishing-cases Drawers without pulls, a door without travel and fixed shelves; the wardrobe's and chest's pulls, swing and travel belong to `test_archetype_furniture_bands`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the three scenarios and what each pins.
 */
export function test_archetype_storage_kinds(): void {
  const findings: string[] = [];
  const near = (what: string, got: number, wanted: number): void => {
    if (!(Math.abs(got - wanted) <= MM))
      findings.push(`${what}: ${got}, ${wanted} expected`);
  };

  // 1. The filing cabinet.
  const cabinet: ReturnType<typeof createStorage> = createStorage(
    { kind: "filingCabinet" },
    4,
  );
  const height: number = archetypeExtent(cabinet, "y").size;
  if (!(height >= HON.height[0] - MM && height <= HON.height[1] + MM))
    findings.push(`the filing cabinet stands ${height} high`);
  const ids: string[] = cabinet.affordances.map(
    (affordance: { id: string }): string => affordance.id,
  );
  for (let k: number = 1; k <= HON.drawers; k++) {
    const drawer: IAutoMovieAffordance = cabinet.affordance(`drawer${k}`);
    near(
      `drawer ${k}'s height`,
      drawer.frame.translation.y,
      (height * (k - 0.5)) / HON.drawers,
    );
    near(`drawer ${k}'s travel`, drawer.travel!, HON.travel);
    const drawn: ReturnType<typeof createStorage> = cabinet.articulate({
      [`drawer${k}`]: HON.travel,
    });
    for (const part of [`front-${k}`, `box-${k}`])
      near(
        `drawer ${k}'s ${part} drawn`,
        archetypeExtent(drawn, "z", [part]).high -
          archetypeExtent(cabinet, "z", [part]).high,
        HON.travel,
      );
  }
  if (ids.includes(`drawer${HON.drawers + 1}`))
    findings.push("the filing cabinet has a fifth drawer");
  if (ids.some((id: string): boolean => id.startsWith("pull")))
    findings.push("the filing cabinet declares a pull no source places");

  // 2. The locker.
  findings.push(
    ...archetypeBandSweep([
      {
        name: "locker width",
        measure: (seed: number): number =>
          archetypeExtent(createStorage({ kind: "locker" }, seed), "x").size,
        minimum: LYON.width[0],
        maximum: LYON.width[1],
        source: "Lyon standard steel lockers",
      },
      {
        name: "locker depth",
        measure: (seed: number): number =>
          archetypeExtent(createStorage({ kind: "locker" }, seed), "z").size,
        minimum: LYON.depth[0],
        maximum: LYON.depth[1],
        source: "Lyon standard steel lockers",
      },
    ]),
  );
  const locker: ReturnType<typeof createStorage> = createStorage(
    { kind: "locker" },
    4,
  );
  near(
    "the locker's height on its legs",
    archetypeExtent(locker, "y").high,
    LYON.legs + LYON.height,
  );
  near(
    "the locker's door bottom",
    archetypeExtent(locker, "y", ["door"]).low,
    LYON.legs,
  );
  near(
    "the locker's hat shelf",
    locker.affordance("shelf1").frame.translation.y,
    LYON.legs + 48 * ArchetypeUnits.INCH,
  );
  if (locker.affordance("door").travel !== undefined)
    findings.push("the locker door states a travel no source gives");
  try {
    locker.articulate({ door: 30 });
    findings.push("the locker's door opened without a source for its angle");
  } catch {
    // Refused, as a door that states no travel is.
  }
  if (
    locker.affordances.some(
      (affordance: { id: string }): boolean => affordance.id === "handle",
    )
  )
    findings.push("the locker declares a handle no source places");

  // 3. The bookcase.
  const bookcase: ReturnType<typeof createStorage> = createStorage(
    { kind: "bookcase" },
    4,
  );
  near(
    "the bookcase's width",
    archetypeExtent(bookcase, "x").size,
    BILLY.width,
  );
  near(
    "the bookcase's depth",
    archetypeExtent(bookcase, "z").size,
    BILLY.depth,
  );
  near(
    "the bookcase's height",
    archetypeExtent(bookcase, "y").size,
    BILLY.height,
  );
  const sides: { low: number; high: number } = archetypeExtent(bookcase, "x", [
    "side-left",
    "side-right",
  ]);
  for (let k: number = 1; k <= BILLY.shelves; k++) {
    const shelf: IAutoMovieAffordance = bookcase.affordance(`shelf${k}`);
    near(
      `shelf ${k}'s height`,
      shelf.frame.translation.y,
      (BILLY.height * k) / (BILLY.shelves + 1),
    );
    for (const corner of shelf.extent!)
      if (
        !(
          shelf.frame.translation.x + corner.x > sides.low &&
          shelf.frame.translation.x + corner.x < sides.high
        )
      )
        findings.push(`shelf ${k} reaches past the bookcase's sides`);
  }
  TestValidator.equals(
    "filing cabinets, lockers and bookcases stand as their makers give them",
    findings,
    [],
  );
}
