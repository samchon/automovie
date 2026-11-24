import {
  AutoMovieArchetypeRefusal,
  createBoat,
  createCar,
  createMotorcycle,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeModelSweep } from "../../../internal/archetypeModelSweep";

/** An inch, metres, as the sources state their figures. */
const IN: number = 0.0254;

/** A pound, kilograms. */
const LB: number = 0.45359237;

/** A tyre's outer diameter from its size, metres, worked here: the rim plus twice the width times the aspect ratio. */
const tyre = (width: number, aspect: number, rim: number): number =>
  rim * IN + (2 * width * aspect) / 100000;

/** A vehicle's built figures for some dimensions, in order. */
const figures = (
  dimensions: Readonly<Partial<Record<string, number>>>,
  names: readonly string[],
): number[] => names.map((n: string): number => dimensions[n]!);

/**
 * A vehicle is one read model whole: every seed's figures are all one model's, never a mix of two, and every model appears.
 *
 * Scenarios, each over 200 seeds (`archetypeModelSweep`):
 * 1. A hatchback's length, width, height, wheelbase, tyre and lock-to-lock turns are one Jazz or Civic grade's at Honda UK's pages (the Civic Sport and Advance share all of them); a sedan's width and wheelbase the Corolla saloon's or the Camry's; a van's length and wheelbase the Transit Custom L1's or L2's; a pickup's height, curb weight and lift-in height the Ranger 4x2's or 4x4's.
 * 2. A motorcycle's seat height, wheelbase, width, both tyres and mass are the CB500 Hornet's or the MT-07's; a scooter's the PCX125's.
 * 3. A rowboat's length, beam, depth and mass are one of the three designers' boats'; a canoe's length, beam, depth, ends and mass one of its four hulls' in one of that hull's layups.
 * 4. Fixing a dimension the picked model supplies, a hatchback's length, is refused at that dimension, never dropped.
 */
export function test_unit_archetypes_vehicles_vehicle_models(): void {
  const car =
    (
      kind: createCar.Kind,
      names: readonly string[],
    ): ((seed: number) => number[]) =>
    (seed: number): number[] =>
      figures(createCar({ kind }, seed).dimensions, names);
  const machine =
    (kind: createMotorcycle.Kind): ((seed: number) => number[]) =>
    (seed: number): number[] =>
      figures(createMotorcycle({ kind }, seed).dimensions, [
        "seatHeight",
        "wheelbase",
        "width",
        "frontWheelDiameter",
        "wheelDiameter",
        "mass",
      ]);
  const boat =
    (
      kind: createBoat.Kind,
      names: readonly string[],
    ): ((seed: number) => number[]) =>
    (seed: number): number[] =>
      figures(createBoat({ kind }, seed).dimensions, names);
  const canoe = (
    length: number,
    beam: number,
    depth: number,
    ends: number,
    masses: readonly number[],
  ): number[][] =>
    masses.map((m: number): number[] => [
      length * IN,
      beam * IN,
      depth * IN,
      ends * IN,
      m * LB,
    ]);
  // A dimension a picked model supplies is the model's own: fixing it is refused, never dropped.
  let refused: unknown = null;
  try {
    createCar({ kind: "hatchback", length: 4.2 }, 3);
  } catch (error) {
    refused = error;
  }
  TestValidator.predicate(
    "a fixed length a hatchback grade supplies is refused",
    refused instanceof AutoMovieArchetypeRefusal && refused.axis === "length",
  );
  TestValidator.equals(
    "each vehicle is one read model whole",
    archetypeModelSweep([
      {
        name: "hatchback",
        measure: car("hatchback", [
          "length",
          "width",
          "height",
          "wheelbase",
          "wheelDiameter",
          "lockTurns",
        ]),
        models: [
          [4.089, 1.694, 1.526, 2.517, tyre(185, 60, 15), 2.51],
          [4.089, 1.694, 1.526, 2.517, tyre(185, 55, 16), 2.35],
          [4.105, 1.725, 1.526, 2.52, tyre(185, 60, 16), 2.63],
          [4.56, 1.802, 1.408, 2.734, tyre(215, 50, 17), 2.3],
          [4.56, 1.802, 1.408, 2.734, tyre(235, 40, 18), 2.2],
        ],
        source: "Honda UK specification pages",
      },
      {
        name: "sedan",
        measure: car("sedan", ["width", "wheelbase"]),
        models: [
          [1.78, 2.7],
          [1.84, 2.82],
        ],
        source: "the Toyota Corolla and Camry infoboxes",
      },
      {
        name: "van",
        measure: car("van", ["length", "wheelbase"]),
        models: [
          [5.05, 3.1],
          [5.45, 3.5],
        ],
        source: "Ford's Transit Custom specification and a dealer's L2 guide",
      },
      {
        name: "pickup",
        measure: car("pickup", ["height", "mass", "bedFloor"]),
        models: [
          [73.9 * IN, 4203 * LB, 34.0 * IN],
          [74.4 * IN, 4415 * LB, 34.7 * IN],
        ],
        source: "the 2025 Ford Ranger technical specifications, p. 3",
      },
      {
        name: "motorcycle",
        measure: machine("motorcycle"),
        models: [
          [0.785, 1.41, 0.8, tyre(120, 70, 17), tyre(160, 60, 17), 191],
          [0.805, 1.4, 0.745, tyre(120, 70, 17), tyre(180, 55, 17), 182],
        ],
        source:
          "Honda UK's CB500 Hornet page and Yamaha's 2019 MT-07 factsheet",
      },
      {
        name: "scooter",
        measure: machine("scooter"),
        models: [
          [0.763, 1.315, 0.74, tyre(110, 70, 14), tyre(130, 70, 13), 134],
        ],
        source: "Honda UK's PCX125 page",
      },
      {
        name: "rowboat",
        measure: boat("rowboat", ["length", "beam", "depth", "mass"]),
        models: [
          [168 * IN, 50 * IN, 18 * IN, 85 * LB],
          [186 * IN, 53.5 * IN, 18.5 * IN, 95 * LB],
          [203 * IN, 54 * IN, 22 * IN, 350 * LB],
        ],
        source: "the Selway-Fisher, Duckworks and Glen-L pages",
      },
      {
        name: "canoe",
        measure: boat("canoe", [
          "length",
          "beam",
          "depth",
          "endHeight",
          "mass",
        ]),
        models: [
          ...canoe(192, 36, 15, 23, [64, 54, 60, 44, 47]),
          ...canoe(201, 37, 15, 23, [91]),
          ...canoe(204, 35, 14, 22, [58, 42, 36.5, 44]),
          ...canoe(222, 33.5, 13.5, 20.5, [58, 42, 36.5, 44]),
        ],
        source: "the Nova Craft, Old Town and Wenonah pages",
      },
    ]),
    [],
  );
}
