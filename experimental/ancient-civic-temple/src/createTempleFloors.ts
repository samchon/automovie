/**
 * Assembles the floor ownership inputs of the nine rooms into actual meshes and native support.
 * Each room source owns the space dimensions and the storey owns the structural thickness; this file
 * only runs boundary faces, then surface ownership, then engine meshes from the same inputs.
 * All rooms are computed together so no interior face survives at threshold, portico or courtyard joints.
 * Each surface's index group bundles every piece of one complete visual surface.
 * Later environment assembly consumes the material, model, element and walkable bindings.
 */
import {
  buildAutoMoviePolyhedron,
  inspectAutoMovieMeshTopology,
  mergeAutoMovieMeshParts,
} from "@automovie/engine";
import { floorBoundaryFaces } from "./geometry/floorBoundaryFaces";
import { floorSupportSurfaces } from "./geometry/floorSupportSurfaces";
import { templeCourtyardOwnsCurb } from "./spaces/rooms/templeCourtyardOwnsCurb";
import { templeFloorInputs } from "./templeFloorInputs";

/**
 * Evaluates the current ownership inputs on every call; there is no cache or global mutable mesh.
 * The floor slab runs under the door frames, but support covers only the effective passage area.
 * Mesh query results are produced by the actual call; authoring the function is not itself a verification result.
 */
export const createTempleFloors = (exteriorBottom: number | null = null) => {
  const inputs = templeFloorInputs(exteriorBottom);
  const faces = floorBoundaryFaces(inputs).map((face) => ({
    ...face,
    surface: templeCourtyardOwnsCurb(face) ? "surface.courtyard.floor" : face.surface,
  }));
  const assembly = mergeAutoMovieMeshParts(inputs.map((input) => ({
    id: input.surface,
    mesh: buildAutoMoviePolyhedron(
      faces.filter((face) => face.surface === input.surface).map((face) => face.corners),
    ),
  })));
  return {
    inputs,
    faces,
    assembly,
    supports: inputs.flatMap(floorSupportSurfaces),
    thresholdReservations: inputs.flatMap((input) => input.slabs
      .filter((slab) => slab.opening !== null)
      .map((slab) => ({ ...slab, space: input.space, surface: input.surface }))),
    topology: inspectAutoMovieMeshTopology(assembly.mesh),
  };
};
