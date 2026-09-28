/** Contract-derived bounds, component and triangle checks for architectural fittings. */
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { KitchenDining } from "../models/furnishings/kitchen-dining";
import { Living } from "../models/furnishings/living";
import { ServiceRooms } from "../models/furnishings/service-rooms";
import { Bedrooms } from "../models/furnishings/bedrooms";
import { Bathrooms } from "../models/furnishings/bathrooms";
import { SanitaryFittings } from "../models/furnishings/sanitary-fittings";
import { FittingParts, type FittingBuilt } from "../models/furnishings/geometry";

const near=(a:number,b:number):void=>assert.ok(
  Math.abs(a-b)<1e-7,
  `${a} != ${b}`,
);
const bound=(built:FittingBuilt,id:string):number[]=>{
  const part=built.model.parts.find((p)=>p.id===id);
  assert.ok(part,`missing ${built.model.id}/${id}`);
  assert.equal(part.geometry.type,"mesh");
  if(part.geometry.type!=="mesh")throw new Error(`non-mesh ${id}`);
  const p=part.geometry.mesh.positions,b=[
    Infinity,
    -Infinity,
    Infinity,
    -Infinity,
    Infinity,
    -Infinity,
  ];
  for(let i=0;i<p.length;i+=3)for(let a=0;a<3;a++){
    b[a*2]=Math.min(b[a*2]!,p[i+a]!);
    b[a*2+1]=Math.max(b[a*2+1]!,p[i+a]!);}
  return b;
};
const expect=(built:FittingBuilt,id:string,want:readonly number[]):void=>bound(built,id).forEach(
  (v,i)=> near(v, want[i]!),
);

void test("the three kitchen base lengths retain the reserved toe, bay, front and counter dimensions",()=>{
  const kitchen=new KitchenDining();
  for(const [length,count] of [[3.35,6],[1.30,2],[0.30,1]] as const){
    const b=kitchen.baseRun(length);
    expect(b,"plinth",[-length/2,length/2,0,0.10,0.015,0.55]);
    expect(b,"carcass",[-length/2,length/2,0.10,0.88,0.015,0.60]);
    expect(b,"countertop",[-length/2,length/2,0.88,0.91,0,0.65]);
    assert.equal(b.model.parts.filter((p)=>p.id.endsWith("/drawer")).length,count);
    assert.equal(b.model.parts.filter((p)=>p.id.endsWith("/leaf")).length,count);
    expect(b,"bay-1/drawer",[-length/2,-length/2+length/count,0.73,0.88,0.60,0.62]);
  }
  expect(kitchen.baseRun(1.30,"left"),"plinth",[-0.635,0.65,0,0.10,0.015,0.55]);
  expect(kitchen.baseRun(1.30,"right"),"plinth",[-0.65,0.635,0,0.10,0.015,0.55]);
  expect(kitchen.baseRun(1.30,"both"),"plinth",[-0.635,0.635,0,0.10,0.015,0.55]);
  assert.throws(()=>kitchen.baseRun(1),/unsupported/);
  expect(kitchen.baseRun(-9.5-(-9.8)),"countertop",[-0.15,0.15,0.88,0.91,0,0.65]);
  assert.throws(()=>kitchen.baseRun(0.3001),/unsupported/);
});

void test("shared fitting geometry refuses empty, duplicate, degenerate and invalid recess inputs",()=>{
  const a=new FittingParts();
  assert.throws(()=>a.mesh("empty","leaf",()=>{}),/invalid fitting part/);
  assert.throws(()=>a.box("flat","leaf",[0,0,0,1,0,1]),/invalid fitting box/);
  assert.throws(()=>a.cylinder("zero","rod","x",[0,0,0],0,0.015),/invalid fitting cylinder/);
  assert.throws(()=>a.recessedZDoor("bad",[0,1,0,2,0,0.02],[0,0.2,0.5,0.7],0.008),/invalid fitting recess/);
  a.box("valid","shelf",[0,1,0,0.02,0,0.5]);
  assert.throws(()=>a.box("valid","shelf",[0,1,0,0.02,0,0.5]),/invalid fitting part/);
});

