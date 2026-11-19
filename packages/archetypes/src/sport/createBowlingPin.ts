import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  ArchetypeUnits,
} from "../core";

/** Height and diameter pairs in inches, from the USBC Bowling Pin Dimensions table. */
const PROFILE: readonly [number, number][] = [
  [0, 2.031],
  [0.75, 2.828],
  [2.25, 3.906],
  [3.375, 4.51],
  [4.5, 4.766],
  [5.875, 4.563],
  [7.25, 3.703],
  [8.625, 2.472],
  [9.375, 1.965],
  [10, 1.797],
  [10.875, 1.87],
  [11.75, 2.094],
  [12.625, 2.406],
  [13.5, 2.547],
];

/** Crown stations used to close the shell at the USBC nominal 15 in height. */
const CROWN: readonly [number, number][] = [
  [14.3, 2.2],
  [14.8, 1.4],
  [15, 0.2],
];

/**
 * A ten-pin bowling pin standing at its own base origin, so ten independent instances can move after a hit.
 *
 * @param params Optional pin id, distinct across the rack.
 * @param seed Seed for mass.
 * @returns The pin, including its base and the widest part to use as targets.
 * @evidence contracts/development/common.md#meaningful-documentation Defines the pin's stance and targets.
 * @evidence contracts/development/implementation.md#principled-implementation USBC Equipment Specifications and Certifications Manual, Bowling Pin Measurements, gives the profile stations, nominal height and mass tolerance. Actual convex cells join adjacent station rings with a provisional crown closure.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw mass, make each station ring, join neighbouring rings and record the two aiming points.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No single convex hull fills the neck. Each coarse cell serves both rendering and collision, and the model does not claim certified inertia or materials.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The station and side counts are fixed.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each model has its own part and mass accounting.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Construction retains no application state.
 */
export function createBowlingPin(
  params: { id?: string } = {},
  seed?: number | string,
): Archetype<"base" | "belly", "mass"> {
  const inch: number = ArchetypeUnits.INCH;
  const draw: ArchetypeDrawSession<"mass"> = new ArchetypeDrawSession(
    "bowlingPin",
    { mass: "kg" },
    seed,
    {},
  );
  const { mass }: Record<"mass", number> = draw.dimensions({
    mass: ArchetypeBand.of(
      "kg",
      54 * ArchetypeUnits.OUNCE,
      58 * ArchetypeUnits.OUNCE,
      "USBC Bowling Pin Measurements, 3 lb 6 oz to 3 lb 10 oz",
    ),
  });
  const builder: ArchetypeBuilder<"base" | "belly", "mass"> =
    new ArchetypeBuilder({
      material: "wood",
      id: params.id,
      name: "ten-pin bowling pin",
      draw,
    });
  const rings: IAutoMovieVector3[][] = [...PROFILE, ...CROWN].map(
    ([height, diameter]): IAutoMovieVector3[] =>
      Array.from(
        { length: 12 },
        (_: unknown, index: number): IAutoMovieVector3 => {
          const angle: number = (index * Math.PI) / 6;
          const radius: number = (diameter * inch) / 2;
          return Vector3.create(
            radius * Math.cos(angle),
            height * inch,
            radius * Math.sin(angle),
          );
        },
      ),
  );
  for (let index: number = 1; index < rings.length; ++index)
    builder.convex(
      `section-${index}`,
      [...rings[index - 1]!, ...rings[index]!],
      undefined,
      {
        color: index === 9 || index === 11 ? "#b12731" : "#f7f2e9",
      },
    );
  builder.affordance({
    id: "base",
    kind: "socket",
    frame: ArchetypeFrame.upright(Vector3.create(0, 0, 0)),
    extent: null,
  });
  builder.affordance({
    id: "belly",
    kind: "socket",
    frame: ArchetypeFrame.upright(Vector3.create(0, 4.5 * inch, 0)),
    extent: null,
  });
  return builder.build(mass);
}
