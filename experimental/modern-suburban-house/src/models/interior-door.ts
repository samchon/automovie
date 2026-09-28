/**
 * Eleven interior-door filling variants in the opening-local, Y-up metre frame.
 * The wall cut, floor transition, world placement and finishes have other owners;
 * this source realizes docs/models/03-interior-doors.md alone.
 */
import type {
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

type Point = readonly [number, number, number];
type Box = readonly [number, number, number, number, number, number];
type Surface = "jamb-a" | "jamb-b" | "jamb-core" | "casing-a" | "casing-b" |
  "leaf" | "leaf-panel" | "handle" | "hinge";
type Side = "low" | "high";
type DoorInput = { id: string; width: number; wallThickness: number; angle?: number };
type DoorBuilt = { model: IAutoMovieModel; faceByPart: Readonly<Record<string, Surface>>;
  hingePivot: Point; angle: number; clearWidth: number
};

const DOORS = {
  "hall-bedroom-three-door": { side: "high", handle: "knob", width: 0.95 },
  "hall-bedroom-two-door": { side: "high", handle: "knob", width: 1 },
  "service-laundry-door": { side: "high", handle: "recess", width: 1.05 },
  "entry-living-door": { side: "low", handle: "knob", width: 1 },
  "service-pantry-door": { side: "low", handle: "recess", width: 0.95 },
  "service-powder-door": { side: "high", handle: "knob", width: 0.95 },
  "hall-primary-door": { side: "high", handle: "knob", width: 1 },
  "hall-shower-door": { side: "high", handle: "knob", width: 1 },
  "hall-tub-door": { side: "low", handle: "knob", width: 1 },
  "primary-wardrobe-door": { side: "low", handle: "small-knob", width: 1 },
  "laundry-garage-door": { side: "low", handle: "recess", width: 1.05 },
} as const satisfies Record<string, { side: Side; handle: "knob" | "recess" | "small-knob"; width: number }>;

const HINGES = [0.21, 1.06, 1.91] as const;
const HINGE_R = 0.009;
const HINGE_HALF = 0.04;
const SEGMENTS = 16;
const EPS = 1e-10;

const mesh = (): IAutoMovieMesh => ({
  positions: [],
  normals: [],
  uvs: [],
  indices: [],
  skin: null,
});
const minus = (a: Point, b: Point): Point => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
const cross = (a: Point, b: Point): Point => [
  a[1]*b[2]-a[2]*b[1],
  a[2]*b[0]-a[0]*b[2],
  a[0]*b[1]-a[1]*b[0],
];
const dot = (a: Point, b: Point): number => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const length = (a: Point): number => Math.hypot(...a);

/** One material face per part, with independent flat normals and metre UVs. */
class Faces {
  public readonly parts: IAutoMovieModelPart[] = [];
  public readonly faceByPart: Record<string, Surface> = {};
  private readonly byName = new Map<string, IAutoMovieMesh>();

  private get(name: string, surface: Surface): IAutoMovieMesh {
    const existing = this.byName.get(name);
    if (existing) {
      if (this.faceByPart[name] !== surface) throw new Error(
        `conflicting door surface: ${name}`,
      );
      return existing;
    }
    const created = mesh();
    this.byName.set(name, created);
    this.faceByPart[name] = surface;
    this.parts.push({
      id: name,
      name,
      geometry: { type: "mesh", mesh: created },
      material: null,
      attachedBone: null,
      transform: null,
    });
    return created;
  }

  public quad(name: string, surface: Surface, a: Point, b: Point, c: Point, d: Point,
    toward: Point, metric?: readonly (readonly [number,number])[]): void {
    const forward=dot(cross(minus(b,a), minus(d,a)), toward)>0;
    const corners = forward ? [a,b,c,d] : [a,d,c,b];
    const u = length(minus(corners[1]!, corners[0]!));
    const v = length(minus(corners[3]!, corners[0]!));
    if (!(u > EPS && v > EPS)) throw new Error(`degenerate door face: ${name}`);
    const raw = cross(
      minus(corners[1]!, corners[0]!),
      minus(corners[3]!, corners[0]!),
    );
    const n = length(raw);
    const normal: Point = [raw[0]/n, raw[1]/n, raw[2]/n];
    const target = this.get(name, surface);
    const start = target.positions.length/3;
    for (const [i,p] of corners.entries()) {
      target.positions.push(...p);
      target.normals!.push(...normal);
      const sourceIndex=forward ? i : [0,3,2,1][i]!;
      const mapped=metric?.[sourceIndex];
      target.uvs!.push(
        mapped?.[0] ?? (i===1 || i===2 ? u : 0),
        mapped?.[1] ?? (i>=2 ? v : 0),
      );
    }
    target.indices!.push(start,start+1,start+2,start,start+2,start+3);
  }

  public triangle(name:string,surface:Surface,a:Point,b:Point,c:Point,toward:Point,
    metric?:readonly (readonly [number,number])[]):void {
    const forward=dot(cross(minus(b,a),minus(c,a)),toward)>0;
    const corners=forward ? [a,b,c] : [a,c,b];
    const u=length(minus(corners[1]!,corners[0]!));
    const v=length(minus(corners[2]!,corners[0]!));
    if(!(u>EPS && v>EPS)) throw new Error(`degenerate door triangle: ${name}`);
    const raw=cross(
      minus(corners[1]!, corners[0]!),
      minus(corners[2]!, corners[0]!),
    );
    const n=length(raw),normal:Point=[raw[0]/n,raw[1]/n,raw[2]/n];
    const target=this.get(name,surface),start=target.positions.length/3;
    for(const [i,p] of corners.entries()) {
      target.positions.push(...p);
      target.normals!.push(...normal);
      const sourceIndex=forward ? i : [0,2,1][i]!;
      const mapped=metric?.[sourceIndex];
      target.uvs!.push(
        mapped?.[0] ?? (i===1 ? u : 0),
        mapped?.[1] ?? (i===2 ? v : 0),
      );
    }
    target.indices!.push(start,start+1,start+2);
  }

  public box(name: string, surface: Surface, [x0,x1,y0,y1,z0,z1]: Box,
    vertical=false): void {
    if (![x0,x1,y0,y1,z0,z1].every(Number.isFinite) || x1<=x0 || y1<=y0 || z1<=z0)
      throw new Error(`invalid door bounds: ${name}`);
    const xy=(p:Point):readonly[number,number]=>[p[1]-y0,p[0]-x0];
    const zy=(p:Point):readonly[number,number]=>[p[1]-y0,p[2]-z0];
    const map=(points:readonly Point[],project:(p:Point)=>readonly[number,number])=>
      vertical ? points.map(project):undefined;
    const front:Point[]=[
      [x0, y0, z1],
      [x1, y0, z1],
      [x1, y1, z1],
      [x0, y1, z1],
    ];
    const back:Point[]=[
      [x1, y0, z0],
      [x0, y0, z0],
      [x0, y1, z0],
      [x1, y1, z0],
    ];
    const right:Point[]=[
      [x1, y0, z1],
      [x1, y0, z0],
      [x1, y1, z0],
      [x1, y1, z1],
    ];
    const left:Point[]=[
      [x0, y0, z0],
      [x0, y0, z1],
      [x0, y1, z1],
      [x0, y1, z0],
    ];
    this.quad(
      name,
      surface,
      front[0]!,
      front[1]!,
      front[2]!,
      front[3]!,
      [0, 0, 1],
      map(front, xy),
    );
    this.quad(
      name,
      surface,
      back[0]!,
      back[1]!,
      back[2]!,
      back[3]!,
      [0, 0, -1],
      map(back, xy),
    );
    this.quad(
      name,
      surface,
      right[0]!,
      right[1]!,
      right[2]!,
      right[3]!,
      [1, 0, 0],
      map(right, zy),
    );
    this.quad(
      name,
      surface,
      left[0]!,
      left[1]!,
      left[2]!,
      left[3]!,
      [-1, 0, 0],
      map(left, zy),
    );
    this.quad(name,surface,[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],[0,1,0]);
    this.quad(
      name,
      surface,
      [x0, y0, z0],
      [x1, y0, z0],
      [x1, y0, z1],
      [x0, y0, z1],
      [0, -1, 0],
    );
  }

  /** Cylinder along Y; UV U is physical circumferential arc and V is height. */
  public hinge(name: string, x: number, z: number, y0: number, y1: number): void {
    const r = HINGE_R;
    for (let i=0;i<SEGMENTS;i++) {
      const a=2*Math.PI*i/SEGMENTS, b=2*Math.PI*(i+1)/SEGMENTS;
      const p=(t:number,y:number):Point=>[x+r*Math.sin(t),y,z+r*Math.cos(t)];
      this.quad(
        name,
        "hinge",
        p(a, y0),
        p(b, y0),
        p(b, y1),
        p(a, y1),
        [Math.sin((a+b)/2), 0, Math.cos((a+b)/2)],
        [
          [r*a, 0],
          [r*b, 0],
          [r*b, y1-y0],
          [r*a, y1-y0],
        ],
      );
      this.triangle(
        name,
        "hinge",
        [x, y1, z],
        p(a, y1),
        p(b, y1),
        [0, 1, 0],
        [
          [0, 0],
          [r*Math.sin(a), r*Math.cos(a)],
          [r*Math.sin(b), r*Math.cos(b)],
        ],
      );
      this.triangle(
        name,
        "hinge",
        [x, y0, z],
        p(b, y0),
        p(a, y0),
        [0, -1, 0],
        [
          [0, 0],
          [r*Math.sin(b), r*Math.cos(b)],
          [r*Math.sin(a), r*Math.cos(a)],
        ],
      );
    }
  }

  /** Plate, round knob, or a cavity cut into the leaf surface. */
  public round(name: string, cx: number, cy: number, faceZ: number,
    radius: number, depth: number, kind: "plate" | "recess" | "knob"): void {
    const outward = faceZ >= -0.02 ? 1 : -1;
    const z1 = faceZ + (kind==="recess" ? -outward : outward)*depth;
    for (let i=0;i<SEGMENTS;i++) {
      const a=2*Math.PI*i/SEGMENTS, b=2*Math.PI*(i+1)/SEGMENTS;
      const p=(t:number,z:number):Point=>[
        cx+radius*Math.cos(t),
        cy+radius*Math.sin(t),
        z,
      ];
      const radial:Point=[Math.cos((a+b)/2),Math.sin((a+b)/2),0];
      this.quad(
        name,
        "handle",
        p(a, faceZ),
        p(b, faceZ),
        p(b, z1),
        p(a, z1),
        kind==="recess" ? [-radial[0], -radial[1], 0] : radial,
        [
          [radius*a, 0],
          [radius*b, 0],
          [radius*b, depth],
          [radius*a, depth],
        ],
      );
      this.triangle(
        name,
        "handle",
        [cx, cy, z1],
        p(a, z1),
        p(b, z1),
        [0, 0, outward],
        [
          [0, 0],
          [radius*Math.cos(a), radius*Math.sin(a)],
          [radius*Math.cos(b), radius*Math.sin(b)],
        ],
      );
    }
  }

  public sphere(name: string, cx:number, cy:number, cz:number, radius:number):void {
    for(let row=0;row<8;row++) for(let col=0;col<SEGMENTS;col++) {
      const a=Math.PI*row/8,b=Math.PI*(row+1)/8;
      const u=2*Math.PI*col/SEGMENTS,v=2*Math.PI*(col+1)/SEGMENTS;
      const p=(t:number,s:number):Point=>[
        cx+radius*Math.sin(t)*Math.cos(s),
        cy+radius*Math.cos(t),
        cz+radius*Math.sin(t)*Math.sin(s),
      ];
      const mid=p((a+b)/2,(u+v)/2);
      const uv=(t:number,s:number):readonly[number,number]=>
        [radius*Math.sin(t)*s,radius*t];
      if(row===0) this.triangle(
        name,
        "handle",
        p(a, u),
        p(b, v),
        p(b, u),
        minus(mid, [cx, cy, cz]),
        [uv(a, u), uv(b, v), uv(b, u)],
      );
      else if(row===7) this.triangle(
        name,
        "handle",
        p(a, u),
        p(a, v),
        p(b, u),
        minus(mid, [cx, cy, cz]),
        [uv(a, u), uv(a, v), uv(b, u)],
      );
      else this.quad(
        name,
        "handle",
        p(a, u),
        p(a, v),
        p(b, v),
        p(b, u),
        minus(mid, [cx, cy, cz]),
        [uv(a, u), uv(a, v), uv(b, v), uv(b, u)],
      );
    }
  }

  public rotate(prefixes: readonly string[], pivot: Point, angle: number): void {
    const c=Math.cos(angle),s=Math.sin(angle);
    for(const part of this.parts) {
      if(!prefixes.some((prefix)=>part.id.startsWith(prefix))) continue;
      if(part.geometry.type!=="mesh") throw new Error(
        `door part has no mesh: ${part.id}`,
      );
      const m=part.geometry.mesh;
      for(let i=0;i<m.positions.length;i+=3) {
        const dx=m.positions[i]!-pivot[0], dz=m.positions[i+2]!-pivot[2];
        m.positions[i]=pivot[0]+c*dx+s*dz;
        m.positions[i+2]=pivot[2]-s*dx+c*dz;
        const nx=m.normals![i]!,nz=m.normals![i+2]!;
        m.normals![i]=c*nx+s*nz;
        m.normals![i+2]=-s*nx+c*nz;
      }
    }
  }
}

/** Eleven bounded fillings derived from docs/models/03-interior-doors.md. */
export class InteriorDoor {
  /** Build the reviewed door member hierarchy as separately bound mesh faces. */
  public build(input: DoorInput): DoorBuilt {
    const config=DOORS[input.id as keyof typeof DOORS];
    if(!config) throw new Error(`unknown interior door: ${input.id}`);
    const { width:w, wallThickness:t }=input;
    if(!Number.isFinite(w) || Math.abs(w-config.width)>1e-7)
      throw new Error(`unsupported interior opening width: ${input.id}`);
    const expectedT=input.id==="laundry-garage-door" ? 0.25 : 0.15;
    if(!Number.isFinite(t) || Math.abs(t-expectedT)>1e-7)
      throw new Error(`incorrect interior wall thickness: ${input.id}`);
    const angle=input.angle??Math.PI/2;
    if(!Number.isFinite(angle) || angle<0 || angle>Math.PI/2)
      throw new Error(`interior door angle outside 0–π/2: ${input.id}`);
    const side=config.side, low=side==="low", x0=-w/2, x1=w/2;
    const hingeX=low ? x0+0.03 : x1-0.03;
    const pivot:Point=[hingeX,0,0];
    const f=new Faces();
    const jamb=(stem:string, a:number,b:number, hinged:boolean):void=>{
      const cuts=[0,...HINGES.flatMap((y)=>[y-HINGE_HALF,y+HINGE_HALF]),2.17];
      for(let i=0;i<cuts.length-1;i++) {
        const ya=cuts[i]!,yb=cuts[i+1]!;
        const notch=hinged && HINGES.some((y)=>ya>=y-HINGE_HALF-EPS && yb<=y+HINGE_HALF+EPS);
        const inner=stem==="left" ? b : a;
        const sign=stem==="left" ? -1 : 1;
        const frontA=notch && sign===1 ? a+HINGE_R : a;
        const frontB=notch && sign===-1 ? b-HINGE_R : b;
        f.quad(
          `jamb/${stem}/a`,
          "jamb-a",
          [frontA, ya, 0],
          [frontB, ya, 0],
          [frontB, yb, 0],
          [frontA, yb, 0],
          [0, 0, 1],
          [
            [ya, frontA-a],
            [ya, frontB-a],
            [yb, frontB-a],
            [yb, frontA-a],
          ],
        );
        f.quad(
          `jamb/${stem}/b`,
          "jamb-b",
          [b, ya, -t],
          [a, ya, -t],
          [a, yb, -t],
          [b, yb, -t],
          [0, 0, -1],
          [
            [ya, b-a],
            [ya, 0],
            [yb, 0],
            [yb, b-a],
          ],
        );
        const zEnd=notch ? -HINGE_R : 0;
        f.quad(
          `jamb/${stem}/core`,
          "jamb-core",
          [inner, ya, -t],
          [inner, ya, zEnd],
          [inner, yb, zEnd],
          [inner, yb, -t],
          [stem==="left" ? 1 : -1, 0, 0],
          [
            [ya, 0],
            [ya, zEnd+t],
            [yb, zEnd+t],
            [yb, 0],
          ],
        );
        const outer=stem==="left" ? a : b;
        f.quad(
          `jamb/${stem}/core`,
          "jamb-core",
          [outer, ya, 0],
          [outer, ya, -t],
          [outer, yb, -t],
          [outer, yb, 0],
          [stem==="left" ? -1 : 1, 0, 0],
          [
            [ya, t],
            [ya, 0],
            [yb, 0],
            [yb, t],
          ],
        );
        if(notch) this.notch(
          f,
          `jamb/${stem}/core`,
          "jamb-core",
          hingeX,
          sign,
          ya,
          yb,
          true,
        );
      }
      f.quad(
        `jamb/${stem}/core`,
        "jamb-core",
        [a, 0, 0],
        [b, 0, 0],
        [b, 0, -t],
        [a, 0, -t],
        [0, -1, 0],
      );
    };
    jamb("left",x0,x0+0.03,low);
    jamb("right",x1-0.03,x1,!low);
    f.quad(
      "jamb/head/core",
      "jamb-core",
      [x0, 2.17, -t],
      [x1, 2.17, -t],
      [x1, 2.17, 0],
      [x0, 2.17, 0],
      [0, -1, 0],
    );
    f.quad(
      "jamb/head/core",
      "jamb-core",
      [x0, 2.20, 0],
      [x1, 2.20, 0],
      [x1, 2.20, -t],
      [x0, 2.20, -t],
      [0, 1, 0],
    );
    for(const [x,n] of [
      [x0, -1],
      [x1, 1],
    ] as const)
      f.quad(
        "jamb/head/core",
        "jamb-core",
        [x, 2.17, -t],
        [x, 2.17, 0],
        [x, 2.20, 0],
        [x, 2.20, -t],
        [n, 0, 0],
      );
    this.headFace(f,"jamb/head/a","jamb-a",x0,x1,2.17,2.20,0,1);
    this.headFace(f,"jamb/head/b","jamb-b",x0,x1,2.17,2.20,-t,-1);
    const casing=(room:"a"|"b", z0:number,z1:number):void=>{
      const face:Surface=room==="a" ? "casing-a" : "casing-b";
      const y0=room==="b" && input.id==="laundry-garage-door" ? -0.15 : 0;
      const leftWidth=0.07;
      const rightWidth=room==="b" && input.id==="hall-tub-door" ? 0.05 : 0.07;
      f.box(`casing-${room}/left`,face,[x0-leftWidth,x0,y0,2.20,z0,z1],true);
      f.box(`casing-${room}/right`,face,[x1,x1+rightWidth,y0,2.20,z0,z1],true);
      f.box(`casing-${room}/head`, face, [
        x0-leftWidth,
        x1+rightWidth,
        2.20,
        2.27,
        z0,
        z1,
      ]);
    };
    casing("a",0,0.015);
    casing("b",-t-0.015,-t);
    this.leaf(f,x0+0.03,x1-0.03,hingeX,low,config.handle==="recess");
    const handleX=low ? x1-0.10 : x0+0.10;
    if(config.handle==="recess") {
      f.round("handle/front/recess",handleX,0.95,0,0.025,0.008,"recess");
      f.round("handle/back/recess",handleX,0.95,-0.04,0.025,0.008,"recess");
    } else {
      const small=config.handle==="small-knob";
      const plateR=small ? 0.0175 : 0.0325;
      const plateD=small ? 0.004 : 0.006;
      const knobR=small ? 0.013 : 0.025;
      for(const [face,z,out] of [
        ["front", 0, 1],
        ["back", -0.04, -1],
      ] as const) {
        f.round(`handle/${face}/plate`,handleX,0.95,z,plateR,plateD,"plate");
        f.sphere(`handle/${face}/knob`,handleX,0.95,z+out*(plateD+knobR),knobR);
      }
    }
    f.rotate(["leaf/","handle/"],pivot,(low ? -1:1)*angle);
    for(let i=0;i<HINGES.length;i++) f.hinge(
      `hinge/${i+1}`,
      hingeX,
      0,
      HINGES[i]!-HINGE_HALF,
      HINGES[i]!+HINGE_HALF,
    );
    const model:IAutoMovieModel={
      id:`interior-door:${input.id}`,
      name:input.id,
      origin:"generated",
      parts:f.parts,
      skeleton:null,
      body:null,
      materials:[],
      asset:null,
    };
    return {
      model,
      faceByPart:f.faceByPart,
      hingePivot:pivot,
      angle,
      clearWidth:w-0.10,
    };
  }

  private headFace(f:Faces,name:string,surface:Surface,x0:number,x1:number,
    y0:number,y1:number,z:number,normal:number):void {
    f.quad(name,surface,[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z],[0,0,normal]);
  }

  private notch(f:Faces,name:string,surface:Surface,x:number,sign:number,
    y0:number,y1:number,jamb=false):void {
    for(let i=0;i<SEGMENTS/4;i++) {
      const a=(Math.PI/2)*i/(SEGMENTS/4),b=(Math.PI/2)*(i+1)/(SEGMENTS/4);
      const p=(t:number,y:number):Point=>[
        x+sign*HINGE_R*Math.cos(t),
        y,
        -HINGE_R*Math.sin(t),
      ];
      const face=jamb && (a+b)/2>Math.PI/4 ? "jamb-a" : surface;
      const part=face==="jamb-a" ? name.replace("/core","/a") : name;
      f.quad(
        part,
        face,
        p(a, y0),
        p(b, y0),
        p(b, y1),
        p(a, y1),
        [-sign*Math.cos((a+b)/2), 0, Math.sin((a+b)/2)],
        [
          [HINGE_R*(Math.PI/2+a), 0],
          [HINGE_R*(Math.PI/2+b), 0],
          [HINGE_R*(Math.PI/2+b), y1-y0],
          [HINGE_R*(Math.PI/2+a), y1-y0],
        ],
      );
    }
  }

  private leaf(f:Faces,x0:number,x1:number,hingeX:number,low:boolean,recess:boolean):void {
    const panelX0=x0+0.12,panelX1=x1-0.12;
    const handleCuts=recess ? [0.925,0.975] : [];
    const levels=[0.01,0.18,0.86,0.98,1.98,2.17,
      ...HINGES.flatMap((y)=>[y-HINGE_HALF,y+HINGE_HALF]),...handleCuts]
      .sort((a,b)=>a-b).filter((y,i,all)=>i===0 || y-all[i-1]!>EPS);
    const face=(name:string,surface:Surface,xa:number,xb:number,ya:number,yb:number,z:number,n:number):void=>{
      if(xb-xa<=EPS || yb-ya<=EPS) return;
      f.quad(
        name,
        surface,
        [xa, ya, z],
        [xb, ya, z],
        [xb, yb, z],
        [xa, yb, z],
        [0, 0, n],
        [
          [xa-x0, ya-0.01],
          [xb-x0, ya-0.01],
          [xb-x0, yb-0.01],
          [xa-x0, yb-0.01],
        ],
      );
    };
    for(let i=0;i<levels.length-1;i++) {
      const ya=levels[i]!,yb=levels[i+1]!,mid=(ya+yb)/2;
      const hinged=HINGES.some((y)=>mid>y-HINGE_HALF && mid<y+HINGE_HALF);
      const front0=low && hinged ? x0+HINGE_R : x0;
      const front1=!low && hinged ? x1-HINGE_R : x1;
      const panel=(mid>0.18 && mid<0.86) || (mid>0.98 && mid<1.98);
      for(const [side,z,n] of [
        ["front", 0, 1],
        ["back", -0.04, -1],
      ] as const) {
        const xa=side==="front" ? front0 : x0, xb=side==="front" ? front1 : x1;
        if(panel) {
          face(`leaf/${side}`,"leaf",xa,panelX0,ya,yb,z,n);
          face(`leaf/${side}`,"leaf",panelX1,xb,ya,yb,z,n);
          face(
            `leaf/panel/${side}`,
            "leaf-panel",
            panelX0,
            panelX1,
            ya,
            yb,
            z-(side==="front" ? 0.008:-0.008),
            n,
          );
        } else if(recess && mid>0.925 && mid<0.975) {
          const cx=low ? x1-0.07 : x0+0.07;
          face(`leaf/${side}`,"leaf",xa,cx-0.025,ya,yb,z,n);
          face(`leaf/${side}`,"leaf",cx+0.025,xb,ya,yb,z,n);
          this.recessRing(f,`leaf/${side}`,cx,0.95,z,n,x0);
        } else face(`leaf/${side}`,"leaf",xa,xb,ya,yb,z,n);
      }
      for(const [edge,x,n] of [
        ["left", x0, -1],
        ["right", x1, 1],
      ] as const) {
        const end=hinged && x===hingeX ? -HINGE_R : 0;
        f.quad(
          `leaf/${edge}`,
          "leaf",
          [x, ya, -0.04],
          [x, ya, end],
          [x, yb, end],
          [x, yb, -0.04],
          [n, 0, 0],
        );
      }
      if(hinged) this.notch(f,"leaf/hinge-cut","leaf",hingeX,low ? 1:-1,ya,yb);
    }
    for(const [start,end] of [
      [0.18, 0.86],
      [0.98, 1.98],
    ] as const)
      for(const [side,z,n] of [
        ["front", 0, 1],
        ["back", -0.04, -1],
      ] as const) {
        const inset=z-n*0.008;
        for(const y of [start,end]) f.quad(
          `leaf/panel/${side}`,
          "leaf-panel",
          [panelX0, y, z],
          [panelX1, y, z],
          [panelX1, y, inset],
          [panelX0, y, inset],
          [0, y===start ? 1 : -1, 0],
        );
        for(const [x,nx] of [
          [panelX0, -1],
          [panelX1, 1],
        ] as const)
          f.quad(
            `leaf/panel/${side}`,
            "leaf-panel",
            [x, start, z],
            [x, end, z],
            [x, end, inset],
            [x, start, inset],
            [-nx, 0, 0],
          );
      }
    for(const [y,ny] of [
      [0.01, -1],
      [2.17, 1],
    ] as const)
      f.quad(
        "leaf/edge",
        "leaf",
        [x0, y, -0.04],
        [x1, y, -0.04],
        [x1, y, 0],
        [x0, y, 0],
        [0, ny, 0],
      );
  }

  private recessRing(f:Faces,name:string,cx:number,cy:number,z:number,n:number,x0:number):void {
    const r=0.025;
    for(let i=0;i<SEGMENTS;i++) {
      const a=2*Math.PI*i/SEGMENTS,b=2*Math.PI*(i+1)/SEGMENTS;
      const outer=(t:number):Point=>{
        const c=Math.cos(t),s=Math.sin(t),m=Math.max(Math.abs(c),Math.abs(s));
        return [cx+r*c/m,cy+r*s/m,z];
      };
      const inner=(t:number):Point=>[cx+r*Math.cos(t),cy+r*Math.sin(t),z];
      const oa=outer(a),ob=outer(b),ia=inner(a),ib=inner(b);
      const uv=(p:Point):readonly[number,number]=>[p[0]-x0,p[1]-0.01];
      if(length(minus(oa,ia))<EPS)
        f.triangle(name,"leaf",oa,ob,ib,[0,0,n],[uv(oa),uv(ob),uv(ib)]);
      else if(length(minus(ob,ib))<EPS)
        f.triangle(name,"leaf",oa,ob,ia,[0,0,n],[uv(oa),uv(ob),uv(ia)]);
      else f.quad(
        name,
        "leaf",
        oa,
        ob,
        ib,
        ia,
        [0, 0, n],
        [uv(oa), uv(ob), uv(ib), uv(ia)],
      );
    }
  }
}
