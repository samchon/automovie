/** Design-equation checks against the emitted triangles consumed by the viewer. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";
import { TempleColumns } from "../../models/columns";
import { TempleCladding } from "../../models/cladding";
import { TempleEntablature } from "../../models/entablature";
import { TempleLandscape } from "../../models/landscape";
import { TempleOpenings } from "../../models/openings";
import { templePlan } from "../../spaces/building";
import { templeClerestories, templeDoorPassages } from "../../spaces/openings";
import { templeRoofRules } from "../../spaces/roofs/assembly";
import { createModelBoardPayload } from "../../viewer/model-board-payload";

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

void test("neighbor house openings recess into closed front walls",()=>{
  const source=new TempleLandscape();
  for(const [kind,depth,windowXs,windowYs] of [
    ["gable",6,[-2.20,2.20],[1.35]],
    ["shed",7,[-1.70,1.70],[1.25,2.95]],
  ] as const){
    const model=source.neighborHouse(kind);
    const wall=partMesh(model,"wall"),recess=partMesh(model,"recess");
    const openings=[{x:0,y:1.05},
      ...windowXs.flatMap((x)=>windowYs.map((y)=>({x,y:y+0.40})))];
    for(const {x,y} of openings){
      assert.ok(!coverXY(wall,x,y,depth/2),`${kind}: filled opening at ${x},${y}`);
      assert.ok(coverXY(recess,x,y,depth/2-0.20),
        `${kind}: missing inset backing at ${x},${y}`);
      assert.ok(coverXY(wall,x,y,depth/2-0.30),
        `${kind}: missing remaining wall at ${x},${y}`);
    }
    assert.ok(coverXY(wall,0.7,1.05,depth/2),`${kind}: missing door-side wall`);
    assert.ok(!coverXY(partMesh(model,"plinth"),0,0.25,depth/2+0.008),
      `${kind}: plinth covers the door recess`);
  }
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
  const slope=templeRoofRules.gableSlope;
  const support=(templePlan.eastRoom+templePlan.eastRing)/2;
  const tieBottom=4.86,tieTop=5.14;
  const roof=(x:number)=>templeRoofRules.sanctuarySupport
    +(support-Math.abs(x))*Math.tan(slope)
    -templeRoofRules.normalThickness/Math.cos(slope);
  const lower=(x:number)=>Math.max(roof(x)-0.20/Math.cos(slope),tieTop);
  const design=(x:number)=>Math.max(
    roof(x)-0.20/Math.cos(slope),tieTop,
  )-tieBottom;
  for(const sign of [-1,1])
    for(const distance of [0.09,0.5,2.8,5.0,5.2554,5.3,5.59])
      close(undersideY(principal,sign*distance,0),design(distance),0.001);
  const vertices=(id:string)=>{
    const mesh=partMesh(truss,id);
    return Array.from({length:mesh.positions.length/3},(_,i)=>vertex(mesh,i));
  };
  for(const v of vertices("tie-beam")){
    close(Math.abs(v.x),templePlan.eastRing);
    assert.ok(Math.abs(v.y)<1e-8||Math.abs(v.y-(tieTop-tieBottom))<1e-8,
      `tie-beam vertex misses its floor or king-post contact: ${v.y}`);
  }
  let roofContacts=0,tieContacts=0;
  for(const v of vertices("principal")){
    if(Math.abs(v.y-(roof(v.x)-tieBottom))<0.001)roofContacts++;
    else {
      close(v.y,lower(v.x)-tieBottom,0.001);
      if(Math.abs(v.y-(tieTop-tieBottom))<0.001)tieContacts++;
    }
  }
  assert.ok(roofContacts>=8&&tieContacts>=4,"principal roof and tie contacts");
  let kingHeads=0;
  for(const v of vertices("king-post")){
    if(Math.abs(v.y-(tieTop-tieBottom))<0.001)continue;
    close(v.y,lower(v.x)-tieBottom,0.001);
    close(v.y,undersideY(principal,v.x,v.z),0.001);
    kingHeads++;
  }
  assert.ok(kingHeads>=6,"king-post upper vertices missing");
  let strutFeet=0,strutHeads=0;
  for(const v of vertices("strut")){
    if(Math.abs(v.x)<0.15){
      close(Math.abs(v.x),0.09,0.001);
      assert.ok(v.y>tieTop-tieBottom&&v.y<lower(v.x)-tieBottom,
        `strut foot misses king-post side: ${v.x},${v.y}`);
      strutFeet++;
    }else{
      close(v.y,lower(v.x)-tieBottom,0.001);
      close(v.y,undersideY(principal,v.x,v.z),0.001);
      strutHeads++;
    }
  }
  assert.ok(strutFeet>=8&&strutHeads>=8,"both struts need full end contact");
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

void test("both faces of every door surround occupy the complete three-sided ring",()=>{
  const source=new TempleOpenings();
  for(const door of templeDoorPassages){
    const mesh=partMesh(source.doorFrame(door.id),"surround");
    const t=door.wallHigh-door.wallLow;
    const inner=door.width/2+door.frame,outer=inner+0.16;
    const top=door.height+door.frame;
    for(const z of [-t/2-0.03,t/2+0.03]){
      for(const side of [-1,1])
        for(const fx of [0.01,0.1,0.5,0.9,0.99])
          for(const fy of [0.005,0.1,0.5,0.9,0.975,0.995]){
            const x=side*(inner+0.16*fx),y=top*fy;
            assert.ok(coverXY(mesh,x,y,z),`${door.id}: empty jamb at ${x},${y},${z}`);
          }
      for(const fx of [0.1,0.3,0.5,0.7,0.9])
        for(const fy of [0.1,0.5,0.9]){
          const x=-outer+2*outer*fx,y=top+0.16*fy;
          assert.ok(coverXY(mesh,x,y,z),`${door.id}: empty lintel at ${x},${y},${z}`);
        }
      assert.ok(!coverXY(mesh,0,top/2,z),`${door.id}: surround fills the door void`);
    }
  }
});

void test("every lining spans its host wall depth and its specified jamb width",()=>{
  const source=new TempleOpenings();
  const bounds=(model:IAutoMovieModel)=>{
    const positions=partMesh(model,"lining").positions;
    const x:number[]=[],z:number[]=[];
    for(let i=0;i<positions.length/3;i++){
      x.push(positions[3*i]!);z.push(positions[3*i+2]!);
    }
    return {x,z};
  };
  for(const door of templeDoorPassages){
    const {x,z}=bounds(source.doorFrame(door.id));
    const half=door.width/2+door.frame;
    close(Math.min(...x),-half);close(Math.max(...x),half);
    close(Math.min(...z),-(door.wallHigh-door.wallLow)/2);
    close(Math.max(...z),(door.wallHigh-door.wallLow)/2);
  }
  for(const host of templeClerestories()){
    const thickness=(host.wallHigh-host.wallLow) as 0.30|0.60;
    const {x,z}=bounds(source.windowFrame(thickness));
    close(Math.min(...x),-host.clearWidth/2-host.frame);
    close(Math.max(...x),host.clearWidth/2+host.frame);
    close(Math.min(...z),-thickness/2);close(Math.max(...z),thickness/2);
  }
});

void test("roof and ridge modules preserve their reviewed outer radii",()=>{
  const source=new TempleCladding();
  const imbrex=partMesh(source.roofTile(),"imbrex");
  const roof=Array.from({length:imbrex.positions.length/3},(_,i)=>vertex(imbrex,i));
  for(const [z,radius] of [[0.08,0.085],[0.52,0.075]] as const){
    const crown=roof.filter((v)=>Math.abs(v.z-z)<1e-8&&Math.abs(v.x-0.20)<1e-8);
    assert.ok(crown.length>0,`imbrex crown missing at ${z}`);
    assert.ok(crown.some((v)=>Math.abs(v.y-0.04-radius)<1e-8));
  }
  for(const slope of [19,22] as const){
    const ridge=partMesh(source.ridgeTile(slope),"ridge");
    const points=Array.from({length:ridge.positions.length/3},(_,i)=>vertex(ridge,i));
    const crown=(z:number,radius:number)=>points.some((v)=>
      Math.abs(v.z-z)<1e-8&&Math.abs(v.x)<1e-8&&
      Math.abs(v.y-(0.02/Math.cos(slope*Math.PI/180)-0.13*Math.tan(slope*Math.PI/180)+radius))<1e-8);
    assert.ok(crown(0,0.15),`${slope}: front ridge crown`);
    assert.ok(crown(0.45,0.13),`${slope}: rear ridge crown`);
  }
});

void test("every door leaf member develops U along its measured long face axis",()=>{
  const scale=readFileSync(join(__dirname,"../../../docs/contracts/principles-models.md"),"utf8");
  const row=scale.split(/\r?\n/u).find((line)=>
    line.startsWith("|")&&line.includes("`openings#double-door-leaf`"));
  assert.ok(row,"door leaf UV table row");
  const names=[...row.split("|")[2]!.matchAll(/`([a-z-]+)`/gu)]
    .map((match)=>match[1]!);
  const grainParts=names.slice(0,names.indexOf("plate"));
  assert.ok(grainParts.length>=5,"door leaf grain parts");
  const source=new TempleOpenings(),seen=new Set<string>();
  for(const door of templeDoorPassages){
    const model=door.id==="door-entry"||door.id==="door-sanctuary"
      ? source.doubleLeaf(door.id)
      : source.singleLeaf(door.id as Parameters<TempleOpenings["singleLeaf"]>[0]);
    for(const part of model.parts.filter((item)=>grainParts.includes(item.id))){
      let measured=0;
      for(const [a,b,c] of triangles(partMesh(model,part.id))){
        if(Math.max(Math.abs(a!.z-b!.z),Math.abs(a!.z-c!.z))>1e-9)
          continue;
        const xs=[a!.x,b!.x,c!.x],ys=[a!.y,b!.y,c!.y];
        const xSpan=Math.max(...xs)-Math.min(...xs);
        const ySpan=Math.max(...ys)-Math.min(...ys);
        if(Math.max(xSpan,ySpan)<1.01*Math.min(xSpan,ySpan))continue;
        const axis=xSpan>ySpan?"x":"y";
        const edge=[b!,c!].find((v)=>Math.abs(v[axis]-a![axis])>1e-9);
        if(edge===undefined)continue;
        close((edge.u-a!.u)/(edge[axis]-a![axis]),1,1e-6);
        measured++;
      }
      assert.ok(measured>=2,`${model.id}/${part.id}: long faces unmeasured`);
      seen.add(part.id);
    }
  }
  const compare=(a:string,b:string)=>a.localeCompare(b);
  assert.deepEqual([...seen].sort(compare),grainParts.sort(compare),
    "all documented grain parts measured");
});

void test("the opening UV table's named parts all emit finite UV0 for every passage",()=>{
  const scale=readFileSync(join(__dirname,"../../../docs/contracts/principles-models.md"),"utf8");
  const rows=scale.split(/\r?\n/u).filter((line)=>
    line.startsWith("|")&&line.includes("`openings#"));
  assert.equal(rows.length,2,"opening UV table rows");
  const named=new Set(rows.flatMap((line)=>
    [...line.split("|")[2]!.matchAll(/`([a-z-]+)`/gu)].map((match)=>match[1]!)));
  const source=new TempleOpenings();
  const models=[
    ...templeDoorPassages.map((door)=>source.doorFrame(door.id)),
    ...templeDoorPassages.flatMap((door)=>
      door.id==="door-entry"||door.id==="door-sanctuary"
        ? [source.doubleLeaf(door.id),source.doubleLeaf(door.id,"open")]
        : [source.singleLeaf(door.id as Parameters<TempleOpenings["singleLeaf"]>[0]),
          source.singleLeaf(door.id as Parameters<TempleOpenings["singleLeaf"]>[0],"open")]),
    ...([0.30,0.60] as const).map((depth)=>source.windowFrame(depth)),
  ];
  const seen=new Set<string>();
  for(const model of models)for(const part of model.parts){
    assert.equal(part.geometry.type,"mesh",`${model.id}/${part.id}`);
    if(part.geometry.type!=="mesh")continue;
    const { positions,uvs }=part.geometry.mesh;
    assert.ok(uvs,`${model.id}/${part.id}: missing UV0`);
    assert.equal(uvs.length,positions.length/3*2,
      `${model.id}/${part.id}: UV0 vertex count`);
    assert.ok(uvs.every(Number.isFinite),`${model.id}/${part.id}: nonfinite UV0`);
    if(named.has(part.id))seen.add(part.id);
  }
  const compare=(a:string,b:string)=>a.localeCompare(b);
  assert.deepEqual([...seen].sort(compare),[...named].sort(compare),
    "UV table part coverage");
});

void test("every model UV table row reaches emitted prototype parts",()=>{
  const scale=readFileSync(join(__dirname,"../../../docs/contracts/principles-models.md"),"utf8");
  const table=scale.split(/\r?\n/u).filter((line)=>
    line.startsWith("|")&&/`[a-z-]+#/u.test(line.split("|")[1]??""));
  const board=createModelBoardPayload().models;
  assert.ok(table.length>=20,"model UV table rows");
  const covered=new Set<string>();
  for(const line of table){
    const [,targets,parts]=line.split("|");
    assert.ok(targets&&parts,"UV table columns");
    let family="";
    const designs=[...targets.matchAll(/`([^`]+)`/gu)].map((match)=>{
      const [name,anchor]=match[1]!.split("#");
      if(name)family=name;
      assert.ok(family&&anchor,`invalid UV target ${match[1]}`);
      return `models/${family}.md#${anchor}`;
    });
    const models=board.filter((item)=>designs.includes(item.design));
    assert.ok(models.length>0,`UV row has no emitted model: ${targets}`);
    const named=[...parts.matchAll(/`([a-z][a-z0-9-]*)`/gu)]
      .map((match)=>match[1]!);
    const seen=new Set<string>();
    for(const {model,design} of models){
      covered.add(design);
      for(const part of model.parts){
        assert.equal(part.geometry.type,"mesh",`${model.id}/${part.id}`);
        if(part.geometry.type!=="mesh")continue;
        const {positions,uvs}=part.geometry.mesh;
        assert.ok(uvs,`${model.id}/${part.id}: UV0 absent`);
        assert.equal(uvs.length,2*positions.length/3,
          `${model.id}/${part.id}: UV0 vertex count`);
        assert.ok(uvs.every(Number.isFinite),`${model.id}/${part.id}: UV0 nonfinite`);
        if(named.includes(part.id))seen.add(part.id);
      }
    }
    for(const id of named)
      assert.ok(seen.has(id),`UV row ${targets}: ${id} has no emitted part`);
  }
  assert.ok(covered.size>=40,"UV table covers the reviewed model families");
});

void test("both pins of every door leaf follow face-facing rim and Z directions",()=>{
  const source=new TempleOpenings();
  for(const door of templeDoorPassages){
    const paired=door.id==="door-entry"||door.id==="door-sanctuary";
    const closed=paired
      ? source.doubleLeaf(door.id as "door-entry"|"door-sanctuary")
      : source.singleLeaf(door.id as "door-offering");
    const open=paired
      ? source.doubleLeaf(door.id as "door-entry"|"door-sanctuary","open")
      : source.singleLeaf(door.id as "door-offering","open");
    const pin=partMesh(closed,"pin"),posed=partMesh(open,"pin");
    assert.deepEqual(posed.uvs,pin.uvs,`${door.id}: pose changed pin UVs`);
    const centerX=paired?door.width/2-0.15:door.width-0.12;
    const centerY=paired?1.104:1.095;
    for(const direction of [1,-1] as const){
      const sides=triangles(pin).filter(([a,b,c])=>
        Math.sign((a!.z+b!.z+c!.z)/3)===direction&&
        Math.abs(a!.z-b!.z)<1e-9&&Math.abs(b!.z-c!.z)>1e-9&&
        Math.abs(a!.u-b!.u)>1e-9);
      assert.equal(sides.length,12,`${door.id}: incomplete ${direction} pin rim`);
      for(const [a,b,c] of sides){
        close((b!.u-a!.u)/Math.hypot(b!.x-a!.x,b!.y-a!.y),
          (2*Math.PI/12)/(2*Math.sin(Math.PI/12)),0.001);
        close((c!.v-b!.v)/(c!.z-b!.z),direction);
        const bx=b!.x-a!.x,by=b!.y-a!.y,cz=c!.z-a!.z;
        const radial=(a!.x-centerX)*by*cz-(a!.y-centerY)*bx*cz;
        assert.ok(radial>0,`${door.id}: ${direction} pin has inward winding`);
      }
      const seam=sides.find(([a])=>Math.abs(a!.u)<1e-9);
      assert.ok(seam,`${door.id}: missing ${direction} seam`);
      const [a,b]=seam;
      close(a!.x-centerX,0.006);
      close(a!.y,centerY);
      assert.ok(direction*(b!.y-a!.y)>0,
        `${door.id}: ${direction} pin U turns against its face`);
    }
  }
});

void test("both door rings remain centered on and intersect their fastening pins",()=>{
  const source=new TempleOpenings();
  const coordinates=(mesh:IAutoMovieMesh)=>Array.from(
    {length:mesh.positions.length/3},(_,i)=>vertex(mesh,i));
  for(const door of templeDoorPassages){
    const paired=door.id==="door-entry"||door.id==="door-sanctuary";
    const model=paired?source.doubleLeaf(door.id as "door-entry"|"door-sanctuary"):
      source.singleLeaf(door.id as "door-offering");
    const ring=coordinates(partMesh(model,"ring"));
    const pin=coordinates(partMesh(model,"pin"));
    for(const side of [-1,1]){
      const r=ring.filter((v)=>Math.sign(v.z)===side);
      const p=pin.filter((v)=>side>0?v.z>=0:v.z<0);
      assert.ok(r.length>0&&p.length>0,`${door.id}: missing ring/pin face ${side}`);
      const extent=(values:number[])=>[Math.min(...values),Math.max(...values)] as const;
      const [rx0,rx1]=extent(r.map((v)=>v.x));
      const [px0,px1]=extent(p.map((v)=>v.x));
      const [ry0,ry1]=extent(r.map((v)=>v.y));
      const [py0,py1]=extent(p.map((v)=>v.y));
      const [rz0,rz1]=extent(r.map((v)=>v.z));
      const [pz0,pz1]=extent(p.map((v)=>v.z));
      close((rx0+rx1)/2,(px0+px1)/2);
      const torusMajor=paired?0.054:0.045;
      close((py0+py1)/2,(ry0+ry1)/2+torusMajor);
      assert.ok(Math.min(rz1,pz1)-Math.max(rz0,pz0)>0.001,
        `${door.id}: ring and pin do not overlap through ${side} face`);
    }
  }
});

void test("capital V accumulates through the moulded sections",()=>{
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
