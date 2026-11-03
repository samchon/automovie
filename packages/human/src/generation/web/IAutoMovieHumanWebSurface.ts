import type { AutoMovieHumanHandVector } from "../hand/AutoMovieHumanHandVector";
import type { IAutoMovieHumanWeb } from "./IAutoMovieHumanWeb";
import type { IAutoMovieHumanWebChild } from "./IAutoMovieHumanWebChild";
import type { IAutoMovieHumanWebColumn } from "./IAutoMovieHumanWebColumn";

type Vec3 = AutoMovieHumanHandVector.Vec3;

/** A column away from the pinches. */
type Plain = Extract<IAutoMovieHumanWebColumn, { kind: "plain" }>;

/** The third stage of a web's build: the surface's laws, the points a row of a column takes. */
export interface IAutoMovieHumanWebSurface {
  /** A row's level in the chart of a web's child. */
  levelOf: (r: number, own: IAutoMovieHumanWebChild, web: IAutoMovieHumanWeb) => number;

  /** The row at a level of the chart of a web's child: the inverse of `levelOf`. */
  rowOf: (x: number, own: IAutoMovieHumanWebChild, web: IAutoMovieHumanWeb) => number;

  /** A margin's lip at a depth past the ring, as a share of its radius. */
  lip: (web: IAutoMovieHumanWeb, side: number, share: number) => Vec3;

  /** A column near a web at a row: the saddle's translational chart. */
  chart: (col: Plain, own: IAutoMovieHumanWebChild, r: number) => Vec3;

  /** A column away from the webs: its point at a row, between the parent's and child's copied jets. */
  plainAt: (col: Plain) => (r: number) => Vec3;
}
