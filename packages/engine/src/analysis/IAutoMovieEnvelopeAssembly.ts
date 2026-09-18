import { IAutoMovieVector3 } from "@automovie/interface";
import { IAutoMovieEnvelopeLayer } from "./IAutoMovieEnvelopeLayer";

/**
 * One envelope build-up between the indoor air and the outdoor air.
 *
 * The production declares its own layers and its own surface films. A shipped
 * table of conductivities would be content this product does not sell; the
 * one-dimensional steady-state resistance network that turns them into a
 * transmittance is the capability it does.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `IAutoMovieEnvelopeAssembly` binds one boundary area to its films, ordered layers, and overlay position for thermal-load evidence.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The assembly supplies the complete series-resistance path and area multiplier used by the resolved environmental calculation.
 */
export interface IAutoMovieEnvelopeAssembly {
  /**
   * Stable assembly identity within the request.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment The assembly `id` identifies which envelope build-up contributes each reported U-value and sample.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract This key also resolves linear bridges to their owning resistance path and rejects ambiguous duplicates.
   */
  id: string;
  /**
   * Building boundary this assembly realizes.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `boundary` names the building enclosure element whose environmental performance this assembly realizes.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The boundary label keeps the calculated load attributable to the resolved architectural path rather than only to a solver id.
   */
  boundary: string;
  /**
   * Layers from the interior face outward; at least one.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `layers` explicitly declare the material sequence whose combined resistance limits heat flow.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The nonempty ordered list is validated and reduced to the conductive portion of total assembly resistance.
   */
  layers: readonly IAutoMovieEnvelopeLayer[];
  /**
   * Interior surface film resistance in m^2*K/W; strictly positive.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `interiorFilm` declares the room-side surface resistance used in both heat flow and condensation risk.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract This positive boundary resistance enters the U-value denominator and the interior-surface temperature calculation.
   */
  interiorFilm: number;
  /**
   * Exterior surface film resistance in m^2*K/W; strictly positive.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `exteriorFilm` states the outside surface resistance completing the declared envelope path.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The exterior boundary term is summed with layer and interior resistances before transmittance is inverted.
   */
  exteriorFilm: number;
  /**
   * Area in m^2; strictly positive.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment Assembly `area` declares how much enclosure participates in the fabric heat load.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The square-metre operand scales U-value and temperature difference into this assembly's watt contribution.
   */
  area: number;
  /**
   * Representative world point on the interior face, for the field overlay.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment Assembly `position` locates the calculated interior-surface result for a deterministic field overlay.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The representative world point becomes the sample coordinate paired with this assembly's surface temperature.
   */
  position: IAutoMovieVector3;
}
