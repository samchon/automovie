/**
 * Exercise the toilet's reserved closed articulation through forgeProp, resolveFrame
 * and the actual viewer lowerer. node:test checks the numeric hinge translation,
 * neutral vertex equality, two violations for an unreserved rotation, its identity
 * mesh frame, and a separately translated root. These finite structural assertions
 * establish neither an open-pose design nor physical clearance or rendered pixels.
 * Each scenario owns fresh synchronous fixture data; engine/lowerer/assertion errors
 * propagate to the runner, with no browser or persistent native resource acquired.
 */
import assert from "node:assert/strict";
import test from "node:test";
import {resolveFrame} from "@automovie/engine";
import {createRequire} from "node:module";
import {SanitaryFittings} from "../models/furnishings/SanitaryFittings";
import {lowerViewerModels} from "../viewer/lowerViewerModels.js";
import { type IViewerModelInputs } from "../viewer/IViewerModelInputs";
import type { FittingBuilt } from "../models/furnishings/FittingBuilt";
import type { IViewerSceneItem } from "../viewer/IViewerSceneItem";
const {forgeProp}: typeof import("@automovie/engine")=createRequire(import.meta.url)("@automovie/engine") as typeof import("@automovie/engine");

const inputs: () => IViewerModelInputs=():IViewerModelInputs=>{
  const built: FittingBuilt=new SanitaryFittings().toilet();
  return {prototypes:[built],instances:[{id:"toilet",modelId:built.model.id,transform:{}}],
    finishes:Object.fromEntries(Object.values(built.faceByPart).map((face: string): [string, { color: number; roughness: number; metalness: number; }] =>[face,{color:0xffffff,roughness:.2,metalness:0}]))};
};

void test("the lid's mesh binds to the documented pivot and the neutral viewer preserves every vertex",(): void =>{
  const input: IViewerModelInputs=inputs(),built: { model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, string>>; articulation?: import("@automovie/interface").IAutoMoviePropArticulation; reviewYaw?: number; memberByPart?: Readonly<Record<string, string>>; }=input.prototypes[0]!,a: import("@automovie/interface").IAutoMoviePropArticulation=built.articulation!;
  assert.deepEqual(a.nodes.find((n: import("@automovie/interface").IAutoMovieNode): boolean =>n.id==="seat-lid")!.transform.translation,{x:0,y:.43,z:.28});
  assert.deepEqual(forgeProp({node:built.model.id,model:built.model,articulation:a}).success,true);
  const staticInput: IViewerModelInputs={...input,prototypes:[{model:built.model,faceByPart:built.faceByPart}]};
  const staticItems: IViewerSceneItem[]=lowerViewerModels(staticInput),posedItems: IViewerSceneItem[]=lowerViewerModels(input);
  for(const [index,item] of posedItems.entries())for(const [k,n] of item.positions.entries())
    assert.ok(Math.abs(n-staticItems[index]!.positions[k]!)<1e-10,`${item.id}/${k}`);
});

void test("a requested lid swing is clamped to the sole reserved closed pose",(): void =>{
  const a: import("@automovie/interface").IAutoMoviePropArticulation=new SanitaryFittings().toilet().articulation!;
  const half: number=Math.PI/4;
  const posed: import("@automovie/engine").IAutoMovieResolveOutput=resolveFrame({nodes:a.nodes,profiles:[{profile:a.profile,binding:a.binding}],limits:[],seconds:0,
    clip:{id:"unreserved-opening",name:null,duration:1,loop:false,tracks:[{channel:{kind:"node",node:"seat-lid",path:"rotation"},times:[0],values:[-Math.sin(half),0,0,Math.cos(half)],interpolation:"linear"}]}});
  assert.equal(posed.violations.length,2);
  const frame: number[]=posed.world.get("lid-mesh")!;
  assert.ok(Math.abs(frame[0]!-1)<1e-10&&Math.abs(frame[5]!-1)<1e-10&&Math.abs(frame[10]!-1)<1e-10);
  assert.ok(frame.slice(12,15).every((n: number): boolean =>Math.abs(n)<1e-10));
});

void test("the viewer preserves a mesh joint's resolved translation before instance placement",(): void =>{
  const input: IViewerModelInputs=inputs(),a: import("@automovie/interface").IAutoMoviePropArticulation=input.prototypes[0]!.articulation!;
  const root: import("@automovie/interface").IAutoMovieNode=a.nodes.find((n: import("@automovie/interface").IAutoMovieNode): boolean =>n.id==="root")!;
  root.transform.translation={x:1,y:2,z:3};
  const posed: IViewerSceneItem=lowerViewerModels(input).find((i: IViewerSceneItem): boolean =>i.id==="toilet/seat-lid")!;
  const staticInput: IViewerModelInputs={...input,prototypes:[{model:input.prototypes[0]!.model,faceByPart:input.prototypes[0]!.faceByPart}]};
  const rest: IViewerSceneItem=lowerViewerModels(staticInput).find((i: IViewerSceneItem): boolean =>i.id==="toilet/seat-lid")!;
  for(const [k,n] of posed.positions.entries())assert.ok(Math.abs(n-rest.positions[k]!-[1,2,3][k%3]!)<1e-10);
});
