/** Site silhouettes Placement remains with instances. */
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";
import { ObjectMesh } from "../geometry/ObjectMesh";
import { modelEllipsoid } from "../geometry/modelEllipsoid";
import { modelExtrudeYZ } from "../geometry/modelExtrudeYZ";
import { TempleRectilinearUnion } from "./TempleRectilinearUnion";

const p=(x:number,y:number,z:number)=>({ x,y,z });
/**
 * Emits local vegetation and two neighboring house envelopes.
 */
export class TempleLandscape {
  cypress():IAutoMovieModel {
    const m=new ObjectMesh();
    m.frustum("trunk",0,0,0,1.4,0.12,0.08,12);
    for(const [x,y,r,h] of [
      [0, 3, 0.75, 3.6],
      [0.10, 5.4, 0.62, 3.4],
      [-0.10, 7.6, 0.42, 2.8],
    ])
      modelEllipsoid(m,"crown",p(x,y,0),p(r,h/2,r),10,6);
    return m.model("landscape.cypress","Narrow tall evergreen");
  }
  broadTree():IAutoMovieModel {
    const m=new ObjectMesh();
    m.frustum("trunk",0,0,0,1.6,0.18,0.13,12);
    for(const [x,y,z] of [
      [-1.05, 2.6, -0.55],
      [1.05, 2.6, -0.55],
      [0, 2.6, 1.10],
    ])
      m.cylinder("branch",p(0,1.5,0),p(x,y,z),0.07,8);
    for(const [x,y,z,rx,ry,rz] of [
      [-1.05, 3.25, -0.55, 1.15, 1.35, 1.05],
      [1.05, 3.25, -0.55, 1.15, 1.35, 1.05],
      [0, 3.55, 0.85, 1.20, 1.65, 1.20],
      [-1.15, 3.45, 0.95, 0.90, 1.30, 1.10],
      [1.15, 3.45, 0.95, 0.90, 1.30, 1.10],
      [0, 3.50, -0.95, 1.05, 1.40, 1.15],
    ]) modelEllipsoid(m,"crown",p(x,y,z),p(rx,ry,rz),10,6);
    return m.model("landscape.broad-tree","Broad-crowned tree");
  }
  grassTuft():IAutoMovieModel {
    const m=new ObjectMesh();
    for(let i=0;i<12;i++){
      const theta=2*Math.PI*i/12,c=Math.cos(theta),s=Math.sin(theta);
      const width=0.02+0.005*(i%3),height=0.20+0.15*((5*i%12)/11);
      const extent=0.03+0.08+0.04*((i%4)/3);
      const a=p(0.03*c-width*s/2,0,0.03*s+width*c/2);
      const b=p(0.03*c+width*s/2,0,0.03*s-width*c/2);
      const tip=p(extent*c,height,extent*s);
      m.face("blade",[a,b,tip]);
      m.face("blade",[tip,b,a]);
    }
    return m.model("landscape.grass-tuft","Grass at the wall foot");
  }
  neighborHouse(kind:"gable"|"shed"):IAutoMovieModel {
    const m=new ObjectMesh();
    const gable=kind==="gable",w=gable?8:6,d=gable?6:7;
    const front=gable?3.361:4.24,rear=gable?3.361:5.728;
    const halfW=w/2,halfD=d/2,wallDepth=0.30,recessDepth=0.20;
    const openings=[{ x:0,y:0,width:1,height:2.10 }];
    const windowXs=gable?[-2.20,2.20]:[-1.70,1.70];
    for(const x of windowXs)for(const y of gable?[1.35]:[1.25,2.95])
      openings.push({ x,y,width:0.60,height:0.80 });
    const xs=[-halfW,halfW,...openings.flatMap((o)=>[o.x-o.width/2,o.x+o.width/2])]
      .sort((a,b)=>a-b);
    const ys=[0,front,...openings.flatMap((o)=>[o.y,o.y+o.height])]
      .sort((a,b)=>a-b);
    const frontZ=halfD,backZ=frontZ-recessDepth;
    for(let i=0;i<xs.length-1;i++)for(let j=0;j<ys.length-1;j++){
      const x0=xs[i]!,x1=xs[i+1]!,y0=ys[j]!,y1=ys[j+1]!;
      if(x1<=x0||y1<=y0)continue;
      const cx=(x0+x1)/2,cy=(y0+y1)/2;
      if(openings.some(
        (o)=>Math.abs(cx-o.x)<o.width/2&&cy>o.y&&cy<o.y+o.height,
      ))
        continue;
      m.face("wall", [
        p(x0, y0, frontZ),
        p(x1, y0, frontZ),
        p(x1, y1, frontZ),
        p(x0, y1, frontZ),
      ]);
    }
    m.face("wall", [
      p(-halfW, 0, frontZ-wallDepth),
      p(-halfW, front, frontZ-wallDepth),
      p(halfW, front, frontZ-wallDepth),
      p(halfW, 0, frontZ-wallDepth),
    ]);
    for(const o of openings){
      const x0=o.x-o.width/2,x1=o.x+o.width/2,y0=o.y,y1=o.y+o.height;
      m.face("recess", [
        p(x0, y0, backZ),
        p(x1, y0, backZ),
        p(x1, y1, backZ),
        p(x0, y1, backZ),
      ]);
      m.face("recess", [
        p(x0, y0, frontZ),
        p(x0, y0, backZ),
        p(x0, y1, backZ),
        p(x0, y1, frontZ),
      ]);
      m.face("recess", [
        p(x1, y0, backZ),
        p(x1, y0, frontZ),
        p(x1, y1, frontZ),
        p(x1, y1, backZ),
      ]);
      m.face("recess", [
        p(x0, y0, frontZ),
        p(x1, y0, frontZ),
        p(x1, y0, backZ),
        p(x0, y0, backZ),
      ]);
      m.face("recess", [
        p(x0, y1, backZ),
        p(x1, y1, backZ),
        p(x1, y1, frontZ),
        p(x0, y1, frontZ),
      ]);
    }
    m.box("wall",0,0,-halfD+wallDepth/2,w,rear,wallDepth);
    const slope=gable?22*Math.PI/180:12*Math.PI/180;
    for(const side of [-1,1]){
      const x0=side<0?-halfW:halfW-wallDepth;
      const x1=side<0?-halfW+wallDepth:halfW;
      const top=(z:number)=>gable
        ? 4.573-Math.abs(z)*Math.tan(slope)
        : front+(halfD-z)*Math.tan(slope);
      const section=gable
        ? [
            [0, -halfD],
            [top(-halfD), -halfD],
            [top(0), 0],
            [top(halfD), halfD],
            [0, halfD],
          ]
        : [
            [0, -halfD],
            [top(-halfD), -halfD],
            [top(halfD), halfD],
            [0, halfD],
          ];
      modelExtrudeYZ(m,"wall",section as [number,number][],x0,x1);
    }
    // Extend the front/back bands through the corner squares. Adjacent bands
    // then meet on a positive-area face instead of four faces sharing a line.
    const plinth:Parameters<typeof TempleRectilinearUnion.mesh>[1][number][]=[];
    for(const [x0,x1] of [
      [-halfW-0.008, -0.5],
      [0.5, halfW+0.008],
    ])
      plinth.push({ min:p(x0,0,halfD),max:p(x1,0.50,halfD+0.008) });
    plinth.push({
      min:p(-halfW-0.008, 0, -halfD-0.008),
      max:p(halfW+0.008, 0.50, -halfD),
    });
    for(const side of [-1,1]) {
      const x0=side<0?-halfW-0.008:halfW;
      plinth.push({ min:p(x0,0,-halfD),max:p(x0+0.008,0.50,halfD) });
    }
    if(gable){
      for(const section of [
        [
          [3.40, -3.30],
          [4.733, 0],
          [4.573, 0],
          [3.24, -3.30],
        ],
        [
          [4.733, 0],
          [3.40, 3.30],
          [3.24, 3.30],
          [4.573, 0],
        ],
      ]) {
        m.face(
          "roof",
          section.map(([y,z])=> p(4.3, y!, z!)),
        );
        m.face(
          "roof",
          [...section].reverse().map(([y,z])=> p(-4.3, y!, z!)),
        );
        for(let i=0;i<section.length;i++) {
          const [y0,z0]=section[i]!,[y1,z1]=section[(i+1)%section.length]!;
          if(z0===0&&z1===0)continue; // the two slopes share this internal face
          m.face("roof", [
            p(4.3, y0!, z0!),
            p(-4.3, y0!, z0!),
            p(-4.3, y1!, z1!),
            p(4.3, y1!, z1!),
          ]);
        }
      }
    } else{
      modelExtrudeYZ(
        m,
        "roof",
        [
          [5.952, -3.8],
          [4.336, 3.8],
          [4.176, 3.8],
          [5.792, -3.8],
        ],
        -3.3,
        3.3,
      );
    }
    const model=m.model(
      `landscape.neighbor-house.${kind}`,
      `Neighbouring plastered house ${kind}`,
    );
    model.parts.push({
      id:"plinth",
      name:null,
      material:null,
      attachedBone:null,
      transform:null,
      geometry:{
        type:"mesh",
        mesh:TempleRectilinearUnion.mesh("plinth", plinth),
      },
    });
    const roof=model.parts.find(
      (part)=>part.id==="roof",
    )!.geometry as { type:"mesh";mesh:IAutoMovieMesh };
    const { positions }=roof.mesh,normals=roof.mesh.normals!,uvs=roof.mesh.uvs!;
    const edge=gable?3.3:3.8,halfRoofWidth=gable?4.3:3.3;
    for(let i=0;i<positions.length/3;i++){
      const ny=normals[3*i+1]!,nz=normals[3*i+2]!;
      if(ny<0.8||Math.abs(nz)<0.1)continue;
      const x=positions[3*i]!,z=positions[3*i+2]!;
      const rearSlope=gable&&nz<0;
      uvs[2*i]=rearSlope?halfRoofWidth-x:x+halfRoofWidth;
      uvs[2*i+1]=(rearSlope?z+edge:edge-z)/Math.cos(slope);
    }
    return model;
  }
}
