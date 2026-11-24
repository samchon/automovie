import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";
import { FIELD_IMPLEMENTS } from "./FIELD_IMPLEMENTS";
import { ForestAxe } from "./ForestAxe";
import { Throwers } from "./Throwers";

/** Broom and mop handles from a maker's listings seen in search results. */
const HANDLES: string =
  "Rubbermaid Commercial broom handle, 60 in by 15/16 in, and mop handles, 54 in by 1 in, listings seen only in search results";

/** D-handle shovels from retailer listings seen in search results. */
const SHOVEL: string =
  "Bully Tools 82510, 41.5 in and 4.5 lb, and Fiskars D-handle shovels, 44.75 to 46 in and 4.85 to 5.6 lb, retailer listings seen only in search results";

/** The seeded recipes originally published as `createLongTool`. */
export namespace LongImplementDraw {
  /** The kinds of tool. */
  export type Kind =
    | "broom"
    | "mop"
    | "shovel"
    | "forestAxe"
    | "fishingRod"
    | "spongeRammer"
    | "worm"
    | "trailHandspike"
    | "sling"
    | "atlatl";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "broom",
    "mop",
    "shovel",
    "forestAxe",
    "fishingRod",
    "spongeRammer",
    "worm",
    "trailHandspike",
    "sling",
    "atlatl",
  ];

  /**
   * A fishing rod's grip length, metres: the 120 mm CCOHS recommends for a tool
   * handle
   * (https://www.ccohs.ca/oshanswers/ergonomics/handtools/tooldesign.html).
   */
  export const ROD_GRIP: number = 0.12;

  /**
   * The width of a broom's or a mop's head along `+X`, metres, which its `face`
   * publishes. An estimate, not read at a source.
   */
  export const HEAD_WIDTH: number = 0.3;

  /**
   * The width of a shovel's blade along `+X`, metres, which its `face`
   * publishes. An estimate, not read at a source.
   */
  export const BLADE_WIDTH: number = 0.22;

  /**
   * The length of the cross bar of a shovel's D grip, metres, the run one hand
   * holds. An estimate, not read at a source.
   */
  export const D_GRIP: number = 0.11;

  /**
   * The affordance ids:
   *
   * - `shaft`: the shaft, a bar both hands hold at sites along it.
   * - `grip`: a shovel's D grip at its top, held from above; a fishing rod's grip
   *   at its butt, taken from `-Z`.
   * - `face`: the working side of the head, facing down onto the floor or the
   *   ground; an axe's edge, facing `+Z`, its `+X` along the edge; a rammer
   *   head's or a handspike's lower end, facing down; a worm's point, `+Y` down
   *   along the tool.
   * - `tip`: a fishing rod's end, or a sponge's, `+Y` along it.
   * - `release`: a sling's release knot, held between the thumb and the first
   *   finger and let go to throw (`Throwers.sling`); its `grip` is the finger
   *   loop.
   * - `pouch`: a sling's pouch a stone sits in, facing up.
   * - `spur`: an atlatl's hook, whose groove takes the dart's butt, facing back
   *   along the shaft (`Throwers.atlatl`); its `grip` is the handle at the
   *   butt.
   * - `rammer`, `sponge`: a sponge and rammer's two heads by name, each facing
   *   out of its end: the rammer head at the lower end (as its `face`) and the
   *   sponge at the upper (as its `tip`), which a gun crew's drill reads.
   */
  export type Affordance =
    | "shaft"
    | "grip"
    | "face"
    | "tip"
    | "release"
    | "pouch"
    | "spur"
    | "upperGrip"
    | "lowerGrip"
    | "sponge"
    | "rammer";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: overall, along `+Y`.
   * - `shaftDiameter`: the shaft the hands wrap; an axe's follows from its
   *   handle's mass instead, and a handspike's from its read tapers.
   * - `edge`: an axe's cutting edge, along `+Y`, which is the head's height.
   * - `headLength`: an axe head from its poll to its edge, along `+Z`.
   * - `headMass`: an axe head's mass, kilograms, its share of the whole placing
   *   the balance.
   * - `pouchLength`, `pouchWidth`: a sling's pouch.
   * - `width`: an atlatl's width at its spur end.
   * - `spurSetback`: an atlatl's spur from its far end; `gripSetback`: where its
   *   handle proper begins from the butt.
   * - `launchSpeed`: a thrower's measured projectile speed, metres per second.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "length"
    | "shaftDiameter"
    | "edge"
    | "headLength"
    | "headMass"
    | "pouchLength"
    | "pouchWidth"
    | "width"
    | "spurSetback"
    | "gripSetback"
    | "launchSpeed"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    shaftDiameter: "m",
    edge: "m",
    headLength: "m",
    headMass: "kg",
    pouchLength: "m",
    pouchWidth: "m",
    width: "m",
    spurSetback: "m",
    gripSetback: "m",
    launchSpeed: "m/s",
    mass: "kg",
  };

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which tool. */
    kind: Kind;

    /** A fishing rod's model; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `longTool` when absent. */
    id?: string;
  }

  /** A model's read figures, by dimension. */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /**
   * The fishing rods read: Daiwa's seven Ninja X two-piece spinning rods, by
   * length and casting weight.
   */
  export type Model =
    | "NJX602MLFS"
    | "NJX702MLFS"
    | "NJX702MHFS"
    | "NJX802MLFS"
    | "NJX802MHFS"
    | "NJX802HFS"
    | "NJX902MLFS";

  /**
   * Each kind's models whole, the default first, length and mass: 183 cm and
   * 106 g, 213 cm and 131 g, 213 cm and 133 g, 244 cm and 141, 157 and 165 g,
   * and 274 cm and 178 g (Daiwa Ninja X Spin specifications,
   * https://www.daiwa.com/scandinavia/product/n753a5g).
   */
  export const MODELS: Readonly<
    Partial<Record<Kind, Readonly<Record<Model, Figures>>>>
  > = {
    fishingRod: {
      NJX602MLFS: { length: 1.83, mass: 0.106 },
      NJX702MLFS: { length: 2.13, mass: 0.131 },
      NJX702MHFS: { length: 2.13, mass: 0.133 },
      NJX802MLFS: { length: 2.44, mass: 0.141 },
      NJX802MHFS: { length: 2.44, mass: 0.157 },
      NJX802HFS: { length: 2.44, mass: 0.165 },
      NJX902MLFS: { length: 2.74, mass: 0.178 },
    },
  };

  /**
   * The band of each free dimension, by kind; an axe and a handspike have no
   * drawn shaft diameter, a broom, a mop, a shovel, a fishing rod and a field
   * gun's implements no head of their own sizes.
   */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    sling: Throwers.BANDS.sling,
    atlatl: Throwers.BANDS.atlatl,
    spongeRammer: FIELD_IMPLEMENTS.BANDS.spongeRammer,
    worm: FIELD_IMPLEMENTS.BANDS.worm,
    trailHandspike: FIELD_IMPLEMENTS.BANDS.trailHandspike,
    forestAxe: ForestAxe.BANDS,
    fishingRod: {
      shaftDiameter: AutoMovieArchetypeBand.metres(
        0.032,
        0.038,
        "no rod grip diameter was found; the lower end of the 32 to 51 mm power grip band of NIOSH 2004-164 (https://www.cdc.gov/niosh/docs/2004-164/pdfs/2004-164.pdf), applied to a rod's grip",
        true,
      ),
    },
    broom: {
      length: AutoMovieArchetypeBand.metres(
        60 * AutoMovieArchetypeUnits.INCH,
        60 * AutoMovieArchetypeUnits.INCH + 0.08,
        `${HANDLES}; the head adds 8 cm`,
        true,
      ),
      shaftDiameter: AutoMovieArchetypeBand.metres(
        (15 / 16) * AutoMovieArchetypeUnits.INCH,
        AutoMovieArchetypeUnits.INCH,
        HANDLES,
        true,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.5,
        0.9,
        AutoMovieArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
    mop: {
      length: AutoMovieArchetypeBand.metres(
        54 * AutoMovieArchetypeUnits.INCH,
        54 * AutoMovieArchetypeUnits.INCH + 0.03,
        `${HANDLES}; the head adds 3 cm`,
        true,
      ),
      shaftDiameter: AutoMovieArchetypeBand.metres(
        (15 / 16) * AutoMovieArchetypeUnits.INCH,
        AutoMovieArchetypeUnits.INCH,
        HANDLES,
        true,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.5,
        0.9,
        AutoMovieArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
    shovel: {
      length: AutoMovieArchetypeBand.metres(
        41.5 * AutoMovieArchetypeUnits.INCH,
        46 * AutoMovieArchetypeUnits.INCH,
        SHOVEL,
        true,
      ),
      shaftDiameter: AutoMovieArchetypeBand.metres(
        0.032,
        0.038,
        "no shovel shaft diameter was found; the lower end of the 32 to 51 mm power grip band of NIOSH 2004-164 (https://www.cdc.gov/niosh/docs/2004-164/pdfs/2004-164.pdf)",
        true,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        4.5 * AutoMovieArchetypeUnits.POUND,
        5.6 * AutoMovieArchetypeUnits.POUND,
        SHOVEL,
        true,
      ),
    },
  };

  /** What {@link prepare} prepares for its caller. */
  export interface IPrepareResult<Id extends Affordance> {
    /** The prepared `builder` this call returns. */
    builder: AutoMovieArchetypeBuilder<Id, Dimension>;

    /** The prepared `d` this call returns. */
    d: Partial<Record<Dimension, number>>;
  }

  /**
   * Prepare an empty builder and the previously recorded longTool dimensions.
   *
   * @param params Fixed dimensions in metres or kilograms, an optional scene
   *   ID, and a model where the saved recipe has one.
   * @param seed The seed that draws the saved dimensions and model, or
   *   undefined for the original defaults.
   * @param kind The saved kind whose recipe is used.
   * @returns The builder and dimensions the named producer reads.
   * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter
   *   lies outside its admitted recipe.
   */
  export function prepare<Id extends Affordance>(
    kind: Kind,
    params: Omit<IParams, "kind">,
    seed?: number,
  ): IPrepareResult<Id> {
    const draw: AutoMovieArchetypeDrawSession<Dimension> =
      new AutoMovieArchetypeDrawSession<Dimension>(
        "longTool",
        UNITS,
        seed,
        params,
      );
    const drawn: Partial<Record<Dimension, number>> = draw.dimensions(
      BANDS[kind],
      BANDS,
    );
    // A fishing rod is one of Daiwa's Ninja X spinning rods whole.
    const model: {
      name: Model | undefined;
      figures: Figures;
    } = draw.model<Model>("model", params.model, MODELS[kind]);
    const d: Partial<Record<Dimension, number>> = {
      ...drawn,
      ...model.figures,
    };
    const builder: AutoMovieArchetypeBuilder<Id, Dimension> =
      new AutoMovieArchetypeBuilder({
        material: "composite",
        id: params.id,
        name: kind,
        draw,
      });
    return { builder, d };
  }

  /** The contact ids {@link groundTool} builds or reads. */
  export type GroundToolContact = "face" | "shaft" | "grip";

  /**
   * The contacts `groundTool` itself builds, which a tool's own contacts join:
   * one grip, or an upper and a lower grip for a two-handed push.
   */
  export type GroundToolBuilt = "face" | "shaft";

  /** A ground implement's head block. */
  export interface IGroundHead {
    /** Across the head, metres. */
    width: number;

    /** Up the head, metres. */
    height: number;

    /** Front to back, metres. */
    depth: number;

    /** The finish colour. */
    color: string;

    /** The density relative to the shaft. */
    density: number;
  }

  /** A ground implement's shaft. */
  export interface IGroundShaft {
    /** The shaft radius, metres. */
    radius: number;

    /** The shaft top above the bottom face, metres. */
    top: number;
  }

  /**
   * Build the head and two-hand shaft of a ground-contact implement.
   *
   * @param builder The implement under construction.
   * @param head The head dimensions in metres, its finish and its relative
   *   density.
   * @param shaft The shaft radius and end height, in metres.
   */
  export function groundTool<Contact extends string>(
    builder: AutoMovieArchetypeBuilder<Contact | GroundToolBuilt, Dimension>,
    head: IGroundHead,
    shaft: IGroundShaft,
  ): void {
    const top: number = shaft.top;
    const radius: number = shaft.radius;
    const height: number = head.height;
    builder.box(
      "head",
      Vector3.create(head.width, height, head.depth),
      Vector3.create(0, height / 2, 0),
      { color: head.color, density: head.density },
    );
    builder.affordance({
      id: "face",
      kind: "surface",
      direction: "normal",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.create(0, 0, 0),
        Vector3.create(0, -1, 0),
        Vector3.create(1, 0, 0),
      ),
      extent: null,
      width: head.width,
    });
    builder.rod(
      "shaft",
      radius,
      Vector3.create(0, height, 0),
      Vector3.create(0, top, 0),
      { color: "#b98d5b" },
    );
    builder.affordance({
      id: "shaft",
      kind: "bar",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.create(0, (height + top) / 2, 0),
        Vector3.create(0, 0, -1),
        Vector3.create(0, 1, 0),
      ),
      extent: null,
      grip: "two-hand",
      aperture: 2 * radius,
      length: top - height,
    });
  }
}
