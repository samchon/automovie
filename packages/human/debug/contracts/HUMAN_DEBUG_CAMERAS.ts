/**
 * The named camera directions of the viewer, as azimuth and elevation in degrees.
 *
 * Azimuth turns in the floor plane from +X (the body's front) toward +Z (the body's left), so
 * `left` looks at the body from its left side; elevation rises toward +Y. `three-quarter` is the
 * conventional front-left view from above used in figure inspection. Every camera menu, URL value
 * and batch view comes from this record.
 */
export const HUMAN_DEBUG_CAMERAS: {
  readonly front: readonly [number, number];
  readonly back: readonly [number, number];
  readonly left: readonly [number, number];
  readonly right: readonly [number, number];
  readonly top: readonly [number, number];
  readonly bottom: readonly [number, number];
  readonly "three-quarter": readonly [number, number];
  readonly "three-quarter-back": readonly [number, number];
} = {
  front: [0, 0],
  back: [180, 0],
  left: [90, 0],
  right: [-90, 0],
  top: [0, 90],
  bottom: [0, -90],
  "three-quarter": [45, 20],
  "three-quarter-back": [-135, 20],
};
