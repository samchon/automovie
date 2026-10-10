import type { IHumanBodyUnderwearCreaseInput } from "./IHumanBodyUnderwearCreaseInput";
import type { IHumanBodyUnderwearCreaseResult } from "./IHumanBodyUnderwearCreaseResult";
import type { IHumanBodyUnderwearFitObservation } from "./IHumanBodyUnderwearFitObservation";
import { createHumanBodyUnderwearEnvelope } from "./createHumanBodyUnderwearEnvelope";
import { fitHumanBodyUnderwearSurface } from "./fitHumanBodyUnderwearSurface";
import { voxelizeHumanBodySkin } from "./voxelizeHumanBodySkin";

/**
 * Fit the original connected garment material surface to its ball envelope,
 * then apply its existing normal offset in the posed skin metre frame.
 *
 * The cut's actual indices retain material identity, seams and boundary loops.
 * Connected components obtain their own bounded voxel neighbourhood; no
 * proximity grouping invents or disconnects material adjacency. Qualified grid
 * and free own-ball centres define one continuous nearest-centre scalar field.
 * The sparse fitting owner minimizes relative edge-vector distortion subject
 * to that shared surface, rather than publishing independent centre projections.
 * Original solver and nonlinear field residuals remain observations, not
 * anatomical, garment-fit or visual acceptance.
 *
 * Supplied unit source normals are transported by the shortest rotation from
 * the original connected mesh normal to the fitted mesh normal. Thus an
 * unchanged surface retains its supplied normals. The shared evaluator derives
 * the actual affine lift path from these returned directions; the transport
 * alone is not a complete shape deformation or an injectivity certificate.
 * Existing signed offset and span inputs are retained without a radius-ratio
 * cutoff. A failed actual lift or nonconvergent connected restoration refuses
 * with original readings. Source, Float32, crossing and rendered checks retain
 * their separate responsibilities.
 * No skin/source geometry is moved, no open boundary is filled and no fabric
 * stiffness, gravity, history or cloth dynamics is introduced.
 */
export function closeHumanBodyUnderwearCreases(
  input: IHumanBodyUnderwearCreaseInput,
): IHumanBodyUnderwearCreaseResult {
  const { points, normals, indices, offsetMetres, spanMetres } = input;
  const count = points.length / 3;
  const positions = points.map((value, k) => value + offsetMetres * normals[k]);
  const lifted = [...normals], bridged = new Array<number>(count).fill(0);
  const fitting: IHumanBodyUnderwearFitObservation[] = [];
  if (!(spanMetres > 0) || count === 0) return { positions, normals: lifted, bridged, fitting };
  if (normals.length !== points.length || !Number.isInteger(count))
    throw new Error("Garment fitting needs aligned complete points and normals.");
  const rho = spanMetres / 2, cell = spanMetres / 5, pad = rho + 2 * cell;
  for (const [component, members] of components(count, indices).entries()) {
    const local = new Map(members.map((vertex, i) => [vertex, i]));
    const triangles: number[] = [];
    for (let t = 0; t < indices.length; t += 3) if (local.has(indices[t]))
      triangles.push(local.get(indices[t])!, local.get(indices[t + 1])!, local.get(indices[t + 2])!);
    const source = members.flatMap((v) => at3(points, v));
    const sourceNormals = members.flatMap((v) => at3(normals, v));
    const observeCurrent = input.observeFitting;
    const observeFitting: IHumanBodyUnderwearCreaseInput["observeFitting"] =
      observeCurrent === undefined ? undefined
        : (stage, details) => observeCurrent(stage, { ...details, garmentComponent: component });
    observeFitting?.("garment-component-read", {});
    const voxels = voxelizeHumanBodySkin({ skin: input.skin, points: source, pad, cell });
    const envelope = createHumanBodyUnderwearEnvelope({ voxels, points: source, normals: sourceNormals, rho });
    observeFitting?.("garment-envelope-evaluated", {});
    const fit = fitHumanBodyUnderwearSurface({ observeFitting, points: source, normals: sourceNormals, indices: triangles, sourceVertices: members, envelope, rho, offsetMetres });
    fitting.push(...fit.observations);
    members.forEach((vertex, at) => {
      for (let k = 0; k < 3; k++) {
        lifted[vertex * 3 + k] = fit.evaluation.normals[at * 3 + k];
        positions[vertex * 3 + k] = fit.evaluation.positions[at * 3 + k];
      }
      bridged[vertex] = fit.evaluation.base.slice(at * 3, at * 3 + 3)
        .some((value, k) => value !== points[vertex * 3 + k]) ? 1 : 0;
    });
  }
  return { positions, normals: lifted, bridged, fitting };
}

/** Actual indexed material components; no point-cloud connectivity fallback. */
function components(count: number, indices: readonly number[]): number[][] {
  if (indices.length % 3 !== 0 || indices.some((v) => !Number.isInteger(v) || v < 0 || v >= count))
    throw new Error("Garment closing requires the actual complete cut triangle indices.");
  const adjacency = Array.from({ length: count }, () => new Set<number>());
  for (let t = 0; t < indices.length; t += 3) for (let k = 0; k < 3; k++) {
    const a = indices[t + k], b = indices[t + (k + 1) % 3];
    adjacency[a].add(b); adjacency[b].add(a);
  }
  const used = new Uint8Array(count), result: number[][] = [];
  for (let v = 0; v < count; v++) if (!used[v]) {
    if (adjacency[v].size === 0) throw new Error("Garment closing cannot invent adjacency for an unused cut vertex.");
    const members: number[] = [], pending = [v]; used[v] = 1;
    while (pending.length) {
      const next = pending.pop()!; members.push(next);
      for (const neighbour of adjacency[next]) if (!used[neighbour]) { used[neighbour] = 1; pending.push(neighbour); }
    }
    result.push(members.sort((a, b) => a - b));
  }
  return result;
}

function at3(values: readonly number[], vertex: number): number[] {
  return [values[vertex * 3], values[vertex * 3 + 1], values[vertex * 3 + 2]];
}
