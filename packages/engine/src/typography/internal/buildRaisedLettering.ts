import type {
  IAutoMovieBuildTextGeometry,
  IAutoMovieFontGlyph,
  IAutoMovieLayoutText,
  IAutoMovieMesh,
  IAutoMoviePlanarRegion,
} from "@automovie/interface";

import { AutoMovieEnginePlanarRegion } from "../../geometry/AutoMovieEnginePlanarRegion";
import { layoutText } from "./layoutText";
import { regionsOfGlyph } from "./regionsOfGlyph";

/*
 * Extrude a laid-out text run into one closed mesh of raised lettering, such as
 * channel letters over a storefront or a plaque's relief.
 *
 * The run is laid out by layoutText; each distinct code point's
 * regions from regionsOfGlyph are extruded once by
 * `AutoMovieEnginePlanarRegion.extrude` and translated to every place the code
 * point is set, lifted so each letter rises from `z = 0` to `z = depth`.
 * Coordinates are the layout's box frame in metres, origin at the box's
 * bottom-left corner, `+x` right, `+y` up, `+z` toward the reader. Each letter
 * is a closed 2-manifold whose volume is its ink area times the depth; the mesh
 * carries flat normals and the extrusion's metric texture coordinates, no skin,
 * and no index shared across letters.
 *
 * The font is the decoded record: a production decodes its font with the
 * `ingest` decoder in its own code, then places this mesh as an ordinary model
 * part, which appears in every mesh pass.
 *
 * The same inputs always give identical buffers.
 * A nonpositive or non-finite depth; the layout's refusals; a
 * glyph whose contours touch or cross, or which the extrusion refuses, with
 * the code point named.
 */
export function buildRaisedLettering(
  props: IAutoMovieBuildTextGeometry.IRaisedProps,
): IAutoMovieMesh {
  if (props.depth <= 0)
    throw new Error(
      `Raised lettering depth must be finite and positive, not ${props.depth}`,
    );
  const tolerance: number = props.tolerance ?? TOLERANCE;
  const layout: IAutoMovieLayoutText.IResult = layoutText(props);
  const glyphs: Map<number, IAutoMovieFontGlyph> = new Map(
    props.font.glyphs.map(
      (glyph: IAutoMovieFontGlyph): [number, IAutoMovieFontGlyph] => [
        glyph.codePoint,
        glyph,
      ],
    ),
  );
  const solids: Map<number, IAutoMovieMesh[]> = new Map();
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const lift: number = props.depth / 2;
  for (const placed of layout.glyphs) {
    let solid: IAutoMovieMesh[] | undefined = solids.get(placed.codePoint);
    if (solid === undefined) {
      const glyph: IAutoMovieFontGlyph = glyphs.get(placed.codePoint)!;
      solid = regionsOfGlyph(glyph, layout.scale, tolerance).map(
        (region: IAutoMoviePlanarRegion): IAutoMovieMesh => {
          try {
            return AutoMovieEnginePlanarRegion.extrude({
              outer: region.outer,
              ...(region.holes === undefined ? {} : { holes: region.holes }),
              depth: props.depth,
            });
          } catch (error) {
            throw new Error(
              `Glyph U+${glyph.codePoint.toString(16).toUpperCase().padStart(4, "0")} "${String.fromCodePoint(glyph.codePoint)}" cannot be extruded: ${(error as Error).message}`,
              { cause: error },
            );
          }
        },
      );
      solids.set(placed.codePoint, solid);
    }
    for (const mesh of solid) {
      const base: number = positions.length / 3;
      for (let at: number = 0; at < mesh.positions.length; at += 3)
        positions.push(
          placed.x + mesh.positions[at]!,
          placed.y + mesh.positions[at + 1]!,
          lift + mesh.positions[at + 2]!,
        );
      normals.push(...mesh.normals!);
      uvs.push(...mesh.uvs!);
      for (const index of mesh.indices!) indices.push(base + index);
    }
  }
  return { positions, normals, uvs, indices, skin: null };
}

/*
 * Default chord tolerance, metres: 0.05 mm, below a pixel of any sign a frame
 * shows.
 */
const TOLERANCE: number = 0.00005;
