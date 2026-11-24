import {
  type AutoMovieArchetype,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeUnits,
  createBag,
  createCareItem,
  createDevice,
  createDrinkware,
  createFood,
  createKeyboard,
  createLongTool,
  createMobilityAid,
  createSmoking,
  createStationery,
  createTableware,
  createTool,
  createTray,
  createUmbrella,
  createVessel,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeModelSweep } from "../../../internal/archetypeModelSweep";

/** A dimension the archetype reports, metres or kilograms. */
const dim: (made: AutoMovieArchetype, name: string) => number = (
  made: AutoMovieArchetype,
  name: string,
): number =>
  (made.dimensions as Readonly<Record<string, number | undefined>>)[name] ??
  Number.NaN;

/** An inch, metres. */
const IN: number = AutoMovieArchetypeUnits.INCH;

/** A pound, kilograms. */
const LB: number = AutoMovieArchetypeUnits.POUND;

/**
 * Every handheld prop whose source lists discrete models is one of them whole: over 200 seeds each draw's figures equal one read model's exactly, never a blend of two, and every model is drawn.
 *
 * Scenarios, each over 200 seeds:
 * 1. A lighter is BIC's J26 or J25; a clipboard Esselte's 56055 or 604037; an umbrella BLUNT's Classic or Exec; an ashtray one of the two glass ashtrays read.
 * 2. A keyboard is Apple's Magic Keyboard with Numeric Keypad or its Touch ID version; a laptop the 13 or 15 inch MacBook Air M4; an apple one of USDA's four portions.
 * 3. A camera is the Ricoh GR III or the Fujifilm X100VI; a tablet the iPad's Wi-Fi or cellular model; a walkie-talkie the CP200d with one of its four batteries.
 * 4. A beer bottle is one of the four longnecks read; a table knife Eichenlaub's or Robert Welch's; a fishing rod one of Daiwa's seven Ninja X rods.
 * 5. A tray is SMÖRLING, GRILLTIDER or SMULA; a basket one of the two RISATORPs; a round plate IKEA 365+'s side plate or plate, Rosenthal's Joyn or Thomas's Sunny Day; a platter IKEA 365+'s, Thomas's Loft or Rosenthal's Midas; a bowl IKEA 365+'s or one of Thomas's two Sunny Day bowls.
 * 6. A suitcase is Lufthansa's or IATA's cabin limit, and its pull handle one of the study's two heights, on their own axes; a razor is Edwin Jagger's or Gillette's Mach3.
 * 7. A tube is one of Alltub's ten diameters, its length inside that diameter's own range; a walker Drive's adult or junior, its handle height inside that model's own range.
 * 8. A dimension a model gives is the model's: fixing a camera's mass or a fishing rod's length is refused on that dimension, while a rod's grip diameter, which no model gives, is still fixed inside its band.
 */
