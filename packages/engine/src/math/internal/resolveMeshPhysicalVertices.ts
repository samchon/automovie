import {
  IAutoMovieMesh,
  IAutoMovieMeshPhysicalVertices,
  type IAutoMovieResolvedPhysicalVertices,
} from "@automovie/interface";

import { weldMeshVertices } from "./weldMeshVertices";

/*
 * Resolve actual source-point aliases and current-position legacy vertices.
 * Source pairs are interned in first render occurrence order, independently of
 * ID magnitude or table order. Legacy labels use the existing nanometre grid
 * and never share an identity with an explicit source point. Each source alias
 * must agree on that same grid in the mesh's local metre frame.
 *
 * Omitted correspondence delegates exactly to position welding. Explicit
 * correspondence needs dense aligned arrays, finite XYZ, nonblank domains, safe
 * nonnegative IDs and resident source references. Malformed metadata or
 * separated aliases throw a named physicalVertices refusal; no fallback hides
 * the declaration. Unused and repeated valid source rows are harmless. Returned
 * arrays are owned. Geometry, indices, areas and intersections remain their
 * independent owners' obligations, not a promise of this equivalence.
 */
export function resolveMeshPhysicalVertices(
  mesh: Pick<IAutoMovieMesh, "positions" | "physicalVertices">,
): IAutoMovieResolvedPhysicalVertices {
  const metadata: IAutoMovieMeshPhysicalVertices | undefined =
    mesh.physicalVertices;
  if (metadata === undefined) return weldMeshVertices(mesh.positions);
  const refuse: (reason: string) => never = (reason: string): never => {
    throw new Error(`Mesh physicalVertices ${reason}.`);
  };
  if (mesh.positions.length % 3 !== 0) refuse("needs complete XYZ positions");
  if (metadata === null) refuse("needs source and vertex arrays");
  if (metadata.vertices.length !== mesh.positions.length / 3)
    refuse("needs one source reference or null per render vertex");
  const keys: string[] = [];
  for (const source of metadata.sources) {
    if (source.id < 0 || source.id > Number.MAX_SAFE_INTEGER)
      refuse("sources need nonnegative safe integer IDs");
    keys.push(`source:${JSON.stringify([source.domain, source.id])}`);
  }
  const coordinates: { labels: string[]; vertices: number[] } =
    weldMeshVertices(mesh.positions);
  const labels: string[] = [];
  const vertices: number[] = [];
  const identities: Map<string, number> = new Map<string, number>();
  const aliasCells: Map<string, string> = new Map<string, string>();
  for (let vertex: number = 0; vertex < metadata.vertices.length; vertex++) {
    const reference: number | null = metadata.vertices[vertex];
    if (reference !== null && (reference < 0 || reference >= keys.length))
      refuse(`vertices[${vertex}] must be null or a resident source reference`);
    const cell: string = coordinates.labels[coordinates.vertices[vertex]];
    const key: string =
      reference === null ? `legacy:${cell}` : keys[reference!];
    if (reference !== null) {
      const previous: string | undefined = aliasCells.get(key);
      if (previous !== undefined && previous !== cell)
        refuse(`source ${key} aliases disagree on the coordinate grid`);
      aliasCells.set(key, cell);
    }
    let identity: number | undefined = identities.get(key);
    if (identity === undefined) {
      identity = labels.length;
      identities.set(key, identity);
      labels.push(key);
    }
    vertices.push(identity);
  }
  return { labels, vertices };
}
