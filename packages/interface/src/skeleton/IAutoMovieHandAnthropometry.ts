/** Data and callback contracts shared by the HandAnthropometry operations. */
export namespace IAutoMovieHandAnthropometry {
  /** One joint's caliper breadth and tape girth, mm. */
  export interface IJoint {
    /** Breadth across the joint, mm. */
    breadth: number;

    /** Circumference round the joint, mm. */
    girth: number;
  }
}
