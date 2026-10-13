import type {AutoMovieGuidePass,IAutoMovieSceneEnvironment} from "@automovie/interface";
import * as THREE from "three";

import {applyRendererEnvironment} from "./applyRendererEnvironment.js";
import {applyRenderMode} from "./applyRenderMode.js";
import {invalidateAutoMovieSceneShadowPrograms} from "./invalidateAutoMovieSceneShadowPrograms.js";
import {resetAutoMovieSceneShadowTargets} from "./resetAutoMovieSceneShadowTargets.js";
import {restoreAutoMovieRenderModeState} from "./restoreAutoMovieRenderModeState.js";
import {assertAutoMovieSceneShadowProfile} from "./assertAutoMovieSceneShadowProfile.js";

/**
 * Draw a scene sample under reversible environment and material-pass owners.
 * Both owners are restored independently, even after drawing or one restore
 * fails. The primary failure remains first rather than being replaced by a
 * secondary restoration error. Caller-owned scene and renderer are retained.
 */
export const renderAutoMovieScenePass=(renderer:THREE.WebGLRenderer,scene:THREE.Scene,camera:THREE.Camera,environment:IAutoMovieSceneEnvironment|null|undefined,pass:AutoMovieGuidePass,delivery?:IAutoMovieSceneEnvironment["toneMapping"]):void=>{
  const priorShadows={enabled:renderer.shadowMap.enabled,type:renderer.shadowMap.type};
  const requestedShadows=pass==="beauty" && environment!==null && environment!==undefined ? environment.shadows : {
    enabled:pass==="beauty" && priorShadows.enabled,
    type:priorShadows.type===THREE.VSMShadowMap?"vsm" as const:"pcf" as const,
  };
  assertAutoMovieSceneShadowProfile(scene,requestedShadows);
  const handle=applyRendererEnvironment(renderer,environment,pass,delivery);
  const shadowProgramsChanged=priorShadows.enabled!==renderer.shadowMap.enabled || priorShadows.type!==renderer.shadowMap.type;
  const shadowTargetsChanged=priorShadows.type!==renderer.shadowMap.type;
  const retireShadowTargets=()=>restoreAutoMovieRenderModeState([
    ()=>{renderer.shadowMap.needsUpdate=true;},
    ()=>{resetAutoMovieSceneShadowTargets(scene,renderer);},
  ]);
  let mode:ReturnType<typeof applyRenderMode>|undefined;
  const failures:unknown[]=[];
  try { if(shadowProgramsChanged)invalidateAutoMovieSceneShadowPrograms(scene);if(shadowTargetsChanged)retireShadowTargets();mode=applyRenderMode(scene,pass);renderer.render(scene,camera); }
  catch(error){failures.push(error);}
  if(mode!==undefined)try{mode.restore();}catch(error){failures.push(error);}
  try{handle.restore();}catch(error){failures.push(error);}
  if(shadowProgramsChanged)try{invalidateAutoMovieSceneShadowPrograms(scene);}catch(error){failures.push(error);}
  if(shadowTargetsChanged)try{retireShadowTargets();}catch(error){failures.push(error);}
  if(failures.length===1)throw failures[0];
  if(failures.length>1)throw new AggregateError(failures,"Scene rendering or pass restoration failed.");
};
