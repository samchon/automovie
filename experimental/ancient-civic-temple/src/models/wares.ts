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

    m = new ObjectMesh();
    // A single rolled document, with a visible tie and end cores.
    m.rod("sheet",{x:-0.14,y:0,z:0},{x:0.14,y:0,z:0},0.03,16)
      .rod("sheet",{x:-0.144,y:0,z:0},{x:-0.14,y:0,z:0},0.012,12)
      .rod("sheet",{x:0.14,y:0,z:0},{x:0.144,y:0,z:0},0.012,12)
      .loop("tie",0,0,0,0.0325,0.0025,"yz",16);
    add("scroll",m);
    // Open sheet is a distinct state and mesh, not a rotated rolled scroll.
    m = new ObjectMesh().box("sheet",0,0,0,0.25,0.002,0.35)
      .rod("sheet",{x:-0.125,y:0.02,z:-0.184},{x:0.125,y:0.02,z:-0.184},0.02,16)
      .rod("sheet",{x:-0.125,y:0.02,z:0.184},{x:0.125,y:0.02,z:0.184},0.02,16);
    add("open-scroll",m);
    return out;
  }
}
