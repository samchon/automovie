import assert from "node:assert/strict";
import { architecturalOpticalMaterial } from "../materials/003-glass-and-roof";
import { retainedArchitectureMaterial, sanitarySeatMaterial } from "../materials/006-wet-and-joinery";
import { materialStates, materialFrameQuestions } from "../materials/007-observation";
import { houseFinish, houseFinishRole } from "../materials/house-finishes";
import { materialFinish } from "../materials/001-binding-and-scale";

export function verifyMaterialOwners():void {
  assert.equal(new Set(materialStates.map(s=>s.privacy+"/"+s.flex)).size,6);
  for(const state of materialStates){
    assert.equal(architecturalOpticalMaterial("glass",state.privacy)!.transmission,state.privacy==="day"?.94:.38);
    assert.equal(architecturalOpticalMaterial("frosted",state.privacy)!.transmission,.28);
    assert.equal(architecturalOpticalMaterial("pv",state.privacy)!.alphaMode,"blend");
    assert.equal(architecturalOpticalMaterial("canopy-metal",state.privacy)!.metallic,.65);
    assert.equal(architecturalOpticalMaterial("unknown",state.privacy),null);
  }
  const seat=sanitarySeatMaterial();assert.equal(seat.baseColorTexture,null);assert.equal(seat.roughness,.30);
  const retained=materialFinish("soil","#3c4132",.98);
  assert.equal(retainedArchitectureMaterial(retained),retained);
  for(const roughness of [-1,2,NaN])assert.throws(()=>retainedArchitectureMaterial({...retained,roughness}));
  assert.throws(()=>retainedArchitectureMaterial({...retained,id:""}));
  const questions=materialFrameQuestions([]);assert.equal(questions.length,5);assert.ok(questions.every(q=>q.station===null));
  const failed={id:"01-exterior",space:"references",role:"reference",pose:null,reason:"outside",fov:50};
  assert.equal(materialFrameQuestions([failed])[0]!.station,failed);
  assert.equal(houseFinish("frame-coated").metallic,0);
  assert.equal(houseFinish("oak-floor").baseColorTexture!==null,true);
  for(const [host,old,expected] of [
    ["ground-foundation-0","stone",null],["front-body","stone","limestone-honed"],
    ["band","cassette","cassette-coated"],["band","seal","cassette-seal"],
    ["kitchen-overhead","plaster","joinery-light"],["wall","plaster","plaster-paint"],
    ["flex-workroom-lining-a","felt","felt-panel"],["basket","felt",null],
    ["bath-basin-bowl","tile","sanitary-ceramic"],["floor","tile","wet-tile"],
    ["room-floor-boards","oak","oak-floor"],["stair-0-tread-0","oak","oak-stair"],
    ["door-jamb","oak","oak-joinery"],["table","oak","oak-furniture"],
    ["kitchen-island-counter","white","worktop-stone"],["bath-toilet-bowl","white","sanitary-ceramic"],
    ["bed-pillow","white","textile-white"],["appliance","white",null],
    ["kitchen-island-door","green","joinery-green"],["sofa-cushion","green","textile-green"],
    ["leaf","green",null],["duvet","blue","textile-blue"],
    ["upper-linen-stack","linen",null],["duvet","linen","textile-linen"],
    ["screen","shade","screen-fabric"],["wall-spandrel-a","metal",null],
    ["window-glazing-a","metal","frame-coated"],["computer","metal",null],
    ["stair-0-stringer-0","steel","steel-satin"],["service-cabinet","steel",null],
    ["arbitrary","unknown",null],
  ] as const)assert.equal(houseFinishRole(host,old),expected,host);
}
