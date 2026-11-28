import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * World position and complete partials after the frame product rule. The six
 * vectors use physical station in millimetres and the caller's unchanged phase
 * clock. The operation returns fresh vectors. Lift and relief are composed by
 * their owning loft reader after placement.
 */
export type IAutoMovieLoftWorldJetWorld = {
  /**
   * Surface position in world millimetres after applying the origin and both
   * local basis axes.
   */
  p: AutoMovieVector3Tuple;

  /**
   * First physical-station partial in millimetres per millimetre. It includes
   * motion of the origin and axes as well as local station change.
   */
  s: AutoMovieVector3Tuple;

  /**
   * First phase partial in millimetres per phase clock unit. Frame axes are
   * fixed at the queried station for this derivative.
   */
  t: AutoMovieVector3Tuple;

  /**
   * Second physical-station partial in inverse millimetres, including the frame
   * and local product-rule terms.
   */
  ss: AutoMovieVector3Tuple;

  /**
   * Mixed station and phase partial in inverse phase clock units. Local phase
   * change is also differentiated through moving frame axes.
   */
  st: AutoMovieVector3Tuple;

  /** Second phase partial in millimetres per squared caller phase clock unit. */
  tt: AutoMovieVector3Tuple;
};
