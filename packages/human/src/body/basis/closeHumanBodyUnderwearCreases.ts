import type { IHumanBodyUnderwearCreaseInput } from "./IHumanBodyUnderwearCreaseInput";
import type { IHumanBodyUnderwearCreaseResult } from "./IHumanBodyUnderwearCreaseResult";
import type { IHumanBodyUnderwearFitObservation } from "./IHumanBodyUnderwearFitObservation";
import { createHumanBodyUnderwearEnvelope } from "./createHumanBodyUnderwearEnvelope";
import { fitHumanBodyUnderwearSurface } from "./fitHumanBodyUnderwearSurface";
import { voxelizeHumanBodySkin } from "./voxelizeHumanBodySkin";

/**
 * Fit the original connected garment material surface to its ball envelope, then apply its existing normal offset in the posed skin metre frame.
 *
 * The cut's actual indices retain material identity, seams and boundary loops. Connected components obtain their own bounded voxel neighbourhood; no proximity grouping invents or disconnects material adjacency. Qualified grid and free own-ball centres define one continuous nearest-centre scalar field. The sparse fitting owner minimizes relative edge-vector distortion subject to that shared surface, rather than publishing independent centre projections. Original solver and nonlinear field residuals remain observations, not anatomical, garment-fit or visual acceptance.
 *
 * Supplied unit source normals are transported by the shortest rotation from the original connected mesh normal to the fitted mesh normal. Thus an unchanged surface retains its supplied normals. The shared evaluator derives the actual affine lift path from these returned directions; the transport alone is not a complete shape deformation or an injectivity certificate. Existing signed offset and span inputs are retained without a radius-ratio cutoff. A failed actual lift or nonconvergent connected restoration refuses with original readings. Source, Float32, crossing and rendered checks retain their separate responsibilities. No skin/source geometry is moved, no open boundary is filled and no fabric stiffness, gravity, history or cloth dynamics is introduced.
 *
 * @evidence contracts/common.md#principled-implementation Actual indexed material components select voxel neighbourhoods and one continuous ball envelope; connected fitting transports supplied normals and publishes original residual observations beside the lifted surface.
 * @evidence contracts/common.md#clear-and-simple-design Component extraction, voxel preparation, envelope definition and sparse fitting are separate owners, and this function only scatters their component results back into source vertex order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid indexed adjacency refuses instead of inventing proximity connectivity; solver readings and bridge flags do not certify anatomical fit, injectivity, crossing freedom or rendered acceptance.
 * @evidence contracts/common.md#meaningful-documentation The comment explains metre frames, offset and span, normal transport, connected material identity, observations and the absent cloth/contact model.
 * @evidence contracts/performance.md#efficient-algorithms Component extraction traverses vertices and edges; this implementation then scans all triangles for each component, so disconnected garments incur O(C times T) gathering before each component's voxel and fitting work.
 * @evidence contracts/performance.md#reuse-equivalent-work Each component shares one local index map, voxel neighbourhood and envelope across its fit; unchanged nonpositive-span or empty calls return the direct lift without solving.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Output positions, normals, bridge flags and observations remain with the caller; component maps, voxel/envelope state and fit temporaries expire after synchronous completion, with no persistent cache or external handle.
 */
