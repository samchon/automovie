import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** A provisional band in metres from a secondary source. */
const m = (minimum: number, maximum: number, source: string): IArchetypeBand =>
  ArchetypeBand.of("m", minimum, maximum, source, true);

/** Frame geometry no source gave. */
const GEOMETRY: string =
  "typical road frame geometry; maker geometry charts could not be opened";

/**
 * A bicycle: two wheels, a frame, a saddle, handlebars, and a crank with its two pedals.
 *
 * The bicycle stands upright with its bottom bracket over the origin and its front toward `+Z`. The `crank` turns both arms: at travel 0 the left arm (`+X`) points straight up, at top dead centre, and a positive travel pedals forward. Each pedal rides the crank and stays level. The rider sits on the `saddle`, whose height along the seat tube from the bottom bracket is the `saddleHeight` dimension, and holds the two grips.
 *
 * `rideBicycle` moves it along a course.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The bicycle.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the bicycle's origin and front, the crank's zero and turning sense, and how the saddle height is measured.
 * @evidence contracts/development/implementation.md#principled-implementation Rods for the frame's tubes from the bottom bracket, the two axles and the saddle; the saddle's top lies `saddleHeight` up the seat tube from the bottom bracket's centre, the point LeMond's 0.883 of the inseam is measured to (Bini, Hume and Croft 2011, Sports Med 41:463, section 3.1.1). The crank's frame points out of the left side so that a right-handed turn about it carries the top of the stroke forward.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, place the five points of the frame, then the parts and the affordances on them.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No chain, gears or brakes; the wheels do not spin.
 * @evidence contracts/development/implementation.md#efficient-algorithms About fifteen parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createBicycle(
  params: createBicycle.IParams = {},
  seed?: number | string,
): Archetype<createBicycle.Affordance, createBicycle.Dimension> {
  const d: Record<createBicycle.Dimension, number> = ArchetypeDraw.dimensions(
    "bicycle",
    createBicycle.BANDS,
    seed,
    params,
  );
  const builder: ArchetypeBuilder<
    createBicycle.Affordance,
    createBicycle.Dimension
  > = new ArchetypeBuilder({
    archetype: "bicycle",
    id: params.id,
    name: "bicycle",
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const radius: number = d.wheelDiameter / 2;
  const tube: number = 0.016;
  const steel: string = "#b8412f";

  // The frame's points: bottom bracket, the two axles, the saddle's top and the head of the fork.
  const bracket: IAutoMovieVector3 = v(0, d.bottomBracket, 0);
  const stay: number = createBicycle.CHAINSTAY;
  const rear: IAutoMovieVector3 = v(
    0,
    radius,
    -Math.sqrt(stay * stay - (radius - d.bottomBracket) ** 2),
  );
  const fore: IAutoMovieVector3 = v(0, radius, rear.z + d.wheelbase);
  const angle: number = (d.seatAngle * Math.PI) / 180;
  const saddle: IAutoMovieVector3 = v(
    0,
    d.bottomBracket + d.saddleHeight * Math.sin(angle),
    -d.saddleHeight * Math.cos(angle),
  );
  const bars: IAutoMovieVector3 = v(0, saddle.y, saddle.z + d.reach);
  const head: IAutoMovieVector3 = v(0, saddle.y - 0.08, bars.z - 0.06);

  for (const [name, at] of [
    ["wheel-rear", rear],
    ["wheel-front", fore],
  ] as const)
    builder.rod(name, radius, v(-0.012, at.y, at.z), v(0.012, at.y, at.z), {
      color: "#22262b",
      density: 0.2,
    });
  for (const [name, from, to] of [
    ["seat-tube", bracket, v(0, saddle.y - 0.03, saddle.z)],
    ["down-tube", bracket, head],
    ["top-tube", v(0, saddle.y - 0.1, saddle.z + 0.02), head],
    ["chain-stay", bracket, rear],
    ["seat-stay", v(0, saddle.y - 0.1, saddle.z + 0.02), rear],
    ["fork", head, fore],
    ["stem", head, bars],
  ] as const)
    builder.rod(name, tube, from, to, { color: steel });
  builder.box(
    "saddle",
    v(d.saddleWidth, 0.03, createBicycle.SADDLE),
    v(0, saddle.y - 0.015, saddle.z),
    { color: "#22262b" },
  );
  builder.affordance({
    id: "saddle",
    kind: "seat",
    frame: ArchetypeFrame.upright(
      v(0, saddle.y, saddle.z + createBicycle.SADDLE / 2),
    ),
    extent: null,
    depth: createBicycle.SADDLE,
    width: d.saddleWidth,
    astride: true,
  });

  // The handlebar and a grip at each end, taken from above.
  const grip: number = d.gripDiameter / 2;
  builder.rod(
    "handlebar",
    grip,
    v(-d.handlebarWidth / 2, bars.y, bars.z),
    v(d.handlebarWidth / 2, bars.y, bars.z),
    { color: "#55595f" },
  );
  for (const [id, sign] of [
    ["leftGrip", 1],
    ["rightGrip", -1],
  ] as const)
    builder.affordance({
      id,
      kind: "handle",
      frame: ArchetypeFrame.upright(
        v(sign * (d.handlebarWidth / 2 - 0.06), bars.y, bars.z),
      ),
      extent: null,
      grip: "power",
      aperture: d.gripDiameter,
      length: 0.12,
    });

  // The crank: both arms on one axle, the left one up at rest, and a level pedal at the end of each.
  const half: number = d.stance / 2;
  builder.rod(
    "crank-left",
    0.01,
    v(half, bracket.y, 0),
    v(half, bracket.y + d.crank, 0),
    { color: "#8a8d91" },
  );
  builder.rod(
    "crank-right",
    0.01,
    v(-half, bracket.y, 0),
    v(-half, bracket.y - d.crank, 0),
    { color: "#8a8d91" },
  );
  builder.affordance({
    id: "crank",
    kind: "crank",
    frame: ArchetypeFrame.facing(v(half, bracket.y, 0), v(1, 0, 0), v(0, 1, 0)),
    extent: null,
    radius: d.crank,
    parts: ["crank-left", "crank-right"],
  });
  for (const [id, sign] of [
    ["leftPedal", 1],
    ["rightPedal", -1],
  ] as const) {
    const at: IAutoMovieVector3 = v(
      sign * (half + createBicycle.PEDAL.width / 2),
      bracket.y + sign * d.crank,
      0,
    );
    builder.box(
      `pedal-${sign === 1 ? "left" : "right"}`,
      v(createBicycle.PEDAL.width, 0.02, createBicycle.PEDAL.depth),
      v(at.x, at.y - 0.01, at.z),
      { color: "#22262b" },
    );
    builder.affordance({
      id,
      kind: "pedal",
      frame: ArchetypeFrame.upright(at),
      extent: null,
      width: createBicycle.PEDAL.width,
      depth: createBicycle.PEDAL.depth,
      parts: [`pedal-${sign === 1 ? "left" : "right"}`],
      rides: "crank",
    });
  }
  return builder.build(d.mass);
}

/**
 * Companion types and bands of {@link createBicycle}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one band per dimension; the fit dimensions are those bicycle fitting measures (saddle height from the bottom bracket, crank length, reach).
 * @evidence contracts/development/design.md#minimal-and-owned-surface What a pedalling and a steering act read (#3372): the saddle, the grips, the crank's length and the pedals' places.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts One crank articulation turns both arms, so the two pedals cannot fall out of phase.
 */
