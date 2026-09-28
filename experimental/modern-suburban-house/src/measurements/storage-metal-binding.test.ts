/** Reused rod/rail IDs resolve to bare storage metal while handles keep their coating. */
import assert from "node:assert/strict";
import test from "node:test";
import { buildingModelFinish } from "../materials/model-bindings";

void test("storage rods and rails resolve uniquely to the declared stainless finish",()=>{
  for(const model of ["closet:entry-coat-storage","closet:upper-linen-storage","fitting:bedroom-sliding-closet"])
    for(const face of ["rod","rail"])
      assert.equal(buildingModelFinish(model,face).material.id,"stainless-steel");
  assert.equal(buildingModelFinish("fitting:wardrobe-hanging","rod").material.id,"stainless-steel");
});

void test("storage handles retain black coating without assigning unrelated faces",()=>{
  for(const model of ["closet:entry-coat-storage","closet:upper-linen-storage","fitting:bedroom-sliding-closet"])
    assert.equal(buildingModelFinish(model,"handle").material.id,"black-coated-metal");
  assert.throws(()=>buildingModelFinish("fitting:wardrobe-hanging","rail"),/found 0/);
});
