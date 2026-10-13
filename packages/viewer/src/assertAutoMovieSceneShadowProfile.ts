import {resolveAutoMovieShadowProfile} from "@automovie/engine";
import type {IAutoMovieLight,IAutoMovieSceneEnvironment} from "@automovie/interface";
import type * as THREE from "three";
import {readAutoMovieShadowLightSource} from "./readAutoMovieShadowLightSource.js";

/**
 * Admit an actual scene's punctual shadow casters through the Engine profile.
 * Include hidden lights because their retained targets can participate in a
 * later sample. Runtime names, or native UUIDs when unnamed, identify this
 * scene projection; its light-array paths are not authored AST positions.
 * Area and ambient lights have no punctual shadow product. The caller resolves
 * effective renderer policy before any mutable pass state or GPU allocation.
 */
export const assertAutoMovieSceneShadowProfile=(scene:THREE.Scene,shadows:IAutoMovieSceneEnvironment["shadows"]):void=>{
  const lights:Pick<IAutoMovieLight,"id"|"type"|"castShadow">[]=[];
  scene.traverse(object=>{
    const light=readAutoMovieShadowLightSource(object.name||object.uuid,object);
    if(light!==null)lights.push(light);
  });
  const profile=resolveAutoMovieShadowProfile({lights,shadows});
  if(!profile.success)throw new Error("Unsupported shadow profile: "+JSON.stringify(profile.violations));
};
