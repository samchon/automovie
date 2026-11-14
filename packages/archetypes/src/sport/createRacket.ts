import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/**
 * A racket or a bat of a racket sport: a tennis racket, a badminton racket, a squash racket or a table tennis bat.
 *
 * It stands along `+Y` from the butt of its handle at the origin to the top of its head, the strung face toward `+Z`. `grip` is the handle a hand closes on, `face` the strung surface that meets the ball, its `+Y` out of the strings, and `sweetSpot` the head's centre on the racket's axis, its `+Y` running along the racket toward the head's top: a swing carries `sweetSpot` through the ball as its working point (`tip`) with `face` leading as its edge (`edge`).
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The racket.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the racket stands and its three contacts and what reads them.
 * @evidence contracts/development/implementation.md#principled-implementation A handle rod of the drawn length and diameter, a throat rod up to the head, and the head as a flat box of the drawn width and length whose top is the racket's length; the face is the head's `+Z` side.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, handle, throat and head, then the three contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The head is a flat box, not an oval frame and strings; its thickness is a named estimate.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createRacket(
  params: createRacket.IParams,
  seed?: number | string,
): Archetype<createRacket.Affordance, createRacket.Dimension> {
  const kind: createRacket.Kind = ArchetypeDraw.choice(
    "racket",
    "kind",
    params.kind,
    createRacket.KINDS,
  );
  const d: Record<createRacket.Dimension, number> = ArchetypeDraw.dimensions(
    "racket",
    createRacket.BANDS[kind],
    seed,
    params,
  );
  const builder: ArchetypeBuilder<
    createRacket.Affordance,
    createRacket.Dimension
  > = new ArchetypeBuilder({
    archetype: "racket",
    id: params.id,
    name: createRacket.NAMES[kind],
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const thick: number = createRacket.THICKNESS[kind];
  const base: number = d.length - d.headLength;
  builder.rod(
    "handle",
    d.gripDiameter / 2,
    v(0, 0, 0),
    v(0, d.handleLength, 0),
    {
      color: "#2c2f33",
    },
  );
  if (base > d.handleLength)
    builder.rod("throat", thick / 2, v(0, d.handleLength, 0), v(0, base, 0), {
      color: "#8a8d91",
    });
  builder.box(
    "head",
    v(d.headWidth, d.headLength, thick),
    v(0, base + d.headLength / 2, 0),
    { color: kind === "tableTennis" ? "#b22222" : "#c9ccd1", density: 0.3 },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    frame: ArchetypeFrame.facing(
      v(0, d.handleLength / 2, 0),
      v(0, 0, -1),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: d.gripDiameter,
    length: d.handleLength,
  });
  builder.affordance({
    id: "face",
    kind: "surface",
    frame: ArchetypeFrame.facing(
      v(0, base + d.headLength / 2, thick / 2),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    width: d.headWidth,
    depth: d.headLength,
  });
  builder.affordance({
    id: "sweetSpot",
    kind: "surface",
    frame: ArchetypeFrame.facing(
      v(0, base + d.headLength / 2, 0),
      v(0, 1, 0),
      v(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(d.mass);
}

/**
 * Companion types, constants and bands of {@link createRacket}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union of the sports and one band per dimension per kind; the rules bound the length and the head, the makers' sizes the rest.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The handle a hand takes, the face and the line a swing reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The rules were recalled and not read here, so every band is provisional; the head's thickness is a named estimate.
 */
