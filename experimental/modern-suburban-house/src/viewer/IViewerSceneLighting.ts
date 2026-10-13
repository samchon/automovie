

/**
 * Light rig recorded with the scene so a capture names its conditions.
 *
 * @author Samchon
 */
export interface IViewerSceneLighting {
  /** Direction the key light comes FROM, as a world vector (not normalized). */
  keyFrom: [number, number, number];

  /** Key light intensity in three.js physical units. */
  keyIntensity: number;

  /** Sky color of the hemisphere fill, sRGB hex. */
  skyColor: number;

  /** Ground color of the hemisphere fill, sRGB hex. */
  groundColor: number;

  /** Hemisphere fill intensity. */
  fillIntensity: number;

  /** Fixed tone-mapping exposure; settings `lighting-state` forbids per-view brightness. */
  exposure: number;

  /** Half extent of the key light shadow box around its target, meters; 8 when absent. */
  shadowHalfExtent?: number;

  /** World point the key light aims at; the origin when absent. */
  keyTarget?: [number, number, number];
}
