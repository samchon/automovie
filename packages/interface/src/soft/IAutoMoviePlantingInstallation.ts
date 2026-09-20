import { AutoMoviePlantingInstallationKind } from "./AutoMoviePlantingInstallationKind";
import { IAutoMoviePlantingIrrigation } from "./IAutoMoviePlantingIrrigation";
import { IAutoMoviePlantingSupport } from "./IAutoMoviePlantingSupport";

/**
 * The binding that makes an independent planting cluster a building's planting.
 *
 * This record, not the planting recipe, is the building-owned half. The recipe
 * and the cluster stay free-standing computational units; the installation says
 * _this building unit's logical space holds that cluster, it stands on this
 * support, and this is the port that waters it_. A production world with no
 * building at all places the same cluster by simply not writing one of these.
 *
 * @evidence requirements/map/vegetation-and-ecology.md#map-vegetation-individual-cluster Exposes `IAutoMoviePlantingInstallation` as the portable data boundary for the map vegetation individual cluster requirement.
 * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-vegetation-layer-form-input Types `IAutoMoviePlantingInstallation` for the world site vegetation layer form input system contract.
 */
export interface IAutoMoviePlantingInstallation {
  /**
   * Stable installation identity within the production.
   *
   * @evidence requirements/map/vegetation-and-ecology.md#map-vegetation-individual-cluster Exposes `id` as the portable data boundary for the map vegetation individual cluster requirement.
   * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-vegetation-layer-form-input Types `id` for the world site vegetation layer form input system contract.
   */
  id: string;

  /**
   * Id of the `IAutoMovieBuiltEnvironment` that owns the installation.
   *
   * @evidence requirements/map/vegetation-and-ecology.md#map-vegetation-individual-cluster Exposes `environment` as the portable data boundary for the map vegetation individual cluster requirement.
   * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-vegetation-layer-form-input Types `environment` for the world site vegetation layer form input system contract.
   */
  environment: string;

  /**
   * Id of the logical space inside that environment holding the planting.
   *
   * @evidence requirements/map/vegetation-and-ecology.md#map-vegetation-individual-cluster Exposes `space` as the portable data boundary for the map vegetation individual cluster requirement.
   * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-vegetation-layer-form-input Types `space` for the world site vegetation layer form input system contract.
   */
  space: string;

  /**
   * Id of the independent planting cluster this installation places.
   *
   * @evidence requirements/map/vegetation-and-ecology.md#map-vegetation-individual-cluster Exposes `cluster` as the portable data boundary for the map vegetation individual cluster requirement.
   * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-vegetation-layer-form-input Types `cluster` for the world site vegetation layer form input system contract.
   */
  cluster: string;

  /**
   * Semantic label; it selects nothing in the derivation.
   *
   * @evidence requirements/map/vegetation-and-ecology.md#map-vegetation-individual-cluster Exposes `kind` as the portable data boundary for the map vegetation individual cluster requirement.
   * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-vegetation-layer-form-input Types `kind` for the world site vegetation layer form input system contract.
   */
  kind: AutoMoviePlantingInstallationKind;

  /**
   * What the planting stands on, hangs from, or is trained against.
   *
   * @evidence requirements/map/vegetation-and-ecology.md#map-vegetation-individual-cluster Exposes `support` as the portable data boundary for the map vegetation individual cluster requirement.
   * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-vegetation-layer-form-input Types `support` for the world site vegetation layer form input system contract.
   */
  support: IAutoMoviePlantingSupport;

  /**
   * Id of the material every branch instance is drawn with, or `null` for the
   * renderer's default.
   *
   * Stated on the binding rather than on the recipe, exactly as a soft
   * furnishing states its own (see {@link IAutoMovieSoftFurnishing.material}):
   * the recipe is the parametric law, and the same law is a copper beech in one
   * production and a bare wire armature in another. It is also what lets a
   * render budget attribute texture bytes to the planting at all, instead of
   * reporting the whole fold as unmeasured.
   *
   * @evidence requirements/map/vegetation-and-ecology.md#map-vegetation-individual-cluster Exposes `branchMaterial` as the portable data boundary for the map vegetation individual cluster requirement.
   * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-vegetation-layer-form-input Types `branchMaterial` for the world site vegetation layer form input system contract.
   */
  branchMaterial: string | null;

  /**
   * Id of the material every leaf instance is drawn with, or `null` for the
   * renderer's default. Separate from {@link branchMaterial} because the two
   * batches are separate draws with separate textures, and one id for both
   * would make a budget count one of them twice or not at all.
   *
   * @evidence requirements/map/vegetation-and-ecology.md#map-vegetation-individual-cluster Exposes `leafMaterial` as the portable data boundary for the map vegetation individual cluster requirement.
   * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-vegetation-layer-form-input Types `leafMaterial` for the world site vegetation layer form input system contract.
   */
  leafMaterial: string | null;

  /**
   * How the planting is watered, or `null` for a planting nobody has bound a
   * supply to yet.
   *
   * `null` is a legitimate authoring state, not a silent pass: a dry binding is
   * exactly what a service-coordination pass needs to see.
   *
   * @evidence requirements/map/vegetation-and-ecology.md#map-vegetation-individual-cluster Exposes `irrigation` as the portable data boundary for the map vegetation individual cluster requirement.
   * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-vegetation-layer-form-input Types `irrigation` for the world site vegetation layer form input system contract.
   */
  irrigation: IAutoMoviePlantingIrrigation | null;
}
