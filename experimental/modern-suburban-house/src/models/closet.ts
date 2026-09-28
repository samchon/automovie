/**
 * Coat and linen closet fittings from docs/models/05-closet-fittings.md.
 * Geometry is in the documented house XZ frame and floor-local Y metres; the
 * linen instance lifts this prototype by 3.06 m. The builder owns no finishes.
 */
import type {
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

type Face = "leaf" | "leaf-panel" | "rail" | "rod" | "shelf" | "handle" | "casing";
type Point = readonly [number, number, number];
type Box = readonly [number, number, number, number, number, number];
type Built = { model: IAutoMovieModel; faceByPart: Readonly<Record<string, Face>>;reviewYaw?:number };
type Slot = { u0: number; u1: number; y0: number; y1: number; inset: number; face: "leaf-panel" | "handle" };
type Frame = { point: (u: number, y: number, d: number) => Point; outward: Point };

const dot = (a: Point, b: Point): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const minus = (a: Point, b: Point): Point => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2],
];
const cross = (a: Point, b: Point): Point => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const negate = (a: Point): Point => [-a[0], -a[1], -a[2]];
const unique = (values: number[]): number[] => [...new Set(values)].sort(
  (a, b) => a - b,
);

class Assembly {
  readonly parts: IAutoMovieModelPart[] = [];
  readonly faceByPart: Record<string, Face> = {};

  mesh(id: string, face: Face, draw: (quad: (points: readonly [Point, Point, Point, Point], normal: Point, uv: readonly [number, number][]) => void,
    triangle: (points: readonly [Point, Point, Point], normal: Point, uv: readonly [number, number][]) => void) => void): void {
    const positions: number[] = [], normals: number[] = [], uvs: number[] = [], indices: number[] = [];
    const quad = (points: readonly [Point, Point, Point, Point], normal: Point, uv: readonly [number, number][]): void => {
      const oriented = dot(cross(minus(points[1], points[0]), minus(points[2], points[0])), normal) > 0;
      const order = oriented ? [0, 1, 2, 3] : [0, 3, 2, 1];
      const start = positions.length / 3;
      for (const i of order) {
        positions.push(...points[i]!);
        normals.push(...normal);
        uvs.push(...uv[i]!);
      }
      indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
    };
    const triangle = (points: readonly [Point, Point, Point], normal: Point, uv: readonly [number, number][]): void => {
      const oriented = dot(cross(minus(points[1], points[0]), minus(points[2], points[0])), normal) > 0;
      const order = oriented ? [0,1,2] : [0,2,1];
      const start = positions.length / 3;
      for (const i of order) {
        positions.push(...points[i]!);
        normals.push(...normal);
        uvs.push(...uv[i]!);
      }
      indices.push(start,start+1,start+2);
    };
    draw(quad, triangle);
    if (!positions.length) throw new Error(`empty closet part: ${id}`);
    if (this.faceByPart[id] !== undefined) throw new Error(
      `duplicate closet part: ${id}`,
    );
    const mesh: IAutoMovieMesh = {
      positions,
      normals,
      uvs,
      indices,
      skin: null,
    };
    this.parts.push({
      id,
      name: id,
      geometry: { type: "mesh", mesh },
      material: null,
      attachedBone: null,
      transform: null,
    });
    this.faceByPart[id] = face;
  }

