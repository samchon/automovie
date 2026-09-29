/** Authored oak binding and seamless grain remain distinct from white trim. */
import assert from "node:assert/strict";
import test from "node:test";
import {buildingModelFinish} from "../materials/model-bindings";
import {ServiceRooms} from "../models/furnishings/service-rooms";
import {furnitureOakSample} from "../materials/furnishings/wood-grain.mjs";

void test("every pantry shelf and cleat resolves to the canonical oil-finished oak",()=>{
  const built=new ServiceRooms().pantryShelves();
  assert.equal(built.model.parts.length,15);
  for(const part of built.model.parts){
    const finish=buildingModelFinish(built.model.id,built.faceByPart[part.id]!);
    assert.equal(finish.material.id,"furniture-wood");
    assert.equal(finish.texture?.file,"furniture-oak.png");
    assert.deepEqual(finish.texture?.metres,[1,.15]);
  }
  assert.equal(buildingModelFinish("fitting:laundry-upper","leaf").material.id,"greige-cabinet");
});
void test("oak sampler is deterministic and periodic in both axes without a plank seam",()=>{
  for(const [u,v] of [[0,0],[.13,.31],[.67,.89],[1,1]]){
    const rgb=furnitureOakSample(u!,v!);
    assert.deepEqual(rgb,furnitureOakSample(u!,v!));
    assert.deepEqual(rgb,furnitureOakSample(u!+1,v!));
    assert.deepEqual(rgb,furnitureOakSample(u!,v!+1));
    assert.ok(rgb.every((c,i)=>Math.abs(c-[168,122,78][i]!)<=7));
  }
  assert.notDeepEqual(furnitureOakSample(.25,.17),furnitureOakSample(.25,.18));
});
