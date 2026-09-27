/** Design-equation checks against the emitted triangles consumed by the viewer. */
import assert from "node:assert/strict";
import test from "node:test";
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";
import { TempleColumns } from "../../models/columns";
import { TempleEntablature } from "../../models/entablature";
import { TempleOpenings } from "../../models/openings";
import { templePlan } from "../../spaces/building";
import { templeClerestories, templeDoorPassages } from "../../spaces/openings";
import { templeRoofRules } from "../../spaces/roofs/assembly";

const partMesh=(model:IAutoMovieModel,id:string):IAutoMovieMesh=>{
  const part=model.parts.find((item)=>item.id===id);
  assert.ok(part && part.geometry.type==="mesh",`${model.id}/${id}: mesh`);
  return part.geometry.mesh;
};
const vertex=(m:IAutoMovieMesh,i:number)=>({
  x:m.positions[3*i]!,
  y:m.positions[3*i+1]!,
  z:m.positions[3*i+2]!,
  u:m.uvs![2*i]!,
  v:m.uvs![2*i+1]!,
  ny:m.normals![3*i+1]!,
});
const triangles=(m:IAutoMovieMesh)=>{
  const indices=m.indices??Array.from({ length:m.positions.length/3 },(_,i)=>i);
  const result:ReturnType<typeof vertex>[][]=[];
  for(let i=0;i<indices.length;i+=3)
    result.push([
      vertex(m, indices[i]!),
      vertex(m, indices[i+1]!),
      vertex(m, indices[i+2]!),
    ]);
  return result;
};
const close=(actual:number,expected:number,tolerance=1e-6)=>
  assert.ok(
    Math.abs(actual-expected)<=tolerance,
    `${actual} differs from ${expected}`,
  );

// Intersect a vertical measuring ray with emitted triangles, using XZ
// barycentrics rather than an implementation section or vertex order.
const undersideY=(mesh:IAutoMovieMesh,x:number,z:number):number=>{
  const hits:number[]=[];
  for(const [a,b,c] of triangles(mesh)){
    if(a!.ny>-1e-5)continue;
    const det=(b!.z-c!.z)*(a!.x-c!.x)+(c!.x-b!.x)*(a!.z-c!.z);
    if(Math.abs(det)<1e-10)continue;
    const wa=((b!.z-c!.z)*(x-c!.x)+(c!.x-b!.x)*(z-c!.z))/det;
    const wb=((c!.z-a!.z)*(x-c!.x)+(a!.x-c!.x)*(z-c!.z))/det;
    const wc=1-wa-wb;
    if(Math.min(wa,wb,wc)<-1e-7)continue;
    hits.push(wa*a!.y+wb*b!.y+wc*c!.y);
  }
  assert.ok(hits.length>0,`no underside hit at ${x}, ${z}`);
  return Math.min(...hits);
};
const coverXY=(mesh:IAutoMovieMesh,x:number,y:number,z:number):boolean=>
  triangles(mesh).some(([a,b,c])=>{
    if(Math.max(Math.abs(a!.z-z),Math.abs(b!.z-z),Math.abs(c!.z-z))>1e-8)
      return false;
    const det=(b!.y-c!.y)*(a!.x-c!.x)+(c!.x-b!.x)*(a!.y-c!.y);
    if(Math.abs(det)<1e-10)return false;
    const wa=((b!.y-c!.y)*(x-c!.x)+(c!.x-b!.x)*(y-c!.y))/det;
    const wb=((c!.y-a!.y)*(x-c!.x)+(a!.x-c!.x)*(y-c!.y))/det;
    return Math.min(wa,wb,1-wa-wb)>=-1e-8;
  });

void test("sanctuary rafter tail derives its inset from the roof support and wall",()=>{
  const tail=partMesh(new TempleEntablature().sanctuaryRafters()[0]!,"timber");
  const support=(templePlan.eastRoom+templePlan.eastRing)/2;
  const roofEdge=templePlan.eastRoom+templeRoofRules.overhang;
  const cut=roofEdge-(templePlan.eastRoom-support);
  const span=cut-templePlan.eastRoom;
  const angle=templeRoofRules.gableSlope;
  const length=span/Math.cos(angle)+0.12*Math.tan(angle);
  const zs=Array.from({ length:tail.positions.length/3 },(_,i)=>tail.positions[3*i+2]!);
  close(Math.min(...zs),0);
  close(Math.max(...zs),length);
  close(cut,6.10);
  close(roofEdge,6.25);
});

void test("truss underside follows the reviewed clipped plane and receives its supports",()=>{
  const truss=new TempleEntablature().sanctuaryTruss();
  const principal=partMesh(truss,"principal");
  const slope=22*Math.PI/180;
  const design=(x:number)=>Math.max(
    5.35+(5.75-Math.abs(x))*Math.tan(slope)-0.38/Math.cos(slope),5.14,
  )-4.86;
  for(const sign of [-1,1])
    for(const distance of [0.09,0.5,2.8,5.0,5.2554,5.3,5.59])
      close(undersideY(principal,sign*distance,0),design(distance),0.001);
  for(const id of ["strut","king-post"]){
    const mesh=partMesh(truss,id);
    const verts=Array.from({ length:mesh.positions.length/3 },(_,i)=>vertex(mesh,i));
    const heads=verts.filter((v)=>v.y>0.28+0.1 && Math.abs(v.z)<0.091 &&
      Math.abs(v.y-design(v.x))<0.001);
    assert.ok(heads.length>=4,`${id}: roof-contact vertices missing`);
    for(const v of heads)close(v.y,undersideY(principal,v.x,v.z),0.001);
  }
});

