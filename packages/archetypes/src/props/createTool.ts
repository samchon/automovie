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

/** The handle diameters hands rated most comfortable in a power grip. */
const POWER: string =
  "Kong and Lowe 2005, Int J Ind Ergon 35:495, handles of 30 to 40 mm rated most comfortable (https://stacks.cdc.gov/view/cdc/197408), inside the 30 to 50 mm power grip range of CCOHS (https://www.ccohs.ca/oshanswers/ergonomics/handtools/tooldesign.html); applied to this tool's handle, whose own diameter no maker states";

/** A claw hammer, from a maker's page seen in search results. */
const HAMMER: string =
  "Estwing E3-16C claw hammer, 13 in long with a 16 oz head, product page seen only in search results";

/** Hand saws, from makers' listings seen in search results. */
const SAW: string =
  "Stanley 20 in and Bahco 22 in hand saws, blades 500 to 550 mm, listings seen only in search results";

/** A screwdriver read at its maker's catalogue. */
const SCREWDRIVER: string =
  "Klein Tools 603-4, overall 8.25 in, shank 4 in, 4 oz (https://www.kleintools.com/catalog/fixed-blade-screwdrivers/2-phillips-screwdriver-4-inch-round-shank)";

/** Spoons read at a maker's pages. */
const SPOON: string =
  "IKEA DRAGON dessert spoon 16 cm and spoon 17 cm (https://www.ikea.com/fi/en/p/dragon-dessert-spoon-stainless-steel-50090381, https://www.ikea.com/ie/en/p/dragon-spoon-stainless-steel-30091763/); the teaspoon's 13 cm seen only in search results";

/** A table fork, read. */
const FORK: string =
  "IKEA DRAGON fork, stainless steel, 19 cm, sold in fours at 0.18 kg the pack (https://www.ikea.com/de/en/p/dragon-fork-stainless-steel-00515527/)";

