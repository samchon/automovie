import assert from "node:assert/strict";
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { boundaryCornerEyes } from "./observation-corners";
const cell=(id:string,x0:number,x1:number,z0:number,z1:number,y0=0,y1=3)=>({id,planes:[
  {normal:{x:1,y:0,z:0},offset:x1},{normal:{x:-1,y:0,z:0},offset:-x0},
  {normal:{x:0,y:1,z:0},offset:y1},{normal:{x:0,y:-1,z:0},offset:-y0},
  {normal:{x:0,y:0,z:1},offset:z1},{normal:{x:0,y:0,z:-1},offset:-z0}]});
export function verifyBoundaryCornerEyes():void {
  const space:IAutoMovieBuiltSpace={id:"fixture",kind:"room",parent:null,cells:[cell("a",0,3,0,3)]};
  assert.deepEqual(boundaryCornerEyes(space,1.6),[{x:.25,y:1.6,z:.25},{x:.25,y:1.6,z:2.75},{x:2.75,y:1.6,z:.25},{x:2.75,y:1.6,z:2.75}]);
  const l={...space,cells:[cell("a",0,3,0,1),cell("b",0,1,1,3)]};
  const corners=boundaryCornerEyes(l,1.6);
  assert.equal(corners.length,6);
  assert.ok(corners.some(p=>p.x===.75&&p.z===.75));
  assert.equal(corners.some(p=>p.x===2.75&&p.z===2.75),false);
  assert.deepEqual(boundaryCornerEyes(l,4),[]);
  assert.deepEqual(boundaryCornerEyes({...space,cells:[]},1.6),[]);
  assert.throws(()=>boundaryCornerEyes({...space,cells:[cell("thin",0,.1,0,.1)]},1.6),/outside own cells/);
  const nonOrthogonal=structuredClone(space);
  nonOrthogonal.cells[0]!.planes[0]!.normal.z=1;
  assert.throws(()=>boundaryCornerEyes(nonOrthogonal,1.6),/orthogonal/);
}
