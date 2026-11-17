import type { IAutoMovieSoftBodyDomain } from "./IAutoMovieSoftBodyDomain";
import type { IAutoMovieSoftBodyState } from "./IAutoMovieSoftBodyState";

/** Lattice topology and particle snapshot used for cloth surface extraction. */
export namespace IAutoMovieSoftBodySurfaceGeometry {
  /**
   * Borrowed topology and particle field for deriving fresh panel mesh arrays. Two fixed triangles cover each lattice quad, UVs follow lattice coordinates in [0, 1] with zero on a singleton axis, and area-weighted vertex normals use +Y when their accumulated vector is zero. Bounds include indexed triangle vertices; a cord or point with no quads returns null bounds while positions remain present.
   *
   * The extractor copies state.positions and reads state.step, but performs no domain-id, layout or finite-value checks. Caller admission must establish a compatible state and lattice. Direct-square normal arithmetic can overflow or underflow. Inputs remain unchanged and no input reference is retained in the fresh surface.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes fresh buffers, normal/UV conventions, indexed-only bounds and the absence of identity or numerical admission.
   * @evidence contracts/development/design.md#principled-representation The canonical domain gives row-major topology and the state gives world-metre positions; matching dimensions and provenance remain caller premises.
   * @evidence contracts/development/design.md#minimal-and-owned-surface softBodySurfaceGeometry and lowerSoftFurnishing share existing domain/state records rather than requiring a second cloth mesh representation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No triangles are invented for a one-wide lattice, and a typed state is not treated as proof that its id matches the supplied domain.
   */
  export type IProps = {
    /** Admitted lattice dimensions and output domain id; rest positions and physical solver parameters are not read. */
    domain: IAutoMovieSoftBodyDomain;

    /** Compatible row-major xyz positions in world metres and output step label; positions are copied and velocities are unused. */
    state: IAutoMovieSoftBodyState;
  };
}
