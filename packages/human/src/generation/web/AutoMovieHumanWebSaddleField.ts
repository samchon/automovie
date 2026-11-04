import { AutoMovieHumanHandVector } from "../hand/AutoMovieHumanHandVector";
import { AutoMovieHumanWebSaddleQuads } from "./AutoMovieHumanWebSaddleQuads";
import type { IAutoMovieHumanWeb } from "./IAutoMovieHumanWeb";
import type { IAutoMovieHumanWebChild } from "./IAutoMovieHumanWebChild";
import type { IAutoMovieHumanWebColumn } from "./IAutoMovieHumanWebColumn";
import type { IAutoMovieHumanWebSurface } from "./IAutoMovieHumanWebSurface";

type Vec3 = AutoMovieHumanHandVector.Vec3;
const { sub, plus: add, scale, smooth }: typeof AutoMovieHumanHandVector = AutoMovieHumanHandVector;

/** A column away from the pinches. */
type Plain = Extract<IAutoMovieHumanWebColumn, { kind: "plain" }>;

/**
 * A web's skin beside one child on one side of the web as one continuous
 * surface, and the two seam patches that carry it about the crest
 * (`AutoMovieHumanWebSaddleQuads`).
 *
 * The skin at a chart place `(x, y)` (the level and the distance from the
 * pinch, in margin radii) is the web's own blend at a column there: the plain
 * column's quintic Hermite between the parent's and the child's jets, drawn
 * to the saddle's translational chart by the weight `1 - smooth(y / blend)`,
 * the same law the mesh's vertex columns take, here at any `y` through the
 * continuous column law the child publishes beside the web
 * (`IAutoMovieHumanWebChild.beside`). Its edges are the owners' own: at
 * `x = -1` the parent's ring, at the section's level the child's section, at
 * `y = 0` the lip and the child's own column. Read in branch coordinates
 * `x = u^2 - v^2`, `y = 2 u v`, it is smooth up to the crest.
 *
 * The patches end at the fade column, {@link REACH} margin radii from the
 * pinch or short of the arc's middle, where the column law passes to the
 * next web, whichever is nearer; their sides are the surface's own, so past
 * the fade column the mesh's columns continue it.
 */
export namespace AutoMovieHumanWebSaddleField {
  /** What the field reads. */
  export interface IInput {
    /** Name in errors. */
    name: string;

    /** The web. */
    web: IAutoMovieHumanWeb;

    /** The child's own column at the web. */
    own: IAutoMovieHumanWebChild;

    /** The column law beside the web on this side: the column at a chart distance from the pinch. */
    law: (y: number) => Plain;

    /** The greatest chart distance the law serves on this side, margin radii. */
    reach: number;

    /** The web's surface laws. */
    surface: IAutoMovieHumanWebSurface;

    /** Margin radii over which the mesh's columns blend from the chart to the plain law. */
    blend: number;
  }

  /** A child's saddle on one side of a web, ready to place mesh points. */
  export interface ISaddle {
    /** The fade column's chart distance from the pinch, margin radii: points nearer are the patches'. */
    fade: number;

    /** The patches' point at a chart place, `y` from 0 to `fade`. */
    place: (x: number, y: number) => Vec3;
  }

  /**
   * The saddle, or none where the law serves too short a stretch beside the
   * web for a patch.
   *
   * @param input What the field reads.
   */
  export function of(input: IInput): ISaddle | null {
    const fade: number = Math.min(REACH, SHORT * input.reach);
    if (!(fade > LEAST)) return null;

    // The blend at a chart place, as the mesh's columns take it.
    const at = (x: number, y: number): Vec3 => {
      const col: Plain = input.law(y);
      const r: number = input.surface.rowOf(x, input.own, input.web);
      const plain: Vec3 = input.surface.plainAt(col)(r);
      const w: number = 1 - smooth(Math.abs(y) / input.blend);

      return w === 0 ? plain : add(plain, scale(sub(input.surface.chart(col, input.own, r), plain), w));
    };
    const chart: AutoMovieHumanWebSaddleQuads.IChart = {
      surface: (u: number, v: number): Vec3 => at(u * u - v * v, 2 * u * v),
      bottom: input.own.depth / input.web.rho,
      fade,
    };
    const patches: AutoMovieHumanWebSaddleQuads.IPatches = AutoMovieHumanWebSaddleQuads.of(input.name, chart);

    return { fade, place: (x: number, y: number): Vec3 => AutoMovieHumanWebSaddleQuads.place(chart, patches, x, y) };
  }
}

/**
 * The fade column's farthest chart distance from the pinch, margin radii:
 * inside the lip's own domain, where the ring's corner keeps `v^2 <= 2`
 * (a fade of at most `sqrt(8)`).
 */
const REACH: number = 2.5;

/** Share of the law's stretch the patches may take, so the fade column stays short of the arc's middle. */
const SHORT: number = 0.9;

/** Least fade distance, margin radii, for which a patch is drawn. */
const LEAST: number = 0.25;
