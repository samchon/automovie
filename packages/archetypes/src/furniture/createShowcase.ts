import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  ArchetypeUnits,
} from "../core";

/** A Full Vision showcase's depth and height, metres, the same for both models: the sheet's "20" deep x 38" high". */
const CASE: Readonly<{ depth: number; height: number }> = {
  depth: 20 * ArchetypeUnits.INCH,
  height: 38 * ArchetypeUnits.INCH,
};

/**
 * A glass showcase counter: a case with a glass top and front, shown to the customer at `+Z` and served from the clerk's side at `-Z`.
 *
 * The case stands on the floor centred on the origin, its length along `X`. It is one of the maker's two showcases read, whole: the model given, or one drawn from the seed. `top` is the glass top, leaned on or set on; `edge` is its customer-side edge, where hands and forearms rest.
 *
 * @param params The model, if the author fixes it.
 * @param seed The seed that draws the model when it is not given; absent, the first.
 * @returns The showcase.
 * @throws {ArchetypeRefusal} For a model the maker's sheet does not list.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, which side is whose, how the model is chosen and each contact.
 * @evidence contracts/development/implementation.md#principled-implementation One read model whole, its length and its mass as the sheet gives them; the depth and height both models share.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pick the model, then the case, then the two contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No showcase between the two read is made; the case is one block, since the glass shelves' heights, the sliding doors' sizes and the side the kick plate is recessed on are not given.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One part.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createShowcase(
  params: createShowcase.IParams = {},
  seed?: number | string,
): Archetype<createShowcase.Affordance, createShowcase.Dimension> {
  const draw: ArchetypeDrawSession<createShowcase.Dimension> =
    new ArchetypeDrawSession<createShowcase.Dimension>(
      "showcase",
      createShowcase.UNITS,
      seed,
    );
  const model: {
    name: createShowcase.Model | undefined;
    figures: Readonly<Partial<Record<createShowcase.Dimension, number>>>;
  } = draw.model<createShowcase.Model>(
    "model",
    params.model,
    createShowcase.MODELS,
  );
  const builder: ArchetypeBuilder<
    createShowcase.Affordance,
    createShowcase.Dimension
  > = new ArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: `glass showcase ${model.name}`,
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const length: number = model.figures.length!;
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
  return builder.build(model.figures.mass!);
}

/**
 * Companion types and constants of {@link createShowcase}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each model, affordance and constant states what it is and its source.
 * @evidence contracts/development/design.md#principled-representation A closed union of the models read, each built whole; no continuous size stands between them.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The top a customer leans on and the edge the hands rest on (#3468 N4).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Doors no sheet sizes are typed as unread, not left out of the record.
 */
export namespace createShowcase {
  /** The models read: Econoco's Full Vision showcases, 48 and 70 in long. */
  export type Model = "PW/SC482" | "PW/SC702";

  /** The dimensions, each its model's: `length`, the case along `X`, metres; `mass`, kilograms. */
  export type Dimension = "length" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    length: "m",
    mass: "kg",
  };

  /** Each showcase's length and mass, the default first: Econoco Showcases and Counters 2025, Full Vision Showcase, "Available in two lengths; 48" long and 70" long", "48" unit weighs 170 lbs. 70" unit weighs 190 lbs." (https://www.econoco.com/media/contentmanager/content/brochure/Showcases_and_Counters_-_2025_1.pdf). */
  export const MODELS: Readonly<
    Record<Model, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    "PW/SC482": {
      length: 48 * ArchetypeUnits.INCH,
      mass: 170 * ArchetypeUnits.POUND,
    },
    "PW/SC702": {
      length: 70 * ArchetypeUnits.INCH,
      mass: 190 * ArchetypeUnits.POUND,
    },
  };

  /**
   * The affordance ids:
   *
   * - `top`: the glass top, facing up.
   * - `edge`: the top's customer-side edge along `X`.
   */
  export type Affordance = "top" | "edge";

  /** The clerk-side sliding doors' width and height, metres: unread, since the sheet names "solid sliding privacy doors" but sizes neither. A read size replaces this `null`, and the doors then become `slider` contacts. */
  export const DOORS: Readonly<{ width: number; height: number }> | null = null;

  /** The parameters: the model, if fixed. */
  export interface IParams {
    /** Which showcase; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `showcase` when absent. */
    id?: string;
  }
}
