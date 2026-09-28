/** The emitted house must cover every interior floor and lower-ceiling plan point. */
require(require.resolve("tsx/cjs"));
const test = require("node:test");
const assert = require("node:assert/strict");
const { buildHouse } = require("./house.ts");
const { MAIN } = require("./building.ts");
const { STAIR_OPENING } = require("./stair.ts");
const { STOREYS } = require("./storeys.ts");

const STEP = 0.025, EPS = 1e-5, CELL = 0.25;
/** @typedef {{id:string,owner:string,role:string,y:number,up:boolean,a:number[],b:number[],c:number[],box:number[]}} Face */
/** @typedef {{samples:number,finish:number,body:number,opening:number,openingIntrusions:number,holes:number,overlaps:number,examples:string[]}} Count */
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
    for (let t = 0; t < idx.length; t += 3) {
      const a = Array.from(p.slice(3*idx[t],3*idx[t]+3));
      const b = Array.from(p.slice(3*idx[t+1],3*idx[t+1]+3));
      const c = Array.from(p.slice(3*idx[t+2],3*idx[t+2]+3));
      const normal = (b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]);
      if (Math.abs(normal) < EPS) continue;
      const box = [Math.min(a[0],b[0],c[0]),Math.max(a[0],b[0],c[0]),Math.min(a[2],b[2],c[2]),Math.max(a[2],b[2],c[2])];
      const f = {id:part.id,owner:part.owner,role:part.role,y:a[1],up:normal>0,a,b,c,box};
      const n = faces.push(f)-1;
      for(let ix=Math.floor(box[0]/CELL);ix<=Math.floor(box[1]/CELL);ix++)
        for(let iz=Math.floor(box[2]/CELL);iz<=Math.floor(box[3]/CELL);iz++){
          const key=`${ix},${iz}`;if(!bins.has(key))bins.set(key,[]);bins.get(key)?.push(n);
        }
    }
  }
  /** @type {Array<[string,number,boolean,boolean]>} */
  const levels = [
    ["ground floor",STOREYS.groundFloor,true,false],
    ["upper floor",STOREYS.upperFloor,true,true],
    ["ground ceiling",STOREYS.groundCeiling,false,true],
  ];
  /** @type {Record<string,Count>} */
  const result = {};
  for (const [name,y,up,hasOpening] of levels) {
    /** @type {Count} */
    const out = {samples:0,finish:0,body:0,opening:0,openingIntrusions:0,holes:0,overlaps:0,examples:[]};
    result[name]=out;
    for(let x=MAIN.inner.x[0]+STEP/2;x<MAIN.inner.x[1];x+=STEP)
      for(let z=MAIN.inner.z[0]+STEP/2;z<MAIN.inner.z[1];z+=STEP){
        out.samples++;
        /** @type {Array<{f:Face,hit:number}>} */
        const hits=[];
        for(const i of bins.get(`${Math.floor(x/CELL)},${Math.floor(z/CELL)}`)||[]){
          const f=faces[i],hit=heightAt(f,x,z);if(hit!==null)hits.push({f,hit});
        }
        const finishFaces=hits.filter(v=>(v.f.role==="floor"||v.f.role==="ceiling")&&v.f.up===up&&Math.abs(v.hit-y)<EPS);
        const owners=new Set(finishFaces.map(v=>v.f.id));
        if(hasOpening && opening(x,z)){
          out.opening++;
          if(owners.size){out.openingIntrusions++;if(out.examples.length<8)out.examples.push(`${x.toFixed(3)},${z.toFixed(3)} finish intrudes opening ${[...owners]}`);}
          continue;
        }
        if(owners.size>1){out.overlaps++;if(out.examples.length<8)out.examples.push(`${x.toFixed(3)},${z.toFixed(3)} overlap ${[...owners]}`);}
        /** @type {Map<string,{owner:string,role:string,low:number,high:number}>} */
        const spans=new Map();
        for(const {f,hit} of hits){
          const old=spans.get(f.id)||{owner:f.owner,role:f.role,low:Infinity,high:-Infinity};old.low=Math.min(old.low,hit);old.high=Math.max(old.high,hit);spans.set(f.id,old);
        }
        const occupied=[...spans.values()].some(b=>b.low<=y+EPS&&b.high>=y-EPS);
        const through=[...spans].filter(([id,b])=>!owners.has(id)&&b.low<y-EPS&&b.high>y+EPS).map(([id])=>id);
        if(owners.size&&through.length){out.overlaps++;if(out.examples.length<8)out.examples.push(`${x.toFixed(3)},${z.toFixed(3)} finish/body overlap ${[...owners]} / ${through}`);}
        if(owners.size){out.finish++;continue;}
        if(occupied){out.body++;continue;}
        out.holes++;if(out.examples.length<8)out.examples.push(`${x.toFixed(3)},${z.toFixed(3)} hole`);
      }
  }
  return result;
};

