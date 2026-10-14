import {
  extrudeAutoMovieProfile,
  transformAutoMovieMesh,
} from "@automovie/engine";
import { IAutoMovieMesh } from "@automovie/interface";

import { rectangle } from "./rectangle";

/**
 * Build a centred metre-based box by extruding the rectangle profile and rotating it minus 90 degrees about X, mapping profile width/depth into the XZ plane and extrusion depth into height. The tested positive dimensions are a caller premise; production extrusion and transform own admission and normals.
 *
 * Fixed four-corner topology uses constant fixture work/output and returns a new transformed mesh. It shares product geometry construction, so parent assertions use literal box dimensions rather than treating this helper as an independent kernel oracle; no mesh cache or host resource is retained.
 */
export const slab: (
  width: number,
  height: number,
  depth: number,
) => IAutoMovieMesh = (
  width: number,
  height: number,
  depth: number,
): IAutoMovieMesh =>
  transformAutoMovieMesh(
    extrudeAutoMovieProfile({
      profile: rectangle(-width / 2, -depth / 2, width, depth),
      depth: height,
    }),
    { rotation: { x: -Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 } },
  );
