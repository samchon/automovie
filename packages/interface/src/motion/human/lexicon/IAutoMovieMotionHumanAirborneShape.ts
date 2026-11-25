/**
 * The body shapes held in flight: tuck, pike, layout, straddle and the twisting
 * arm sets, each a layer laid over a jump's flight window, so the flight pass
 * (`HumanPerformanceFlight`) reads the composed shape and turns the body by it:
 * a tuck turns faster than a layout by the ratio of their moments about the
 * somersault axis.
 *
 * Each shape holds clinical joint angles for the channels it claims, set over
 * what the flight holds there; a goal the flight holds on a limb the shape
 * claims is moved to where the shape's joints put that limb's end joint, since
 * a held tuck is a joint shape and not a foot placed somewhere, and a layer's
 * weight moves a goal both postures hold but keeps one only the base holds
 * until the full weight drops it at once, which would snap the limb mid-air.
 * The positions are the gymnastic and diving position names (tuck: hips and
 * knees bent; pike: hips bent, knees straight; layout: straight; straddle: legs
 * apart), with angles that are provisional: no rulebook or kinematic study was
 * read for them.
 *
 * Schedule a shape over the flight as a windowed layer, from the jump's
 * `takeoff` to its `touchdown`.
 */
export namespace IAutoMovieMotionHumanAirborneShape {
  /** A shape as a layer. One shape. */
  export type Shape = (readonly [
    "tuck",
    "pike",
    "layout",
    "straddle",
    "armsIn",
    "armsUp",
  ])[number];
}
