import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";

/**
 * A shortboard lying flat on the ground, its length along `Z` and its nose toward `-Z`.
 *
 * It is one of the maker's three boards read, whole: the model given, or one drawn from the seed. `deck` is its top, the surface the feet stand on and the chest lies on. `frontStance` and `rearStance` mark provisional foot sites at one fifth of the board's length to either side of the middle. `rail` is the carry grip on the `+X` edge. Both lower rail lines can be sampled on a moving prop.
 *
 * @param params The board and any dimension the author fixes.
 * @param seed The seed that draws the board when it is not given and every dimension left free inside its band; absent, the first board and the middle of each band.
 * @returns The board.
 * @throws {ArchetypeRefusal} For a board the chart does not list, or a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the board lies, how its model is chosen and what each contact represents.
 * @evidence contracts/development/implementation.md#principled-implementation One of the chart's three boards whole, its length, width and thickness as the chart gives them; the deck on top and the rail at the board's widest point.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pick the board, draw the mass, then place the deck, stance and rail readings from its dimensions.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No board between the chart's rows is made; the board is a box: no outline, rocker or fins.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One part.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createSurfboard(
  params: createSurfboard.IParams = {},
  seed?: number | string,
): Archetype<createSurfboard.Affordance, createSurfboard.Dimension> {
  const draw: ArchetypeDrawSession<createSurfboard.Dimension> =
    new ArchetypeDrawSession<createSurfboard.Dimension>(
      "surfboard",
      createSurfboard.UNITS,
      seed,
      params,
    );
  const model: {
    name: createSurfboard.Model | undefined;
    figures: Readonly<Partial<Record<createSurfboard.Dimension, number>>>;
  } = draw.model<createSurfboard.Model>(
    "model",
    params.model,
    createSurfboard.MODELS,
  );
  const d: Partial<Record<createSurfboard.Dimension, number>> = {
    ...draw.dimensions(createSurfboard.BANDS),
    ...model.figures,
  };
  const builder: ArchetypeBuilder<
    createSurfboard.Affordance,
    createSurfboard.Dimension
  > = new ArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: `surfboard ${model.name}`,
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const length: number = d.length!;
  const width: number = d.width!;
  const thickness: number = d.thickness!;
  builder.box("board", v(width, thickness, length), v(0, thickness / 2, 0), {
    color: "#f4f1e8",
    density: 0.15,
  });
  builder.affordance({
    id: "deck",
    kind: "surface",
    frame: ArchetypeFrame.upright(v(0, thickness, 0)),
    extent: null,
    width,
    depth: length,
  });
  builder.affordance({
    id: "prone",
    kind: "surface",
    frame: ArchetypeFrame.upright(v(0, thickness, length / 12)),
    extent: null,
    width,
    depth: length / 3,
  });
  // The two palm patches sit inside the material rails, ahead of the prone hips.
  for (const [id, sign] of [
    ["leftPalm", -1],
    ["rightPalm", 1],
  ] as const)
    builder.affordance({
      id,
      kind: "surface",
      frame: ArchetypeFrame.upright(
        v((sign * width) / 3, thickness, -length / 6),
      ),
      extent: null,
      width: width / 3,
      depth: length / 6,
    });
  builder.affordance({
    id: "rail",
    kind: "handle",
    symmetry: "none",
    frame: ArchetypeFrame.facing(
      v(width / 2, thickness / 2, 0),
      v(0, 1, 0),
      v(0, 0, 1),
    ),
    extent: null,
    grip: "power",
    aperture: thickness,
  });
  for (const [id, sign] of [
    ["frontStance", -1],
    ["rearStance", 1],
  ] as const)
    builder.affordance({
      id,
      kind: "surface",
      frame: ArchetypeFrame.upright(v(0, thickness, (sign * length) / 5)),
      extent: null,
      width,
      depth: length / 5,
    });
  for (const [id, sign] of [
    ["leftRail", 1],
    ["rightRail", -1],
  ] as const)
    builder.affordance({
      id,
      kind: "ledge",
      frame: ArchetypeFrame.facing(
        v((sign * width) / 2, 0, 0),
        v(0, 1, 0),
        v(0, 0, -sign),
      ),
      extent: null,
      length,
    });
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createSurfboard}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation A closed union of the chart's boards, each built whole; the mass, which the chart does not give, a provisional band.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The deck the body meets and the rail a hand carries it by (#3468 N11).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The mass, which the chart does not give, is provisional.
 */
export namespace createSurfboard {
  /** The boards read: the Lost Driver 2.0's 5'10, 6'0 and 6'2. */
  export type Model = "5'10" | "6'0" | "6'2";

  /**
   * The dimensions, metres unless stated:
   *
   * - `length`, `width`, `thickness`: the board's, its model's.
   * - `mass`: kilograms, free.
   */
  export type Dimension = "length" | "width" | "thickness" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    length: "m",
    width: "m",
    thickness: "m",
    mass: "kg",
  };

  /** Each board's figures, metres, the default first: Lost Driver 2.0 size chart, 5'10 x 18.75 x 2.36 in, 6'0 x 19.18 x 2.40 in, 6'2 x 19.50 x 2.50 in (https://lostsurfboards.com/surfboards/driver/). */
  export const MODELS: Readonly<
    Record<Model, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    "5'10": {
      length: 70 * ArchetypeUnits.INCH,
      width: 18.75 * ArchetypeUnits.INCH,
      thickness: 2.36 * ArchetypeUnits.INCH,
    },
    "6'0": {
      length: 72 * ArchetypeUnits.INCH,
      width: 19.18 * ArchetypeUnits.INCH,
      thickness: 2.4 * ArchetypeUnits.INCH,
    },
    "6'2": {
      length: 74 * ArchetypeUnits.INCH,
      width: 19.5 * ArchetypeUnits.INCH,
      thickness: 2.5 * ArchetypeUnits.INCH,
    },
  };

  /**
   * The affordance ids:
   *
   * - `deck`: the top, the surface the feet and the chest meet.
   * - `rail`: the `+X` edge at the board's middle and half its thickness, a handle whose `+X` runs along the edge and whose aperture is the thickness.
   * - `prone`: the central deck patch used when mounting from water.
   * - `leftPalm`, `rightPalm`: the opposing material patches for a surfer facing the nose.
   * - `frontStance`, `rearStance`: provisional deck sites for the feet.
   * - `leftRail`, `rightRail`: the lower long edges for pose readings.
   */
  export type Affordance =
    | "deck"
    | "prone"
    | "leftPalm"
    | "rightPalm"
    | "rail"
    | "frontStance"
    | "rearStance"
    | "leftRail"
    | "rightRail";

  /** The parameters: the board, and the mass fixed to a value inside its band. */
  export interface IParams extends Partial<Record<"mass", number>> {
    /** Which board; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `surfboard` when absent. */
    id?: string;
  }

  /** The band of the free dimension. */
  export const BANDS: Readonly<Record<"mass", IArchetypeBand>> = {
    mass: ArchetypeBand.of("kg", 2.5, 3.5, ArchetypeBand.TYPICAL_MASS, true),
  };
}
