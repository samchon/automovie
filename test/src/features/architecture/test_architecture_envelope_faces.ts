import {
  type IAutoMovieBuiltEnvelopeFace,
  builtEnvironmentEnvelopeFaces,
  validateBuiltEnvironment,
} from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  FACE_ROTATION,
  boxCell,
  originTransform,
  rectangularBuilding,
} from "../internal/envelopeFixtures";
import { namedFacts, nclose, vclose } from "../internal/predicates";

/**
 * The exposed envelope is what encloses one space, read from its own geometry.
 *
 * An exposed separation names exactly one known space and carries a face. The query classifies its transformed normal and uses a positive containment probe to choose its sign; this box fixture supplies independently known inward/outward directions.
 *
 * The inward-frame case separates the reported normal from the authored frame direction. The ordinary wall/roof/floor kinds here do not independently distinguish a normal classifier from a kind-based classifier.
 *
 * Scenarios:
 *
 * 1. The rectangular hall is a legal building, so the rule is read off a record
 *    the engine accepts.
 * 2. Its six enclosing separations come back in boundary-id order, each with the
 *    building and space that own it.
 * 3. Four wall faces read as `facade`, the ceiling slab as `roof`, and the
 *    ground slab as `underside`, from their normals alone.
 * 4. The east wall's world outline, centroid and outward normal equal the metres
 *    typed by hand from the fixture's own frame.
 * 5. A separation between two spaces, a separation carrying no face, one that
 *    encloses no space at all, and one citing a space the record does not hold
 *    are all absent, because none of the four is an exposed face of anything.
 * 6. A face whose authored `+Z` points into its own space is reported pointing
 *    out of it.
 * 7. A face whose outline encloses no area still reports a centroid, taken from
 *    the mean of its own points.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls real envelope extraction on an admitted rectangular hall and a deliberately malformed extraction-only record, observing ordered identities, aspect, transformed vertices, centroid and normal. This catches missing faces, wrong transforms and direction/classification errors without claiming validator admission for the malformed record.
 * @evidence contracts/testing.md#independent-expectations Hand-authored hall dimensions and the east-wall frame determine its four world corners and midpoint; cell interior versus exterior determines the normal, and horizontal up/down normals determine roof/underside. The degenerate line's authored points independently determine its mean; no output snapshot supplies these values.
 * @evidence contracts/testing.md#distinguishing-cases Retains six admitted faces, two-space/internal, missing-face, zero-space and unknown-space omissions, an inward frame and a zero-area outline. This test covers envelope extraction rather than validating every malformed boundary, independently separating classification from conventional kind labels, or proving rendered camera appearance.
 * @evidence contracts/testing.md#execution-ownership The synchronous discoverable test_architecture_envelope_faces entry owns all cases and invokes portable engine functions with local data and shared fixtures; it opens no host, process, browser or GPU and performs no native build.
 */
