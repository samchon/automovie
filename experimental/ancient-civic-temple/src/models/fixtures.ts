/** Recognizable fixed furniture and ritual fittings from docs/models/fixtures.md.
 * These are static metre prototypes; instances own placement and materials own finish. */
import type { IAutoMovieModel } from "@automovie/interface";
import { ObjectMesh } from "../geometry/object-mesh";

const box=(m:ObjectMesh,id:string,x:number,y:number,z:number,w:number,h:number,d:number)=>
  m.box(id,x,y,z,w,h,d);
const disc=(m:ObjectMesh,id:string,y0:number,y1:number,r:number,n=16)=>
  m.frustum(id,0,0,y0,y1,r,r,n);

export class TempleFixtures {
  fountain():IAutoMovieModel {
    const m=new ObjectMesh();
    disc(m,"step",0,0.08,1.15,48);
    m.vessel("rim",0,0,[[0.08,1],[0.52,1]],[[0.52,0.82],[0.12,0.82]],48);
    disc(m,"basin-inner",0.115,0.12,0.82,48);
    disc(m,"water",0.435,0.44,0.82,48);
    m.loop("ripple",0,0.446,0,0.11,0.004,"xz",48);
    disc(m,"nozzle",0.12,0.49,0.08,48);
    m.frustum("jet",0,0,0.49,1.09,0.025,0.012,48);
    return m.model("fixture.fountain","중정 분수");
  }

  altar():IAutoMovieModel {
    const m=new ObjectMesh();
    box(m,"step",0,0,0,2.4,0.15,1.6);
    box(m,"top",0,0.96,-0.20,1.40,0.14,0.75);
    for(const x of [-0.52,0.52]) box(m,"support",x,0.15,-0.20,0.28,0.81,0.67);
    return m.model("fixture.altar","석조 제단");
  }

  niche():IAutoMovieModel {
    const m=new ObjectMesh();
    box(m,"plinth",0,0,0.20,1.20,0.60,0.40);
    for(const x of [-0.425,0.425]) box(m,"body",x,0.60,0.20,0.25,1.20,0.36);
    box(m,"recess-frame",0,0.60,0.20,0.60,0.15,0.36);
    box(m,"recess-frame",0,1.55,0.20,0.60,0.25,0.36);
    box(m,"recess",0,0.75,0.09,0.60,0.80,0.14);
    box(m,"cap",0,1.80,0.21,1.24,0.14,0.42);
    return m.model("fixture.niche","무문양 감실");
  }

  lampstand():IAutoMovieModel {
    const m=new ObjectMesh();
    m.frustum("foot",0,0,0,0.06,0.13,0.08,16); disc(m,"foot",0.06,0.08,0.08);
    disc(m,"stem",0.08,1.10,0.015);
    for(const y of [0.335,0.785]) disc(m,"knop",y,y+0.03,0.03);
    m.vessel("dish",0,0,[[1.10,0.11],[1.15,0.11]],
      [[1.15,0.10],[1.106,0.10]],16);
    return m.model("fixture.lampstand","금속 등잔대");
  }

  offeringTable():IAutoMovieModel {
    const m=new ObjectMesh();
    box(m,"top",0,0.72,0,0.75,0.10,2.20);
    for(const z of [-0.75,0.75]) box(m,"trestle",0,0,z,0.60,0.72,0.12);
    return m.model("fixture.offering-table","봉헌 탁자");
  }

  displayShelf(kind:"offering"|"administration"):IAutoMovieModel {
    const m=new ObjectMesh();
    const wide=kind==="offering",w=wide?1.60:1.00,d=wide?0.40:0.30,h=wide?1.40:1.20;
    const half=w/2,side=wide?0.04:0.04;
    for(const x of [-half+side/2,half-side/2]) box(m,"side",x,0,d/2,side,h,d);
    for(const y of wide?[0.10,0.55,1.00,1.37]:[0.10,0.65,1.17])
      box(m,"board",0,y,d/2,w-2*side,0.03,d);
    return m.model(`fixture.display-shelf.${kind}`,`벽 선반 ${kind}`);
  }

  desk(kind:"writing"|"reading"):IAutoMovieModel {
    const m=new ObjectMesh(),writing=kind==="writing";
    const w=writing?1.10:0.90,d=writing?0.60:0.55,h=writing?0.75:0.72;
    box(m,"top",0,h-0.04,0,w,0.04,d);
    const lx=w/2-0.06,lz=d/2-0.06;
    for(const x of [-lx,lx]) for(const z of [-lz,lz])
      box(m,"leg",x,0,z,0.06,h-0.04,0.06);
    for(const z of [-lz,lz]) box(m,"stretcher",0,0.15,z,2*lx,0.05,0.04);
    for(const x of [-lx,lx]) box(m,"stretcher",x,0.15,0,0.04,0.05,2*lz);
    return m.model(`fixture.desk.${kind}`,`작업 탁자 ${kind}`);
  }

  stool():IAutoMovieModel {
    const m=new ObjectMesh();box(m,"seat",0,0.41,0,0.40,0.04,0.35);
    for(const x of [-0.16,0.16]) for(const z of [-0.135,0.135])
      box(m,"leg",x,0,z,0.04,0.41,0.04);
    for(const z of [-0.135,0.135]) box(m,"stretcher",0,0.12,z,0.32,0.03,0.025);
    for(const x of [-0.16,0.16]) box(m,"stretcher",x,0.12,0,0.025,0.03,0.27);
    return m.model("fixture.stool","스툴");
  }

  scrollShelf():IAutoMovieModel {
    const m=new ObjectMesh();
    for(const x of [-0.88,0.88]) box(m,"frame",x,0,0.20,0.04,1.70,0.40);
    for(const [y,t] of [[0,0.04],[0.34,0.03],[0.67,0.03],[1,0.03],[1.33,0.03],[1.66,0.04]])
      box(m,"board",0,y,0.20,1.72,t,0.40);
    for(const x of [-0.4375,0,0.4375])
      for(const [low,high] of [[0.04,0.34],[0.37,0.67],[0.70,1],[1.03,1.33],[1.36,1.66]])
        box(m,"divider",x,low,0.20,0.03,high-low,0.40);
    return m.model("fixture.scroll-shelf","기록 선반");
  }

  chest():IAutoMovieModel {
    const m=new ObjectMesh();
    box(m,"body",0,0,0,0.80,0.44,0.50);
    box(m,"lid",0,0.445,0,0.82,0.06,0.52);
    box(m,"hasp",0,0.35,0.255,0.08,0.155,0.01);
    for(const x of [-0.27,0.27]) box(m,"strap",x,0.36,-0.2575,0.04,0.145,0.005);
    for(const x of [-0.40,0.40]) for(const z of [-0.25,0.25])
      box(m,"strap",x,0,z,0.04,0.44,0.005);
    return m.model("fixture.chest","보관 궤");
  }
}
