/** Deterministic metre-valued closed primitives for the reviewed fixed fittings. */
import type {
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMoviePropArticulation,
} from "@automovie/interface";

export type FittingPoint = readonly [number, number, number];
export type FittingBox = readonly [number, number, number, number, number, number];
export type FittingBuilt = { model: IAutoMovieModel; faceByPart: Readonly<Record<string, string>>; articulation?:IAutoMoviePropArticulation; reviewYaw?:number };
type UV = readonly [number, number];
type Quad = (vertices: readonly [FittingPoint,FittingPoint,FittingPoint,FittingPoint], normal: FittingPoint, uv?: readonly [UV,UV,UV,UV]) => void;
type Triangle = (vertices: readonly [FittingPoint,FittingPoint,FittingPoint], normal: FittingPoint, uv?: readonly [UV,UV,UV]) => void;
type Draw = (quad: Quad, triangle: Triangle) => void;
const sub = (a: FittingPoint,b: FittingPoint): FittingPoint => [
  a[0]-b[0],
  a[1]-b[1],
  a[2]-b[2],
];
const cross = (a: FittingPoint,b: FittingPoint): FittingPoint => [
  a[1]*b[2]-a[2]*b[1],
  a[2]*b[0]-a[0]*b[2],
  a[0]*b[1]-a[1]*b[0],
];
const dot = (a: FittingPoint,b: FittingPoint): number => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const project=(p:FittingPoint,n:FittingPoint):UV=>{
  const ax=Math.abs(n[0]),ay=Math.abs(n[1]),az=Math.abs(n[2]);
  return ay>=ax&&ay>=az ? [p[0],p[2]] : az>=ax ? [p[0],p[1]] : [p[2],p[1]];
};
const uvOf = (p: FittingPoint,n: FittingPoint,b: FittingBox): UV =>
  n[1]
    ? [p[0]-b[0], p[2]-b[4]]
    : n[2]
      ? [p[0]-b[0], p[1]-b[2]]
      : [p[2]-b[4], p[1]-b[2]];

/** One material face per part; callers keep geometry decisions in their model owner. */
export class FittingParts {
  private readonly parts: IAutoMovieModelPart[] = [];
  private readonly faces: Record<string,string> = {};

  public mesh(id: string,face: string,draw: Draw): void {
    const positions: number[] = [], normals: number[] = [], uvs: number[] = [], indices: number[] = [];
    const emit = (vertices: readonly FittingPoint[],normal: FittingPoint,uv: readonly UV[],triangles: readonly number[]): void => {
      const oriented = dot(cross(sub(vertices[1]!,vertices[0]!),sub(vertices[2]!,vertices[0]!)),normal)>0;
      const order = oriented
        ? vertices.map((_,i)=>i)
        : vertices.map((_,i)=>vertices.length-1-i);
      const start=positions.length/3;
      for (const i of order) {
        positions.push(...vertices[i]!);
        normals.push(...normal);
        uvs.push(...uv[i]!);
      }
      for (const i of triangles) indices.push(start+i);
    };
    const quad: Quad = (p,n,uv) => emit(
      p,
      n,
      uv??p.map((v)=>project(v,n)),
      [0, 1, 2, 0, 2, 3],
    );
    const triangle: Triangle = (p,n,uv) => emit(
      p,
      n,
      uv??p.map((v)=>project(v,n)),
      [0, 1, 2],
    );
    draw(quad,triangle);
    if (!positions.length || this.faces[id]!==undefined) throw new Error(
      `invalid fitting part: ${id}`,
    );
    const mesh: IAutoMovieMesh={ positions,normals,uvs,indices,skin:null };
    this.parts.push({
      id,
      name:id,
      geometry:{ type:"mesh", mesh },
      material:null,
      attachedBone:null,
      transform:null,
    });
    this.faces[id]=face;
  }

