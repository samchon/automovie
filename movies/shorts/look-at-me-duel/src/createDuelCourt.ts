import * as THREE from "three";

/**
 * Build the complete sparse court and finite hazard/effect population.
 *
 * @evidence contracts/common.md#implementation-and-ownership Dimensions come from training-court, stone-support and wand-magic settings. World +X is east, +Y up and -Z north. The cap is separate from its shallow bearing and two mortar contacts; its pivot at the rear lower contact leaves free space south of the upright. This asset builder owns geometry/materials only, not fracture simulation or motion acceptance.
 * @evidence contracts/common.md#authoring-interface Add the returned object once; the performance owner alone moves the cap, toggles joints and places the two chips, finite grit, three fragments, shield and low dust. The support remains fixed. Dispose once after use; materials shared within this court are retired once.
 */
export function createDuelCourt(): {
  object: THREE.Group;
  cap: THREE.Group;
  base: THREE.Mesh;
  bearing: THREE.Mesh;
  upright: THREE.Mesh;
  lowerJoint: THREE.Mesh;
  upperJoint: THREE.Mesh;
  chips: THREE.Mesh[];
  grit: THREE.Mesh[];
  fragments: THREE.Mesh[];
  dust: THREE.Mesh;
  shield: THREE.Mesh;
  dispose: () => void;
} {
  const object: THREE.Group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  /** Create one owned dimensioned solid; no sampled source mesh is substituted. */
  function solid(name: string, size: [number, number, number], position: [number, number, number], color: number): THREE.Mesh {
    const geometry: THREE.BoxGeometry = new THREE.BoxGeometry(...size);
    const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
    const mesh: THREE.Mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    object.add(mesh);
    geometries.push(geometry);
    materials.push(material);
    return mesh;
  }

  solid("bare ground", [16, 0.08, 14], [0, -0.13, 0], 0x887763);
  solid("stone court", [8, 0.10, 6], [0, -0.05, 0], 0x969b96);
  solid("low north boundary", [8, 0.45, 0.15], [0, 0.225, -3.075], 0x78817a);
  const base: THREE.Mesh = solid("support base", [1, 0.12, 1], [1.7, 0.06, -2.3], 0x68736b);
  const upright: THREE.Mesh = solid("standing upright", [0.6, 2.88, 0.5], [1.7, 1.56, -2.55], 0x768079);
  const bearing: THREE.Mesh = solid("rear bearing ledge", [0.8, 0.08, 0.10], [1.7, 2.66, -2.30], 0x818a82);
  const cap: THREE.Group = new THREE.Group();
  cap.name = "one principal cap block";
  cap.position.set(1.7, 2.70, -2.30);
  object.add(cap);
  const block: THREE.Mesh = solid("cap stone", [0.8, 0.25, 1], [0, 0.125, 0.50], 0x929b91);
  cap.add(block);
  const lowerJoint: THREE.Mesh = solid("cracked lower mortar", [0.79, 0.045, 0.06], [1.7, 2.70, -2.27], 0xd6ccad);
  for (let crack: number = 0; crack < 3; crack++) {
    const mark: THREE.Mesh = solid(`lower mortar crack ${crack + 1}`, [0.14, 0.008, 0.063], [1.53 + crack * 0.11, 2.70 + (crack % 2 === 0 ? 0.008 : -0.006), -2.268], 0x303a32);
    mark.rotation.z = crack % 2 === 0 ? 0.12 : -0.12;
    lowerJoint.attach(mark);
  }
  const upperJoint: THREE.Mesh = solid("upper retaining mortar", [0.79, 0.045, 0.064], [1.7, 2.94, -2.268], 0xc2b89b);
  const chips: THREE.Mesh[] = [];
  const grit: THREE.Mesh[] = [];
  const fragments: THREE.Mesh[] = [];
  for (let index: number = 0; index < 2; index++)
    chips.push(solid(`joint chip ${index + 1}`, [0.03, 0.025, 0.035], [0, -5, 0], 0x999b89));
  for (let index: number = 0; index < 14; index++)
    grit.push(solid(`bounded grit ${index + 1}`, [0.008, 0.008, 0.008], [0, -5, 0], 0xb7aa8d));
  for (let index: number = 0; index < 3; index++)
    fragments.push(solid(`impact fragment ${index + 1}`, [0.055, 0.045, 0.06], [0, -5, 0], 0x858d80));

  const shieldGeometry: THREE.SphereGeometry = new THREE.SphereGeometry(1, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  shieldGeometry.rotateZ(-Math.PI / 2);
  const shieldMaterial: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0xa9e5fb, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false });
  const shield: THREE.Mesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
  shield.name = "fragment-only shield";
  shield.scale.set(0.10, 0.90, 0.75);
  shield.visible = false;
  object.add(shield);
  geometries.push(shieldGeometry);
  materials.push(shieldMaterial);
  const dustGeometry: THREE.SphereGeometry = new THREE.SphereGeometry(1, 10, 6);
  const dustMaterial: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0xb6b4a4, transparent: true, opacity: 0, depthWrite: false });
  const dust: THREE.Mesh = new THREE.Mesh(dustGeometry, dustMaterial);
  dust.name = "bounded low dust";
  dust.visible = false;
  object.add(dust);
  geometries.push(dustGeometry);
  materials.push(dustMaterial);
  return {
    object, cap, base, bearing, upright, lowerJoint, upperJoint, chips, grit, fragments, dust, shield,
    dispose: (): void => {
      object.removeFromParent();
      object.clear();
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
    },
  };
}
