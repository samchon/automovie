import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The rules' comparison sheet, read for the World Athletics column. */
const RULES: string =
  "2025 High Jump Rules Comparison, Pacific Association USATF, World Athletics column: uprights 4.00 to 4.04 m apart, crossbar 3.98 to 4.02 m long (https://pausatf.org/wp-content/uploads/2025/01/High-Jump-Rules-Comparison-Color-2025.pdf)";

/** The crossbar's section, read in the World Athletics rule. */
const BAR: string =
  "World Athletics Competition and Technical Rules, 2020 edition, Technical Rule 26.7: the circular part of the crossbar 30 mm +/- 1 mm across, the bar at most 2 kg (https://athletics.lv/file/download/61151)";

/**
 * A high jump: two uprights and the crossbar laid across them at the height the competition sets.
 *
 * The uprights stand on the floor either side of the origin along `X`, the jumper approaching from `-Z`. `bar` is the crossbar's top, a bar along `+X` facing up: its height is the one a jump reads, and its length the bar's.
 *
 * The landing area is its own archetype (`createLandingMat`), placed beyond the bar on `+Z`.
 *
 * @param params Any dimension the author fixes; `height` is the bar's.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The high jump.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the apparatus stands, the contact and where the landing is.
 * @evidence contracts/development/implementation.md#principled-implementation Two upright rods a little taller than the bar, their axes the drawn span apart, and the crossbar rod across them with its top at the drawn height.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, the two uprights, the crossbar, its contact.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No bases, pegs or height scale; the uprights' section is an estimate.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createHighJump(
  params: createHighJump.IParams = {},
  seed?: number | string,
): Archetype<createHighJump.Affordance, createHighJump.Dimension> {
  const d: Record<createHighJump.Dimension, number> = ArchetypeDraw.dimensions(
    "highJump",
    createHighJump.BANDS,
    seed,
    params,
  );
  const builder: ArchetypeBuilder<
    createHighJump.Affordance,
    createHighJump.Dimension
  > = new ArchetypeBuilder({
    archetype: "highJump",
    id: params.id,
    name: "high jump",
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const radius: number = d.diameter / 2;
  const centre: number = d.height - radius;
  for (const [id, sign] of [
    ["upright-left", 1],
    ["upright-right", -1],
  ] as const)
    builder.rod(
      id,
      createHighJump.UPRIGHT / 2,
      v((sign * d.span) / 2, 0, 0),
      v((sign * d.span) / 2, d.height + createHighJump.ABOVE, 0),
      { color: "#d8d2c4", density: 2 },
    );
  builder.rod(
    "crossbar",
    radius,
    v(-d.length / 2, centre, 0),
    v(d.length / 2, centre, 0),
    { color: "#e8c547", density: 0.3 },
  );
  builder.affordance({
    id: "bar",
    kind: "bar",
    symmetry: "round",
    frame: ArchetypeFrame.facing(v(0, centre, 0), v(0, 1, 0), v(1, 0, 0)),
    extent: null,
    aperture: d.diameter,
    length: d.length,
  });
  return builder.build(d.mass);
}

/**
 * Companion types, constants and bands of {@link createHighJump}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation One band per dimension; the bar's height is the competition's setting, banded over the range a competition uses.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The bar's height and length a jump reads, and the one contact.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The uprights' section and the height they stand above the bar are named estimates.
 */
export namespace createHighJump {
  /** An upright's diameter, metres. An estimate, not read at a source. */
  export const UPRIGHT: number = 0.05;

  /** How far the uprights stand above the bar, metres: World Athletics asks at least 0.10 m above the greatest height, as secondary summaries give it. */
  export const ABOVE: number = 0.1;

  /** The affordance ids: `bar`, the crossbar's axis, a bar along `+X` facing up. */
  export type Affordance = "bar";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the crossbar's top above the floor, the height jumped.
   * - `length`: the crossbar's.
   * - `diameter`: the crossbar's.
   * - `span`: between the uprights' axes.
   * - `mass`: the uprights with the bar, kilograms.
   */
  export type Dimension = "height" | "length" | "diameter" | "span" | "mass";

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `highJump` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    height: ArchetypeBand.metres(
      1,
      2.45,
      "the height the competition sets, from a beginner's 1 m to the 2.45 m men's world record (World Athletics records); a setting, not a measurement",
      true,
    ),
    length: ArchetypeBand.metres(3.98, 4.02, RULES),
    diameter: ArchetypeBand.metres(0.029, 0.031, BAR),
    span: ArchetypeBand.metres(4, 4.04, RULES),
    mass: ArchetypeBand.of(
      "kg",
      20,
      40,
      "an estimate of two weighted uprights with their bar; no maker's figure was read",
      true,
    ),
  };
}
