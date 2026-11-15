import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The vending machines read. */
const MERCHANT: string =
  "Crane Merchant brochure: Merchant 4 1830 mm high, 813 mm deep, 895 mm wide; Merchant 6 1830 mm high, 813 mm deep, 1180 mm wide (https://vendtrade.co.uk/wp-content/uploads/2024/08/Crane_Merchant_Brochure.pdf)";

/** The pay station read. */
const STRADA: string =
  "Parkeon/Flowbird StradaPAL installation manual, p. 11: body 290 mm wide, 328 mm deep, 1488 mm high, on it a 90 mm spacer and a 226 mm top 475 mm wide and 379 mm deep (https://us.support.flowbird.group/hc/en-us/article_attachments/13368519985939)";

/** A pay station's head on its body, metres: the StradaPAL's 90 mm spacer and its 475 x 226 x 379 mm top. */
const HEAD: Readonly<{
  spacer: number;
  width: number;
  height: number;
  depth: number;
}> = { spacer: 0.09, width: 0.475, height: 0.226, depth: 0.379 };

/**
 * A public machine standing against a wall: a snack vending machine or a parking pay station.
 *
 * The cabinet stands on the floor at the origin with its front toward `+Z`; a pay station's body carries its spacer and its wider head on top. `front` is the front, the face a person stands at, looks through, leans on or rocks; `side` is the `+X` side face, where it is pushed. Its keypad, coin slot and delivery bin are not declared, since no source read places them on the front; keying a selection is a keyed sequence with no motion law yet (#3446). A pay station's screen and payment slot are not declared either: the manual gives their heights, 1336 and 1210 mm to their tops, but not their sizes or places across the front.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The machine.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the machine stands, its contacts, and what is left out for want of a source with its missing law.
 * @evidence contracts/development/implementation.md#principled-implementation One cabinet of the maker's height, depth and widths, the two face frames on its faces.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, the cabinet, then the two contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The glass front and the spirals behind it are not modelled.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One part.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createMachine(
  params: createMachine.IParams,
  seed?: number | string,
): Archetype<createMachine.Affordance, createMachine.Dimension> {
  const kind: createMachine.Kind = ArchetypeDraw.choice(
    "machine",
    "kind",
    params.kind,
    createMachine.KINDS,
  );
  const d: Record<createMachine.Dimension, number> = ArchetypeDraw.dimensions(
    "machine",
    createMachine.BANDS[kind],
    seed,
    params,
    createMachine.BANDS,
  );
  const builder: ArchetypeBuilder<
    createMachine.Affordance,
    createMachine.Dimension
  > = new ArchetypeBuilder({
    archetype: "machine",
    id: params.id,
    name: kind === "payStation" ? "pay station" : "vending machine",
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const { width, height, depth }: Record<createMachine.Dimension, number> = d;
  builder.box("cabinet", v(width, height, depth), v(0, height / 2, 0), {
    color: kind === "payStation" ? "#2b5797" : "#b3202a",
    density: 0.4,
  });
  if (kind === "payStation") {
    builder.box(
      "spacer",
      v(width, HEAD.spacer, depth),
      v(0, height + HEAD.spacer / 2, 0),
      { color: "#2b5797" },
    );
    builder.box(
      "head",
      v(HEAD.width, HEAD.height, HEAD.depth),
      v(0, height + HEAD.spacer + HEAD.height / 2, 0),
      { color: "#2b5797" },
    );
  }
  builder.affordance({
    id: "front",
    kind: "surface",
    frame: ArchetypeFrame.facing(
      v(0, height / 2, depth / 2),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    width,
    depth: height,
  });
  builder.affordance({
    id: "side",
    kind: "surface",
    frame: ArchetypeFrame.facing(
      v(width / 2, height / 2, 0),
      v(1, 0, 0),
      v(0, 0, -1),
    ),
    extent: null,
    width: depth,
    depth: height,
  });
  return builder.build(d.mass);
}

/**
 * Companion types and bands of {@link createMachine}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation A closed union of kinds and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The faces a person stands at and pushes (#3468 N3).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Keys and slots no source places are left out rather than placed by guess.
 */
export namespace createMachine {
  /** The kinds of machine. */
  export type Kind = "vendingMachine" | "payStation";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["vendingMachine", "payStation"];

  /**
   * The affordance ids:
   *
   * - `front`: the front face, `+Z`.
   * - `side`: the `+X` side face.
   */
  export type Affordance = "front" | "side";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`, `height`, `depth`: the cabinet along `X`, `Y` and `Z`; a pay station's body, under its spacer and head.
   * - `mass`: the empty machine, kilograms.
   */
  export type Dimension = "width" | "height" | "depth" | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which machine. */
    kind: Kind;

    /** The model's id, unique in a scene; `machine` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    vendingMachine: {
      width: ArchetypeBand.metres(0.895, 1.18, MERCHANT),
      height: ArchetypeBand.metres(1.83, 1.83, MERCHANT),
      depth: ArchetypeBand.metres(0.813, 0.813, MERCHANT),
      mass: ArchetypeBand.of("kg", 250, 350, ArchetypeBand.TYPICAL_MASS, true),
    },
    payStation: {
      width: ArchetypeBand.metres(0.29, 0.29, `${STRADA}: the body`),
      height: ArchetypeBand.metres(1.488, 1.488, `${STRADA}: the body`),
      depth: ArchetypeBand.metres(0.328, 0.328, `${STRADA}: the body`),
      mass: ArchetypeBand.of("kg", 60, 90, ArchetypeBand.TYPICAL_MASS, true),
    },
  };
}
