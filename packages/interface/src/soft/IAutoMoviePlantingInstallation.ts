import { AutoMoviePlantingInstallationKind } from "./AutoMoviePlantingInstallationKind";
import { IAutoMoviePlantingIrrigation } from "./IAutoMoviePlantingIrrigation";
import { IAutoMoviePlantingSupport } from "./IAutoMoviePlantingSupport";

/**
 * The binding that makes an independent planting cluster a building's planting.
 *
 * This record, not the planting recipe, is the building-owned half. The recipe and the cluster stay free-standing computational units; the installation says _this building unit's logical space holds that cluster, it stands on this support, and this is the port that waters it_. A production world with no building at all places the same cluster by simply not writing one of these.
 *
 * @evidence contracts/common.md#principled-implementation Installation admission joins exact environment, logical space, cluster and declared support, checks generated members where the space has cells and validates aquatic fluid and irrigation element ownership.
 * @evidence contracts/common.md#clear-and-simple-design Building responsibility and branch/leaf materials stay on the binding while independent recipe and cluster laws remain reusable outside architecture.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Semantic spaces lacking volume receive no invented containment proof; null irrigation remains an explicit unbound supply and kind does not alter growth geometry.
 * @evidence contracts/common.md#meaningful-documentation Defines architecture/cluster joins, support, nullable default materials and unresolved irrigation ownership.
 */
export interface IAutoMoviePlantingInstallation {
  /** Stable installation identity within the production. */
  id: string;

  /** Id of the `IAutoMovieBuiltEnvironment` that owns the installation. */
  environment: string;

  /** Id of the logical space inside that environment holding the planting. */
  space: string;

  /** Id of the independent planting cluster this installation places. */
  cluster: string;

  /** Semantic label; it selects nothing in the derivation. */
  kind: AutoMoviePlantingInstallationKind;

  /** What the planting stands on, hangs from, or is trained against. */
  support: IAutoMoviePlantingSupport;

  /**
   * Id of the material every branch instance is drawn with, or `null` for the renderer's default.
   *
   * Stated on the binding rather than on the recipe, exactly as a soft furnishing states its own (see {@link IAutoMovieSoftFurnishing.material}): the recipe is the parametric law, and the same law is a copper beech in one production and a bare wire armature in another. It is also what lets a render budget attribute texture bytes to the planting at all, instead of reporting the whole fold as unmeasured.
   */
  branchMaterial: string | null;

  /**
   * Id of the material every leaf instance is drawn with, or `null` for the renderer's default. The leaf batch can choose a different material from {@link branchMaterial}; both fields may also cite the same shared material without duplicating its resource identity.
   */
  leafMaterial: string | null;

  /**
   * How the planting is watered, or `null` for a planting nobody has bound a supply to yet.
   *
   * `null` is a legitimate authoring state, not a silent pass: a dry binding is exactly what a service-coordination pass needs to see.
   */
  irrigation: IAutoMoviePlantingIrrigation | null;
}
