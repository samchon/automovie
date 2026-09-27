/** Basic portable silhouettes from docs/models/portable.md; no finish or motion. */
import type { IAutoMovieModel } from "@automovie/interface";
import { ObjectMesh } from "../geometry/object-mesh";

const p=(x:number,y:number,z:number)=>({x,y,z});
const box=(m:ObjectMesh,id:string,x:number,y:number,z:number,w:number,h:number,d:number)=>
  m.box(id,x,y,z,w,h,d);

export class TemplePortable {
  bench(kind:"standard"|"short"):IAutoMovieModel {
    const m=new ObjectMesh(),w=kind==="standard"?1.40:1.10;
    box(m,"seat",0,0.40,0,w,0.06,0.45);
    for(const x of [-w/2+0.17,w/2-0.17]) box(m,"pier",x,0,0,0.12,0.40,0.36);
    return m.model(`portable.bench.${kind}`,`석재 벤치 ${kind}`);
  }

  portableLamp():IAutoMovieModel {
    const m=new ObjectMesh();
    m.frustum("foot",0,0,0,0.035,0.10,0.10,16);
    m.frustum("stem",0,0,0.035,0.23,0.012,0.012,16);
    m.vessel("dish",0,0,[[0.23,0.12],[0.28,0.12]],
      [[0.28,0.105],[0.238,0.105]],16);
    return m.model("portable.lamp","소형 등잔");
  }

  jarRack():IAutoMovieModel {
    const m=new ObjectMesh();box(m,"top",0,0.22,0,1.18,0.06,0.58);
    for(const x of [-0.52,0.52]) for(const z of [-0.22,0.22])
      box(m,"leg",x,0,z,0.07,0.22,0.07);
    for(const x of [-0.29,0.29])m.loop("well",x,0.28,0,0.16,0.006,"xz",16);
    return m.model("portable.jar-rack","항아리 두 자리 받침대");
  }

  carryingYoke():IAutoMovieModel {
    const m=new ObjectMesh();box(m,"beam",0,-0.025,0,1.16,0.05,0.05);
    for(const x of [-0.50,0.50])m.loop("hook",x,-0.085,0,0.05,0.01,"yz",16);
    return m.model("portable.carrying-yoke","양손 운반 멜대");
  }

  handcart():IAutoMovieModel {
    const m=new ObjectMesh();
    box(m,"deck",0,0.43,-0.025,0.60,0.06,1.25);
    m.rod("axle",p(-0.34,0.23,0.10),p(0.34,0.23,0.10),0.018,16);
    for(const x of [-0.34,0.34]){
      m.rod("wheel",p(x-0.04,0.23,0.10),p(x+0.04,0.23,0.10),0.23,16);
      box(m,"support",x<0?-0.24:0.24,0.248,0.10,0.04,0.182,0.04);
    }
    for(const x of [-0.24,0.24])
      m.rod("handle",p(x,0.45,-0.65),p(x,0.70,-1.20),0.02,8);
    return m.model("portable.handcart","작은 손수레");
  }

  bucket():IAutoMovieModel {
    const m=new ObjectMesh();
    m.vessel("body",0,0,[[0,0.11],[0.28,0.15]],
      [[0.28,0.135],[0.02,0.095]],16);
    // The reviewed fixed carry arc remains open above the vessel mouth.
    for(let i=0;i<12;i++){
      const a=Math.PI*i/12,b=Math.PI*(i+1)/12;
      m.rod("handle",p(0.1475*Math.cos(a),0.27+0.17*Math.sin(a),0),
        p(0.1475*Math.cos(b),0.27+0.17*Math.sin(b),0),0.01,8);
    }
    return m.model("portable.bucket","손잡이 있는 물동이");
  }

  planter():IAutoMovieModel {
    const m=new ObjectMesh();
    m.vessel("pot",0,0,[[0,0.14],[0.36,0.21]],
      [[0.36,0.19],[0.03,0.12]],16);
    m.frustum("soil",0,0,0.03,0.27,0.12,0.165,16);
    return m.model("portable.planter","낮은 화분");
  }

  votivePlaque():IAutoMovieModel {
    const m=new ObjectMesh();
    box(m,"base",0,0,0,0.36,0.04,0.14);
    box(m,"slab",0,0.04,0,0.32,0.38,0.035);
    return m.model("portable.votive-plaque","무문양 봉헌판");
  }

  offeringTray():IAutoMovieModel {
    const m=new ObjectMesh();
    box(m,"floor",0,0,0,0.52,0.018,0.34);
    for(const z of [-0.1625,0.1625])box(m,"rim",0,0.018,z,0.52,0.037,0.015);
    for(const x of [-0.2525,0.2525])box(m,"rim",x,0.018,0,0.015,0.037,0.31);
    return m.model("portable.offering-tray","낮은 봉헌 쟁반");
  }

  textile(kind:"standard"|"small"):IAutoMovieModel {
    const m=new ObjectMesh(),w=kind==="standard"?0.55:0.42;
    const d=kind==="standard"?0.40:0.36,t=kind==="standard"?0.045:0.03;
    box(m,"cloth",0,0,0,w,t/4,d);
    box(m,"cloth",0,3*t/4,0,w,t/4,d);
    for(const z of [-d/2+0.0075,d/2-0.0075])
      box(m,"cloth",0,t/4,z,w,t/2,0.015);
    return m.model(`portable.textile.${kind}`,`접은 직물 ${kind}`);
  }

  stylus():IAutoMovieModel {
    const m=new ObjectMesh();
    m.rod("shaft",p(-0.11,0,0),p(0.09,0,0),0.006,8);
    for(let i=0;i<8;i++){
      const a=2*Math.PI*i/8,b=2*Math.PI*(i+1)/8;
      m.face("tip",[p(0.09,0.006*Math.cos(a),0.006*Math.sin(a)),
        p(0.09,0.006*Math.cos(b),0.006*Math.sin(b)),p(0.11,0,0)]);
    }
    return m.model("portable.stylus","필기용 첨필");
  }

  writingTablet():IAutoMovieModel {
    const m=new ObjectMesh();
    box(m,"frame",0,0,0,0.28,0.013,0.22);
    for(const x of [-0.131,0.131])box(m,"frame",x,0.013,0,0.018,0.012,0.22);
    for(const z of [-0.101,0.101])box(m,"frame",0,0.013,z,0.244,0.012,0.018);
    box(m,"writing-face",0,0.013,0,0.244,0.001,0.184);
    return m.model("portable.writing-tablet","글자 없는 필기판");
  }

  ropeCoil():IAutoMovieModel {
    const m=new ObjectMesh();
    for(const r of [0.045,0.075,0.105])m.loop("rope",0,0.008,0,r,0.008,"xz",16);
    box(m,"tie",0,0.016,0,0.024,0.008,0.226);
    return m.model("portable.rope-coil","묶는 끈 뭉치");
  }
}
