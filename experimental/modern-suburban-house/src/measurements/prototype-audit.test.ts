import { strict as assert } from "node:assert";
import { test } from "node:test";
import { buildHouseObjects, buildHousePrototypes, buildWindowCurtains, housePrototypeSpecs } from "../models/catalogue";
import { metricBeam, metricBox, metricCup, metricEllipsoid, metricFrustum, metricInvertedCup, metricOvalCup, metricPleatedCurtain, metricRingZ } from "../models/parts";
import { buildPrototype } from "../models/templates";
import { auditPrototypePopulation, runRandomMutations } from "./prototype-audit";

test("metric generators reject impossible solids and produce aligned UVs", () => {
  assert.throws(() => metricBox([0,0,0],[0,1,1]));
  assert.throws(() => metricFrustum([0,0,0],0.1,0.1,0));
  const box=metricBox([-1,0,0],[1,0.5,1]);
  assert.equal(box.positions.length/3,24);
  assert.equal(box.indices?.length,36);
  assert.equal(box.uvs?.length,48);
  assert.deepEqual(box.uvs?.slice(0,8),[0,0,2,0,2,0.5,0,0.5]);
  const cylinder=metricFrustum([0,0,0],0.2,0.1,1,12);
  assert.equal(cylinder.uvs?.length,(cylinder.positions.length/3)*2);
  assert.equal(cylinder.indices?.length,12*12);
  assert.ok(Math.abs(cylinder.uvs![2]-0.2*2*Math.PI/12)<1e-12);
  assert.ok(Math.abs(cylinder.uvs![4]-0.1*2*Math.PI/12)<1e-12);
  const cup=metricCup([0,0,0],0.1,0.14,0.1,0.008);
  assert.ok(cup.uvs!.slice(0,12).some((u)=>Math.abs(u-0.1*2*Math.PI/16)<1e-12));
  assert.ok(cup.uvs!.slice(0,12).some((u)=>Math.abs(u-0.14*2*Math.PI/16)<1e-12));
  for(const mesh of [
    metricBeam([0,0,0],[1,1,0],0.05,0.02),
    metricEllipsoid([0,0,0],[1,0.5,1]),
    metricRingZ([0,0,0],0.1,0.2,0.02),
    metricCup([0,0,0],0.1,0.14,0.1,0.008),
    metricOvalCup([0,0,0],0.1,0.14,0.1,0.008),
    metricInvertedCup([0,0,0],0.14,0.10,0.1,0.008),
    metricPleatedCurtain(0,-0.75,1.5),
  ]) {
    assert.ok(mesh.indices?.length);
    assert.equal(mesh.uvs?.length,mesh.positions.length/3*2);
  }
  assert.throws(()=>metricBeam([0,0,0],[0,0,0],0.05,0.02));
  assert.throws(()=>metricEllipsoid([0,0,0],[1,0,1]));
  assert.throws(()=>metricRingZ([0,0,0],0.2,0.1,0.02));
  assert.throws(()=>metricCup([0,0,0],0.1,0.14,0.1,0.11));
  assert.throws(()=>metricOvalCup([0,0,0],0.1,0.008,0.1,0.008));
  assert.throws(()=>metricInvertedCup([0,0,0],0.14,0.10,0.1,0.11));
  assert.throws(()=>metricPleatedCurtain(0,1,0));
});