void test("upper cabinets and sink island respect clear knee, dishwasher and basin volumes", ()=>{
  const k=new KitchenDining();
  for(const [length,count] of [[1.30,2],[0.85,1]] as const){
    const b=k.wallCabinet(length);
    expect(b, "carcass", [-length/2, length/2, 0, 0.90, 0, 0.31]);
    assert.equal(
      b.model.parts.filter((p)=>p.id.startsWith("door-")&&!p.id.includes("/")&&b.faceByPart[p.id]==="leaf").length,
      count,
    );
    near(
      Math.max(
        ...b.model.parts.filter((p)=>b.faceByPart[p.id]==="handle").flatMap((p)=>bound(b,p.id).filter((_,i)=>i===5)),
      ),
      0.35,
    );
  }
  assert.throws(()=> k.wallCabinet(0.9 as 0.85), /unsupported/);
  const b=k.island();
  expect(b, "countertop/left", [-1.125, -1.025, 0.88, 0.91, 0, 1.05]);
  expect(b, "countertop/back", [-1.025, -0.525, 0.88, 0.91, 0, 0.45]);
  expect(b, "basin/bottom", [-1.025, -0.525, 0.71, 0.722, 0.45, 0.95]);
  expect(b, "carcass/dishwasher-back", [-0.475, 0.125, 0.10, 0.88, 0.30, 0.45]);
  assert.equal(
    b.model.parts.filter((p)=>p.id.startsWith("countertop/")).length,
    4,
  );
  assert.ok(!b.model.parts.some((p)=>p.id.includes("dishwasher-front")));
  near(bound(b,"faucet/stem")[3]!, 1.251);
});

void test("fireplace and service storage keep their five plates, casing relief and five L levels",()=>{
  const f=new Living().fireplace();
  expect(f,"firebox/back",[-0.52,0.52,0.23,0.87,-0.55,-0.525]);
  expect(f,"mantel",[-0.80,0.80,1.30,1.40,-0.55,0]);
  assert.equal(f.model.parts.filter((p)=>f.faceByPart[p.id]==="firebox-trim").length,4);
  const service=new ServiceRooms(),laundry=service.laundryUpper(),pantry=service.pantryShelves();
  expect(laundry,"carcass/main",[5.22,5.485,1.50,2.30,-3.35,-2.05]);
  expect(laundry,"carcass/casing-side",[5.485,5.50,1.50,2.27,-3.28,-2.05]);
  assert.equal(laundry.model.parts.filter((p)=>p.id.endsWith("/handle")).length,0);
  for(const [i,top] of [0.20,0.60,1.00,1.40,1.80].entries()){
    expect(pantry,`shelf/${i+1}`,[3.22,5.50,top-0.03,top,-6.05,-4.70]);
    expect(pantry,`cleat/${i+1}/back`,[3.235,5.48,top-0.06,top-0.03,-6.05,-6.03]);
  }
});

void test("small-bedroom wardrobes and upper wardrobe support bound travel, clothes and side relief",()=>{
  const bedrooms=new Bedrooms(),closed=bedrooms.slidingCloset(),open=bedrooms.slidingCloset(0.72,0.72);
  expect(closed,"carcass/back-low",[-0.75,0.75,0,0.10,0.015,0.02]);
  expect(closed,"door/front/leaf",[-0.75,0.01,0.01,2.17,0.55,0.57]);
  expect(closed,"door/rear/leaf",[-0.01,0.75,0.01,2.17,0.50,0.52]);
  expect(open,"door/front/leaf",[-0.03,0.73,0.01,2.17,0.55,0.57]);
  expect(open,"door/rear/leaf",[-0.73,0.03,0.01,2.17,0.50,0.52]);
  assert.equal(closed.model.parts.filter((p)=>closed.faceByPart[p.id]==="clothes").length,18);
  assert.throws(()=>bedrooms.slidingCloset(0.721),/outside reviewed range/);
  assert.throws(()=>bedrooms.slidingCloset(0,-0.001),/outside reviewed range/);
  const hanging=bedrooms.wardrobeHanging(),shelves=bedrooms.wardrobeShelves();
  expect(hanging,"rod",[2.13,4.22,1.635,1.665,-10.185,-10.155]);
  assert.equal(hanging.model.parts.filter((p)=>hanging.faceByPart[p.id]==="clothes").length,36);
  expect(shelves,"carcass/right/low",[5.47,5.485,0,0.10,-10.435,-9.90]);
  for(const [i,top] of [0.20,0.65,1.10,1.55].entries())
    expect(shelves,`shelf/${i+1}`,[4.43,5.47,top-0.03,top,-10.45,-9.90]);
});

