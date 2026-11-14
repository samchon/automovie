import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** A provisional mass band in kilograms. */
const kg = (minimum: number, maximum: number): IArchetypeBand =>
  ArchetypeBand.of("kg", minimum, maximum, ArchetypeBand.TYPICAL_MASS, true);

/** A facial tissue sheet, from distributor listings. */
const TISSUE: string =
  "Kleenex facial tissue sheet, 21.3 x 20.3 cm, Kimberly-Clark Professional distributor listings seen only in search results";

/** Pocket combs, from a maker's pages seen in search results. */
const COMB: string =
  "Kent Brushes pocket combs, 112 to 154 mm long and 25 to 27 mm wide, product pages seen only in search results";

/** Toothbrush sizes, from a listing and two patents. */
const BRUSH: string =
  "Curaprox CS 5460, 18 cm (listing seen only in search results); Canadian patent 3058910, about 194 to 197 mm overall; US patent 6353959, handle 1.375 in round";

/** A tube maker's data sheet. */
const TUBE: string =
  "Alltub laminate tubes data sheet, diameters 19 to 50 mm and lengths 75 to 190 mm (https://www.alltub.com/wp-content/uploads/2024/04/ft-tubes-lamines-en.pdf)";

/** Cartridge razors, read. */
const RAZOR: string =
  "Edwin Jagger Mach3 razor, 129 mm overall and 87 g (https://www.edwinjagger.co.uk/edwin-jagger-grey-chrome-mach-3-razor.html), and the Gillette Mach3, 5.4 in long and 35 g (https://www.toolsofmen.com/?p=46812)";

/** Lipstick cases, read. */
const LIPSTICK: string =
  "Quadpack magnetic lipstick case, 21 mm across and 74 mm high (https://americas.quadpack.com/?p=16738), and Ellemental's case, 75 mm high for a 12.1 mm bullet (https://www.ellemental.com/lipstick-tube)";

/** The readable name of each kind. */
const NAMES: Readonly<Record<createCareItem.Kind, string>> = {
  tissue: "tissue",
  comb: "comb",
  toothbrush: "toothbrush",
  tube: "cream tube",
  razor: "razor",
  lipstick: "lipstick",
};

