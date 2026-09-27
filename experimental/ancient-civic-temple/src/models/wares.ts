/** Open ceramic wares and unmarked scroll silhouettes from docs/models/wares.md. */
import type { IAutoMovieModel } from "@automovie/interface";
import { ObjectMesh } from "../geometry/object-mesh";

const p=(x:number,y:number,z:number)=>({x,y,z});
const jar=(id:string,name:string,
  outside:readonly (readonly [number,number])[],
  inside:readonly (readonly [number,number])[],
  handles:readonly (readonly [number,number,number,number])[],n:number):IAutoMovieModel=>{
  const m=new ObjectMesh();m.vessel("body",0,0,outside,inside,n);
  for(const [x,y,r,t] of handles)m.loop("handle",x,y,0,r,t,"xy",16);
  return m.model(id,name);
};

export class TempleWares {
  storageJar():IAutoMovieModel {
    return jar("ware.storage-jar","큰 저장 항아리",
      [[0,0.10],[0.40,0.24],[0.58,0.18],[0.64,0.08],[0.70,0.10]],
      [[0.70,0.08],[0.64,0.055],[0.55,0.04]],
      [[-0.20,0.58,0.04,0.0075],[0.20,0.58,0.04,0.0075]],16);
  }

  carryJar():IAutoMovieModel {
    return jar("ware.carry-jar","운반 항아리",
      [[0,0.07],[0.28,0.15],[0.40,0.10],[0.45,0.05],[0.50,0.06]],
      [[0.50,0.04],[0.45,0.03],[0.40,0.025]],
      [[-0.145,0.365,0.065,0.018],[0.145,0.365,0.065,0.018]],16);
  }

  smallVessel():IAutoMovieModel {
    return jar("ware.small-vessel","작은 탁상 용기",
      [[0,0.05],[0.10,0.08],[0.16,0.035],[0.20,0.045]],
      [[0.20,0.028],[0.16,0.022],[0.15,0.018]],
      [[0.0675,0.13,0.0325,0.01]],12);
  }

  offeringBowl():IAutoMovieModel {
    const m=new ObjectMesh();
    m.vessel("bowl",0,0,
      [[0.01,0.04],[0.018,0.085],[0.04,0.104],[0.06,0.11]],
      [[0.06,0.098],[0.043,0.08],[0.027,0.05],[0.015,0.01]],24);
    return m.model("ware.offering-bowl","얕은 봉헌 그릇");
  }

  basket():IAutoMovieModel {
    const m=new ObjectMesh();
    m.vessel("wall",0,0,[[0.02,0.18],[0.305,0.20]],
      [[0.305,0.185],[0.02,0.165]],24);
    m.frustum("floor",0,0,0,0.02,0.18,0.18,24);
    m.loop("rim",0,0.305,0,0.20,0.015,"xz",24);
    for(let i=0;i<10;i++){
      const y=0.02+(i+0.5)*(0.285/10);
      m.loop("wall",0,y,0,0.20+(i%2===0?0.004:0),0.008,"xz",24);
    }
    return m.model("ware.basket","운반 바구니");
  }

  scroll(state:"rolled"|"bundle"|"open"):IAutoMovieModel {
    const m=new ObjectMesh();
    if(state==="open"){
      m.box("sheet",0,0,0,0.25,0.002,0.35);
      for(const z of [-0.1837,0.1837])
        m.rod("sheet",p(-0.125,0.02,z),p(0.125,0.02,z),0.02,16);
    }else{
      const centers=state==="rolled"?[[0,0]]:[[0,-0.03],[0,0.03],[0.03*Math.sqrt(3),0]];
      centers.forEach(([y,z],i)=>{
        const part=state==="rolled"?"sheet":`sheet-${i+1}`;
        m.rod(part,p(-0.14,y!,z!),p(0.14,y!,z!),0.03,16);
        for(const x of [-0.144,0.14])
          m.rod(part,p(x,y!,z!),p(x+0.004,y!,z!),0.012,16);
      });
      m.loop("tie",0,0,0,state==="rolled"?0.0325:0.065,0.0025,"yz",16);
    }
    return m.model(`ware.scroll.${state}`,`두루마리 ${state}`);
  }
}
