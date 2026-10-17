import {
  IAutoMovieSubdivisionCage,
  IAutoMovieSubdivisionSurface,
  evaluateSubdivisionLevel,
  fitAutoMovieSubdivisionRegions,
} from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanCage } from "./IAutoMovieHumanCage";

/**
 * Generate the hands and upper-trunk regions on the joined subdivision domain.
 *
 * Part generators carry their authored samples, actual limit-equation mask
 * and coarse-control anchors into the joined cage. Region names select source
 * face sets; the generic engine owns support collars, refinement, the frozen
 * physical bending objective and exact equations. All clinical planes,
 * anatomy and source measurements remain with the part generators.
 *
 * Two fitting refinements are also the Human profile's L2 render grid; higher
 * render levels refine that completed domain. A fitting cage requires levels
 * 2–6. Ordinary cages without fitting metadata keep their existing 1–6 path.
 * This operation does not certify intersections, measurement accuracy after
 * displacement, or pose range. The returned generating controls and source
 * parameters are used directly by both render and construction consumers.
 */
export function fitAutoMovieHumanCage(props: {
  source: IAutoMovieHumanCage;
  cage: IAutoMovieSubdivisionCage;
  levels: number;
}): IAutoMovieSubdivisionSurface | null {
  const groups: Map<string, Set<number>> = new Map();
  props.source.faces.forEach(
    (face: IAutoMovieHumanCage.IFace, f: number): void => {
      if (face.fitting === undefined) return;
      let group: Set<number> | undefined = groups.get(face.fitting);
      if (group === undefined) {
        group = new Set();
        groups.set(face.fitting, group);
      }
      group.add(f);
    },
  );
  if (groups.size === 0) return null;
  const metres: (point: IAutoMovieVector3) => [number, number, number] = (
    point: IAutoMovieVector3,
  ): [number, number, number] => [
    point.x / 1000,
    point.y / 1000,
    point.z / 1000,
  ];
  const regions: Parameters<
    typeof fitAutoMovieSubdivisionRegions
  >[0]["regions"] = [...groups.values()].map(
    (
      faces: Set<number>,
    ): Parameters<
      typeof fitAutoMovieSubdivisionRegions
    >[0]["regions"][number] => {
      const vertices: Set<number> = new Set(
        [...faces].flatMap(
          (f: number): number[] => props.source.faces[f]!.vertices,
        ),
      );
      const samples: Map<number, [number, number, number]> = new Map();
      const limitTargets: Map<number, [number, number, number]> = new Map();
      const anchors: Set<number> = new Set();
      for (const i of vertices) {
        const value: IAutoMovieHumanCage.IVertex["fitting"] =
          props.source.vertices[i]!.fitting;
        if (value === undefined)
          throw new Error(
            `fitting region has no source constraints at vertex ${i}`,
          );
        samples.set(i, metres(value.sample));
        if (value.target !== null) limitTargets.set(i, metres(value.target));
        if (value.anchor) anchors.add(i);
      }
      return { faces, samples, limitTargets, anchors };
    },
  );
  const fitted: ReturnType<typeof fitAutoMovieSubdivisionRegions> =
    fitAutoMovieSubdivisionRegions({
      cage: props.cage,
      regions,
      levels: props.levels,
    });
  const surface: IAutoMovieSubdivisionSurface = evaluateSubdivisionLevel(
    fitted.level,
  );
  for (const region of regions) {
    let extent: number = 0;
    for (let axis: number = 0; axis < 3; axis++) {
      let low: number = Infinity;
      let high: number = -Infinity;
      for (const point of region.samples.values()) {
        low = Math.min(low, point[axis]!);
        high = Math.max(high, point[axis]!);
      }
      extent = Math.max(extent, high - low);
    }
    // Retain the original network fitter's maximum residual of one millionth
    // of region extent, checked on the final joined limit rather than status.
    const tolerance: number = 1e-6 * extent;
    for (const [i, target] of region.limitTargets) {
      const error: number = Math.hypot(
        ...target.map(
          (value: number, axis: number): number =>
            surface.limitPositions[3 * i + axis]! - value,
        ),
      );
      if (!(error <= tolerance))
        throw new Error(
          `joined generating fit misses its source target at ${i}: ${error} metres`,
        );
    }
    if (!(fitted.maximumEqualityError <= tolerance))
      throw new Error(
        `joined generating equality residual exceeds ${tolerance} metres`,
      );
  }
  return surface;
}