  box(id: string, face: Face, b: Box, longAxis: 0 | 1 | 2 = 0): void {
    const [x0, x1, y0, y1, z0, z1] = b;
    if (![...b].every(Number.isFinite) || x1 <= x0 || y1 <= y0 || z1 <= z0) throw new Error(
      `invalid closet box: ${id}`,
    );
    this.mesh(id, face, (q) => {
      const emit = (p: readonly [Point, Point, Point, Point], n: Point): void => {
        const uv = p.map((v): [number, number] => {
          if (longAxis === 1) return [v[1] - y0, n[0] ? v[2] - z0 : v[0] - x0];
          if (longAxis === 2) return [v[2] - z0, n[1] ? v[0] - x0 : v[1] - y0];
          return [v[0] - x0, n[1] ? v[2] - z0 : v[1] - y0];
        });
        q(p, n, uv);
      };
      emit(
        [
          [x0, y0, z1],
          [x1, y0, z1],
          [x1, y1, z1],
          [x0, y1, z1],
        ],
        [0, 0, 1],
      );
      emit(
        [
          [x1, y0, z0],
          [x0, y0, z0],
          [x0, y1, z0],
          [x1, y1, z0],
        ],
        [0, 0, -1],
      );
      emit(
        [
          [x1, y0, z1],
          [x1, y0, z0],
          [x1, y1, z0],
          [x1, y1, z1],
        ],
        [1, 0, 0],
      );
      emit(
        [
          [x0, y0, z0],
          [x0, y0, z1],
          [x0, y1, z1],
          [x0, y1, z0],
        ],
        [-1, 0, 0],
      );
      emit(
        [
          [x0, y1, z1],
          [x1, y1, z1],
          [x1, y1, z0],
          [x0, y1, z0],
        ],
        [0, 1, 0],
      );
      emit(
        [
          [x0, y0, z0],
          [x1, y0, z0],
          [x1, y0, z1],
          [x0, y0, z1],
        ],
        [0, -1, 0],
      );
    });
  }

  rod(id: string, x: number, y: number, z0: number, z1: number): void {
    const radius = 0.015, sides = 24;
    this.mesh(id, "rod", (q,t) => {
      for (let i = 0; i < sides; i++) {
        const a = 2 * Math.PI * i / sides, b = 2 * Math.PI * (i + 1) / sides;
        const pa = (z: number): Point => [
          x + radius * Math.cos(a),
          y + radius * Math.sin(a),
          z,
        ];
        const pb = (z: number): Point => [
          x + radius * Math.cos(b),
          y + radius * Math.sin(b),
          z,
        ];
        const n: Point = [Math.cos((a+b)/2), Math.sin((a+b)/2), 0];
        q([pa(z0), pa(z1), pb(z1), pb(z0)], n, [
          [0, a*radius],
          [z1-z0, a*radius],
          [z1-z0, b*radius],
          [0, b*radius],
        ]);
        t(
          [[x, y, z0], pb(z0), pa(z0)],
          [0, 0, -1],
          [
            [radius, radius],
            [radius+radius*Math.cos(b), radius+radius*Math.sin(b)],
            [radius+radius*Math.cos(a), radius+radius*Math.sin(a)],
          ],
        );
        t(
          [[x, y, z1], pa(z1), pb(z1)],
          [0, 0, 1],
          [
            [radius, radius],
            [radius+radius*Math.cos(a), radius+radius*Math.sin(a)],
            [radius+radius*Math.cos(b), radius+radius*Math.sin(b)],
          ],
        );
      }
    });
  }

