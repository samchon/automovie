import type { IAutoMovieLoftRelief } from "../../../construction/IAutoMovieLoftRelief";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanConicLoft } from "../conic/IAutoMovieHumanConicLoft";

/** Nail geometry inputs and generated plate, ownership and diagnostic records. */
export namespace IAutoMovieHumanNail {
  /** Optional physical authority from an identified nail on the same person. */
  export interface ISetup {
    /** Prepare the bed inside the plate for solid attachment. */
    attached?: boolean;

    /** Original visible material boundary positions in world millimetres. */
    measured?: readonly AutoMovieVector3Tuple[];

    /** Original visible nail faces in world millimetres, for sagittal curvature. */
    measuredFaces?: readonly (readonly [
      AutoMovieVector3Tuple,
      AutoMovieVector3Tuple,
      AutoMovieVector3Tuple,
    ])[];

    /** The skin's immediate indexed neighbours of the measured plate border. */
    groove?: readonly {
      edge: readonly [AutoMovieVector3Tuple, AutoMovieVector3Tuple];
      skin: AutoMovieVector3Tuple;
    }[];

    /** Directly measured lateral reach from the nail edge into its fold, mm. */
    grooveRoom?: number;
  }

  /** The frame of the last digit segment or the plate it carries. */
  export interface IFrame {
    /** The last joint's centre, mm. */
    origin: AutoMovieVector3Tuple;

    /** Unit direction from the joint toward the tip. */
    distal: AutoMovieVector3Tuple;

    /** Unit direction out of the back of the digit, square to `distal`. */
    dorsal: AutoMovieVector3Tuple;
  }

  /** Complete skin of a digit before a nail relief is applied. */
  export interface ISkin {
    /**
     * The skin's point at a station and a phase of the digit's chart, mm in the
     * figure's frame. Plate measurements use the interval from first to tip.
     * The relief alone may also read the preceding chart supplied by proximal.
     */
    point: (station: number, phase: number) => readonly number[];

    /** The first station of the fitted distal chart, mm. */
    first: number;

    /** The station of the digit's tip, where its skin closes, mm. */
    tip: number;

    /**
     * The point reader's exact bilinear chart samples in figure-world mm, when
     * it is backed by such a grid. Rows step equally from first to tip,
     * inclusive. Columns start at phase zero and step equally through a turn
     * without repeating the initial column. Interpolation wraps that last
     * interval to column zero. The grid and point callback must read the same
     * surface to kernel arithmetic precision.
     */
    grid?: readonly (readonly AutoMovieVector3Tuple[])[];

    /**
     * Ordered rings on the same owning skin from its actual first station up to
     * the fitting chart. The first ring of the fit is shared and appears only
     * in the fitting grid. Rings use that chart's same unrepeated phase
     * columns. When supplied, point also evaluates this piecewise bilinear
     * chart.
     */
    proximal?: readonly {
      /** Station on the owning skin chart in millimetres. */
      station: number;

      /** Positions on the original skin ring, in figure-world millimetres. */
      ring: readonly AutoMovieVector3Tuple[];
    }[];
  }

  /** Plate proportions for a measured or explicitly estimated digit class. */
  export interface IProportions {
    /**
     * The plate's width between the lateral folds over the digit's breadth
     * across its last joint.
     */
    width: number;

    /**
     * The plate's width over its length from the proximal fold to the digit's
     * tip.
     */
    aspect: number;

    /** The plate's thickness, mm: how far its free edge stands over the skin. */
    thickness: number;

    /**
     * How far the plate lies under the proximal fold's skin where it leaves the
     * fold, mm.
     */
    fold: number;

    /**
     * The radius of the plate's upper face at its crown over the plate's width,
     * as a gauge laid across the plate's open middle reads it: it holds midway
     * between the fold and the free edge. `null` where none is published for
     * the digit, and the plate is then its bed's own arc all along.
     */
    radius: number | null;

    /**
     * The radius the proximal fold turns on at its apex, in the plate's plane,
     * over the plate's width.
     */
    lunula: number;

    /**
     * The farthest the plate's edges stand under its crown midway along it,
     * over the digit's height there.
     */
    wrap: number;
  }

  /** Measurements and convergence observations from one plate calculation. */
  export interface IReadings {
    /** The digit's breadth across the last joint, mm. */
    breadth: number;

    /**
     * The distance from the last joint to the tip along the segment's distal
     * direction, mm.
     */
    tip: number;

    /** The plate's width, mm, after `narrowed`. */
    width: number;

