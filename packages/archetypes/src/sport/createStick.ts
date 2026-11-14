import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The ice hockey stick read. */
const IIHF: string =
  "IIHF Official Rule Book 2026/27, Rule 10.1: no stick longer than 1.63 m from the heel to the end of the shaft, the blade at most 32.0 cm from the heel and 5.0 to 7.6 cm wide (https://test.rulebook.iihf.com/documents/rule-book-2026-27/10); the shaft at most 3 cm wide and 2.5 cm thick in the older Rule 222 (https://stats.iihf.com/hockey/rules/img/sec2.pdf)";

/** The field hockey stick read. */
const FIH: string =
  "FIH Rules of Hockey 2026, stick specifications 2.17 and 2.18: at most 105 cm from the top of the handle to the bottom of the head, at most 737 g, passing through a ring of 51 mm inside diameter; the head's open end limited by line C, 100 mm above line X (2.2, 2.8) (https://www.fih.hockey/static-assets/pdf/fih-Rules-of-hockey-2026-final.pdf)";

/** The cricket bat read. */
const MCC: string =
  "MCC Laws of Cricket, 2017 Code 3rd Edition 2022, Law 5, bat size limits: overall length at most 38 in (96.52 cm), width 4.25 in (10.8 cm), depth 2.64 in (6.7 cm), edges 1.56 in (4.0 cm), the handle at most 52% of the overall length (https://www.lords.org/getmedia/81bd1d01-c7e7-42f6-ac70-80473a050c32/Laws-of-Cricket-2017-Code-3rd-Edition-2022_1.docx)";

/** The construction sizes no source read gives, metres, each an estimate no act reads and no band declares: `blade`, an ice hockey blade's thickness; `toe`, a field hockey head's length along `X`; `handle`, a cricket bat handle's diameter. */
const ESTIMATES: Readonly<{ blade: number; toe: number; handle: number }> = {
  blade: 0.015,
  toe: 0.1,
  handle: 0.035,
};

/** The readable name of each kind. */
const NAMES: Readonly<Record<createStick.Kind, string>> = {
  iceHockey: "ice hockey stick",
  fieldHockey: "field hockey stick",
  cricketBat: "cricket bat",
};

/**
 * A stick or a bat of a game: an ice hockey stick, a field hockey stick or a cricket bat.
 *
 * It stands upright on its striking end at the origin, its shaft straight up along `+Y` and its striking face toward `+Z`: an ice hockey blade runs from the heel at the origin along `+X` on the floor, a field hockey head sits under the shaft, a cricket bat's blade stands on its toe. `grip` is where both hands hold it: an ice hockey or field hockey stick's whole shaft above its blade or head, a cricket bat's handle. `blade` is the striking face, its `+Y` out of it.
 *
 * No source read names what it rests on, so its body's friction is the builder's 0.5 placeholder (`ArchetypeFriction`).
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The stick.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band, or one only another kind has.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the stick stands, its two contacts and where each kind strikes.
 * @evidence contracts/development/implementation.md#principled-implementation Each kind at its rule's limits: the IIHF stick's length, blade and shaft section, the FIH stick's length, head height and ring diameter, the MCC bat's length, blade section and handle share.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, then the kind's striking end and shaft, then the two contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The shaft stands square on the blade or head, with no lie angle or curve; the field hockey head is a block, not a J; the blade's thickness, the head's toe and the bat handle's diameter are construction estimates.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Two parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createStick(
  params: createStick.IParams,
  seed?: number | string,
): Archetype<createStick.Affordance, createStick.Dimension> {
  const kind: createStick.Kind = ArchetypeDraw.choice(
    "stick",
    "kind",
    params.kind,
    createStick.KINDS,
  );
  const d: Partial<Record<createStick.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "stick",
      createStick.BANDS[kind],
      seed,
      params,
      createStick.BANDS,
    );
  const builder: ArchetypeBuilder<
    createStick.Affordance,
    createStick.Dimension
  > = new ArchetypeBuilder({
    archetype: "stick",
    id: params.id,
    name: NAMES[kind],
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const E: typeof ESTIMATES = ESTIMATES;
  const length: number = d.length!;
  const head: number = d.head!;
  const width: number = d.width!;
  const depth: number = d.depth!;
  let face: ReturnType<typeof Vector3.create>;
  let faceWidth: number;
  let gripLength: number;
  let aperture: number | undefined;
  if (kind === "iceHockey") {
    builder.box("blade", v(d.reach!, head, E.blade), v(d.reach! / 2, head / 2, 0), {
      color: "#1d1d1d",
    });
    builder.box("shaft", v(width, length - head, depth), v(0, (length + head) / 2, 0), {
      color: "#d8d8d8",
    });
    face = v(d.reach! / 2, head / 2, E.blade / 2);
    faceWidth = d.reach!;
    gripLength = length - head;
    aperture = depth;
  } else if (kind === "fieldHockey") {
    builder.box("head", v(E.toe, head, width), v(0, head / 2, 0), {
      color: "#2b5797",
    });
    builder.rod("shaft", width / 2, v(0, head, 0), v(0, length, 0), {
      color: "#2b5797",
    });
    face = v(0, head / 2, width / 2);
    faceWidth = E.toe;
    gripLength = length - head;
    aperture = width;
  } else {
    builder.box("blade", v(width, head, depth), v(0, head / 2, 0), {
      color: "#e8d3a1",
    });
    builder.rod("handle", E.handle / 2, v(0, head, 0), v(0, length, 0), {
      color: "#1d1d1d",
    });
    face = v(0, head / 2, depth / 2);
    faceWidth = width;
    gripLength = length - head;
    aperture = undefined;
  }
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: kind === "iceHockey" ? "half" : "round",
    frame: ArchetypeFrame.facing(
      v(0, (length + head) / 2, 0),
      v(0, 0, 1),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "two-hand",
    ...(aperture === undefined ? {} : { aperture }),
    length: gripLength,
  });
  builder.affordance({
    id: "blade",
    kind: "surface",
    direction: "normal",
    frame: ArchetypeFrame.facing(face, v(0, 0, 1), v(1, 0, 0)),
    extent: null,
    width: faceWidth,
    depth: head,
  });
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createStick}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The grip both hands take and the face a swing strikes with (#3468 N11).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Where a rule gives only a limit, the band is the limit and says so.
 */