void test("each clerestory lining starts at its void origin", ()=>{
  const source=new TempleOpenings();
  for(const host of templeClerestories()){
    const mesh=partMesh(
      source.windowFrame((host.wallHigh-host.wallLow) as 0.30|0.60),
      "lining",
    );
    const ys=Array.from(
      { length:mesh.positions.length/3 },
      (_,i)=>mesh.positions[3*i+1]!,
    );
    close(Math.min(...ys), 0);
    close(Math.max(...ys), host.clearHeight+2*host.frame);
  }
});

void test("both faces of every door surround fill their upper corner rectangles",()=>{
  const source=new TempleOpenings();
  for(const door of templeDoorPassages){
    const mesh=partMesh(source.doorFrame(door.id),"surround");
    const t=door.wallHigh-door.wallLow;
    for(const z of [-t/2-0.03,t/2+0.03])
      for(const side of [-1,1])
        for(const fx of [0.1,0.5,0.9])
          for(const fy of [0.1,0.5,0.9]){
            const x=side*(door.width/2+door.frame+0.16*fx);
            const y=door.height+door.frame+0.16*fy;
            assert.ok(coverXY(mesh,x,y,z),`${door.id}: empty surround at ${x},${y},${z}`);
          }
  }
});

void test("front and back face U gradients follow the reviewed member axes",()=>{
  const source=new TempleOpenings();
  const cases=[
    { model:source.doubleLeaf("door-entry"),part:"panel",axis:"y" },
    { model:source.doubleLeaf("door-entry"),part:"frame",axis:"y",region:(x:number)=>x<0.09 },
    { model:source.doubleLeaf("door-entry"),part:"frame",axis:"x",region:(x:number,y:number)=>x>0.12&&y<0.16 },
    { model:source.singleLeaf("door-yard"),part:"board",axis:"y" },
    { model:source.singleLeaf("door-yard"),part:"batten",axis:"x" },
    { model:source.singleLeaf("door-yard"),part:"strap",axis:"x" },
  ] as const;
  for(const item of cases){
    let seen=0;
    for(const [a,b,c] of triangles(partMesh(item.model,item.part))){
      if(Math.abs(a!.z-b!.z)>1e-9||Math.abs(a!.z-c!.z)>1e-9)continue;
      const x=(a!.x+b!.x+c!.x)/3,y=(a!.y+b!.y+c!.y)/3;
      if("region" in item && !item.region(x,y))continue;
      const edge=item.axis==="y"
        ? [a!,b!,c!].find((v)=>Math.abs(v.y-a!.y)>1e-9)
        : [a!,b!,c!].find((v)=>Math.abs(v.x-a!.x)>1e-9);
      if(edge===undefined)continue;
      const run=item.axis==="y"?edge.y-a!.y:edge.x-a!.x;
      close((edge.u-a!.u)/run,1,1e-6);
      seen++;
    }
    assert.ok(seen>0,`${item.part}/${item.axis}: no measured face`);
  }
});

void test("pin U follows the rim, V follows +Z, and capital V accumulates",()=>{
  const pin=partMesh(new TempleOpenings().doubleLeaf("door-entry"),"pin");
  const side=triangles(pin).find(([a,b,c])=>
    Math.abs(a!.z-b!.z)<1e-9&&Math.abs(b!.z-c!.z)>1e-9&&
    Math.abs(a!.u-b!.u)>1e-9);
  assert.ok(side,"pin side triangle");
  const [a,b,c]=side;
  const handleX=templeDoorPassages.find((door)=>door.id==="door-entry")!.width/2-0.15;
  close(a!.x-handleX,0.006);
  close(a!.y,1.104);
  close(a!.u,0);
  close((b!.u-a!.u)/Math.hypot(b!.x-a!.x,b!.y-a!.y),
    (2*Math.PI/12)/(2*Math.sin(Math.PI/12)),0.001);
  close((c!.v-b!.v)/(c!.z-b!.z),1);
  for(const [model,seamV] of [
    [new TempleColumns().colonnade(12),0.03],
    [new TempleColumns().porch(),0.04],
  ] as const){
    const capital=partMesh(model,"capital");
    const verts=Array.from({ length:capital.positions.length/3 },(_,i)=>vertex(capital,i));
    const lowest=Math.min(...verts.map((v)=>v.y));
    const seam=verts.filter((v)=>Math.abs(v.y-lowest-seamV)<1e-8&&Math.abs(v.ny)<0.99);
    assert.ok(seam.length>=48,`${model.id}: missing seam sides`);
    for(const v of seam)close(v.v,seamV);
  }
});

void test("concave beam cap triangles keep outward winding", ()=>{
  const beam=partMesh(new TempleEntablature().colonnadeBeam("east"), "timber");
  for(const [a,b,c] of triangles(beam)){
    if(Math.abs(a!.z-b!.z)>1e-9||Math.abs(a!.z-c!.z)>1e-9)continue;
    const cross=(b!.x-a!.x)*(c!.y-a!.y)-(b!.y-a!.y)*(c!.x-a!.x);
    assert.ok(Math.abs(cross)>1e-12, "degenerate beam cap");
    assert.ok(Math.sign(cross)===Math.sign(a!.z), "reversed beam cap");
  }
});