/**
 * A personal care item: a tissue, a comb, a toothbrush, a cream tube, a razor or a lipstick.
 *
 * Each lies at the origin with its long side along `+Z`, its working end at `+Z`: a comb's teeth point down along its length, a toothbrush's bristles and a razor's blades face up at its far end, a tube's cap is at its far end and a lipstick's bullet points out of its far end. A tissue lies flat.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The item.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how each item lies and where its working end is.
 * @evidence contracts/development/implementation.md#principled-implementation One or two dimensioned primitives per item; each `grip` lies on the axis of the part the hand holds, with that part's thickness as its `aperture`.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per kind.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Teeth and bristles are one block each; a tube's cap is a knob without a thread.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most two parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createCareItem(
  params: createCareItem.IParams,
  seed?: number | string,
): Archetype<createCareItem.Affordance, createCareItem.Dimension> {
  const kind: createCareItem.Kind = ArchetypeDraw.choice(
    "careItem",
    "kind",
    params.kind,
    createCareItem.KINDS,
  );
  const d: Partial<Record<createCareItem.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "careItem",
      createCareItem.BANDS[kind],
      seed,
      params,
      createCareItem.BANDS,
    );
  const builder: ArchetypeBuilder<
    createCareItem.Affordance,
    createCareItem.Dimension
  > = new ArchetypeBuilder({
    archetype: "careItem",
    id: params.id,
    name: NAMES[kind],
    dimensions: d,
  });
  const length: number = d.length!;
  const width: number = d.width!;
  const thick: number = d.thickness ?? width;

  if (kind === "tissue") {
    builder.box(
      "sheet",
      Vector3.create(width, thick, length),
      Vector3.create(0, thick / 2, 0),
      { color: "#f6f4f0" },
    );
    builder.affordance({
      id: "grip",
      kind: "handle",
      frame: ArchetypeFrame.upright(Vector3.create(0, thick / 2, 0)),
      extent: null,
      grip: "precision",
      aperture: thick,
    });
    builder.affordance({
      id: "face",
      kind: "surface",
      frame: ArchetypeFrame.upright(Vector3.create(0, thick, 0)),
      extent: null,
      width,
      depth: length,
    });
    return builder.build(d.mass!);
  }

  if (kind === "comb") {
    // A spine with a block of teeth under it; held sideways anywhere along the spine.
    builder.box(
      "spine",
      Vector3.create(thick, width * 0.4, length),
      Vector3.create(0, width * 0.8, length / 2),
      { color: "#3a3a3a" },
    );
    builder.box(
      "teeth",
      Vector3.create(thick * 0.6, width * 0.6, length),
      Vector3.create(0, width * 0.3, length / 2),
      { color: "#4a4a4a" },
    );
    builder.affordance({
      id: "grip",
      kind: "handle",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, width * 0.8, length / 2),
        Vector3.create(1, 0, 0),
        Vector3.create(0, 0, 1),
      ),
      extent: null,
      grip: "lateral",
      aperture: thick,
      length,
    });
    builder.affordance({
      id: "face",
      kind: "ledge",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, 0, length / 2),
        Vector3.create(0, -1, 0),
        Vector3.create(0, 0, 1),
      ),
      extent: null,
      length,
    });
    return builder.build(d.mass!);
  }

  if (kind === "toothbrush" || kind === "razor") {
    // A handle with a head at its far end, its working face up: bristles, or a razor's cartridge of blades.
    const head: number =
      kind === "razor" ? createCareItem.CARTRIDGE.depth : 0.028;
    const across: number =
      kind === "razor" ? createCareItem.CARTRIDGE.width : width;
    builder.rod(
      "handle",
      width / 2,
      Vector3.create(0, width / 2, 0),
      Vector3.create(0, width / 2, length - head),
      { color: kind === "razor" ? "#2c2f33" : "#3f8fc4" },
    );
    builder.box(
      "head",
      Vector3.create(across, width * 1.6, head),
      Vector3.create(0, width * 0.8, length - head / 2),
      { color: kind === "razor" ? "#b9bcc0" : "#eef2f5" },
    );
    builder.affordance({
      id: "grip",
      kind: "handle",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, width / 2, (length - head) / 2),
        Vector3.create(0, 1, 0),
        Vector3.create(0, 0, 1),
      ),
      extent: null,
      grip: "power",
      aperture: width,
      length: length - head,
    });
    builder.affordance({
      id: "face",
      kind: "surface",
      frame: ArchetypeFrame.upright(
        Vector3.create(0, width * 1.6, length - head / 2),
      ),
      extent: null,
      width: across,
      depth: head,
    });
    return builder.build(d.mass!);
  }

  if (kind === "lipstick") {
    // A case held in the fingers, its bullet out of its far end.
    builder.rod(
      "case",
      width / 2,
      Vector3.create(0, width / 2, 0),
      Vector3.create(0, width / 2, length - createCareItem.BULLET),
      { color: "#1d1f22" },
    );
    builder.rod(
      "bullet",
      width * 0.3,
      Vector3.create(0, width / 2, length - createCareItem.BULLET),
      Vector3.create(0, width / 2, length),
      { color: "#b22234" },
    );
    builder.affordance({
      id: "grip",
      kind: "handle",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, width / 2, (length - createCareItem.BULLET) / 2),
        Vector3.create(0, 1, 0),
        Vector3.create(0, 0, 1),
      ),
      extent: null,
      grip: "precision",
      aperture: width,
      length: length - createCareItem.BULLET,
    });
    builder.affordance({
      id: "face",
      kind: "surface",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, width / 2, length),
        Vector3.create(0, 0, 1),
        Vector3.create(1, 0, 0),
      ),
      extent: null,
    });
    return builder.build(d.mass!);
  }

  // A tube: a body and a cap at its far end.
  const cap: number = 0.015;
  builder.rod(
    "body",
    width / 2,
    Vector3.create(0, width / 2, 0),
    Vector3.create(0, width / 2, length - cap),
    { color: "#e9e2d0" },
  );
  builder.rod(
    "cap",
    width * 0.3,
    Vector3.create(0, width / 2, length - cap),
    Vector3.create(0, width / 2, length),
    { color: "#b9b2a0" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, width / 2, (length - cap) / 2),
      Vector3.create(0, 1, 0),
      Vector3.create(0, 0, 1),
    ),
    extent: null,
    grip: "power",
    aperture: width,
    length: length - cap,
  });
  builder.affordance({
    id: "cap",
    kind: "knob",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, width / 2, length - cap / 2),
      Vector3.create(0, 0, 1),
    ),
    extent: null,
    grip: "precision",
    aperture: width * 0.6,
    travel: 720,
    parts: ["cap"],
  });
  builder.affordance({
    id: "face",
    kind: "socket",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, width / 2, length),
      Vector3.create(0, 0, 1),
    ),
    extent: null,
  });
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createCareItem}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The sizes a hold reads (#3369) and the one working face each item brings to the body.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `grip` and `face` name the same role on every kind.
 */
