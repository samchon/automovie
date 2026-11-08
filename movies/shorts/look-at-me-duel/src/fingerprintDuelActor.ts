import * as THREE from "three";

import type { createDuelActor } from "./createDuelActor";

/**
 * Bind fixed playback to the actual generated actor surfaces and attachments.
 * @evidence contracts/common.md#implementation-and-ownership Reads actual local vertex/index arrays and static mesh transforms in construction order, including Human surfaces, shoes, uniform and wand. Pose-bearing parent transforms and the actor world placement are excluded because fixed frames own them. SHA256 identifies these observed browser bytes, not a cross-host calibration guarantee or a collision certificate.
 * @evidence contracts/common.md#authoring-interface Call once before scene preparation moves the figures. Returns the actual mesh/vertex counts and digest. Whole replay compares its own newly generated surfaces with the observed bake; incompatible geometry refuses rather than inheriting another model's support approval. No geometry, pose, provider or resource ownership changes.
 */
export async function fingerprintDuelActor(actor: ReturnType<typeof createDuelActor>): Promise<{ sha256: string; meshes: number; vertices: number }> {
  const records: object[] = [];
  let vertices: number = 0;
  actor.object.traverse((node: THREE.Object3D): void => {
    if (!(node instanceof THREE.Mesh)) return;
    const position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute | undefined = node.geometry.getAttribute("position");
    if (position === undefined) throw new Error("Actor mesh lacks actual position data");
    const points: number[] = [];
    for (let index: number = 0; index < position.count; index++) points.push(position.getX(index), position.getY(index), position.getZ(index));
    vertices += position.count;
    records.push({ name: node.name, parent: node.parent?.name ?? "", position: node.position.toArray(), quaternion: node.quaternion.toArray(), scale: node.scale.toArray(), points, indices: node.geometry.index === null ? null : Array.from(node.geometry.index.array) });
  });
  const digest: ArrayBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(records)));
  return { sha256: Array.from(new Uint8Array(digest)).map((byte: number): string => byte.toString(16).padStart(2, "0")).join(""), meshes: records.length, vertices };
}
