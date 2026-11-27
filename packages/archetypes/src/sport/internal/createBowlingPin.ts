import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
} from "../../core";

/**
 * Height and diameter pairs in inches, from the USBC Bowling Pin Dimensions
 * table.
 */
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
 * A ten-pin bowling pin standing at its own base origin, so ten independent
 * instances can move after a hit.
 *
 * @param params Optional pin id, distinct across the rack.
 * @param seed Seed for mass.
 * @returns The pin, including its base and the widest part to use as targets.
 */
export function createBowlingPin(
  params: { id?: string } = {},
  seed?: number,
): AutoMovieArchetype<"base" | "belly", "mass"> {
  const inch: number = AutoMovieArchetypeUnits.INCH;
  const draw: AutoMovieArchetypeDrawSession<"mass"> =
    new AutoMovieArchetypeDrawSession("bowlingPin", { mass: "kg" }, seed, {});
  const { mass }: Record<"mass", number> = draw.dimensions({
    mass: AutoMovieArchetypeBand.of(
      "kg",
      54 * AutoMovieArchetypeUnits.OUNCE,
      58 * AutoMovieArchetypeUnits.OUNCE,
      "USBC Bowling Pin Measurements, 3 lb 6 oz to 3 lb 10 oz",
    ),
  });
  const builder: AutoMovieArchetypeBuilder<"base" | "belly", "mass"> =
    new AutoMovieArchetypeBuilder({
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
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, 0, 0)),
    extent: null,
  });
  builder.affordance({
    id: "belly",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, 4.5 * inch, 0)),
    extent: null,
  });
  return builder.build(mass);
}
