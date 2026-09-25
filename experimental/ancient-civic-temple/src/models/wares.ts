/** Ceramic, woven, and paper objects shared by temple rooms. */
import type { IAutoMovieModel } from "@automovie/interface";
import { ObjectMesh } from "../geometry/object-mesh";

export class TempleWareModels {
  static build(): IAutoMovieModel[] {
    const out: IAutoMovieModel[] = [];
    const add = (id: string, m: ObjectMesh): void => { out.push(m.model(`object.${id}`, id)); };
    let m = new ObjectMesh();
    m.vessel("body",0,0,[[0,0.10],[0.40,0.24],[0.58,0.18],[0.64,0.08],[0.70,0.10]],
      [[0.70,0.08],[0.64,0.055],[0.55,0.04]],16);
    for (const x of [-0.20,0.20]) m.loop("handle",x,0.58,0,0.04,0.0075,"xy",16);
    add("storage-jar",m);

    m = new ObjectMesh();
    m.vessel("body",0,0,[[0,0.07],[0.28,0.15],[0.40,0.10],[0.45,0.05],[0.50,0.06]],
      [[0.50,0.04],[0.45,0.03],[0.40,0.025]],16);
    for (const sign of [-1,1]) {
      m.rod("handle",{x:sign*0.15,y:0.28,z:0},{x:sign*0.20,y:0.31,z:0},0.018)
        .rod("handle",{x:sign*0.20,y:0.31,z:0},{x:sign*0.20,y:0.42,z:0},0.018)
        .rod("handle",{x:sign*0.20,y:0.42,z:0},{x:sign*0.06,y:0.45,z:0},0.018);
    }
    add("carry-jar",m);

    m = new ObjectMesh().vessel("body",0,0,[[0,0.05],[0.10,0.08],[0.16,0.035],[0.20,0.045]],
      [[0.20,0.028],[0.16,0.022],[0.15,0.018]],12)
      .rod("handle",{x:0.08,y:0.10,z:0},{x:0.10,y:0.13,z:0},0.01)
      .rod("handle",{x:0.10,y:0.13,z:0},{x:0.035,y:0.16,z:0},0.01);
    add("small-vessel",m);

    m = new ObjectMesh().vessel("bowl",0,0,[[0,0.04],[0.01,0.04],[0.018,0.085],[0.04,0.104],[0.06,0.11]],
      [[0.06,0.098],[0.043,0.08],[0.027,0.05],[0.015,0.01]],24);
    add("offering-bowl",m);

    m = new ObjectMesh().vessel("wall",0,0,[[0,0.18],[0.02,0.18],[0.305,0.20]],
      [[0.305,0.185],[0.02,0.165]],24)
      .frustum("floor",0,0,0.018,0.02,0.165,0.165,24)
      .loop("rim",0,0.305,0,0.20,0.015,"xz",24);
    for (let i=0;i<24;++i) {
      const angle=2*Math.PI*i/24;
      m.rod("wall",{x:0.187*Math.cos(angle),y:0.02,z:0.187*Math.sin(angle)},
        {x:0.207*Math.cos(angle),y:0.305,z:0.207*Math.sin(angle)},0.004,6);
    }
    add("basket",m);

    const rolledSheet = (mesh: ObjectMesh, yy: number, zz: number, part = "sheet"): ObjectMesh => mesh
      .rod(part,{x:-0.14,y:yy,z:zz},{x:0.14,y:yy,z:zz},0.03,16)
      .rod(part,{x:-0.144,y:yy,z:zz},{x:-0.14,y:yy,z:zz},0.012,12)
      .rod(part,{x:0.14,y:yy,z:zz},{x:0.144,y:yy,z:zz},0.012,12);
    // A single rolled document, with a visible tie and end cores.
    m = rolledSheet(new ObjectMesh(),0,0).loop("tie",0,0,0,0.0325,0.0025,"yz",16);
    add("scroll",m);
    // Three touching rolls share one rounded triangular outer cord.
    const centres: readonly (readonly [number, number])[] = [[0,-0.03],[0,0.03],[0.03*Math.sqrt(3),0]];
    m = new ObjectMesh();
    for (const [index,[yy,zz]] of centres.entries()) rolledSheet(m,yy,zz,`sheet-${index+1}`);
    const normal = (a: readonly [number, number], b: readonly [number, number]): readonly [number, number] => {
      const dy = b[0]-a[0], dz = b[1]-a[1], length = Math.hypot(dy,dz);
      return [-dz/length,dy/length];
    };
    const tiePath: { x: number; y: number; z: number }[] = [];
    for (let i=0;i<centres.length;i++) {
      const current = centres[i]!, previous = centres[(i+centres.length-1)%centres.length]!,
        next = centres[(i+1)%centres.length]!;
      const start = normal(previous,current), end = normal(current,next);
      const from = Math.atan2(start[1],start[0]);
      let to = Math.atan2(end[1],end[0]);
      while (to >= from) to -= 2*Math.PI;
      for (let step=0;step<=16;step++) {
        const angle = from+(to-from)*step/16;
        tiePath.push({x:0,y:current[0]+0.0325*Math.cos(angle),z:current[1]+0.0325*Math.sin(angle)});
      }
    }
    tiePath.push(tiePath[0]!);
    let uStart = 0;
    for (let i=0;i<tiePath.length-1;i++) {
      const a=tiePath[i]!, b=tiePath[i+1]!;
      m.rod("tie",a,b,0.0025,8,uStart);
      uStart += Math.hypot(b.y-a.y,b.z-a.z);
    }
    add("scroll-bundle",m);
    // Open sheet is a distinct state and mesh, not a rotated rolled scroll.
    m = new ObjectMesh().box("sheet",0,0,0,0.25,0.002,0.35)
      .rod("sheet",{x:-0.125,y:0.02,z:-0.184},{x:0.125,y:0.02,z:-0.184},0.02,16)
      .rod("sheet",{x:-0.125,y:0.02,z:0.184},{x:0.125,y:0.02,z:0.184},0.02,16);
    add("open-scroll",m);
    return out;
  }
}
