/**
 * The published body's sampling arithmetic replayed on the source: for a
 * state, `delta` is `S(F(neutral + d)) - S(F(neutral))` per source vertex,
 * unrounded, where F is the nipple-exclusion fill in Blender coordinates and S
 * the frame map `[x, z - offset, -y]`, in that order. `neutral` is
 * `S(F(neutral))` and `landmarks` the frame-mapped joint-cube delta.
 *
 * @author Samchon
 */
export interface IHumanSourceBodyField {
  neutral: Float64Array;
  delta(name: string): Float64Array;
  landmarks(name: string): Float64Array;
  landmarksNeutral: Float64Array;
}
