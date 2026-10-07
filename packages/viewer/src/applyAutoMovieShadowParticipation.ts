import type * as THREE from "three";

import { SPACE_GROUP_NAME } from "./buildSpace";

/**
 * Say which objects cast a shadow and which receive one.
 *
 * Every other link of the chain was already built. `stageScene` validates a
 * light's `castShadow` and refuses shadow settings without it, the render
 * inventory counts `shadowMaps` as `casters.length` and a budget constrains
 * that count, {@link buildLight} applies the flag and the whole shadow camera —
 * map size, bias, normal bias, near and far — and
 * {@link applySceneEnvironment} enables `renderer.shadowMap` from the scene's
 * own declaration and restores the prior state afterwards. Nothing set a flag
 * on an **object**, and `three.js` needs all three: an enabled map, a casting
 * light, and geometry that participates. So a production could declare a
 * caster, have it validated, budgeted, applied and rendered with the map on,
 * and no shadow would appear anywhere.
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
 * @evidence requirements/lighting/shadows-reflections-and-transmission.md#lighting-shadow-identity Distinguishes the casting and receiving objects the shadow identity requirement holds apart from the source's own size, direction and bias.
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-beauty-structural-distinction Prevents a structural-only support patch from entering beauty through shadow reception.
 * @evidence specifications/camera-light-and-visibility/light-transport-color-and-budget.md#clv-shadow-state-sampling Completes that shadow state at the object boundary, so the sampled state describes geometry that participates rather than a configured light with nothing to occlude.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Keeps structural support outside the beauty lighting product.
 * @author Samchon
 */
export const applyAutoMovieShadowParticipation = (
  root: THREE.Object3D,
): void => {
  const groups: THREE.Object3D[] = [];
  root.traverse((object) => {
    if (object.name === SPACE_GROUP_NAME) groups.push(object);
  });
  const ground = new Set<THREE.Object3D>();
  for (const group of groups)
    group.traverse((descendant) => ground.add(descendant));
  root.traverse((object) => {
    // `isMesh` covers `SkinnedMesh` and `InstancedMesh`, which is what makes a
    // compact population of several thousand members participate as one object
    // rather than not at all.
    if ((object as THREE.Mesh).isMesh !== true) return;
    const patch = ground.has(object);
    object.castShadow = !patch;
    object.receiveShadow = !patch;
  });
};
