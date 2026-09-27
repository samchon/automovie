/** The emitted house must cover every interior floor and lower-ceiling plan point. */
require(require.resolve("tsx/cjs"));
const test = require("node:test");
const assert = require("node:assert/strict");
const { buildHouse } = require("./house.ts");
const { MAIN } = require("./building.ts");
const { STAIR_OPENING } = require("./stair.ts");
const { STOREYS } = require("./storeys.ts");

const STEP = 0.025, EPS = 1e-5, CELL = 0.25;
/** @typedef {{id:string,owner:string,role:string,y:number,up:boolean,body:boolean,a:number[],b:number[],c:number[],box:number[]}} Face */
/** @typedef {{samples:number,finish:number,body:number,opening:number,holes:number,overlaps:number,examples:string[]}} Count */
/** @param {number} x @param {number} z */
const opening = (x, z) =>
  x >= STAIR_OPENING.west && x < STAIR_OPENING.turnX && z >= STAIR_OPENING.back && z < STAIR_OPENING.front ||
  x >= STAIR_OPENING.turnX && x < STAIR_OPENING.east && z >= STAIR_OPENING.back && z < STAIR_OPENING.turnZ;
/** @param {{a:number[],b:number[],c:number[],box:number[]}} f @param {number} x @param {number} z */
const heightAt = (f, x, z) => {
  if (x < f.box[0] - EPS || x > f.box[1] + EPS || z < f.box[2] - EPS || z > f.box[3] + EPS) return null;
  const [a,b,c] = [f.a,f.b,f.c];
  const d = (b[0]-a[0])*(c[2]-a[2])-(c[0]-a[0])*(b[2]-a[2]);
  const u = ((x-a[0])*(c[2]-a[2])-(c[0]-a[0])*(z-a[2]))/d;
  const v = ((b[0]-a[0])*(z-a[2])-(x-a[0])*(b[2]-a[2]))/d;
  return u >= -EPS && v >= -EPS && u+v <= 1+EPS ? (1-u-v)*a[1]+u*b[1]+v*c[1] : null;
};

/** @param {ReturnType<typeof buildHouse>} house */
const scan = (house) => {
  /** @type {Face[]} */
  const faces = [];
  /** @type {Map<string,number[]>} */
  const bins = new Map();
  for (const part of house.parts) {
    const p = part.mesh.positions, idx = part.mesh.indices ?? [];
    const body=["wall", "partition", "stair"].includes(part.role);
    if (!body && part.role !== "floor" && part.role !== "ceiling") continue;
    for (let t = 0; t < idx.length; t += 3) {
      const a = Array.from(p.slice(3*idx[t],3*idx[t]+3));
      const b = Array.from(p.slice(3*idx[t+1],3*idx[t+1]+3));
      const c = Array.from(p.slice(3*idx[t+2],3*idx[t+2]+3));
      if (!body && Math.max(a[1],b[1],c[1])-Math.min(a[1],b[1],c[1]) > EPS) continue;
      const normal = (b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]);
      if (Math.abs(normal) < EPS) continue;
      const box = [Math.min(a[0],b[0],c[0]),Math.max(a[0],b[0],c[0]),Math.min(a[2],b[2],c[2]),Math.max(a[2],b[2],c[2])];
      const f = {id:part.id,owner:part.owner,role:part.role,y:a[1],up:normal>0,body,a,b,c,box};
      const n = faces.push(f)-1;
      for(let ix=Math.floor(box[0]/CELL);ix<=Math.floor(box[1]/CELL);ix++)
        for(let iz=Math.floor(box[2]/CELL);iz<=Math.floor(box[3]/CELL);iz++){
          const key=`${ix},${iz}`;if(!bins.has(key))bins.set(key,[]);bins.get(key)?.push(n);
        }
    }
  }
  /** @type {Array<[string,number,string,boolean,boolean]>} */
  const levels = [
    ["ground floor",STOREYS.groundFloor,"floor",true,false],
    ["upper floor",STOREYS.upperFloor,"floor",true,true],
    ["ground ceiling",STOREYS.groundCeiling,"ceiling",false,true],
  ];
  /** @type {Record<string,Count>} */
  const result = {};
  for (const [name,y,role,up,hasOpening] of levels) {
    /** @type {Count} */
    const out = {samples:0,finish:0,body:0,opening:0,holes:0,overlaps:0,examples:[]};
    result[name]=out;
    for(let x=MAIN.inner.x[0]+STEP/2;x<MAIN.inner.x[1];x+=STEP)
      for(let z=MAIN.inner.z[0]+STEP/2;z<MAIN.inner.z[1];z+=STEP){
        out.samples++;
        if(hasOpening && opening(x,z)){out.opening++;continue;}
        /** @type {Array<{f:Face,hit:number}>} */
        const hits=[];
        for(const i of bins.get(`${Math.floor(x/CELL)},${Math.floor(z/CELL)}`)||[]){
          const f=faces[i],hit=heightAt(f,x,z);if(hit!==null)hits.push({f,hit});
        }
        const finishFaces=hits.filter(v=>v.f.role===role&&v.f.up===up&&Math.abs(v.hit-y)<EPS);
        const owners=new Set(finishFaces.map(v=>v.f.id));
        if(owners.size>1){out.overlaps++;if(out.examples.length<8)out.examples.push(`${x.toFixed(3)},${z.toFixed(3)} overlap ${[...owners]}`);}
        /** @type {Map<string,{owner:string,low:number,high:number}>} */
        const spans=new Map();
        for(const {f,hit} of hits)if(f.body){
          const old=spans.get(f.id)||{owner:f.owner,low:Infinity,high:-Infinity};old.low=Math.min(old.low,hit);old.high=Math.max(old.high,hit);spans.set(f.id,old);
        }
        const bodyOwners=new Set([...spans.values()].filter(b=>b.low<=y+EPS&&b.high>=y-EPS).map(b=>b.owner));
        const occupied=bodyOwners.size>0;
        if(owners.size&&[...bodyOwners].some(o=>!finishFaces.some(v=>v.f.owner===o))){out.overlaps++;if(out.examples.length<8)out.examples.push(`${x.toFixed(3)},${z.toFixed(3)} finish/body owner overlap ${[...owners]} / ${[...bodyOwners]}`);}
        if(owners.size){out.finish++;continue;}
        if(occupied){out.body++;continue;}
        out.holes++;if(out.examples.length<8)out.examples.push(`${x.toFixed(3)},${z.toFixed(3)} hole`);
      }
  }
  return result;
};

void test("complete plan coverage of both floors and the ground ceiling",()=>{
  const counts=scan(buildHouse());
  for(const [name,c] of Object.entries(counts)){
    assert.equal(c.samples,c.finish+c.body+c.opening+c.holes,`${name} classified`);
    assert.equal(c.holes,0,`${name} ${JSON.stringify(c)}`);
    assert.equal(c.overlaps,0,`${name} ${JSON.stringify(c)}`);
  }
  console.log(JSON.stringify(counts));
});
