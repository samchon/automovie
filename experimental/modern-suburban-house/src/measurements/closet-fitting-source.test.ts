/** Numeric witnesses for the two reviewed closet fitting prototypes. */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { Closet } from "../models/closet";

const bounds = (positions: number[]): [number, number][] => {
  const result: [number, number][] = [
    [Infinity, -Infinity],
    [Infinity, -Infinity],
    [Infinity, -Infinity],
  ];
  for (let i=0;i<positions.length;i+=3) for (let a=0;a<3;a++) {
    result[a]![0]=Math.min(result[a]![0],positions[i+a]!);
    result[a]![1]=Math.max(result[a]![1],positions[i+a]!);
  }
  return result;
};

const partBounds = (built: ReturnType<Closet["coat"]>, id: string): [number,number][] => {
  const part=built.model.parts.find((p)=>p.id===id);
  assert.ok(part,`missing ${id}`);
  assert.equal(part.geometry.type,"mesh");
  if (part.geometry.type!=="mesh") throw new Error(`non-mesh ${id}`);
  return bounds(part.geometry.mesh.positions);
};

const near = (actual: number, expected: number): void => assert.ok(
  Math.abs(actual-expected)<1e-8,
  `${actual} differs from ${expected}`,
);
const expectBox = (actual: [number,number][], expected: readonly number[]): void =>
  actual.flat().forEach((value,i)=>near(value,expected[i]!));

void test("coat closet parts answer opening, track, wall contact, and recessed front bounds", () => {
  const built=new Closet().coat();
  assert.equal(built.model.id, "closet:coat");
  expectBox(
    partBounds(built, "rail/front/bottom"),
    [1.98, 2.01, 0, 0.01, -4.51, -3.56],
  );
  expectBox(
    partBounds(built, "rail/rear/top"),
    [1.94, 1.97, 2.12, 2.15, -4.51, -3.56],
  );
  expectBox(
    partBounds(built, "casing/head"),
    [2.02, 2.035, 2.15, 2.20, -4.56, -3.51],
  );
  expectBox(partBounds(built, "rod"), [1.41, 1.44, 1.635, 1.665, -4.56, -3.51]);
  expectBox(partBounds(built, "shelf"), [1.10, 1.75, 1.98, 2.00, -4.56, -3.51]);
  expectBox(
    partBounds(built, "door/front/handle-front-2"),
    [1.99, 2.01, 0.9875, 1.0125, -4.125, -4.025],
  );
  assert.equal(built.faceByPart["door/front/handle-front-2"], "handle");
  assert.equal(built.faceByPart["door/rear/leaf-panel-rear-1"], "leaf-panel");
  assert.ok(!Object.values(built.faceByPart).includes("glass" as never));
});

void test("coat sliding states remain in their separate depth bands", () => {
  const closet=new Closet(), closed=closet.coat(), open=closet.coat(0.45, 0.45);
  near(
    partBounds(open,"door/front/leaf-front")[2]![0]-partBounds(closed,"door/front/leaf-front")[2]![0],
    0.45,
  );
  near(
    partBounds(open,"door/rear/leaf-front")[2]![0]-partBounds(closed,"door/rear/leaf-front")[2]![0],
    -0.45,
  );
  near(partBounds(open,"door/front/leaf-front")[0]![1], 2.01);
  near(partBounds(open,"door/rear/leaf-front")[0]![1], 1.97);
  assert.throws(()=> closet.coat(0.45001), /outside reviewed range/);
  assert.throws(()=> closet.coat(0, -0.01), /outside reviewed range/);
  assert.throws(()=> closet.coat(0, 0, 1.97), /outside reviewed range/);
  expectBox(
    partBounds(closet.coat(0, 0, 1.99), "shelf"),
    [1.10, 1.75, 1.97, 1.99, -4.56, -3.51],
  );
});

