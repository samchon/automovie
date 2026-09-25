/** The two recessed jar seats are open holes in the board with inset solid floors. */
import type { IAutoMovieModel, IAutoMovieVector3 } from "@automovie/interface";

type Point = IAutoMovieVector3;
type Part = IAutoMovieModel["parts"][number];
type Buffer = { positions: number[]; indices: number[]; normals: number[]; uvs: number[] };
const point = (x: number, y: number, z: number): Point => ({ x, y, z });

export const jarRackBoardParts = (): [Part, Part] => {
  const buffers = new Map<string, Buffer>([
    ["top", { positions: [], indices: [], normals: [], uvs: [] }],
    ["well", { positions: [], indices: [], normals: [], uvs: [] }],
  ]);
  const face = (name: "top" | "well", vertices: Point[], normal: Point): void => {
    const buffer = buffers.get(name)!;
    const a = vertices[0]!, b = vertices[1]!, c = vertices[2]!;
    const ab = point(b.x-a.x, b.y-a.y, b.z-a.z);
    const ac = point(c.x-a.x, c.y-a.y, c.z-a.z);
    const cross = point(ab.y*ac.z-ab.z*ac.y, ab.z*ac.x-ab.x*ac.z, ab.x*ac.y-ab.y*ac.x);
    if (cross.x*normal.x + cross.y*normal.y + cross.z*normal.z < 0) vertices.reverse();
    const offset = buffer.positions.length / 3;
    for (const v of vertices) {
      buffer.positions.push(v.x, v.y, v.z);
      buffer.normals.push(normal.x, normal.y, normal.z);
      const uv = Math.abs(normal.y) > 0.5 ? [v.x, normal.y > 0 ? -v.z : v.z]
        : Math.abs(normal.x) > 0.5 ? [normal.x > 0 ? -v.z : v.z, v.y]
          : [normal.z > 0 ? v.x : -v.x, v.y];
      buffer.uvs.push(uv[0]!, uv[1]!);
    }
    for (let i = 1; i < vertices.length-1; ++i) buffer.indices.push(offset, offset+i, offset+i+1);
  };
  const bottom = 0.22, top = 0.28, recess = 0.268;
  const halfWidth = 0.59, halfDepth = 0.29, radius = 0.16;
  const edges = { west: [-halfDepth, halfDepth], east: [-halfDepth, halfDepth],
    north: [-halfWidth, halfWidth], south: [-halfWidth, halfWidth] };
  for (const [center, left, right] of [[-0.29, -halfWidth, 0], [0.29, 0, halfWidth]]) {
    const angles = [
      ...Array.from({ length: 32 }, (_, i) => 2*Math.PI*i/32),
      ...[left, right].flatMap((x) => [-halfDepth, halfDepth].map((z) => {
        const a = Math.atan2(z, x-center);
        return a < 0 ? a + 2*Math.PI : a;
      })),
    ].sort((a, b) => a-b).filter((a, i, all) => i === 0 || a-all[i-1]! > 1e-10);
    const outer = (angle: number): Point => {
      const dx = Math.cos(angle), dz = Math.sin(angle);
      const tx = dx > 1e-10 ? (right-center)/dx : dx < -1e-10 ? (left-center)/dx : Infinity;
      const tz = dz > 1e-10 ? halfDepth/dz : dz < -1e-10 ? -halfDepth/dz : Infinity;
      return tx < tz ? point(dx > 0 ? right : left, top, tx*dz)
        : point(center+tz*dx, top, dz > 0 ? halfDepth : -halfDepth);
    };
    const ring = (angle: number, y: number): Point => point(center+radius*Math.cos(angle), y, radius*Math.sin(angle));
    const outline = angles.map(outer);
    for (const v of outline) {
      if (Math.abs(v.x+halfWidth) < 1e-9) edges.west.push(v.z);
      if (Math.abs(v.x-halfWidth) < 1e-9) edges.east.push(v.z);
      if (Math.abs(v.z+halfDepth) < 1e-9) edges.north.push(v.x);
      if (Math.abs(v.z-halfDepth) < 1e-9) edges.south.push(v.x);
    }
    for (let i = 0; i < angles.length; ++i) {
      const next = (i+1) % angles.length;
      const a = angles[i]!, b = next === 0 ? angles[0]!+2*Math.PI : angles[next]!;
      const oa = outline[i]!, ob = outline[next]!;
      const mid = (a+b)/2;
      face("top", [ring(a,top), oa, ob, ring(b,top)], point(0,1,0));
      face("top", [ring(a,bottom), point(oa.x,bottom,oa.z), point(ob.x,bottom,ob.z), ring(b,bottom)], point(0,-1,0));
      face("top", [ring(a,bottom), ring(b,bottom), ring(b,top), ring(a,top)],
        point(-Math.cos(mid),0,-Math.sin(mid)));
      face("well", [ring(a,bottom), ring(b,bottom), ring(b,recess), ring(a,recess)],
        point(Math.cos(mid),0,Math.sin(mid)));
    }
    face("well", angles.map((angle) => ring(angle,bottom)), point(0,-1,0));
    face("well", angles.map((angle) => ring(angle,recess)), point(0,1,0));
  }
  for (const [side, values] of Object.entries(edges)) {
    const sorted = [...new Set(values.map((value) => Math.round(value*1e10)/1e10))].sort((a,b) => a-b);
    for (let i=0; i<sorted.length-1; ++i) {
      const a=sorted[i]!, b=sorted[i+1]!;
      if (side === "west" || side === "east") {
        const x = side === "west" ? -halfWidth : halfWidth;
        face("top", [point(x,bottom,a),point(x,bottom,b),point(x,top,b),point(x,top,a)],
          point(side === "west" ? -1 : 1,0,0));
      } else {
        const z = side === "north" ? -halfDepth : halfDepth;
        face("top", [point(a,bottom,z),point(b,bottom,z),point(b,top,z),point(a,top,z)],
          point(0,0,side === "north" ? -1 : 1));
      }
    }
  }
  const part = (id: "top" | "well"): Part => {
    const buffer = buffers.get(id)!;
    return { id, name: null, material: null, attachedBone: null, transform: null,
      geometry: { type: "mesh", mesh: { positions: buffer.positions, indices: buffer.indices,
        normals: buffer.normals, uvs: buffer.uvs, skin: null } } };
  };
  return [part("top"), part("well")];
};
