import type {IAutoMovieSceneEnvironment} from "@automovie/interface";
import {applyRendererEnvironment,renderAutoMovieScenePass,attachAutoMovieSemanticMask} from "@automovie/viewer";
import {deriveAutoMovieSemanticMask} from "@automovie/engine";
import {TestValidator} from "@nestia/e2e";
import * as THREE from "three";
import {sceneFixture,modelsFixture,buildingFixture} from "../internal/renderFixtures";

const environment:IAutoMovieSceneEnvironment={image:null,background:null,intensity:1,rotationDeg:0,exposure:1.25,toneMapping:"acesFilmic",shadows:{enabled:true,type:"pcf"}};

/** A host's mutable renderer properties with independently failing setters. */
const createHost=()=>{
  const initial:{tone:THREE.ToneMapping;exposure:number;enabled:boolean;type:THREE.ShadowMapType}={tone:THREE.LinearToneMapping,exposure:3,enabled:false,type:THREE.BasicShadowMap};
  const values={...initial};const failures=new Map<string,Error>(),attempts:string[]=[];
  const set=<Key extends keyof typeof values>(key:Key,value:typeof values[Key]):void=>{
    const operation=(value===initial[key]?"restore:":"apply:")+key;attempts.push(operation);
    const error=failures.get(operation);if(error!==undefined)throw error;values[key]=value;
  };
  const renderer={
    getRenderTarget:()=>null,
    get toneMapping(){return values.tone;},set toneMapping(value:THREE.ToneMapping){set("tone",value);},
    get toneMappingExposure(){return values.exposure;},set toneMappingExposure(value:number){set("exposure",value);},
    shadowMap:{get enabled(){return values.enabled;},set enabled(value:boolean){set("enabled",value);},get type(){return values.type;},set type(value:THREE.ShadowMapType){set("type",value);}},
    render:()=>{const error=failures.get("draw");if(error!==undefined)throw error;},
  } as unknown as THREE.WebGLRenderer;
  return {renderer,values,initial,failures,attempts};
};
const caught=(operation:()=>void):unknown=>{try{operation();return undefined;}catch(error){return error;}};

/**
 * Source-local view state restores independently of drawing and failed setters.
 *
 * Scenarios:
 * 1. Valid scene policy and legacy delivery precedence restore idempotently.
 * 2. Every restoration setter is attempted after another fails, and recovery
 *    can retry the remaining failed ownership after the host removes the fault.
 * 3. Partial configuration failures roll back every other property and preserve
 *    a primary failure together with any rollback failure.
 * 4. Scene drawing, structural setup refusal and environment restoration all
 *    preserve primary errors and the source's prior pass/environment state.
 */
