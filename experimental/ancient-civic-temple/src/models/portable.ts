/** Portable stone, wood, metal, textile, and working objects. */
import type { IAutoMovieModel } from "@automovie/interface";
import { jarRackBoardParts } from "../geometry/jar-rack-board";
import { ObjectMesh } from "../geometry/object-mesh";

export class TemplePortableModels {
  static build(): IAutoMovieModel[] {
    const out: IAutoMovieModel[] = [];
    const add = (id: string, m: ObjectMesh): void => { out.push(m.model(`object.${id}`, id)); };
    let m = new ObjectMesh().box("seat",0,0.40,0,1.40,0.06,0.45);
    for (const x of [-0.59,0.59]) m.box("pier",x,0,0,0.12,0.40,0.36);
    add("bench",m);

    m = new ObjectMesh().frustum("foot",0,0,0,0.035,0.10,0.10)
      .frustum("stem",0,0,0.035,0.23,0.012,0.012)
      .vessel("dish",0,0,[[0.23,0.11],[0.28,0.12]],[[0.28,0.10],[0.245,0.10]],16);
    add("portable-lamp",m);

    m = new ObjectMesh();
    for (const x of [-0.52,0.52]) for (const z of [-0.22,0.22])
      m.box("leg",x,0,z,0.07,0.22,0.07);
    const rack = m.model("object.jar-rack","jar-rack");
    const [top, well] = jarRackBoardParts();
    out.push({ ...rack, parts: [top, ...rack.parts, well] });

    m = new ObjectMesh().box("beam",0,-0.025,0,1.16,0.05,0.05);
    for (const x of [-0.5,0.5]) m.loop("hook",x,-0.085,0,0.05,0.01,"yz");
    add("carrying-yoke",m);

    m = new ObjectMesh().box("deck",0,0.43,-0.025,0.60,0.06,1.25)
      .rod("axle",{x:-0.34,y:0.23,z:0.10},{x:0.34,y:0.23,z:0.10},0.018,16);
    for (const sign of [-1,1]) m.rod("wheel",
      {x:sign*0.30,y:0.23,z:0.10},{x:sign*0.38,y:0.23,z:0.10},0.23,16);
    for (const x of [-0.24,0.24]) m.rod("handle",
      {x,y:0.45,z:-0.659},{x,y:0.70,z:-1.191},0.02,8);
    add("handcart",m);

    m = new ObjectMesh().vessel("body",0,0,[[0,0.11],[0.28,0.15]],
      [[0.28,0.135],[0.02,0.095]],16);
    for (let i = 0; i < 12; ++i) {
      const a = Math.PI - Math.PI*i/12, b = Math.PI - Math.PI*(i+1)/12;
      const at = (t: number) => ({ x: 0.15*Math.cos(t), y: 0.27+0.17*Math.sin(t), z: 0 });
      m.rod("handle",at(a),at(b),0.01,8);
    }
    m.rod("handle",{x:-0.16,y:0.27,z:0},{x:-0.14,y:0.27,z:0},0.01,8)
      .rod("handle",{x:0.14,y:0.27,z:0},{x:0.16,y:0.27,z:0},0.01,8);
    add("bucket",m);

    m = new ObjectMesh().vessel("pot",0,0,[[0,0.14],[0.36,0.21]],
      [[0.36,0.19],[0.03,0.12]],16)
      .frustum("soil",0,0,0.269,0.270,0.18,0.18,16);
    add("planter",m);

    m = new ObjectMesh().box("base",0,0,0,0.36,0.04,0.14)
      .box("slab",0,0.04,0,0.32,0.38,0.035);
    add("votive-plaque",m);

    m = new ObjectMesh().box("floor",0,0,0,0.52,0.018,0.34);
    for (const x of [-0.25,0.25]) m.box("rim",x,0.018,0,0.02,0.037,0.34);
    for (const z of [-0.16,0.16]) m.box("rim",0,0.018,z,0.50,0.037,0.02);
    add("offering-tray",m);

    m = new ObjectMesh().box("cloth",0,0,0,0.55,0.015,0.40)
      .box("cloth",0,0.015,0.05,0.52,0.015,0.30)
      .box("cloth",0,0.030,0.08,0.49,0.015,0.24);
    add("textile",m);

    m = new ObjectMesh().rod("shaft",{x:-0.11,y:0,z:0},{x:0.09,y:0,z:0},0.006)
      .frustum("tip",0.10,0,-0.006,0.006,0.006,0.001,8);
    add("stylus",m);

    m = new ObjectMesh().box("frame",0,0,0,0.28,0.025,0.22)
      .box("writing-face",0,0.013,0,0.244,0.001,0.184);
    add("writing-tablet",m);

    m = new ObjectMesh();
    for (const radius of [0.08,0.092,0.105]) m.loop("rope",0,0.008,0,radius,0.008,"xz");
    m.box("tie",0,0.016,0,0.024,0.008,0.226);
    add("rope-coil",m);
    return out;
  }
}
