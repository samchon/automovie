import type { IAutoMovieConstructionBandProfile } from "./IAutoMovieConstructionBandProfile";
import type { IAutoMovieConstructionNode } from "./IAutoMovieConstructionNode";
import type { IAutoMovieConstructionPortLoop } from "./IAutoMovieConstructionPortLoop";

/**
 * A part attached at a known port of a host face: a closed port curve on the host's chart, an ellipse about a published centre, is cut out of the host, and a band spans from that curve to the part's ring at `rail` (an arm on its armscye, a branch on a stem's side). The parent owns the port loop and the region inside it; the part keeps its stations beyond the rail.
 *
 * The port curve at clock `c` in `[0, 2 pi)` is the chart point `(centre[0] + semi[0] cos c, centre[1] + sense semi[1] sin c)`: station in metres, phase in radians. The band is the engine's join strip between two ribbons: the host surface's own 2-jet across the port curve, toward the curve's centre (the chart direction `(-semi[0] cos c, -sense semi[1] sin c)`), and the part's own 2-jet at its rail toward its kept side, both scaled by one factor at which no column turns back along its chord. The band is G2 to the host along the port curve and G2 to the part along its rail. A failed premise leaves the part, the band and the host's port as they were, with one diagnostic naming the port.
 *
 * Engine admission: `hostFace` a view part of the host's subtree and `partFace` one of the part's; the `band` name unique in the tree; `count` a multiple of 4 of at least 8; `rows` a positive integer; `rail` positive; `rails`, when given, at least 3 finite positive distances; the loop's centre finite, both semi-axes positive and the phase semi-axis under pi; a loop's shape, when given, `count` finite positive shares; each profile as `IAutoMovieConstructionBandProfile` states.
 */
export interface IAutoMovieConstructionPort {
  /** Discriminator. */
  type: "port";

  /** The port's name, unique in its tree, named in diagnostics. */
  name: string;

  /** The solid whose face carries the port. */
  host: IAutoMovieConstructionNode;

  /** The host face the port curve lies on: a view part's name in the host's subtree. */
  hostFace: string;

  /** The port curve on the host face's chart. */
  loop: IAutoMovieConstructionPortLoop;

  /** The band's face and chain name, unique in the tree. */
  band: string;

  /** The attached part's subtree. */
  part: IAutoMovieConstructionNode;

  /** The part face the band reaches: a view part's name in the part's subtree. */
  partFace: string;

  /** The part face's end that faces the host: the band replaces the part's surface between that end and the rail. */
  partEnd: "bottom" | "top";

  /** The rail's distance from that end into the part along its station, metres, positive: the part keeps the stations beyond it. Not read when `rails` is given. */
  rail: number;

  /**
   * The rail as a closed curve round the part instead of one station: its distance from that end at the part phases `2 pi j / m`,
   * `j = 0 .. m - 1`, metres, positive, joined round the part by the periodic cubic spline through them. The part keeps, at each phase,
   * the stations beyond the curve. It serves a part whose root does not lie in one section plane, as a nose's does: its wings leave the
   * face by the crease round them, far back, while its middle meets the lip far forward. Absent, the rail is the one station `rail`.
   */
  rails?: number[];

  /**
   * How the part's rail is matched to the port curve column by column. `angle` (the default): the rail point at the curve point's angle
   * about the rail ring's centroid, which both curves must turn round once monotonically. `length`: the first column by that angle, every
   * other at the same share of the rail's length round it as the column's of the port curve's, so neither need be star-shaped about the
   * centroid, as a nose's rail is not where it runs back behind each nostril and its underside is lifted onto the skin.
   */
  correspondence?: "angle" | "length";

  /**
   * How far each column's ribbons reach into the band. `common` (the default): every column's ribbons are scaled by one factor, the
   * largest at which no column turns back along its chord, so the hardest column sets the reach of all. `column`: each column takes its
   * own factor from a field smooth along the loop that stays under every column's own largest, so a column where the port's loop and the
   * part's ring disagree shortens only its neighbourhood and the band elsewhere turns from the host to the part over its whole length.
   * Either way the band stays G2 to both sides.
   */
  ribbons?: "common" | "column";

  /** Interpolate one measured point of a cross meridian without changing the boundary jets. */
  meridian?: IAutoMovieConstructionPort.IMeridian;

  /**
   * Cross profiles of the band: over windows of its loop clock, the band is carried in along its own normal by a depth that is a function of
   * its cross share, so it can leave the host into a hollow and come up again onto the part, as a profile blend's interior cross sections
   * shape it between its rails. Absent, the band is the plain blend of the two sides' 2-jets.
   */
  profiles?: IAutoMovieConstructionBandProfile[];

  /** Columns of the band round its loop, a multiple of 4 of at least 8. */
  count: number;

  /** Grid stations of the band face across its span, at least 1. */
  rows: number;
}

export namespace IAutoMovieConstructionPort {
  /** A clock and two independent world coordinates of its cross-meridian guide. */
  export interface IMeridian {
    /** Angle in radians on the port's own loop. */
    clock: number;

    /** One world coordinate, in metres, that locates the guide on the original meridian. */
    section: { axis: 0 | 1 | 2; value: number };

    /** The guide's required value, in metres, in an independent world direction. */
    through: { axis: 0 | 1 | 2; value: number };
  }
}