export function test_unit_archetypes_props_props_models(): void {
  const rows: readonly archetypeModelSweep.IRow[] = [
    {
      name: "lighter",
      source: "BIC J26 and J25",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createSmoking({ kind: "lighter" }, seed);
        return [
          dim(a, "length"),
          dim(a, "diameter"),
          dim(a, "width"),
          a.body.mass,
        ];
      },
      models: [
        [0.082, 0.015, 0.025, 0.024667],
        [0.062, 0.011, 0.022, 0.013],
      ],
    },
    {
      name: "clipboard",
      source: "Esselte 56055 and 604037",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createStationery(
          { kind: "clipboard" },
          seed,
        );
        return [dim(a, "width"), dim(a, "length"), a.body.mass];
      },
      models: [
        [0.232, 0.349, 0.168],
        [0.232, 0.349, 0.19],
      ],
    },
    {
      name: "umbrella",
      source: "BLUNT Classic and Exec",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createUmbrella({}, seed);
        return [dim(a, "length"), dim(a, "canopy"), a.body.mass];
      },
      models: [
        [0.84, 1.2, 0.66],
        [0.955, 1.38, 0.91],
      ],
    },
    {
      name: "ashtray",
      source: "the two glass ashtrays read",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createVessel({ kind: "ashtray" }, seed);
        return [dim(a, "diameter"), dim(a, "height"), a.body.mass];
      },
      models: [
        [0.1, 0.03, 0.258],
        [0.168, 0.035, 1.7],
      ],
    },
    {
      name: "keyboard",
      source: "Apple Magic Keyboard with Numeric Keypad and with Touch ID",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createKeyboard(
          { kind: "keyboard" },
          seed,
        );
        return [dim(a, "width"), dim(a, "depth"), a.body.mass];
      },
      models: [
        [0.4187, 0.1149, 0.39],
        [0.4187, 0.1149, 0.369],
      ],
    },
    {
      name: "laptop",
      source: "Apple MacBook Air M4 13 and 15 in",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createKeyboard({ kind: "laptop" }, seed);
        return [dim(a, "width"), dim(a, "depth"), a.body.mass];
      },
      models: [
        [0.3041, 0.215, 1.24],
        [0.3404, 0.2376, 1.51],
      ],
    },
    {
      name: "apple",
      source: "USDA FoodData Central 171688 portions",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createFood({ kind: "apple" }, seed);
        return [dim(a, "diameter"), a.body.mass];
      },
      models: [
        [2.5 * IN, 0.101],
        [2.75 * IN, 0.149],
        [3 * IN, 0.182],
        [3.25 * IN, 0.223],
      ],
    },
    {
      name: "camera",
      source: "Ricoh GR III and Fujifilm X100VI",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createDevice({ kind: "camera" }, seed);
        return [
          dim(a, "width"),
          dim(a, "height"),
          dim(a, "thickness"),
          a.body.mass,
        ];
      },
      models: [
        [0.1094, 0.0619, 0.0332, 0.257],
        [0.128, 0.0748, 0.0553, 0.471],
      ],
    },
    {
      name: "tablet",
      source: "Apple iPad Wi-Fi and cellular",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createDevice({ kind: "tablet" }, seed);
        return [dim(a, "width"), dim(a, "height"), a.body.mass];
      },
      models: [
        [0.1795, 0.2486, 0.477],
        [0.1795, 0.2486, 0.481],
      ],
    },
    {
      name: "walkie-talkie",
      source: "Motorola CP200d by battery",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createDevice(
          { kind: "walkieTalkie" },
          seed,
        );
        return [dim(a, "thickness"), a.body.mass];
      },
      models: [
        [0.042, 0.406],
        [0.039, 0.341],
        [0.044, 0.346],
        [0.044, 0.348],
      ],
    },
    {
      name: "beer bottle",
      source: "O-I 30416, 30242, 30001 and Berlin Packaging",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createDrinkware(
          { kind: "beerBottle" },
          seed,
        );
        return [dim(a, "height"), dim(a, "diameter"), a.body.mass];
      },
      models: [
        [0.2229, 0.0609, 0.205],
        [0.2224, 0.0604, 0.285],
        [0.209, 0.0613, 0.21],
        [0.2265, 0.0604, 0.22],
      ],
    },
    {
      name: "table knife",
      source: "Eichenlaub Altdeutsch and Robert Welch Malvern",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createTool({ kind: "knife" }, seed);
        return [
          dim(a, "length"),
          dim(a, "blade"),
          dim(a, "bladeWidth"),
          a.body.mass,
        ];
      },
      models: [
        [0.225, 0.125, 0.017, 0.06],
        [0.246, 0.12, 0.021, 0.13],
      ],
    },
    {
      name: "fishing rod",
      source: "Daiwa Ninja X",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createLongTool(
          { kind: "fishingRod" },
          seed,
        );
        return [dim(a, "length"), a.body.mass];
      },
      models: [
        [1.83, 0.106],
        [2.13, 0.131],
        [2.13, 0.133],
        [2.44, 0.141],
        [2.44, 0.157],
        [2.44, 0.165],
        [2.74, 0.178],
      ],
    },
    {
      name: "tray",
      source: "IKEA SMÖRLING, GRILLTIDER and SMULA",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createTray({ kind: "tray" }, seed);
        return [dim(a, "width"), dim(a, "depth"), dim(a, "height")];
      },
      models: [
        [0.36, 0.2, 0.03],
        [0.4, 0.3, 0.02],
        [0.52, 0.35, 0.03],
      ],
    },
    {
      name: "basket",
      source: "IKEA RISATORP",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createTray({ kind: "basket" }, seed);
        return [dim(a, "width"), dim(a, "depth"), dim(a, "height")];
      },
      models: [
        [0.25, 0.26, 0.18],
        [0.42, 0.27, 0.23],
      ],
    },
    {
      name: "plate",
      source:
        "IKEA 365+ side plate and plate, Rosenthal Joyn and Thomas Sunny Day 27 cm plates",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createTableware({ kind: "plate" }, seed);
        return [dim(a, "diameter"), dim(a, "height"), dim(a, "mass")];
      },
      models: [
        [0.2, 0.02, 0.41],
        [0.27, 0.03, 0.77],
        [0.27, 0.025, 0.71],
        [0.27, 0.028, 0.59],
      ],
    },
    {
      name: "platter",
      source:
        "IKEA 365+ serving plate, Thomas Loft 34 cm and Rosenthal Heritage Midas 33 cm platters",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createTableware(
          { kind: "platter" },
          seed,
        );
        return [
          dim(a, "length"),
          dim(a, "width"),
          dim(a, "height"),
          dim(a, "mass"),
        ];
      },
      models: [
        [0.27, 0.15, 0.03, 0.52],
        [0.338, 0.24, 0.031, 0.965],
        [0.332, 0.212, 0.038, 0.78],
      ],
    },
    {
      name: "bowl",
      source: "IKEA 365+ bowl, Thomas Sunny Day 18 cm bowl and cereal bowl",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createVessel({ kind: "bowl" }, seed);
        return [dim(a, "diameter"), dim(a, "height"), dim(a, "mass")];
      },
      models: [
        [0.16, 0.07, 0.44],
        [0.166, 0.079, 0.477],
        [0.122, 0.08, 0.3],
      ],
    },
    {
      name: "suitcase",
      source: "Lufthansa and IATA cabin limits",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createBag({ kind: "suitcase" }, seed);
        return [dim(a, "height"), dim(a, "width"), dim(a, "depth")];
      },
      models: [
        [0.55, 0.4, 0.23],
        [0.56, 0.45, 0.25],
      ],
    },
    {
      name: "suitcase pull",
      source: "Industrial Health 45:756 handle heights",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createBag({ kind: "suitcase" }, seed);
        return [dim(a, "pullHeight")];
      },
      models: [[1], [1.1]],
    },
    {
      name: "razor",
      source: "Edwin Jagger and Gillette Mach3",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createCareItem({ kind: "razor" }, seed);
        return [dim(a, "length"), a.body.mass];
      },
      models: [
        [0.129, 0.087],
        [5.4 * IN, 0.035],
      ],
    },
    {
      name: "tube",
      source: "Alltub diameters",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createCareItem({ kind: "tube" }, seed);
        return [dim(a, "width")];
      },
      models: [
        [0.0135],
        [0.019],
        [0.022],
        [0.025],
        [0.028],
        [0.03],
        [0.035],
        [0.038],
        [0.04],
        [0.05],
      ],
    },
    {
      name: "walker",
      source: "Drive Medical adult and junior walkers",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createMobilityAid(
          { kind: "walker" },
          seed,
        );
        return [a.body.mass];
      },
      models: [[7.5 * LB], [7 * LB]],
    },
  ];
  const findings: string[] = archetypeModelSweep(rows);

  // A tube's length stays in its diameter's own range, a walker's handle in its model's.
  const tubeRanges: Readonly<Record<string, readonly [number, number]>> = {
    "0.0135": [0.045, 0.16],
    "0.019": [0.045, 0.16],
    "0.022": [0.075, 0.125],
    "0.025": [0.075, 0.16],
    "0.028": [0.075, 0.19],
    "0.03": [0.075, 0.19],
    "0.035": [0.075, 0.181],
    "0.038": [0.075, 0.205],
    "0.04": [0.06, 0.2],
    "0.05": [0.06, 0.2],
  };
  for (let seed: number = 0; seed < 200; seed++) {
    const tube: AutoMovieArchetype = createCareItem({ kind: "tube" }, seed);
    const range: readonly [number, number] | undefined =
      tubeRanges[String(dim(tube, "width"))];
    const length: number = dim(tube, "length");
    if (range === undefined || length < range[0] || length > range[1])
      findings.push(
        `tube ${seed}: ${length} m lies outside its diameter's range`,
      );
    const walker: AutoMovieArchetype = createMobilityAid(
      { kind: "walker" },
      seed,
    );
    const adult: boolean = Math.abs(walker.body.mass - 7.5 * LB) <= 1e-9;
    const [low, high]: readonly [number, number] = adult
      ? [32 * IN, 39 * IN]
      : [25 * IN, 32.25 * IN];
    const height: number = dim(walker, "height");
    if (height < low || height > high)
      findings.push(
        `walker ${seed}: ${height} m lies outside its model's handle range`,
      );
  }

  // A model's own figure cannot be fixed; a dimension it leaves can.
  for (const [label, make, dimension] of [
    [
      "camera mass",
      (): AutoMovieArchetype => createDevice({ kind: "camera", mass: 0.3 }, 1),
      "mass",
    ],
    [
      "rod length",
      (): AutoMovieArchetype =>
        createLongTool({ kind: "fishingRod", length: 2.2 }, 1),
      "length",
    ],
  ] as const)
    try {
      make();
      findings.push(`a fixed ${label} was accepted over the model's own`);
    } catch (error) {
      if (
        !(error instanceof AutoMovieArchetypeRefusal) ||
        error.kind !== "parameter" ||
        error.axis !== dimension
      )
        findings.push(`a fixed ${label} was not refused on ${dimension}`);
    }
  if (
    dim(
      createLongTool({ kind: "fishingRod", shaftDiameter: 0.035 }, 1),
      "shaftDiameter",
    ) !== 0.035
  )
    findings.push(
      "a rod's grip diameter, which no model gives, was not kept as fixed",
    );

  TestValidator.equals(
    "every handheld prop with read models is one of them whole",
    findings,
    [],
  );
}
