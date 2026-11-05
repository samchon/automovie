import * as THREE from "three";

/**
 * Build the approved finite window bay and supported tea props in metres.
 * X runs right along the wall, Y up, Z out toward the open front. The wall is
 * Z=0; bench ends are X=1.8/3.6 and its front edge is Z=1.0. Cups begin on
 * the exposed right sill. The caller owns scene placement and cup animation.
 *
 * @evidence contracts/common.md#implementation-and-ownership Dimensions directly realize corridor#space and tea-cups#cups. Shared flat materials and individually owned geometries create actual supports, open-front access and hollow handled cups. Dispose retires all owned resources once.
 * @evidence contracts/common.md#authoring-interface Returns an environment group, a separately addressable fixed bench and two cup roots. Cup roots are at each base, with positive Y upright and handle toward positive X. Actor movement uses the documented metre frame; no hidden colliders or motion are supplied.
 */
export function createWindowBay(): {
  object: THREE.Group;
  bench: THREE.Group;
  cups: [THREE.Group, THREE.Group];
  dispose: () => void;
} {
  const object: THREE.Group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const stone: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ color: 0xb3aba0, roughness: 0.95 });
  const floor: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ color: 0x8d9297, roughness: 1 });
  const wood: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ color: 0x73513c, roughness: 0.85 });
  const ceramic: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ color: 0xf0e6d3, roughness: 0.42, side: THREE.DoubleSide });
  const tea: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ color: 0x965a24, roughness: 0.3 });
  const sky: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0xc7dfeb });
  materials.push(stone, floor, wood, ceramic, tea, sky);
  /** Add one centre-positioned solid with explicit dimensions to its owner. */
  const box: (parent: THREE.Object3D, size: [number, number, number], position: [number, number, number], material: THREE.Material) => THREE.Mesh = (
    parent: THREE.Object3D,
    size: [number, number, number],
    position: [number, number, number],
    material: THREE.Material,
  ): THREE.Mesh => {
    const geometry: THREE.BoxGeometry = new THREE.BoxGeometry(...size);
    geometries.push(geometry);
    const mesh: THREE.Mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    parent.add(mesh);
    return mesh;
  };
  box(object, [6, 0.05, 4], [3, -0.025, 2], floor);
  box(object, [6, 0.65, 0.12], [3, 0.325, -0.06], stone);
  box(object, [0.8, 3, 0.12], [0.4, 1.5, -0.06], stone);
  box(object, [1.6, 3, 0.12], [5.2, 1.5, -0.06], stone);
  box(object, [3.6, 0.65, 0.12], [2.6, 2.675, -0.06], stone);
  box(object, [3.6, 0.25, 0.12], [2.6, 0.775, -0.06], stone);
  box(object, [3.6, 1.4, 0.025], [2.6, 1.65, -0.065], sky);
  box(object, [3.6, 0.08, 0.3], [2.6, 0.91, 0.15], stone);
  box(object, [0.06, 1.48, 0.1], [0.8, 1.65, 0], stone);
  box(object, [0.06, 1.48, 0.1], [4.4, 1.65, 0], stone);
  box(object, [3.6, 0.06, 0.1], [2.6, 2.35, 0], stone);
  box(object, [0.1, 3, 4], [-0.05, 1.5, 2], stone);
  box(object, [0.1, 3, 4], [6.05, 1.5, 2], stone);
  box(object, [6, 0.05, 4], [3, 3.025, 2], stone);
  const bench: THREE.Group = new THREE.Group();
  bench.name = "fixed-four-leg-bench";
  object.add(bench);
  box(bench, [1.8, 0.05, 0.45], [2.7, 0.425, 0.775], wood);
  for (const x of [1.87, 3.53])
    for (const z of [0.62, 0.93]) box(bench, [0.07, 0.4, 0.07], [x, 0.2, z], wood);
  /** Construct a 9 cm hollow cup with its handle and supported tea surface. */
  const cup: (x: number) => THREE.Group = (x: number): THREE.Group => {
    const root: THREE.Group = new THREE.Group();
    const profile: THREE.Vector2[] = [
      new THREE.Vector2(0, 0), new THREE.Vector2(0.03, 0),
      new THREE.Vector2(0.04, 0.09), new THREE.Vector2(0.035, 0.09),
      new THREE.Vector2(0.025, 0.008), new THREE.Vector2(0, 0.008),
    ];
    const body: THREE.LatheGeometry = new THREE.LatheGeometry(profile, 16);
    const handle: THREE.TorusGeometry = new THREE.TorusGeometry(0.024, 0.005, 6, 12);
    const liquid: THREE.CircleGeometry = new THREE.CircleGeometry(0.032, 16);
    geometries.push(body, handle, liquid);
    root.add(new THREE.Mesh(body, ceramic));
    const grip: THREE.Mesh = new THREE.Mesh(handle, ceramic);
    grip.position.set(0.041, 0.049, 0);
    root.add(grip);
    const surface: THREE.Mesh = new THREE.Mesh(liquid, tea);
    surface.rotation.x = -Math.PI / 2;
    surface.position.y = 0.07;
    root.add(surface);
    root.position.set(x, 0.95, 0.15);
    object.add(root);
    return root;
  };
  const cups: [THREE.Group, THREE.Group] = [cup(3.75), cup(4.0)];
  return {
    object, bench, cups,
    /** Release fixed geometry/material resources after the caller removes the group. */
    dispose(): void {
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      object.clear();
    },
  };
}
