import type * as THREE from "three";

import { SPACE_GROUP_NAME } from "./buildSpace.js";

/**
 * Say which objects cast a shadow and which receive one.
 *
 * `stageScene` validates a light's `castShadow` and refuses shadow settings
 * without it; the render inventory counts casters and its budget constrains
 * that count. {@link buildLight} applies the flag and shadow camera settings,
 * while {@link applyRendererEnvironment} sets the renderer shadow policy
 * reversibly. This adapter supplies the remaining mesh participation flags;
 * enabled maps and casting lights alone do not make a mesh participate.
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
 * place, which is here. A model's parts are solids: they cast and they receive,
 * except that a mesh with a blended (transparent) material receives but does
 * not cast, since a shadow map draws it fully opaque. The standable surfaces
 * under {@link SPACE_GROUP_NAME} are open patches for structural guides and
 * optional flat color. They neither cast nor receive. A volume-free patch
 * casting onto its own plane produces depth acne, and its basic material has no
 * shadow response. Objects without geometry are untouched.
 *
 * Exported, and separate from {@link buildScene}, for the reason
 * {@link applySceneFog} is: a host that assembles its own scene graph — a
 * production's film page, which is what the offline renderer captures — must
 * make the same call, or it captures a production whose shadows were declared
 * and never drawn.
 *
 * A scene that declares no shadows is unaffected. `three.js` compiles no shadow
 * code and renders no depth pass while `renderer.shadowMap.enabled` is false,
 * so these flags are inert until a production turns shadows on, and only such a
 * production sees its frames change.
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
    // A blended surface (a lantern's glass globe, a flame, a screen's graphic)
    // would cast a fully opaque shadow, because the shadow map ignores
    // opacity, and would shut its own light in; it casts none.
    const material: THREE.Material | THREE.Material[] = (object as THREE.Mesh)
      .material;
    const blended: boolean = (
      Array.isArray(material) ? material : [material]
    ).some((entry: THREE.Material): boolean => entry.transparent);
    object.castShadow = !patch && !blended;
    object.receiveShadow = !patch;
  });
};