export function closeHumanBodyUnderwearCreases(
  input: IHumanBodyUnderwearCreaseInput,
): IHumanBodyUnderwearCreaseResult {
  const { points, normals, indices, offsetMetres, spanMetres }: typeof input = input;
  const count: number = points.length / 3;
  const positions: number[] = points.map((value: number, k: number): number => value + offsetMetres * normals[k]);
  const lifted: number[] = [...normals], bridged: number[] = new Array<number>(count).fill(0);
  const fitting: IHumanBodyUnderwearFitObservation[] = [];
  if (!(spanMetres > 0) || count === 0) return { positions, normals: lifted, bridged, fitting };
  if (normals.length !== points.length || !Number.isInteger(count))
    throw new Error("Garment fitting needs aligned complete points and normals.");
  const rho: number = spanMetres / 2, cell: number = spanMetres / 5, pad: number = rho + 2 * cell;
  for (const [component, members] of components(count, indices).entries()) {
    const local: Map<number, number> = new Map(members.map((vertex: number, i: number): [number, number] => [vertex, i]));
    const triangles: number[] = [];
    for (let t: number = 0; t < indices.length; t += 3) if (local.has(indices[t]))
      triangles.push(local.get(indices[t])!, local.get(indices[t + 1])!, local.get(indices[t + 2])!);
    const source: number[] = members.flatMap((v: number): number[] => at3(points, v));
    const sourceNormals: number[] = members.flatMap((v: number): number[] => at3(normals, v));
    const observeCurrent: IHumanBodyUnderwearCreaseInput["observeFitting"] = input.observeFitting;
    const observeFitting: IHumanBodyUnderwearCreaseInput["observeFitting"] =
      observeCurrent === undefined ? undefined
        : (stage: Parameters<NonNullable<IHumanBodyUnderwearCreaseInput["observeFitting"]>>[0], details: Parameters<NonNullable<IHumanBodyUnderwearCreaseInput["observeFitting"]>>[1]): void => observeCurrent(stage, { ...details, garmentComponent: component });
    observeFitting?.("garment-component-read", {});
    const voxels: ReturnType<typeof voxelizeHumanBodySkin> = voxelizeHumanBodySkin({ skin: input.skin, points: source, pad, cell });
    const envelope: ReturnType<typeof createHumanBodyUnderwearEnvelope> = createHumanBodyUnderwearEnvelope({ voxels, points: source, normals: sourceNormals, rho });
    observeFitting?.("garment-envelope-evaluated", {});
    const fit: ReturnType<typeof fitHumanBodyUnderwearSurface> = fitHumanBodyUnderwearSurface({ observeFitting, points: source, normals: sourceNormals, indices: triangles, sourceVertices: members, envelope, rho, offsetMetres });
    fitting.push(...fit.observations);
    members.forEach((vertex: number, at: number): void => {
      for (let k: number = 0; k < 3; k++) {
        lifted[vertex * 3 + k] = fit.evaluation.normals[at * 3 + k];
        positions[vertex * 3 + k] = fit.evaluation.positions[at * 3 + k];
      }
      bridged[vertex] = fit.evaluation.base.slice(at * 3, at * 3 + 3)
        .some((value: number, k: number): boolean => value !== points[vertex * 3 + k]) ? 1 : 0;
    });
  }
  return { positions, normals: lifted, bridged, fitting };
}

/** Actual indexed material components; no point-cloud connectivity fallback. */
function components(count: number, indices: readonly number[]): number[][] {
  if (indices.length % 3 !== 0 || indices.some((v: number): boolean => !Number.isInteger(v) || v < 0 || v >= count))
    throw new Error("Garment closing requires the actual complete cut triangle indices.");
  const adjacency: Set<number>[] = Array.from({ length: count }, (): Set<number> => new Set<number>());
  for (let t: number = 0; t < indices.length; t += 3) for (let k: number = 0; k < 3; k++) {
    const a: number = indices[t + k], b: number = indices[t + (k + 1) % 3];
    adjacency[a].add(b); adjacency[b].add(a);
  }
  const used: Uint8Array = new Uint8Array(count), result: number[][] = [];
  for (let v: number = 0; v < count; v++) if (!used[v]) {
    if (adjacency[v].size === 0) throw new Error("Garment closing cannot invent adjacency for an unused cut vertex.");
    const members: number[] = [], pending: number[] = [v]; used[v] = 1;
    while (pending.length) {
      const next: number = pending.pop()!; members.push(next);
      for (const neighbour of adjacency[next]) if (!used[neighbour]) { used[neighbour] = 1; pending.push(neighbour); }
    }
    result.push(members.sort((a: number, b: number): number => a - b));
  }
  return result;
}

function at3(values: readonly number[], vertex: number): number[] {
  return [values[vertex * 3], values[vertex * 3 + 1], values[vertex * 3 + 2]];
}
