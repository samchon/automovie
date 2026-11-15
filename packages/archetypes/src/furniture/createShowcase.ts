import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";

/** The showcases read. */
const ECONOCO: string =
  'Econoco Showcases and Counters 2025, Full Vision Showcase PW/SC482 and PW/SC702: "Available in two lengths; 48" long and 70" long", "20" deep x 38" high", "48" unit weighs 170 lbs. 70" unit weighs 190 lbs.", tempered glass front, top and shelves, solid sliding doors on the clerk side (https://www.econoco.com/media/contentmanager/content/brochure/Showcases_and_Counters_-_2025_1.pdf)';

/** One showcase read: its length, metres, and its mass, kilograms. */
interface IModel {
  length: number;
  mass: number;
}

/** The two showcases read, the shorter first. */
const MODELS: readonly [IModel, IModel] = [
  { length: 48 * ArchetypeUnits.INCH, mass: 170 * ArchetypeUnits.POUND },
  { length: 70 * ArchetypeUnits.INCH, mass: 190 * ArchetypeUnits.POUND },
];

/** A Full Vision showcase's depth and height, metres: the sheet's 20 and 38 in. */
const CASE: Readonly<{ depth: number; height: number }> = {
  depth: 20 * ArchetypeUnits.INCH,
  height: 38 * ArchetypeUnits.INCH,
};

/**
 * A glass showcase counter: a case with a glass top and front, shown to the customer at `+Z` and served from the clerk's side at `-Z`.
 *
 * The case stands on the floor centred on the origin, its length along `X`. Its length and mass lie between the maker's two showcases read, by the drawn `size`. `top` is the glass top, leaned on or set on; `edge` is its customer-side edge, where hands and forearms rest.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The showcase.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, which side is whose, how the size is drawn and each contact.
 * @evidence contracts/development/implementation.md#principled-implementation The maker's depth and height; its two lengths and their masses interpolated by one drawn share.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the share, then the case, then the two contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The case is one block: the glass shelves' heights, the sliding doors' sizes and the side the kick plate is recessed on are not given, so neither is built nor declared.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One part.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createShowcase(
  params: createShowcase.IParams = {},
  seed?: number | string,
): Archetype<createShowcase.Affordance, createShowcase.Dimension> {
  const d: Record<createShowcase.Dimension, number> = ArchetypeDraw.dimensions(
    "showcase",
    createShowcase.BANDS,
    seed,
    params,
  );
  const [short, long]: readonly [IModel, IModel] = MODELS;
  const at = (key: keyof IModel): number =>
    short[key] + (long[key] - short[key]) * d.size;
  const builder: ArchetypeBuilder<
    createShowcase.Affordance,
    createShowcase.Dimension
  > = new ArchetypeBuilder({
    archetype: "showcase",
    id: params.id,
    name: "glass showcase",
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const length: number = at("length");
  const { depth, height } = CASE;
  builder.box("case", v(length, height, depth), v(0, height / 2, 0), {
    color: "#d9e4e8",
  });
  builder.affordance({
    id: "top",
    kind: "surface",
    frame: ArchetypeFrame.upright(v(0, height, 0)),
    extent: null,
    width: length,
    depth,
  });
  builder.affordance({
    id: "edge",
    kind: "ledge",
    frame: ArchetypeFrame.facing(
      v(0, height, depth / 2),
      v(0, 1, 0),
      v(1, 0, 0),
    ),
    extent: null,
    length,
  });
  return builder.build(at("mass"));
}

/**
 * Companion types and bands of {@link createShowcase}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance and dimension states what it is; the band its source.
 * @evidence contracts/development/design.md#principled-representation One drawn share between two read showcases, so the length and the mass stay one showcase's.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The top a customer leans on and the edge the hands rest on (#3468 N4).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shelves and doors no sheet sizes are left out, not invented.
 */
export namespace createShowcase {
  /**
   * The affordance ids:
   *
   * - `top`: the glass top, facing up.
   * - `edge`: the top's customer-side edge along `X`.
   */
  export type Affordance = "top" | "edge";

  /** The clerk-side sliding doors' width and height, metres: unread, since the sheet names "solid sliding privacy doors" but sizes neither. A read size replaces this `null`, and the doors then become `slider` contacts. */
  export const DOORS: Readonly<{ width: number; height: number }> | null = null;

  /**
   * The free dimension: `size`, where the showcase lies between the two read, 0 the 48 in and 1 the 70 in.
   */
  export type Dimension = "size";

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `showcase` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    size: ArchetypeBand.of("", 0, 1, ECONOCO),
  };
}
