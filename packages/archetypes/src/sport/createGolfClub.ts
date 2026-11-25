import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";

/**
 * A golf club: a driver, an iron or a putter.
 *
 * It stands on its head's sole at the origin, the shaft straight up along `+Y`
 * to the grip's end, the head's toe toward `+X` and its face toward `+Z`.
 * `grip` is the grip both hands close on; `face` the striking face, its `+Y`
 * out of it; `head` the head's centre, its `+Y` running out of the club down
 * the shaft's line: a swing carries `head` through the ball as its working
 * point (`tip`) with `face` leading as its edge (`edge`).
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The club.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function createGolfClub(
  params: createGolfClub.IParams,
  seed?: number,
): AutoMovieArchetype<createGolfClub.Affordance, createGolfClub.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createGolfClub.Dimension> =
    new AutoMovieArchetypeDrawSession<createGolfClub.Dimension>(
      "golfClub",
      createGolfClub.UNITS,
      seed,
      params,
    );
  const kind: createGolfClub.Kind = ArchetypeDraw.choice(
    "golfClub",
    "kind",
    params.kind,
    createGolfClub.KINDS,
  );
  const d: Record<createGolfClub.Dimension, number> = draw.dimensions(
    createGolfClub.BANDS[kind],
  );
  const builder: AutoMovieArchetypeBuilder<
    createGolfClub.Affordance,
    createGolfClub.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: kind,
    draw,
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
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
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
    direction: "normal",
    frame: AutoMovieArchetypeFrame.facing(
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
    direction: "along",
    frame: AutoMovieArchetypeFrame.facing(
      v(d.headWidth / 2, high / 2, 0),
      v(0, -1, 0),
      v(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(d.mass);
}

/** Companion types, constants and bands of {@link createGolfClub}. */
export namespace createGolfClub {
  /** The kinds: a driver, a mid iron (a 7-iron) and a putter. */
  export type Kind = "driver" | "iron" | "putter";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["driver", "iron", "putter"];

  /**
   * The head's height from the sole to the crown, metres, by kind: estimates
   * under the rules' 2.8 in for a wood.
   */
  export const HEAD_HEIGHT: Readonly<Record<Kind, number>> = {
    driver: 0.06,
    iron: 0.05,
    putter: 0.03,
  };

  /** The shaft's diameter, metres: an estimate. */
  export const SHAFT: number = 0.013;

  /** The grip's length, metres: a common 10.5 in grip, an estimate. */
  export const GRIP_LENGTH: number = 10.5 * AutoMovieArchetypeUnits.INCH;

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

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    headWidth: "m",
    headDepth: "m",
    gripDiameter: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which club. */
    kind: Kind;

    /** The model's id, unique in a scene; `golfClub` when absent. */
    id?: string;
  }

  /** A band in metres. */
  const m = (
    minimum: number,
    maximum: number,
    source: string,
    provisional: boolean = false,
  ): IAutoMovieArchetypeBand =>
    AutoMovieArchetypeBand.metres(minimum, maximum, source, provisional);

  /** A mass band. */
  const kg = (
    minimum: number,
    maximum: number,
    source: string,
    provisional: boolean = false,
  ): IAutoMovieArchetypeBand =>
    AutoMovieArchetypeBand.of("kg", minimum, maximum, source, provisional);

  /** The R&A Rules of Equipment, Part 2. */
  const RANDA: string =
    "R&A Rules of Equipment, Part 2 (https://www.randa.org/roe/the-rules-of-equipment/part-2-conformance-of-clubs)";

  /** What no source read gives. */
  const UNREAD: string =
    "no source read gives it; the makers' pages read do not state it";

  /** The grip's band, every club alike: under the rule's limit, its size unread. */
  const GRIP: IAutoMovieArchetypeBand = m(
    0.02,
    0.024,
    `${RANDA}, 2.3b(iii): the grip at most 1.75 in across; the band inside it ${UNREAD}`,
    true,
  );

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IAutoMovieArchetypeBand>>>
  > = {
    driver: {
      length: m(
        45.5 * AutoMovieArchetypeUnits.INCH,
        46 * AutoMovieArchetypeUnits.INCH,
        "PING G440 MAX driver, standard 45 1/2 and 46 in by shaft (https://ping.com/clubs/drivers/g440-max), inside the R&A rule 2.1c's 48 in",
      ),
      headWidth: m(
        0.11,
        5 * AutoMovieArchetypeUnits.INCH,
        `${RANDA}, 2.4b(i): a wood's head at most 5 in from heel to toe; the narrower end ${UNREAD}`,
        true,
      ),
      headDepth: m(
        0.1,
        0.12,
        `${RANDA}, 2.4b(i): less than the heel to toe; the band ${UNREAD}`,
        true,
      ),
      gripDiameter: GRIP,
      mass: kg(
        0.29,
        0.33,
        `PING G440 head of 203 g (https://ping.com/clubs/drivers/g440-k) with a 50 g class shaft; the grip's mass ${UNREAD}`,
        true,
      ),
    },
    iron: {
      length: m(
        37 * AutoMovieArchetypeUnits.INCH,
        37 * AutoMovieArchetypeUnits.INCH,
        "PING G440 7-iron, 37 in (https://ping.com/clubs/irons/g440)",
      ),
      headWidth: m(0.075, 0.085, UNREAD, true),
      headDepth: m(0.02, 0.03, UNREAD, true),
      gripDiameter: GRIP,
      mass: kg(0.4, 0.45, UNREAD, true),
    },
    putter: {
      length: m(
        33 * AutoMovieArchetypeUnits.INCH,
        35 * AutoMovieArchetypeUnits.INCH,
        "PING putters, the G Le4 Anser 2D's 33 in and the 2024 Anser D's 35 in standard lengths (https://ping.com/en-us/golf-clubs/womens/g-le4-anser-2d-putter, https://ping.com/en-us/golf-clubs/putters/2024-2023-anser-d-putter)",
      ),
      headWidth: m(
        0.1,
        0.12,
        `${RANDA}, 2.4b(iii): a putter's head at most 7 in from heel to toe; the band ${UNREAD}`,
        true,
      ),
      headDepth: m(0.025, 0.08, UNREAD, true),
      gripDiameter: GRIP,
      mass: kg(
        0.5,
        0.52,
        "PING Anser heads of 350 to 365 g (https://ping.com/en-us/golf-clubs/putters/2024-2023-anser-d-putter) with a shaft and a grip whose mass no source read gives",
        true,
      ),
    },
  };
}
