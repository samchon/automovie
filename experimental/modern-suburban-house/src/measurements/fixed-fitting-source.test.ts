/**
 * Exercise finite fitting variants through the real prototype owners under node:test.
 * The numeric oracle is the authored kitchen, storage and bathroom dimension budget:
 * selected part AABBs, repeated-part counts and invalid-input errors are independent
 * expectations, while the final sample checks aligned finite positions/UVs and
 * triangle winding against each first-vertex normal. It does not establish closed
 * manifold topology, every allowed variant, collisions, material binding or pixels.
 * Fixtures are built synchronously in memory; assertion failures belong to the test
 * runner, and no browser, native renderer or persistent resource is acquired.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { KitchenDining } from "../models/furnishings/kitchen-dining";
import { Living } from "../models/furnishings/living";
import { ServiceRooms } from "../models/furnishings/service-rooms";
import { Bedrooms } from "../models/furnishings/bedrooms";
import { Bathrooms } from "../models/furnishings/bathrooms";
import { SanitaryFittings } from "../models/furnishings/SanitaryFittings";
import { FittingParts, type FittingBuilt } from "../models/furnishings/geometry";

const near: (a: number, b: number) => void=(a:number,b:number):void=>assert.ok(
  Math.abs(a-b)<1e-7,
  `${a} != ${b}`,
);
const bound: (built: FittingBuilt, id: string) => number[]=(built:FittingBuilt,id:string):number[]=>{
  const part: import("@automovie/interface").IAutoMovieModelPart | undefined=built.model.parts.find((p: import("@automovie/interface").IAutoMovieModelPart): boolean =>p.id===id);
  assert.ok(part,`missing ${built.model.id}/${id}`);
  assert.equal(part.geometry.type,"mesh");
  if(part.geometry.type!=="mesh")throw new Error(`non-mesh ${id}`);
  const p: number[]=part.geometry.mesh.positions,b: number[]=[
    Infinity,
    -Infinity,
    Infinity,
    -Infinity,
    Infinity,
    -Infinity,
  ];
  for(let i: number=0;i<p.length;i+=3)for(let a: number=0;a<3;a++){
    b[a*2]=Math.min(b[a*2]!,p[i+a]!);
    b[a*2+1]=Math.max(b[a*2+1]!,p[i+a]!);}
  return b;
};
const expect: (built: FittingBuilt, id: string, want: readonly number[]) => void=(built:FittingBuilt,id:string,want:readonly number[]):void=>bound(built,id).forEach(
  (v: number,i: number): void => near(v, want[i]!),
);

void test("the three kitchen base lengths retain the reserved toe, bay, front and counter dimensions",(): void =>{
  const kitchen: KitchenDining=new KitchenDining();
  for(const [length,count] of [[3.35,6],[1.30,2],[0.30,1]] as const){
    const b: FittingBuilt=kitchen.baseRun(length);
    expect(b,"plinth",[-length/2,length/2,0,0.10,0.015,0.55]);
    expect(b,"carcass",[-length/2,length/2,0.10,0.88,0.015,0.60]);
    expect(b,"countertop",[-length/2,length/2,0.88,0.91,0,0.65]);
    assert.equal(b.model.parts.filter((p: import("@automovie/interface").IAutoMovieModelPart): boolean =>p.id.endsWith("/drawer")).length,count);
    assert.equal(b.model.parts.filter((p: import("@automovie/interface").IAutoMovieModelPart): boolean =>p.id.endsWith("/leaf")).length,count);
    expect(b,"bay-1/drawer",[-length/2,-length/2+length/count,0.73,0.88,0.60,0.62]);
  }
  expect(kitchen.baseRun(1.30,"left"),"plinth",[-0.635,0.65,0,0.10,0.015,0.55]);
  expect(kitchen.baseRun(1.30,"right"),"plinth",[-0.65,0.635,0,0.10,0.015,0.55]);
  expect(kitchen.baseRun(1.30,"both"),"plinth",[-0.635,0.635,0,0.10,0.015,0.55]);
  assert.throws((): FittingBuilt =>kitchen.baseRun(1),/unsupported/);
  expect(kitchen.baseRun(-9.5-(-9.8)),"countertop",[-0.15,0.15,0.88,0.91,0,0.65]);
  assert.throws((): FittingBuilt =>kitchen.baseRun(0.3001),/unsupported/);
});

void test("shared fitting geometry refuses empty, duplicate, degenerate and invalid recess inputs",(): void =>{
  const a: FittingParts=new FittingParts();
  assert.throws((): void =>a.mesh("empty","leaf",(): void =>{}),/invalid fitting part/);
  assert.throws((): void =>a.box("flat","leaf",[0,0,0,1,0,1]),/invalid fitting box/);
  assert.throws((): void =>a.cylinder("zero","rod","x",[0,0,0],0,0.015),/invalid fitting cylinder/);
  assert.throws((): void =>a.recessedZDoor("bad",[0,1,0,2,0,0.02],[0,0.2,0.5,0.7],0.008),/invalid fitting recess/);
  a.box("valid","shelf",[0,1,0,0.02,0,0.5]);
  assert.throws((): void =>a.box("valid","shelf",[0,1,0,0.02,0,0.5]),/invalid fitting part/);
});

void test("upper cabinets and sink island respect clear knee, dishwasher and basin volumes", (): void =>{
  const k: KitchenDining=new KitchenDining();
  for(const [length,count] of [[1.30,2],[0.85,1]] as const){
    const b: FittingBuilt=k.wallCabinet(length);
    expect(b, "carcass", [-length/2, length/2, 0, 0.90, 0, 0.31]);
    assert.equal(
      b.model.parts.filter((p: import("@automovie/interface").IAutoMovieModelPart): boolean =>p.id.startsWith("door-")&&!p.id.includes("/")&&b.faceByPart[p.id]==="leaf").length,
      count,
    );
    near(
      Math.max(
        ...b.model.parts.filter((p: import("@automovie/interface").IAutoMovieModelPart): boolean =>b.faceByPart[p.id]==="handle").flatMap((p: import("@automovie/interface").IAutoMovieModelPart): number[] =>bound(b,p.id).filter((_: number,i: number): boolean =>i===5)),
      ),
      0.35,
    );
  }
  assert.throws((): FittingBuilt => k.wallCabinet(0.9 as 0.85), /unsupported/);
  const b: FittingBuilt=k.island();
  expect(b, "countertop/left", [-1.125, -1.025, 0.88, 0.91, 0, 1.05]);
  expect(b, "countertop/back", [-1.025, -0.525, 0.88, 0.91, 0, 0.45]);
  expect(b, "basin/bottom", [-1.025, -0.525, 0.71, 0.722, 0.45, 0.95]);
  expect(b, "carcass/dishwasher-back", [-0.475, 0.125, 0.10, 0.88, 0.30, 0.45]);
  assert.equal(
    b.model.parts.filter((p: import("@automovie/interface").IAutoMovieModelPart): boolean =>p.id.startsWith("countertop/")).length,
    4,
  );
  assert.ok(!b.model.parts.some((p: import("@automovie/interface").IAutoMovieModelPart): boolean =>p.id.includes("dishwasher-front")));
  near(bound(b,"faucet/stem")[3]!, 1.251);
});

void test("fireplace and service storage keep their five plates, casing relief and five L levels",(): void =>{
  const f: FittingBuilt=new Living().fireplace();
  expect(f,"firebox/back",[-0.52,0.52,0.23,0.87,-0.55,-0.525]);
  expect(f,"mantel",[-0.80,0.80,1.30,1.40,-0.55,0]);
  assert.equal(f.model.parts.filter((p: import("@automovie/interface").IAutoMovieModelPart): boolean =>f.faceByPart[p.id]==="firebox-trim").length,4);
  const service: ServiceRooms=new ServiceRooms(),laundry: FittingBuilt=service.laundryUpper(),pantry: FittingBuilt=service.pantryShelves();
  expect(laundry,"carcass/main",[5.22,5.485,1.50,2.30,-3.35,-2.05]);
  expect(laundry,"carcass/casing-side",[5.485,5.50,1.50,2.27,-3.28,-2.05]);
  assert.equal(laundry.model.parts.filter((p: import("@automovie/interface").IAutoMovieModelPart): boolean =>p.id.endsWith("/handle")).length,0);
  for(const [i,top] of [0.20,0.60,1.00,1.40,1.80].entries()){
    expect(pantry,`shelf/${i+1}`,[3.22,5.50,top-0.03,top,-6.05,-4.70]);
    expect(pantry,`cleat/${i+1}/back`,[3.235,5.48,top-0.06,top-0.03,-6.05,-6.03]);
  }
});

void test("small-bedroom wardrobes and upper wardrobe support bound travel, clothes and side relief",(): void =>{
  const bedrooms: Bedrooms=new Bedrooms(),closed: FittingBuilt=bedrooms.slidingCloset(),open: FittingBuilt=bedrooms.slidingCloset(0.72,0.72);
  expect(closed,"carcass/back-low",[-0.75,0.75,0,0.10,0.015,0.02]);
  expect(closed,"door/front/leaf",[-0.75,0.01,0.01,2.17,0.55,0.57]);
  expect(closed,"door/rear/leaf",[-0.01,0.75,0.01,2.17,0.50,0.52]);
  expect(open,"door/front/leaf",[-0.03,0.73,0.01,2.17,0.55,0.57]);
  expect(open,"door/rear/leaf",[-0.73,0.03,0.01,2.17,0.50,0.52]);
  assert.equal(closed.model.parts.filter((p: import("@automovie/interface").IAutoMovieModelPart): boolean =>closed.faceByPart[p.id]==="clothes").length,18);
  assert.throws((): FittingBuilt =>bedrooms.slidingCloset(0.721),/outside reviewed range/);
  assert.throws((): FittingBuilt =>bedrooms.slidingCloset(0,-0.001),/outside reviewed range/);
  const hanging: FittingBuilt=bedrooms.wardrobeHanging(),shelves: FittingBuilt=bedrooms.wardrobeShelves();
  expect(hanging,"rod",[2.13,4.22,1.635,1.665,-10.185,-10.155]);
  assert.equal(hanging.model.parts.filter((p: import("@automovie/interface").IAutoMovieModelPart): boolean =>hanging.faceByPart[p.id]==="clothes").length,36);
  expect(shelves,"carcass/right/low",[5.47,5.485,0,0.10,-10.435,-9.90]);
  for(const [i,top] of [0.20,0.65,1.10,1.55].entries())
    expect(shelves,`shelf/${i+1}`,[4.43,5.47,top-0.03,top,-10.45,-9.90]);
});

void test("fixed bathroom fittings retain the selected vanity, booth and bath envelopes",(): void =>{
  const baths: Bathrooms=new Bathrooms();
  for(const [w,d,doors] of [[0.60,0.45,1],[0.70,0.55,2],[0.85,0.55,2]] as const){
    const b: FittingBuilt=baths.vanity(w,d,w===0.60);
    expect(b,"plinth",[-w/2+0.02,w/2-0.02,0,0.10,w===0.60?0.015:0,d-0.07]);
    assert.equal(b.model.parts.filter((p: import("@automovie/interface").IAutoMovieModelPart): boolean =>p.id.endsWith("/handle")).length,doors);
    assert.equal(b.faceByPart.basin,"ceramic");
    near(bound(b,"faucet/stem")[3]!,1.05);
  }
  assert.throws((): FittingBuilt =>baths.vanity(0.60,0.55),/unsupported/);
  const shower: FittingBuilt=baths.showerBooth(),stack: FittingBuilt=baths.showerBooth(1);
  expect(shower,"glass/right",[0.617,0.625,0.018,2.10,0,1.01]);
  expect(shower,"glass/panel-1",[-0.625,-0.195,0.043,2.075,1.04,1.048]);
  expect(stack,"glass/panel-1",[0.195,0.625,0.043,2.075,1.04,1.048]);
  near(1.25-0.43-0.02,0.80);
  assert.throws((): FittingBuilt =>baths.showerBooth(1.001),/outside reviewed range/);
  const tub: FittingBuilt=baths.bathtub();
  expect(tub,"ceramic",[-0.90,0.90,0,0.55,0,0.80]);
  near(bound(tub,"faucet/head")[3]!,1.90);
});

void test("all fixed fitting triangles have finite metric attributes and outward winding", (): void =>{
  const b: Bathrooms=new Bathrooms(),k: KitchenDining=new KitchenDining(),s: ServiceRooms=new ServiceRooms(),bed: Bedrooms=new Bedrooms();
  const models: FittingBuilt[]=[
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
    ...([.60,.70,.85] as const).map((w: 0.7 | 0.85 | 0.6): FittingBuilt =>new SanitaryFittings().mirror(w)),
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
      const m: import("@automovie/interface").IAutoMovieMesh=part.geometry.mesh;
      assert.ok(
        m.positions.length>0&&m.positions.every(Number.isFinite),
        part.id,
      );
      assert.equal(m.normals?.length, m.positions.length, part.id);
      assert.equal(m.uvs?.length, m.positions.length/3*2, part.id);
      assert.ok(m.uvs?.every(Number.isFinite), part.id);
      assert.ok(m.indices && m.indices.length%3===0, part.id);
      for(let i: number=0;i<m.indices!.length;i+=3){
        const aa: number=m.indices![i]!*3,bb: number=m.indices![i+1]!*3,cc: number=m.indices![i+2]!*3;
        const ab: number[]=[
          m.positions[bb]!-m.positions[aa]!,
          m.positions[bb+1]!-m.positions[aa+1]!,
          m.positions[bb+2]!-m.positions[aa+2]!,
        ];
        const ac: number[]=[
          m.positions[cc]!-m.positions[aa]!,
          m.positions[cc+1]!-m.positions[aa+1]!,
          m.positions[cc+2]!-m.positions[aa+2]!,
        ];
        const nx: number=ab[1]!*ac[2]!-ab[2]!*ac[1]!,ny: number=ab[2]!*ac[0]!-ab[0]!*ac[2]!,nz: number=ab[0]!*ac[1]!-ab[1]!*ac[0]!;
        const signed: number=nx*m.normals![aa]!+ny*m.normals![aa+1]!+nz*m.normals![aa+2]!;
        assert.ok(
          signed>1e-14,
          `${built.model.id}/${part.id}/${i/3} normal or degeneracy`,
        );
      }
    }
  }
});
