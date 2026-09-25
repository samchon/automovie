/** Fixed courtyard and room furnishings, in their local metre frames. */
import type { IAutoMovieModel } from "@automovie/interface";
import { ObjectMesh } from "../geometry/object-mesh";

export class TempleFixtureModels {
  static build(): IAutoMovieModel[] {
    const result: IAutoMovieModel[] = [];
    const add = (id: string, mesh: ObjectMesh): void => { result.push(mesh.model(`object.${id}`, id)); };
    let m = new ObjectMesh();
    m.frustum("step",0,0,0,0.08,1.15,1.15,48)
      .vessel("rim",0,0,[[0.08,1],[0.50,1],[0.52,0.98]],[[0.52,0.82],[0.12,0.82]],48)
      .frustum("basin-inner",0,0,0.115,0.12,0.82,0.82,48)
      .frustum("water",0,0,0.435,0.44,0.82,0.82,48)
      .frustum("nozzle",0,0,0.12,0.49,0.08,0.08,24)
      .frustum("jet",0,0,0.49,1.09,0.025,0.012,24)
      .loop("ripple",0,0.445,0,0.11,0.004,"xz",48);
    add("fountain",m);

    m = new ObjectMesh();
    m.box("step",0,0,0,2.4,0.15,1.6)
      .box("top",0,0.96,-0.2,1.4,0.14,0.75);
    for (const x of [-0.56,0.56]) m.box("support",x,0.15,-0.2,0.28,0.81,0.67);
    add("altar",m);

    m = new ObjectMesh();
    m.box("plinth",0,0,0.2,1.2,0.6,0.4)
      .box("cap",0,1.8,0.21,1.24,0.14,0.42);
    // The four solid margins leave the niche recess open towards +Z.
    for (const x of [-0.425,0.425]) m.box("body",x,0.6,0.2,0.25,1.2,0.36);
    m.box("recess-frame",0,0.6,0.2,0.6,0.15,0.36).box("recess-frame",0,1.55,0.2,0.6,0.25,0.36)
      .box("recess",0,0.75,0.16,0.6,0.8,0.01);
    add("niche",m);

    m = new ObjectMesh();
    m.frustum("foot",0,0,0,0.08,0.13,0.08)
      .frustum("stem",0,0,0.08,1.10,0.015,0.015)
      .frustum("knop",0,0,0.335,0.365,0.03,0.03)
      .frustum("knop",0,0,0.785,0.815,0.03,0.03)
      .vessel("dish",0,0,[[1.10,0.11],[1.15,0.11]],[[1.15,0.10],[1.106,0.10],[1.106,0.01]],16);
    add("lampstand",m);

    m = new ObjectMesh();
    m.box("top",0,0.72,0,0.75,0.10,2.2);
    for (const z of [-0.75,0.75]) m.box("trestle",0,0,z,0.6,0.72,0.12);
    add("offering-table",m);

    const shelf = (id: string, width: number, depth: number, height: number, levels: number[]): void => {
      const b = new ObjectMesh();
      for (const x of [-width/2+0.02,width/2-0.02]) b.box("side",x,0,depth/2,0.04,height,depth);
      for (const y of levels) b.box("board",0,y,depth/2,width-0.08,0.03,depth);
      add(id,b);
    };
    shelf("display-shelf",1.6,0.4,1.4,[0.10,0.55,1.00,1.37]);
    shelf("display-shelf-office",1.0,0.3,1.1,[0.10,0.60,1.07]);

    const desk = (id: string, width: number, depth: number, height: number): void => {
      const b = new ObjectMesh().box("top",0,height-0.04,0,width,0.04,depth);
      for (const x of [-width/2+0.06,width/2-0.06]) for (const z of [-depth/2+0.06,depth/2-0.06])
        b.box("leg",x,0,z,0.06,height-0.04,0.06);
      for (const z of [-depth/2+0.06,depth/2-0.06]) b.box("stretcher",0,0.15,z,width-0.12,0.05,0.04);
      for (const x of [-width/2+0.06,width/2-0.06]) b.box("stretcher",x,0.15,0,0.04,0.05,depth-0.12);
      add(id,b);
    };
    desk("desk",1.10,0.60,0.75);
    desk("reading-desk",0.90,0.55,0.72);

    m = new ObjectMesh().box("seat",0,0.41,0,0.40,0.04,0.35);
    for (const x of [-0.16,0.16]) for (const z of [-0.135,0.135]) m.box("leg",x,0,z,0.04,0.41,0.04);
    for (const z of [-0.135,0.135]) m.box("stretcher",0,0.12,z,0.32,0.03,0.025);
    for (const x of [-0.16,0.16]) m.box("stretcher",x,0.12,0,0.025,0.03,0.27);
    add("stool",m);

    m = new ObjectMesh();
    for (const x of [-0.88,0.88]) m.box("frame",x,0,0.2,0.04,1.7,0.4);
    for (const y of [0,0.34,0.67,1.00,1.33,1.66]) m.box("board",0,y,0.2,1.72,y===0 || y===1.66 ? 0.04 : 0.03,0.4);
    for (const x of [-0.4375,0,0.4375]) for (const [a,b] of [[0.04,0.34],[0.37,0.67],[0.70,1.00],[1.03,1.33],[1.36,1.66]])
      m.box("divider",x,a,0.2,0.03,b-a,0.4);
    add("scroll-shelf",m);

    m = new ObjectMesh().box("body",0,0,0,0.8,0.44,0.5)
      .box("lid",0,0.445,0,0.82,0.06,0.52)
      .box("hasp",0,0.35,0.265,0.08,0.155,0.01);
    for (const x of [-0.27,0.27]) m.box("strap",x,0.36,-0.26,0.04,0.145,0.01);
    add("chest",m);
    return result;
  }
}
