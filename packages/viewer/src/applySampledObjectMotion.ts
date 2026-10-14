import type { IAutoMovieSampledChannel } from "@automovie/engine";
import type * as THREE from "three";

/**
 * Write an already-authoritative sample table to borrowed Three scene objects.
 *
 * Transforms use engine vector/quaternion order and write parent-local fields; the caller supplies samples in that frame, with no world-to-local conversion here. Morph weights address each descendant mesh's glTF index order, stop at its influence count and preserve omitted entries. Missing objects and non-node channels are skipped. The current four-path switch does not assert exhaustiveness for future unions.
 *
 * @evidence contracts/common.md#principled-implementation Writes engine-admitted translation/scale triples and quaternion quadruples directly into parent-local transform fields, and indexed weights to existing mesh influences; input coordinate frame, vector widths and rotation validity are caller/sampler premises, while unresolved nodes and unmatched trailing morph indices are tolerated.
 * @evidence contracts/common.md#clear-and-simple-design Owns the scene mutation for both clip entry points; a private morph traversal handles the one path whose target is a descendant collection instead of an Object3D transform.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses channel kind/path and the supplied resolver rather than fixture names or patched Three methods; it neither invents absent values nor repairs malformed numeric samples.
 * @evidence contracts/common.md#meaningful-documentation Gives coordinate/vector conventions, indexed morph behavior, skipped inputs, partial writes and the lack of a future-path exhaustive assertion.
 * @evidence contracts/performance.md#efficient-algorithms Visits S sampled channels once; transform writes are constant cost and each weights channel visits its target subtree plus the influences actually written, with only traversal callback allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work Both single and sequence sampling reuse this writer; no scene lookup or morph result is memoized because objects, hierarchy and influences may change between calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows the sample map and scene targets, owns no geometries/materials/workers and retains nothing after traversal; scene writes intentionally remain with the host.
 */
export const applySampledObjectMotion: (
  sampled: ReadonlyMap<string, IAutoMovieSampledChannel>,
  resolve: (node: string) => THREE.Object3D | undefined,
) => void = (
  sampled: ReadonlyMap<string, IAutoMovieSampledChannel>,
  resolve: (node: string) => THREE.Object3D | undefined,
): void => {
  for (const { channel, value } of sampled.values()) {
    if (channel.kind !== "node") continue;
    const object: THREE.Object3D | undefined = resolve(channel.node);
    if (object === undefined) continue;
    switch (channel.path) {
      case "translation":
        object.position.set(value[0]!, value[1]!, value[2]!);
        break;
      case "rotation":
        object.quaternion.set(value[0]!, value[1]!, value[2]!, value[3]!);
        break;
      // scale is a first-class engine channel (sampleClip validates width 3,
      // resolveFrame composes it into node matrices). Dropping it rendered
      // scaling props rigid while every engine consumer saw them grow (#1049)
      case "scale":
        object.scale.set(value[0]!, value[1]!, value[2]!);
        break;
      case "weights":
        applyMorphWeights(object, value);
        break;
    }
  }
};

/**
 * Write a sampled `weights` vector onto every morphable mesh under `object`.
 *
 * The fourth node path was the last one this helper dropped in silence (#1357):
 * the artifact gate accepts a `weights` track, `resolveFrame` interpolates it
 * into its `weights` output, and the render left the mesh at whatever it
 * already had, so a committed clip that morphs a prop validated clean and
 * changed nothing on screen. Same class as `scale` before #1049.
 *
 * The vector is INDEXED, not named: entry `i` drives morph target `i`, the glTF
 * order the mesh was built or imported with. That is the only convention
 * available here, because a track addresses a node rather than a channel name,
 * and it is deliberately different from {@link applyExpression}, which drives
 * semantic ARKit/preset channels BY NAME on an expression sink.
 *
 * A mesh with no morph targets is skipped, and a vector longer than a mesh's
 * influence array writes the entries that exist: a clip authored against one
 * model must not throw when a host swaps in another, the same tolerance the
 * unresolved-node case above already has.
 */
const applyMorphWeights: (object: THREE.Object3D, value: number[]) => void = (object: THREE.Object3D, value: number[]): void => {
  object.traverse((child: THREE.Object3D): void => {
    const influences: number[] | undefined = (child as THREE.Mesh).morphTargetInfluences;
    if (influences === undefined) return;
    const count: number = Math.min(influences.length, value.length);
    for (let i: number = 0; i < count; ++i) influences[i] = value[i]!;
  });
};
