import type {
  IAutoMovieScene,
  IAutoMovieSemanticMask,
} from "@automovie/interface";
import type { IAutoMovieFormationCycle } from "@automovie/viewer";
import * as THREE from "three";

/** Existing route-only cycle input; tests its material hook key, not deformation or full bake validity. */
const cycle: () => IAutoMovieFormationCycle = (): IAutoMovieFormationCycle =>
  ({
    samples: 1,
    names: [],
    takes: new Map(),
    fallback: null,
    active: null,
    uniforms: {},
  }) as unknown as IAutoMovieFormationCycle;

/** Preserve the existing anonymous leading-node graph and all additional CPU test objects; this is a construction-contract input, not an independently observed render. */
export function createSemanticMaskViewerTestGraph(
  design: IAutoMovieScene,
  mask: IAutoMovieSemanticMask,
): {
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
} {
  const scene: THREE.Scene<THREE.Object3DEventMap> = new THREE.Scene();
  scene.background = new THREE.Color(0x123456);
  scene.fog = new THREE.FogExp2(0x223344, 0.02);
  scene.environment = new THREE.Texture();
  const meshes: Map<
    string,
    THREE.Mesh<
      THREE.BufferGeometry<
        THREE.NormalBufferAttributes,
        THREE.BufferGeometryEventMap
      >,
      | THREE.Material<THREE.MaterialEventMap>
      | THREE.Material<THREE.MaterialEventMap>[],
      THREE.Object3DEventMap
    >
  > = new Map<string, THREE.Mesh>();
  const geometry: THREE.BoxGeometry = new THREE.BoxGeometry(1, 1, 1);
  for (const node of design.nodes) {
    const group: THREE.Group<THREE.Object3DEventMap> = new THREE.Group();
    const mesh: THREE.Mesh<
      THREE.BoxGeometry,
      THREE.MeshStandardMaterial,
      THREE.Object3DEventMap
    > = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
    // A crowd carries its baked cycle on the mesh; the override must inherit it.
    mesh.userData.automovieFormationCycle = cycle();
    group.add(mesh);
    scene.add(group);
    meshes.set(node.id, mesh);
  }
  const groundGroup: THREE.Group<THREE.Object3DEventMap> = new THREE.Group();
  groundGroup.name = "__automovie_space";
  const groundPatch: THREE.Mesh<
    THREE.BoxGeometry,
    THREE.MeshStandardMaterial,
    THREE.Object3DEventMap
  > = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
  groundGroup.add(groundPatch);
  scene.add(groundGroup);
  meshes.set("__automovie_space", groundPatch);

  const setGroup: THREE.Group<THREE.Object3DEventMap> = new THREE.Group();
  setGroup.name = "instance-set:windows";
  const textured: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial();
  textured.map = new THREE.Texture();
  // Slot 99 is outside the compiled set, so a supplied slot with no entry of its own must take the set colour instead of an unowned identity.
  const batch: THREE.InstancedMesh<
    THREE.BoxGeometry,
    THREE.MeshStandardMaterial,
    THREE.Object3DEventMap
  > = new THREE.InstancedMesh(geometry, textured, 4);
  batch.userData.automovieSlots = [0, 1, 2, 99];
  const seed: THREE.Color = new THREE.Color(0.25, 0.5, 0.75);
  for (let index: number = 0; index < 4; ++index) batch.setColorAt(index, seed);
  // An instanced batch with slots but no palette of its own requires the override to create the attribute and take it away again on restore.
  const bare: THREE.InstancedMesh<
    THREE.BoxGeometry,
    THREE.MeshStandardMaterial,
    THREE.Object3DEventMap
  > = new THREE.InstancedMesh(geometry, new THREE.MeshStandardMaterial(), 1);
  bare.userData.automovieSlots = [1];
  // Three more shapes share one instance-set group: a batch declaring no slots, a batch declaring an empty slot list, and an ordinary mesh that is not instanced at all.
  const unslotted: THREE.InstancedMesh<
    THREE.BoxGeometry,
    THREE.MeshStandardMaterial,
    THREE.Object3DEventMap
  > = new THREE.InstancedMesh(geometry, new THREE.MeshStandardMaterial(), 1);
  const emptySlots: THREE.InstancedMesh<
    THREE.BoxGeometry,
    THREE.MeshStandardMaterial,
    THREE.Object3DEventMap
  > = new THREE.InstancedMesh(geometry, new THREE.MeshStandardMaterial(), 1);
  emptySlots.userData.automovieSlots = [];
  const plain: THREE.Mesh<
    THREE.BoxGeometry,
    THREE.MeshStandardMaterial[],
    THREE.Object3DEventMap
  > = new THREE.Mesh(geometry, [
    new THREE.MeshStandardMaterial(),
    new THREE.MeshStandardMaterial(),
  ]);
  setGroup.add(batch);
  setGroup.add(bare);
  setGroup.add(unslotted);
  setGroup.add(emptySlots);
  setGroup.add(plain);
  scene.add(setGroup);

  // Geometry with no index and geometry with neither index nor positions must both be counted without inventing a triangle.
  const loose: THREE.Mesh<
    THREE.BufferGeometry<
      THREE.NormalBufferAttributes,
      THREE.BufferGeometryEventMap
    >,
    THREE.MeshStandardMaterial,
    THREE.Object3DEventMap
  > = new THREE.Mesh(
    new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(9), 3),
    ),
    new THREE.MeshStandardMaterial(),
  );
  scene.add(loose);
  scene.add(
    new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshStandardMaterial(),
    ),
  );

  // One mesh no entry claims, and one hidden mesh nothing draws.
  const orphan: THREE.Mesh<
    THREE.BoxGeometry,
    THREE.MeshStandardMaterial,
    THREE.Object3DEventMap
  > = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
  scene.add(orphan);
  const hidden: THREE.Mesh<
    THREE.BoxGeometry,
    THREE.MeshStandardMaterial,
    THREE.Object3DEventMap
  > = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
  hidden.visible = false;
  scene.add(hidden);

  // Non-mesh renderables retain their beauty material unless the structural pass hides them; the already-hidden one must remain hidden after restore.
  const grid: THREE.LineSegments<
    THREE.BufferGeometry<
      THREE.NormalBufferAttributes,
      THREE.BufferGeometryEventMap
    >,
    | THREE.Material<THREE.MaterialEventMap>
    | THREE.Material<THREE.MaterialEventMap>[],
    THREE.Object3DEventMap
  > = new THREE.LineSegments(new THREE.BufferGeometry());
  const darkLine: THREE.LineSegments<
    THREE.BufferGeometry<
      THREE.NormalBufferAttributes,
      THREE.BufferGeometryEventMap
    >,
    | THREE.Material<THREE.MaterialEventMap>
    | THREE.Material<THREE.MaterialEventMap>[],
    THREE.Object3DEventMap
  > = new THREE.LineSegments(new THREE.BufferGeometry());
  darkLine.visible = false;
  const sprite: THREE.Sprite<THREE.Object3DEventMap> = new THREE.Sprite();
  const points: THREE.Points<
    THREE.BufferGeometry<
      THREE.NormalBufferAttributes,
      THREE.BufferGeometryEventMap
    >,
    | THREE.Material<THREE.MaterialEventMap>
    | THREE.Material<THREE.MaterialEventMap>[],
    THREE.Object3DEventMap
  > = new THREE.Points(new THREE.BufferGeometry());
  scene.add(grid);
  scene.add(darkLine);
  scene.add(sprite);
  scene.add(points);

  const sun: THREE.DirectionalLight = new THREE.DirectionalLight();
  sun.castShadow = true;
  scene.add(sun);
  const dark: THREE.PointLight = new THREE.PointLight();
  dark.visible = false;
  scene.add(dark);

  const beauty: Map<
    THREE.Mesh<
      THREE.BufferGeometry<
        THREE.NormalBufferAttributes,
        THREE.BufferGeometryEventMap
      >,
      | THREE.Material<THREE.MaterialEventMap>
      | THREE.Material<THREE.MaterialEventMap>[],
      THREE.Object3DEventMap
    >,
    | THREE.Material<THREE.MaterialEventMap>
    | THREE.Material<THREE.MaterialEventMap>[]
  > = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  scene.traverse((object: THREE.Object3D<THREE.Object3DEventMap>): void => {
    const mesh: THREE.Mesh<
      THREE.BufferGeometry<
        THREE.NormalBufferAttributes,
        THREE.BufferGeometryEventMap
      >,
      | THREE.Material<THREE.MaterialEventMap>
      | THREE.Material<THREE.MaterialEventMap>[],
      THREE.Object3DEventMap
    > = object as THREE.Mesh;
    if (mesh.isMesh === true) beauty.set(mesh, mesh.material);
  });
  void mask;
  return {
    scene,
    meshes,
    beauty,
    batch,
    bare,
    unslotted,
    grid,
    darkLine,
    sprite,
    points,
    orphan,
    palette: (batch.instanceColor!.array as Float32Array).slice(),
  };
}
