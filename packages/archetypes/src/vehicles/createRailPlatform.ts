import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
} from "../core";
import { createRailCarriage } from "./createRailCarriage";

/**
 * A one-car segment of a level-boarding station platform, aligned with
 * createRailCarriage at the parked carriage's origin and orientation. The
 * platform is on +X and its track-facing edge runs along Z. Keep this model
 * stationary when giving the carriage its own ride.
 *
 * The 11-foot clear depth and one-foot contrasting edge strip are from the
 * Southern California Rapid Transit District's 1968 preliminary design §III.C
 * (https://libraryarchives.metro.net/DPGTL/scrtd/1968-metro-rail-preliminary-design-criteria-and-outline-specifications.pdf).
 * The 75 mm gap is inside the three-inch level-boarding bound in §1192.53(d)
 * (https://www.access-board.gov/ada/vehicles/subpart-c/).
 *
 * @param params The model id, supplied as an option or as a positional string.
 * @returns The stationary platform, including the support top and its track
 *   edge.
 */
export function createRailPlatform(
  params: { id?: string } | string = {},
): AutoMovieArchetype<"platform" | "platformEdge", never> {
  const builder: AutoMovieArchetypeBuilder<"platform" | "platformEdge", never> =
    new AutoMovieArchetypeBuilder({
      id: (typeof params === "string" ? params : params.id) ?? "railPlatform",
      name: "rail platform",
      material: "concrete",
      draw: new AutoMovieArchetypeDrawSession<never>(
        "railPlatform",
        {},
        undefined,
      ),
    });
  const v: typeof Vector3.create = Vector3.create;
  const depth: number = 11 * AutoMovieArchetypeUnits.FOOT;
  const strip: number = AutoMovieArchetypeUnits.FOOT;
  const length: number = 75 * AutoMovieArchetypeUnits.FOOT;
  const height: number = createRailCarriage.REFERENCE.floor;
  const edge: number = createRailCarriage.REFERENCE.width / 2 + 0.075;
  builder.box(
    "platform-edge-strip",
    v(strip, height, length),
    v(edge + strip / 2, height / 2, 0),
    {
      color: "#e4b63a",
    },
  );
  builder.box(
    "platform-deck",
    v(depth - strip, height, length),
    v(edge + (depth + strip) / 2, height / 2, 0),
    {
      color: "#a6a29b",
    },
  );
  builder.affordance({
    id: "platform",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(edge + depth / 2, height, 0)),
    extent: null,
    width: depth,
    depth: length,
  });
  builder.affordance({
    id: "platformEdge",
    kind: "ledge",
    frame: AutoMovieArchetypeFrame.facing(
      v(edge, height, 0),
      v(0, 1, 0),
      v(0, 0, 1),
    ),
    extent: null,
    length,
  });
  return builder.build(CONCRETE_DENSITY * depth * length * height);
}

/** Nominal concrete density for the schematic slab, kilograms per cubic metre. */
const CONCRETE_DENSITY: number = 2_400;
