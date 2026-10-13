import {disposeCrossDissolve,renderCrossDissolve,renderCrossDissolveFrames} from "@automovie/viewer";
import {TestValidator} from "@nestia/e2e";
import * as THREE from "three";
import {createDisplayCompositionRenderer} from "../internal/createDisplayCompositionRenderer";
/**
 * Display-source copies retain renderer-local ownership and the pose wrapper
 * carries the original source sample and optional pass owner into each draw.
 *
 * Scenarios:
 * 1. Endpoints and intermediate weights resolve both callbacks in order.
 * 2. Source copies reuse, resize, dispose once and recreate independently.
 * 3. A caller-owned target receives the result and retains its canvas backing.
 * 4. Invalid alpha refuses, while the pose wrapper preserves callback order.
 */
export const test_viewer_dissolve_state=():void=>{
  const a=createDisplayCompositionRenderer(),b=createDisplayCompositionRenderer(128,72);disposeCrossDissolve(a.renderer);
  let order="";for(const alpha of [0,.5,1])renderCrossDissolveFrames(a.renderer,()=>{order+="o";},()=>{order+="i";},alpha);
  renderCrossDissolveFrames(b.renderer,()=>undefined,()=>undefined,.25);
  TestValidator.equals("every boundary resolves both sources",order,"oioioi");TestValidator.equals("weights reach byte shader",a.rendered.map(x=>x.alpha),[0,.5,1]);
  TestValidator.predicate("copies stay renderer-local",a.copied[1]===a.copied[4]&&a.copied[2]===a.copied[5]&&a.copied[1]!==b.copied[1]);
  a.size.set(320,240);renderCrossDissolveFrames(a.renderer,()=>undefined,()=>undefined,.5);
  TestValidator.equals("owned buffer dimensions",[a.copied[1]!.image.width,a.copied[1]!.image.height,b.copied[1]!.image.width],[320,240,128]);
  let disposed=0;a.copied[1]!.addEventListener("dispose",()=>{disposed++;});disposeCrossDissolve(a.renderer);disposeCrossDissolve(a.renderer);renderCrossDissolveFrames(a.renderer,()=>undefined,()=>undefined,.5);
  TestValidator.predicate("release once and recreate",disposed===1&&a.copied.at(-2)!==a.copied[1]);
  const host=createDisplayCompositionRenderer(),target=new THREE.WebGLRenderTarget(4,4);host.renderer.setRenderTarget(target);renderCrossDissolveFrames(host.renderer,()=>undefined,()=>undefined,.5);
  TestValidator.predicate("host and backing survive",host.rendered[0]!.target===target&&host.rendered[1]!.backing&&host.renderer.getRenderTarget()===target);
  for(const alpha of [NaN,-.01,1.01]){let refused=false;try{renderCrossDissolveFrames(a.renderer,()=>undefined,()=>undefined,alpha);}catch{refused=true;}TestValidator.predicate("invalid alpha",refused);}
  let poses="",halves=0;renderCrossDissolve(b.renderer,new THREE.Scene(),new THREE.Camera(),()=>{poses+="o";},()=>{poses+="i";},.5,()=>{halves++;});TestValidator.equals("pose and pass ownership",[poses,halves],["oi",2]);
  const wrapper=createDisplayCompositionRenderer();renderCrossDissolve(wrapper.renderer,new THREE.Scene(),new THREE.Camera(),()=>undefined,()=>undefined,.5);
  target.dispose();disposeCrossDissolve(a.renderer);disposeCrossDissolve(b.renderer);disposeCrossDissolve(host.renderer);disposeCrossDissolve(wrapper.renderer);
};
