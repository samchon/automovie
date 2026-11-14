import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** Metres in an inch. */
const INCH: number = 0.0254;

/**
 * A golf club: a driver, an iron or a putter.
 *
 * It stands on its head's sole at the origin, the shaft straight up along `+Y` to the grip's end, the head's toe toward `+X` and its face toward `+Z`. `grip` is the grip both hands close on; `face` the striking face, its `+Y` out of it; `head` the head's centre, its `+Y` running out of the club down the shaft's line: a swing carries `head` through the ball as its working point (`tip`) with `face` leading as its edge (`edge`).
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The club.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the club stands, its three contacts and what reads them.
 * @evidence contracts/development/implementation.md#principled-implementation A head box of the drawn heel-to-toe width and face-to-back depth on the floor, a shaft rod up from its heel and a grip rod of the drawn diameter at the top, the club's length from the sole to the grip's end.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, head, shaft and grip, then the three contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The head is a box set square on the shaft, with no loft or lie angle; its height and the shaft's and grip's lengths are named estimates.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createGolfClub(
  params: createGolfClub.IParams,
  seed?: number | string,
): Archetype<createGolfClub.Affordance, createGolfClub.Dimension> {
  const kind: createGolfClub.Kind = ArchetypeDraw.choice(
    "golfClub",
    "kind",
    params.kind,
    createGolfClub.KINDS,
  );
  const d: Record<createGolfClub.Dimension, number> = ArchetypeDraw.dimensions(
    "golfClub",
    createGolfClub.BANDS[kind],
    seed,
    params,
  );
  const builder: ArchetypeBuilder<
    createGolfClub.Affordance,
    createGolfClub.Dimension
  > = new ArchetypeBuilder({
    archetype: "golfClub",
    id: params.id,
    name: kind,
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const high: number = createGolfClub.HEAD_HEIGHT[kind];
  const hold: number = createGolfClub.GRIP_LENGTH;
  builder.box(
    "head",
    v(d.headWidth, high, d.headDepth),
    v(d.headWidth / 2, high / 2, 0),
    { color: kind === "driver" ? "#2c2f33" : "#b8bcc2", density: 2 },
  );
  builder.rod(
    "shaft",
    createGolfClub.SHAFT / 2,
    v(0, high, 0),
    v(0, d.length - hold, 0),
    { color: "#8a8d91" },
  );
  builder.rod(
    "grip",
    d.gripDiameter / 2,
    v(0, d.length - hold, 0),
    v(0, d.length, 0),
    { color: "#1d1f22" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    frame: ArchetypeFrame.facing(
      v(0, d.length - hold / 2, 0),
      v(0, 0, -1),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "two-hand",
    aperture: d.gripDiameter,
    length: hold,
  });
  builder.affordance({
    id: "face",
    kind: "surface",
    frame: ArchetypeFrame.facing(
      v(d.headWidth / 2, high / 2, d.headDepth / 2),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    width: d.headWidth,
  });
  builder.affordance({
    id: "head",
    kind: "surface",
    frame: ArchetypeFrame.facing(
      v(d.headWidth / 2, high / 2, 0),
      v(0, -1, 0),
      v(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(d.mass);
}

/**
 * Companion types, constants and bands of {@link createGolfClub}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union of the three clubs a round is played with and one band per dimension per kind; the Equipment Rules bound the length and the head, the makers' sizes fill the rest.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The grip the hands take, the face and the head a swing reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The rules were recalled and not read here, so every band is provisional; the head's height, the shaft's diameter and the grip's length are named estimates.
 */
export namespace createGolfClub {
  /** The kinds: a driver, a mid iron (a 7-iron) and a putter. */
  export type Kind = "driver" | "iron" | "putter";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["driver", "iron", "putter"];

  /** The head's height from the sole to the crown, metres, by kind: estimates under the rules' 2.8 in for a wood. */
  export const HEAD_HEIGHT: Readonly<Record<Kind, number>> = {
    driver: 0.06,
    iron: 0.05,
    putter: 0.03,
  };

  /** The shaft's diameter, metres: an estimate. */
  export const SHAFT: number = 0.013;

  /** The grip's length, metres: a common 10.5 in grip, an estimate. */
  export const GRIP_LENGTH: number = 10.5 * INCH;

  /**
   * The affordance ids:
   *
   * - `grip`: the grip, taken from `-Z`, its length along the shaft.
   * - `face`: the striking face toward `+Z`, its `+X` toward the toe.
   * - `head`: the head's centre, its `+Y` down the shaft's line out of the club.
   */
  export type Affordance = "grip" | "face" | "head";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: from the sole to the grip's end.
   * - `headWidth`: the head from heel to toe.
   * - `headDepth`: the head from the face to the back.
   * - `gripDiameter`: the grip's.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "length"
    | "headWidth"
    | "headDepth"
    | "gripDiameter"
    | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which club. */
    kind: Kind;

    /** The model's id, unique in a scene; `golfClub` when absent. */
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

  /** The grip's band, every club alike. */
  const GRIP: IArchetypeBand = m(
    0.02,
    0.024,
    "R&A and USGA Equipment Rules, Part 2, 5: the grip at most 1.75 in across; the band is a maker's standard to midsize grip",
  );

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    driver: {
      length: m(
        43.5 * INCH,
        46 * INCH,
        "R&A and USGA Equipment Rules, Part 2, 1c: at most 46 in for a club other than a putter; the shorter end is a maker's",
      ),
      headWidth: m(
        0.11,
        5 * INCH,
        "R&A and USGA Equipment Rules, Part 2, 4b: a wood's head at most 5 in from heel to toe",
      ),
      headDepth: m(0.1, 0.12, MAKER),
      gripDiameter: GRIP,
      mass: kg(0.29, 0.33, MAKER),
    },
    iron: {
      length: m(36.25 * INCH, 37.5 * INCH, MAKER),
      headWidth: m(0.075, 0.085, MAKER),
      headDepth: m(0.02, 0.03, MAKER),
      gripDiameter: GRIP,
      mass: kg(0.4, 0.45, MAKER),
    },
    putter: {
      length: m(
        33 * INCH,
        35 * INCH,
        "R&A and USGA Equipment Rules, Part 2, 1c: a putter at least 18 in long; the band is a maker's",
      ),
      headWidth: m(
        0.1,
        0.12,
        "R&A and USGA Equipment Rules, Part 2, 4b: a putter's head at most 7 in from heel to toe; the band is a maker's",
      ),
      headDepth: m(0.025, 0.08, MAKER),
      gripDiameter: GRIP,
      mass: kg(0.5, 0.6, MAKER),
    },
  };
}
