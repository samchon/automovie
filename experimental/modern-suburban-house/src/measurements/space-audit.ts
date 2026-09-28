/**
 * Measurement producer for the exact house geometry consumed by the viewer.
 * Counts are recomputed from `buildHouse`, never copied from a review note.
 */
import { inspectAutoMovieMeshTopology } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import { buildHouseEnvironment } from "../spaces/environment";
import { verifyExteriorSupport } from "./exterior-support";
import { buildHouse } from "../spaces/house";
import { deriveHouseObservations } from "../spaces/observations";
import { verifyBoundarySegments } from "./boundary-audit";
import { verifyBlindRecessFixtures } from "./recess-audit";
import { auditHouseRoofOverlaps } from "./roof-overlap";
import { verifyHouseSpaceDesign } from "./space-design";

export interface IPartMeasure {
  id: string;
  owner: string;
  role: string;
  vertices: number;
  indices: number;
  triangles: number;
  components: number;
  degenerate: number;
  boundaryEdges: number;
  nonManifoldEdges: number;
  nonFinite: number;
  signedVolume: number;
  normals: boolean;
  uvs: boolean;
  bounds: { min: [number, number, number]; max: [number, number, number] };
  authoredVoids: number;
}

const connectedComponents = (mesh: IAutoMovieMesh): number => {
  const indices = mesh.indices;
  if (indices === null) throw new Error("mesh has no indices");
  const parent = new Map<string, string>();
  const key = (index: number): string => [0, 1, 2].map((axis) => Math.round(mesh.positions[3 * index + axis]! * 1e9)).join(",");
  const find = (name: string): string => {
    const original = parent.get(name);
    if (original === undefined) {
      parent.set(name, name);
      return name;
    }
    if (original === name) return name;
    const root = find(original);
    parent.set(name, root);
    return root;
  };
  for (let i = 0; i < indices.length; i += 3) {
    const first = find(key(indices[i]!));
    for (let j = i + 1; j < i + 3; j++) parent.set(find(key(indices[j]!)), first);
  }
  return new Set([...parent.keys()].map(find)).size;
};

/** One mesh's consequences, including positional connectivity and attributes. */
const measurePart = (part: ReturnType<typeof buildHouse>["parts"][number]): IPartMeasure => {
  const { mesh } = part;
  const topology = inspectAutoMovieMeshTopology(mesh);
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < mesh.positions.length; i++) {
    const axis = i % 3;
    min[axis] = Math.min(min[axis]!, mesh.positions[i]!);
    max[axis] = Math.max(max[axis]!, mesh.positions[i]!);
  }
  return {
    id: part.id,
    owner: part.owner,
    role: part.role,
    vertices: mesh.positions.length / 3,
    indices: mesh.indices?.length ?? 0,
    triangles: topology.triangles,
    components: connectedComponents(mesh),
    degenerate: topology.degenerate,
    boundaryEdges: topology.boundaryEdges,
    nonManifoldEdges: topology.nonManifoldEdges,
    nonFinite: topology.nonFinite,
    signedVolume: topology.volume,
    normals: mesh.normals !== null && mesh.normals.length === mesh.positions.length,
    uvs: mesh.uvs !== null && mesh.uvs.length === (mesh.positions.length / 3) * 2,
    bounds: { min, max },
    authoredVoids: part.wall?.holes.length ?? 0,
  };
};

/** Current whole-house census, with no acceptance verdict hidden in the data. */
export const auditHouseGeometry = () => {
  verifyBoundarySegments();
  verifyBlindRecessFixtures();
  const house = buildHouse();
  const environment = buildHouseEnvironment(house);
  verifyHouseSpaceDesign(house, environment);
  const exteriorSupportSamples = verifyExteriorSupport(house, environment);
  const observations = deriveHouseObservations(environment, house);
  const parts = house.parts.map(measurePart);
  return {
    parts,
    spaceCount: environment.spaces.length,
    elementCount: environment.elements.length,
    surfaceCount: environment.surfaces.length,
    boundaryCount: environment.boundaries.length,
    openingCount: environment.openings.length,
    connectorCount: environment.connectors.length,
    observationCount: observations.observations.length,
    observationFailures: observations.failures,
    exteriorSupportSamples,
    roofOverlap: auditHouseRoofOverlaps(),
  };
};
