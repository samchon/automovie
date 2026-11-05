import { autoMovieRenderDigest } from "@automovie/engine";
import { AutoMovieHumanStateAdmission } from "@automovie/human";
import { calibratedPaperGrasps } from "./calibratedPaperGrasps";
import type { createHumanPerformer } from "./createHumanPerformer";
/**
 * Separate retained calibration provenance from the actual factory's hand applicability.
 * @evidence contracts/common.md#implementation-and-ownership Captures every expected/actual whole-model digest, canonical parameter comparison, same-factory model/rest pair, each bind field record and every emitted mesh's geometry/index/transform identity before any refusal. Required hand topology is distinguished from other body/face/clothing data. Original captured geometry is diagnostic baseline only and never supplies current skin. A changed model must re-address original skin and replay the retained nine controls against that coherent actual model under all physical criteria; provenance equality alone proves none of them.
 * @evidence contracts/common.md#authoring-interface Supply the actual commissioned factory instance and one anatomical side. matchingCalibration means exact original bytes, while applicable requires canonical parameters, a coherent current rest pair and the same declared hand topology. Other numeric/model differences remain explicit observations, never a transferred grasp approval. The caller records this result before refusing or replaying/retargeting. Raw factory source SHA is separately checked by CPU/source bookends.
 */
export function inspectGraspModel(actor:ReturnType<typeof createHumanPerformer>,side:"left"|"right"):{cast:"carina"|"harry";matchingCalibration:boolean;applicable:boolean;parameters:{same:boolean;expected:unknown;actual:unknown};digests:{expectedBind:string;actualBind:string;actualEvaluatorBind:string;expectedMeshes:string;actualMeshes:string};boneDifferences:{index:number;expected:unknown;actual:unknown}[];meshDifferences:{index:number;expected:unknown;actual:unknown;requiredHand:boolean}[];handTopology:{same:boolean;expected:unknown[];actual:unknown[]}} {
  const cast:"carina"|"harry"=actor.parameters.body?.anatomy?.sex==="female"?"carina":"harry";
  const expected:typeof calibratedPaperGrasps.models.carina=calibratedPaperGrasps.models[cast];
  const digest:(value:unknown)=>string=(value:unknown):string=>autoMovieRenderDigest(JSON.stringify(value)).slice(7);
  const actualBind:string=digest(actor.model.bind);const evaluatorBind:string=digest(actor.evaluate({}).bones);const actualMeshes:string=digest(actor.model.meshes);
  const sameParameters:boolean=AutoMovieHumanStateAdmission.key(actor.parameters)===AutoMovieHumanStateAdmission.key(expected.parameters);
  const boneDifferences:{index:number;expected:unknown;actual:unknown}[]=[];
  for(let index:number=0;index<Math.max(expected.bind.length,actor.model.bind.length);index++)if(AutoMovieHumanStateAdmission.key(expected.bind[index])!==AutoMovieHumanStateAdmission.key(actor.model.bind[index]))boneDifferences.push({index,expected:expected.bind[index],actual:actor.model.bind[index]});
  const actual:typeof expected.meshIdentities=actor.model.meshes.map((mesh:typeof actor.model.meshes[number],index:number):typeof expected.meshIdentities[number]=>({ordinal:index,parent:mesh.parent,positions:mesh.positions.length/3,indices:mesh.indices?.length??null,positionSha256:digest(mesh.positions),indexSha256:digest(mesh.indices),transform:mesh.transform}));
  const required:(row:typeof expected.meshIdentities[number]|undefined)=>boolean=(row:typeof expected.meshIdentities[number]|undefined):boolean=>Boolean(row?.parent.some((name:string):boolean=>new RegExp("^human\\.polygon\\."+side+"(Hand|Index|Thumb|Middle|Ring|Little)").test(name)));
  const meshDifferences:{index:number;expected:unknown;actual:unknown;requiredHand:boolean}[]=[];
  for(let index:number=0;index<Math.max(expected.meshIdentities.length,actual.length);index++)if(AutoMovieHumanStateAdmission.key(expected.meshIdentities[index])!==AutoMovieHumanStateAdmission.key(actual[index]))meshDifferences.push({index,expected:expected.meshIdentities[index],actual:actual[index],requiredHand:required(expected.meshIdentities[index])||required(actual[index])});
  const topology:(rows:typeof actual)=>unknown[]=(rows:typeof actual):unknown[]=>rows.filter(required).map((row):unknown=>({parent:row.parent,positions:row.positions,indices:row.indices,indexSha256:row.indexSha256}));
  const expectedHand:unknown[]=topology(expected.meshIdentities);const actualHand:unknown[]=topology(actual);
  const sameTopology:boolean=expectedHand.length===16&&AutoMovieHumanStateAdmission.key(expectedHand)===AutoMovieHumanStateAdmission.key(actualHand);
  return {cast,matchingCalibration:actualBind===expected.bindSha256&&actualMeshes===expected.meshSha256,applicable:sameParameters&&actualBind===evaluatorBind&&sameTopology,parameters:{same:sameParameters,expected:expected.parameters,actual:actor.parameters},digests:{expectedBind:expected.bindSha256,actualBind,actualEvaluatorBind:evaluatorBind,expectedMeshes:expected.meshSha256,actualMeshes},boneDifferences,meshDifferences,handTopology:{same:sameTopology,expected:expectedHand,actual:actualHand}};
}
