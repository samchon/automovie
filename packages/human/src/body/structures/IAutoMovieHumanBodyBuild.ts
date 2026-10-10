import type {
  IAutoMovieModel,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieHumanBodySourceRigResult } from "../anatomy/articulation/rig/IAutoMovieHumanBodySourceRigResult";
import type { IHumanBodySourceQuantityReading } from "../anatomy/assembly/IHumanBodySourceQuantityReading";
import type { IHumanBodyLayerObservation } from "../anatomy/layer/IHumanBodyLayerObservation";
import type { IAutoMovieHumanConstructionAdmission } from "../../common/structures/IAutoMovieHumanConstructionAdmission";
import type { IAutoMovieHumanBodyBasisDocument } from "./IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyPosedSurface } from "./IAutoMovieHumanBodyPosedSurface";
import type { IAutoMovieHumanBodyBuildBone } from "./rig/IAutoMovieHumanBodyBuildBone";

/**
 * Everything one evaluation of a body document produces.
 *
 * The face builder returns a model alone because a face has no rig. A body
 * evaluation also settles where the joints ended up, and the tools that check
 * it (rigid-segment residuals, arc versus chord, range comparisons) need those
 * transforms rather than re-deriving them from the skin. `model` is the posed,
 * skinned static model the viewer draws and the static exporter accepts: its
 * parts carry no bone bindings and it has no skeleton, because the pose has
 * already been applied. `skeleton` is the rest skeleton of the shaped body,
 * and `bones` pairs each joint's rest and posed world transforms. The posed
 * shared skin stays beside the render model in its original basis vertex
 * order: garment cutting and contact partitioning read one connected answer
 * before UV seams and materials duplicate its corners. Its arrays belong to
 * this build and are not a second stored body document.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBuild {
  /**
   * This evaluation's admitted document, with anatomical targets solved into
   * the actual channel weights consumed by skin, rig and appearance, and
   * source-reference thigh goals lowered to the same prepared source pose
   * before correctives and pelvic coordination. It is
   * an independently owned snapshot, not a replacement for the caller's
   * authored document. Downstream endpoint evaluation can read this same
   * result to avoid recomputing skin from the caller's pre-solve weights.
   */
  evaluatedDocument: IAutoMovieHumanBodyBasisDocument;

  /** Posed static model: skinless parts, no skeleton, validated as a resident model. */
  model: IAutoMovieModel;

  /**
   * The same evaluation's source-region model before a garment material split.
   * Contact segmentation checks its original UV/source population against
   * posedSurfaces with the same strict incidence, position and normal guards.
   * It retains the evaluated frame, material identities and physical sources;
   * no geometry is regenerated. Omission means model still has that original
   * region population. This derived record is not another authored document
   * and is never appended to the rendered or exported model.
   */
  sourceSkinModel?: IAutoMovieModel;

  /** Posed connected skin per basis surface, before render/material splitting. */
  posedSurfaces: IAutoMovieHumanBodyPosedSurface[];

  /** Rest skeleton of the shaped body, before the document's pose. */
  skeleton: IAutoMovieSkeleton;

  /** Rest and posed world transforms per joint, in the basis frame. */
  bones: IAutoMovieHumanBodyBuildBone[];

  /**
   * The registered anatomical graph's same rest/posed bones, posed attachment
   * sites and public projections, when that source is present. These frames
   * accompany the geometry and take the same final root placement; omission
   * denotes a basis without this anatomical assembly.
   */
  anatomicalRig?: IAutoMovieHumanBodySourceRigResult;

  /**
   * Source-bound quantities from the same anatomical part shape evaluation.
   * Target volumes are measured on the actual pre-pose boundary in mL;
   * observed records preserve their acquisition and unavailable comparison.
   * The final Float32 field separately reads the actual posed output boundary.
   * These geometric source readings certify neither living muscle volumes nor
   * clinical tissue segmentation.
   * An empty array means the registered assembly consumed no quantities;
   * omission means this basis has no evaluated anatomical assembly.
   */
  anatomicalQuantities?: readonly IHumanBodySourceQuantityReading[];

  /**
   * Each registered skin's original limited offset observations on the final
   * construction. Omission means no field was constructed, not accepted tissue.
   * These native populations remain separate from the face's part census.
   */
  layerObservations?: readonly IHumanBodyLayerObservation[];

  /**
   * Limited skin-layer admission, separate from face and source containment.
   * Rejected constructions retain their actual model for explicit inspection;
   * ordinary body/person calls refuse them. Omission denotes no layer field.
   */
  layerAdmission?: IAutoMovieHumanConstructionAdmission;

  /** Shaped landmark positions by id, after channels and correctives. */
  landmarks: Record<string, IAutoMovieVector3>;

  /**
   * Fixed source-neutral ground Y used by an explicit lowest-foot placement,
   * metres. Omission retains the unplaced build's shaped source-ground
   * reading. The placement owner records this plane independently of joint
   * landmarks, so a leg-length edit cannot move the requested floor.
   */
  groundPlaneHeightMetres?: number;
}
