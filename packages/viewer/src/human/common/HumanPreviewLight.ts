/**
 * Linear display-light data consumed by the preview's grey-card calibration.
 * Intensities and directions are authored studio conventions, not anatomical
 * measurements or a guarantee of equivalence to a photographed subject.
 *
 * @evidence contracts/common.md#principled-implementation The discriminated record supplies directional color/direction or hemisphere sky/ground color for grey-card irradiance and channel balancing. Consumers require finite nonnegative light values and a finite nonzero directional vector; this type does not perform runtime admission.
 * @evidence contracts/common.md#clear-and-simple-design Numerical rig description is separated from native light allocation, allowing the same authored values to be balanced before addHumanPreviewRig creates scene objects.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Studio color/intensity choices are display conventions rather than anatomical measurements. Channel balancing and grey-card exposure do not prove matching beauty, texture response or photographic capture conditions.
 * @evidence contracts/common.md#meaningful-documentation Member comments identify linear RGB, unitless intensity, direction toward a light and hemisphere endpoints. The purpose states numerical calibration rather than claiming observed photographic parity.
 * @evidence contracts/performance.md#efficient-algorithms Each light stores a fixed-size record. Grey-card and balancing consumers scan the light population; no geometry or image pixels are stored in this type.
 * @evidence contracts/performance.md#reuse-equivalent-work The same authored rig feeds grey-card evaluation and balanced native creation; changed light values require reevaluation rather than reusing a card solely by subject identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This data holds scalar tuples and no native light, renderer or task. Numerical records follow caller lifetime; the scene host owns allocated native lights and any shadow maps separately.
 */
export type HumanPreviewLight =
  | {
      /** Directional studio light, aimed at the world origin by its native consumer. */
      kind: "directional";

      /** Direction toward the light (its position over a target at the origin). */
      direction: readonly [number, number, number];

      /** Linear RGB colour. */
      color: readonly [number, number, number];

      /** Unitless authored multiplier of the linear light color. */
      intensity: number;
    }
  | {
      /** Hemispherical ambient light interpolated by the card's up-axis normal. */
      kind: "hemisphere";

      /** Linear RGB at the positive-Y endpoint. */
      sky: readonly [number, number, number];

      /** Linear RGB at the negative-Y endpoint. */
      ground: readonly [number, number, number];

      /** Unitless authored multiplier of both hemisphere endpoint colors. */
      intensity: number;
    };
