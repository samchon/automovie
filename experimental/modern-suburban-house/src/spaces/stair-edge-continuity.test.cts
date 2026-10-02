/** A stairwell-facing edge must have one continuous surface between storeys. */
require(require.resolve("tsx/cjs"));
import test from "node:test";
import assert from "node:assert/strict";
import { buildHouse } from "./house";
import { STAIR_OPENING } from "./stair";
import { STOREYS } from "./storeys";

const EPS = 1e-6;
const edges: Array<[string, number, number, number, [number, number]]> = [
  ["west", 0, STAIR_OPENING.west, 2, [STAIR_OPENING.back, STAIR_OPENING.front]],
  [
    "east",
    0,
    STAIR_OPENING.turnX,
    2,
    [STAIR_OPENING.turnZ, STAIR_OPENING.front],
  ],
  [
    "front",
    2,
    STAIR_OPENING.turnZ,
    0,
    [STAIR_OPENING.turnX, STAIR_OPENING.east],
  ],
  ["back", 2, STAIR_OPENING.back, 0, [STAIR_OPENING.west, STAIR_OPENING.east]],
  [
    "arrival",
    0,
    STAIR_OPENING.east,
    2,
    [STAIR_OPENING.back, STAIR_OPENING.turnZ],
  ],
];

function contains(a: number[], b: number[], c: number[], s: number, y: number, axis: number) {
  const ax=a[axis], bx=b[axis], cx=c[axis];
  const ay=a[1], by=b[1], cy=c[1];
  const d=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);
  if (Math.abs(d)<EPS) return false;
  const u=((by-cy)*(s-cx)+(cx-bx)*(y-cy))/d;
  const v=((cy-ay)*(s-cx)+(ax-cx)*(y-cy))/d;
  return u>=-EPS && v>=-EPS && u+v<=1+EPS;
}

function scan(house: ReturnType<typeof buildHouse>) {
    const missing: string[]=[];
  let samples=0;
  for (const [name, fixedAxis, fixed, alongAxis, [start,end]] of edges) {
        const faces: Array<{ a:number[];b:number[];c:number[];lo:number;hi:number;yl:number;yh:number }>=[];
    for (const part of house.parts) {
      const p=part.mesh.positions, ids=part.mesh.indices ?? [];
      for (let t=0;t<ids.length;t+=3) {
        const a=[p[3*ids[t]],p[3*ids[t]+1],p[3*ids[t]+2]];
        const b=[p[3*ids[t+1]],p[3*ids[t+1]+1],p[3*ids[t+1]+2]];
        const c=[p[3*ids[t+2]],p[3*ids[t+2]+1],p[3*ids[t+2]+2]];
        if (Math.max(Math.abs(a[fixedAxis]-fixed),Math.abs(b[fixedAxis]-fixed),Math.abs(c[fixedAxis]-fixed))>EPS) continue;
        faces.push({
          a,
          b,
          c,
          lo:Math.min(a[alongAxis], b[alongAxis], c[alongAxis]),
          hi:Math.max(a[alongAxis], b[alongAxis], c[alongAxis]),
          yl:Math.min(a[1], b[1], c[1]),
          yh:Math.max(a[1], b[1], c[1]),
        });
      }
    }
    for (let s=start+0.025;s<end-EPS;s+=0.05) {
      for (let y=STOREYS.groundCeiling+0.00125;y<STOREYS.upperFloor-EPS;y+=0.0025) {
        samples++;
        if (faces.some(
          (f)=>s>=f.lo-EPS&&s<=f.hi+EPS&&y>=f.yl-EPS&&y<=f.yh+EPS&&contains(f.a,f.b,f.c,s,y,alongAxis),
        )) continue;
        if (missing.length<12) missing.push(
          `${name} s=${s.toFixed(3)} y=${y.toFixed(4)}`,
        );
      }
    }
  }
  return { samples,missing };
}

void test("every stair opening edge has a continuous face between storeys", () => {
  const result=scan(buildHouse());
  assert.deepEqual(
    result.missing,
    [],
    `${result.samples} vertical edge samples: ${result.missing.join(", ")}`,
  );
});

void test("raising a side edge or shortening the front corner makes the continuity gate red", () => {
    const mutations: Array<[string, (y:number)=>boolean, number]> = [
    ["stair-opening-edge-east",(y)=>y<2.8,0.03],
    ["stair-opening-edge-front-linen",(y)=>y>3.02,-0.03],
  ];
  for (const [id,selector,delta] of mutations) {
    const house=buildHouse();
    const part=house.parts.find((p)=>p.id===id);
    assert.ok(part,id);
    const positions=part.mesh.positions;
    for (let i=1;i<positions.length;i+=3) if (selector(positions[i])) positions[i]+=delta;
    assert.ok(scan(house).missing.length>0,`${id} mutation escaped vertical continuity`);
  }
});
