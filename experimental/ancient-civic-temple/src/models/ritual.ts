/** Three separate static ritual and storage silhouettes from docs/models/ritual.md. */
import type { IAutoMovieModel } from "@automovie/interface";
import { ObjectMesh } from "../geometry/object-mesh";

/**
 * Three fixed ritual and storage silhouettes with no moving interface.
 * @evidence models/ritual.md This class exposes the censer, floor cushion and single-jar stand as distinct local prototypes.
 * @evidence principles/core/source-units.md#source-scope-preservation Its methods emit only those three H2s; room placement and any service state remain outside these fixed meshes.
 * @evidence principles/core/source-units.md#source-substantive-completion Each call returns named geometric parts rather than a placeholder record, including the censer's separate ash and incense.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The three ritual H2s identify their major sections and fixed parts, sufficient for these approximate blocking silhouettes without a new role or state.
 * @evidence obligations/design/model-sources.md#design-owned-construction Part IDs follow the three H2s while ObjectMesh supplies positions, faces, normals and UVs for the fixed proxy shapes.
 */
export class TempleRitual {
  /**
   * @evidence models/ritual.md#censer A frustum foot and stem carry an open cup with a separate ash disc and three thin upright incense cylinders.
   * @evidence principles/core/source-units.md#source-scope-preservation The emitted foot/stem/cup/ash/incense parts answer the H2's low unlit censer silhouette without selecting a room position.
   * @evidence principles/core/source-units.md#source-substantive-completion The five named parts have actual 20-sided cup and support geometry and three 8-sided sticks.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The censer H2 already fixes the low foot, stem, open cup and three inactive incense stems used by this static proxy.
   */
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

  /**
   * @evidence models/ritual.md#floor-cushion Three stacked boxes make a broad base, smaller seat pad and narrow rear fold above the Y=0 floor origin.
   * @evidence principles/core/source-units.md#source-scope-preservation This fixed seat contains no person or cloth motion and leaves its sanctuary placement to instances.
   * @evidence principles/core/source-units.md#source-substantive-completion Separate base/pad/fold surfaces yield the H2's three-step blocking silhouette up to Y=0.158 m.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The floor-cushion H2 locates all three stacked sections and the rear fold; no additional seating shape was chosen here.
   */
  floorCushion():IAutoMovieModel {
    const m=new ObjectMesh();
    m.box("base",0,0,0,0.46,0.04,0.38);
    m.box("pad",0,0.04,0,0.42,0.10,0.34);
    m.box("fold",0,0.14,-0.14,0.42,0.018,0.06);
    return m.model("ritual.floor-cushion","바닥 좌구");
  }

  /**
   * @evidence models/ritual.md#jar-stand The low conical foot and narrow post support one open annular vessel seat, preserving the void at its center.
   * @evidence principles/core/source-units.md#source-scope-preservation Only the single-jar stand is emitted; no jar or two-place shelf is folded into this prototype.
   * @evidence principles/core/source-units.md#source-substantive-completion The 16-sector foot, post and ring are three actual mesh parts with a 0.34 m top.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The jar-stand H2 fixes the foot, slim riser and upper ring needed for this one-place silhouette.
   */
  jarStand():IAutoMovieModel {
    const m=new ObjectMesh();
    m.frustum("foot",0,0,0,0.05,0.30,0.29,16);
    m.frustum("post",0,0,0.05,0.30,0.06,0.06,16);
    m.vessel("ring",0,0,[[0.30,0.17],[0.34,0.17]],
      [[0.34,0.045],[0.30,0.045]],16);
    return m.model("ritual.jar-stand","항아리 한 자리 받침");
  }
}
