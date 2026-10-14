import {
  IAutoMovieRenderSubject,
  deriveAutoMovieSemanticMask,
} from "@automovie/engine";
import { IAutoMovieScene, IAutoMovieSemanticMask } from "@automovie/interface";
import {
  applyAutoMovieSemanticMask,
  buildFluidSurfaceObject,
  buildPlantingObject,
  buildSoftBodyObject,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createSemanticMaskViewerTestGraph as build } from "../internal/createSemanticMaskViewerTestGraph";
import { flatBasin } from "../internal/fluidFixtures";
import { namedFacts, nclose, throwsError } from "../internal/predicates";
import {
  buildingFixture,
  instanceSetFixture,
  modelsFixture,
  sceneFixture,
} from "../internal/renderFixtures";
import {
  plantingCluster,
  plantingRecipe,
  softPanel,
} from "../internal/softFixtures";

/**
 * Exercises semantic palette installation and reversible CPU material, background, helper visibility and per-slot color state on the existing assembled graph.
 *
 * Scenarios:
 * 1. Nearest semantic roots determine mesh colors and painted/unaddressed populations while helper and atmosphere state is suspended; the supplied route-only cycle retains its key.
 * 2. Repeated slots receive their own colors and a white material base; missing/empty slot metadata retains the set color.
 * 3. Reversing designed nodes preserves each selected id's CPU material color.
 * 4. Repeated restore returns original material/color state, removes a newly created instance-color attribute and restores atmosphere/helpers.
 * 5. A scene with too few top-level children refuses semantic resolution.
 * 6. Existing soft-body, planting and water projections receive their palette entries while an unclaimed mesh receives background.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls Engine palette derivation and the actual viewer painter, checking nearest-root colors, unclaimed membership, repeated slots, node reordering, short-scene refusal and restoration.
 * @evidence contracts/testing.md#independent-expectations The palette is an Engine-produced viewer input; literal populations and retained material/attribute identities independently judge its projection. Color multiplication and the cycle key are CPU metadata, not pixels, shader deformation or rendered bounds.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts addressed/unclaimed and hidden meshes, slotted/bare/unslotted batches, reordered nodes, simulated drawable roots and repeated restore without replacing the existing inputs.
 * @evidence contracts/testing.md#execution-ownership The named portable entry owns its existing Three objects and disposes simulated projections; its route-only cycle record exercises material key inheritance without a renderer, Human asset or new driver.
 */
