/** Distinct ritual and support silhouettes that reused household props cannot express. */
import type { IAutoMovieModel } from "@automovie/interface";
import { ObjectMesh } from "../geometry/object-mesh";

export class TempleRitualModels {
  static build(): IAutoMovieModel[] {
    const out: IAutoMovieModel[] = [];
    let m = new ObjectMesh().frustum("foot",0,0,0,0.04,0.11,0.09)
      .frustum("stem",0,0,0.04,0.16,0.025,0.025)
      .vessel("cup",0,0,[[0.16,0.075],[0.23,0.105]],[[0.23,0.09],[0.18,0.065]],20)
      .frustum("ash",0,0,0.185,0.19,0.064,0.064,20);
    for (const x of [-0.04,0,0.04]) m.rod("incense",{x,y:0.19,z:0},{x,y:0.35,z:0},0.003,8);
    out.push(m.model("object.censer","censer"));

    m = new ObjectMesh().box("base",0,0,0,0.46,0.04,0.38)
      .box("pad",0,0.04,0,0.42,0.10,0.34)
      .box("fold",0,0.14,-0.14,0.42,0.018,0.06);
    out.push(m.model("object.floor-cushion","floor-cushion"));

    m = new ObjectMesh().frustum("foot",0,0,0,0.05,0.30,0.29,16)
      .frustum("post",0,0,0.05,0.30,0.06,0.06,16)
      .frustum("ring",0,0,0.30,0.34,0.17,0.17,16);
    out.push(m.model("object.jar-stand","jar-stand"));
    return out;
  }
}
