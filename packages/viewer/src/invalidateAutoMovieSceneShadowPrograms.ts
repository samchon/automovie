import type * as THREE from "three";

/**
 * Invalidate unique scene materials after the effective shadow enablement or
 * filter changes. Three's program keys include shadow state, but changing the
 * renderer flag alone does not always reevaluate an existing material program.
 * The public needsUpdate boundary makes that changed state observable without
 * touching SDK methods or caches. Shared materials are marked only once.
 *
 * @evidence requirements/lighting/shadows-reflections-and-transmission.md#lighting-shadow-identity Recompiles current scene materials for the effective shadow enablement and filter family.
 * @evidence specifications/camera-light-and-visibility/light-transport-color-and-budget.md#clv-shadow-state-sampling Connects renderer shadow policy changes to material program realization.
 */
export const invalidateAutoMovieSceneShadowPrograms=(scene:THREE.Scene):void=>{
  const materials=new Set<THREE.Material>();
  if(scene.overrideMaterial!==null)materials.add(scene.overrideMaterial);
  scene.traverse(object=>{
    const material=(object as THREE.Mesh).material;
    if(Array.isArray(material))for(const value of material)materials.add(value);
    else if(material!==undefined)materials.add(material);
  });
  for(const material of materials)material.needsUpdate=true;
};
