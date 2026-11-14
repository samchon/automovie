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
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each band is a rule or a maker's figure as read, the rule's own limit where it states only one; a figure no source read gives is provisional and says so; the head's thickness is a named estimate.
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

  /** A band in metres. */
  const m = (
    minimum: number,
    maximum: number,
    source: string,
    provisional: boolean = false,
  ): IArchetypeBand =>
    ArchetypeBand.metres(minimum, maximum, source, provisional);

  /** A mass band. */
  const kg = (
    minimum: number,
    maximum: number,
    source: string,
    provisional: boolean = false,
  ): IArchetypeBand =>
    ArchetypeBand.of("kg", minimum, maximum, source, provisional);

  /** ITF, Rules of Tennis 2026, Appendix II. */
  const ITF: string =
    "ITF Rules of Tennis 2026, Appendix II c (https://www.world.tennis/media/7221/2026-rules-of-tennis-english.pdf)";

  /** A maker's tennis racket. */
  const BABOLAT: string =
    "Babolat Pure Drive Gen11, 685 mm long, a 645 cm2 head, 300 g +/- 7 unstrung (https://www.babolat.com/us/pure-drive-gen11-unstrung/100-101552.html)";

  /** The BWF Laws of Badminton, Law 4. */
  const BWF: string =
    "BWF Laws of Badminton, Law 4.1 and 4.2.2 (https://worldbadminton.com/laws/index.html)";

  /** Butterfly's blade sizes. */
  const BUTTERFLY: string =
    "Butterfly Timo Boll ALC, a 157 x 150 mm blade, a 100 x 22 to 24 mm handle, 84 to 86 g (https://www.butterflyonline.com/butterfly-blade-specifications, https://tabletennisstore.us/products/butterfly-timo-boll-alc-offensive-table-tennis-blade)";

  /** The squash specification as third-party pages give it. */
  const WSF: string =
    "the World Squash Federation racket limits of 686 mm, 215 mm and 255 g as third-party pages give them; the WSF's own specification was searched for and could not be opened";

  /** What no source read gives. */
  const UNREAD: string =
    "no source read gives it; the makers' pages read do not state it";

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    tennis: {
      length: m(
        0.685,
        0.737,
        `${BABOLAT}, to ${ITF}: at most 73.7 cm long`,
      ),
      headWidth: m(
        0.247,
        0.292,
        `${ITF}: the hitting surface at most 29.2 cm wide; the narrower end is the ${BABOLAT} head read as an ellipse of the rule's proportions`,
      ),
      headLength: m(
        0.333,
        0.394,
        `${ITF}: the hitting surface at most 39.4 cm long; the shorter end is the ${BABOLAT} head read as an ellipse of the rule's proportions`,
      ),
      handleLength: m(0.17, 0.2, UNREAD, true),
      gripDiameter: m(
        (4 * 0.0254) / Math.PI,
        (4.5 * 0.0254) / Math.PI,
        "grip sizes 4 to 4 1/2 in round, Babolat Pure Drive Lite (https://tennisracquets.com/products/babolat-pure-drive-lite-tennis-racquet), as a diameter",
      ),
      mass: kg(0.293, 0.307, BABOLAT),
    },
    badminton: {
      length: m(
        0.673,
        0.677,
        "Yonex Astrox 10DG, 675 mm +/- 2 (https://www.badmintonbay.com/yonex-astrox-10dg-navy-turquoise-4ug5-badminton-racket.html), inside the BWF Law 4.1's 680 mm",
      ),
      headWidth: m(0.23, 0.23, `${BWF}: the frame at most 230 mm wide, the limit the model takes`),
      headLength: m(0.28, 0.28, `${BWF}: the strung area at most 280 mm long, the limit the model takes`),
      handleLength: m(0.19, 0.21, UNREAD, true),
      gripDiameter: m(
        0.08 / Math.PI,
        0.084 / Math.PI,
        "a Yonex G5 grip, 80 to 84 mm round (https://www.badmintonbay.com/yonex-astrox-10dg-navy-turquoise-4ug5-badminton-racket.html), as a diameter",
      ),
      mass: kg(
        0.08,
        0.0899,
        "Yonex weight grades 4U, 80 to 84.9 g, and 3U, 85 to 89.9 g (https://centralsports.co.uk/products/yonex-astrox-100-tour-kurenai)",
      ),
    },
    squash: {
      length: m(0.67, 0.686, WSF, true),
      headWidth: m(0.19, 0.215, WSF, true),
      headLength: m(0.25, 0.28, UNREAD, true),
      handleLength: m(0.18, 0.2, UNREAD, true),
      gripDiameter: m(0.03, 0.034, UNREAD, true),
      mass: kg(0.11, 0.255, WSF, true),
    },
    tableTennis: {
      length: m(0.257, 0.257, `${BUTTERFLY}: the blade's 157 mm and the handle's 100 mm`),
      headWidth: m(0.15, 0.15, BUTTERFLY),
      headLength: m(0.157, 0.157, BUTTERFLY),
      handleLength: m(0.1, 0.1, BUTTERFLY),
      gripDiameter: m(0.022, 0.024, BUTTERFLY),
      mass: kg(
        0.15,
        0.2,
        `${BUTTERFLY} for the blade alone; the two rubbers' mass ${UNREAD}`,
        true,
      ),
    },
  };
}