test("separate room objects keep each reviewed face once", () => {
  const parents=buildHousePrototypes();
  const objects=buildHouseObjects(parents);
  assert.equal(objects.length,84);
  assert.ok(!objects.some((p)=>["porch-mat-planter","wall-art-indoor-plant","pantry-containers","kitchen-food-utensils","pendant-fixtures","laundry-machine","headboard-bed","child-desk"].includes(p.id)));
  for(const [parentId,children] of [
    ["porch-mat-planter",["porch-mat","porch-planter"]],
    ["wall-art-indoor-plant",["wall-art","indoor-plant"]],
    ["pantry-containers",["pantry-container","pantry-box","pantry-basket"]],
    ["kitchen-food-utensils",["kitchen-cutting-board","kitchen-tool-cup","kitchen-food-jar","dining-fruit-bowl"]],
    ["living-tabletop-props",["living-book-one","living-book-two","living-tray","living-vase-flowers"]],
    ["sofa-throws",["sofa-pillow-left","sofa-pillow-right","sofa-folded-throw"]],
    ["nightstand-lamp",["nightstand","nightstand-lamp-object"]],
  ] as const) {
    const parent=parents.find((p)=>p.id===parentId)!;
    const split=children.map((id)=>objects.find((p)=>p.id===id)!);
    assert.equal(split.reduce((n,p)=>n+p.model.parts.length,0),parent.model.parts.length);
    assert.deepEqual(new Set(split.flatMap((p)=>p.bindings.map((b)=>b.surface))),new Set(parent.bindings.map((b)=>b.surface)));
    for(const object of split) {
      const positions=object.model.parts.flatMap((part)=>part.geometry.type==="mesh"?part.geometry.mesh.positions:[]);
      const xs=positions.filter((_,i)=>i%3===0),zs=positions.filter((_,i)=>i%3===2);
      assert.ok(Math.abs(Math.min(...xs)+Math.max(...xs))<1e-9);
      assert.ok(Math.abs(Math.min(...zs)+Math.max(...zs))<1e-9);
    }
  }
  assert.throws(()=>buildHouseObjects(parents.filter((p)=>p.id!=="porch-mat-planter")),/missing design host/);
  assert.throws(()=>buildHouseObjects(parents.filter((p)=>p.id!=="pendant-fixtures")),/missing design host/);
  assert.throws(()=>buildHouseObjects(parents.filter((p)=>p.id!=="laundry-machine")),/missing design host/);
  assert.throws(()=>buildHouseObjects(parents.filter((p)=>p.id!=="headboard-bed")),/missing design host/);
  assert.throws(()=>buildHouseObjects(parents.filter((p)=>p.id!=="child-desk")),/missing design host/);
  for(const [id,width] of [["bedroom-two-desk",1.20],["bedroom-three-desk",1.15]] as const) {
    const desk=objects.find((p)=>p.id===id)!;
    const top=desk.model.parts.find((part)=>part.material==="top")?.geometry;
    if(top?.type!=="mesh") throw Error(`${id}: top missing`);
    const xs=top.mesh.positions.filter((_,i)=>i%3===0);
    assert.ok(Math.abs(Math.max(...xs)-Math.min(...xs)-width)<1e-9);
  }
  for(const room of ["bedroom-two","bedroom-three"]) {
    const stand=objects.find((p)=>p.id===`${room}-nightstand`)!;
    const lamp=objects.find((p)=>p.id===`${room}-nightstand-lamp`)!;
    assert.ok(stand&&lamp);
    const xs=stand.model.parts.filter((part)=>part.material==="carcass").flatMap((part)=>{
      if(part.geometry.type!=="mesh") throw Error(`${room}: nightstand body missing`);
      return part.geometry.mesh.positions.filter((_,i)=>i%3===0);
    });
    assert.ok(Math.abs(Math.max(...xs)-Math.min(...xs)-0.45)<1e-9);
    assert.deepEqual(lamp.bindings.map((b)=>b.surface).sort(),["lamp-base","lamp-shade"]);
  }
  for(const [id,width,pillows] of [["primary-bed",1.60,2],["bedroom-two-bed",1.15,1],["bedroom-three-bed",1.15,1]] as const) {
    const bed=objects.find((p)=>p.id===id)!;
    const headboard=bed.model.parts.find((part)=>part.material==="headboard")?.geometry;
    if(headboard?.type!=="mesh") throw Error(`${id}: headboard missing`);
    const xs=headboard.mesh.positions.filter((_,i)=>i%3===0);
    assert.ok(Math.abs(Math.max(...xs)-Math.min(...xs)-width)<1e-9);
    assert.equal(bed.model.parts.filter((part)=>part.material==="pillow").length,pillows);
  }
  const beds=["primary-bed","bedroom-two-bed","bedroom-three-bed"].map((id)=>objects.find((p)=>p.id===id)!);
  assert.equal(new Set(beds.map((bed)=>bed.bindings.find((b)=>b.surface==="bedding")!.fallback)).size,3);
  assert.equal(new Set(beds.map((bed)=>bed.bindings.find((b)=>b.surface==="pillow")!.fallback)).size,1);
  const mirror=objects.find((p)=>p.id==="wall-mirror")!;
  assert.equal(mirror.model.materials.find((material)=>material.id==="mirror")?.metallic,1);
  const withoutMat=structuredClone(parents);
  const porch=withoutMat.find((p)=>p.id==="porch-mat-planter")!;
  porch.model.parts.splice(0,porch.model.parts.length,...porch.model.parts.filter((p)=>p.material!=="field"&&p.material!=="border"));
  assert.throws(()=>buildHouseObjects(withoutMat),/empty object/);
  const nonMesh=structuredClone(parents);
  const altered=nonMesh.find((p)=>p.id==="porch-mat-planter")!;
  altered.model.parts[0]!.geometry={type:"invalid"} as unknown as typeof altered.model.parts[0]["geometry"];
  assert.throws(()=>buildHouseObjects(nonMesh),/non-mesh component/);
  const withoutBinding=parents.map((p)=>p.id==="porch-mat-planter"?{...p,bindings:p.bindings.slice(1)}:p);
  assert.throws(()=>buildHouseObjects(withoutBinding),/incomplete extracted material faces/);
  const extraBinding=parents.map((p)=>p.id==="porch-mat-planter"?{...p,bindings:[...p.bindings,{...p.bindings[0]!,surface:"orphan-face"}]}:p);
  assert.throws(()=>buildHouseObjects(extraBinding),/unassigned object face/);
  const towels=objects.find((p)=>p.id==="linen-folded-towels")!;
  assert.equal(towels.model.parts.length,2);
  const towelYs=towels.model.parts.flatMap((part)=>part.geometry.type==="mesh"?part.geometry.mesh.positions.filter((_,i)=>i%3===1):[]);
  assert.equal(Math.min(...towelYs),0);
  assert.equal(Math.max(...towelYs),0.12);
  const pillow=objects.find((p)=>p.id==="sofa-pillow-left")!;
  const pillowMesh=pillow.model.parts[0]!.geometry;
  assert.equal(pillowMesh.type,"mesh");
  if(pillowMesh.type==="mesh") assert.ok(pillowMesh.mesh.positions.length/3>24);
  assert.equal(objects.find((p)=>p.id==="living-tray")!.model.parts.length,5);
  for(const [id,width,drop] of [["island-pendant",0.28,0.80],["dining-pendant",0.48,1.20]] as const) {
    const object=objects.find((p)=>p.id===id)!;
    const positions=object.model.parts.flatMap((part)=>part.geometry.type==="mesh"?part.geometry.mesh.positions:[]);
    const xs=positions.filter((_,i)=>i%3===0),ys=positions.filter((_,i)=>i%3===1);
    assert.ok(Math.abs(Math.max(...xs)-Math.min(...xs)-width)<1e-9);
    assert.ok(Math.abs(Math.min(...ys)+drop)<1e-9);
    assert.equal(Math.max(...ys),0);
  }
  const washer=objects.find((p)=>p.id==="laundry-washer")!;
  const dryer=objects.find((p)=>p.id==="laundry-dryer")!;
  assert.equal(washer.owner,dryer.owner);
  assert.deepEqual(washer.bindings.map((b)=>b.surface),dryer.bindings.map((b)=>b.surface));
  const markX=(p:typeof washer)=>{
    const geometry=p.model.parts.find((part)=>part.id==="control-panel-2")?.geometry;
    if(geometry?.type!=="mesh") throw Error("laundry marking missing");
    return Math.min(...geometry.mesh.positions.filter((_,i)=>i%3===0));
  };
  assert.notEqual(markX(washer),markX(dryer));
});