void test("linen shelving and door tracks retain separate depth origins and floor-local height", () => {
  const built=new Closet().linen();
  assert.equal(built.model.id,"closet:linen");
  for (const [i,top] of [0.25,0.63,1.01,1.39,1.77].entries())
    expectBox(partBounds(built,`shelf/${i+1}`),[1.87,3.07,top-0.02,top,-3.21,-2.66]);
  expectBox(partBounds(built,"rail/front/bottom"),[1.97,2.97,0,0.01,-3.40,-3.37]);
  expectBox(partBounds(built,"rail/rear/top"),[1.97,2.97,2.17,2.20,-3.36,-3.33]);
  expectBox(partBounds(built,"casing/left"),[1.92,1.97,0,2.20,-3.425,-3.41]);
  expectBox(partBounds(built,"casing/head"),[1.92,3.02,2.20,2.25,-3.425,-3.41]);
  expectBox(partBounds(built,"door/front/handle-front-2"),[2.38,2.48,0.9875,1.0125,-3.40,-3.388]);
});

void test("linen door movement, bindings, geometry attributes, and byte order are stable", () => {
  const closet=new Closet(), closed=closet.linen(), moved=closet.linen(
    0.475,
    0.475,
  );
  near(
    partBounds(moved,"door/front/leaf-front")[0]![0]-partBounds(closed,"door/front/leaf-front")[0]![0],
    0.475,
  );
  near(
    partBounds(moved,"door/rear/leaf-front")[0]![0]-partBounds(closed,"door/rear/leaf-front")[0]![0],
    -0.475,
  );
  assert.throws(()=> closet.linen(0.476), /outside reviewed range/);
  assert.throws(()=> closet.linen(0, -0.001), /outside reviewed range/);
  assert.deepEqual(closet.linen(), closed);
  assert.equal(Object.keys(closed.faceByPart).length, closed.model.parts.length);
  assert.deepEqual(
    new Set(Object.values(closed.faceByPart)),
    new Set(["leaf", "leaf-panel", "rail", "shelf", "handle", "casing"]),
  );
  for (const part of closed.model.parts) {
    assert.equal(part.geometry.type, "mesh");
    if (part.geometry.type!=="mesh") throw new Error(`non-mesh ${part.id}`);
    const m=part.geometry.mesh;
    assert.ok(
      m.positions.length>0 && m.positions.every(Number.isFinite),
      part.id,
    );
    assert.equal(m.normals?.length, m.positions.length, part.id);
    assert.equal(m.uvs?.length, m.positions.length/3*2, part.id);
    assert.ok(m.uvs?.every(Number.isFinite), part.id);
    assert.ok(
      m.indices && m.indices.length%3===0 && m.indices.every((i)=>i>=0&&i<m.positions.length/3),
      part.id,
    );
    for (let i=0;i<m.indices!.length;i+=3) {
      const a=m.indices![i]!*3,b=m.indices![i+1]!*3,c=m.indices![i+2]!*3;
      const ab=[
        m.positions[b]!-m.positions[a]!,
        m.positions[b+1]!-m.positions[a+1]!,
        m.positions[b+2]!-m.positions[a+2]!,
      ];
      const ac=[
        m.positions[c]!-m.positions[a]!,
        m.positions[c+1]!-m.positions[a+1]!,
        m.positions[c+2]!-m.positions[a+2]!,
      ];
      const n=[
        ab[1]!*ac[2]!-ab[2]!*ac[1]!,
        ab[2]!*ac[0]!-ab[0]!*ac[2]!,
        ab[0]!*ac[1]!-ab[1]!*ac[0]!,
      ];
      const declared=[m.normals![a]!, m.normals![a+1]!, m.normals![a+2]!];
      assert.ok(
        n[0]!*declared[0]!+n[1]!*declared[1]!+n[2]!*declared[2]!>0,
        `${part.id} triangle ${i/3}`,
      );
    }
  }
});
