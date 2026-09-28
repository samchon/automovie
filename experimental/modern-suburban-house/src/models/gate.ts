/** Side-yard gate leaf in opening-local metres: centre X=0, fence plane Z=0. */
import type {
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

type Face = "leaf-panel" | "gate-batten" | "hinge" | "handle";
type Box = readonly [number,number,number,number,number,number];
type Vec3 = readonly [number,number,number];
type Build = { model: IAutoMovieModel; faceByPart: Readonly<Record<string,Face>> };

const mesh=():IAutoMovieMesh=>({
  positions:[],
  normals:[],
  uvs:[],
  indices:[],
  skin:null,
});
const quad=(m:IAutoMovieMesh,v:readonly Vec3[],n:Vec3,
  uv:(v:Vec3)=>readonly [number,number]):void=>{
  const a=m.positions.length/3;
  for(const p of v){
    m.positions.push(...p);
    m.normals!.push(...n);
    m.uvs!.push(...uv(p));
  }
  m.indices!.push(a,a+1,a+2,a,a+2,a+3);
};
const boxMesh=(b:Box,length:"x"|"y"|null=null):IAutoMovieMesh=>{
  const [x0,x1,y0,y1,z0,z1]=b;
  if(![...b].every(Number.isFinite)||x1<=x0||y1<=y0||z1<=z0)
    throw new Error(`invalid gate member: ${b.join(",")}`);
  const m=mesh();
  const face=(v:readonly Vec3[],n:Vec3):void=>quad(m, v, n, ([x,y,z])=>
    length==="y"
      ? [y-y0, Math.abs(n[2])===1 ? x-x0 : z-z0]
      : length==="x"
        ? [x-x0, Math.abs(n[1])===1 ? z-z0 : y-y0]
        : Math.abs(n[2])===1
          ? [x-x0, y-y0]
          : Math.abs(n[1])===1
            ? [x-x0, z-z0]
            : [z-z0, y-y0],
  );
  face(
    [
      [x0, y0, z1],
      [x1, y0, z1],
      [x1, y1, z1],
      [x0, y1, z1],
    ],
    [0, 0, 1],
  );
  face(
    [
      [x1, y0, z0],
      [x0, y0, z0],
      [x0, y1, z0],
      [x1, y1, z0],
    ],
    [0, 0, -1],
  );
  face(
    [
      [x1, y0, z1],
      [x1, y0, z0],
      [x1, y1, z0],
      [x1, y1, z1],
    ],
    [1, 0, 0],
  );
  face(
    [
      [x0, y0, z0],
      [x0, y0, z1],
      [x0, y1, z1],
      [x0, y1, z0],
    ],
    [-1, 0, 0],
  );
  face(
    [
      [x0, y1, z1],
      [x1, y1, z1],
      [x1, y1, z0],
      [x0, y1, z0],
    ],
    [0, 1, 0],
  );
  face(
    [
      [x0, y0, z0],
      [x1, y0, z0],
      [x1, y0, z1],
      [x0, y0, z1],
    ],
    [0, -1, 0],
  );
  return m;
};
/** Last board has the pin's faceted cross-section removed at each hinge band. */
const cutBoard=(y0:number,y1:number):IAutoMovieMesh=>{
  const x0=.448,x1=.588,z0=-.02,z1=.02,axis=.575,r=.025;
  const poly:[number,number][]=[
    [x0, z0],
    [axis-r, z0],
  ];
  const step=Math.PI/16;
  let previous:[number,number]=[axis-r,z0];
  for(let i=1;i<=10;i++){
    const a=-Math.PI/2+i*step;
    const next:[number,number]=[axis+r*Math.sin(a),z0+r*Math.cos(a)];
    if(next[0]>=x1){
      const t=(x1-previous[0])/(next[0]-previous[0]);
      poly.push([x1,previous[1]+t*(next[1]-previous[1])]);
      break;
    }
    poly.push(next);
    previous=next;
  }
  poly.push([x1,z1],[x0,z1]);
  const m=mesh();
  for(let i=0;i<poly.length;i++){
    const a=poly[i]!,b=poly[(i+1)%poly.length]!,dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(
      dx,
      dz,
    );
    if(len<1e-12)continue;
    quad(
      m,
      [
        [a[0], y0, a[1]],
        [a[0], y1, a[1]],
        [b[0], y1, b[1]],
        [b[0], y0, b[1]],
      ],
      [dz/len, 0, -dx/len],
      ([x,y,z])=>[Math.hypot(x-a[0], z-a[1]), y-y0],
    );
  }
  const cross=(a:readonly number[],b:readonly number[],c:readonly number[]):number=>
    (b[0]!-a[0]!)*(c[1]!-a[1]!)-(b[1]!-a[1]!)*(c[0]!-a[0]!);
  const active=poly.map((_,i)=>i),triangles:number[][]=[];
  while(active.length>3){
    let found=false;
    for(let k=0;k<active.length;k++){
      const ia=active[(k+active.length-1)%active.length]!,ib=active[k]!,
        ic=active[(k+1)%active.length]!,a=poly[ia]!,b=poly[ib]!,c=poly[ic]!;
      if(cross(a,b,c)<=1e-12)continue;
      if(active.some((p)=>p!==ia&&p!==ib&&p!==ic&&
        cross(a,b,poly[p]!)>1e-12&&cross(b,c,poly[p]!)>1e-12&&cross(c,a,poly[p]!)>1e-12))continue;
      triangles.push([ia,ib,ic]);
      active.splice(k,1);
      found=true;
      break;
    }
    if(!found)throw new Error("gate hinge cut could not triangulate");
  }
  triangles.push(active);
  for(const tri of triangles)
    for(const [y,normal,order] of [
      [y0, -1, tri],
      [y1, 1, [tri[2]!, tri[1]!, tri[0]!]],
    ] as const){
      const a=m.positions.length/3;
      for(const i of order){
      const [x,z]=poly[i]!;
      m.positions.push(x,y,z);
        m.normals!.push(0,normal,0);
      m.uvs!.push(x-x0,z-z0);}
      m.indices!.push(a,a+1,a+2);
    }
  return m;
};
const cylinder=(axis:"x"|"y"|"z",center:Vec3,radius:number,a0:number,a1:number):IAutoMovieMesh=>{
  if(a1<=a0)throw new Error("gate cylinder has nonpositive length");
  const m=mesh(),sides=32;
  const pt=(a:number,t:number):Vec3=>{
    const u=radius*Math.sin(a),v=radius*Math.cos(a);
    return axis==="x"
      ? [t, center[1]+u, center[2]+v]
      : axis==="y"
        ? [center[0]+u, t, center[2]+v]
        : [center[0]+u, center[1]+v, t];
  };
  for(let i=0;i<sides;i++){
    const a=i*2*Math.PI/sides,b=(i+1)*2*Math.PI/sides;
    const v=[pt(a,a0),pt(b,a0),pt(b,a1),pt(a,a1)] as const;
    const n:Vec3=axis==="x"
      ? [0, Math.sin((a+b)/2), Math.cos((a+b)/2)]
      : axis==="y"
        ? [Math.sin((a+b)/2), 0, Math.cos((a+b)/2)]
        : [Math.sin((a+b)/2), Math.cos((a+b)/2), 0];
    quad(m,axis==="y"?v:[v[3],v[2],v[1],v[0]],n,(p)=>
      [radius*(p===v[0]||p===v[3]?a:b),axis==="x"?p[0]-a0:axis==="y"?p[1]-a0:p[2]-a0]);
    for(const [t,sign] of [
      [a0, -1],
      [a1, 1],
    ] as const){
      const c:Vec3=axis==="x"
        ? [t, center[1], center[2]]
        : axis==="y"
          ? [center[0], t, center[2]]
          : [center[0], center[1], t];
      const norm:Vec3=axis==="x"?[sign,0,0]:axis==="y"?[0,sign,0]:[0,0,sign];
      const start=m.positions.length/3;
      for(const p of [c,pt(a,t),pt(b,t)]){
        m.positions.push(...p);
        m.normals!.push(...norm);
        const uv:readonly [number,number]=axis==="x"
          ? [p[1]-center[1], p[2]-center[2]]
          : axis==="y"
            ? [p[0]-center[0], p[2]-center[2]]
            : [p[0]-center[0], p[1]-center[1]];
        m.uvs!.push(...uv);
      }
      if((sign===1)===(axis==="y"))m.indices!.push(start,start+1,start+2);
      else m.indices!.push(start,start+2,start+1);
    }
  }
  return m;
};
const rotate=(m:IAutoMovieMesh,angle:number):void=>{
  const c=Math.cos(angle),s=Math.sin(angle);
  for(let i=0;i<m.positions.length;i+=3){
    const x=m.positions[i]! - .575,z=m.positions[i+2]! + .02;
    m.positions[i]=.575+c*x+s*z;
    m.positions[i+2]=-.02-s*x+c*z;
    const nx=m.normals![i]!,nz=m.normals![i+2]!;
    m.normals![i]=c*nx+s*nz;
    m.normals![i+2]=-s*nx+c*nz;
  }
};

/** Eight open-gap boards and two garden-side battens with a positive-angle hinge. */
export class Gate {
  /** Ground is the site owner's S datum; angle 0 is shut. */
  public build(ground:number,angle=0):Build {
    if(!Number.isFinite(ground))throw new Error(`invalid gate ground datum: ${ground}`);
    if(!Number.isFinite(angle)||angle<0||angle>Math.PI/2)
      throw new Error(`gate angle outside 0..pi/2: ${angle}`);
    const parts:IAutoMovieModelPart[]=[],faceByPart:Record<string,Face>={};
    const add=(name:string,id:Face,m:IAutoMovieMesh,moving:boolean):void=>{
      if(faceByPart[name])throw new Error(`duplicate gate part: ${name}`);
      if(moving)rotate(m,-angle);
      for(let i=0;i<m.positions.length;i+=3){
        m.positions[i]=m.positions[i]!+12.90;
        m.positions[i+1]=m.positions[i+1]!+ground;
        m.positions[i+2]=m.positions[i+2]!-.30;
      }
      parts.push({
        id:name,
        name,
        geometry:{ type:"mesh", mesh:m },
        material:null,
        attachedBone:null,
        transform:null,
      });
      faceByPart[name]=id;
    };
    for(let k=0;k<8;k++){
      const x0=-.588+.148*k;
      if(k<7)add(
        `leaf-panel/${k+1}`,
        "leaf-panel",
        boxMesh([x0, x0+.14, .05, 1.70, -.02, .02]),
        true,
      );
      else{
        // The hinge recess changes the section at four Y stations. Keep each
        // closed section a model part so no coincident internal cap enters one
        // manifold, while the five parts still read as the eighth board.
        add(
          "leaf-panel/8/lower",
          "leaf-panel",
          boxMesh([x0, x0+.14, .05, .20, -.02, .02]),
          true,
        );
        add("leaf-panel/8/lower-cut","leaf-panel",cutBoard(.20,.30),true);
        add(
          "leaf-panel/8/middle",
          "leaf-panel",
          boxMesh([x0, x0+.14, .30, 1.40, -.02, .02]),
          true,
        );
        add("leaf-panel/8/upper-cut","leaf-panel",cutBoard(1.40,1.50),true);
        add(
          "leaf-panel/8/upper",
          "leaf-panel",
          boxMesh([x0, x0+.14, 1.50, 1.70, -.02, .02]),
          true,
        );
      }
    }
    add(
      "gate-batten/lower",
      "gate-batten",
      boxMesh([-.59, .55, .30, .40, -.045, -.02], "x"),
      true,
    );
    add(
      "gate-batten/upper",
      "gate-batten",
      boxMesh([-.59, .55, 1.25, 1.35, -.045, -.02], "x"),
      true,
    );
    for(const [i,y] of [
      [1, .25],
      [2, 1.45],
    ] as const){
      add(
        `hinge/${i}/knuckle`,
        "hinge",
        cylinder("y", [.575, 0, -.02], .025, y-.05, y+.05),
        false,
      );
      add(
        `hinge/${i}/fixed-plate`,
        "hinge",
        boxMesh([.575, .60, y-.05, y+.05, -.06, -.04]),
        false,
      );
    }
    add("handle/plate","handle",cylinder("z",[-.53,.95,0],.03,-.026,-.02),true);
    add(
      "handle/stem",
      "handle",
      cylinder("z", [-.53, .95, 0], .006, -.066, -.026),
      true,
    );
    add(
      "handle/lever",
      "handle",
      cylinder("x", [0, .95, -.066], .006, -.53, -.45),
      true,
    );
    return {
      model:{
        id:"gate:side-yard-gate",
        name:"side-yard-gate",
        origin:"generated",
        parts,
        skeleton:null,
        body:null,
        materials:[],
        asset:null,
      },
      faceByPart,
    };
  }
}
