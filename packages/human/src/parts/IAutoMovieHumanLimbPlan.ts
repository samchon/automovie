import { IAutoMovieSweepSection } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanSide } from "../junction/AutoMovieHumanSide";
import { IAutoMovieHumanRingShape } from "../junction/IAutoMovieHumanRingShape";

/**
 * A limb laid out for lofting: its stations along the bone chain, its relief, and the two junction rings it opens, from which `loftAutoMovieHumanLimb` sweeps one surface.
 *
 * The stations run from the proximal ring to the distal ring. The first two and the last two belong to the junctions: the proximal ring and its collar, which repeats the ring carried a short way along the limb's axis, and at the other end the distal collar and the distal ring. Every station between carries its own section and the girth its row must measure. Positions and lengths are millimetres in the skeleton's model frame.
 *
 * The chart of the lofted surface is the sweep's own domain: `u` from 0 at the proximal ring to 1 at the distal ring by chord length of the station centres, `v` counterclockwise about the distal axis from each station's `anterior` direction. Relief is placed in station-index space, `i + t` lying `t` of the way from station `i` to station `i + 1`, so a planner that knows its stations' anatomical levels places a muscle without knowing where the loft puts its rows.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanLimbPlan {
  /** The part being lofted. */
  part: "arm" | "leg";

  /** Which limb. */
  side: AutoMovieHumanSide;

  /** The ring the part opens at its proximal end, toward the trunk, as the part opens it. */
  proximal: IAutoMovieHumanRingShape;

  /** The ring the part opens at its distal end, toward the hand or foot, as the part opens it. */
  distal: IAutoMovieHumanRingShape;

  /** Stations from the proximal ring to the distal ring, at least five. */
  stations: IAutoMovieHumanLimbPlan.IStation[];

  /** Superficial relief over the sections, applied in order. */
  relief: IAutoMovieHumanLimbPlan.IRelief[];
}
export namespace IAutoMovieHumanLimbPlan {
  /**
   * One station: a cross-section of the limb at one anatomical level.
   *
   * @author Samchon
   */
  export interface IStation {
    /** Anatomical level, for reading. */
    name: string;

    /** Where the spine passes, the origin of the section. */
    centre: IAutoMovieVector3;

    /** Unit axis of the section's plane, pointing distally. */
    axis: IAutoMovieVector3;

    /** Unit direction in the plane where the chart's `v` is 0; `v` turns from it counterclockwise about `axis`. */
    anterior: IAutoMovieVector3;

    /** The section in the station's plane, millimetres from `centre`, its first axis along `anterior` and its second along `axis × anterior`; null for a junction station, whose section is its ring's. */
    section: IAutoMovieSweepSection | null;

    /** Girth the surface keeps along the station's row, millimetres, the measured or fitted circumference there; null for a junction station. */
    girth: number | null;

    /** Vertices around the station's row, a multiple of four; neighbouring stations differ by four at most. */
    columns: number;

    /** Rows of faces from this station to the next; where the column count changes, only the row next to the narrower station changes count and all other rows keep the wider count. Ignored on the last station. */
    rows: number;
  }

  /**
   * One superficial form: a ridge or furrow along a course on the surface, its height rising and falling along it.
   *
   * Height and spread describe the form as it shows on the skin of the average adult the relief tables describe; each point also carries the subcutaneous fat over it on this person and on that adult, from which the loft shows the form sharper or softer (`traceAutoMovieHumanLimbRelief` states the rule).
   *
   * @author Samchon
   */
  export interface IRelief {
    /** Anatomical name, for reading. */
    name: string;

    /** Points of its course, at least two, in order along the limb. */
    points: IReliefPoint[];

    /** Standard deviation of the form's Gaussian profile across the course on the average adult, millimetres. */
    spread: number;
  }

  /**
   * One point of a relief's course.
   *
   * @author Samchon
   */
  export interface IReliefPoint {
    /** Position along the limb in station-index space. */
    at: number;

    /** Direction from the station's `anterior`, radians, counterclockwise about its axis. */
    angle: number;

    /** Height of the form here on the average adult, millimetres along the surface's radius, outward positive. */
    height: number;

    /** Subcutaneous fat over the form here on this person, millimetres; 0 for a form that is itself fat. */
    fat: number;

    /** Subcutaneous fat over the form here on the average adult the height and spread describe, millimetres; 0 for a form that is itself fat. */
    reference: number;
  }
}