export namespace createCareItem {
  /** The kinds. */
  export type Kind =
    | "tissue"
    | "comb"
    | "toothbrush"
    | "tube"
    | "razor"
    | "lipstick";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "tissue",
    "comb",
    "toothbrush",
    "tube",
    "razor",
    "lipstick",
  ];

  /** A razor's cartridge across and from front to back, metres: an estimate; the razors' pages read do not give it. */
  export const CARTRIDGE: Readonly<{ width: number; depth: number }> = {
    width: 0.04,
    depth: 0.015,
  };

  /** A lipstick's bullet out of its case, metres: an estimate; the cases read give its 12.1 mm across but not how far it stands out. */
  export const BULLET: number = 0.015;

  /**
   * The affordance ids:
   *
   * - `grip`: the hold: a tissue pinched at its middle, a comb's spine held sideways, a toothbrush's or a razor's handle, a tube's body, a lipstick's case.
   * - `face`: the working end: a tissue's upper side, the line of a comb's teeth facing down, a toothbrush's bristles and a razor's blades facing up, a tube's mouth facing along it, a lipstick's bullet's tip.
   * - `cap`: a tube's cap, a knob turned two turns to open (the turn is an estimate).
   */
  export type Affordance = "grip" | "face" | "cap";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: along `+Z`.
   * - `width`: a tissue's or a comb's width, a toothbrush's or a razor's handle's, a tube's or a lipstick's diameter.
   * - `thickness`: a tissue's or a comb's thickness.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "width" | "thickness" | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which item. */
    kind: Kind;

    /** The model's id, unique in a scene; `careItem` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    tissue: {
      length: ArchetypeBand.metres(0.198, 0.21, TISSUE, true),
      width: ArchetypeBand.metres(0.203, 0.213, TISSUE, true),
      thickness: ArchetypeBand.metres(
        0.0005,
        0.0005,
        "a soft two-ply sheet, not read at a source",
        true,
      ),
      mass: kg(0.001, 0.002),
    },
    comb: {
      length: ArchetypeBand.metres(0.112, 0.154, COMB, true),
      width: ArchetypeBand.metres(0.025, 0.027, COMB, true),
      thickness: ArchetypeBand.metres(
        0.003,
        0.004,
        "comb spine thickness, not read at a source",
        true,
      ),
      mass: kg(0.01, 0.02),
    },
    toothbrush: {
      length: ArchetypeBand.metres(0.18, 0.197, BRUSH, true),
      width: ArchetypeBand.metres(0.011, 0.011, BRUSH, true),
      mass: kg(0.015, 0.025),
    },
    tube: {
      length: ArchetypeBand.metres(0.075, 0.19, TUBE),
      width: ArchetypeBand.metres(0.019, 0.05, TUBE),
      mass: kg(0.02, 0.3),
    },
    razor: {
      length: ArchetypeBand.metres(0.129, 5.4 * 0.0254, RAZOR),
      width: ArchetypeBand.metres(
        0.012,
        0.016,
        "the handle's diameter; the razors' pages read do not give it",
        true,
      ),
      mass: ArchetypeBand.of("kg", 0.035, 0.087, RAZOR),
    },
    lipstick: {
      length: ArchetypeBand.metres(0.074, 0.075, LIPSTICK),
      width: ArchetypeBand.metres(0.021, 0.021, LIPSTICK),
      mass: kg(0.01, 0.03),
    },
  };
}