void test("fixed bathroom fittings retain the selected vanity, booth and bath envelopes",()=>{
  const baths=new Bathrooms();
  for(const [w,d,doors] of [[0.60,0.45,1],[0.70,0.55,2],[0.85,0.55,2]] as const){
    const b=baths.vanity(w,d,w===0.60);
    expect(b,"plinth",[-w/2+0.02,w/2-0.02,0,0.10,w===0.60?0.015:0,d-0.07]);
    assert.equal(b.model.parts.filter((p)=>p.id.endsWith("/handle")).length,doors);
    assert.equal(b.faceByPart.basin,"ceramic");
    near(bound(b,"faucet/stem")[3]!,1.05);
  }
  assert.throws(()=>baths.vanity(0.60,0.55),/unsupported/);
  const shower=baths.showerBooth(),stack=baths.showerBooth(1);
  expect(shower,"glass/right",[0.617,0.625,0.018,2.10,0,1.01]);
  expect(shower,"glass/panel-1",[-0.625,-0.195,0.043,2.075,1.04,1.048]);
  expect(stack,"glass/panel-1",[0.195,0.625,0.043,2.075,1.04,1.048]);
  near(1.25-0.43-0.02,0.80);
  assert.throws(()=>baths.showerBooth(1.001),/outside reviewed range/);
  const tub=baths.bathtub();
  expect(tub,"ceramic",[-0.90,0.90,0,0.55,0,0.80]);
  near(bound(tub,"faucet/head")[3]!,1.90);
});

void test("all fixed fitting triangles have finite metric attributes and outward winding", ()=>{
  const b=new Bathrooms(),k=new KitchenDining(),s=new ServiceRooms(),bed=new Bedrooms();
  const models=[
    k.baseRun(3.35),
    k.wallCabinet(1.30),
    k.island(),
    new Living().fireplace(),
    s.laundryUpper(),
    s.laundryTop(),
    s.coatHooks(),
    s.pantryShelves(),
    bed.slidingCloset(),
    bed.wardrobeHanging(),
    bed.wardrobeShelves(),
    b.vanity(0.70, 0.55),
    b.showerBooth(),
    b.bathtub(),
    new SanitaryFittings().toilet(),
    ...([.60,.70,.85] as const).map(w=>new SanitaryFittings().mirror(w)),
    new SanitaryFittings().towelBar(.25,.40),
    new SanitaryFittings().towelBar(.50,.30),
    new SanitaryFittings().towelBar(.75,.40),
    new SanitaryFittings().curtainRail(),
  ];
  for(const built of models){
    assert.equal(Object.keys(built.faceByPart).length, built.model.parts.length);
    for(const part of built.model.parts){
      assert.equal(part.geometry.type, "mesh");
      if(part.geometry.type!=="mesh")throw new Error(`non-mesh ${part.id}`);
      const m=part.geometry.mesh;
      assert.ok(
        m.positions.length>0&&m.positions.every(Number.isFinite),
        part.id,
      );
      assert.equal(m.normals?.length, m.positions.length, part.id);
      assert.equal(m.uvs?.length, m.positions.length/3*2, part.id);
      assert.ok(m.uvs?.every(Number.isFinite), part.id);
      assert.ok(m.indices && m.indices.length%3===0, part.id);
      for(let i=0;i<m.indices!.length;i+=3){
        const aa=m.indices![i]!*3,bb=m.indices![i+1]!*3,cc=m.indices![i+2]!*3;
        const ab=[
          m.positions[bb]!-m.positions[aa]!,
          m.positions[bb+1]!-m.positions[aa+1]!,
          m.positions[bb+2]!-m.positions[aa+2]!,
        ];
        const ac=[
          m.positions[cc]!-m.positions[aa]!,
          m.positions[cc+1]!-m.positions[aa+1]!,
          m.positions[cc+2]!-m.positions[aa+2]!,
        ];
        const nx=ab[1]!*ac[2]!-ab[2]!*ac[1]!,ny=ab[2]!*ac[0]!-ab[0]!*ac[2]!,nz=ab[0]!*ac[1]!-ab[1]!*ac[0]!;
        const signed=nx*m.normals![aa]!+ny*m.normals![aa+1]!+nz*m.normals![aa+2]!;
        assert.ok(
          signed>1e-14,
          `${built.model.id}/${part.id}/${i/3} normal or degeneracy`,
        );
      }
    }
  }
});
