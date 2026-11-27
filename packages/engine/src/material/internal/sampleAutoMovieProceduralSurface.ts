import type {
  IAutoMovieColor,
  IAutoMovieProceduralSurface,
  IAutoMovieSampleProceduralSurface,
} from "@automovie/interface";

import { autoMovieProceduralPattern } from "./autoMovieProceduralPattern";
import { autoMovieProceduralPieceOffset } from "./autoMovieProceduralPieceOffset";

/*
 * The CPU reference of a procedural surface: its base colour, roughness and
 * height at one sample, as the renderer's fragment shader computes them.
 *
 * Without `surface.piece` the sample is the object-space point itself. With it,
 * the piece's UV0 maps through the occurrence transform into sheet turns,
 * `diag(scale) · R(−rotationDeg) · uv + offset`, then into metres by the tile
 * lengths; the third coordinate is the normal offset, and a `module` piece adds
 * `autoMovieProceduralPieceOffset` of its occurrence id. The pattern value of
 * `autoMovieProceduralPattern` at that point interpolates the colour pair and
 * the roughness pair, and times `relief` gives the height.
 *
 * Every step is a fixed function of the surface and the sample, so the same
 * input gives bitwise-equal output on every run. The surface is taken as
 * admitted by engine model admission. Throws when the sample form does not
 * match the surface (a point for a piece, or a UV for a surface without one) or
 * when a sample coordinate is not finite.
 */
export function sampleAutoMovieProceduralSurface(
  props: IAutoMovieSampleProceduralSurface.IProps,
): IAutoMovieSampleProceduralSurface.IResult {
  const surface: IAutoMovieProceduralSurface = props.surface;
  const point: [number, number, number] = samplePoint(props);
  const value: number = autoMovieProceduralPattern(surface, point);
  const [low, high]: [IAutoMovieColor, IAutoMovieColor] = surface.colors;
  const color: IAutoMovieColor = {
    r: low.r + value * (high.r - low.r),
    g: low.g + value * (high.g - low.g),
    b: low.b + value * (high.b - low.b),
    a: null,
    hex: null,
  };
  return {
    color,
    roughness:
      surface.roughness.atZero +
      value * (surface.roughness.atOne - surface.roughness.atZero),
    height: value * surface.relief,
    value,
  };
}

/*
 * The sample point in the surface's sampling space, metres.
 */
function samplePoint(
  props: IAutoMovieSampleProceduralSurface.IProps,
): [number, number, number] {
  const piece: IAutoMovieProceduralSurface.IPiece | undefined =
    props.surface.piece;
  if ("point" in props) {
    if (piece !== undefined)
      throw new Error(
        "a procedural surface with a piece samples a piece UV and normal offset, not a point",
      );
    return [props.point.x, props.point.y, props.point.z];
  }
  if (piece === undefined)
    throw new Error(
      "a procedural surface without a piece samples an object-space point, not a UV",
    );
  const {
    offset,
    scale,
    rotationDeg,
  }: IAutoMovieProceduralSurface.IPiece["transform"] = piece.transform;
  const angle: number = (-rotationDeg * Math.PI) / 180;
  const cosine: number = Math.cos(angle);
  const sine: number = Math.sin(angle);
  const u: number = props.uv.u;
  const v: number = props.uv.v;
  const sheet: [number, number, number] = [
    (scale.x * (cosine * u - sine * v) + offset.x) * piece.tile.u,
    (scale.y * (sine * u + cosine * v) + offset.y) * piece.tile.v,
    props.offset,
  ];
  if (piece.sheet === "face") return sheet;
  const shift: [number, number, number] = autoMovieProceduralPieceOffset(
    props.surface.seed,
    piece.transform.id,
    props.surface.scale,
  );
  return [sheet[0] + shift[0], sheet[1] + shift[1], sheet[2] + shift[2]];
}