    /**
     * The share of the asked width the plate keeps where its edges would wrap
     * past `IProportions.wrap`; 1 where they do not.
     */
    narrowed: number;

    /**
     * The roll of the nail's frame about the distal direction from the
     * segment's dorsal, radians.
     */
    roll: number;

    /**
     * The pitch of the nail's frame from the segment's distal direction,
     * radians, positive toward the dorsal side.
     */
    pitch: number;

    /**
     * Where the proximal fold and the free edge stand along the nail's distal
     * axis from the joint, mm.
     */
    span: [number, number];

    /**
     * The radius of the plate's upper face at its crown, least and greatest
     * over the visible plate, mm.
     */
    radius: [number, number];

    /**
     * How far the plate's edges lie under the skin's, least and greatest over
     * the visible plate, mm; negative where an edge stands over the skin.
     */
    under: [number, number];

    /**
     * The plate's sagitta over the chord between its edges, least and greatest
     * over the visible plate, mm.
     */
    sagitta: [number, number];

    /**
     * Largest absolute height requested of either net's three outer rows or
     * columns, where the engine requires zero, mm.
     */
    clipped: number;

    /**
     * Where `clipped` stands in the nail's frame: `[along the distal axis from
     * the joint, aside]`, mm.
     */
    clippedAt: [number, number];

    /**
     * The control `clipped` was asked of: `[0 the bed or 1 the strip, its row,
     * its column, the net's rows, the net's columns]`.
     */
    clippedIn: [number, number, number, number, number];

    /**
     * How many passes the frame's fit took to its fixed point, each of which
     * reads the bed's stations anew.
     */
    passes: number;

    /**
     * What each pass of the frame's fit still moved: `[the roll's turn, rad;
     * the axis's slope; the axis's shift, mm]` by pass.
     */
    residuals: [number, number, number][];

    /**
     * The mean levelling turn left at the roll chosen, rad: nothing where the
     * skin's two edges stand level there on the mean.
     */
    misfit: number;

    /**
     * The roll's objective at the roll chosen: the squared misfit over the
     * skin's error and the squared roll over the prior's spread.
     */
    objective: number;

    /**
     * The share of an applied roll that the levelling reading registers at the
     * roll chosen: 1 on a flat back, 0 on a round one.
     */
    conditioning: number;

    /**
     * The mean levelling turn against the roll from the segment's frame, on the
     * last pass's rings: `[roll, turn]`, rad, at 25 rolls across half a turn.
     */
    levelling: [number, number][];
  }

  /** The plate, skin reliefs and ownership data produced for one digit. */
  export interface INail {
    /** The plate, a family in the figure's frame. */
    plate: IAutoMovieHumanConicLoft.IFamily;

    /** The bed, a relief of the digit's family. */
    bed: IAutoMovieLoftRelief;

    /**
     * The free edge's strip, a second relief of the digit's family, fine along
     * the digit, that adds the edge's step to the bed's slope.
     */
    strip: IAutoMovieLoftRelief;

    /** The nail's own frame. */
    frame: IFrame;

    /**
     * The outline's middle on the digit's chart, `[station, phase]`, mm and
     * radians, and its half extents there along the station and the phase: the
     * ellipse a declared loop is written about.
     */
    outline: { centre: [number, number]; semi: [number, number] };

    /** The plate's outline in the nail's frame, which `owns` reads. */
    plan: IPlan;

    /** The readings. */
    readings: IReadings;

    /**
     * The digit's dorsal skin as the nail sees it, at each of the plate's
     * stations in the nail's frame: the distance along, the middle of the
     * skin's breadth, the skin's height there, the plate's half width, and the
     * turn about the long axis that would level the skin's two edges at that
     * station alone, radians.
     */
    profile: {
      along: number;
      middle: number;
      height: number;
      edge: number;
      turn: number;
    }[];
  }

  /** The outline of the plate in its own distal and transverse axes. */
  export interface IPlan {
    /** Where the proximal fold's apex and the free edge's stand along. */
    span: [number, number];

    /**
     * The proximal half ellipse: where its centre stands along, its half axis
     * along and its half axis across.
     */
    bend: [number, number, number];

    /**
     * The free edge across the plate: `[aside, along]` at offsets from one edge
     * to the other, between which it runs straight.
     */
    front: [number, number][];

    /**
     * The plate's stations along and its half width at each, between which the
     * half width runs straight.
     */
    edges: [number, number][];

    /**
     * The dorsal height of the plate's back, under which a point is not the
     * nail's.
     */
    floor: number;
  }
}