test("ceiling pendant lives below its origin and rejects an upward escape", () => {
  const models=buildHousePrototypes();
  const pendant=models.find((p)=>p.id==="pendant-fixtures")!;
  const positions=pendant.model.parts.flatMap((part)=>part.geometry.type==="mesh"?part.geometry.mesh.positions:[]);
  const ys=positions.filter((_,i)=>i%3===1);
  assert.equal(Math.min(...ys),-1.20);
  assert.equal(Math.max(...ys),0);
  const geometry=pendant.model.parts.find((part)=>part.material==="fixture-shade")!.geometry;
  if(geometry.type!=="mesh") throw Error("expected shade mesh");
  for(let i=1;i<geometry.mesh.positions.length;i+=3) geometry.mesh.positions[i]+=2;
  assert.ok(auditPrototypePopulation(models).failures.some((line)=>line.includes("pendant-fixtures")&&line.includes("outside declared model envelope")));
});

test("one curtain generator follows its opening lower-left origin across hosts", () => {
  for(const input of [
    {openingWidth:2.40,openingHeight:1.40,floorDrop:0.75},
    {openingWidth:1.60,openingHeight:1.20,floorDrop:0.60},
  ]) {
    const model=buildWindowCurtains(input);
    const positions=model.model.parts.flatMap((part)=>part.geometry.type==="mesh"?part.geometry.mesh.positions:[]);
    const xs=positions.filter((_,i)=>i%3===0),ys=positions.filter((_,i)=>i%3===1),zs=positions.filter((_,i)=>i%3===2);
    assert.ok(Math.abs(Math.min(...xs)+0.10)<1e-9);
    assert.ok(Math.abs(Math.max(...xs)-input.openingWidth-0.10)<1e-9);
    assert.equal(Math.min(...ys),-input.floorDrop);
    assert.ok(Math.abs(Math.max(...ys)-input.openingHeight-0.1125)<1e-9);
    assert.ok(Math.max(...zs)<0.12);
    assert.equal(model.model.parts.filter((part)=>part.material==="curtain").length,2);
  }
  assert.throws(()=>buildWindowCurtains({openingWidth:0,openingHeight:1,floorDrop:0.6}),/invalid curtain dimensions/);
});

