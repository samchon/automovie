import type { IAutoMovieColor } from "../color/IAutoMovieColor";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieProceduralSurface } from "./IAutoMovieProceduralSurface";

/**
 * Input and result of `sampleAutoMovieProceduralSurface`, the engine's CPU
 * reference of a procedural surface, which the renderer's fragment shader
 * mirrors.
 */
export namespace IAutoMovieSampleProceduralSurface {
  /**
   * Where to sample: an object-space point for a surface without `piece`, or a
   * piece's UV0 and normal offset for a surface with one. The engine throws
   * when the form does not match the surface.
   */
  export type IProps = IObject | IPiece;

  /** A sample of a surface that has no `piece`. */
  export interface IObject {
    /** The admitted surface. */
    surface: IAutoMovieProceduralSurface;

    /** Object-space bind-pose position in metres, finite. */
    point: IAutoMovieVector3;
  }

  /** A sample of one pattern piece's surface. */
  export interface IPiece {
    /** The admitted surface, which carries `piece`. */
    surface: IAutoMovieProceduralSurface;

    /** The piece mesh's UV0 at the point, finite. */
    uv: {
      /** U coordinate. */
      u: number;

      /** V coordinate. */
      v: number;
    };

    /**
     * The point's offset along its surface normal in metres, `dot(position,
     * normal)` in object space at bind pose, finite.
     */
    offset: number;
  }

  /** The surface at the sample point. */
  export interface IResult {
    /** Linear base colour, interpolated between the surface's two colours. */
    color: IAutoMovieColor;

    /** Roughness, interpolated between the surface's two roughness values. */
    roughness: number;

    /** Height above the base surface in metres, `value × relief`. */
    height: number;

    /** The kind's pattern value within [0, 1]. */
    value: number;
  }
}
