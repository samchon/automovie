/**
 * The source root interval held during course transport.
 */
export namespace IAutoMovieHumanMaterialCourse {
  /**
   * A root the part's host owns: the stretch of the first run, from the course's first centre, that keeps its stations when the run's
   * bone changes length. A limb's first centre is its joint centre, inside its host, while its skin begins at a rail on the host's
   * skin, a tenth of a metre down a thigh. The host places that rail (a split's end ring, a port's loop), so the run that stretches
   * with the bone starts past it: without this the rail's station is carried by the bone's ratio like any other, and a thigh 0.9 times
   * as long lifts the leg's first ring, 104 mm down the course, by 10.4 mm into the trunk's end.
   */
  export interface IHold {
    /** The station where the held root ends, mm, inside the first run. */
    station: number;

    /** The blend window's half length about it, mm. */
    window: number;
  }
}
