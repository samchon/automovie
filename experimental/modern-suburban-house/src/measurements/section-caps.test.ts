/** Section area and hole checks use independent metric fixture dimensions. */
import assert from "node:assert/strict";
import test from "node:test";
import {sectionCap} from "../viewer/sectionCaps";
import {FittingParts,type FittingBuilt,type FittingPoint} from "../models/furnishings/geometry";
import {lowerViewerModels} from "../viewer/modelScene.cjs";
import type {IViewerSceneItem} from "../viewer/scenePayload";
const item=(built:FittingBuilt):IViewerSceneItem=>lowerViewerModels({prototypes:[built],instances:[{id:"fixture",modelId:built.model.id,transform:{}}],finishes:{solid:{color:0xaaaaaa,roughness:.5,metalness:0}}})[0]!;
const area=(m:IViewerSceneItem):number=>{
  let sum=0;
  for(let i=0;i<m.indices.length;i+=3){
    const [a,b,c]=m.indices.slice(i,i+3).map(n=>m.positions.slice(n*3,n*3+3)) as [number[],number[],number[]];
    const signed=((b[1]!-a[1]!)*(c[2]!-a[2]!)-(b[2]!-a[2]!)*(c[1]!-a[1]!))/2;
    assert.ok(signed>0);sum+=signed;
  }
  return sum;
};
void test("a convex section closes its actual area with +X winding and metre UVs",()=>{
  const parts=new FittingParts();parts.box("box","solid",[-1,1,0,2,-2,2]);
  const source=item(parts.finish("box")),snapshot=JSON.stringify(source),cap=sectionCap(source)!;
  assert.equal(area(cap),8);assert.equal(cap.faceId,"solid");assert.equal(cap.inspectionSection,true);
  assert.equal(JSON.stringify(source),snapshot);assert.ok(cap.positions.filter((_,i)=>i%3===0).every(x=>x===0));
  for(let i=0;i<cap.uvs!.length;i+=2){assert.equal(cap.uvs![i],cap.positions[i/2*3+2]);assert.equal(cap.uvs![i+1],cap.positions[i/2*3+1]);}
  assert.deepEqual(sectionCap(source),cap);
});
void test("a hollow square tube retains its empty section rather than filling the aperture",()=>{
  const parts=new FittingParts(),outer=[[-2,-2],[2,-2],[2,2],[-2,2]] as const,inner=[[-1,-1],[1,-1],[1,1],[-1,1]] as const;
  const point=(x:number,p:readonly [number,number]):FittingPoint=>[x,p[0],p[1]];
  parts.mesh("tube","solid",q=>{
    for(let i=0;i<4;i++){
      const j=(i+1)%4,a=outer[i]!,b=outer[j]!,c=inner[i]!,d=inner[j]!,n:FittingPoint=[0,b[1]-a[1],a[0]-b[0]];
      q([point(-1,a),point(1,a),point(1,b),point(-1,b)],n);
      q([point(-1,c),point(1,c),point(1,d),point(-1,d)],[0,-n[1],-n[2]]);
      for(const x of [-1,1])q([point(x,a),point(x,b),point(x,d),point(x,c)],[x,0,0]);
    }
  });
  const cap=sectionCap(item(parts.finish("tube")))!;assert.equal(area(cap),12);
  for(let i=0;i<cap.indices.length;i+=3){
    const vertices=cap.indices.slice(i,i+3).map(n=>cap.positions.slice(n*3,n*3+3));
    const cy=vertices.reduce((s,v)=>s+v[1]!,0)/3,cz=vertices.reduce((s,v)=>s+v[2]!,0)/3;
    assert.ok(Math.abs(cy)>=1||Math.abs(cz)>=1);
  }
});
void test("touching planes emit no fabricated section and an open crossing is refused",()=>{
  const parts=new FittingParts();parts.box("box","solid",[0,1,0,1,0,1]);
  assert.equal(sectionCap(item(parts.finish("touch"))),undefined);
  const open={...item(parts.finish("open")),positions:[-1,0,0,1,0,0,1,1,0],indices:[0,1,2]};
  assert.throws(()=>sectionCap(open),/open section/);
});
