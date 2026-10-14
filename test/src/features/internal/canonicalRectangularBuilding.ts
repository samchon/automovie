import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";

import { ENVELOPE_FIXTURE_FACE_ROTATION as FACE_ROTATION } from "./ENVELOPE_FIXTURE_FACE_ROTATION";
import { canonicalBoxCell as boxCell } from "./canonicalBoxCell";
import { canonicalOriginTransform as originTransform } from "./canonicalOriginTransform";
import { canonicalWall as wall } from "./canonicalWall";

/**
 * One rectangular hall four metres east, three high, six deep, at the origin.
 *
 * Four wall faces, one roof and one floor enclose the single space `hall`, and one door is cut through the south wall. This is the shape the survey guidance draws as four perpendicular facade views plus four corner obliques, so the derived populations can be read straight off the diagram.
 *
 * Supply the authored 4 by 3 by 6 metre hall, six face frames and south-wall door. Literal metre coordinates, six box inequalities and independent axis quaternions give the analytic envelope; constructing this input alone is not product behavior proof, and consumers derive and assert expected populations and areas.
 *
 * Four facades, one roof, one floor, a located room and a 1 by 2.1 metre door distinguish envelope populations from arbitrary ids; complex rooms and multiple storeys use adjacent fixtures. This synchronous portable declaration is reached through explicit imports or the compatibility barrel, registers no dynamic case, installs no consumer and starts no process, browser, native artifact build or GPU.
 */
export const canonicalRectangularBuilding: () => IAutoMovieBuiltEnvironment =
  (): IAutoMovieBuiltEnvironment => ({
    version: 1,
    id: "hall-house",
    units: "meter",
    buildings: [{ id: "house", element: "house-root", space: "hall" }],
    models: [],
    modelReferences: [],
    elements: [
      {
        id: "house-root",
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
          boxCell("hall-cell", { x: 0, y: 0, z: 0 }, { x: 4, y: 3, z: 6 }),
        ],
      },
    ],
    boundaries: [
      wall({
        id: "wall-north",
        kind: "wall",
        space: "hall",
        origin: { x: 0, y: 0, z: 6 },
        rotation: FACE_ROTATION.keepZ,
        width: 4,
        height: 3,
      }),
      wall({
        id: "wall-south",
        kind: "wall",
        space: "hall",
        origin: { x: 4, y: 0, z: 0 },
        rotation: FACE_ROTATION.halfTurnY,
        width: 4,
        height: 3,
      }),
      wall({
        id: "wall-east",
        kind: "wall",
        space: "hall",
        origin: { x: 4, y: 0, z: 6 },
        rotation: FACE_ROTATION.quarterY,
        width: 6,
        height: 3,
      }),
      wall({
        id: "wall-west",
        kind: "wall",
        space: "hall",
        origin: { x: 0, y: 0, z: 0 },
        rotation: FACE_ROTATION.quarterMinusY,
        width: 6,
        height: 3,
      }),
      wall({
        id: "roof-top",
        kind: "roof",
        space: "hall",
        origin: { x: 0, y: 3, z: 6 },
        rotation: FACE_ROTATION.quarterMinusX,
        width: 4,
        height: 6,
      }),
      wall({
        id: "floor-slab",
        kind: "floor",
        space: "hall",
        origin: { x: 0, y: 0, z: 0 },
        rotation: FACE_ROTATION.quarterX,
        width: 4,
        height: 6,
      }),
    ],
    openings: [
      {
        id: "door-main",
        kind: "door",
        boundary: "wall-south",
        fill: null,
        profile: {
          outline: [
            { x: 1.5, y: 0 },
            { x: 2.5, y: 0 },
            { x: 2.5, y: 2.1 },
            { x: 1.5, y: 2.1 },
          ],
        },
      },
    ],
    connectors: [],
    surfaces: [],
    walkable: [],
  });