export function test_architecture_envelope_faces(): void {
  const record: IAutoMovieBuiltEnvironment = rectangularBuilding();

  TestValidator.equals(
    "the rectangular hall is a legal building",
    validateBuiltEnvironment({ environment: record }).success,
    true,
  );

  const faces: IAutoMovieBuiltEnvelopeFace[] = builtEnvironmentEnvelopeFaces(record);

  TestValidator.equals(
    "every enclosing separation is an exposed face, in boundary order",
    faces.map((face: IAutoMovieBuiltEnvelopeFace) : string[] => [
      face.boundary,
      face.aspect,
      face.building,
      face.space,
    ]),
    [
      ["floor-slab", "underside", "house", "hall"],
      ["roof-top", "roof", "house", "hall"],
      ["wall-east", "facade", "house", "hall"],
      ["wall-north", "facade", "house", "hall"],
      ["wall-south", "facade", "house", "hall"],
      ["wall-west", "facade", "house", "hall"],
    ],
  );

  const east: IAutoMovieBuiltEnvelopeFace | undefined = faces.find((face: IAutoMovieBuiltEnvelopeFace) : boolean => face.boundary === "wall-east");

  TestValidator.equals(
    "the east wall is placed and turned exactly as its frame says",
    namedFacts([
      [
        "its outline runs from the north-east corner to the south-east one",
        () : boolean =>
          east !== undefined &&
          east.vertices.length === 4 &&
          vclose(east.vertices[0]!, { x: 4, y: 0, z: 6 }) &&
          vclose(east.vertices[1]!, { x: 4, y: 0, z: 0 }) &&
          vclose(east.vertices[2]!, { x: 4, y: 3, z: 0 }) &&
          vclose(east.vertices[3]!, { x: 4, y: 3, z: 6 }),
      ],
      [
        "its centroid is the middle of that rectangle",
        () : boolean =>
          east !== undefined && vclose(east.centroid, { x: 4, y: 1.5, z: 3 }),
      ],
      [
        "and it faces away from the hall",
        () : boolean => east !== undefined && vclose(east.normal, { x: 1, y: 0, z: 0 }),
      ],
      [
        "carrying its own kind and thickness",
        () : boolean =>
          east !== undefined && east.kind === "wall" && nclose(east.thickness, 0.2, 0),
      ],
    ]),
    {
      "its outline runs from the north-east corner to the south-east one": true,
      "its centroid is the middle of that rectangle": true,
      "and it faces away from the hall": true,
      "carrying its own kind and thickness": true,
    },
  );

  TestValidator.equals(
    "the roof faces up and the floor faces down",
    namedFacts([
      [
        "the ceiling slab's normal is world up",
        () : boolean =>
          vclose(faces.find((face: IAutoMovieBuiltEnvelopeFace) : boolean => face.boundary === "roof-top")!.normal, {
            x: 0,
            y: 1,
            z: 0,
          }),
      ],
      [
        "the ground slab's normal is world down",
        () : boolean =>
          vclose(faces.find((face: IAutoMovieBuiltEnvelopeFace) : boolean => face.boundary === "floor-slab")!.normal, {
            x: 0,
            y: -1,
            z: 0,
          }),
      ],
    ]),
    {
      "the ceiling slab's normal is world up": true,
      "the ground slab's normal is world down": true,
    },
  );

  const odd: IAutoMovieBuiltEnvelopeFace[] = builtEnvironmentEnvelopeFaces(oddBoundaries());

  TestValidator.equals(
    "only the two exposed separations of the odd record are faces",
    odd.map((face: IAutoMovieBuiltEnvelopeFace) : string => face.boundary),
    ["degenerate", "flipped"],
  );

  TestValidator.equals(
    "an inward frame is reported outward, and a flat outline still has a centre",
    namedFacts([
      [
        "the inward-wound face points out of the hall",
        () : boolean =>
          vclose(odd.find((face: IAutoMovieBuiltEnvelopeFace) : boolean => face.boundary === "flipped")!.normal, {
            x: 0,
            y: 0,
            z: 1,
          }),
      ],
      [
        "the arealess face reports the mean of its own points",
        () : boolean =>
          vclose(odd.find((face: IAutoMovieBuiltEnvelopeFace) : boolean => face.boundary === "degenerate")!.centroid, {
            x: 1,
            y: 0,
            z: 6,
          }),
      ],
    ]),
    {
      "the inward-wound face points out of the hall": true,
      "the arealess face reports the mean of its own points": true,
    },
  );
}

/**
 * One deliberately malformed record holding every separation that is not a face.
 *
 * It includes an unknown space and an unowned separation, so no scenario asks this extraction-only fixture to pass validation. Four omitted separations and two awkward exposed faces distinguish membership, orientation and centroid behavior.
 */
const oddBoundaries: () => IAutoMovieBuiltEnvironment = (): IAutoMovieBuiltEnvironment => ({
  version: 1,
  id: "odd",
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
      cells: [boxCell("hall-cell", { x: 0, y: 0, z: 0 }, { x: 4, y: 3, z: 6 })],
    },
    {
      id: "annex",
      kind: "room",
      parent: "hall",
      cells: [
        boxCell("annex-cell", { x: 4, y: 0, z: 0 }, { x: 6, y: 3, z: 6 }),
      ],
    },
  ],
  boundaries: [
    {
      id: "partition",
      kind: "wall",
      spaces: ["hall", "annex"],
      elements: [],
      face: {
        origin: { x: 4, y: 0, z: 6 },
        rotation: FACE_ROTATION.quarterY,
        outline: [
          { x: 0, y: 0 },
          { x: 6, y: 0 },
          { x: 6, y: 3 },
          { x: 0, y: 3 },
        ],
        thickness: 0.2,
      },
    },
    {
      id: "logical",
      kind: "threshold",
      spaces: ["hall"],
      elements: [],
    },
    {
      id: "unbounded",
      kind: "wall",
      spaces: [],
      elements: [],
      face: {
        origin: { x: 0, y: 0, z: 0 },
        rotation: FACE_ROTATION.keepZ,
        outline: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
        ],
        thickness: 0.2,
      },
    },
    {
      id: "orphan",
      kind: "wall",
      spaces: ["ghost"],
      elements: [],
      face: {
        origin: { x: 0, y: 0, z: 0 },
        rotation: FACE_ROTATION.keepZ,
        outline: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
        ],
        thickness: 0.2,
      },
    },
    {
      id: "flipped",
      kind: "wall",
      spaces: ["hall"],
      elements: [],
      face: {
        origin: { x: 4, y: 0, z: 6 },
        rotation: FACE_ROTATION.halfTurnY,
        outline: [
          { x: 0, y: 0 },
          { x: 4, y: 0 },
          { x: 4, y: 3 },
          { x: 0, y: 3 },
        ],
        thickness: 0.2,
      },
    },
    {
      id: "degenerate",
      kind: "wall",
      spaces: ["hall"],
      elements: [],
      face: {
        origin: { x: 0, y: 0, z: 6 },
        rotation: FACE_ROTATION.keepZ,
        outline: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
        ],
        thickness: 0.2,
      },
    },
  ],
  openings: [],
  connectors: [],
  surfaces: [],
  walkable: [],
});