/**
 * A one-hand tool: a claw hammer, a hand saw, a screwdriver, a spoon or a fork.
 *
 * The tool stands along `+Y` from the butt of its handle at the origin to its working end, whose face is the `face` affordance: a hammer's striking face toward `+Z`, a saw's line of teeth toward `+Z`, a screwdriver's tip, a spoon's bowl and a fork's tines. The hand takes the `grip` from the `-Z` side with the thumb toward the working end, except a saw's: its grip runs across its heel square to the line from the grip to the tooth line's middle, the saw's hang (Disstonian Institute glossary: "The imaginary line that runs parallel to the hand grip should have a line running perpendicular to it, running through the mid-point of the tooth line", https://disstonianinstitute.com/glossary.html), and the hand takes it from the blade's `+X` side with the thumb toward the spine, the teeth below the fist.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The tool.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the tool stands, where its working end is and how it is held.
 * @evidence contracts/development/implementation.md#principled-implementation A handle rod and one working part per tool; a hammer's steel head is eleven times as dense as its handle (steel at 7850 against hickory at about 700 kg per cubic metre, handbook values), which is what puts the balance near the head.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, build the handle and its grip, then the kind's working part and face.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A claw, teeth and a tip are not modelled; the working face is a frame.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createTool(
  params: createTool.IParams,
  seed?: number | string,
): Archetype<createTool.Affordance, createTool.Dimension> {
  const kind: createTool.Kind = ArchetypeDraw.choice(
    "tool",
    "kind",
    params.kind,
    createTool.KINDS,
  );
  const d: Partial<Record<createTool.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "tool",
      createTool.BANDS[kind],
      seed,
      params,
      createTool.BANDS,
    );
  const length: number = d.length!;
  const radius: number = d.gripDiameter! / 2;
  const builder: ArchetypeBuilder<createTool.Affordance, createTool.Dimension> =
    new ArchetypeBuilder({
      archetype: "tool",
      id: params.id,
      name: kind,
      dimensions: d,
    });

  // The handle and its grip: how much of the length is handle depends on the tool.
  const handle: number =
    kind === "hammer"
      ? length - 0.03
      : kind === "saw"
        ? length - d.blade!
        : kind === "screwdriver"
          ? length - d.blade!
          : kind === "spoon"
            ? length - 2 * createTool.BOWL
            : length - createTool.TINES.length;
  if (kind === "saw") {
    // A saw's grip runs across its heel, square to the line from the grip to
    // the tooth line's middle (the hang), so the fist thrusts along that line.
    const centre: IAutoMovieVector3 = Vector3.create(0, handle / 2, 0);
    const toTeeth: IAutoMovieVector3 = Vector3.subtract(
      Vector3.create(0, handle + d.blade! / 2, createTool.BLADE_DEPTH / 2),
      centre,
    );
    const across: IAutoMovieVector3 = Vector3.normalize(
      Vector3.create(0, -toTeeth.z, toTeeth.y),
    );
    const held: number = createTool.GRIP;
    builder.rod(
      "handle",
      radius,
      Vector3.subtract(centre, Vector3.scale(across, held / 2)),
      Vector3.add(centre, Vector3.scale(across, held / 2)),
      { color: "#8a5a35" },
    );
    builder.affordance({
      id: "grip",
      kind: "handle",
      frame: ArchetypeFrame.facing(
        centre,
        Vector3.create(1, 0, 0),
        Vector3.scale(across, -1),
      ),
      extent: null,
      grip: "power",
      aperture: 2 * radius,
      length: held,
    });
  } else {
    builder.rod(
      "handle",
      radius,
      Vector3.create(0, 0, 0),
      Vector3.create(0, handle, 0),
      { color: kind === "spoon" || kind === "fork" ? "#b9bcc0" : "#8a5a35" },
    );
    const held: number = Math.min(handle, createTool.GRIP);
    builder.affordance({
      id: "grip",
      kind: "handle",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, kind === "hammer" ? held / 2 : handle - held / 2, 0),
        Vector3.create(0, 0, -1),
        Vector3.create(0, 1, 0),
      ),
      extent: null,
      grip: kind === "spoon" || kind === "fork" ? "precision" : "power",
      aperture: 2 * radius,
      length: held,
    });
  }

  if (kind === "hammer") {
    builder.box(
      "head",
      Vector3.create(0.028, 0.03, 0.11),
      Vector3.create(0, length - 0.015, 0),
      { color: "#55595f", density: 11 },
    );
    builder.affordance({
      id: "face",
      kind: "surface",
      direction: "normal",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, length - 0.015, 0.055),
        Vector3.create(0, 0, 1),
        Vector3.create(1, 0, 0),
      ),
      extent: null,
    });
  } else if (kind === "saw") {
    builder.box(
      "blade",
      Vector3.create(0.001, d.blade!, createTool.BLADE_DEPTH),
      Vector3.create(0, handle + d.blade! / 2, 0),
      { color: "#b9bcc0", density: 11 },
    );
    builder.affordance({
      id: "face",
      kind: "ledge",
      direction: "normal",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, handle + d.blade! / 2, createTool.BLADE_DEPTH / 2),
        Vector3.create(0, 0, 1),
        Vector3.create(0, 1, 0),
      ),
      extent: null,
      length: d.blade!,
    });
  } else if (kind === "screwdriver") {
    builder.rod(
      "shank",
      0.003,
      Vector3.create(0, handle, 0),
      Vector3.create(0, length, 0),
      { color: "#b9bcc0", density: 11 },
    );
    builder.affordance({
      id: "face",
      kind: "surface",
      direction: "along",
      frame: ArchetypeFrame.upright(Vector3.create(0, length, 0)),
      extent: null,
    });
  } else if (kind === "fork") {
    // The tines are one flat plate on the handle's end, ending the fork's drawn length.
    const tines: Readonly<{ width: number; length: number }> = createTool.TINES;
    builder.box(
      "tines",
      Vector3.create(tines.width, tines.length, 0.002),
      Vector3.create(0, handle + tines.length / 2, 0),
      { color: "#b9bcc0" },
    );
    builder.affordance({
      id: "face",
      kind: "surface",
      direction: "along",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, length, 0),
        Vector3.create(0, 1, 0),
        Vector3.create(1, 0, 0),
      ),
      extent: null,
    });
  } else {
    // The bowl is a disc on the handle's end whose far rim is the spoon's drawn length.
    const centre: number = length - createTool.BOWL;
    builder.rod(
      "bowl",
      createTool.BOWL,
      Vector3.create(0, centre, -0.001),
      Vector3.create(0, centre, 0.001),
      { color: "#b9bcc0" },
    );
    builder.affordance({
      id: "face",
      kind: "surface",
      direction: "normal",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, centre, 0.001),
        Vector3.create(0, 0, 1),
        Vector3.create(1, 0, 0),
      ),
      extent: null,
    });
  }
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createTool}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The handle a hand wraps, the reach to the working end and the mass swung (#3369, #3361).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every tool has the same two contacts, a `grip` and a `face`, so a tool-use act is written once.
 */
