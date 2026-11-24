import {
  AutoMovieArchetypeUnits,
  createBag,
  createBox,
  createDevice,
  createDrinkware,
  createSmoking,
  createStationery,
  createTool,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../../../internal/archetypeBandSweep";
import { archetypeExtent } from "../../../internal/archetypeExtent";

/** The ISO 3591 tasting glass as a maker's conformity sheet reproduces it. */
const ISO: string = "ISO 3591:1977 via the Culina conformity sheet";

/** Two makers' 330 ml longneck bottles. */
const LONGNECK: string = "O-I 2017 bottle guide and Berlin Packaging 330 ml";

/**
 * Handheld props stay inside their cited dimensions for every seed, measured where a hand or a mouth meets them.
 *
 * Scenarios, each over 200 seeds, inside the band and spanning at least 80 % of it:
 * 1. A wine glass: the rim's height, the bowl's diameter as the `body` grip's width and the stem's as the `stem` grip's, against the ISO 3591 drawing.
 * 2. A beer bottle: the rim's height, the body grip's width and the empty mass, against two makers' 330 ml longnecks; a full bottle weighs the empty one plus 0.33 kg.
 * 3. A mug: the rim's height against ITI's diner mug.
 * 4. A phone: its thickness as the grip's width, its width as the pinch's length, and its mass, against Apple's specification pages; a camera's depth as its grip's width and its mass against Ricoh's and Fujifilm's.
 * 5. A lighter's height and a cigarette's length from its mouth end to its lit end.
 * 6. A pen's barrel as its grip's width, inside the precision handle band; a hammer's handle inside the comfortable power grip band; a screwdriver's tip at the maker's overall length.
 * 7. A suitcase's pull bar, drawn out by its telescope's whole travel, at the handle heights a luggage study tested; its body inside the cabin limits.
 * 8. A cardboard box: the distance between its two hand grips is a moving carton's width, and a 6 kg load adds exactly 6 kg.
 */
export function test_unit_archetypes_props_bands(): void {
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({ name, minimum, maximum, source, measure });
  TestValidator.equals(
    "handheld props stay in their cited bands",
    archetypeBandSweep([
      row(
        "wine glass rim height",
        0.15,
        0.16,
        ISO,
        (seed: number): number =>
          createDrinkware({ kind: "wineGlass" }, seed).affordance("lip").frame
            .translation.y,
      ),
      row(
        "wine glass bowl",
        0.063,
        0.067,
        ISO,
        (seed: number): number =>
          createDrinkware({ kind: "wineGlass" }, seed).affordance("body")
            .aperture!,
      ),
      row(
        "wine glass stem",
        0.008,
        0.01,
        ISO,
        (seed: number): number =>
          createDrinkware({ kind: "wineGlass" }, seed).affordance("stem")
            .aperture!,
      ),
      row(
        "beer bottle height",
        0.209,
        0.2265,
        LONGNECK,
        (seed: number): number =>
          createDrinkware({ kind: "beerBottle" }, seed).affordance("lip").frame
            .translation.y,
      ),
      row(
        "beer bottle body",
        0.0604,
        0.0613,
        LONGNECK,
        (seed: number): number =>
          createDrinkware({ kind: "beerBottle" }, seed).affordance("body")
            .aperture!,
      ),
      row(
        "beer bottle empty mass",
        0.205,
        0.285,
        LONGNECK,
        (seed: number): number =>
          createDrinkware({ kind: "beerBottle" }, seed).body.mass,
      ),
      row(
        "beer bottle contents",
        0.33,
        0.33,
        "330 ml at 1 kg per litre",
        (seed: number): number =>
          createDrinkware({ kind: "beerBottle", fill: 1 }, seed).body.mass -
          createDrinkware({ kind: "beerBottle" }, seed).body.mass,
      ),
      row(
        "mug rim height",
        3.88 * AutoMovieArchetypeUnits.INCH,
        3.88 * AutoMovieArchetypeUnits.INCH,
        "ITI diner mug",
        (seed: number): number =>
          createDrinkware({ kind: "mug" }, seed).affordance("lip").frame
            .translation.y,
      ),
      row(
        "phone thickness",
        0.00564,
        0.00875,
        "Apple specifications",
        (seed: number): number =>
          createDevice({ kind: "phone" }, seed).affordance("grip").aperture!,
      ),
      row(
        "phone width",
        0.0642,
        0.078,
        "Apple specifications",
        (seed: number): number =>
          createDevice({ kind: "phone" }, seed).affordance("pinch").length!,
      ),
      row(
        "phone mass",
        0.135,
        0.249,
        "Apple specifications",
        (seed: number): number =>
          createDevice({ kind: "phone" }, seed).body.mass,
      ),
      row(
        "camera grip",
        0.0332,
        0.0553,
        "Ricoh GR III and Fujifilm X100VI",
        (seed: number): number =>
          createDevice({ kind: "camera" }, seed).affordance("grip").aperture!,
      ),
      row(
        "camera mass",
        0.257,
        0.471,
        "Ricoh GR III and Fujifilm X100VI",
        (seed: number): number =>
          createDevice({ kind: "camera" }, seed).body.mass,
      ),
      row(
        "lighter height",
        0.062,
        0.082,
        "BIC J25 and J26",
        (seed: number): number =>
          archetypeExtent(createSmoking({ kind: "lighter" }, seed), "y").size,
      ),
      row(
        "cigarette length",
        0.07,
        0.1,
        "regular to 100s",
        (seed: number): number => {
          const cigarette: ReturnType<typeof createSmoking> = createSmoking(
            { kind: "cigarette" },
            seed,
          );
          return (
            cigarette.affordance("flame").frame.translation.z -
            cigarette.affordance("mouth").frame.translation.z
          );
        },
      ),
      row(
        "pen barrel",
        0.006,
        0.013,
        "NIOSH 2004-164 precision handle",
        (seed: number): number =>
          createStationery({ kind: "pen" }, seed).affordance("grip").aperture!,
      ),
      row(
        "hammer handle",
        0.03,
        0.04,
        "Kong and Lowe 2005",
        (seed: number): number =>
          createTool({ kind: "hammer" }, seed).affordance("grip").aperture!,
      ),
      row(
        "screwdriver length",
        8.25 * AutoMovieArchetypeUnits.INCH,
        8.25 * AutoMovieArchetypeUnits.INCH,
        "Klein Tools 603-4",
        (seed: number): number =>
          createTool({ kind: "screwdriver" }, seed).affordance("face").frame
            .translation.y,
      ),
      row(
        "suitcase pull height",
        1,
        1.1,
        "Industrial Health 45:756",
        (seed: number): number => {
          const suitcase: ReturnType<typeof createBag> = createBag(
            { kind: "suitcase" },
            seed,
          );
          return suitcase
            .articulate({ telescope: suitcase.affordance("telescope").travel! })
            .affordance("pull").frame.translation.y;
        },
      ),
      row(
        "suitcase height",
        0.55,
        0.56,
        "Lufthansa and IATA cabin limits",
        (seed: number): number =>
          archetypeExtent(createBag({ kind: "suitcase" }, seed), "y", ["body"])
            .size,
      ),
      row(
        "box width between the hands",
        (16 + 3 / 8) * AutoMovieArchetypeUnits.INCH,
        18 * AutoMovieArchetypeUnits.INCH,
        "U-Haul cartons",
        (seed: number): number => {
          const box: ReturnType<typeof createBox> = createBox({}, seed);
          return (
            box.affordance("left").frame.translation.x -
            box.affordance("right").frame.translation.x
          );
        },
      ),
      row(
        "box load",
        6,
        6,
        "the stated load",
        (seed: number): number =>
          createBox({ load: 6 }, seed).body.mass -
          createBox({}, seed).body.mass,
      ),
    ]),
    [],
  );
}
