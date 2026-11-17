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

/** The roof hatch read. */
const BILCO: string =
  'Bilco Type S ladder access roof hatch product data: size "(width x length)" 36 x 30 in (914 x 762 mm), S-20 steel 183 lb (83 kg) and S-50 aluminum 110 lb (50 kg); the section drawing across the 3\'-0" (914 mm) width with the HINGE at one side and the cover held open at 70 degrees (https://www.buildsite.com/pdf/bilco/Type-S-Roof-Hatch-Ladder-Access-Product-Data-B32903.pdf)';

/** A Bilco Type S hatch's sizes, metres and degrees, from the maker's sheet: the opening's `width` from the ladder's side to the hinge and `length` along the hinge, "36 x 30" as "(width x length)", Bilco's guide specifications saying "Length denotes hinge side"; the curb's `curb` height, "12\" (305mm) in height", and `wall` thickness, the section's 2 1/4 in (57 mm) either side of the opening; the cover's `cover` thickness, its "1\" (25.4mm) concealed fiberglass insulation"; and the cover's `swing`, the section's 70 degrees open. */
const HATCH: Readonly<{
  width: number;
  length: number;
  curb: number;
  wall: number;
  cover: number;
  swing: number;
}> = {
  width: 36 * ArchetypeUnits.INCH,
  length: 30 * ArchetypeUnits.INCH,
  curb: 12 * ArchetypeUnits.INCH,
  wall: 2.25 * ArchetypeUnits.INCH,
  cover: 1 * ArchetypeUnits.INCH,
  swing: 70,
};

/**
 * A ladder access roof hatch: a curb round an opening in the roof, under a cover hinged on its far side from the ladder.
 *
 * The roof deck is the `XZ` plane, the opening centred on the origin, its length along `X` and its width along `Z`, the ladder rising at its `+Z` side and the hinge along its `-Z` side. The curb's four walls stand on the deck round the opening; the cover lies on them. `hinge` is the cover's hinge, a positive travel lifting the cover's `+Z` edge to the maker's 70 degrees; `push` is the cover's underside, where a climber's hand pushes it open, riding the hinge; `opening` is the clear opening over the curb, passed through upward, its frame on the ladder's edge with its height running across the opening to the hinge.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The hatch.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, which side the ladder and the hinge are on, which way the cover opens and each contact.
 * @evidence contracts/development/implementation.md#principled-implementation The maker's opening, curb height and walls, cover and opening angle, the hinge on the length as the maker's guide places it, and its two hatches' masses.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the mass, then the curb, the cover with its hinge and push, then the opening.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The cover's flange, the curb's capflashing and mounting flange, the lifting springs, the hold-open arm and the latch are not built: no act reads them; the cover is a slab its insulation's thickness.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Five parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createHatch(
  params: createHatch.IParams = {},
  seed?: number | string,
): Archetype<createHatch.Affordance, createHatch.Dimension> {
  const draw: ArchetypeDrawSession<createHatch.Dimension> =
    new ArchetypeDrawSession<createHatch.Dimension>(
      "hatch",
      createHatch.UNITS,
      seed,
      params,
    );
  const d: Record<createHatch.Dimension, number> = draw.dimensions(
    createHatch.BANDS,
  );
  const builder: ArchetypeBuilder<
    createHatch.Affordance,
    createHatch.Dimension
  > = new ArchetypeBuilder({
    material: "steel",
    id: params.id,
    name: "roof hatch",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const { width, length, curb, wall, cover } = HATCH;
  const red: string = "#8c3b22";
  const outerX: number = length + 2 * wall;
  for (const [id, z] of [
    ["curb-ladder", width / 2 + wall / 2],
    ["curb-hinge", -(width / 2 + wall / 2)],
  ] as const)
    builder.box(id, v(outerX, curb, wall), v(0, curb / 2, z), { color: red });
  for (const [id, x] of [
    ["curb-left", length / 2 + wall / 2],
    ["curb-right", -(length / 2 + wall / 2)],
  ] as const)
    builder.box(id, v(wall, curb, width), v(x, curb / 2, 0), { color: red });
  builder.box(
    "cover",
    v(outerX, cover, width + 2 * wall),
    v(0, curb + cover / 2, 0),
    { color: red },
  );
  builder.affordance({
    id: "hinge",
    kind: "hinge",
    frame: ArchetypeFrame.facing(
      v(0, curb, -(width / 2 + wall)),
      v(-1, 0, 0),
      v(0, 0, 1),
    ),
    extent: null,
    travel: HATCH.swing,
    parts: ["cover"],
  });
  builder.affordance({
    id: "push",
    kind: "surface",
    frame: ArchetypeFrame.facing(v(0, curb, 0), v(0, -1, 0), v(1, 0, 0)),
    extent: null,
    width: length,
    depth: width,
    rides: "hinge",
  });
  builder.affordance({
    id: "opening",
    kind: "aperture",
    frame: ArchetypeFrame.facing(
      v(0, curb, width / 2),
      v(0, 0, -1),
      v(1, 0, 0),
    ),
    extent: null,
    width: length,
    height: width,
  });
  return builder.build(d.mass);
}

/**
 * Companion types and bands of {@link createHatch}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance and dimension states what it is; the band its source.
 * @evidence contracts/development/design.md#principled-representation The maker's one size as constants; its two materials' masses as the one band.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The cover a climber pushes open, its hinge and the opening climbed through (#3468 N14).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A size the maker gives once is not widened into an invented band.
 */
export namespace createHatch {
  /**
   * The affordance ids:
   *
   * - `hinge`: the cover's hinge along the `-Z` side; its travel lifts the cover's `+Z` edge.
   * - `push`: the cover's underside over the opening, facing down, riding the hinge.
   * - `opening`: the clear opening over the curb, passed through along `+Y`.
   */
  export type Affordance = "hinge" | "push" | "opening";

  /** The free dimension: `mass`, kilograms. */
  export type Dimension = "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `hatch` when absent. */
    id?: string;
  }

  /** The band of each free dimension: the aluminium hatch's mass to the steel one's. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    mass: ArchetypeBand.of("kg", 50, 83, BILCO),
  };
}
