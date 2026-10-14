import type { IAutoMovieMaterial } from "@automovie/interface";

import type { IAutoMovieHumanSkinLandmark } from "../../common/basis/IAutoMovieHumanSkinLandmark";
import type { IAutoMovieHumanSkinRegion } from "../../common/basis/IAutoMovieHumanSkinRegion";
import type { IAutoMovieHumanBodyAnatomicalAssembly } from "../anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import type { IAutoMovieHumanBodyAtlasPartResource } from "../anatomy/atlas/IAutoMovieHumanBodyAtlasPartResource";
import type { IAutoMovieHumanBodyBasisCoupling } from "./rig/IAutoMovieHumanBodyBasisCoupling";
import type { IAutoMovieHumanBodyBasisJoint } from "./rig/IAutoMovieHumanBodyBasisJoint";
import type { IAutoMovieHumanBodyBasisLandmarks } from "./rig/IAutoMovieHumanBodyBasisLandmarks";
import type { IAutoMovieHumanBodyBasisPelvifemoral } from "./rig/IAutoMovieHumanBodyBasisPelvifemoral";
import type { IAutoMovieHumanBodyToeRay } from "./rig/IAutoMovieHumanBodyToeRay";
import type { IAutoMovieHumanBodyBasisChannel } from "./shape/IAutoMovieHumanBodyBasisChannel";
import type { IAutoMovieHumanBodyBasisCorrective } from "./shape/IAutoMovieHumanBodyBasisCorrective";
import type { IAutoMovieHumanBodyBasisSurface } from "./surface/IAutoMovieHumanBodyBasisSurface";

/**
 * An externally supplied connected body below the neck, with the landmarks, joints and endpoint rows that shape and perform it. Coordinates and sparse differences use metres in the common right-handed +Y-up, +Z-forward frame. The package bundles no person's mesh.
 *
 * A basis revision owns its source topology, shared-boundary identity, endpoints, landmarks, joints, weights and appearance policies. Changing any of these dependencies requires a new identity. Face/body composition must retain actual shared-source correspondence; matching positions or generation labels alone do not establish a compatible boundary.
 *
 * The builder admits the basis and document, resolves named anatomical targets and source-reference goals, computes channel weights and corrective activations, evaluates shaped landmarks, resolves the posed rig, then evaluates appearance and connected skin. Internal assembly, final placement and garment composition use those evaluated authorities. Neither endpoint interpolation nor skinning proves physiological range, contact or tissue-volume conservation for arbitrary combinations.
 *
 * Every declared endpoint must move resident skin or landmarks, or have actual external contributions supplied by the composition owner and verified against the exact same-generation source. A population may omit rows only for an endpoint that does not move it. Declared unavailable targets refuse nonzero activation instead of treating missing dependencies as zero.
 *
 * Record-key identities cannot name inherited Object properties; admission enforces this representation constraint before evaluation. Genital and nipple geometry remain excluded until a product decision reopens them. Clothing beyond basic underwear belongs to production assets, hair to the face groom, and ethnicity axes remain outside this basis.
 *
 * @evidence contracts/common.md#principled-implementation One revision binds externally supplied shared skin, sparse endpoints, landmarks and rig policy in a common metre frame.
 * @evidence contracts/common.md#clear-and-simple-design The immutable basis owns source geometry and coordinate conventions while compact documents carry edits.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts External source arrays supply no bundled person's mesh and do not certify internal tissue anatomy or arbitrary-pose clearance.
 * @evidence contracts/common.md#meaningful-documentation The prose states revision invalidation, source ownership, evaluation stages and representation limitations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The connected body basis contract is a type declaration without executable processing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The connected body basis contract coordinates no cross-call computation or caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The connected body basis contract type itself acquires no retained runtime resources.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBasis {
  /** Immutable revision identity, also stored in every dependent document. */
  id: string;

  /**
   * Offline acquired bone surfaces with rights and exact reference placement.
   * Default builds omit them; document `anatomicalInspection` selects their
   * named IDs. These reference atlas surfaces certify no clinical resolution
   * or personal skin/tissue registration and cannot be scaled to another shape.
   */
  anatomicalCandidates?: IAutoMovieHumanBodyAtlasPartResource[];

  /**
   * One registered anatomical rest graph and acquired/authored tissue surfaces.
   * Every source part consumes that graph's actual posed result; this source
   * does not change independently validated clinical resolution. Registration
   * names this exact basis/shape and is not inferred from a part's bbox.
   */
  anatomicalAssembly?: IAutoMovieHumanBodyAnatomicalAssembly;

  /** Ordered dimensionless shape controls. */
  channels: IAutoMovieHumanBodyBasisChannel[];

  /**
   * Declared targets whose source dependencies remain incomplete on this
   * revision. Their retained rows are not a complete field: any nonzero
   * channel gain or corrective activation refuses before applying rows.
   * Zero activation can replay the neutral without treating missing source
   * values as zero. IDs must belong to the declared target population and
   * be unique. Omission preserves legacy behavior and certifies no source,
   * anatomical, cohort or contact validity.
   */
  unavailableTargets?: string[];

  /** Authored corrective driver and endpoint. */
  correctives?: IAutoMovieHumanBodyBasisCorrective[];

  /** Shape-dependent joint landmarks in metres. */
  landmarks: IAutoMovieHumanBodyBasisLandmarks;

  /**
   * Named points of the skin, each a vertex of one surface. Measurement
   * rules and the underwear name a skin point (`nipple-left`,
   * `neck-anterior-midline`) instead of a vertex number, which belongs to
   * one basis's topology; a consumer naming a point this basis does not
   * declare refuses by that name. Omission declares none.
   */
  skinLandmarks?: Record<string, IAutoMovieHumanSkinLandmark>;

  /**
   * Named areas of the skin, each a set of vertices of one surface, for
   * measurement rules that keep a feature out of a search.
   * Rules name an area instead of listing vertices, which belong to one
   * basis's topology; a rule naming an area this basis does not declare
   * refuses by that name. Omission declares none.
   */
  skinRegions?: Record<string, IAutoMovieHumanSkinRegion>;

  /**
   * The skeleton as data: one entry per humanoid slot the body carries, in an
   * order where every parent precedes its children. The builder projects these
   * onto `IAutoMovieSkeleton` after the shape has moved the landmarks.
   */
  joints: IAutoMovieHumanBodyBasisJoint[];

  /**
   * Optional toe ray phalanges beyond the humanoid set, parent before child
   * (`IAutoMovieHumanBodyToeRay`). Omission keeps one toes bone per foot, and
   * documents posing rays refuse by name.
   */
  toeRays?: IAutoMovieHumanBodyToeRay[];

  /** Declared clinical joint coupling. */
  couplings?: IAutoMovieHumanBodyBasisCoupling[];

  /** Declared pelvic and lumbar rhythm. */
  pelvifemoral?: IAutoMovieHumanBodyBasisPelvifemoral;

  /** Connected skin surfaces in the shared frame. */
  surfaces: IAutoMovieHumanBodyBasisSurface[];

  /** Resident finishes; the static exporter owns texture admission. */
  materials: IAutoMovieMaterial[];
}
