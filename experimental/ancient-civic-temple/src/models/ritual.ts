/** Three separate static ritual and storage silhouettes from docs/models/ritual.md. */
import type { IAutoMovieModel } from "@automovie/interface";
import { ObjectMesh } from "../geometry/object-mesh";

/**
 * Three fixed ritual and storage silhouettes with no moving interface.
 * @evidence models/ritual.md This class exposes the censer, floor cushion and single-jar stand as distinct local prototypes.
 * @evidenceReview models/ritual.md #305e0f6 The three H2s map to censer, floorCushion and jarStand with distinct IDs and part sets rather than one interchangeable ritual mesh.
 * @evidence principles/core/source-units.md#source-scope-preservation Its methods emit only those three H2s; room placement and any service state remain outside these fixed meshes.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 No method accepts a room transform, combustion setting or seating state; each returns one local fixed form.
 * @evidence principles/core/source-units.md#source-substantive-completion Each call returns named geometric parts rather than a placeholder record, including the censer's separate ash and incense.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f ObjectMesh emits all three silhouettes with mesh part IDs, including censer ash and three separate incense rods.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The three ritual H2s identify their major sections and fixed parts, sufficient for these approximate blocking silhouettes without a new role or state.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The ritual H2s already separate vessel, cushion and one-jar support roles, so these rough builders required no extra fixed-state choice.
 * @evidence obligations/design/model-sources.md#design-owned-construction Part IDs follow the three H2s while ObjectMesh supplies positions, faces, normals and UVs for the fixed proxy shapes.
 * @evidenceReview obligations/design/model-sources.md#design-owned-construction #535df68 Frustum, vessel and box primitives emit the H2's named surfaces and attributes instead of an opaque ready-made ritual asset.
 */
export class TempleRitual {
  /**
   * @evidence models/ritual.md#censer A frustum foot and stem carry an open cup with a separate ash disc and three thin upright incense cylinders.
   * @evidenceReview models/ritual.md#censer #97e65f2 The low 20-sided support reaches an open cup, an ash disc sits inside it, and three thin rods rise from the cup as the H2 requires.
   * @evidence principles/core/source-units.md#source-scope-preservation The emitted foot/stem/cup/ash/incense parts answer the H2's low unlit censer silhouette without selecting a room position.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 censer() keeps its five parts local and static; there is no flame or sanctuary-coordinate input.
   * @evidence principles/core/source-units.md#source-substantive-completion The five named parts have actual 20-sided cup and support geometry and three 8-sided sticks.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The vessel profile leaves a cup opening, while the three 8-sector incense frusta remain visible above the separate ash part.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The censer H2 already fixes the low foot, stem, open cup and three inactive incense stems used by this static proxy.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The H2 fixes cup opening and three inactive stems, so source did not invent a smoke or burn state.
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
   * @evidenceReview models/ritual.md#floor-cushion #e703b08 The base, smaller pad and rear Z-negative fold stack from Y=0 to 0.158 in the H2's three-part outline.
   * @evidence principles/core/source-units.md#source-scope-preservation This fixed seat contains no person or cloth motion and leaves its sanctuary placement to instances.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 floorCushion() has no occupant, cloth deformation or world placement, returning only a local seat proxy.
   * @evidence principles/core/source-units.md#source-substantive-completion Separate base/pad/fold surfaces yield the H2's three-step blocking silhouette up to Y=0.158 m.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Three separately named boxes preserve the narrower raised pad and rear fold above the wider base.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The floor-cushion H2 locates all three stacked sections and the rear fold; no additional seating shape was chosen here.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The H2 already supplies three cushion layers and fold placement; the static boxes add no cushion articulation.
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
   * @evidenceReview models/ritual.md#jar-stand #8465fe8 The tapering foot, slim post and hollow vessel ring make a single jar opening rather than the separate two-place rack.
   * @evidence principles/core/source-units.md#source-scope-preservation Only the single-jar stand is emitted; no jar or two-place shelf is folded into this prototype.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 jarStand() emits one support centered at the origin with no storage jar mesh or second vessel site.
   * @evidence principles/core/source-units.md#source-substantive-completion The 16-sector foot, post and ring are three actual mesh parts with a 0.34 m top.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The three 16-sector parts rise continuously from the foot to the ring lip at Y=0.34 and keep the center open.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The jar-stand H2 fixes the foot, slim riser and upper ring needed for this one-place silhouette.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The jar-stand H2 sets the one-place ring and post proportions; source adds neither a second recess nor a movable lid.
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
