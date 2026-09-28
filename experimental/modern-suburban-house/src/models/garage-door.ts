/** Sectional garage filling in the opening-local frame: metres, Y up, +Z weather. */
import type {
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

type Face = "jamb" | "exterior-trim" | "leaf-exterior" | "leaf-interior" |
  "panel-edge" | "leaf-panel" | "sash" | "glass" | "rail";
type Box = readonly [number,number,number,number,number,number];
type Vec3 = readonly [number,number,number];
type PathPoint = Readonly<{ z: number; y: number }>;
type Build = { model: IAutoMovieModel; faceByPart: Readonly<Record<string, Face>>;
  joints: readonly PathPoint[]
};

const mesh = (): IAutoMovieMesh => ({
  positions:[],
  normals:[],
  uvs:[],
  indices:[],
  skin:null,
});
const quad = (m:IAutoMovieMesh,v:readonly Vec3[],n:Vec3,
  uv:(v:Vec3)=>readonly [number,number]):void => {
  const a=m.positions.length/3;
  for(const p of v){
    m.positions.push(...p);
    m.normals!.push(...n);
    m.uvs!.push(...uv(p));
  }
  m.indices!.push(a,a+1,a+2,a,a+2,a+3);
};
const boxMeshes = (b:Box,front:Face,back=front,edge=front,
  length:"x"|"y"|null=null):readonly [Face,IAutoMovieMesh][] => {
  const [x0,x1,y0,y1,z0,z1]=b;
  if(![...b].every(Number.isFinite)||x1<=x0||y1<=y0||z1<=z0)
    throw new Error(`invalid garage member: ${b.join(",")}`);
  const groups=new Map<Face,IAutoMovieMesh>();
  const face=(id:Face,v:readonly Vec3[],n:Vec3):void=>{
    const m=groups.get(id)??mesh();
    groups.set(id,m);
    quad(m, v, n, ([x,y,z])=>
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
  };
  face(
    front,
    [
      [x0, y0, z1],
      [x1, y0, z1],
      [x1, y1, z1],
      [x0, y1, z1],
    ],
    [0, 0, 1],
  );
  face(
    back,
    [
      [x1, y0, z0],
      [x0, y0, z0],
      [x0, y1, z0],
      [x1, y1, z0],
    ],
    [0, 0, -1],
  );
  face(
    edge,
    [
      [x1, y0, z1],
      [x1, y0, z0],
      [x1, y1, z0],
      [x1, y1, z1],
    ],
    [1, 0, 0],
  );
  face(
    edge,
    [
      [x0, y0, z0],
      [x0, y0, z1],
      [x0, y1, z1],
      [x0, y1, z0],
    ],
    [-1, 0, 0],
  );
  face(
    edge,
    [
      [x0, y1, z1],
      [x1, y1, z1],
      [x1, y1, z0],
      [x0, y1, z0],
    ],
    [0, 1, 0],
  );
  face(
    edge,
    [
      [x0, y0, z0],
      [x1, y0, z0],
      [x1, y0, z1],
      [x0, y0, z1],
    ],
    [0, -1, 0],
  );
  return [...groups];
};

// Path distance is measured from the garage floor; the arc has four rendered
// segments but continuous analytic placement for panel joints.
const arcLength=.30*Math.PI/2;
const path=(s:number):PathPoint=>{
  if(s<=2.30)return { z:-.36,y:s };
  if(s<=2.30+arcLength){
    const a=(s-2.30)/.30;
    return {
      z:-.66+.30*Math.cos(a),
      y:2.30+.30*Math.sin(a),
    };
  }
  return { z:-.66-(s-2.30-arcLength),y:2.60 };
};
const nextJoint=(prior:number):number=>{
  const p=path(prior), length=.5375;
  let lo=prior,hi=prior+length+arcLength;
  for(let i=0;i<44;i++){
    const mid=(lo+hi)/2,q=path(mid);
    if(Math.hypot(q.y-p.y,q.z-p.z)<length)lo=mid;
    else hi=mid;
  }
  return (lo+hi)/2;
};
const placePanel=(m:IAutoMovieMesh, lower:PathPoint, upper:PathPoint,
  baseY:number):void=>{
  const dz=upper.z-lower.z,dy=upper.y-lower.y,len=.5375;
  for(let i=0;i<m.positions.length;i+=3){
    const t=(m.positions[i+1]!-baseY)/len,q=m.positions[i+2]!+.36;
    m.positions[i+1]=lower.y+t*dy-q*dz/len;
    m.positions[i+2]=lower.z+t*dz+q*dy/len;
    const ny=m.normals![i+1]!,nz=m.normals![i+2]!;
    m.normals![i+1]=ny*dy/len-nz*dz/len;
    m.normals![i+2]=ny*dz/len+nz*dy/len;
  }
};
const railMesh=(centerX:number,inward:1|-1):IAutoMovieMesh=>{
  const steps=[
    0,
    2.30,
    ...Array.from({ length:4 },(_,i)=>2.30+(i+1)*arcLength/4),
    2.30+arcLength+2.44,
  ];
  // A concave but closed C polygon; opening points toward the panel.
  const right:[number,number][]=[
    [.015, -.0125],
    [-.015, -.0125],
    [-.015, -.0065],
    [.009, -.0065],
    [.009, .0065],
    [-.015, .0065],
    [-.015, .0125],
    [.015, .0125],
  ];
  const section:[number,number][]=inward===1
    ? [
        [-.015, -.0125],
        [.015, -.0125],
        [.015, -.0065],
        [-.009, -.0065],
        [-.009, .0065],
        [.015, .0065],
        [.015, .0125],
        [-.015, .0125],
      ]
    : right.reverse();
  const v=[0];
  for(let k=0;k<section.length;k++){
    const a=section[k]!,b=section[(k+1)%section.length]!;
    v.push(v[k]!+Math.hypot(b[0]-a[0],b[1]-a[1]));
  }
  const tangent=(s:number):PathPoint=>{
    if(s<=2.30)return { z:0,y:1 };
    if(s<=2.30+arcLength){
      const a=(s-2.30)/.30;
      return {
        z:-Math.sin(a),
        y:Math.cos(a),
      };
    }
    return { z:-1,y:0 };
  };
  const point=(s:number,x:number,q:number):Vec3=>{
    const p=path(s),t=tangent(s);
    return [centerX+x,p.y-q*t.z,p.z+q*t.y];
  };
  const m=mesh();
  const triangle=(a:Vec3,b:Vec3,c:Vec3,ua:readonly [number,number],
    ub:readonly [number,number],uc:readonly [number,number],expected?:Vec3):void=>{
    const ab=[b[0]-a[0],b[1]-a[1],b[2]-a[2]];
    const ac=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
    const n=[
      ab[1]*ac[2]-ab[2]*ac[1],
      ab[2]*ac[0]-ab[0]*ac[2],
      ab[0]*ac[1]-ab[1]*ac[0],
    ];
    const len=Math.hypot(...n);
    if(len<1e-12)throw new Error("degenerate garage rail segment");
    const flip=expected!==undefined&&n[0]*expected[0]+n[1]*expected[1]+n[2]*expected[2]<0;
    const verts=flip?[a,c,b]:[a,b,c],uvs=flip?[ua,uc,ub]:[ua,ub,uc];
    const first=m.positions.length/3;
    for(let i=0;i<3;i++){
      m.positions.push(...verts[i]!);
      m.normals!.push(
        n[0]!/len*(flip?-1:1),
        n[1]!/len*(flip?-1:1),
        n[2]!/len*(flip?-1:1),
      );
      m.uvs!.push(...uvs[i]!);
    }
    m.indices!.push(first,first+1,first+2);
  };
  for(let k=0;k<steps.length-1;k++){
    const s0=steps[k]!,s1=steps[k+1]!;
    for(let j=0;j<section.length;j++){
      const next=(j+1)%section.length,a=section[j]!,b=section[next]!;
      const p0=point(s0,a[0],a[1]),p1=point(s0,b[0],b[1]);
      const p2=point(s1,b[0],b[1]),p3=point(s1,a[0],a[1]);
      const v0=v[j]!,v1=v[j+1]!;
      triangle(p1,p0,p3,[s0,v1],[s0,v0],[s1,v0]);
      triangle(p1,p3,p2,[s0,v1],[s1,v0],[s1,v1]);
    }
  }
  const cap=(s:number,sign:-1|1):void=>{
    const t=tangent(s),expect:Vec3=[0,sign*t.y,sign*t.z];
    const web=inward===1?[-.015,-.009] as const:[.009,.015] as const;
    const wing=inward===1?[-.009,.015] as const:[-.015,.009] as const;
    for(const [xa,xb,qa,qb] of [
      [web[0], web[1], -.0125, .0125],
      [wing[0], wing[1], -.0125, -.0065],
      [wing[0], wing[1], .0065, .0125],
    ] as const){
      const a=point(s,xa,qa),b=point(s,xb,qa),c=point(s,xb,qb),d=point(s,xa,qb);
      triangle(a,b,c,[xa,qa],[xb,qa],[xb,qb],expect);
      triangle(a,c,d,[xa,qa],[xb,qb],[xa,qb],expect);
    }
  };
  cap(steps[0]!,-1);
  cap(steps[steps.length-1]!,1);
  return m;
};

/** Four articulated panels, visible recessed fields and paired open C rails. */
export class GarageDoor {
  /** Travel in metres is the bottom joint's height along the rail path. */
  public build(travel=0):Build {
    if(!Number.isFinite(travel)||travel<0||travel>2.30)
      throw new Error(`garage travel outside 0..2.30 m: ${travel}`);
    const parts:IAutoMovieModelPart[]=[],faceByPart:Record<string,Face>={};
    const jointS=[travel];
    for(let i=0;i<4;i++)jointS.push(nextJoint(jointS[i]!));
    const joints=jointS.map(path);
    const add=(name:string,id:Face,m:IAutoMovieMesh,panel?:number):void=>{
      if(faceByPart[name])throw new Error(`duplicate garage part: ${name}`);
      if(panel!==undefined)placePanel(
        m,
        joints[panel]!,
        joints[panel+1]!,
        panel*.5375,
      );
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
    const box=(name:string,b:Box,front:Face,back=front,edge=front,
      panel?:number,length:"x"|"y"|null=null):void=>{
      // The drawing ordinates are world Y; the prototype origin is the
      // rough opening lower edge at -0.15 m, applied by its instance.
      const local:Box=[b[0],b[1],b[2]+.15,b[3]+.15,b[4],b[5]];
      for(const [id,m] of boxMeshes(local, front, back, edge, length))add(`${name}/${id}`, id, m, panel);
    };
    // World drawing X=[6.10,11.10] shifted by centre 8.60.
    box("jamb/left",[-2.50,-2.40,-.15,2.00,-.25,0],"jamb");
    box("jamb/right",[2.40,2.50,-.15,2.00,-.25,0],"jamb");
    box("jamb/head",[-2.50,2.50,2.00,2.15,-.25,0],"jamb");
    box(
      "exterior-trim/left",
      [-2.57, -2.50, -.15, 2.15, 0, .035],
      "exterior-trim",
      undefined,
      undefined,
      undefined,
      "y",
    );
    box(
      "exterior-trim/right",
      [2.50, 2.57, -.15, 2.15, 0, .035],
      "exterior-trim",
      undefined,
      undefined,
      undefined,
      "y",
    );
    box(
      "exterior-trim/head",
      [-2.57, 2.57, 2.15, 2.22, 0, .035],
      "exterior-trim",
      undefined,
      undefined,
      undefined,
      "x",
    );
    const columns=Array.from({ length:4 }, (_,k)=>{
      const left=-2.40+.08+k*1.17;
      return [left,left+1.13] as const;
    });
    for(let p=0;p<4;p++){
      const y0=-.15+p*.5375,y1=y0+.5375,stem=`panel-${p+1}`;
      const wood=(name:string,b:Box,front:Face="leaf-exterior"):
        void=>box(`${stem}/${name}`,b,front,"leaf-interior","panel-edge",p);
      if(p<3){
        // Ring plus genuinely inset solid cores: no covering face spans the recess.
        const insets=columns.map(([a,b])=>[a+.08,b-.08] as const);
        if(p>0){
          wood("bottom-groove",[-2.40,2.40,y0,y0+.003,-.36,-.316],"panel-edge");
          wood("bottom",[-2.40,2.40,y0+.003,y0+.08,-.36,-.31]);
        } else wood("bottom",[-2.40,2.40,y0,y0+.08,-.36,-.31]);
        wood("top",[-2.40,2.40,y1-.08,y1-.003,-.36,-.31]);
        wood("top-groove",[-2.40,2.40,y1-.003,y1,-.36,-.316],"panel-edge");
        let cursor=-2.40;
        for(let k=0;k<4;k++){
          const [a,b]=insets[k]!;
          wood(`pier-${k}`,[cursor,a,y0+.08,y1-.08,-.36,-.31]);
          box(
            `${stem}/recess-${k}`,
            [a, b, y0+.08, y1-.08, -.36, -.32],
            "leaf-panel",
            "leaf-interior",
            "leaf-panel",
            p,
          );
          cursor=b;
        }
        wood("pier-4",[cursor,2.40,y0+.08,y1-.08,-.36,-.31]);
      } else{
        wood("bottom-groove",[-2.40,2.40,y0,y0+.003,-.36,-.316],"panel-edge");
        wood("bottom",[-2.40,2.40,y0+.003,1.5625,-.36,-.31]);
        wood("top",[-2.40,2.40,1.90,y1,-.36,-.31]);
        let cursor=-2.40;
        for(let k=0;k<4;k++){
          const [a,b]=columns[k]!;
          wood(`pier-${k}`,[cursor,a,1.5625,1.90,-.36,-.31]);
          box(
            `${stem}/sash-${k}/bottom`,
            [a, b, 1.5625, 1.5975, -.36, -.31],
            "sash",
            undefined,
            undefined,
            p,
            "x",
          );
          box(
            `${stem}/sash-${k}/top`,
            [a, b, 1.865, 1.90, -.36, -.31],
            "sash",
            undefined,
            undefined,
            p,
            "x",
          );
          box(
            `${stem}/sash-${k}/left`,
            [a, a+.035, 1.5975, 1.865, -.36, -.31],
            "sash",
            undefined,
            undefined,
            p,
            "y",
          );
          box(
            `${stem}/sash-${k}/right`,
            [b-.035, b, 1.5975, 1.865, -.36, -.31],
            "sash",
            undefined,
            undefined,
            p,
            "y",
          );
          box(
            `${stem}/glass-${k}`,
            [a+.035, b-.035, 1.5975, 1.865, -.338, -.332],
            "glass",
            undefined,
            undefined,
            p,
          );
          cursor=b;
        }
        wood("pier-4",[cursor,2.40,1.5625,1.90,-.36,-.31]);
      }
    }
    add("rail/left","rail",railMesh(-2.46,1));
    add("rail/right","rail",railMesh(2.46,-1));
    return {
      model:{
        id:"garage-door:garage-front-door",
        name:"garage-front-door",
        origin:"generated",
        parts,
        skeleton:null,
        body:null,
        materials:[],
        asset:null,
      },
      faceByPart,
      joints,
    };
  }
}
