/** Three separate static ritual and storage silhouettes from docs/models/ritual.md. */
import type { IAutoMovieModel } from "@automovie/interface";
import { ObjectMesh } from "../geometry/object-mesh";

export class TempleRitual {
  censer():IAutoMovieModel {
    const m=new ObjectMesh();
    m.frustum("foot",0,0,0,0.04,0.11,0.09,20);
    m.frustum("stem",0,0,0.04,0.16,0.025,0.025,20);
    m.vessel("cup",0,0,[[0.16,0.075],[0.23,0.105]],
      [[0.23,0.09],[0.18,0.065]],20);
    m.frustum("ash",0,0,0.18,0.19,0.064,0.064,20);
    for(const x of [-0.04,0,0.04])
      m.frustum("incense",x,0,0.19,0.35,0.003,0.003,8);
    return m.model("ritual.censer","낮은 향로");
  }

  floorCushion():IAutoMovieModel {
    const m=new ObjectMesh();
    m.box("base",0,0,0,0.46,0.04,0.38);
    m.box("pad",0,0.04,0,0.42,0.10,0.34);
    m.box("fold",0,0.14,-0.14,0.42,0.018,0.06);
    return m.model("ritual.floor-cushion","바닥 좌구");
  }

  jarStand():IAutoMovieModel {
    const m=new ObjectMesh();
    m.frustum("foot",0,0,0,0.05,0.30,0.29,16);
    m.frustum("post",0,0,0.05,0.30,0.06,0.06,16);
    m.vessel("ring",0,0,[[0.30,0.17],[0.34,0.17]],
      [[0.34,0.045],[0.30,0.045]],16);
    return m.model("ritual.jar-stand","항아리 한 자리 받침");
  }
}