export namespace createBicycle {
  /** The rear axle from the bottom bracket, metres: a typical road chain stay, not read at a source. */
  export const CHAINSTAY: number = 0.42;

  /** A saddle's length, metres: typical, not read at a source. */
  export const SADDLE: number = 0.27;

  /** A pedal's platform, metres: typical, not read at a source. */
  export const PEDAL: Readonly<{ width: number; depth: number }> = {
    width: 0.09,
    depth: 0.08,
  };

  /**
   * The affordance ids:
   *
   * - `saddle`: the seat, facing forward.
   * - `leftGrip`, `rightGrip`: the handlebar's grips on `+X` and `-X`, taken from above.
   * - `crank`: the crank's axle, out of the left side; its travel turns both arms, positive pedalling forward from the left arm's top dead centre.
   * - `leftPedal`, `rightPedal`: the pedals, riding the crank and staying level.
   */
  export type Affordance =
    | "saddle"
    | "leftGrip"
    | "rightGrip"
    | "crank"
    | "leftPedal"
    | "rightPedal";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `wheelDiameter`: a wheel with its tyre.
   * - `wheelbase`: axle to axle.
   * - `bottomBracket`: the crank axle above the ground.
   * - `crank`: a crank arm's length, axle to pedal spindle.
   * - `stance`: the distance between the two crank arms' outer faces across the bicycle.
   * - `saddleHeight`: the saddle's top from the bottom bracket's centre along the seat tube.
   * - `seatAngle`: the seat tube from the horizontal, degrees.
   * - `saddleWidth`: the saddle's width.
   * - `reach`: the handlebar ahead of the saddle's middle.
   * - `handlebarWidth`: end to end.
   * - `gripDiameter`: the bar where the hands hold it.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "wheelDiameter"
    | "wheelbase"
    | "bottomBracket"
    | "crank"
    | "stance"
    | "saddleHeight"
    | "seatAngle"
    | "saddleWidth"
    | "reach"
    | "handlebarWidth"
    | "gripDiameter"
    | "mass";

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `bicycle` when absent. */
    id?: string;
  }

  /** The band of each free dimension; every one is provisional, read at secondary sources or not at all. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    wheelDiameter: m(
      0.672,
      0.702,
      "ISO 5775 622 mm bead seat plus twice a 25 to 40 mm tyre (Wikipedia, ISO 5775, https://en.wikipedia.org/wiki/ISO_5775)",
    ),
    wheelbase: m(0.97, 1.05, GEOMETRY),
    bottomBracket: m(0.26, 0.29, GEOMETRY),
    crank: m(
      0.165,
      0.18,
      "crank lengths of 165 to 180 mm (Wikipedia, Crankset, https://en.wikipedia.org/wiki/Crankset)",
    ),
    stance: m(0.15, 0.17, "pedal stance width; no value was found at a source"),
    saddleHeight: m(
      0.62,
      0.8,
      "0.883 of an inseam of about 0.70 to 0.90 m, LeMond's rule as given by Bini, Hume and Croft 2011, Sports Med 41:463 (https://paulogentil.com/pdf/Effects%20of%20Bicycle%20Saddle%20Height%20on%20Knee%20Injury%20Risk%20and%20Cycling%20Performance.pdf); the inseam range is an estimate",
    ),
    seatAngle: ArchetypeBand.of("degrees", 72, 74, GEOMETRY, true),
    saddleWidth: m(0.13, 0.16, "saddle width, not read at a source"),
    reach: m(0.48, 0.56, GEOMETRY),
    handlebarWidth: m(
      0.34,
      0.5,
      "drop handlebar widths of 34 to 50 cm (Wikipedia, Bicycle handlebar, https://en.wikipedia.org/wiki/Bicycle_handlebar)",
    ),
    gripDiameter: m(
      0.0222,
      0.0238,
      "22.2 mm flat bar and 23.8 mm drop bar grip areas (Wikipedia, Bicycle handlebar, https://en.wikipedia.org/wiki/Bicycle_handlebar)",
    ),
    mass: ArchetypeBand.of("kg", 8, 14, ArchetypeBand.TYPICAL_MASS, true),
  };
}