  leaf(id: string, frame: Frame, width: number, height: number, rear: number, front: number, handleU: number, handleDepth: number): void {
    const p=frame.point, axis=frame.outward, udir=minus(p(1,0,0),p(0,0,0));
    const panels: Slot[]=[
      {u0:0.12,u1:width-0.12,y0:0.18,y1:0.86,inset:0.008,face:"leaf-panel"},
      {u0:0.12,u1:width-0.12,y0:0.98,y1:1.98,inset:0.008,face:"leaf-panel"},
    ];
    const handle: Slot={u0:handleU-0.05,u1:handleU+0.05,y0:0.9875,y1:1.0125,inset:handleDepth,face:"handle"};
    const all=[...panels,handle];
    const us=unique([0,width,...all.flatMap(s=>[s.u0,s.u1])]);
    const ys=unique([0.01,height+0.01,...all.flatMap(s=>[s.y0,s.y1])]);
    const inside=(a:number,b:number,lo:number,hi:number):boolean=>a>=lo-1e-9&&b<=hi+1e-9;
    const flat=(u0:number,u1:number,y0:number,y1:number,d:number,n:Point,
      q:(points:readonly [Point,Point,Point,Point],normal:Point,uv:readonly [number,number][])=>void,
      originU=0,originY=0.01):void=>
      q([p(u0,y0,d),p(u1,y0,d),p(u1,y1,d),p(u0,y1,d)],n,
        [[u0-originU,y0-originY],[u1-originU,y0-originY],[u1-originU,y1-originY],[u0-originU,y1-originY]]);
    const shell=(side:"front"|"rear",slots:Slot[],d:number,n:Point):void=>{
      this.mesh(`${id}/leaf-${side}`,"leaf",(q)=>{
        for(let i=0;i<us.length-1;i++)for(let j=0;j<ys.length-1;j++){
          const u0=us[i]!,u1=us[i+1]!,y0=ys[j]!,y1=ys[j+1]!;
          if(slots.some(s=>inside(u0,u1,s.u0,s.u1)&&inside(y0,y1,s.y0,s.y1)))continue;
          flat(u0,u1,y0,y1,d,n,q);
        }
        if(side==="front"){
          for(let i=0;i<us.length-1;i++){
            const a=us[i]!,b=us[i+1]!;
            q([p(a,0.01,rear),p(b,0.01,rear),p(b,0.01,front),p(a,0.01,front)],[0,-1,0],[[a,0],[b,0],[b,front-rear],[a,front-rear]]);
            q([p(a,height+0.01,rear),p(b,height+0.01,rear),p(b,height+0.01,front),p(a,height+0.01,front)],[0,1,0],[[a,0],[b,0],[b,front-rear],[a,front-rear]]);
          }
          for(let j=0;j<ys.length-1;j++){
            const a=ys[j]!,b=ys[j+1]!;
            q([p(0,a,rear),p(0,b,rear),p(0,b,front),p(0,a,front)],negate(udir),[[a-0.01,0],[b-0.01,0],[b-0.01,front-rear],[a-0.01,front-rear]]);
            q([p(width,a,rear),p(width,b,rear),p(width,b,front),p(width,a,front)],udir,[[a-0.01,0],[b-0.01,0],[b-0.01,front-rear],[a-0.01,front-rear]]);
          }
        }
      });
    };
    shell("front",all,front,axis);
    shell("rear",panels,rear,negate(axis));
    for(const side of ["front","rear"] as const)for(const [index,s] of [...panels,...(side==="front"?[handle]:[])].entries()){
      const outer=side==="front"?front:rear,inner=side==="front"?front-s.inset:rear+s.inset;
      this.mesh(`${id}/${s.face}-${side}-${index}`,s.face,(q)=>{
        for(let i=0;i<us.length-1;i++)for(let j=0;j<ys.length-1;j++){
          const u0=us[i]!,u1=us[i+1]!,y0=ys[j]!,y1=ys[j+1]!;
          if(inside(u0,u1,s.u0,s.u1)&&inside(y0,y1,s.y0,s.y1))
            flat(u0,u1,y0,y1,inner,side==="front"?axis:negate(axis),q,s.face==="handle"?s.u0:0,s.face==="handle"?s.y0:0.01);
        }
        for(let j=0;j<ys.length-1;j++){
          const y0=ys[j]!,y1=ys[j+1]!;
          if(!inside(y0,y1,s.y0,s.y1))continue;
          q([p(s.u0,y0,outer),p(s.u0,y1,outer),p(s.u0,y1,inner),p(s.u0,y0,inner)],udir,[[y0-s.y0,0],[y1-s.y0,0],[y1-s.y0,s.inset],[y0-s.y0,s.inset]]);
          q([p(s.u1,y0,outer),p(s.u1,y1,outer),p(s.u1,y1,inner),p(s.u1,y0,inner)],negate(udir),[[y0-s.y0,0],[y1-s.y0,0],[y1-s.y0,s.inset],[y0-s.y0,s.inset]]);
        }
        for(let i=0;i<us.length-1;i++){
          const u0=us[i]!,u1=us[i+1]!;
          if(!inside(u0,u1,s.u0,s.u1))continue;
          q([p(u0,s.y0,outer),p(u1,s.y0,outer),p(u1,s.y0,inner),p(u0,s.y0,inner)],[0,1,0],[[u0-s.u0,0],[u1-s.u0,0],[u1-s.u0,s.inset],[u0-s.u0,s.inset]]);
          q([p(u0,s.y1,outer),p(u1,s.y1,outer),p(u1,s.y1,inner),p(u0,s.y1,inner)],[0,-1,0],[[u0-s.u0,0],[u1-s.u0,0],[u1-s.u0,s.inset],[u0-s.u0,s.inset]]);
        }
      });
    }
  }