export namespace createStick {
  /** The kinds of stick. */
  export type Kind = "iceHockey" | "fieldHockey" | "cricketBat";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["iceHockey", "fieldHockey", "cricketBat"];

  /**
   * The affordance ids:
   *
   * - `grip`: where both hands hold the stick.
   * - `blade`: the striking face, its `+Y` out of it.
   */
  export type Affordance = "grip" | "blade";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: from the striking end's bottom to the shaft's or handle's top.
   * - `head`: an ice hockey blade's height, a field hockey head's height, a cricket bat blade's length.
   * - `reach`: an ice hockey blade's length from the heel.
   * - `width`, `depth`: an ice hockey shaft's section, a field hockey stick's diameter, a cricket bat blade's width and depth.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "head" | "reach" | "width" | "depth" | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which stick. */
    kind: Kind;

    /** The model's id, unique in a scene; `stick` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    iceHockey: {
      length: ArchetypeBand.metres(1.63, 1.63, `${IIHF}; the model takes the limit`),
      head: ArchetypeBand.metres(0.05, 0.076, IIHF),
      reach: ArchetypeBand.metres(0.32, 0.32, `${IIHF}; the model takes the limit`),
      width: ArchetypeBand.metres(0.03, 0.03, `${IIHF}; the model takes the limit`),
      depth: ArchetypeBand.metres(0.025, 0.025, `${IIHF}; the model takes the limit`),
      mass: ArchetypeBand.of("kg", 0.4, 0.6, ArchetypeBand.TYPICAL_MASS, true),
    },
    fieldHockey: {
      length: ArchetypeBand.metres(1.05, 1.05, `${FIH}; the model takes the limit`),
      head: ArchetypeBand.metres(0.1, 0.1, FIH),
      width: ArchetypeBand.metres(0.051, 0.051, `${FIH}; the model takes the ring`),
      mass: ArchetypeBand.of(
        "kg",
        0.5,
        0.737,
        `${FIH}: at most 737 g; the lower end is ${ArchetypeBand.TYPICAL_MASS}`,
        true,
      ),
    },
    cricketBat: {
      length: ArchetypeBand.metres(0.9652, 0.9652, `${MCC}; the model takes the limit`),
      head: ArchetypeBand.metres(
        0.9652 * 0.48,
        0.9652 * 0.48,
        `${MCC}: the blade the length less the handle's greatest 52%`,
      ),
      width: ArchetypeBand.metres(0.108, 0.108, `${MCC}; the model takes the limit`),
      depth: ArchetypeBand.metres(0.067, 0.067, `${MCC}; the model takes the limit`),
      mass: ArchetypeBand.of("kg", 1.1, 1.4, ArchetypeBand.TYPICAL_MASS, true),
    },
  };
}
