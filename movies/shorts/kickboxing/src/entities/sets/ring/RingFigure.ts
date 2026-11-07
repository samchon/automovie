import * as THREE from "three";

import type { Ring } from "./Ring";

/**
 * The ring's displayed scenery: the pale matte canvas on its platform, the
 * dark apron, four padded posts in the corner colours and four ropes per
 * side at the settings heights, over a dark arena floor.
 *
 * ```ts
 * scene.add(ring.figure().object);
 * ```
 *
 * @evidence docs/body/settings/sets/ring.md#canvas Canvas, platform, ropes and posts.
 * @evidence docs/body/settings/sets/ring.md#corners Red and cyan corner pads.
 * @evidence docs/body/settings/sets/ring.md#neutral-corners Light neutral corner pads.
 */
export class RingFigure {
  /** The scenery's root. */
  public readonly object: THREE.Group = new THREE.Group();

  private readonly owned: { dispose(): void }[] = [];

  /** Canvas, apron, floor, rope, red, cyan and neutral pad colours. */
  public static readonly COLORS = {
    canvas: 0xd9d4c7,
    apron: 0x1b1d22,
    floor: 0x0b0d11,
    rope: 0xe8e8ea,
    red: 0xb51f2a,
    blue: 0x28c4d6,
    neutral: 0xe9e4d8,
  } as const;

  /**
   * Build the scenery.
   *
   * @param ring The ring.
   */
  public constructor(ring: Ring) {
    const c = RingFigure.COLORS;
    const material = (color: number, roughness: number): THREE.MeshStandardMaterial => {
      const m: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ color, roughness });
      this.owned.push(m);
      return m;
    };
    const box = (w: number, h: number, d: number): THREE.BoxGeometry => {
      const g: THREE.BoxGeometry = new THREE.BoxGeometry(w, h, d);
      this.owned.push(g);
      return g;
    };
    const canvas: THREE.Mesh = new THREE.Mesh(box(ring.canvasHalf * 2, 0.04, ring.canvasHalf * 2), material(c.canvas, 0.95));
    canvas.position.y = -0.02;
    canvas.receiveShadow = true;
    const apron: THREE.Mesh = new THREE.Mesh(box(ring.canvasHalf * 2 + 0.2, ring.platform, ring.canvasHalf * 2 + 0.2), material(c.apron, 0.9));
    apron.position.y = -ring.platform / 2 - 0.04;
    const floor: THREE.Mesh = new THREE.Mesh(box(40, 0.02, 40), material(c.floor, 1));
    floor.position.y = -ring.platform - 0.05;
    this.object.add(canvas, apron, floor);
    const corners: { x: number; z: number; color: number }[] = [
      { x: -ring.half, z: ring.half, color: c.red },
      { x: ring.half, z: -ring.half, color: c.blue },
      { x: ring.half, z: ring.half, color: c.neutral },
      { x: -ring.half, z: -ring.half, color: c.neutral },
    ];
    const top: number = ring.ropes[ring.ropes.length - 1]!;
    const post: THREE.CylinderGeometry = new THREE.CylinderGeometry(0.06, 0.06, top + 0.2, 12);
    const pad: THREE.BoxGeometry = box(0.22, top, 0.22);
    this.owned.push(post);
    for (const corner of corners) {
      const pole: THREE.Mesh = new THREE.Mesh(post, material(0x44474d, 0.5));
      pole.position.set(corner.x * 1.04, (top + 0.2) / 2, corner.z * 1.04);
      const cushion: THREE.Mesh = new THREE.Mesh(pad, material(corner.color, 0.8));
      cushion.position.set(corner.x, top / 2, corner.z);
      this.object.add(pole, cushion);
    }
    const ropeMaterial: THREE.MeshStandardMaterial = material(c.rope, 0.6);
    const rope: THREE.CylinderGeometry = new THREE.CylinderGeometry(0.02, 0.02, ring.half * 2, 8);
    this.owned.push(rope);
    for (const height of ring.ropes)
      for (const [x, z, along] of [[0, ring.half, "x"], [0, -ring.half, "x"], [ring.half, 0, "z"], [-ring.half, 0, "z"]] as const) {
        const mesh: THREE.Mesh = new THREE.Mesh(rope, ropeMaterial);
        mesh.position.set(x, height, z);
        if (along === "x") mesh.rotation.z = Math.PI / 2;
        else mesh.rotation.x = Math.PI / 2;
        this.object.add(mesh);
      }
  }

  /** Release the scenery. */
  public dispose(): void {
    for (const o of this.owned) o.dispose();
    this.object.removeFromParent();
  }
}
