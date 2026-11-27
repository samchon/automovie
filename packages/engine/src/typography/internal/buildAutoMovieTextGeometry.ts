import type {
  IAutoMovieBuildTextGeometry,
  IAutoMovieFontGlyph,
  IAutoMovieLayoutText,
  IAutoMoviePlanarRegion,
  IAutoMovieRegionTriangulation,
  IAutoMovieTessellation,
} from "@automovie/interface";

import { AutoMovieEnginePlanarRegion } from "../../geometry/AutoMovieEnginePlanarRegion";
import { layoutAutoMovieText } from "./layoutAutoMovieText";
import { regionsOfAutoMovieGlyph } from "./regionsOfAutoMovieGlyph";

/*
 * Set a text run as flat glyph triangles in its box, for lettering drawn on a
 * face.
 *
 * The run is laid out by layoutAutoMovieText; each distinct code point's
 * contours are flattened and grouped by regionsOfAutoMovieGlyph and
 * triangulated once by `AutoMovieEnginePlanarRegion.triangulate`, then
 * translated to every place the code point is set. The result lies in the
 * layout's box frame in metres, origin at the box's bottom-left corner, `+x`
 * right, `+y` up, `z = 0`, with counter-clockwise triangles and `+z` normals
 * facing the reader. Triangles cover exactly each glyph's ink: outer rings less
 * their holes.
 *
 * The same inputs always give identical buffers.
 * The layout's refusals; a glyph whose contours touch or cross,
 * or which the triangulator refuses, with the code point named.
 */
export function buildAutoMovieTextGeometry(
  props: IAutoMovieBuildTextGeometry.IProps,
): IAutoMovieTessellation {
  const tolerance: number = props.tolerance ?? TOLERANCE;
  const layout: IAutoMovieLayoutText.IResult = layoutAutoMovieText(props);
  const glyphs: Map<number, IAutoMovieFontGlyph> = new Map(
    props.font.glyphs.map(
      (glyph: IAutoMovieFontGlyph): [number, IAutoMovieFontGlyph] => [
        glyph.codePoint,
        glyph,
      ],
    ),
  );
  const shapes: Map<number, IAutoMovieRegionTriangulation[]> = new Map();
  const out: IAutoMovieTessellation = {
    positions: [],
    normals: [],
    indices: [],
  };
  for (const placed of layout.glyphs) {
    let shape: IAutoMovieRegionTriangulation[] | undefined = shapes.get(
      placed.codePoint,
    );
    if (shape === undefined) {
      const glyph: IAutoMovieFontGlyph = glyphs.get(placed.codePoint)!;
      shape = regionsOfAutoMovieGlyph(glyph, layout.scale, tolerance).map(
        (region: IAutoMoviePlanarRegion): IAutoMovieRegionTriangulation => {
          try {
            return AutoMovieEnginePlanarRegion.triangulate(region);
          } catch (error) {
            throw new Error(
              `Glyph U+${glyph.codePoint.toString(16).toUpperCase().padStart(4, "0")} "${String.fromCodePoint(glyph.codePoint)}" cannot be triangulated: ${(error as Error).message}`,
              { cause: error },
            );
          }
        },
      );
      shapes.set(placed.codePoint, shape);
    }
    for (const triangulation of shape) {
      const base: number = out.positions.length / 3;
      for (const point of triangulation.points) {
        out.positions.push(placed.x + point.x, placed.y + point.y, 0);
        out.normals.push(0, 0, 1);
      }
      for (const index of triangulation.triangles)
        out.indices.push(base + index);
    }
  }
  return out;
}

/*
 * Default chord tolerance, metres: 0.05 mm, below a pixel of any sign a frame
 * shows.
 */
const TOLERANCE: number = 0.00005;
