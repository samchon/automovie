import {
  ArchetypeFrame,
  createBed,
  createSeat,
  createStorage,
  createTable,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/** The office chair standard's fixed dimensions. */
const EN1335: string = "EN 1335-1:2020 Table 2";

/** The bench clauses of the accessibility standard. */
const ADA903: string = "2010 ADA Standards 903";

/**
 * Furniture stays inside its cited dimensions for every seed, measured where a body meets it.
 *
 * Scenarios, each over 200 seeds, inside the band and spanning at least 80 % of it:
 * 1. An office chair: the seat frame's height in ANSI/HFES 100's 0.38 to 0.56 m, the seat's depth in EN 1335-1's 425 to 485 mm, the armrest pads 200 to 250 mm above the seat.
 * 2. A dining chair: seat height 430 to 457 mm and depth 380 to 480 mm; an armchair's seat 380 to 457 mm high.
 * 3. A bench: seat 430 to 485 mm high and 510 to 610 mm deep with the top of its back panel 455 mm above the seat; a three-place bench's seat slab is three 610 mm places wide.
 * 4. A bed: the lying surface 0.39 to 0.63 m high and a single's mattress 0.90 m by 1.90 m; its side seats at the same height.
 * 5. Tables: a desk's top at 740 plus or minus 20 mm, a dining table's between 710 and 762 mm, a counter's at 914 mm and 508 to 635 mm deep.
 * 6. A wardrobe's door pulls inside the 865 to 1220 mm hardware band and its doors opening 95 to 110 degrees; a chest's drawers running 0.30 to 0.40 m.
 * 7. Every seat and every table top is level: its frame's `+Y` within a degree of upright.
 * 8. Stools: a bar stool's seat top 762 to 813 mm high; a stool's seat is round, its collider as deep as it is wide and its declared depth that diameter.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each piece for 200 seeds and measures the seat, surface and pull frames, the declared seat extents and, for a dimension its source fixes at one value, the collider itself; a seat off its height, a band wider than its standard, a declared size the solid does not have or a seed that does not vary the dimension is caught.
 * @evidence contracts/development/testing.md#independent-expectations Every band is written here from its source: ANSI/HFES 100-2007 (seat height), EN 1335-1:2020 Table 2 (seat depth, armrest height), Blackler et al. 2018 after Christenson 1990 and AS/NZS 4688.1 (chair seat height and depth), 2010 ADA Standards 903 (bench) and 404.2.7 (hardware height), the hospital bed height study DOI 10.1177/10711813251369356 (0.39 to 0.63 m), the National Bed Federation (single bed), EN 527-1:2011 (desk), ADA 902.3 and NKBA Guideline 9 (dining and counter heights, and the 1067 mm bar counter a bar stool sits 254 to 305 mm below by trade convention), Blum hinges (95 to 110 degrees), Accuride 3832E slides (travel). The one degree of level is #3370's acceptance.
 * @evidence contracts/development/testing.md#distinguishing-cases The dimensions a sitting, rising, lying or reaching act reads, one piece per standard; a plain stool's and a coffee table's heights, which have no source, are not asserted.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the eight scenarios and what each pins.
 */
export function test_archetype_furniture_bands(): void {
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
    limit?: boolean,
  ): archetypeBandSweep.IRow => ({
    name,
    minimum,
    maximum,
    source,
    measure,
    ...(limit === true ? { limit, tolerance: 1e-6 } : {}),
  });
  const seat = (
    kind: createSeat.Kind,
    seed: number,
  ): ReturnType<typeof createSeat> => createSeat({ kind }, seed);

  /** The angle of a frame's +Y from upright, degrees. */
  const tilt = (frame: Parameters<typeof ArchetypeFrame.axis>[0]): number =>
    (Math.acos(Math.min(1, ArchetypeFrame.axis(frame, "y").y)) * 180) / Math.PI;
  TestValidator.equals(
    "furniture stays in its cited bands",
    archetypeBandSweep([
      row(
        "office seat height",
        0.38,
        0.56,
        "ANSI/HFES 100-2007",
        (seed: number): number =>
          seat("office", seed).affordance("seat").frame.translation.y,
      ),
      row(
        "office seat depth",
        0.425,
        0.485,
        EN1335,
        (seed: number): number =>
          seat("office", seed).affordance("seat").depth!,
      ),
      row(
        "office armrest height",
        0.2,
        0.25,
        EN1335,
        (seed: number): number => {
          const chair: ReturnType<typeof createSeat> = seat("office", seed);
          return (
            chair.affordance("leftArm").frame.translation.y -
            chair.affordance("seat").frame.translation.y
          );
        },
      ),
      row(
        "dining seat height",
        0.43,
        0.457,
        "Blackler et al. 2018",
        (seed: number): number =>
          seat("dining", seed).affordance("seat").frame.translation.y,
      ),
      row(
        "dining seat depth",
        0.38,
        0.48,
        "AS/NZS 4688.1 via Blackler et al. 2018",
        (seed: number): number =>
          seat("dining", seed).affordance("seat").depth!,
      ),
      row(
        "armchair seat height",
        0.38,
        0.457,
        "Christenson 1990 via Blackler et al. 2018",
        (seed: number): number =>
          seat("armchair", seed).affordance("seat").frame.translation.y,
      ),
      row(
        "bench seat height",
        0.43,
        0.485,
        ADA903,
        (seed: number): number =>
          seat("bench", seed).affordance("seat").frame.translation.y,
      ),
      row(
        "bench seat depth",
        0.51,
        0.61,
        ADA903,
        (seed: number): number => seat("bench", seed).affordance("seat").depth!,
      ),
      row("bench back height", 0.455, 0.455, ADA903, (seed: number): number => {
        const bench: ReturnType<typeof createSeat> = seat("bench", seed);
        return (
          archetypeExtent(bench, "y", ["back"]).high -
          bench.affordance("seat").frame.translation.y
        );
      }),
      row(
        "three-place bench width",
        1.83,
        1.83,
        "NKBA Guideline 9, 610 mm a place",
        (seed: number): number =>
          archetypeExtent(createSeat({ kind: "bench", places: 3 }, seed), "x", [
            "seat",
          ]).size,
      ),
      row(
        "bar stool seat height",
        0.762,
        0.813,
        "NKBA Guideline 9's 42 in bar counter less 10 to 12 in",
        (seed: number): number =>
          archetypeExtent(seat("barStool", seed), "y", ["seat"]).high,
      ),
      row(
        "stool seat depth less its diameter",
        0,
        0,
        "a round seat",
        (seed: number): number => {
          const stool: ReturnType<typeof createSeat> = seat("stool", seed);
          return Math.max(
            Math.abs(
              archetypeExtent(stool, "z", ["seat"]).size -
                archetypeExtent(stool, "x", ["seat"]).size,
            ),
            Math.abs(
              stool.affordance("seat").depth! -
                archetypeExtent(stool, "x", ["seat"]).size,
            ),
          );
        },
      ),
      row(
        "bed surface height",
        0.39,
        0.63,
        "DOI 10.1177/10711813251369356",
        (seed: number): number =>
          createBed({ kind: "single" }, seed).affordance("surface").frame
            .translation.y,
      ),
      row(
        "bed side seat height",
        0.39,
        0.63,
        "DOI 10.1177/10711813251369356",
        (seed: number): number =>
          createBed({ kind: "double" }, seed).affordance("leftSide").frame
            .translation.y,
      ),
      row(
        "single bed width",
        0.9,
        0.9,
        "National Bed Federation",
        (seed: number): number =>
          archetypeExtent(createBed({ kind: "single" }, seed), "x", [
            "mattress",
          ]).size,
      ),
      row(
        "single bed length",
        1.9,
        1.9,
        "National Bed Federation",
        (seed: number): number =>
          archetypeExtent(createBed({ kind: "single" }, seed), "z", [
            "mattress",
          ]).size,
      ),
      row(
        "desk height",
        0.72,
        0.76,
        "EN 527-1:2011",
        (seed: number): number =>
          createTable({ kind: "desk" }, seed).affordance("top").frame
            .translation.y,
      ),
      row(
        "dining table height",
        0.71,
        0.762,
        "ADA 902.3 and NKBA Guideline 9",
        (seed: number): number =>
          createTable({ kind: "dining" }, seed).affordance("top").frame
            .translation.y,
      ),
      row(
        "counter height",
        0.914,
        0.914,
        "NKBA Guideline 9",
        (seed: number): number =>
          createTable({ kind: "counter" }, seed).affordance("front").frame
            .translation.y,
      ),
      row(
        "counter depth",
        0.508,
        0.635,
        "NKBA",
        (seed: number): number =>
          createTable({ kind: "counter" }, seed).affordance("top").depth!,
      ),
      row(
        "wardrobe pull height",
        0.865,
        1.22,
        "ADA 404.2.7",
        (seed: number): number =>
          createStorage({ kind: "wardrobe" }, seed).affordance("leftPull").frame
            .translation.y,
      ),
      row(
        "wardrobe door swing",
        95,
        110,
        "Blum CLIP top",
        (seed: number): number =>
          createStorage({ kind: "wardrobe" }, seed).affordance("rightDoor")
            .travel!,
      ),
      row(
        "drawer travel",
        0.3,
        0.4,
        "Accuride 3832E",
        (seed: number): number =>
          createStorage({ kind: "chest" }, seed).affordance("drawer2").travel!,
      ),
      row(
        "office seat level",
        0,
        1,
        "#3370",
        (seed: number): number =>
          tilt(seat("office", seed).affordance("seat").frame),
        true,
      ),
      row(
        "sofa seat level",
        0,
        1,
        "#3370",
        (seed: number): number =>
          tilt(seat("sofa", seed).affordance("seat").frame),
        true,
      ),
      row(
        "desk top level",
        0,
        1,
        "#3370",
        (seed: number): number =>
          tilt(createTable({ kind: "desk" }, seed).affordance("top").frame),
        true,
      ),
    ]),
    [],
  );
}
