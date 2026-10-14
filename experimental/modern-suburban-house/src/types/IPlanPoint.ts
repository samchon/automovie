/**
 * Caller-authored polygon coordinate in the house/site common world X/Z metre frame. The helper transports both plan axes to surface builders without choosing a building extent, assigning a surface owner or validating a closed ring.
 *
 * @author Samchon
 */
export interface IPlanPoint {
  /** World X metres; the production's positive axis points toward the garage. */
  x: number;

  /** World Z metres; positive points toward the front walk and negative toward the garden. */
  z: number;
}