export namespace createRacket {
  /** The kinds. */
  export type Kind = "tennis" | "badminton" | "squash" | "tableTennis";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "tennis",
    "badminton",
    "squash",
    "tableTennis",
  ];

  /** The readable name of each kind. */
  export const NAMES: Readonly<Record<Kind, string>> = {
    tennis: "tennis racket",
    badminton: "badminton racket",
    squash: "squash racket",
    tableTennis: "table tennis bat",
  };

  /** The head's thickness, metres, by kind: estimates, not read at a source. */
  export const THICKNESS: Readonly<Record<Kind, number>> = {
    tennis: 0.024,
    badminton: 0.008,
    squash: 0.02,
    tableTennis: 0.012,
  };

  /**
   * The affordance ids:
   *
   * - `grip`: the handle, taken from `-Z`, its length along the racket.
   * - `face`: the strung face toward `+Z`, as wide and as long as the head, its `+X` across the head.
   * - `sweetSpot`: the head's centre on the racket's axis, its `+Y` along the racket.
   */
  export type Affordance = "grip" | "face" | "sweetSpot";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: from the butt to the head's top.
   * - `headWidth`, `headLength`: the head across and along.
   * - `handleLength`: the handle from the butt.
   * - `gripDiameter`: the handle's.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "length"
    | "headWidth"
    | "headLength"
    | "handleLength"
    | "gripDiameter"
    | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which racket. */
    kind: Kind;

    /** The model's id, unique in a scene; `racket` when absent. */
    id?: string;
  }

  /** A provisional band in metres. */
  const m = (
    minimum: number,
    maximum: number,
    source: string,
  ): IArchetypeBand => ArchetypeBand.metres(minimum, maximum, source, true);

  /** A provisional mass band. */
  const kg = (
    minimum: number,
    maximum: number,
    source: string,
  ): IArchetypeBand => ArchetypeBand.of("kg", minimum, maximum, source, true);

  /** What a maker's size reads as, not read at a source. */
  const MAKER: string = "a common maker's size, not read at a source";

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    tennis: {
      length: m(
        0.686,
        0.737,
        "ITF Rules of Tennis, Appendix II: the frame at most 73.7 cm long; the shorter end is the common 27 in racket",
      ),
      headWidth: m(
        0.25,
        0.292,
        "ITF Rules of Tennis, Appendix II: the strung surface at most 29.2 cm wide; the narrower end is a maker's",
      ),
      headLength: m(
        0.32,
        0.394,
        "ITF Rules of Tennis, Appendix II: the strung surface at most 39.4 cm long; the shorter end is a maker's",
      ),
      handleLength: m(0.17, 0.2, MAKER),
      gripDiameter: m(
        0.032,
        0.038,
        "grip sizes of 4 to 4 3/4 in round, a maker's chart recalled and not read",
      ),
      mass: kg(0.25, 0.34, MAKER),
    },
    badminton: {
      length: m(
        0.665,
        0.68,
        "BWF Laws of Badminton, Law 4: the frame at most 680 mm long",
      ),
      headWidth: m(
        0.2,
        0.23,
        "BWF Laws of Badminton, Law 4: the frame at most 230 mm wide",
      ),
      headLength: m(
        0.25,
        0.28,
        "BWF Laws of Badminton, Law 4: the strung area at most 280 mm long",
      ),
      handleLength: m(0.19, 0.21, MAKER),
      gripDiameter: m(0.024, 0.028, MAKER),
      mass: kg(0.07, 0.1, MAKER),
    },
    squash: {
      length: m(
        0.67,
        0.686,
        "World Squash Federation racket specification: at most 686 mm long",
      ),
      headWidth: m(
        0.19,
        0.215,
        "World Squash Federation racket specification: at most 215 mm wide",
      ),
      headLength: m(0.25, 0.28, MAKER),
      handleLength: m(0.18, 0.2, MAKER),
      gripDiameter: m(0.03, 0.034, MAKER),
      mass: kg(
        0.11,
        0.255,
        "World Squash Federation racket specification: at most 255 g",
      ),
    },
    tableTennis: {
      length: m(
        0.25,
        0.27,
        "ITTF Laws 2.4: the blade's size is free; a common bat's",
      ),
      headWidth: m(0.15, 0.16, MAKER),
      headLength: m(0.155, 0.165, MAKER),
      handleLength: m(0.095, 0.105, MAKER),
      gripDiameter: m(0.025, 0.03, MAKER),
      mass: kg(0.15, 0.2, MAKER),
    },
  };
}
