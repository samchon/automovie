import type {
  IAutoMovieMeasureModelCrossings,
  IAutoMovieMesh,
  IAutoMovieMeshCrossing,
  IAutoMovieModel,
  IAutoMovieModelCrossing,
  IAutoMovieModelPart,
} from "@automovie/interface";

import { autoMovieModelPartMatrices } from "../../autoMovieModelPartMatrices";
import { AutoMovieEngineMeshCrossingQuery } from "../mesh-crossing/AutoMovieEngineMeshCrossingQuery";
import { placeAutoMovieModelPartMesh } from "./placeAutoMovieModelPartMesh";
import { realizeAutoMovieGeometry } from "./realizeAutoMovieGeometry";

/**
 * Report every pair of a model's mesh parts whose surfaces cross, measured
 * where the parts actually sit in the model's frame.
 *
 * Each mesh part is first carried into the model frame by its own transform
 * and, when attached to a bone the rest pose resolves, by that bone's rest
 * placement, the placement `autoMovieModelPartMatrices` owns; a part with
 * neither keeps its coordinates exactly. Bicubic recipes use the canonical
 * engine's retained finite mesh, including declared partial output; primitives
 * and unrecognized geometry remain outside this mesh crossing query. A pair
 * appears once, in model part order, only when at least one triangle on either
 * side is crossed, with each side's crossed triangle count and their combined
 * coplanar count. Touching is not crossing: the underlying
 * `AutoMovieEngineMeshCrossingQuery.measure` test is strict, so shells meeting
 * along a seam do not report.
 *
 * An empty result does not mean a healthy model, nor a full one a broken one. A
 * layered character rests with shells inside each other on purpose: the eyeball
 * inside the lid, lashes rooted in skin, the tongue against the teeth. What
 * carries information is the change from a rest pose, so a caller measures its
 * own rest pose once and compares. The report is geometry, not acceptance:
 * crossed triangles hidden inside a closed shell and visible once it opens look
 * the same here, and that judgement stays with rendered review.
 *
 * `withinParts` also measures each part against itself, adding before that
 * part's pairs one entry whose `part` and `other` are both that part, counting
 * its triangles that another triangle of the same part crosses. That is for a
 * continuous skin partitioned into segments, where a fold swallowing its own
 * crease is exactly the penetration the partition exists to find; the same
 * strict rules apply, so a triangle against itself and neighbours sharing an
 * edge or corner without folding are touching. Throws, naming the part, on a
 * mesh part whose index buffer is malformed, and passes on the crossing
 * measure's own refusals.
 *
 * @param model A built model, whatever composed it.
 * @param options `withinParts` also counts each part against itself.
 * @returns One entry per crossing pair, empty when nothing crosses.
 */
export function measureAutoMovieModelCrossings(
  model: IAutoMovieModel,
  options: IAutoMovieMeasureModelCrossings.IOptions = {},
): IAutoMovieModelCrossing[] {
  const matrices: Map<IAutoMovieModelPart, number[] | null> =
    autoMovieModelPartMatrices(model);
  const parts: IPlacedPart[] = [];
  for (const part of model.parts) {
    if (part.geometry.type !== "mesh" && part.geometry.type !== "bicubic-atlas")
      continue;
    const mesh: IAutoMovieMesh = placeAutoMovieModelPartMesh(
      realizeAutoMovieGeometry(part.geometry).mesh,
      matrices.get(part) ?? null,
      `model crossing part "${part.id}"`,
    );
    parts.push({ id: part.id, mesh, ...bounds(mesh) });
  }
  const contacts: IAutoMovieModelCrossing[] = [];
  for (let first: number = 0; first < parts.length; first++) {
    const here: IPlacedPart = parts[first]!;
    if (options.withinParts === true) {
      const own: IAutoMovieMeshCrossing[] =
        AutoMovieEngineMeshCrossingQuery.measure(here.mesh, here.mesh);
      if (own.length > 0)
        contacts.push({
          part: here.id,
          other: here.id,
          triangles: own.length,
          otherTriangles: own.length,
          coplanar: own.filter(
            (entry: IAutoMovieMeshCrossing): boolean => entry.coplanar,
          ).length,
        });
    }
    for (let second: number = first + 1; second < parts.length; second++) {
      const there: IPlacedPart = parts[second]!;
      if (
        [0, 1, 2].some(
          (axis: number): boolean =>
            here.high[axis]! < there.low[axis]! ||
            here.low[axis]! > there.high[axis]!,
        )
      )
        continue;
      const ours: IAutoMovieMeshCrossing[] =
        AutoMovieEngineMeshCrossingQuery.measure(here.mesh, there.mesh);
      const theirs: IAutoMovieMeshCrossing[] =
        AutoMovieEngineMeshCrossingQuery.measure(there.mesh, here.mesh);
      if (ours.length === 0 && theirs.length === 0) continue;
      contacts.push({
        part: here.id,
        other: there.id,
        triangles: ours.length,
        otherTriangles: theirs.length,
        coplanar:
          ours.filter(
            (entry: IAutoMovieMeshCrossing): boolean => entry.coplanar,
          ).length +
          theirs.filter(
            (entry: IAutoMovieMeshCrossing): boolean => entry.coplanar,
          ).length,
      });
    }
  }
  return contacts;
}

/** One mesh part in the model frame with its box. */
interface IPlacedPart {
  /** Part id. */
  id: string;

  /** The part's mesh with positions in the model frame. */
  mesh: IAutoMovieMesh;

  /** Componentwise minimum of the placed positions. */
  low: number[];

  /** Componentwise maximum of the placed positions. */
  high: number[];
}

/** The componentwise extrema of a mesh's positions. */
const bounds: (mesh: IAutoMovieMesh) => {
  low: number[];
  high: number[];
} = (mesh: IAutoMovieMesh): { low: number[]; high: number[] } => {
  const low: number[] = [Infinity, Infinity, Infinity];
  const high: number[] = [-Infinity, -Infinity, -Infinity];
  for (let at: number = 0; at < mesh.positions.length; at += 3)
    for (let axis: number = 0; axis < 3; axis++) {
      low[axis] = Math.min(low[axis]!, mesh.positions[at + axis]!);
      high[axis] = Math.max(high[axis]!, mesh.positions[at + axis]!);
    }
  return { low, high };
};
