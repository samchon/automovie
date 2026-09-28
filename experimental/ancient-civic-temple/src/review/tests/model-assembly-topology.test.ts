/** Current authored model assemblies must remain valid at every mesh part. */
import assert from "node:assert/strict";
import test from "node:test";
import { validateMeshTopology } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";
import { TempleCladding } from "../../models/cladding";
import { TempleColumns } from "../../models/columns";
import { TempleEntablature } from "../../models/entablature";
import { TempleOpenings } from "../../models/openings";
import { TempleLandscape } from "../../models/landscape";

const validParts=(model:IAutoMovieModel):void=>{
  for(const part of model.parts){
    assert.equal(part.geometry.type,"mesh");
    if(part.geometry.type!=="mesh")continue;
    const check=validateMeshTopology({ mesh:part.geometry.mesh });
    assert.equal(
      check.success,
      true,
      `${model.id}/${part.id}: ${check.success?"":check.violations[0]?.expected}`,
    );
  }
};

void test("both column heights and porch capital remain closed",()=>{
  const columns=new TempleColumns();
  for(const model of [columns.colonnade(12),columns.colonnade(19),columns.porch()])
    validParts(model);
});

void test("door and window joinery keeps clear voids without internal faces",()=>{
  const openings=new TempleOpenings();
  for(const model of [
    openings.doorFrame("door-entry"),
    openings.doorFrame("door-service-exterior"),
    openings.doubleLeaf("door-entry"),
    openings.singleLeaf("door-offering"),
    openings.windowFrame(0.30),
    openings.windowFrame(0.60),
  ])validParts(model);
});

void test("sloped beams and roof module keep valid parts",()=>{
  const entablature=new TempleEntablature();
  for(const model of [entablature.porch(),entablature.sanctuaryTruss(),
    new TempleCladding().roofTile()])validParts(model);
});

void test("both neighbor envelopes join their plinth corners on faces", ()=>{
  const landscape=new TempleLandscape();
  validParts(landscape.neighborHouse("gable"));
  validParts(landscape.neighborHouse("shed"));
});