export const test_viewer_environment_restoration=():void=>{
  const positive=createHost();const handle=applyRendererEnvironment(positive.renderer,environment,"beauty");handle.restore();handle.restore();TestValidator.equals("positive reversible policy",positive.values,positive.initial);
  const legacy=applyRendererEnvironment(positive.renderer,undefined,"beauty");legacy.restore();const delivered=applyRendererEnvironment(positive.renderer,undefined,"beauty","none");delivered.restore();
  for(const key of ["tone","exposure","enabled","type"]){
    const host=createHost(),failure=new Error(key),owner=applyRendererEnvironment(host.renderer,environment,"beauty");host.failures.set("restore:"+key,failure);
    TestValidator.predicate("single restoration failure retains identity",caught(()=>owner.restore())===failure);
    TestValidator.predicate("all independent restoration setters attempted",["tone","exposure","enabled","type"].every(name=>host.attempts.includes("restore:"+name)));
    host.failures.clear();owner.restore();owner.restore();TestValidator.equals("recovery retries failed ownership",host.values,host.initial);
  }
  const multiple=createHost(),first=new Error("first"),second=new Error("second"),owner=applyRendererEnvironment(multiple.renderer,environment,"beauty");multiple.failures.set("restore:tone",first);multiple.failures.set("restore:exposure",second);const aggregate=caught(()=>owner.restore());TestValidator.predicate("restoration aggregates every failure",aggregate instanceof AggregateError&&aggregate.errors[0]===first&&aggregate.errors[1]===second);
  const partial=createHost();partial.failures.set("apply:exposure",first);TestValidator.predicate("configuration rollback preserves primary",caught(()=>applyRendererEnvironment(partial.renderer,environment,"beauty"))===first);TestValidator.equals("partial configuration restores other fields",partial.values,partial.initial);
  const combined=createHost();combined.failures.set("apply:exposure",first);combined.failures.set("restore:tone",second);const combinedError=caught(()=>applyRendererEnvironment(combined.renderer,environment,"beauty"));TestValidator.predicate("configuration and rollback aggregate",combinedError instanceof AggregateError&&combinedError.errors[0]===first&&combinedError.errors[1]===second);
  const combinedMultiple=createHost();combinedMultiple.failures.set("apply:exposure",first);combinedMultiple.failures.set("restore:tone",second);combinedMultiple.failures.set("restore:type",second);const many=caught(()=>applyRendererEnvironment(combinedMultiple.renderer,environment,"beauty"));TestValidator.predicate("aggregate rollback remains flat",many instanceof AggregateError&&many.errors.length===3);
  const opaque=createHost(),emptyAggregate=new AggregateError([],"opaque restoration");opaque.failures.set("apply:exposure",first);opaque.failures.set("restore:tone",emptyAggregate);const opaqueError=caught(()=>applyRendererEnvironment(opaque.renderer,environment,"beauty"));TestValidator.predicate("empty rollback aggregate retains its own identity",opaqueError instanceof AggregateError&&opaqueError.errors[0]===first&&opaqueError.errors[1]===emptyAggregate);
  const scene=new THREE.Scene(),camera=new THREE.Camera(),draw=createHost();renderAutoMovieScenePass(draw.renderer,scene,camera,environment,"beauty");TestValidator.equals("scene source pass restores policy",draw.values,draw.initial);
  draw.failures.set("draw",first);TestValidator.predicate("draw failure identity",caught(()=>renderAutoMovieScenePass(draw.renderer,scene,camera,environment,"beauty"))===first);
  draw.failures.set("restore:tone",second);const drawError=caught(()=>renderAutoMovieScenePass(draw.renderer,scene,camera,environment,"beauty"));TestValidator.predicate("draw and restore retain both errors",drawError instanceof AggregateError&&drawError.errors[0]===first&&drawError.errors[1]===second);
  const refused=createHost(),design=sceneFixture(),mask=deriveAutoMovieSemanticMask({scene:design,models:modelsFixture(),environments:[buildingFixture()],instanceSets:[]});
  attachAutoMovieSemanticMask(scene,{design,mask});
  TestValidator.predicate("missing semantic scene refuses its structural setup",caught(()=>renderAutoMovieScenePass(refused.renderer,scene,camera,environment,"mask")) instanceof Error);
  TestValidator.equals("structural setup refusal restores renderer policy",refused.values,refused.initial);
  const modeFailure=createHost(),plain=new THREE.Scene(),geometry=new THREE.BoxGeometry(),material=new THREE.MeshBasicMaterial();plain.add(new THREE.Mesh(geometry,material));
  modeFailure.renderer.render=(input)=>{const override=(input.children[0] as THREE.Mesh).material as THREE.Material;override.addEventListener("dispose",()=>{throw first;});};
  TestValidator.predicate("mode restore failure remains visible",caught(()=>renderAutoMovieScenePass(modeFailure.renderer,plain,camera,environment,"mask"))===first);
  TestValidator.equals("mode failure still restores environment policy",modeFailure.values,modeFailure.initial);geometry.dispose();material.dispose();
};
