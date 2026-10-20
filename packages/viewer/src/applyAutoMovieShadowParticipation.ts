import type * as THREE from "three";

import { SPACE_GROUP_NAME } from "./buildSpace.js";

/**
 * Say which objects cast a shadow and which receive one.
 *
 * `stageScene` validates a light's `castShadow` and refuses shadow settings without it; the render inventory counts casters and its budget constrains that count. {@link buildLight} applies the flag and shadow camera settings, while {@link applyRendererEnvironment} sets the renderer shadow policy reversibly. This adapter supplies the remaining mesh participation flags; enabled maps and casting lights alone do not make a mesh participate.
 *
 * That absence is not visible as an absence. A benchmark authored a fascia and
 * soffit band with a deliberate dark recess above the wall, and the darkening
 * reads as a shadow in every captured frame while being nothing but geometry
 * and material response to light direction. Building the appearance out of
 * geometry is what an author reaches for when the mechanism is missing and no
 * gate says it is missing.
 *
 * The requirement asks for caster and receiver to be **distinguished** rather
 * than blanket-enabled, and the product knows the difference at exactly one
 * place, which is here. A model's parts are solids: they cast and they receive.
 * The standable surfaces under {@link SPACE_GROUP_NAME} are semantic patches
 * reserved for structural guide passes. They neither cast nor receive: a flat
 * volume-free patch casting onto its own plane produces depth acne, while a
 * patch receiving a shadow would promote the declaration back into beauty
 * evidence of a physical floor. Anything carrying no geometry is untouched.
 *
 * Exported, and separate from {@link buildScene}, for the reason
 * {@link applySceneFog} is: a host that assembles its own scene graph — the
 * playground's film page, which is what the offline renderer captures — must
 * make the same call, or it captures a production whose shadows were declared
 * and never drawn.
 *
 * A scene that declares no shadows is unaffected. `three.js` compiles no shadow
 * code and renders no depth pass while `renderer.shadowMap.enabled` is false,
 * so these flags are inert until a production turns shadows on, and only such a
 * production sees its frames change.
 *
 * @evidence contracts/common.md#principled-implementation Marks actual mesh/skinned/instanced geometry as caster/receiver except descendants of the reserved semantic-space group; declared support patches have no physical volume and are structural-guide geometry, while renderer/light owners separately enable actual shadow rendering.
 * @evidence contracts/common.md#clear-and-simple-design Owns object participation once for built and manually assembled scene hosts, keeping light shadow configuration and renderer policy with their own declarations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reserved SPACE_GROUP_NAME is a structural viewer identity rather than a fixture name; this uniformly overwrites mesh flags by role and does not emulate a shadow with dark geometry or replace Three internals.
 * @evidence contracts/common.md#meaningful-documentation Describes model/semantic-ground distinction, mesh subclasses and the separate enabled-renderer/casting-light prerequisites; flags alone do not prove a visible shadow.
 * @evidence contracts/performance.md#efficient-algorithms Traverses the scene to find reserved groups, visits their descendants into an identity Set and traverses meshes again for constant-time membership; time is O(objects plus reserved descendant visits), potentially repeated for nested reserved groups, and temporary space is linear in semantic-ground objects.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the reserved shared naming contract and one ground Set within a call; scene hierarchy/roles can change, so no cross-call participation cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows scene objects, retains only temporary group/ground collections and acquires no shadow map or task; persistent boolean flags remain with each host-owned object.
 */
export const applyAutoMovieShadowParticipation: (
  root: THREE.Object3D,
) => void = (root: THREE.Object3D): void => {
  const groups: THREE.Object3D[] = [];
  root.traverse((object: THREE.Object3D<THREE.Object3DEventMap>): void => {
    if (object.name === SPACE_GROUP_NAME) groups.push(object);
  });
  const ground: Set<THREE.Object3D<THREE.Object3DEventMap>> =
    new Set<THREE.Object3D>();
  for (const group of groups)
    group.traverse(
      (
        descendant: THREE.Object3D<THREE.Object3DEventMap>,
      ): Set<THREE.Object3D<THREE.Object3DEventMap>> => ground.add(descendant),
    );
  root.traverse((object: THREE.Object3D<THREE.Object3DEventMap>): void => {
    // `isMesh` covers `SkinnedMesh` and `InstancedMesh`, which is what makes a
    // compact population of several thousand members participate as one object
    // rather than not at all.
    if ((object as THREE.Mesh).isMesh !== true) return;
    const patch: boolean = ground.has(object);
    object.castShadow = !patch;
    object.receiveShadow = !patch;
  });
};
