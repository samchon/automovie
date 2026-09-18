import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";

import { measureAutoMovieMeshCrossings } from "./meshIntersection";

/**
 * Two parts of one built model whose surfaces pass through each other.
 *
 * Identities are the model's own part identities, so a report names the same
 * things the exporter and an editor do. Both directions are counted because
 * they answer different questions: how much of a lip is compromised is not how
 * much of the tooth row is, and a caller repairing one needs its own side.
 *
 * `coplanar` separates the pairs that lie flat against each other from the ones
 * that pierce. Flat contact is what adjacent shells do when they are merely
 * touching, so counting it as piercing would make a resting pose look broken.
 *
 * @author Samchon
 */
export interface IAutoMovieModelCrossing {
  /** Part whose triangles are counted in `triangles`. */
  part: string;
  /** The other part of the pair, counted in `otherTriangles`. */
  other: string;
  /** Triangles of `part` that geometry of `other` crosses. */
  triangles: number;
  /** Triangles of `other` that geometry of `part` crosses. */
  otherTriangles: number;
  /** Crossings on either side that lie flat rather than piercing. */
  coplanar: number;
}

const bounds = (mesh: IAutoMovieMesh): { low: number[]; high: number[] } => {
  const low = [Infinity, Infinity, Infinity];
  const high = [-Infinity, -Infinity, -Infinity];
  for (let at = 0; at < mesh.positions.length; at += 3)
    for (let axis = 0; axis < 3; axis++) {
      low[axis] = Math.min(low[axis], mesh.positions[at + axis]);
      high[axis] = Math.max(high[axis], mesh.positions[at + axis]);
    }
  return { low, high };
};

/**
 * Report every pair of a model's parts whose surfaces cross each other.
 *
 * An empty result does not mean a healthy model and a full one does not mean a
 * broken one. A layered character rests with its shells inside each other on
 * purpose: measured on the shipped connected face, the neutral pose crosses on
 * six pairs and 2,079 triangles, because the eyeball sits inside the lid, the
 * lashes are rooted in skin and the tongue lies against the teeth. Reading any
 * of that as a defect would condemn the asset for being built correctly.
 *
 * What carries information is the change from a rest pose. On that same face
 * the skin and the tooth row do not cross at rest or at a quarter open, and do
 * from half open onward; that pair appearing is the finding, not the 2,079 that
 * were always there. So a caller measures its own rest pose once and compares,
 * rather than asking this for a verdict it cannot give.
 *
 * A pair appears once, in model part order, and only when at least one triangle
 * on one side is crossed. Touching is not crossing: shells meeting along a seam
 * share vertices and edges by construction, and the underlying test is strict
 * so a seam does not read as a collision.
 *
 * What this reports is geometry, not acceptance. Crossed triangles hidden
 * inside a closed shell are invisible in that frame and visible the moment it
 * opens, and this cannot tell those apart; that judgement stays with the
 * rendered review. Parts whose geometry is not a mesh are skipped, and parts
 * whose bounds are disjoint are rejected before any triangle is compared, so
 * cost follows how much the model actually overlaps itself. That cost is real:
 * the connected face, at about 46,000 triangles across seven parts, takes a
 * couple of seconds, which is a deliberate check rather than something to run
 * on every keystroke.
 *
 * @param model A built model, whatever composed it.
 * @returns One entry per crossing pair, empty when nothing crosses.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Judges the result of composing operations by topology rather than by whether each operation reported success.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Reports the crossing by the part identities the model already carries, so the finding maps onto the buffers a caller owns.
 */
export function measureAutoMovieModelCrossings(
  model: IAutoMovieModel,
): IAutoMovieModelCrossing[] {
  const parts = model.parts
    .filter((part) => part.geometry.type === "mesh")
    .map((part) => {
      const mesh = (part.geometry as { type: "mesh"; mesh: IAutoMovieMesh })
        .mesh;
      return { id: part.id, mesh, ...bounds(mesh) };
    });
  const contacts: IAutoMovieModelCrossing[] = [];
  for (let first = 0; first < parts.length; first++)
    for (let second = first + 1; second < parts.length; second++) {
      const here = parts[first];
      const there = parts[second];
      if (
        [0, 1, 2].some(
          (axis) =>
            here.high[axis] < there.low[axis] ||
            here.low[axis] > there.high[axis],
        )
      )
        continue;
      const ours = measureAutoMovieMeshCrossings(here.mesh, there.mesh);
      const theirs = measureAutoMovieMeshCrossings(there.mesh, here.mesh);
      if (ours.length === 0 && theirs.length === 0) continue;
      contacts.push({
        part: here.id,
        other: there.id,
        triangles: ours.length,
        otherTriangles: theirs.length,
        coplanar:
          ours.filter((entry) => entry.coplanar).length +
          theirs.filter((entry) => entry.coplanar).length,
      });
    }
  return contacts;
}
