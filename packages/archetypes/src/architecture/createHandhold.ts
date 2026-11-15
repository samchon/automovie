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

/** The federal handrail rule read. */
const CFR: string =
  "49 CFR 38.29(b): handrails between 1 1/4 and 1 1/2 inches in cross-sectional diameter, with at least 1 1/2 inches of knuckle clearance (https://www.govinfo.gov/content/pkg/CFR-2023-title49-vol1/xml/CFR-2023-title49-vol1-sec38-29.xml)";

/** The bus specification read. */
const DULUTH: string =
  "Duluth Transit Authority heavy-duty bus technical specifications (28 August 2020), 1.21 Passenger Assists: assists 1 1/4 inch in diameter, the overhead assist no less than 70 inches above the floor (https://www.duluthtransit.com/wp-content/uploads/2020/08/Heavy-Duty-Buses-Technical-Specifications.pdf)";

/** A strap's loop, metres: HAPPICH's 200 mm drawing label, the grip at its foot. */
const LOOP: number = 200 * ArchetypeUnits.MILLIMETRE;

/** The construction sizes no source read gives, metres, each an estimate no act reads and no band declares: `run`, the overhead rail's length a strap hangs from; `tape`, a strap's tape width and thickness. */
const ESTIMATES: Readonly<{ run: number; tape: number }> = {
  run: 0.4,
  tape: 0.02,
};

/**
 * A handhold a standing passenger holds in a bus or a train: an upright pole, or a strap hanging from the overhead rail.
 *
 * The pole stands on the floor at the origin up to the overhead rail's height; its `pole` contact is the whole pole, an upright bar. A strap hangs from a short run of the overhead rail along `X` above the origin, its loop's foot the strap's length below the rail; its `rail` contact is the overhead rail, a bar, and `strap` the loop's foot, a handle. Standing on the moving floor has no motion law yet (#3491), so the hold is built for static use.
 *
 * @param params The kind, a strap's model and any dimension the author fixes.
 * @param seed The seed that draws a strap's model when it is not given and every dimension left free inside its band; absent, the first strap and the middle of each band.
 * @returns The handhold.
 * @throws {ArchetypeRefusal} For a strap HAPPICH does not list or one named for a pole, a fixed dimension outside its band, or one only another kind has.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each kind's place, its contacts and its static use with the missing law.
 * @evidence contracts/development/implementation.md#principled-implementation The federal rule's handrail diameter, the bus specification's overhead height, one of HAPPICH's straps whole, its length and its mass with its clamping piece, and its loop.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pick a strap's model, draw the dimensions, then the pole, or the rail and the strap, then the contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The strap is one straight tape to its loop's foot; the rail's run and the tape's section are construction estimates.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms At most two parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createHandhold(
  params: createHandhold.IParams,
  seed?: number | string,
): Archetype<createHandhold.Affordance, createHandhold.Dimension> {
  const kind: createHandhold.Kind = ArchetypeDraw.choice(
    "handhold",
    "kind",
    params.kind,
    createHandhold.KINDS,
  );
  const strap: {
    name: createHandhold.Strap | undefined;
    figures: Readonly<Partial<Record<createHandhold.Dimension, number>>>;
  } = ArchetypeDraw.model<createHandhold.Strap, createHandhold.Dimension>(
    "handhold",
    "strap",
    params.strap,
    createHandhold.STRAPS[kind],
    seed,
  );
  const d: Partial<Record<createHandhold.Dimension, number>> = {
    ...ArchetypeDraw.dimensions(
      "handhold",
      createHandhold.BANDS[kind],
      seed,
      params,
      createHandhold.BANDS,
    ),
    ...strap.figures,
  };
  const builder: ArchetypeBuilder<
    createHandhold.Affordance,
    createHandhold.Dimension
  > = new ArchetypeBuilder({
    archetype: "handhold",
    id: params.id,
    name:
      strap.name === undefined ? "grab pole" : `hanging strap ${strap.name}`,
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const height: number = d.height!;
  const diameter: number = d.diameter!;
  if (kind === "pole") {
    builder.rod("pole", diameter / 2, v(0, 0, 0), v(0, height, 0), {
      color: "#d9c21a",
      surface: "steel",
    });
    builder.affordance({
      id: "pole",
      kind: "bar",
      symmetry: "round",
      frame: ArchetypeFrame.facing(v(0, height / 2, 0), v(0, 0, 1), v(0, 1, 0)),
      extent: null,
      grip: "power",
      aperture: diameter,
      length: height,
    });
  } else {
    const E: typeof ESTIMATES = ESTIMATES;
    const length: number = d.length!;
    const foot: number = height - length;
    builder.rod(
      "rail",
      diameter / 2,
      v(-E.run / 2, height, 0),
      v(E.run / 2, height, 0),
      { color: "#b9bec4", surface: "steel" },
    );
    builder.box(
      "strap",
      v(E.tape, length - LOOP / 2, E.tape),
      v(0, (height + foot + LOOP / 2) / 2, 0),
      { color: "#1d1d1d" },
    );
    builder.affordance({
      id: "rail",
      kind: "bar",
      symmetry: "round",
      frame: ArchetypeFrame.facing(v(0, height, 0), v(0, 0, 1), v(1, 0, 0)),
      extent: null,
      grip: "power",
      aperture: diameter,
      length: E.run,
    });
    builder.affordance({
      id: "strap",
      kind: "handle",
      symmetry: "none",
      frame: ArchetypeFrame.facing(v(0, foot, 0), v(0, 0, 1), v(1, 0, 0)),
      extent: null,
      grip: "hook",
    });
  }
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createHandhold}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions, HAPPICH's straps among them, and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The pole, rail and strap a standing hand holds (#3468 N7).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Where a source gives only a least height, the band is that least and says so.
 */
