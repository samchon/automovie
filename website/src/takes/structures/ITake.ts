import type { AutoMovieHumanPolygon } from "@automovie/render";

import type { IPlaygroundTimeline } from "../../playground/structures/IPlaygroundTimeline";
import type { SceneTrack } from "../../scenes/SceneTrack";

/**
 * One composition computed in the take worker: every figure's rest bones,
 * the placements of every figure and prop at a fixed rate, and the placed
 * actions. It is plain data, so it crosses from the worker to the page and
 * draws without the motion or Human code.
 */
export interface ITake {
  /** The film's length, seconds. */
  duration: number;

  /**
   * The placements, `SceneTrack`'s layout: the figures in `figures` order,
   * then the props in `props` order, each group in its `track.orders` entry.
   */
  track: SceneTrack.ITrack;

  /**
   * The matrix, column-major, that puts a figure's own frame in the world the
   * views draw, as `@automovie/human` states it.
   */
  reflection: number[];

  /** The figures, in the composition's order. */
  figures: ITake.IFigure[];

  /** The subject ids of the props, in the track's order after the figures. */
  props: string[];

  /** Each performer's placed actions and their named instants on the film clock. */
  timeline: IPlaygroundTimeline;
}
export namespace ITake {
  /** One figure of a take. */
  export interface IFigure {
    /** The performer's subject id. */
    subject: string;

    /** Its body id, a key of `PLAYGROUND_BODIES`. */
    body: string;

    /** The body's rest bones, which the polygon man is built from. */
    bones: AutoMovieHumanPolygon.IBone[];
  }
}