  finish(id: string): Built {
    return {
      model: {
        id: `closet:${id}`,
        name: id,
        origin: "generated",
        parts: this.parts,
        skeleton: null,
        body: null,
        materials: [],
        asset: null,
      },
      faceByPart: this.faceByPart,
    };
  }
}

/** The two reviewed fixed closet fitting prototypes with bounded sliding states. */
export class Closet {
  /** Build coat doors, rails, casing, rod and stair-limited shelf at floor Y=0. */
  public coat(frontTravel = 0, rearTravel = 0, stairUnderside = 2): Built {
    if (![frontTravel,rearTravel,stairUnderside].every(Number.isFinite) || frontTravel<0 || frontTravel>0.45 || rearTravel<0 || rearTravel>0.45 || stairUnderside<1.98 || stairUnderside>2)
      throw new Error(
        "coat closet travel or stair underside outside reviewed range",
      );
    const a=new Assembly();
    for (const [name,x0,x1] of [
      ["front", 1.98, 2.01],
      ["rear", 1.94, 1.97],
    ] as const) {
      a.box(`rail/${name}/bottom`,"rail",[x0,x1,0,0.01,-4.51,-3.56],2);
      a.box(`rail/${name}/top`,"rail",[x0,x1,2.12,2.15,-4.51,-3.56],2);
    }
    a.leaf(
      "door/front",
      { point:(u,y,d)=>[1.87+d, y, -4.51+frontTravel+u], outward:[1, 0, 0] },
      0.50,
      2.11,
      0.11,
      0.14,
      0.435,
      0.02,
    );
    a.leaf(
      "door/rear",
      { point:(u,y,d)=>[1.87+d, y, -4.06-rearTravel+u], outward:[1, 0, 0] },
      0.50,
      2.11,
      0.07,
      0.10,
      0.065,
      0.02,
    );
    a.box("casing/left","casing",[2.02,2.035,0,2.15,-4.56,-4.51],1);
    a.box("casing/right","casing",[2.02,2.035,0,2.15,-3.56,-3.51],1);
    a.box("casing/head","casing",[2.02,2.035,2.15,2.20,-4.56,-3.51],2);
    a.rod("rod",1.425,1.65,-4.56,-3.51);
    a.box("shelf", "shelf", [
      1.10,
      1.75,
      Math.min(1.98, stairUnderside-0.02),
      stairUnderside,
      -4.56,
      -3.51,
    ]);
    return {...a.finish("coat"),reviewYaw:-Math.PI/2};
  }

  /** Build linen doors, five shelves, rails and casing at upper floor local Y=0. */
  public linen(frontTravel = 0, rearTravel = 0): Built {
    if (![frontTravel,rearTravel].every(Number.isFinite) || frontTravel<0 || frontTravel>0.475 || rearTravel<0 || rearTravel>0.475)
      throw new Error("linen closet travel outside reviewed range");
    const a=new Assembly();
    for (const [name,z0,z1] of [
      ["front", -3.40, -3.37],
      ["rear", -3.36, -3.33],
    ] as const) {
      a.box(`rail/${name}/bottom`,"rail",[1.97,2.97,0,0.01,z0,z1]);
      a.box(`rail/${name}/top`,"rail",[1.97,2.97,2.17,2.20,z0,z1]);
    }
    a.leaf(
      "door/front",
      { point:(u,y,d)=>[1.97+frontTravel+u, y, -3.26-d], outward:[0, 0, -1] },
      0.525,
      2.16,
      0.11,
      0.14,
      0.46,
      0.012,
    );
    a.leaf(
      "door/rear",
      { point:(u,y,d)=>[2.445-rearTravel+u, y, -3.26-d], outward:[0, 0, -1] },
      0.525,
      2.16,
      0.07,
      0.10,
      0.065,
      0.012,
    );
    for (const [i,top] of [0.25,0.63,1.01,1.39,1.77].entries())
      a.box(`shelf/${i+1}`,"shelf",[1.87,3.07,top-0.02,top,-3.21,-2.66]);
    a.box("casing/left","casing",[1.92,1.97,0,2.20,-3.425,-3.41],1);
    a.box("casing/right","casing",[2.97,3.02,0,2.20,-3.425,-3.41],1);
    a.box("casing/head","casing",[1.92,3.02,2.20,2.25,-3.425,-3.41]);
    return {...a.finish("linen"),reviewYaw:Math.PI};
  }
}
