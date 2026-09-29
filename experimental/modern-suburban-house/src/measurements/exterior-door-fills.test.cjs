/** Exterior doors are placed from actual opening faces, then combined with windows. */
const assert = require("node:assert/strict");
const { test } = require("node:test");

const { buildHouseEnvironment } = require("../spaces/environment.ts");
const { ExteriorDoorFills } = require("../instances/exterior-door-fills.ts");
const { OpeningWindowFills } = require("../instances/opening-fills.ts");
const { validateMeshTopology } = require("@automovie/engine");

const environment = buildHouseEnvironment();
/** @param {number} actual @param {number} expected */
const near = (actual, expected) => assert.ok(
  Math.abs(actual-expected)<1e-7,
  `${actual} is not ${expected}`,
);

void test("three actual wall voids and the separate gate receive unique closed prototypes", () => {
  const result = new ExteriorDoorFills().build(environment);
  assert.equal(result.prototypes.length, 4);
  assert.deepEqual(
    result.instances.map((x)=>x.id),
    [
      "fill:front-door",
      "fill:garage-front-door",
      "fill:garden-door",
      "fill:side-yard-gate",
    ],
  );
  for(const placement of result.instances){
    const model=result.prototypes.find((p)=>p.model.id===placement.modelId);
    assert.ok(model, `missing prototype ${placement.modelId}`);
    assert.equal(model.model.parts.length, Object.keys(model.faceByPart).length);
    for(const part of model.model.parts){
      assert.equal(part.geometry.type, "mesh");
      assert.equal(
        validateMeshTopology({ mesh:part.geometry.mesh }).success,
        true,
        `${model.model.id}/${part.id} topology`,
      );
    }
  }
  const [front,garage,garden,gate]=result.instances;
  const fp=front.transform.translation,fr=front.transform.rotation;
  const gp=garage.transform.translation,dp=garden.transform.translation,dr=garden.transform.rotation;
  assert.ok(fp&&fr&&gp&&dp&&dr);
  near(fp.x, .90);
  near(fp.y, 0);
  near(fp.z, 0);
  near(fr.w, 1);
  near(gp.x, 8.60);
  near(gp.y, -.15);
  near(gp.z, -.30);
  near(dp.x, 0);
  near(dp.y, 0);
  near(dp.z, -10.70);
  near(dr.y, 1);
  assert.deepEqual(gate.transform.translation, { x:0, y:0, z:0 });
  assert.deepEqual(gate.transform.rotation, { x:0, y:0, z:0, w:1 });
});

void test("door and window producers compose into sixteen distinct exterior fillings", () => {
  const doors=new ExteriorDoorFills().build(environment);
  const windows=new OpeningWindowFills().build(environment);
  const all=[...doors.instances,...windows.instances];
  assert.equal(all.length,16);
  assert.equal(new Set(all.map((x)=>x.id)).size,all.length);
  assert.equal(new Set([...doors.prototypes,...windows.prototypes].map((x)=>x.model.id)).size,all.length);
  const openingIds=new Set(environment.openings.filter((x)=>x.kind==="window"||
    ["front-door","garage-front-door","garden-door"].includes(x.id)).map((x)=>`fill:${x.id}`));
  assert.equal(openingIds.size,15);
  for(const id of openingIds)assert.ok(all.some((x)=>x.id===id),id);
});

void test("placement refuses missing, duplicated and resized reviewed openings", () => {
  const builder=new ExteriorDoorFills();
  const without={
    ...environment,
    openings:environment.openings.filter((x)=>x.id!=="garden-door"),
  };
  assert.throws(()=> builder.build(without), /population differs/);
  const front=environment.openings.find((x)=>x.id==="front-door");
  assert.ok(front);
  const duplicate={ ...environment, openings:[...environment.openings, front] };
  assert.throws(()=> builder.build(duplicate), /population differs/);
  const resized={
    ...environment,
    openings:environment.openings.map((o)=>{
      if(o.id!=="front-door")return o;
      assert.ok(o.profile);
      return {
        ...o,
        profile:{
          outline:o.profile.outline.map((p,i)=>({
            ...p,
            x:i===1||i===2 ? p.x+.01 : p.x,
          })),
        },
      };
    }),
  };
  assert.throws(()=> builder.build(resized), /outline disagrees/);
});
