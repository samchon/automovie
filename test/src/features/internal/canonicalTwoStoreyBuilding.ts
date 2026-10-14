import type {
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltEnvironment,
} from "@automovie/interface";

import { ENVELOPE_FIXTURE_FACE_ROTATION as FACE_ROTATION } from "./ENVELOPE_FIXTURE_FACE_ROTATION";
import { canonicalBoxCell as boxCell } from "./canonicalBoxCell";
import { canonicalOriginTransform as originTransform } from "./canonicalOriginTransform";
import { canonicalWall as wall } from "./canonicalWall";

/**
 * One two-storey house, four metres east, six deep, six high, in two rooms.
 *
 * The building's own space encloses and states no volume of its own, so the storeys under it are the rooms that answer: `ground` from zero to three and `upper` from three to six. That is what makes this fixture different from the single-room ones beside it -- the unit owns two spaces rather than one, its envelope is eight wall faces rather than four, and the slab between the storeys separates two spaces instead of enclosing one.
 *
 * A stair joins them and lands twice: once on the ground at zero and once on the upper floor at three. Two landings in one connector at two heights is the case the landing address exists for, and addressing a landing by its space alone would collapse a three-level lift in one atrium into a single view.
 *
 * Supply two 3 metre-high rooms under an unlocated root, eight wall faces and a stair landing in both rooms. Each authored 4 by 3 by 6 metre room has a literal height interval; the shared slab separates them and the stair stops at elevations 0 and 3 metres. Constructing this input alone is not product behavior proof; consumers own assertions.
 *
 * Two descendant volumes contrast with the root's empty cells, while the shared slab, repeated facade directions and two route stops distinguish storey ownership from the single-room fixture. This synchronous portable declaration is reached through explicit imports or the compatibility barrel, registers no dynamic case, installs no consumer and starts no process, browser, native artifact build or GPU.
 */
export const canonicalTwoStoreyBuilding: () => IAutoMovieBuiltEnvironment =
  (): IAutoMovieBuiltEnvironment => ({
    version: 1,
    id: "storey-house",
    units: "meter",
    buildings: [
      { id: "house", element: "house-root", space: "house-interior" },
    ],
    models: [],
    modelReferences: [],
    elements: [
      {
        id: "house-root",
        kind: "building",
        parent: null,
        transform: originTransform(),
        model: null,
        space: "house-interior",
      },
    ],
    spaces: [
      {
        id: "house-interior",
        kind: "building-interior",
        parent: null,
        // No cells and no shell: this states no volume, so it is the container
        // the storeys hang from and is charged no interior station of its own.
        cells: [],
      },
      {
        id: "ground",
        kind: "room",
        parent: "house-interior",
        cells: [
          boxCell("ground-cell", { x: 0, y: 0, z: 0 }, { x: 4, y: 3, z: 6 }),
        ],
      },
      {
        id: "upper",
        kind: "room",
        parent: "house-interior",
        cells: [
          boxCell("upper-cell", { x: 0, y: 3, z: 0 }, { x: 4, y: 6, z: 6 }),
        ],
      },
    ],
    boundaries: [
      ...(["ground", "upper"] as const).flatMap(
        (space: "ground" | "upper"): IAutoMovieBuiltBoundary[] => {
          const base: 0 | 3 = space === "ground" ? 0 : 3;
          return [
            wall({
              id: `wall-north-${space}`,
              kind: "wall",
              space,
              origin: { x: 0, y: base, z: 6 },
              rotation: FACE_ROTATION.keepZ,
              width: 4,
              height: 3,
            }),
            wall({
              id: `wall-south-${space}`,
              kind: "wall",
              space,
              origin: { x: 4, y: base, z: 0 },
              rotation: FACE_ROTATION.halfTurnY,
              width: 4,
              height: 3,
            }),
            wall({
              id: `wall-east-${space}`,
              kind: "wall",
              space,
              origin: { x: 4, y: base, z: 6 },
              rotation: FACE_ROTATION.quarterY,
              width: 6,
              height: 3,
            }),
            wall({
              id: `wall-west-${space}`,
              kind: "wall",
              space,
              origin: { x: 0, y: base, z: 0 },
              rotation: FACE_ROTATION.quarterMinusY,
              width: 6,
              height: 3,
            }),
          ];
        },
      ),
      wall({
        id: "roof-top",
        kind: "roof",
        space: "upper",
        origin: { x: 0, y: 6, z: 6 },
        rotation: FACE_ROTATION.quarterMinusX,
        width: 4,
        height: 6,
      }),
      wall({
        id: "floor-slab",
        kind: "floor",
        space: "ground",
        origin: { x: 0, y: 0, z: 0 },
        rotation: FACE_ROTATION.quarterX,
        width: 4,
        height: 6,
      }),
      wall({
        id: "storey-slab",
        kind: "floor",
        // The one boundary here that separates rather than encloses.
        space: ["ground", "upper"],
        origin: { x: 0, y: 3, z: 0 },
        rotation: FACE_ROTATION.quarterX,
        width: 4,
        height: 6,
      }),
    ],
    openings: [
      {
        id: "door-main",
        kind: "door",
        boundary: "wall-south-ground",
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
    connectors: [
      {
        id: "stair",
        kind: "stair",
        from: "ground",
        to: "upper",
        bidirectional: true,
        route: [
          { x: 2, y: 0, z: 1 },
          { x: 2, y: 3, z: 3 },
        ],
        elements: [],
        landings: [
          { space: "ground", at: 0 },
          { space: "upper", at: 3 },
        ],
      },
    ],
    surfaces: [],
    walkable: [],
  });