export namespace createTool {
  /** The kinds of tool. */
  export type Kind = "hammer" | "saw" | "screwdriver" | "spoon" | "fork";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "hammer",
    "saw",
    "screwdriver",
    "spoon",
    "fork",
  ];

  /** A fork's tines as one plate, across and along, metres: an estimate, not read at a source. */
  export const TINES: Readonly<{ width: number; length: number }> = {
    width: 0.025,
    length: 0.045,
  };

  /** A saw blade's depth from its spine to its teeth, metres: an estimate, not read at a source. */
  export const BLADE_DEPTH: number = 0.1;

  /** The length of handle a hand holds, metres: the 120 mm CCOHS recommends for a tool handle (https://www.ccohs.ca/oshanswers/ergonomics/handtools/tooldesign.html). */
  export const GRIP: number = 0.12;

  /** The radius of a spoon's bowl, metres: the bowl is a disc of this radius whose far rim ends the spoon, and the handle is the rest of the length. An estimate, not read at a source. */
  export const BOWL: number = 0.02;

  /**
   * The affordance ids:
   *
   * - `grip`: the handle, held at its butt end on a hammer, across the heel on a saw and next to the working part on the others.
   * - `face`: the working end: a hammer's striking face, the edge of a saw's teeth, a screwdriver's tip, the hollow of a spoon's bowl, the points of a fork's tines.
   */
  export type Affordance = "grip" | "face";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: overall, along `+Y`.
   * - `gripDiameter`: the handle's diameter; a spoon's or a fork's handle's width.
   * - `blade`: the length of a saw's blade or a screwdriver's shank.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "gripDiameter" | "blade" | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which tool. */
    kind: Kind;

    /** The model's id, unique in a scene; `tool` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    hammer: {
      length: ArchetypeBand.metres(0.33, 0.33, HAMMER, true),
      gripDiameter: ArchetypeBand.metres(0.03, 0.04, POWER, true),
      mass: ArchetypeBand.of(
        "kg",
        0.6,
        0.75,
        `${HAMMER}: the 448 g head with a handle, the whole not read at a source`,
        true,
      ),
    },
    saw: {
      length: ArchetypeBand.metres(0.61, 0.62, SAW, true),
      blade: ArchetypeBand.metres(0.5, 0.55, SAW, true),
      gripDiameter: ArchetypeBand.metres(0.03, 0.04, POWER, true),
      mass: ArchetypeBand.of("kg", 0.35, 0.5, ArchetypeBand.TYPICAL_MASS, true),
    },
    screwdriver: {
      length: ArchetypeBand.metres(0.21, 0.21, SCREWDRIVER),
      blade: ArchetypeBand.metres(0.102, 0.102, SCREWDRIVER),
      gripDiameter: ArchetypeBand.metres(0.03, 0.04, POWER, true),
      mass: ArchetypeBand.of("kg", 0.113, 0.113, SCREWDRIVER),
    },
    spoon: {
      length: ArchetypeBand.metres(0.13, 0.17, SPOON, true),
      gripDiameter: ArchetypeBand.metres(
        0.006,
        0.013,
        "the 6 to 13 mm precision handle band of NIOSH 2004-164 (https://www.cdc.gov/niosh/docs/2004-164/pdfs/2004-164.pdf), applied to a spoon handle",
        true,
      ),
      mass: ArchetypeBand.of(
        "kg",
        0.03,
        0.05,
        ArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
    fork: {
      length: ArchetypeBand.metres(0.19, 0.19, FORK),
      gripDiameter: ArchetypeBand.metres(
        0.006,
        0.013,
        "the 6 to 13 mm precision handle band of NIOSH 2004-164 (https://www.cdc.gov/niosh/docs/2004-164/pdfs/2004-164.pdf), applied to a fork handle",
        true,
      ),
      mass: ArchetypeBand.of(
        "kg",
        0.045,
        0.045,
        `${FORK}: a quarter of the pack`,
      ),
    },
  };
}
