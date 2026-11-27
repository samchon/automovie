import type { IAutoMovieResolvedBone } from "../pose/IAutoMovieResolvedBone";
import type { AutoMovieSurfaceTier } from "./AutoMovieSurfaceTier";
import type { IAutoMovieSurfaceConstruction } from "./IAutoMovieSurfaceConstruction";
import type { IAutoMovieSurfaceNetwork } from "./IAutoMovieSurfaceNetwork";
import type { IAutoMovieSurfaceNetworkBindings } from "./IAutoMovieSurfaceNetworkBindings";

/**
 * Compile-time network, sampling tier and optional motion/inspection choices
 * for a reusable cage rig.
 */
export namespace IAutoMovieRigSurfaceNetwork {
  /**
   * Compile a surface network at one tier into its rest cage and a per-pose
   * update of the cage's control positions.
   *
   * Each patch becomes a grid of its tier's rows and columns, sampled evenly in
   * its own coordinates. A sweep patch evaluates its sweep, its radius under
   * direction correspondence or its Cartesian section point under parameter
   * correspondence averaged over each vertex's cell, which reaches half the
   * spacing to the neighbouring sample on each side along `u` and `v`, as
   * `IAutoMovieSweepRig.sample` states, so detail finer than the tier's grid
   * fades instead of aliasing into ripples. A point sampled by several patches
   * or sides takes, on each side, the finest spacing any of them gives there,
   * and a side none of them reaches mirrors the other, so a point's position
   * does not depend on patch order and a mirrored layout samples to a mirrored
   * cage; a node on a sweep that no grid samples is the section point itself. A
   * Coons patch takes its four sides' points and fills the interior as
   * `rigAutoMovieSurfaceCoons` states; a bridge fills its rows with cubic
   * Hermite curves between its two loops, as `rigAutoMovieSurfaceBridge`
   * states; a transition band lays its quads out by
   * `layoutAutoMovieSurfaceTransition` and samples every corner on its sweep. A
   * network curve is compiled by `rigAutoMovieSurfaceCurve`, which regenerates
   * its whole spline from sweep nodes and tangent planes evaluated with the
   * same registry-resolved cell as their geometric targets. Observation-only
   * sweep nodes keep a zero cell. This is a fixed local footprint derivative,
   * not a differential of footprint size across the network. Vertices are
   * shared by identity, never by distance: a point of a sweep is named by the
   * sweep and its domain coordinates rounded to nine decimals, a curve point by
   * the curve and its share, a node by its name.
   *
   * The patch grids alone decide the topology, so one network gives every input
   * and every pose the same cage at a tier. A ring may only name points that
   * patches made, and a bridge loop only sweep points that patches made, which
   * catches sides that do not meet; an edge used twice in the same direction is
   * refused as overlapping or misoriented patches.
   *
   * With `fit` (the default) the samples of sweeps and curves are targets the
   * cage's Catmull-Clark limit passes through, solved by
   * `solveAutoMovieSubdivisionLimit`; the interior vertices of Coons patches
   * and bridges are blend controls of their own construction and keep their
   * samples as control positions, because interpolating a blend's samples makes
   * the limit surface ring between them where a loop turns sharply; pinned ring
   * vertices keep their given positions. Without, controls are the samples
   * themselves and the residual is 0. A ring that declares a perimeter is held
   * to it at rest by `holdAutoMovieSurfaceGirths`, a radial factor along its
   * sweep that every pose keeps. Every face corner carries `(patch, s, t)` and
   * a UV value: the patch's rectangle in texture space, or the band `t in [k /
   * P, (k + 1) / P]` of the unit square for patch `k` of `P`.
   *
   * Bindings make the rig posable exactly as `poseAutoMovieSurfaceNetwork`
   * poses the network: bound sweeps by `rigAutoMovieSweep`, free nodes, curve
   * through points, normals and directions and ring positions rigidly with
   * their bones. Everything else is computed here once; `pose` refreshes only
   * the bones, the bound sweeps, the curves, the samples, the blends, the pins
   * and the fit, into buffers sized here.
   */
  export type IProps = {
    /**
     * Rest surface network, read without mutation. Compiled sweep rigs retain
     * their source sweeps, so preserve defining data throughout the resulting
     * rig's lifetime.
     */
    network: IAutoMovieSurfaceNetwork;
    /**
     * Sampling tier selecting each patch's authored row/column counts. Counts
     * must be safe positive integers; invalid or unavailable counts throw
     * during compilation.
     */
    tier: AutoMovieSurfaceTier;
    /**
     * Whether to solve control positions so the Catmull-Clark limit reaches
     * authored surface targets. Omitted means true. False keeps samples as
     * controls and reports zero fit residual; blend controls and pinned
     * vertices remain held in either mode.
     */
    fit?: boolean;
    /**
     * Optional bone assignments by network names. Absence means all geometry
     * stays at rest unless otherwise evaluated by the rig. Unknown names throw;
     * any nonempty binding table requires rest bones.
     */
    bindings?: IAutoMovieSurfaceNetworkBindings;
    /**
     * Resolved rest bones establishing binding transforms. Required when any
     * binding table is nonempty; omitted with no bindings means no bone buffer
     * is constructed.
     */
    rest?: readonly IAutoMovieResolvedBone[];
    /**
     * Whether bound sweep joint stations compensate scale to retain rest
     * volume. Omitted means false; forwarded to sweep rig preparation.
     */
    preserveVolume?: boolean;
    /**
     * Optional rest inspection sample counts. Requested sweep observations and
     * regenerated network curves are read after the girth solve; omission
     * allocates no construction snapshot. Inspection is separate from the cage
     * target fit.
     */
    construction?: IAutoMovieSurfaceConstruction.ISamples;
  };
}
