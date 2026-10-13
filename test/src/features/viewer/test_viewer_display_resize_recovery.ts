import {disposeCrossDissolve,renderCrossDissolveFrames,readAutoMovieFilmDisplayTextureResidency} from "@automovie/viewer";
import {TestValidator} from "@nestia/e2e";

import {createDisplayCompositionRenderer} from "../internal/createDisplayCompositionRenderer";

/**
 * Resize updates every owned display copy despite independent release failures,
 * so a retry at the same dimensions cannot reuse a partially resized lifetime.
 *
 * Scenarios:
 * 1. Two independent disposal failures preserve their identities while every
 *    texture receives the new extent and upload generation before refusal.
 * 2. The same-size retry draws both sources without another retirement.
 * 3. A single failure keeps its identity and later successful release retains
 *    all three updated copies under the same owner.
 */
export const test_viewer_display_resize_recovery=():void=>{
  const host=createDisplayCompositionRenderer();
  renderCrossDissolveFrames(host.renderer,()=>undefined,()=>undefined,.5);
  const textures=[...new Set(host.copied)];
  TestValidator.equals("three acquired copies start at the host extent",textures.map(texture=>[texture.image.width,texture.image.height]),[[64,32],[64,32],[64,32]]);
  const first=new Error("first resize disposal"),second=new Error("second resize disposal");
  let firstFails=true,secondFails=true,retirements=0;
  textures[0]!.addEventListener("dispose",()=>{retirements++;if(firstFails)throw first;});
  textures[1]!.addEventListener("dispose",()=>{retirements++;if(secondFails)throw second;});
  textures[2]!.addEventListener("dispose",()=>{retirements++;});
  const versions=textures.map(texture=>texture.version);host.size.set(128,64);
  let failure:unknown;try{renderCrossDissolveFrames(host.renderer,()=>undefined,()=>undefined,.5);}catch(error){failure=error;}
  TestValidator.predicate("both resize failures remain visible",failure instanceof AggregateError&&failure.errors.includes(first)&&failure.errors.includes(second)&&failure.errors.length===2);
  TestValidator.equals("all independent copies retire and update despite failures",{retirements,extents:textures.map(texture=>[texture.image.width,texture.image.height]),versions:textures.map(texture=>texture.version)},{retirements:3,extents:[[128,64],[128,64],[128,64]],versions:versions.map(version=>version+1)});
  let callbacks=0;renderCrossDissolveFrames(host.renderer,()=>{callbacks++;},()=>{callbacks++;},.5);
  TestValidator.equals("same-size retry uses coherent copies without retiring again",[callbacks,retirements],[2,3]);
  secondFails=false;host.size.set(256,128);failure=undefined;
  try{renderCrossDissolveFrames(host.renderer,()=>undefined,()=>undefined,.5);}catch(error){failure=error;}
  TestValidator.predicate("single resize failure preserves identity",failure===first);
  TestValidator.equals("single failure also updates the complete lifetime",{retirements,extents:textures.map(texture=>[texture.image.width,texture.image.height]),residency:readAutoMovieFilmDisplayTextureResidency(host.renderer)},{retirements:6,extents:[[256,128],[256,128],[256,128]],residency:[{owner:"film-dissolve",width:256,height:128,copies:3}]});
  firstFails=false;disposeCrossDissolve(host.renderer);
  TestValidator.equals("successful final release attempts all resources",retirements,9);
};