  public box(id: string,face: string,b: FittingBox,longAxis: 0|1|2=0): void {
    const [x0,x1,y0,y1,z0,z1]=b;
    if (![...b].every(Number.isFinite)||x1<=x0||y1<=y0||z1<=z0) throw new Error(
      `invalid fitting box: ${id}`,
    );
    this.mesh(id, face, (q)=>{
      const emit=(p: readonly [FittingPoint,FittingPoint,FittingPoint,FittingPoint],n:FittingPoint): void => {
        const uv=p.map((v): UV =>
          longAxis===1
            ? [v[1]-y0, n[0] ? v[2]-z0 : v[0]-x0]
            : longAxis===2
              ? [v[2]-z0, n[1] ? v[0]-x0 : v[1]-y0]
              : uvOf(v, n, b),
        );
        q(p, n, uv as [UV,UV,UV,UV]);
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

  public cylinder(id: string,face: string,axis:"x"|"y"|"z",start: FittingPoint,length:number,radius:number,sides=24): void {
    if (!(length>0&&radius>0&&sides>=3)) throw new Error(
      `invalid fitting cylinder: ${id}`,
    );
    const along=axis==="x"?0:axis==="y"?1:2;
    const radial=axis==="x"?[1,2]:axis==="y"?[0,2]:[0,1];
    const at=(t:number,a:number): FittingPoint => {
      const p=[...start];
      p[along]+=t;
      p[radial[0]!]+=radius*Math.cos(a);
      p[radial[1]!]+=radius*Math.sin(a);
      return p as unknown as FittingPoint;
    };
    const normal=(a:number): FittingPoint => {
      const p=[0,0,0];
      p[radial[0]!]=Math.cos(a);
      p[radial[1]!]=Math.sin(a);
      return p as unknown as FittingPoint;
    };
    const cap=(t:number): FittingPoint => {
      const p=[...start];
      p[along]+=t;
      return p as unknown as FittingPoint;
    };
    const capN=(sign:number): FittingPoint => {
      const p=[0, 0, 0];
      p[along]=sign;
      return p as unknown as FittingPoint;
    };
    this.mesh(id, face, (q,tri)=>{
      for(let i=0;i<sides;i++){
        const a=2*Math.PI*i/sides,b=2*Math.PI*(i+1)/sides;
        q([at(0, a), at(length, a), at(length, b), at(0, b)], normal((a+b)/2), [
          [0, a*radius],
          [length, a*radius],
          [length, b*radius],
          [0, b*radius],
        ]);
        tri([cap(0), at(0, b), at(0, a)], capN(-1), [
          [radius, radius],
          [radius+radius*Math.cos(b), radius+radius*Math.sin(b)],
          [radius+radius*Math.cos(a), radius+radius*Math.sin(a)],
        ]);
        tri([cap(length), at(length, a), at(length, b)], capN(1), [
          [radius, radius],
          [radius+radius*Math.cos(a), radius+radius*Math.sin(a)],
          [radius+radius*Math.cos(b), radius+radius*Math.sin(b)],
        ]);
      }
    });
  }

  /** A genuinely recessed front grip, with leaf rear/ends and separately bound pocket faces. */
  public recessedZDoor(id:string,b:FittingBox,slot:readonly [number,number,number,number],depth:number): void {
    const [x0,x1,y0,y1,z0,z1]=b,[sx0,sx1,sy0,sy1]=slot;
    if (!(x0<sx0&&sx0<sx1&&sx1<x1&&y0<sy0&&sy0<sy1&&sy1<y1&&depth>0&&depth<z1-z0))
      throw new Error(`invalid fitting recess: ${id}`);
    const xs=[x0,sx0,sx1,x1],ys=[y0,sy0,sy1,y1];
    this.mesh(`${id}/leaf`,"leaf",(q)=>{
      const front=(xa:number,xb:number,ya:number,yb:number):void=>
        q([[xa,ya,z1],[xb,ya,z1],[xb,yb,z1],[xa,yb,z1]],[0,0,1],[[xa-x0,ya-y0],[xb-x0,ya-y0],[xb-x0,yb-y0],[xa-x0,yb-y0]]);
      for(let i=0;i<3;i++)for(let j=0;j<3;j++){
        const xa=xs[i]!,xb=xs[i+1]!,ya=ys[j]!,yb=ys[j+1]!;
        if(i!==1||j!==1)front(xa,xb,ya,yb);
        q([[xa,ya,z0],[xb,ya,z0],[xb,yb,z0],[xa,yb,z0]],[0,0,-1]);
      }
      for(let i=0;i<3;i++){
        const xa=xs[i]!,xb=xs[i+1]!;
        q([[xa,y0,z0],[xb,y0,z0],[xb,y0,z1],[xa,y0,z1]],[0,-1,0]);
        q([[xa,y1,z0],[xb,y1,z0],[xb,y1,z1],[xa,y1,z1]],[0,1,0]);
      }
      for(let j=0;j<3;j++){
        const ya=ys[j]!,yb=ys[j+1]!;
        q([[x0,ya,z0],[x0,yb,z0],[x0,yb,z1],[x0,ya,z1]],[-1,0,0]);
        q([[x1,ya,z0],[x1,yb,z0],[x1,yb,z1],[x1,ya,z1]],[1,0,0]);
      }
    });
    const floor=z1-depth,w=sx1-sx0,h=sy1-sy0;
    this.mesh(`${id}/handle`, "handle", (q)=>{
      q(
        [
          [sx0, sy0, floor],
          [sx1, sy0, floor],
          [sx1, sy1, floor],
          [sx0, sy1, floor],
        ],
        [0, 0, 1],
        [
          [0, 0],
          [w, 0],
          [w, h],
          [0, h],
        ],
      );
      q(
        [
          [sx0, sy0, z1],
          [sx0, sy1, z1],
          [sx0, sy1, floor],
          [sx0, sy0, floor],
        ],
        [1, 0, 0],
        [
          [0, 0],
          [h, 0],
          [h, depth],
          [0, depth],
        ],
      );
      q(
        [
          [sx1, sy0, z1],
          [sx1, sy1, z1],
          [sx1, sy1, floor],
          [sx1, sy0, floor],
        ],
        [-1, 0, 0],
        [
          [0, 0],
          [h, 0],
          [h, depth],
          [0, depth],
        ],
      );
      q(
        [
          [sx0, sy0, z1],
          [sx1, sy0, z1],
          [sx1, sy0, floor],
          [sx0, sy0, floor],
        ],
        [0, 1, 0],
        [
          [0, 0],
          [w, 0],
          [w, depth],
          [0, depth],
        ],
      );
      q(
        [
          [sx0, sy1, z1],
          [sx1, sy1, z1],
          [sx1, sy1, floor],
          [sx0, sy1, floor],
        ],
        [0, -1, 0],
        [
          [0, 0],
          [w, 0],
          [w, depth],
          [0, depth],
        ],
      );
    });
  }

  public finish(id:string): FittingBuilt {
    return {
      model:{
        id:`fitting:${id}`,
        name:id,
        origin:"generated",
        parts:this.parts,
        skeleton:null,
        body:null,
        materials:[],
        asset:null,
      },
      faceByPart:this.faces,
    };
  }
}
