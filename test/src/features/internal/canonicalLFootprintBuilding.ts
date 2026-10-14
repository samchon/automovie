import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import { ENVELOPE_FIXTURE_FACE_ROTATION as FACE_ROTATION } from "./ENVELOPE_FIXTURE_FACE_ROTATION";
import { canonicalOriginTransform as originTransform } from "./canonicalOriginTransform";
import { canonicalBoxCell as boxCell } from "./canonicalBoxCell";
import { canonicalWall as wall } from "./canonicalWall";

/**
 * One L-shaped wing whose notch produces exactly one reentrant corner.
 *
 * The footprint runs `(0,0) (4,0) (4,2) (2,2) (2,4) (0,4)` in world XZ and stands three metres high. Its box centre falls inside the long arm, and the far corner of its own bounding box falls in the notch, which is the case a turntable around the box would photograph from outside the room.
 *
 * Supply the authored L-shaped wing as two disjoint-interior box cells and six wall frames. The XZ polygon (0,0),(4,0),(4,2),(2,2),(2,4),(0,4) independently has one inward corner and an unoccupied bounding-box notch; constructing this input alone is not product behavior proof.
 *
 * The long arm, short arm and concave notch contrast with the rectangular fixture. Consumers assert corners and placement while this builder neither calls nor duplicates the product envelope algorithm. This synchronous portable declaration is reached through explicit imports or the compatibility barrel, registers no dynamic case, installs no consumer and starts no process, browser, native artifact build or GPU.
 */
export const canonicalLFootprintBuilding: () => IAutoMovieBuiltEnvironment = (): IAutoMovieBuiltEnvironment => ({
  version: 1,
  id: "l-wing",
  units: "meter",
  buildings: [{ id: "wing", element: "wing-root", space: "hall" }],
  models: [],
  modelReferences: [],
  elements: [
    {
      id: "wing-root",
      kind: "building",
      parent: null,
      transform: originTransform(),
      model: null,
      space: "hall",
    },
  ],
  spaces: [
    {
      id: "hall",
      kind: "room",
      parent: null,
      cells: [
        boxCell("hall-main", { x: 0, y: 0, z: 0 }, { x: 4, y: 3, z: 2 }),
        boxCell("hall-arm", { x: 0, y: 0, z: 2 }, { x: 2, y: 3, z: 4 }),
      ],
    },
  ],
  boundaries: [
    wall({
      id: "wall-0",
      kind: "wall",
      space: "hall",
      origin: { x: 4, y: 0, z: 0 },
      rotation: FACE_ROTATION.halfTurnY,
      width: 4,
      height: 3,
    }),
    wall({
      id: "wall-1",
      kind: "wall",
      space: "hall",
      origin: { x: 4, y: 0, z: 2 },
      rotation: FACE_ROTATION.quarterY,
      width: 2,
      height: 3,
    }),
    wall({
      id: "wall-2",
      kind: "wall",
      space: "hall",
      origin: { x: 2, y: 0, z: 2 },
      rotation: FACE_ROTATION.keepZ,
      width: 2,
      height: 3,
    }),
    wall({
      id: "wall-3",
      kind: "wall",
      space: "hall",
      origin: { x: 2, y: 0, z: 4 },
      rotation: FACE_ROTATION.quarterY,
      width: 2,
      height: 3,
    }),
    wall({
      id: "wall-4",
      kind: "wall",
      space: "hall",
      origin: { x: 0, y: 0, z: 4 },
      rotation: FACE_ROTATION.keepZ,
      width: 2,
      height: 3,
    }),
    wall({
      id: "wall-5",
      kind: "wall",
      space: "hall",
      origin: { x: 0, y: 0, z: 0 },
      rotation: FACE_ROTATION.quarterMinusY,
      width: 4,
      height: 3,
    }),
  ],
  openings: [],
  connectors: [],
  surfaces: [],
  walkable: [],
});