/** Emitted solids must not share finish or structural volume; guard-to-guard
 * joints are deliberate attachments. No part id or room name selects a case.
 * @param {ReturnType<typeof buildHouse>} house */
const sharedVolumes = (house) => {
  const parts = house.parts.map((part) => {
    const p=part.mesh.positions,idx=part.mesh.indices??[];
    const bb=[Infinity,-Infinity,Infinity,-Infinity,Infinity,-Infinity];
    for(let i=0;i<p.length;i+=3){
      bb[0]=Math.min(bb[0],p[i]);bb[1]=Math.max(bb[1],p[i]);
      bb[2]=Math.min(bb[2],p[i+1]);bb[3]=Math.max(bb[3],p[i+1]);
      bb[4]=Math.min(bb[4],p[i+2]);bb[5]=Math.max(bb[5],p[i+2]);
    }
    /** @type {Array<{a:number[],b:number[],c:number[],d:number}>} */
    const triangles=[];
    for(let i=0;i<idx.length;i+=3){
      const a=Array.from(p.slice(3*idx[i],3*idx[i]+3));
      const b=Array.from(p.slice(3*idx[i+1],3*idx[i+1]+3));
      const c=Array.from(p.slice(3*idx[i+2],3*idx[i+2]+3));
      const d=(b[0]-a[0])*(c[2]-a[2])-(c[0]-a[0])*(b[2]-a[2]);
      if(Math.abs(d)>1e-14)triangles.push({a,b,c,d});
    }
    return {id:part.id,role:part.role,bb,triangles};
  });
  /** @param {typeof parts[number]} part @param {number} x @param {number} y @param {number} z */
  const inside=(part,x,y,z)=>{
    let crossings=0;
    for(const {a,b,c,d} of part.triangles){
      const u=((x-a[0])*(c[2]-a[2])-(c[0]-a[0])*(z-a[2]))/d;
      const v=((b[0]-a[0])*(z-a[2])-(x-a[0])*(b[2]-a[2]))/d;
      if(u<0||v<0||u+v>1)continue;
      if((1-u-v)*a[1]+u*b[1]+v*c[1]>y)crossings++;
    }
    return crossings%2===1;
  };
  const jitter=[0.1234567,0.3456789,0.5678901,0.7890123,0.9012345];
  /** @type {Array<{a:string,b:string,litres:number}>} */
  const collisions=[];
  for(let i=0;i<parts.length;i++)for(let j=i+1;j<parts.length;j++){
    const a=parts[i],b=parts[j];
    if(a.role==="guard"&&b.role==="guard")continue;
    const x0=Math.max(a.bb[0],b.bb[0]),x1=Math.min(a.bb[1],b.bb[1]);
    const y0=Math.max(a.bb[2],b.bb[2]),y1=Math.min(a.bb[3],b.bb[3]);
    const z0=Math.max(a.bb[4],b.bb[4]),z1=Math.min(a.bb[5],b.bb[5]);
    const volume=(x1-x0)*(y1-y0)*(z1-z0);
    if(!(volume>0.000005))continue;
    const nx=Math.max(4,Math.min(60,Math.ceil((x1-x0)/0.005)));
    const ny=Math.max(4,Math.min(60,Math.ceil((y1-y0)/0.005)));
    const nz=Math.max(4,Math.min(60,Math.ceil((z1-z0)/0.005)));
    let hits=0;
    for(let ix=0;ix<nx;ix++)for(let iy=0;iy<ny;iy++)for(let iz=0;iz<nz;iz++){
      const x=x0+(ix+jitter[(iy+iz)%5])/nx*(x1-x0);
      const y=y0+(iy+jitter[(ix+iz+1)%5])/ny*(y1-y0);
      const z=z0+(iz+jitter[(ix+iy+2)%5])/nz*(z1-z0);
      if(inside(a,x,y,z)&&inside(b,x,y,z))hits++;
    }
    const litres=1000*volume*hits/(nx*ny*nz);
    if(litres>=0.01)collisions.push({a:a.id,b:b.id,litres});
  }
  return collisions;
};

void test("complete plan coverage of both floors and the ground ceiling",()=>{
  const house=buildHouse();
  const counts=scan(house);
  for(const [name,c] of Object.entries(counts)){
    assert.equal(c.samples,c.finish+c.body+c.opening+c.holes,`${name} classified`);
    assert.equal(c.holes,0,`${name} ${JSON.stringify(c)}`);
    assert.equal(c.overlaps,0,`${name} ${JSON.stringify(c)}`);
    assert.equal(c.openingIntrusions,0,`${name} ${JSON.stringify(c)}`);
  }
  assert.deepEqual(sharedVolumes(house),[],"emitted non-guard solids share volume");
  console.log(JSON.stringify(counts));
});
