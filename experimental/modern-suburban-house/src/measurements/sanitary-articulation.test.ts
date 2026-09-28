/** The reserved closed toilet has a real mesh-bound prop pivot, without an unreserved swing. */
import assert from "node:assert/strict";
import test from "node:test";
import {resolveFrame} from "@automovie/engine";
import {createRequire} from "node:module";
import {SanitaryFittings} from "../models/furnishings/sanitary-fittings";
import {lowerViewerModels,type IViewerModelInputs} from "../viewer/modelScene.cjs";
const {forgeProp}=createRequire(import.meta.url)("@automovie/engine") as typeof import("@automovie/engine");

const inputs=():IViewerModelInputs=>{
  const built=new SanitaryFittings().toilet();
  return {prototypes:[built],instances:[{id:"toilet",modelId:built.model.id,transform:{}}],
    finishes:Object.fromEntries(Object.values(built.faceByPart).map(face=>[face,{color:0xffffff,roughness:.2,metalness:0}]))};
};

void test("the lid's mesh binds to the documented pivot and the neutral viewer preserves every vertex",()=>{
  const input=inputs(),built=input.prototypes[0]!,a=built.articulation!;
  assert.deepEqual(a.nodes.find(n=>n.id==="seat-lid")!.transform.translation,{x:0,y:.43,z:.28});
  assert.deepEqual(forgeProp({node:built.model.id,model:built.model,articulation:a}).success,true);
  const staticInput={...input,prototypes:[{model:built.model,faceByPart:built.faceByPart}]};
  const staticItems=lowerViewerModels(staticInput),posedItems=lowerViewerModels(input);
  for(const [index,item] of posedItems.entries())for(const [k,n] of item.positions.entries())
    assert.ok(Math.abs(n-staticItems[index]!.positions[k]!)<1e-10,`${item.id}/${k}`);
});

void test("a requested lid swing is clamped to the sole reserved closed pose",()=>{
  const a=new SanitaryFittings().toilet().articulation!;
  const half=Math.PI/4;
  const posed=resolveFrame({nodes:a.nodes,profiles:[{profile:a.profile,binding:a.binding}],limits:[],seconds:0,
    clip:{id:"unreserved-opening",name:null,duration:1,loop:false,tracks:[{channel:{kind:"node",node:"seat-lid",path:"rotation"},times:[0],values:[-Math.sin(half),0,0,Math.cos(half)],interpolation:"linear"}]}});
  assert.equal(posed.violations.length,2);
  const frame=posed.world.get("lid-mesh")!;
  assert.ok(Math.abs(frame[0]!-1)<1e-10&&Math.abs(frame[5]!-1)<1e-10&&Math.abs(frame[10]!-1)<1e-10);
  assert.ok(frame.slice(12,15).every(n=>Math.abs(n)<1e-10));
});

void test("the viewer preserves a mesh joint's resolved translation before instance placement",()=>{
  const input=inputs(),a=input.prototypes[0]!.articulation!;
  const root=a.nodes.find(n=>n.id==="root")!;
  root.transform.translation={x:1,y:2,z:3};
  const posed=lowerViewerModels(input).find(i=>i.id==="toilet/seat-lid")!;
  const staticInput={...input,prototypes:[{model:input.prototypes[0]!.model,faceByPart:input.prototypes[0]!.faceByPart}]};
  const rest=lowerViewerModels(staticInput).find(i=>i.id==="toilet/seat-lid")!;
  for(const [k,n] of posed.positions.entries())assert.ok(Math.abs(n-rest.positions[k]!-[1,2,3][k%3]!)<1e-10);
});
