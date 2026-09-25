import { strict as assert } from "node:assert";
import { test } from "node:test";
import { validateModel } from "@automovie/engine";
import { buildWindowPrototype, windowProfile, type WindowKind } from "../models/windows";

test("each window kind fills its own measured opening with separate infill faces", () => {
  for (const [kind,units] of [["double-hung",3],["fixed",2],["awning",1]] as const satisfies readonly (readonly [WindowKind,number])[]) {
    const width=2.8,height=1.6;
    const window=buildWindowPrototype({id:`test-${kind}`,width,height,units,kind});
    const result=validateModel({model:window.model});
    assert.equal(result.success,true,result.success?"":JSON.stringify(result.violations));
    const faces=new Set(window.model.parts.map((part)=>part.material));
    assert.ok(faces.has("frame")&&faces.has("sash"));
    assert.equal(faces.has("mullion"),units>1);
    assert.equal(faces.has("muntin"),kind!=="awning");
    assert.equal(faces.has("obscured-glass"),kind==="awning");
    assert.equal(faces.has("glass"),kind!=="awning");
    const glass=window.model.parts.filter((part)=>part.material=== (kind==="awning"?"obscured-glass":"glass"));
    assert.equal(glass.length,kind==="double-hung"?units*2:units);
    const positions=window.model.parts.flatMap((part)=>part.geometry.type==="mesh"?part.geometry.mesh.positions:[]);
    const xs=positions.filter((_,index)=>index%3===0),ys=positions.filter((_,index)=>index%3===1);
    assert.equal(Math.min(...xs),-width/2);
    assert.equal(Math.max(...xs),width/2);
    assert.equal(Math.min(...ys),0);
    assert.equal(Math.max(...ys),height);
  }
});

test("window member grammar rejects missing, fractional and glassless openings", () => {
  for (const units of [0,1.5,-1]) assert.throws(()=>buildWindowPrototype({id:"bad",width:2,height:1,units,kind:"fixed"}),/invalid/);
  assert.throws(()=>buildWindowPrototype({id:"bad",width:2,height:1,units:2,kind:"awning"}),/invalid/);
  assert.throws(()=>buildWindowPrototype({id:"bad",width:windowProfile.minUnitWidth, height:1, units:1,kind:"fixed"}),/cover the glass/);
  assert.throws(()=>buildWindowPrototype({id:"bad",width:1, height:0, units:1,kind:"fixed"}),/invalid/);
  assert.throws(()=>buildWindowPrototype({id:"bad",width:1, height:0.30, units:1,kind:"double-hung"}),/cover the glass/);
});

test("window panes follow their own sash track instead of a shared glass plane", () => {
  const zBounds=(window:ReturnType<typeof buildWindowPrototype>,face:string)=>
    window.model.parts.filter((part)=>part.material===face).map((part)=>{
      if(part.geometry.type!=="mesh") throw Error("pane mesh missing");
      const z=part.geometry.mesh.positions.filter((_,index)=>index%3===2);
      return [Math.min(...z),Math.max(...z)] as const;
    });
  const fixed=buildWindowPrototype({id:"fixed-depth",width:0.78,height:1.1,units:1,kind:"fixed"});
  const awning=buildWindowPrototype({id:"awning-depth",width:0.9,height:0.75,units:1,kind:"awning"});
  const hung=buildWindowPrototype({id:"hung-depth",width:1.2,height:1.4,units:1,kind:"double-hung"});
  for(const pane of [...zBounds(fixed,"glass"),...zBounds(awning,"obscured-glass")]) {
    assert.ok(Math.abs(pane[0]+0.113)<1e-9);
    assert.ok(Math.abs(pane[1]+0.107)<1e-9);
  }
  const panes=zBounds(hung,"glass");
  assert.equal(panes.length,2);
  assert.ok(Math.abs(panes[0]![0]+0.083)<1e-9);
  assert.ok(Math.abs(panes[0]![1]+0.077)<1e-9);
  assert.ok(Math.abs(panes[1]![0]+0.153)<1e-9);
  assert.ok(Math.abs(panes[1]![1]+0.147)<1e-9);
});
