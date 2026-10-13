import {disposeCrossDissolve,disposeFadeToBlack,renderAutoMovieFilmFrame,renderFadeToBlackFrame,readAutoMovieFilmDisplayTextureResidency} from "@automovie/viewer";
import {TestValidator} from "@nestia/e2e";
import * as THREE from "three";

import {createDisplayCompositionRenderer} from "../internal/createDisplayCompositionRenderer";

/**
 * The sampled-film consumer has one pass boundary, so beauty weights cannot
 * enter structural fields and invalid admission cannot damage a prior display.
 *
 * Scenarios:
 * 1. Direct, fade and dissolve call their exact sampled source and pass owner.
 * 2. Every structural pass uses Engine's dominant sample and incoming tie rule.
 * 3. Invalid cardinality and weights refuse before a callback mutates display.
 * 4. Empty/invalid dimensions refuse, with positive resize recovering normally.
 * 5. Null context attributes remain supported, while disposal attempts all
 *    resources and removes ended ownership even if a resource listener throws.
 */
export const test_viewer_film_display_boundary=():void=>{
  const host=createDisplayCompositionRenderer();
  TestValidator.equals("unused renderer owns no display copies",readAutoMovieFilmDisplayTextureResidency(host.renderer),[]);
  const calls:Array<{shot:string,time:number,weight:number,pass:string}>=[];
  const render=(layer:{shot:string,time:number,weight:number},pass:string)=>{calls.push({...layer,pass});};
  renderAutoMovieFilmFrame(host.renderer,[{shot:"direct",time:1,weight:1}],"beauty",render);
  renderAutoMovieFilmFrame(host.renderer,[{shot:"fade",time:2,weight:.25}],"beauty",render);
  const layers=[{shot:"out",time:3,weight:.5},{shot:"in",time:4,weight:.5}];
  renderAutoMovieFilmFrame(host.renderer,layers,"beauty",render);
  const residency=readAutoMovieFilmDisplayTextureResidency(host.renderer);
  TestValidator.equals("both acquired compositors retain three RGBA8 copies",residency,[{owner:"film-fade",width:64,height:32,copies:3},{owner:"film-dissolve",width:64,height:32,copies:3}]);
  residency[0]!.width=1;
  TestValidator.equals("host residency records are owned copies",readAutoMovieFilmDisplayTextureResidency(host.renderer)[0]!.width,64);
  TestValidator.equals("exact beauty source samples",calls,[
    {shot:"direct",time:1,weight:1,pass:"beauty"},{shot:"fade",time:2,weight:.25,pass:"beauty"},
    {shot:"out",time:3,weight:.5,pass:"beauty"},{shot:"in",time:4,weight:.5,pass:"beauty"},
  ]);
  for(const pass of ["depth","mask","normal","outline","pose"] as const){
    renderAutoMovieFilmFrame(host.renderer,layers,pass,render);
    TestValidator.equals("guide tie retains incoming sample at full weight",calls.at(-1),{shot:"in",time:4,weight:1,pass});
  }
  const previous=calls.length;
  for(const invalid of [[],[{weight:NaN}],[{weight:-.1}],[{weight:1.1}],[{weight:.2},{weight:.7}]]){
    let refused=false;try{renderAutoMovieFilmFrame(host.renderer,invalid,"beauty",()=>{calls.push({shot:"invalid",time:0,weight:0,pass:"beauty"});});}catch{refused=true;}
    TestValidator.predicate("invalid admission refuses before drawing",refused&&calls.length===previous);
  }
  for(const [width,height] of [[0,1],[1,0],[-1,1],[1,-1],[NaN,1],[1,NaN],[1.5,1],[1,1.5]]){
    const invalid=createDisplayCompositionRenderer(width,height);let refused=false;try{renderFadeToBlackFrame(invalid.renderer,()=>undefined,.5);}catch{refused=true;}TestValidator.predicate("invalid drawing-buffer size",refused);
  }
  host.size.set(0,1);let resizeRefused=false;try{renderFadeToBlackFrame(host.renderer,()=>undefined,.5);}catch{resizeRefused=true;}TestValidator.predicate("invalid resize refuses",resizeRefused);
  host.size.set(1,1);const unreported=createDisplayCompositionRenderer(1,1,null);renderFadeToBlackFrame(unreported.renderer,()=>undefined,.5);disposeFadeToBlack(unreported.renderer);
  const failed=createDisplayCompositionRenderer();renderFadeToBlackFrame(failed.renderer,()=>undefined,.5);
  const first=new Error("first disposal"),second=new Error("second disposal");
  failed.copied[0]!.addEventListener("dispose",()=>{throw first;});failed.copied[1]!.addEventListener("dispose",()=>{throw second;});
  let aggregate:unknown;try{disposeFadeToBlack(failed.renderer);}catch(error){aggregate=error;}
  TestValidator.predicate("all resource failures retained",aggregate instanceof AggregateError&&aggregate.errors.includes(first)&&aggregate.errors.includes(second));
  renderFadeToBlackFrame(failed.renderer,()=>undefined,.5);TestValidator.predicate("failed release still removes old ownership",failed.copied.at(-1)!==failed.copied[1]);disposeFadeToBlack(failed.renderer);
  const one=createDisplayCompositionRenderer();renderFadeToBlackFrame(one.renderer,()=>undefined,.5);one.copied[1]!.addEventListener("dispose",()=>{throw first;});let single:unknown;try{disposeFadeToBlack(one.renderer);}catch(error){single=error;}TestValidator.predicate("single disposal error preserves identity",single===first);
  const target=new THREE.WebGLRenderTarget(2,2);host.renderer.setRenderTarget(target);host.errors.set("host",first);
  let targetError:unknown;try{renderFadeToBlackFrame(host.renderer,()=>undefined,.5);}catch(error){targetError=error;}TestValidator.predicate("target failure and restoration aggregate",targetError instanceof AggregateError&&targetError.errors.every(error=>error===first));
  target.dispose();disposeFadeToBlack(host.renderer);disposeCrossDissolve(host.renderer);
  TestValidator.equals("release removes every active display-copy lifetime",readAutoMovieFilmDisplayTextureResidency(host.renderer),[]);
};
