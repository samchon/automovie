import { IAutoMovieSpace } from "@automovie/interface";
import {
  SPACE_GROUP_NAME,
  applyRenderMode,
  buildModel,
  buildScene,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { IDENTITY_TRANSFORM, createModel } from "../internal/fixtures";
import { nclose, vclose } from "../internal/predicates";

const FLOOR_POLYGON: { x: number; y: number; z: number }[] = [
  { x: -2, y: 0, z: -1 },
  { x: 2, y: 0, z: -1 },
  { x: 2, y: 0, z: 1 },
  { x: -2, y: 0, z: 1 },
];

const spaceOf: (surfaces: IAutoMovieSpace["surfaces"]) => IAutoMovieSpace = (
  surfaces: IAutoMovieSpace["surfaces"],
): IAutoMovieSpace => ({
  id: "space-1",
  surfaces,
  walkable: surfaces.map(
    (surface: import("@automovie/interface").IAutoMovieSurface): string =>
      surface.id,
  ),
});

const sceneOf: (
  space: IAutoMovieSpace | null | undefined,
) => import("@automovie/viewer").IAutoMovieSceneObject = (
  space: IAutoMovieSpace | null | undefined,
): import("@automovie/viewer").IAutoMovieSceneObject =>
  buildScene(
    {
      id: "scene-1",
      name: null,
      nodes: [
        {
          id: "node-a",
          model: "model-a",
          transform: IDENTITY_TRANSFORM,
          motion: null,
          pose: null,
        },
      ],
      cameras: [],
      lights: [
        {
          id: "sun",
          type: "directional",
          transform: IDENTITY_TRANSFORM,
          color: { r: 1, g: 1, b: 1, a: null, hex: null },
          intensity: 1,
        },
      ],
      space,
    },
    (): import("@automovie/viewer").IAutoMovieModelObject =>
      buildModel({ ...createModel(), id: "model-a" }),
  );

/** Every triangle's vertices, read back off the built geometry. */
const trianglesOf: (mesh: THREE.Mesh) => THREE.Vector3[][] = (
  mesh: THREE.Mesh,
): THREE.Vector3[][] => {
  const position:
    | THREE.BufferAttribute<THREE.BufferAttributeEventMap>
    | THREE.InterleavedBufferAttribute = mesh.geometry.getAttribute("position");
  const index: THREE.BufferAttribute<THREE.BufferAttributeEventMap> =
    mesh.geometry.getIndex()!;
  const out: THREE.Vector3[][] = [];
  for (let i: number = 0; i < index.count; i += 3)
    out.push(
      [0, 1, 2].map(
        (k: number): THREE.Vector3 =>
          new THREE.Vector3().fromBufferAttribute(position, index.getX(i + k)),
      ),
    );
  return out;
};

/** The right-hand face normal of one triangle: the winding, made numeric. */
const faceNormal: (triangle: THREE.Vector3[]) => THREE.Vector3 = (
  triangle: THREE.Vector3[],
): THREE.Vector3 =>
  new THREE.Vector3()
    .subVectors(triangle[1]!, triangle[0]!)
    .cross(new THREE.Vector3().subVectors(triangle[2]!, triangle[0]!))
    .normalize();

/**
 * Exercises CPU support tessellation, geometry ordering and material participation in the depth projection.
 *
 * Scenarios:
 * 1. A one-floor space appends its named support group and mesh after model/light nodes.
 * 2. The authored square produces two upward triangles at its anchor height.
 * 3. The ramp produces its independently computed (-1,2,0)/sqrt(5) normal and x/2 heights.
 * 4. Heightfield relief reaches the authored center sample inside the footprint.
 * 5. A collinear footprint produces no mesh.
 * 6. Null and omitted spaces produce no support group.
 * 7. Depth mode replaces the support material and restore returns the original reference.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual scene/space realization and depth mode, reads indexed triangles, normals and heights, and observes exact material replacement/restoration.
 * @evidence contracts/testing.md#independent-expectations Authored square/ramp/heightfield inputs yield independent upward normals, a (-1,2,0)/sqrt(5) ramp normal and known center heights judged with numerical predicates.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts floor/ramp/internal relief, collinear omission, null/omitted space and a structural material swap; these checks do not certify pixels or native geometry admission.
 * @evidence contracts/testing.md#execution-ownership The named entry owns existing CPU model/support graphs and a returned pass handle, restores the pass and starts no native renderer, browser or visual probe.
 */
export function test_viewer_space_ground(): void {
  // 1. the group, its placement, and its naming.
  const floor: import("@automovie/viewer").IAutoMovieSceneObject =
    sceneOf(
      spaceOf([
        {
          id: "floor",
          kind: "floor",
          polygon: FLOOR_POLYGON,
          anchor: { x: 0, y: 0.5, z: 0 },
          rampTo: null,
        },
      ]),
    );
  // A node group carries its own scene id, so this checks both child ordering and name-based addressability.
  TestValidator.equals(
    "the space group is appended after the nodes and lights",
    floor.scene.children.map(
      (child: THREE.Object3D<THREE.Object3DEventMap>): string => child.name,
    ),
    ["node-a", "", SPACE_GROUP_NAME],
  );
  const ground: THREE.Object3D<THREE.Object3DEventMap> =
    floor.scene.children[2]!;
  TestValidator.equals(
    "one mesh per surface, named for it",
    ground.children.map(
      (child: THREE.Object3D<THREE.Object3DEventMap>): string => child.name,
    ),
    ["floor"],
  );

  // 2. the winding: two upward triangles at the anchor height.
  const triangles: THREE.Vector3[][] = trianglesOf(
    ground.children[0] as THREE.Mesh,
  );
  TestValidator.equals("a square fans into two triangles", triangles.length, 2);
  TestValidator.predicate(
    "every floor triangle faces up at the anchor height",
    triangles.every(
      (triangle: THREE.Vector3[]): boolean =>
        vclose(faceNormal(triangle), { x: 0, y: 1, z: 0 }) &&
        triangle.every((vertex: THREE.Vector3): boolean =>
          nclose(vertex.y, 0.5),
        ),
    ),
  );

  // 3. the ramp: height interpolated per vertex, one plane normal.
  const ramp: import("@automovie/viewer").IAutoMovieSceneObject =
    sceneOf(
      spaceOf([
        {
          id: "ramp",
          kind: "ramp",
          polygon: [
            { x: 0, y: 0, z: 0 },
            { x: 2, y: 0, z: 0 },
            { x: 2, y: 0, z: 2 },
            { x: 0, y: 0, z: 2 },
          ],
          anchor: { x: 0, y: 0, z: 0 },
          rampTo: { x: 2, y: 1, z: 0 },
        },
      ]),
    );
  const rampTriangles: THREE.Vector3[][] = trianglesOf(
    ramp.scene.children[2]!.children[0] as THREE.Mesh,
  );
  const slope: number = Math.sqrt(5);
  TestValidator.equals(
    "the authored square ramp contributes two triangles",
    rampTriangles.length,
    2,
  );
  TestValidator.predicate(
    "a ramp's vertices ride its plane, normal (-1, 2, 0)/sqrt(5)",
    rampTriangles.every(
      (triangle: THREE.Vector3[]): boolean =>
        vclose(faceNormal(triangle), {
          x: -1 / slope,
          y: 2 / slope,
          z: 0,
        }) &&
        triangle.every((vertex: THREE.Vector3): boolean =>
          nclose(vertex.y, vertex.x / 2),
        ),
    ),
  );

  // 4. heightfield relief reaches an internal viewer vertex.
  const relief: import("@automovie/viewer").IAutoMovieSceneObject =
    sceneOf(
      spaceOf([
        {
          id: "relief",
          kind: "floor",
          polygon: [
            { x: 0, y: 0, z: 0 },
            { x: 2, y: 0, z: 0 },
            { x: 2, y: 0, z: 2 },
            { x: 0, y: 0, z: 2 },
          ],
          height: {
            kind: "heightfield",
            originX: 0,
            originZ: 0,
            spacingX: 1,
            spacingZ: 1,
            columns: 3,
            rows: 3,
            samples: [0, 0, 0, 0, 2, 0, 0, 0, 0],
          },
        },
      ]),
    );
  const reliefPosition:
    | THREE.BufferAttribute<THREE.BufferAttributeEventMap>
    | THREE.InterleavedBufferAttribute = (
    relief.scene.children[2]!.children[0] as THREE.Mesh
  ).geometry.getAttribute("position");
  TestValidator.predicate(
    "the support heightfield geometry contains its raised center sample",
    Array.from(
      { length: reliefPosition.count },
      (_: unknown, index: number): number => index,
    ).some(
      (index: number): boolean =>
        nclose(reliefPosition.getX(index), 1) &&
        nclose(reliefPosition.getY(index), 2) &&
        nclose(reliefPosition.getZ(index), 1),
    ),
  );

  // 5. a degenerate footprint contributes nothing.
  const collinear: import("@automovie/viewer").IAutoMovieSceneObject =
    sceneOf(
      spaceOf([
        {
          id: "line",
          kind: "platform",
          polygon: [
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
            { x: 2, y: 0, z: 0 },
          ],
          anchor: { x: 0, y: 0, z: 0 },
          rampTo: null,
        },
      ]),
    );
  TestValidator.equals(
    "a zero-area footprint builds no mesh",
    collinear.scene.children[2]!.children.length,
    0,
  );

  // 6. both sides of the absent-space branch.
  TestValidator.equals(
    "a null space adds no group",
    sceneOf(null).scene.children.length,
    2,
  );
  TestValidator.equals(
    "an omitted space adds no group",
    sceneOf(undefined).scene.children.length,
    2,
  );

  // 7. the ground reaches a structural pass like any other geometry.
  const groundMesh: THREE.Mesh<
    THREE.BufferGeometry<
      THREE.NormalBufferAttributes,
      THREE.BufferGeometryEventMap
    >,
    | THREE.Material<THREE.MaterialEventMap>
    | THREE.Material<THREE.MaterialEventMap>[],
    THREE.Object3DEventMap
  > = ground.children[0] as THREE.Mesh;
  const beauty:
    | THREE.Material<THREE.MaterialEventMap>
    | THREE.Material<THREE.MaterialEventMap>[] = groundMesh.material;
  const handle: import("@automovie/viewer").IAutoMovieRenderModeHandle =
    applyRenderMode(floor.scene, "depth");
  TestValidator.predicate(
    "the depth pass overrides the ground's material too",
    groundMesh.material !== beauty,
  );
  handle.restore();
  TestValidator.predicate(
    "restoring puts the ground's beauty material back",
    groundMesh.material === beauty,
  );
}
