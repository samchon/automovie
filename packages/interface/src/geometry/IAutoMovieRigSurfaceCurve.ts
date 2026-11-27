import type { IAutoMovieBoneBuffer } from "./IAutoMovieBoneBuffer";
import type { IAutoMovieSurfaceNetwork } from "./IAutoMovieSurfaceNetwork";
import type { IAutoMovieSurfacePoint } from "./IAutoMovieSurfacePoint";

/** Nodes and optional bone motion used to rebuild a network curve per pose. */
export namespace IAutoMovieRigSurfaceCurve {
  /**
   * Compile a network curve for per-pose evaluation.
   *
   * The curve is the centripetal Catmull-Rom spline through its start node, its
   * through points and its end node, by chord-length share. At a node on a
   * sweep its end direction is the spline's own less its part along the sweep's
   * normal there, so it leaves or reaches the sweep in the sweep's tangent
   * plane. A bridge leaving the curve under the `across` rule takes the
   * declared normal at mid-curve, turning linearly toward each end to the
   * sweep's normal at a sweep node; under the other rules it takes the declared
   * direction. Through points, the normal and the direction ride the curve's
   * bone when it has one, and the nodes are written by their own rig.
   */
  export type IProps = {
    /**
     * Network curve key used in tangent, normal and direction failure messages.
     * It does not determine geometry.
     */
    name: string;

    /**
     * Rest curve declaration. Through-point positions in model metres and
     * direction/normal components are copied; presence of normal/direction is
     * read later, so keep the declaration stable.
     */
    curve: IAutoMovieSurfaceNetwork.ICurve;

    /**
     * Borrowed start-node writer and optional sweep probe. Registry
     * finalization must resolve it before the first update; each update reads
     * its current posed position and tangent-plane normal.
     */
    from: IAutoMovieSurfacePoint;

    /**
     * Borrowed end node in the same model frame as from. Its current writer and
     * probe are read every update, allowing deferred registry binding.
     */
    to: IAutoMovieSurfacePoint;

    /**
     * Index into bones for transporting through points and declared directions.
     * Negative means fixed at rest; this helper assumes a valid nonnegative
     * index and does not validate it.
     */
    bone: number;

    /**
     * Borrowed live bone-motion buffer, refreshed before curve update. Null
     * disables transport even if bone is nonnegative; endpoint nodes still move
     * through their own writers.
     */
    bones: IAutoMovieBoneBuffer | null;
  };
}
