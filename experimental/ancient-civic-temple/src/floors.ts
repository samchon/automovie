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
import { floorBoundaryFaces } from "./geometry/floor-faces";
import { floorSupportSurfaces } from "./geometry/floor-supports";
import { templeAdministrationFloor } from "./spaces/rooms/administration";
import { templeColonnadeFloor } from "./spaces/rooms/colonnade";
import { templeCourtyardFloor, templeCourtyardOwnsCurb } from "./spaces/rooms/courtyard";
import { templeEntranceFloor } from "./spaces/rooms/entrance";
import { templeOfferingFloor } from "./spaces/rooms/offering";
import { templeRecordsFloor } from "./spaces/rooms/records";
import { templeSanctuaryFloor } from "./spaces/rooms/sanctuary";
import { templeServiceYardFloor } from "./spaces/rooms/service-yard";
import { templeStorageFloor } from "./spaces/rooms/storage";

/**
 * Per-room floor ownership input. exteriorBottom is the common bottom of docs/spaces/storey.md#wall-ground-contact;
 * the structure in front of the entrance steps that meets the site ground goes down to that height.
 * Null uses the ordinary thickness only (a read-only finished face used to derive the common bottom).
 */
export const templeFloorInputs = (exteriorBottom: number | null) => [
  templeEntranceFloor(exteriorBottom), templeCourtyardFloor(), templeColonnadeFloor(),
  templeSanctuaryFloor(), templeOfferingFloor(), templeAdministrationFloor(),
  templeRecordsFloor(), templeStorageFloor(), templeServiceYardFloor(),
];

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
