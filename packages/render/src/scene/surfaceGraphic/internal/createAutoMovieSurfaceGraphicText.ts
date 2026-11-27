import { AutoMovieEngineTypography } from "@automovie/engine";
import type {
  IAutoMovieFont,
  IAutoMovieSurfaceGraphicLayer,
  IAutoMovieTessellation,
} from "@automovie/interface";
import * as THREE from "three";

/*
 * Flat glyph geometry of one text layer on a surface face, in the surface's
 * reading frame.
 *
 * `AutoMovieEngineTypography.buildTextGeometry` lays the text out in the layer's box, in metres
 * with the box's bottom-left corner as origin, `+x` to the reader's right and
 * `+y` up, and triangulates the glyphs counter-clockwise seen from `+z`. The em
 * size is the layer's `size` times the face's depth. Each glyph point `(x, y)`
 * then lands on the face at `X = left + x` and `Z = bottom - y`, where `left`
 * and `bottom` are the box's left edge and bottom edge on the face: the face is
 * read from `+Y` with `+X` to the right and `-Z` toward the top, so the box's
 * `+y` is the face's `-Z` and the reading frame's orientation, and with it the
 * winding, is kept. Normals are `+Y`.
 *
 * A layout or glyph refusal from the engine, such as an unmapped code point or
 * a word wider than the box, propagates unchanged.
 */
export function createAutoMovieSurfaceGraphicText(
  faceWidth: number,
  faceDepth: number,
  layer: IAutoMovieSurfaceGraphicLayer.IText,
  font: IAutoMovieFont,
): THREE.BufferGeometry {
  const tessellation: IAutoMovieTessellation = AutoMovieEngineTypography.buildTextGeometry({
    font,
    text: layer.text,
    size: layer.size * faceDepth,
    box: {
      width: layer.width * faceWidth,
      height: layer.height * faceDepth,
    },
    ...(layer.align === undefined ? {} : { align: layer.align }),
    ...(layer.lineHeight === undefined ? {} : { lineHeight: layer.lineHeight }),
  });
  const left: number = (layer.x - 0.5) * faceWidth;
  const bottom: number = (layer.y + layer.height - 0.5) * faceDepth;

  const count: number = tessellation.positions.length / 3;
  const positions: Float32Array = new Float32Array(count * 3);
  const normals: Float32Array = new Float32Array(count * 3);
  for (let i: number = 0; i < count; ++i) {
    positions[3 * i] = left + tessellation.positions[3 * i]!;
    positions[3 * i + 1] = 0;
    positions[3 * i + 2] = bottom - tessellation.positions[3 * i + 1]!;
    normals[3 * i + 1] = 1;
  }
  const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geometry.setIndex(tessellation.indices);
  return geometry;
}
