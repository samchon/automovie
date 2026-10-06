import type { IAutoMovieHumanBodyToeRay } from "./rig/IAutoMovieHumanBodyToeRay";
import type { IAutoMovieHumanBodyAtlasPartResource } from "../anatomy/atlas/IAutoMovieHumanBodyAtlasPartResource";
import type { IAutoMovieHumanBodyAnatomicalAssembly } from "../anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import type { IAutoMovieMaterial } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasisCoupling } from "./rig/IAutoMovieHumanBodyBasisCoupling";
import type { IAutoMovieHumanBodyBasisJoint } from "./rig/IAutoMovieHumanBodyBasisJoint";
import type { IAutoMovieHumanBodyBasisLandmarks } from "./rig/IAutoMovieHumanBodyBasisLandmarks";
import type { IAutoMovieHumanBodyBasisPelvifemoral } from "./rig/IAutoMovieHumanBodyBasisPelvifemoral";
import type { IAutoMovieHumanBodyBasisChannel } from "./shape/IAutoMovieHumanBodyBasisChannel";
import type { IAutoMovieHumanBodyBasisCorrective } from "./shape/IAutoMovieHumanBodyBasisCorrective";
import type { IAutoMovieHumanBodyBasisSurface } from "./surface/IAutoMovieHumanBodyBasisSurface";
import type { IAutoMovieHumanSkinLandmark } from "../../common/basis/IAutoMovieHumanSkinLandmark";
import type { IAutoMovieHumanSkinRegion } from "../../common/basis/IAutoMovieHumanSkinRegion";

/**
 * An immutable, externally authored connected body below the neck, with the
 * joints that move it and the endpoints that shape it.
 *
 * The caller supplies licensed geometry; this package supplies no person's
 * mesh. Coordinates and sparse differences use metres in a right-handed Y-up,
 * Z-forward frame shared with the face basis. In the shipped body, the
 * nonplanar collar boundary has 120 vertices with Y between -0.0902116299 m
 * and -0.0807635784 m. These are the face collar's same source vertices in
 * the common frame, so a separate combination stage can join the two by
 * position instead of by a transform.
 * The ground therefore sits well below the origin; a consumer that wants the
 * feet at zero translates the whole model by the neutral's lowest Y.
 *
 * What the face basis lacked and the body cannot do without is the joint. A
 * 145 degree elbow walked as a linear endpoint leaves the forearm centimetres
 * off the arc, so joints, their landmarks and the skin weights are part of
 * this contract from the first revision rather than a later layer. Evaluation
 * is channels, then correctives, then landmarks, then the rest skeleton, then
 * the pose with the declared couplings added and shoulder goals resolved,
 * then skinning
 * (`createHumanBodyBasisBuilder`).
 *
 * Every endpoint name (`channels[].positive`, `negative`, `correctives[].target`)
 * must move at least one resident skin vertex or landmark in a standalone
 * body. A person may supply the exact same-generation head source with actual
 * endpoint driver contributions; its constructor verifies those external rows
 * separately. A surface or the landmark set omits rows for an endpoint it does
 * not move. The current r16
 * study has 1,859 declared endpoints on skin and 183 with landmark rows;
 * only those 183 also reposition rig points. Changes to geometry, endpoints,
 * landmarks, joints or weights require a new basis identity.
 *
 * Basis IDs that address record fields (channels, endpoints, landmarks,
 * surfaces, materials and regions) must not name an inherited Object property.
 * The admission stages check this once so a missing authored row cannot be
 * mistaken for `constructor`, `toString` or another prototype member during
 * shape evaluation. This is a JavaScript representation constraint, not an
 * anatomical limit on a person's measurements.
 *
 * Endpoint interpolation describes an authored shape, not muscle; skinning
 * describes a rigid attachment, not tissue. Neither proves nonpenetration or
 * physiological range for arbitrary combinations, which the body-review
 * census measures separately. Genital and nipple geometry, clothing, hair and
 * ethnicity axes are not channels of this basis: the first two are product
 * exclusions that reopen only with a product decision, the rest belong to
 * other owners (clothing to a production's own assets, hair to the face's
 * groom, ethnicity to the face track that declined it too).
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
   * measurement rules that keep a feature out of a search (none on the
   * shipped body yet).
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