export namespace createHandhold {
  /** The kinds of handhold. */
  export type Kind = "pole" | "strap";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["pole", "strap"];

  /**
   * The affordance ids:
   *
   * - `pole`: an upright pole, a bar along `+Y`.
   * - `rail`: the overhead rail a strap hangs from, a bar along `X`.
   * - `strap`: the strap's loop foot, a handle hooked by the fingers.
   */
  export type Affordance = "pole" | "rail" | "strap";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the pole's top, or the overhead rail's height, above the floor.
   * - `diameter`: the pole's or the rail's section.
   * - `length`: a strap's from the rail to its loop's foot, its model's.
   * - `mass`: kilograms; a strap's is its model's, the strap's alone, the rail being the vehicle's.
   */
  export type Dimension = "height" | "diameter" | "length" | "mass";

  /** The straps read: HAPPICH's 625 and 673 mm straps, each with its three clamping pieces' masses. */
  export type Strap =
    | "625 mm, 100 g"
    | "625 mm, 125 g"
    | "625 mm, 150 g"
    | "673 mm, 110 g"
    | "673 mm, 135 g"
    | "673 mm, 160 g";

  /** Each kind's straps, metres and kilograms, the default first; a pole has one read model. Each strap read, metres and kilograms, its length and its mass with one of its clamping pieces: HAPPICH Halteschlaufen / Straps catalogue (02/2018): straps 625 mm long for mounting without a rotary catch lock (p. 76) and 673 mm with one (p. 78), each +/-4 mm, weighing 100, 125 or 150 g and 110, 135 or 160 g by clamping piece, the loop 200 mm (https://www.hug-technik.com/media/e0/f3/9f/1688027593/2.8.4._Halteschlaufen.pdf). */
  export const STRAPS: Readonly<
    Partial<
      Record<
        Kind,
        Readonly<
          Partial<Record<Strap, Readonly<Partial<Record<Dimension, number>>>>>
        >
      >
    >
  > = {
    strap: {
      "625 mm, 100 g": { length: 0.625, mass: 0.1 },
      "625 mm, 125 g": { length: 0.625, mass: 0.125 },
      "625 mm, 150 g": { length: 0.625, mass: 0.15 },
      "673 mm, 110 g": { length: 0.673, mass: 0.11 },
      "673 mm, 135 g": { length: 0.673, mass: 0.135 },
      "673 mm, 160 g": { length: 0.673, mass: 0.16 },
    },
  };

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<
    Record<Exclude<Dimension, "length">, number>
  > {
    /** Which handhold. */
    kind: Kind;

    /** A strap's model; drawn from the seed when absent. A pole has none. */
    strap?: Strap;

    /** The model's id, unique in a scene; `handhold` when absent. */
    id?: string;
  }

  /** The bands every handhold shares. */
  const SHARED: Readonly<Partial<Record<Dimension, IArchetypeBand>>> = {
    height: ArchetypeBand.metres(
      70 * ArchetypeUnits.INCH,
      70 * ArchetypeUnits.INCH,
      `${DULUTH}; the model takes the least`,
    ),
    diameter: ArchetypeBand.metres(
      1.25 * ArchetypeUnits.INCH,
      1.5 * ArchetypeUnits.INCH,
      CFR,
    ),
  };

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    pole: {
      ...SHARED,
      mass: ArchetypeBand.of("kg", 3, 6, ArchetypeBand.TYPICAL_MASS, true),
    },
    strap: SHARED,
  };
}
