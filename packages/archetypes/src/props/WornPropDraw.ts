import {
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";

/** A wristwatch, read. */
const CASIO: string =
  "Casio F-91W, a 38.2 x 35.2 x 8.5 mm case, 21 g (https://halifaxwatch.com/products/casio-vintage-f91)";

/** Fedoras, read. */
const STETSON: string =
  "Stetson fedoras: brims of 2 in (Selby) to 4 1/8 in (Sol), crowns of 3 3/4 to 4 1/2 in, sizes for heads 20 1/4 to 22 1/4 in round (https://www.villagehatshop.com/products/selby-fur-felt-fedora-hat, https://www.villagehatshop.com/products/sol-wide-brim-wool-felt-fedora-hat, https://www.dapperfam.com/collections/hats/products/stetson-midtown-wool-pinch-front-wide-brim-fedora)";

/** Spectacles, read. */
const RAYBAN: string =
  "Ray-Ban RB2140 Original Wayfarer 50-22-150: 50 mm lenses 41 mm high, a 22 mm bridge, 150 mm temples (https://www.lenscrafters.com/lc-us/ray-ban/805289126577)";

/** What no source read gives. */
const UNREAD: string = "the makers' pages read do not give it";

/**
 * The seeded recipes originally published as `createWearable`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The seeded recipes originally published as `createWearable`.
 * @evidence contracts/development/design.md#principled-representation The original dimension order, units, bands and model choices define the saved seed streams.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The named producers read their recipes here and own their geometry and contacts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Makes no alternate draws for a named producer.
 */
export namespace WornPropDraw {
  /**
   * The kinds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The saved recipe's closed selector.
   * @evidence contracts/development/design.md#principled-representation One literal identifies each saved prop recipe, including stored selections.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The dispatcher and seeded preparation consume the same names.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No second producer or geometry is drawn for a saved alias.
   */
  export type Kind = "watch" | "hat" | "spectacles";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["watch", "hat", "spectacles"];

  /** A strap's, a brim's and a spectacle frame's thickness, metres: an estimate. */
  export const THIN: number = 0.004;

  /** A watch strap's width, metres: an estimate. */
  export const STRAP: number = 0.02;

  /**
   * The affordance ids:
   *
   * - `hold`: where the fingers take it.
   * - `wear`: the socket the wrist, the head or the nose goes into, `+Y` toward it.
   * - `face`: a watch's dial, facing up.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The saved contact identifiers for these props.
   * @evidence contracts/development/design.md#principled-representation A closed union covers the contacts built by every shape in this family.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The compatibility surface keeps existing contact names while named producers declare the contacts they own.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The saved union does not manufacture contact frames absent from a shape.
   */
  export type Affordance = "hold" | "wear" | "face";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`: a watch case's across, a brim's diameter, the spectacles' front across.
   * - `depth`: a strap's length, a crown's diameter, a temple's length.
   * - `height`: a case's thickness, a hat's height, the front's height.
   * - `mass`: kilograms.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The saved axis names for drawn dimensions.
   * @evidence contracts/development/design.md#principled-representation Each member records a length, mass, or documented quantity in the associated unit table.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Seeded preparation records values under the names that existing callers inspect.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The variant and model tables determine which values can be overridden.
   */
  export type Dimension = "width" | "depth" | "height" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    width: "m",
    depth: "m",
    height: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside its band.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The input to the prop recipe.
   * @evidence contracts/development/design.md#principled-representation The optional identifier and dimensions use the existing declared units and per-variant bounds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The input carries the selection fields and has no separate copied geometry.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Runtime admission rejects refused values and dependent overrides.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which thing. */
    kind: Kind;

    /** The model's id, unique in a scene; `wearable` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    watch: {
      width: ArchetypeBand.metres(0.0352, 0.0382, CASIO),
      depth: ArchetypeBand.metres(
        0.2,
        0.24,
        `the strap's length: ${UNREAD}`,
        true,
      ),
      height: ArchetypeBand.metres(0.0085, 0.0085, CASIO),
      mass: ArchetypeBand.of("kg", 0.021, 0.021, CASIO),
    },
    hat: {
      width: ArchetypeBand.metres(
        (20.25 * ArchetypeUnits.INCH) / Math.PI + 2 * 2 * ArchetypeUnits.INCH,
        (22.25 * ArchetypeUnits.INCH) / Math.PI +
          2 * 4.125 * ArchetypeUnits.INCH,
        `${STETSON}: a head's round as a circle's across and a brim on either side`,
      ),
      depth: ArchetypeBand.metres(
        (20.25 * ArchetypeUnits.INCH) / Math.PI,
        (22.25 * ArchetypeUnits.INCH) / Math.PI,
        `${STETSON}: the head's round as a circle's across`,
      ),
      height: ArchetypeBand.metres(
        3.75 * ArchetypeUnits.INCH,
        4.5 * ArchetypeUnits.INCH,
        STETSON,
      ),
      mass: ArchetypeBand.of(
        "kg",
        0.08,
        0.2,
        `the hat's weight: ${UNREAD}`,
        true,
      ),
    },
    spectacles: {
      width: ArchetypeBand.metres(
        0.122,
        0.122,
        `${RAYBAN}: two lenses and the bridge; the rims' width outside them ${UNREAD}`,
      ),
      depth: ArchetypeBand.metres(0.15, 0.15, RAYBAN),
      height: ArchetypeBand.metres(0.041, 0.041, RAYBAN),
      mass: ArchetypeBand.of(
        "kg",
        0.02,
        0.04,
        `the frame's weight: ${UNREAD}`,
        true,
      ),
    },
  };

  /**
   * What {@link prepare} prepares for its caller.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the builder and the drawn dimensions prepare returns, in the family's recorded units.
   * @evidence contracts/development/design.md#principled-representation The builder typed by the caller's contact ids and the draw's own dimension record.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the members the named producers read after prepare.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No member is optional where every call sets it.
   */
  export interface IPrepareResult<Id extends Affordance> {
    /** The prepared `builder` this call returns. */
    builder: ArchetypeBuilder<Id, Dimension>;

    /** The prepared `d` this call returns. */
    d: Record<Dimension, number>;
  }

  /**
   * Prepare an empty builder and the previously recorded wearable dimensions.
   *
   * @param params Fixed dimensions in metres or kilograms, an optional scene ID, and a model where the saved recipe has one.
   * @param seed The seed that draws the saved dimensions and model, or undefined for the original defaults.
   * @param kind The saved kind whose recipe is used.
   * @returns The builder and dimensions the named producer reads.
   * @throws {ArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Prepare an empty builder and the previously recorded wearable dimensions.
   * @evidence contracts/development/implementation.md#principled-implementation The `wearable` draw session uses the original seeds, model table, and bands in their original order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The named producer chooses a kind. This helper handles admission, provenance, and identity before geometry is added.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The session rejects inadmissible overrides or model names and records the values that a producer consumes.
   * @evidence contracts/development/implementation.md#efficient-algorithms Draws a bounded list of dimensions and prepares one builder.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The named producers and the saved dispatcher share their exact recipe preparation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
   */
  export function prepare<Id extends Affordance>(
    kind: Kind,
    params: Omit<IParams, "kind">,
    seed?: number | string,
  ): IPrepareResult<Id> {
    const draw: ArchetypeDrawSession<Dimension> =
      new ArchetypeDrawSession<Dimension>("wearable", UNITS, seed, params);
    const d: Record<Dimension, number> = draw.dimensions(BANDS[kind]);
    const builder: ArchetypeBuilder<Id, Dimension> = new ArchetypeBuilder({
      material: "composite",
      id: params.id,
      name: kind,
      draw,
    });
    return { builder, d };
  }
}
