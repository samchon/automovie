import * as THREE from "three";

/**
 * Build the adopted eight-by-four metre waiting recess in one world frame.
 * East is +X, south is +Z, paving is Y=0; the north inner wall is Z=-2.
 *
 * @evidence contracts/common.md#implementation-and-ownership Constructs the current courtyard/bench dimensions as fixed polygon furniture. The west 1.2 m opening is centred at Z=0.6, with the bench centre 2.2 m east of the west boundary. No room, crowd or decorative prop is invented. Owns its geometries/materials and disposes them once.
 * @evidence contracts/common.md#authoring-interface Returns a single fixed set group and disposal closure. Actors and note remain independently owned; the bench is backless solid stone with its north edge on the inner wall. All lengths are metres.
 */
export function createCourtyard(): { object: THREE.Group; dispose: () => void } {
  const object: THREE.Group = new THREE.Group();
  object.name = "school-side-courtyard";
  const geometries: THREE.BufferGeometry[] = [];
  const materials: Map<number, THREE.MeshStandardMaterial> = new Map();

  /** Reuse matte materials so the set stays subordinate to the white note. */
  function box(name: string, size: [number, number, number], at: [number, number, number], color: number): void {
    if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: 1 }));
    const geometry: THREE.BoxGeometry = new THREE.BoxGeometry(...size);
    geometries.push(geometry);
    const mesh: THREE.Mesh = new THREE.Mesh(geometry, materials.get(color));
    mesh.name = name;
    mesh.position.set(...at);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    object.add(mesh);
  }

  box("level-paving", [8, 0.12, 4], [0, -0.06, 0], 0xb7b9b8);
  box("level-west-passage", [2.4, 0.12, 1.2], [-5.2, -0.06, 0.6], 0xb7b9b8);
  box("unused-south-ground", [8, 0.12, 3], [0, -0.06, 3.5], 0xb7b9b8);
  box("north-wall", [8.25, 2.4, 0.25], [0.125, 1.2, -2.125], 0xc4bba6);
  box("west-return-north", [0.25, 2.4, 2], [-4.125, 1.2, -1], 0xc4bba6);
  box("west-return-south", [0.25, 2.4, 0.8], [-4.125, 1.2, 1.6], 0xc4bba6);
  box("rehearsal-bench", [1.6, 0.45, 0.4], [-1.8, 0.225, -1.8], 0x858a8a);

  // Flush tonal joints indicate limestone slabs without raised collision edges.
  for (let index: number = 1; index < 8; index++)
    box(`joint-east-${index}`, [0.008, 0.001, 4], [-4 + index, 0.0001, 0], 0xa4a7a6);
  for (let index: number = 1; index < 4; index++)
    box(`joint-south-${index}`, [8, 0.001, 0.008], [0, 0.0001, -2 + index], 0xa4a7a6);
  let disposed: boolean = false;
  return { object, dispose: (): void => {
    if (disposed) return;
    disposed = true;
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials.values()) material.dispose();
    object.clear();
  } };
}