export function test_viewer_semantic_mask(): void {
  const subject: (design: IAutoMovieScene) => IAutoMovieRenderSubject = (
    design: IAutoMovieScene,
  ): IAutoMovieRenderSubject => ({
    scene: design,
    models: modelsFixture(),
    environments: [buildingFixture()],
    instanceSets: [instanceSetFixture({ id: "windows", count: 3, chunks: 1 })],
  });
  const ground: { id: string; surfaces: never[]; walkable: never[] } = {
    id: "tower-ground",
    surfaces: [],
    walkable: [],
  };
  const design: IAutoMovieScene & { space: typeof ground } = {
    ...sceneFixture(),
    space: ground,
  };
  const mask: IAutoMovieSemanticMask = deriveAutoMovieSemanticMask(
    subject(design),
  );
  const colorOf: (id: string) => string = (id: string): string =>
    mask.entries.find(
      (
        entry: import("@automovie/interface").IAutoMovieSemanticMaskEntry,
      ): boolean => entry.id === id,
    )!.color;

  const built: {
    scene: THREE.Scene;
    meshes: Map<string, THREE.Mesh>;
    beauty: Map<THREE.Mesh, THREE.Material | THREE.Material[]>;
    batch: THREE.InstancedMesh;
    bare: THREE.InstancedMesh;
    unslotted: THREE.InstancedMesh;
    grid: THREE.Object3D;
    darkLine: THREE.Object3D;
    sprite: THREE.Object3D;
    points: THREE.Object3D;
    orphan: THREE.Mesh;
    palette: Float32Array;
  } = build(design, mask);
  const handle: import("@automovie/viewer").IAutoMovieSemanticMaskHandle =
    applyAutoMovieSemanticMask({
      scene: built.scene,
      design,
      mask,
    });
  const hex: (object: THREE.Mesh) => string = (object: THREE.Mesh): string =>
    `#${(object.material as THREE.MeshBasicMaterial).color.getHexString().toUpperCase()}`;

  TestValidator.equals(
    "every mesh takes the colour its own semantic id earned",
    {
      wall: hex(built.meshes.get("tower/hall-wall")!),
      door: hex(built.meshes.get("tower/hall-door-leaf")!),
      prop: hex(built.meshes.get("lantern")!),
      ground: hex(built.meshes.get("__automovie_space")!),
      batch: hex(built.batch),
      orphan: hex(built.orphan),
      painted: handle.painted,
      unaddressed: handle.unaddressed,
    },
    {
      wall: colorOf("element:tower/hall-wall"),
      door: colorOf("element:tower/hall-door-leaf"),
      prop: colorOf("node:lantern"),
      ground: colorOf("node:tower-ground"),
      // Three multiplies this base by `instanceColor`; a slotted batch must use white or every semantic colour is darkened into a different identity.
      batch: "#FFFFFF",
      orphan: mask.background,
      // Eight drawables the design names, plus the three further shapes the instance-set group holds.
      painted: 11,
      // The unclaimed mesh, the hidden one, and the two loose geometries: a structural pass paints what is in the graph, and counts what no entry named.
      unaddressed: 4,
    },
  );
  TestValidator.equals(
    "a segmentation pass suspends everything that would overwrite an identity",
    namedFacts([
      ["fog", (): boolean => built.scene.fog === null],
      ["image lighting", (): boolean => built.scene.environment === null],
      [
        "background",
        (): boolean => (built.scene.background as THREE.Color).getHex() === 0,
      ],
      ["grid hidden", (): boolean => !built.grid.visible],
      ["sprite hidden", (): boolean => !built.sprite.visible],
      ["points hidden", (): boolean => !built.points.visible],
    ]),
    {
      fog: true,
      "image lighting": true,
      background: true,
      "grid hidden": true,
      "sprite hidden": true,
      "points hidden": true,
    },
  );

  // The replacement inherits the existing route-only cycle's hook key. This CPU observation does not compile a shader or measure vertex deformation.
  const programKey: (mesh: THREE.Mesh) => string = (mesh: THREE.Mesh): string =>
    (mesh.material as THREE.Material).customProgramCacheKey();
  TestValidator.equals(
    "the mask inherits the formation-cycle hook key only where supplied",
    {
      cycled: programKey(built.meshes.get("tower/hall-wall")!),
      // Three's own default key is the stringified no-op `onBeforeCompile`, so the fact asserted is that the still mesh did not get the injection.
      still:
        programKey(built.meshes.get("__automovie_space")!) ===
        "automovie-formation-cycle",
    },
    { cycled: "automovie-formation-cycle", still: false },
  );

  const instanceHex: (mesh: THREE.InstancedMesh, index: number) => string = (
    mesh: THREE.InstancedMesh,
    index: number,
  ): string =>
    `#${new THREE.Color()
      .fromBufferAttribute(mesh.instanceColor!, index)
      .getHexString()
      .toUpperCase()}`;
  const effectiveInstanceHex: (
    mesh: THREE.InstancedMesh,
    index: number,
  ) => string = (mesh: THREE.InstancedMesh, index: number): string =>
    `#${new THREE.Color()
      .fromBufferAttribute(mesh.instanceColor!, index)
      .multiply((mesh.material as THREE.MeshBasicMaterial).color)
      .getHexString()
      .toUpperCase()}`;
  const slotHex: (index: number) => string = (index: number): string =>
    effectiveInstanceHex(built.batch, index);
  TestValidator.equals(
    "CPU base-color multiplication preserves each repeated slot's palette colour",
    [slotHex(0), slotHex(1), slotHex(2), slotHex(3)],
    [
      colorOf("instance-slot:windows#0"),
      colorOf("instance-slot:windows#1"),
      colorOf("instance-slot:windows#2"),
      colorOf("instance-set:windows"),
    ],
  );
  TestValidator.equals(
    "slot colours are created where none existed, and unslotted batches keep the set colour",
    {
      createdAttribute: instanceHex(built.bare, 0),
      createdColor: effectiveInstanceHex(built.bare, 0),
      createdBase: hex(built.bare),
      unslotted: hex(built.unslotted),
    },
    {
      createdAttribute: colorOf("instance-slot:windows#1"),
      createdColor: colorOf("instance-slot:windows#1"),
      createdBase: "#FFFFFF",
      unslotted: colorOf("instance-set:windows"),
    },
  );

  const original: Float32Array<ArrayBuffer> = built.palette.slice();
  handle.restore();
  handle.restore();
  TestValidator.equals(
    "restore returns every material, instance colour and background exactly",
    namedFacts([
      [
        "materials",
        (): boolean =>
          [...built.meshes.values()].every(
            (
              mesh: THREE.Mesh<
                THREE.BufferGeometry<
                  THREE.NormalBufferAttributes,
                  THREE.BufferGeometryEventMap
                >,
                | THREE.Material<THREE.MaterialEventMap>
                | THREE.Material<THREE.MaterialEventMap>[],
                THREE.Object3DEventMap
              >,
            ): boolean => mesh.material === built.beauty.get(mesh),
          ),
      ],
      [
        "instance colours",
        (): boolean =>
          built.batch.instanceColor !== null &&
          built.batch.instanceColor.array.length === original.length &&
          [...(built.batch.instanceColor.array as Float32Array)].every(
            (value: number, index: number): boolean =>
              nclose(value, original[index]!, 0),
          ),
      ],
      [
        "created attribute removed",
        (): boolean => built.bare.instanceColor === null,
      ],
      [
        "background",
        (): boolean =>
          (built.scene.background as THREE.Color).getHex() === 0x123456,
      ],
      ["fog", (): boolean => built.scene.fog !== null],
      ["image lighting", (): boolean => built.scene.environment !== null],
      ["grid visible again", (): boolean => built.grid.visible],
      ["already-hidden line untouched", (): boolean => !built.darkLine.visible],
    ]),
    {
      materials: true,
      "instance colours": true,
      "created attribute removed": true,
      background: true,
      fog: true,
      "image lighting": true,
      "grid visible again": true,
      "already-hidden line untouched": true,
    },
  );

  const reversedDesign: IAutoMovieScene & { space: typeof ground } = {
    ...sceneFixture({ reversed: true }),
    space: ground,
  };
  const reversedBuilt: {
    scene: THREE.Scene;
    meshes: Map<string, THREE.Mesh>;
    beauty: Map<THREE.Mesh, THREE.Material | THREE.Material[]>;
    batch: THREE.InstancedMesh;
    bare: THREE.InstancedMesh;
    unslotted: THREE.InstancedMesh;
    grid: THREE.Object3D;
    darkLine: THREE.Object3D;
    sprite: THREE.Object3D;
    points: THREE.Object3D;
    orphan: THREE.Mesh;
    palette: Float32Array;
  } = build(reversedDesign, mask);
  const reversedHandle: import("@automovie/viewer").IAutoMovieSemanticMaskHandle =
    applyAutoMovieSemanticMask({
      scene: reversedBuilt.scene,
      design: reversedDesign,
      mask,
    });
  TestValidator.equals(
    "reversing the staged nodes repaints nothing",
    ["tower/hall-wall", "tower/hall-door-leaf", "lantern"].map(
      (id: string): string => hex(reversedBuilt.meshes.get(id)!),
    ),
    [
      colorOf("element:tower/hall-wall"),
      colorOf("element:tower/hall-door-leaf"),
      colorOf("node:lantern"),
    ],
  );
  reversedHandle.restore();

  TestValidator.equals(
    "a scene with too few children is refused rather than mis-resolved",
    throwsError(
      (): import("@automovie/viewer").IAutoMovieSemanticMaskHandle =>
        applyAutoMovieSemanticMask({
          scene: new THREE.Scene(),
          design,
          mask,
        }),
      "cannot resolve staged nodes",
    ),
    true,
  );

  // Existing simulated projections join by their actual builder names. The later palette/material assertion verifies that join through its behavior.
  const panel: import("@automovie/viewer").IAutoMovieSoftBodyObject =
    buildSoftBodyObject({
      surface: {
        domain: "panel",
        step: 0,
        mesh: {
          positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
          normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
          uvs: [0, 0, 1, 0, 0, 1],
          indices: [0, 1, 2],
          skin: null,
        },
        bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 0 } },
      },
      status: "derived",
    });
  const bed: import("@automovie/viewer").IAutoMoviePlantingObject =
    buildPlantingObject({
      plant: {
        domain: "fern",
        stage: 1,
        branches: [],
        leaves: [],
        bounds: null,
      },
      arrangement: {
        cluster: "atrium-bed",
        domain: "fern",
        placements: [],
        rejected: 0,
        bounds: null,
      },
    });
  const pond: import("@automovie/viewer").IAutoMovieFluidSurfaceObject =
    buildFluidSurfaceObject({
      surface: {
        domain: "basin",
        step: 0,
        mesh: {
          positions: [0, 0, 0, 1, 0, 0, 0, 0, 1],
          normals: [0, 1, 0, 0, 1, 0, 0, 1, 0],
          uvs: [0, 0, 1, 0, 0, 1],
          indices: [0, 1, 2],
          skin: null,
        },
        bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 0, z: 1 } },
        flow: [0, 0, 0, 0, 0, 0],
      },
    });
  const simulatedDesign: IAutoMovieScene = {
    id: "simulated",
    name: null,
    nodes: [],
    cameras: [],
    lights: [],
  };
  const simulatedSubject: IAutoMovieRenderSubject = {
    scene: simulatedDesign,
    models: modelsFixture(),
    softBodies: [
      {
        domain: softPanel({ columns: 2, rows: 2 }),
        owner: null,
        material: null,
      },
    ],
    plantings: [
      {
        domain: plantingRecipe(),
        cluster: plantingCluster(),
        owner: null,
        branchMaterial: null,
        leafMaterial: null,
        branch: { vertices: 40, triangles: 24 },
        leaf: { vertices: 4, triangles: 2 },
      },
    ],
    waterBodies: [
      {
        id: "atrium-pool",
        owner: null,
        nodes: [],
        domain: flatBasin({ columns: 2, rows: 2, depth: 1 }),
        cells: null,
        particles: null,
        material: null,
      },
    ],
  };
  const simulatedMask: IAutoMovieSemanticMask =
    deriveAutoMovieSemanticMask(simulatedSubject);
  const simulatedScene: THREE.Scene<THREE.Object3DEventMap> = new THREE.Scene();
  simulatedScene.add(panel.object, bed.object, pond.object);
  const stray: THREE.Mesh<
    THREE.BoxGeometry,
    THREE.MeshStandardMaterial,
    THREE.Object3DEventMap
  > = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial(),
  );
  simulatedScene.add(stray);
  const simulatedHandle: import("@automovie/viewer").IAutoMovieSemanticMaskHandle =
    applyAutoMovieSemanticMask({
      scene: simulatedScene,
      design: simulatedDesign,
      mask: simulatedMask,
    });
  const simulatedColor: (id: string) => string = (id: string): string =>
    simulatedMask.entries.find(
      (
        item: import("@automovie/interface").IAutoMovieSemanticMaskEntry,
      ): boolean => item.id === id,
    )!.color;
  TestValidator.equals(
    "a curtain, a bed and a pond paint their own identity instead of background",
    {
      panel: hex(panel.object),
      // The branch batch is a child of the cluster group, so it resolves through the ancestor the mask names rather than needing a name of its own: a bed is one thing a consumer asks about, not two.
      bed: hex(bed.branches),
      pond: hex(pond.object),
      stray: hex(stray),
      painted: simulatedHandle.painted,
      unaddressed: simulatedHandle.unaddressed,
    },
    {
      panel: simulatedColor("soft-body:panel"),
      bed: simulatedColor("planting:atrium-bed"),
      pond: simulatedColor("water-body:atrium-pool"),
      stray: simulatedMask.background,
      painted: 3,
      unaddressed: 1,
    },
  );
  simulatedHandle.restore();
  panel.dispose();
  bed.dispose();
  pond.dispose();
}
