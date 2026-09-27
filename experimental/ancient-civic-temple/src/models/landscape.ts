/** Site silhouettes from docs/models/landscape.md. Placement remains with instances. */
import type { IAutoMovieModel } from "@automovie/interface";
import { ObjectMesh } from "../geometry/object-mesh";
import { modelEllipsoid, modelExtrudeYZ } from "../geometry/model-source-shapes";

const p=(x:number,y:number,z:number)=>({x,y,z});
export class TempleLandscape {
  cypress():IAutoMovieModel {
    const m=new ObjectMesh();m.frustum("trunk",0,0,0,1.4,0.12,0.08,12);
    for(const [x,y,r,h] of [[0,3,0.75,3.6],[0.10,5.4,0.62,3.4],[-0.10,7.6,0.42,2.8]])
      modelEllipsoid(m,"crown",p(x,y,0),p(r,h/2,r),10,6);
    return m.model("landscape.cypress","좁고 높은 상록수");
  }

  broadTree():IAutoMovieModel {
    const m=new ObjectMesh();m.frustum("trunk",0,0,0,1.6,0.18,0.13,12);
    for(const [x,y,z] of [[-1.05,2.6,-0.55],[1.05,2.6,-0.55],[0,2.6,1.10]])
      m.rod("branch",p(0,1.5,0),p(x,y,z),0.07,8);
    for(const [x,y,z,rx,ry,rz] of [
      [-1.05,3.25,-0.55,1.15,1.35,1.05],[1.05,3.25,-0.55,1.15,1.35,1.05],
      [0,3.55,0.85,1.20,1.65,1.20],[-1.15,3.45,0.95,0.90,1.30,1.10],
      [1.15,3.45,0.95,0.90,1.30,1.10],[0,3.50,-0.95,1.05,1.40,1.15],
    ]) modelEllipsoid(m,"crown",p(x,y,z),p(rx,ry,rz),10,6);
    return m.model("landscape.broad-tree","넓은 수관의 나무");
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
      m.face("blade",[a,b,tip]);m.face("blade",[tip,b,a]);
    }
    return m.model("landscape.grass-tuft","벽 밑 풀");
  }

  neighborHouse(kind:"gable"|"shed"):IAutoMovieModel {
    const m=new ObjectMesh();
    const gable=kind==="gable",w=gable?8:6,d=gable?6:7;
    const front=gable?3.361:4.24,rear=gable?3.361:5.728;
    m.box("wall",0,0,0,w,Math.min(front,rear),d);
    if(!gable)m.box("wall",0,front,-3.35,w,rear-front,0.30);
    m.box("plinth",0,0,0,w,0.50,d);
    if(gable){
      modelExtrudeYZ(m,"roof",[[3.40,-3.30],[4.733,0],[4.573,0],[3.24,-3.30]],-4.3,4.3);
      modelExtrudeYZ(m,"roof",[[4.733,0],[3.40,3.30],[3.24,3.30],[4.573,0]],-4.3,4.3);
    }else{
      modelExtrudeYZ(m,"roof",[[5.952,-3.8],[4.336,3.8],[4.176,3.8],[5.792,-3.8]],-3.3,3.3);
    }
    // The inset slabs keep openings legible without creating an interior.
    m.box("recess",0,0,d/2+0.004,1,2.10,0.008);
    const windowXs=gable?[-2.20,2.20]:[-1.70,1.70];
    for(const x of windowXs) for(const y of gable?[1.35]:[1.25,2.95])
      m.box("recess",x,y,d/2+0.004,0.60,0.80,0.008);
    return m.model(`landscape.neighbor-house.${kind}`,`이웃 회벽집 ${kind}`);
  }
}
