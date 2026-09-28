/** Object membership, real support contact and invalid environment diagnostics. */
import assert from "node:assert/strict";
import test from "node:test";
import { validateMeshTopology } from "@automovie/engine";
import { addTempleObjectInstances } from "../../instances/objects";
import { createTempleEnvironment } from "../../spaces/environment";
import { templeModelFinish } from "../../materials/bindings";
import { TemplePortable } from "../../models/portable";
import { TempleFixtures } from "../../models/fixtures";
const prior=createTempleEnvironment().environment;
const scene=addTempleObjectInstances(prior);
const members=scene.elements.slice(prior.elements.length);
const models=new Map(scene.models.map(model=>[model.id,model]));
const entry=(role:string)=>members.find(member=>member.id===`element.object.${role}`)!;
const low=(role:string)=>{
  const member=entry(role),model=models.get(member.model!)!;
  return member.transform.translation.y+Math.min(...model.parts.flatMap(part=>
    part.geometry.type==="mesh"?part.geometry.mesh.positions.filter((_,i)=>i%3===1):[]));
};

void test("all seven room populations and twenty named scroll cells are present",()=>{
  assert.equal(members.length,84);
  assert.equal(new Set(members.map(member=>member.id)).size,84);
  assert.deepEqual(Object.fromEntries(["sanctuary","offering","administration","records","storage","service-yard","courtyard"].map(space=>
    [space,members.filter(member=>member.space===space).length])),
    {sanctuary:10,offering:11,administration:10,records:28,storage:10,"service-yard":6,courtyard:9});
  assert.equal(members.filter(member=>member.model==="ware.scroll.rolled").length,10);
  assert.equal(members.filter(member=>member.model==="ware.scroll.bundle").length,10);
  for(const member of members){
    assert.equal(member.parent,"temple.root");
    assert.deepEqual(member.transform.scale,{x:1,y:1,z:1});
    assert.ok(models.has(member.model!));
  }
});

void test("origin-centred objects and supported wares meet actual host planes",()=>{
  for(const [role,height] of [
    ["yard.yoke",0],["yard.cart",0],["court.bench.west",-0.12],
    ["sanctuary.bowl",1.1],["sanctuary.censer",1.1],["sanctuary.niche-vessel",0.75],
    ["offering.tray-bowl",0.838],["administration.stylus",0.75],
    ["storage.rack-jar.west",0.268],["storage.rack-jar.east",0.268],
    ["storage.stand-jar",0.34],["court.plant.west",0.15],
  ] as const)assert.ok(Math.abs(low(role)-height)<1e-9,role);
  for(let tier=0;tier<5;tier++)for(let cell=0;cell<4;cell++)
    assert.ok(Math.abs(low(`records.scroll.tier-${tier}.cell-${cell}`)-[0.04,0.37,0.70,1.03,1.36][tier]!)<1e-9);
});

void test("object source rejects repeated members, duplicate model IDs and missing rooms",()=>{
  assert.throws(()=>addTempleObjectInstances(scene),/duplicate member ID/);
  assert.throws(()=>addTempleObjectInstances({...prior,models:[prior.models[0]!,prior.models[0]!]}),/duplicate input model ID/);
  assert.throws(()=>addTempleObjectInstances({...prior,spaces:prior.spaces.filter(space=>space.id!=="sanctuary")}),/missing space sanctuary/);
});

void test("prop finish lookup separates composite parts and refuses unknown parts",()=>{
  assert.equal(templeModelFinish("fixture.chest","body"),"dark-wood");
  assert.equal(templeModelFinish("fixture.chest","hasp"),"dark-metal");
  assert.equal(templeModelFinish("ware.scroll.bundle","sheet-3"),"parchment");
  assert.equal(templeModelFinish("ware.scroll.bundle","tie"),"rope-fibre");
  assert.equal(templeModelFinish("portable.planter","pot"),"terracotta");
  assert.equal(templeModelFinish("portable.planter","soil"),"soil");
  assert.equal(templeModelFinish("ritual.censer","ash"),"soil");
  assert.equal(templeModelFinish("ritual.censer","cup"),"dark-metal");
  for(const member of members)for(const part of models.get(member.model!)!.parts)
    assert.ok(templeModelFinish(member.model!,part.id));
  assert.throws(()=>templeModelFinish("fixture.chest","unknown"),/no object part finish/);
  assert.throws(()=>templeModelFinish("unknown","body"),/no model finish/);
});

void test("joined lamp foot, tray, folded cloth and tablet frame have valid mesh topology",()=>{
  const portable=new TemplePortable();
  for(const model of [new TempleFixtures().lampstand(),portable.offeringTray(),
    portable.textile("standard"),portable.textile("small"),portable.writingTablet(),portable.jarRack()])
    for(const part of model.parts){
      assert.equal(part.geometry.type,"mesh");
      if(part.geometry.type!=="mesh")continue;
      assert.equal(validateMeshTopology({mesh:part.geometry.mesh}).success,true,`${model.id}/${part.id}`);
    }
});