test("every design H2 has one generated prototype, source owner and face bindings", () => {
  const report=auditPrototypePopulation(buildHousePrototypes());
  assert.ok(report.designed>0);
  assert.equal(report.accounted,report.designed);
  assert.equal(report.built,report.designed);
  assert.ok(report.measuredParts>300);
  assert.equal(report.failures.length,0,report.failures.join("\n"));
  assert.ok(!buildHousePrototypes().some((p)=>/car|automobile|vehicle/.test(p.id)));
});

test("every declared finish binds consistent fallback, scale, roughness, and metallic response", () => {
  const models=new Map(buildHousePrototypes().map((p)=>[p.id,p]));
  const roleBindings=new Map<string,{fallback:number;scale:readonly [number,number];roughness:number;metallic:number}>();
  let checked=0;
  for(const spec of housePrototypeSpecs) for(const surface of spec.faces) {
    const role=spec.finishes?.[surface]??spec.finishAll;
    if(!role) continue;
    const model=models.get(spec.id)!;
    const binding=model.bindings.find((b)=>b.surface===surface);
    const material=model.model.materials.find((m)=>m.id===surface);
    assert.ok(binding,`${spec.id}/${surface}: missing binding`);
    assert.ok(material,`${spec.id}/${surface}: missing material`);
    const actual={fallback:binding.fallback,scale:binding.scale,roughness:material.roughness,metallic:material.metallic};
    const prior=roleBindings.get(role);
    if(prior) assert.deepEqual(actual,prior,`${role}: inconsistent finish parameters`);
    else roleBindings.set(role,actual);
    checked++;
  }
  assert.ok(checked>0);
  assert.ok(roleBindings.size>0);
});

test("face and metric UV defects are rejected across the whole population", () => {
  const altered=buildHousePrototypes();
  const prototype=altered.find((p)=>p.model.parts.length>1)!;
  prototype.model.parts[0]!.material="unowned-surface";
  assert.ok(auditPrototypePopulation(altered).failures.some((line)=>line.includes("extra face")));
  const another=buildHousePrototypes();
  const mesh=another[0]!.model.parts[0]!.geometry;
  if(mesh.type!=="mesh") throw Error("expected mesh");
  mesh.mesh.uvs=null;
  assert.ok(auditPrototypePopulation(another).failures.some((line)=>line.includes("incomplete mesh attributes")));
});

test("collapsed UVs fail on an otherwise valid mesh", () => {
  const altered=buildHousePrototypes();
  const geometry=altered[0]!.model.parts[0]!.geometry;
  if(geometry.type!=="mesh") throw Error("expected mesh");
  geometry.mesh.uvs!.fill(0);
  assert.ok(auditPrototypePopulation(altered).failures.some((line)=>line.includes("collapsed metric UV triangle")));
});

test("surface projections and duplicate bindings fail", () => {
  const altered=buildHousePrototypes();
  const first=altered[0]!;
  Object.assign(first.bindings[0]!,{uv:"invalid"});
  first.bindings=[...first.bindings,first.bindings[0]!];
  const failures=auditPrototypePopulation(altered).failures;
  assert.ok(failures.some((line)=>line.includes("unknown UV projection")));
  assert.ok(failures.some((line)=>line.includes("duplicate surface binding")));
});

test("template refuses unmade surfaces and nonpositive dimensions", () => {
  assert.throws(()=>buildPrototype({id:"sample",design:"sample.md",owner:"sample.ts",kind:"table",size:[1,1,1],faces:["unknown"]}),/unbuilt surfaces/);
  assert.throws(()=>buildPrototype({id:"sample",design:"sample.md",owner:"sample.ts",kind:"table",size:[1,0,1],faces:["top"]}),/invalid dimensions/);
});

test("fresh random part mutations go red", () => {
  const result=runRandomMutations(2);
  assert.equal(result.red,2);
  assert.deepEqual(result.types,{shift:1,float:1,delete:0,overlap:0});
});
