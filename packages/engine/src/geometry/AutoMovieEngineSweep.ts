import { bufferBones as bufferBonesImplementation } from "./sweep/internal/bufferBones";
import { compileSweep as compileSweepImplementation } from "./sweep/internal/compileSweep";
import { compileSweepFeature as compileSweepFeatureImplementation } from "./sweep/internal/compileSweepFeature";
import { fitSubdivisionLimit as fitSubdivisionLimitImplementation } from "./sweep/internal/fitSubdivisionLimit";
import { frameSweepSpine as frameSweepSpineImplementation } from "./sweep/internal/frameSweepSpine";
import { holdSurfaceGirths as holdSurfaceGirthsImplementation } from "./sweep/internal/holdSurfaceGirths";
import { integrateSweepVolume as integrateSweepVolumeImplementation } from "./sweep/internal/integrateSweepVolume";
import { interpolateMonotone as interpolateMonotoneImplementation } from "./sweep/internal/interpolateMonotone";
import { interpolateSpline as interpolateSplineImplementation } from "./sweep/internal/interpolateSpline";
import { layoutSurfacePatches as layoutSurfacePatchesImplementation } from "./sweep/internal/layoutSurfacePatches";
import { layoutSurfaceTransition as layoutSurfaceTransitionImplementation } from "./sweep/internal/layoutSurfaceTransition";
import { loadSweepSpine as loadSweepSpineImplementation } from "./sweep/internal/loadSweepSpine";
import { locateSurfaceCoordinate as locateSurfaceCoordinateImplementation } from "./sweep/internal/locateSurfaceCoordinate";
import { locateSurfaceVertices as locateSurfaceVerticesImplementation } from "./sweep/internal/locateSurfaceVertices";
import { locateSweepPoint as locateSweepPointImplementation } from "./sweep/internal/locateSweepPoint";
import { mapSurfaceTier as mapSurfaceTierImplementation } from "./sweep/internal/mapSurfaceTier";
import { measureSweepVolume as measureSweepVolumeImplementation } from "./sweep/internal/measureSweepVolume";
import { meshSweep as meshSweepImplementation } from "./sweep/internal/meshSweep";
import { momentSweepSections as momentSweepSectionsImplementation } from "./sweep/internal/momentSweepSections";
import { orientSweep as orientSweepImplementation } from "./sweep/internal/orientSweep";
import { parameterizeSweepSection as parameterizeSweepSectionImplementation } from "./sweep/internal/parameterizeSweepSection";
import { pathSweepTransport as pathSweepTransportImplementation } from "./sweep/internal/pathSweepTransport";
import { poseSurfaceNetwork as poseSurfaceNetworkImplementation } from "./sweep/internal/poseSurfaceNetwork";
import { poseSweep as poseSweepImplementation } from "./sweep/internal/poseSweep";
import { registerSurfaceVertices as registerSurfaceVerticesImplementation } from "./sweep/internal/registerSurfaceVertices";
import { rigSurfaceBridge as rigSurfaceBridgeImplementation } from "./sweep/internal/rigSurfaceBridge";
import { rigSurfaceCoons as rigSurfaceCoonsImplementation } from "./sweep/internal/rigSurfaceCoons";
import { rigSurfaceCurve as rigSurfaceCurveImplementation } from "./sweep/internal/rigSurfaceCurve";
import { rigSurfaceNetwork as rigSurfaceNetworkImplementation } from "./sweep/internal/rigSurfaceNetwork";
import { rigSweep as rigSweepImplementation } from "./sweep/internal/rigSweep";
import { settleSweepVolume as settleSweepVolumeImplementation } from "./sweep/internal/settleSweepVolume";
import { solveSubdivisionLimit as solveSubdivisionLimitImplementation } from "./sweep/internal/solveSubdivisionLimit";
import { stencilSubdivisionLimit as stencilSubdivisionLimitImplementation } from "./sweep/internal/stencilSubdivisionLimit";
import { transportSweepSpine as transportSweepSpineImplementation } from "./sweep/internal/transportSweepSpine";

import { sampleSurfaceNetwork as sampleSurfaceNetworkImplementation } from "./sweep/internal/sampleSurfaceNetwork";
import { sampleSweepSection as sampleSweepSectionImplementation } from "./sweep/internal/sampleSweepSection";

import { sampleParameterSweep as sampleParameterSweepImplementation } from "./sweep/internal/sampleParameterSweep";

import { type IAutoMovieSweep, type IAutoMovieCompileSweepGuideOutput, type IAutoMoviePlanSurfaceRigPatchesOutput, type IAutoMoviePlanSurfaceRigPatches, type IAutoMovieSurfaceConstruction, type IAutoMoviePrepareSurfaceConstruction, type IAutoMoviePreserveSweepVolume, type IAutoMovieSampleParameterSweep, type IAutoMovieSurfaceCage, type IAutoMovieSampleSurfaceNetwork, type IAutoMovieSampleSweepSection, type IAutoMovieBoneBuffer, type IAutoMovieResolvedBone, type IAutoMovieSweepSurface, type IAutoMovieCompileSweepFeatureOutput, type IAutoMovieCompileSweepFeature, type IAutoMovieFitSubdivisionLimit, type IAutoMovieSweepPath, type IAutoMovieSweepSpine, type IAutoMovieHoldSurfaceGirths, type IAutoMovieInterpolateMonotone, type IAutoMovieInterpolateSpline, type IAutoMovieSurfaceLayout, type IAutoMovieSurfaceNetwork, type IAutoMovieSurfaceCoordinate, type IAutoMovieSweepTransport, type IAutoMovieSubdivisionParameter, type IAutoMovieLocateSurfaceCoordinate, type IAutoMovieSurfaceLocation, type IAutoMovieLocateSurfaceVertices, type IAutoMovieLocateSweepPoint, type IAutoMovieMapSurfaceTier, type IAutoMovieMesh, type IAutoMovieMeshSweep, type IAutoMovieSweepOrientation, type IAutoMovieOrientSweep, type IAutoMovieParameterizeSweepSection, type IAutoMovieSweepSection, type IAutoMoviePoseSurfaceNetwork, type IAutoMoviePoseSweep, type IAutoMovieSurfaceRegistry, type IAutoMovieSweepRig, type IAutoMovieRigSurfaceBridge, type IAutoMovieSurfaceCurveRig, type IAutoMovieRigSurfaceCurve, type IAutoMovieSurfaceRig, type IAutoMovieRigSurfaceNetwork, type IAutoMovieRigSweep, type IAutoMovieSolveSubdivisionLimit, type IAutoMovieSubdivisionStencil } from "@automovie/interface";
import { checkSweepFeature as checkSweepFeatureImplementation } from "./sweep/internal/checkSweepFeature";
import { compileSweepGuide as compileSweepGuideImplementation } from "./sweep/internal/compileSweepGuide";
import { compileSweepProfile as compileSweepProfileImplementation } from "./sweep/internal/compileSweepProfile";
import { planSurfaceRigPatches as planSurfaceRigPatchesImplementation } from "./sweep/internal/planSurfaceRigPatches";
import { prepareSurfaceConstruction as prepareSurfaceConstructionImplementation } from "./sweep/internal/prepareSurfaceConstruction";
import { preserveSweepVolume as preserveSweepVolumeImplementation } from "./sweep/internal/preserveSweepVolume";
import { reachSurfaceCell as reachSurfaceCellImplementation } from "./sweep/internal/reachSurfaceCell";

/** Public operations for Auto Movie Engine Sweep. */
export namespace AutoMovieEngineSweep {
  /**
   * Refuse a feature whose band or points cannot define a finite sweep
   * displacement.
   *
   * @param f The feature, only read
   * @param index Its index for diagnostics
   * @throws Error for a non-positive width, fewer than two points, out-of-domain
   *   points, mixed value modes or non-finite values
   */
  export function checkSweepFeature(f: IAutoMovieSweep.IFeature, index: number): void {
    checkSweepFeatureImplementation(f, index);
  }

  /**
   * Compile one silhouette guide's angle and positive radius profile.
   *
   * @param guide Authored guide, read without mutation
   * @param index Its index for refusal diagnostics
   * @returns A wrapped angle and compiled positive finite radius query
   * @throws Error for a non-finite angle or an invalid profile or profile query
   */
  export function compileSweepGuide(guide: IAutoMovieSweep.IGuide, index: number): IAutoMovieCompileSweepGuideOutput {
    return compileSweepGuideImplementation(guide, index);
  }

  /**
   * Compile a positive radius or scale profile spanning the sweep's whole spine.
   *
   * The C2 scalar spline permits signed overshoot, even when all knots are
   * positive. Radius and scale consumers require positive finite values, so a
   * queried undershoot or arithmetic overflow is refused without clamping the
   * curve or changing its interpolation.
   *
   * @param entries Positive finite values on increasing knots from u 0 to 1
   * @param what The owning guide or scale's diagnostic name
   * @returns The compiled profile, refusing a non-positive or non-finite query
   *   result
   * @throws Error for a profile that does not span the spine, invalid knot/value
   *   data or an invalid queried result
   */
  export function compileSweepProfile(entries: readonly IAutoMovieSweep.IKnot[], what: string): (u: number) => number {
    return compileSweepProfileImplementation(entries, what);
  }

  /**
   * Lay out the sweep, transition, Coons and bridge blocks of a surface rig,
   * preserving vertex registration order and cell reaches. Bridge sweep probes
   * bind once after registry cell resolution and before sealing, so their normals
   * and axial derivatives use the same geometric field as their loop positions,
   * before control pins.
   *
   * @param props Network, registry and the rig's shared edge/sweep evaluators
   * @returns The checked patch layout and the blend-control vertex indices
   * @throws Error for duplicate names, invalid patch ranges or counts,
   *   incompatible sides or loops, or overlapping patches
   */
  export function planSurfaceRigPatches(props: IAutoMoviePlanSurfaceRigPatches.IProps): IAutoMoviePlanSurfaceRigPatchesOutput {
    return planSurfaceRigPatchesImplementation(props);
  }

  /**
   * Register observation writers while a network rig is still open, then read
   * them after its girth solve and final rest evaluation.
   *
   * Sweep observations use the same zero-cell writer as unsampled sweep nodes;
   * spine observations read the same registered section frame; network curves use
   * the actual tangent-constrained curve rig as patch boundaries, including its
   * resolved geometric endpoint cells. Those curves are not raw zero-cell sweep
   * observations. Feature observations read the compiled field's own smooth
   * domain course. No observation enters the cage registry, changes a sampling
   * cell or adds a vertex.
   *
   * @param props Network, shared rig lookups and optional segment counts
   * @returns A one-use reader producing caller-owned rest polylines; subsequent
   *   reads and requests without counts return an empty array
   * @throws Error for missing, invalid or unknown counts or any sweep/curve
   *   refusal
   */
  export function prepareSurfaceConstruction(props: IAutoMoviePrepareSurfaceConstruction.IProps): () => IAutoMovieSurfaceConstruction[] {
    return prepareSurfaceConstructionImplementation(props);
  }

  /**
   * Compile the volume-settled joint-scale update of a sealed sweep rig.
   *
   * Section moments and the authored sweep's rest-volume target are computed
   * once. Each pose updates the shared orientation first, then this writer
   * settles the joint factor and writes every registered scale slot. The
   * network's separate girth multipliers apply after that settlement, matching
   * the rig's existing ordering; the target is the authored sweep's volume before
   * girth correction.
   *
   * @param props.surface The immutable compiled authored sweep, metre units
   * @param props.orientation Current shared pose frames, updated before this
   *   writer
   * @param props.joints Which authored station indices are joints
   * @param props.scaleU Sealed registered scale parameters along u
   * @param props.girth Shared radial correction factors, refreshed in place by
   *   the owning rig
   * @param props.scales Receives the final scale per registered slot
   * @param props.writeFrame The rig's packed-frame serializer used during
   *   compilation
   * @returns A pose writer that updates the supplied scale buffer in place
   */
  export function preserveSweepVolume(props: IAutoMoviePreserveSweepVolume.IProps): () => void {
    return preserveSweepVolumeImplementation(props);
  }

  /**
   * The spacing a sample gives its cell below and above one axis, infinite where
   * that side is not reached.
   *
   * @param step Signed spacing between adjacent samples
   * @param first Whether this is the first sample
   * @param last Whether this is the last sample
   * @returns Below and above spacing; negative steps reverse the end roles
   */
  export function reachSurfaceCell(step: number, first: boolean, last: boolean): [number, number] {
    return reachSurfaceCellImplementation(step, first, last);
  }

  /**
   * Register a fixed-cell Cartesian section average for parameter correspondence.
   *
   * Parameter correspondence pairs the curve parameter, so an off-axis, concave
   * section or an authored origin cannot be reconstructed from a polar radius.
   * The tensor trapezoid first averages the unscaled two-dimensional shape over
   * v, then its scaled points over u, in the centre frame just as the radial
   * writer does. The u-dependent scale belongs inside that second average.
   * Direction-correspondence radius averaging remains with rigSweep.
   *
   * Each signed coordinate is normalized by its largest magnitude before the
   * weighted sum. This avoids overflow in the sum and preserves an ordinary
   * positive subnormal constant. A genuine cancelling mean may be the origin;
   * only a nonzero normalized result lost in multiplication is refused. Scale
   * products, positive weights and world coordinates are admitted before output
   * publication. A rejected write leaves the caller's output buffer unchanged.
   *
   * @param props The compiled unscaled surface, fixed footprint and live rig
   *   views
   * @returns The allocation-free writer in model metres
   * @throws Error for nonfinite source coordinates, invalid or unrepresentable
   *   cell reaches/weights, scale products, signed means or world coordinates;
   *   write failures preserve the output buffer.
   */
  export function sampleParameterSweep(props: IAutoMovieSampleParameterSweep.IProps): (out: Float64Array, offset: number) => void {
    return sampleParameterSweepImplementation(props);
  }

  /**
   * Sample a surface network into a quad control cage at one tier.
   *
   * This is the rest cage of `rigSurfaceNetwork` without bindings, which
   * states every fill rule, the welding identity, the topology guarantee, the
   * limit fit and which vertices it holds, the UV default and every refusal. A
   * caller that poses the network every frame compiles the rig once and calls its
   * `pose` instead of sampling a posed network again.
   *
   * @param props.network The network, only read.
   * @param props.tier The tier to sample.
   * @param props.fit Whether to fit controls to the limit surface; omitted, true.
   * @returns The cage, its targets, coordinates, patch grids and rings.
   * @throws Error as `rigSurfaceNetwork` documents.
   */
  export function sampleSurfaceNetwork(props: IAutoMovieSampleSurfaceNetwork.IProps): IAutoMovieSurfaceCage {
    return sampleSurfaceNetworkImplementation(props);
  }

  /**
   * Sample a section's radius from its origin at evenly spaced polar angles.
   *
   * Radius `k` lies along angle `2 pi k / count`, measured counterclockwise from
   * the section plane's `+x` axis. A radial section is read through its periodic
   * spline, `interpolateSpline`. A superellipse centred on its origin is
   * read in closed form: in the quadrant holding the angle, with that quadrant's
   * half-axes `a` along `x` and `b` along `y` and exponent `n`, the curve is `|x
   * / a|^n + |y / b|^n = 1`, so the radius is `(|cos a / a|^n + |sin a /
   * b|^n)^(-1/n)`, and it is star-shaped and counterclockwise by construction.
   * Any other curve is first walked at 64 points per segment (at least 1,024) to
   * bracket each angle between two curve parameters, then the parameter is
   * bisected forty times against the curve's own polar angle, so the radius lies
   * on the exact curve rather than on a chord.
   *
   * The walk checks the sampled curve for star-shapedness about its origin and
   * winding counterclockwise: the polar angle must strictly increase between
   * successive points and turn once in total, or the curve is refused, because
   * the sampled walk would not pair its points by direction. This finite walk
   * does not certify monotone polar angle between probes.
   *
   * @param props.section The section, only read.
   * @param props.count Number of angles, an integer of at least 3.
   * @returns Radii in metres, one per angle, all positive.
   * @throws Error when the count is not an integer of at least 3, the section's
   *   numbers are not finite or out of range, or the curve passes through its
   *   origin, winds clockwise or is not star-shaped about it.
   */
  export function sampleSweepSection(props: IAutoMovieSampleSweepSection.IProps): number[] {
    return sampleSweepSectionImplementation(props);
  }

  /**
   * Create the motion buffers of a rest skeleton.
   *
   * `update` computes each bone's rotation `Q_b R_b^-1`, normalized, and keeps
   * its rest and posed origins, so `apply` moves a point by `P_b + Q_b R_b^-1 (p
   * - O_b)` as the sweep pose transform. Until the first `update` and
   * after `reset` it copies points and directions unchanged, so a rig at rest
   * reproduces its unposed cage bit for bit.
   *
   * @param rest Bones at rest, from `resolvePose` of an empty pose; only read.
   * @returns The buffer, every motion the identity until updated.
   */
  export function bufferBones(rest: readonly IAutoMovieResolvedBone[]): IAutoMovieBoneBuffer {
    return bufferBonesImplementation(rest);
  }

  /**
   * Compile a sweep into an evaluable surface.
   *
   * Under direction correspondence, the default, each station's section is
   * sampled at 512 directions by `sampleSweepSection`. For each
   * direction the radii of the stations form a profile along `u`, interpolated by
   * `interpolateSpline`, a C2 spline under tension, so curvature is
   * continuous at interior stations, with its sampled overshoot policy; queried
   * non-positive radii are refused. Before the first or after the last station it
   * holds that station's radius.
   *
   * Under parameter correspondence each loop of each station, the section and
   * then its holes, is sampled at the same parameters of
   * `parameterizeSweepSection`: a polygon at its corners, any other
   * curve at 512 even parameters. Each sample's two coordinates are interpolated
   * along `u` by the same spline and joined linearly round the loop, so corner
   * `k` of every station meets corner `k` of the next, as a loft between
   * corresponding polygons blends them. Guides and features read radii by
   * direction and are refused here; the scale profile applies to every loop.
   *
   * Guides make the radius field a Gordon surface (Gordon 1969, "Spline-blended
   * surface interpolation through curve networks", J. Math. Mech. 18(10)): the
   * Boolean sum `P + G - T` of the profile interpolant `P` (the stations, along
   * `u`), the guide interpolant `G` (the guides, round the turn) and their tensor
   * interpolant `T` (the profile interpolant read at the guide directions, round
   * the turn). Both directions use the spline, round the turn its periodic form
   * over the guide directions. At a guide's direction `G - T` is the guide's
   * radius less the profile's, so the surface passes through every guide at every
   * `u` on the sampled angular grid; non-grid guide directions are reconstructed
   * linearly from that grid. Where a guide disagrees with a station at the
   * station's `u`, the network is incompatible and the guide wins, so the
   * station's section is moved by the guides' disagreement interpolated round the
   * turn; a single guide moves the whole section by its one difference. Rows are
   * cached by `u`.
   *
   * Features next: each feature curve is the smooth curve through its points that
   * `compileSweepFeature` builds, and at a query point the radius moves
   * by the feature's residual at the course point found by its dense-seeded local
   * search in the cylindrical metric approximation, the declared radius less the
   * guided radius there or the declared offset, times `(1 - (d / width)^2)^3`
   * within `width`. The surface therefore follows each feature curve to the
   * search's accuracy where no other feature's band overlaps it, and the band has
   * no crease along it.
   *
   * A scale profile, where the sweep gives one, multiplies the result last,
   * features included, so it resizes the section as shaped; `profile` reads the
   * radius before it and `scale` the profile's factor. Posing relies on this
   * order: it changes only the scale, so the shape before it is pose-invariant.
   *
   * The section plane at `u` is the spine's rotation-minimizing frame, or under
   * the `fixed` orientation the start frame's axes at the spine point (a
   * translational sweep), turned by the stations' rotations: each station's
   * rotation relative to that frame at its `at` is interpolated by normalized
   * linear quaternion interpolation between stations, as sweep-based deformation
   * interpolates key-ellipse orientations (Hyun et al. 2005, The Visual Computer
   * 21(8-10):542-550), and held beyond the end stations;
   * `loadSweepSpine` and `orientSweep` compute both.
   *
   * @param sweep The sweep, only read and retained by the returned surface.
   * @returns The compiled surface.
   * @throws Error when the spine is refused by `frameSweepSpine`, a
   *   section by `sampleSweepSection`, a station, guide or feature is
   *   out of range, unordered or not finite, or two guides share a direction;
   *   and, when a row is first evaluated, when a profile, guide, feature or scale
   *   query is non-positive or not finite.
   */
  export function compileSweep(sweep: IAutoMovieSweep): IAutoMovieSweepSurface {
    return compileSweepImplementation(sweep);
  }

  /**
   * Compile one feature curve of a sweep into the radius change it makes at a
   * point of the sweep's domain.
   *
   * The curve is the centripetal Catmull-Rom spline through its points in the
   * `(u, angle)` domain, each angle unwrapped so consecutive points take the
   * shorter way round and a point repeating its predecessor dropped, continued
   * straight beyond its ends through reflected phantom points. Its knots are
   * spaced by the square root of each chord measured in metres, `u` by the
   * spine's length and angle by the sweep's mean radius, so each segment has no
   * cusp or self-intersection however unevenly its points are spaced (Yuksel,
   * Schaefer and Keyser 2011, Computer-Aided Design 43(7):747-755), and it is C1
   * in that knot parameter. Its radius or offset follows the same parameter by
   * `interpolateSpline`, so it too runs smoothly along the curve. At a
   * query point a nearest candidate on the curve is searched in a local
   * cylindrical metric: `u` scaled by the spine's length and angle by the query's
   * radius before features. This approximates surface distance; it is not the arc
   * metric of a noncircular section. The search seeds sixteen times the number of
   * segments uniformly over the knot span and refines the nearest seed by four
   * Newton steps. It keeps the seed if refinement moves further away; this local
   * search does not guarantee the global nearest point. Its smooth course removes
   * polyline corners, though a nearest-branch change inside a bend tighter than
   * the band can still crease the field. The radius moves by the residual there,
   * the declared radius less the surface's radius at the curve or the declared
   * offset, times `(1 - (d / width)^2)^3` within `width`, a falloff with
   * continuous curvature at the band's edge.
   *
   * @param feature The feature, validated, only read.
   * @param scale The spine's length and the sweep's mean radius, metres, which
   *   set the knot spacing.
   * @returns The shared course in domain coordinates and the displacement at `u`
   *   and `angle`, given the local radius, spine length and pre-feature radius.
   */
  export function compileSweepFeature(feature: IAutoMovieSweep.IFeature, scale: IAutoMovieCompileSweepFeature.IScale): IAutoMovieCompileSweepFeatureOutput {
    return compileSweepFeatureImplementation(feature, scale);
  }

  /**
   * Solve control positions of a quad cage whose Catmull-Clark limit surface
   * passes through given targets, one per vertex.
   *
   * The limit point of a cage vertex is a fixed linear combination of the vertex
   * and its one-ring. An interior vertex of valence `n` goes to `(n^2 P + 4 sum
   * E
   *
   * - Sum D) / (n (n + 5))`, its edge neighbours `E`and the opposite corners`D`of
   *   its quads (Halstead, Kass and DeRose 1993, SIGGRAPH, "Efficient, fair
   *   interpolation using Catmull-Clark surfaces"); a boundary vertex, whose
   *   boundary is an infinitely sharp crease, goes to`(A + 4 P + B) / 6`along its
   *   two boundary neighbours, the cubic B-spline
   *   limit`subdivideSurface`gives boundaries. Interpolation is the
   *   linear system`L P = T`. It is solved by Jacobi iteration `P <- P + (T - L
   *   P)`from`P = T`, which converges when every eigenvalue of `L` lies between 0
   *   and 2; on a regular grid they lie between 1/9 and 1, and each stencil is a
   *   convex combination dominated by its own vertex. It stops when the largest
   *   residual falls below 1e-10 of the targets' extent or after 2,000 sweeps,
   *   and returns the residual it reached, so a caller can refuse a fit that did
   *   not converge.
   *
   * Pinned vertices keep their target as their control position and are not
   * solved, which is how a cage meets a fixed junction ring exactly: their limit
   * points then depend on the cage around them.
   *
   * @param props.faces Quads as four vertex indices, a manifold with consistent
   *   winding; only read.
   * @param props.targets Packed target points `[x, y, z, ...]`, one per vertex;
   *   only read.
   * @param props.pinned Whether each vertex keeps its target as its control
   *   position; omitted, none.
   * @returns The packed control positions and the largest remaining residual of
   *   an unpinned vertex, in the targets' unit.
   * @throws Error when a face is not a quad, an index is out of range, a vertex
   *   belongs to no face, or a vertex has other than zero or two boundary edges.
   */
  export function fitSubdivisionLimit(props: IAutoMovieFitSubdivisionLimit.IProps): IAutoMovieFitSubdivisionLimit.IResult {
    return fitSubdivisionLimitImplementation(props);
  }

  /**
   * Compile a spine into its curve, tangent and rotation-minimizing frames.
   *
   * The curve is the centripetal Catmull-Rom spline through the points (Yuksel,
   * Schaefer and Keyser 2011, Computer-Aided Design 43(7):747-755), which has no
   * cusp or self-intersection within a segment and follows a bent chain closely;
   * the ends continue straight through phantom points reflected from the second
   * and second-last points. Each segment is evaluated in its equivalent cubic
   * Hermite form, its end derivatives the spline's knot tangents `(P_k - P_k-1) /
   * d_k-1 - (P_k+1 - P_k-1) / (d_k-1 + d_k) + (P_k+1 - P_k) / d_k` over the
   * centripetal spacings `d`, so positions and tangents are closed forms with no
   * difference step and scale with the points exactly. A per-coordinate monotone
   * interpolant would stop each coordinate flat at a bent joint and leave a
   * corner there. A declared end tangent replaces the first or last derivative's
   * direction and keeps its length, so the end segment stays a cubic of the same
   * speed that leaves or reaches its point along the declared direction. Within
   * each segment the parameter runs linearly from its start point's chord-length
   * share to its end point's, so stations at those shares sit on the points.
   * Frames are transported by the double reflection method of Wang, Juttler,
   * Zheng and Liu (2008, ACM Trans. Graph. 27(1):2): the first axis starts as
   * `spine.normal` made perpendicular to the first tangent, and each step
   * reflects it across the bisector plane of the step's chord and then across the
   * plane that maps the reflected tangent onto the next tangent, which
   * approximates the rotation-minimizing frame to fourth order in the step. The
   * table holds 64 steps per spine segment; a query between two entries reflects
   * once more from the entry below it.
   *
   * @param spine The spine, only read.
   * @returns The compiled path.
   * @throws Error when the spine has fewer than two points, a point, the normal
   *   or an end tangent is not finite or an end tangent is zero, two consecutive
   *   points coincide, the path reverses at a point, the normal is parallel to
   *   the first tangent, or the tangent vanishes somewhere on the path.
   */
  export function frameSweepSpine(spine: IAutoMovieSweepSpine): IAutoMovieSweepPath {
    return frameSweepSpineImplementation(spine);
  }

  /**
   * Hold the limit perimeter of a surface network's girth rings, the rings that
   * declare `perimeter`, by solving a radial factor along each sweep.
   *
   * A girth ring runs once round one sweep at one `u`. Along a row of
   * valence-four vertices whose loop neighbours lie opposite, beside rows of such
   * vertices, the Catmull-Clark limit is the tensor-product cubic B-spline, so
   * the limit along the row is the periodic uniform cubic B-spline whose control
   * points are `(A + 4 P + B) / 6` for each vertex `P` and its two neighbours `A`
   * and `B` across the row; its perimeter is integrated by five-point
   * Gauss-Legendre quadrature on every span. Each sweep's factor is the
   * sampled-overshoot-policy spline of `interpolateSpline` through 1 at
   * the sweep's other rings at one `u`, which meet neighbouring parts and stay,
   * and through a value at each girth ring, holding its end values beyond the
   * outermost knots; `IAutoMovieSweepRig.girth` folds it into the scale. The
   * girth values solve the system "every measured perimeter equals its
   * declaration" jointly by Broyden's method (Broyden 1965, Mathematics of
   * Computation 19(92):577-593), one rest fit per step: the Jacobian starts
   * diagonal, each perimeter in proportion to its own factor, which is exact
   * where the fit interpolates the row and no neighbouring sample reads another
   * factor, and each step's rank-one update learns how neighbouring rings couple
   * through the spline, cell averages or a least-squares fit, so rings close
   * together converge together where updating each alone would oscillate or
   * crawl; a step that would make a factor non-positive is halved. It stops when
   * every perimeter is within 1e-9 of its declaration and refuses after 24 fits.
   * Non-finite measurements/steps and zero representable progress are refused
   * before a factor update can enter nonterminating positivity backtracking. The
   * initial diagonal uses each measured perimeter directly, without
   * reconstructing it from a potentially cancellation-dominated residual.
   *
   * @param props.network The network, only read.
   * @param props.rings Each ring's vertices in loop order, from the sampler.
   * @param props.faces The cage's quads, only read.
   * @param props.vertices Number of cage vertices.
   * @param props.sweepRig The rig of a sweep by name, sealed.
   * @param props.rest Evaluates the network at rest and writes the fitted control
   *   positions into `positions`.
   * @param props.positions Receives the rest control positions, `3 * vertices`
   *   numbers.
   * @throws Error when a girth ring's perimeter is not positive and finite, it
   *   also has positions, it does not run once round one sweep at one `u`, a
   *   vertex on or beside it is not a regular interior vertex, two rings of one
   *   sweep share a `u`, a measured perimeter is non-positive or non-finite, a
   *   computed step is non-finite, no representable progress is possible, or the
   *   solve does not converge.
   */
  export function holdSurfaceGirths(props: IAutoMovieHoldSurfaceGirths.IProps): void {
    holdSurfaceGirthsImplementation(props);
  }

  /**
   * Sum the volume a sweep encloses from its section moments, its scale at the
   * step midpoints and its frames at every half step.
   *
   * Step `i` of `n` contributes `s^2 A <N, dC> + s^3 (M_x <N, dX> + M_y <N,
   * dY>)`: the area and moments from `momentSweepSections`, the scale
   * `s` and normal `N` at its midpoint, and the changes `dC`, `dX`, `dY` of the
   * origin and plane axes from its start to its end. This is the flux of every
   * section point's velocity through its plane, the swept-volume formula of
   * sweep-based deformation with the first-moment terms of an off-centre section.
   * It counts a region twice where neighbouring sections cross, so it measures
   * the sweep's own volume only while the surface has no self-intersection.
   *
   * @param moments Area, `M_x`, `M_y` per step, `3 n` numbers; only read.
   * @param scales Scale at each step's midpoint, `n` numbers; only read.
   * @param frames Frames at `u = j / (2 n)` for `j` from 0 to `2 n`, twelve
   *   numbers each as `IAutoMovieSweepTransport.frame` writes them; only read.
   * @returns Cubic metres.
   */
  export function integrateSweepVolume(moments: Float64Array, scales: Float64Array, frames: Float64Array): number {
    return integrateSweepVolumeImplementation(moments, scales, frames);
  }

  /**
   * Build a shape-preserving piecewise cubic interpolant through knots, the
   * Fritsch-Carlson scheme.
   *
   * Between two knots the curve is a cubic Hermite segment whose end slopes are
   * set so that it stays monotone: it never leaves the range of the two knot
   * values it joins, so a profile that rises and falls has its maximum at a knot
   * and invents no bulge or dip between distant knots, which a plain cubic spline
   * or Catmull-Rom curve does. Slopes follow Fritsch and Carlson (1980, SIAM J.
   * Numer. Anal. 17(2):238-246): each interior slope starts as the mean of the
   * secants on its two sides, or zero where they differ in sign or either is zero
   * (a local extremum or a flat run); each segment whose slope ratios `alpha =
   * m_k / d_k` and `beta = m_{k+1} / d_k` leave the circle of radius 3 has both
   * slopes scaled back onto it. The result is C1.
   *
   * Open knots extrapolate flat: below the first knot the curve holds the first
   * value and above the last it holds the last. An open curve's end slopes are
   * the adjacent secants, limited by the same rule. Periodic knots wrap: `period`
   * is the length after which the curve repeats, every knot lies in `[0,
   * period)`, and the segment from the last knot to the first plus one period
   * closes the loop with slopes taken across the wrap.
   *
   * A single knot gives a constant curve. Knots must be finite and strictly
   * increasing, with one value per knot.
   *
   * @param props.knots Abscissae, finite and strictly increasing.
   * @param props.values Ordinates, one per knot, finite.
   * @param props.period Repeat length of a periodic curve; omitted, the curve is
   *   open.
   * @returns The interpolant, which evaluates in constant time after a binary
   *   search over the knots.
   * @throws Error when the knots are empty, unsorted or not finite, the values do
   *   not match them, or a period does not exceed the knot span.
   */
  export function interpolateMonotone(props: IAutoMovieInterpolateMonotone.IProps): ((x: number) => number) {
    return interpolateMonotoneImplementation(props);
  }

  /**
   * Build a C2 interpolant through knots with a sampled overshoot policy: the
   * spline under tension of `AutoMovieEngineSpline`, at tension 0 a cubic spline and
   * with a searched tension whose sixteen-part segment scan stays within a tenth
   * of the largest value step within two segments. This is a sampled policy, not
   * a strict bound on extrema; the fixed maximum tension can be returned without
   * scan acceptance. Positive data can produce negative interpolation.
   *
   * It passes through its knots with continuous curvature at interior knots.
   * Constant extension outside open knots need not preserve the endpoint
   * derivative. Radius and scale consumers must refuse invalid query results.
   * Open knots extend flat: below the first knot the curve holds the first value
   * and above the last it holds the last, with second derivative 0 at both ends.
   * Periodic knots wrap: `period` is the length after which the curve repeats and
   * every knot lies in `[0, period)`. One knot gives a constant, two open knots a
   * straight segment.
   *
   * @param props.knots Abscissae, finite and strictly increasing.
   * @param props.values Ordinates, one per knot, finite.
   * @param props.period Repeat length of a periodic curve; omitted, the curve is
   *   open.
   * @returns The interpolant, which evaluates after a binary search over the
   *   knots.
   * @throws Error when the knots are empty, unsorted or not finite, the values do
   *   not match them, or a period does not exceed the knot span.
   */
  export function interpolateSpline(props: IAutoMovieInterpolateSpline.IProps): ((x: number) => number) {
    return interpolateSplineImplementation(props);
  }

  /**
   * Create the face layout of a network's cage.
   *
   * Each emitted patch adds its faces row by row from `t` 0, each row from `s` 0,
   * wound counterclockwise as `(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)`;
   * every face corner carries `(patch, s, t)` and a UV value, the patch's
   * rectangle in texture space or, where it declares none, the band `t in [k / P,
   * (k + 1) / P]` of the unit square for patch `k` of `P`. A patch's UVs are its
   * own, so seams between patches stay seams in texture space. A patch whose
   * faces are no grid, a transition band, gives each corner its own coordinates
   * instead, and corners at the same coordinates share a UV value. `check` then
   * requires every directed edge to appear once.
   *
   * @param network The network, only read.
   * @returns The empty layout.
   */
  export function layoutSurfacePatches(network: IAutoMovieSurfaceNetwork): IAutoMovieSurfaceLayout {
    return layoutSurfacePatchesImplementation(network);
  }

  /**
   * Lay out the quads of a band that changes a sweep's column count, in the
   * band's own coordinates: `s` round the band from 0 to 1, `t` from the start
   * ring at 0 to the end ring at 1.
   *
   * The band has `rows` even rows. Its middle row, row `floor(rows / 2)` from the
   * start, reduces the finer count `F` to the coarser `K` by the standard 2-to-1
   * quad reduction of subdivision modelling: a block takes four fine columns into
   * two coarse columns through six quads, with three interior vertices half-way
   * across the row, the outer two of valence three and the middle one regular;
   * every other column passes straight through as one quad. With `b = (F - K) /
   * 2` blocks and `K - 2b` straight columns, the fine ring stays regular and the
   * band's extraordinary vertices are its `2b` interior poles of valence three
   * and the coarse ring vertices at the blocks' corners, which gain the poles'
   * diagonals: valence five beside a straight column, six between two blocks. A
   * band with both rings regular would need interior valence-five poles to
   * balance the valence-three ones, since the band's interior `4 - valence` and
   * its rings' `3 - band degree` sum to zero; this strip trades that for one row.
   * The rows before the middle row have the start count and the rows after it the
   * end count, so the band can be as tall as its neighbours' rows require.
   *
   * Blocks and straight columns alternate as evenly as rounding allows: of the `b
   *
   * - K - 2b`items round the row, block`i`takes the item holding`(i + 1/2) n / b`,
   *   rounded toward the row's middle, so a band reversed in `s`places its blocks
   *   at mirrored items, except where an odd number of blocks meets an even
   *   number of items. Each ring's points are evenly spaced,`k / F`and`j / K`, so
   *   both weld onto evenly divided neighbours; a block's interior vertices lie
   *   half-way between its second, third and fourth fine points and the midpoint
   *   of its first coarse column, its middle coarse point and the midpoint of its
   *   second coarse column. A 2-to-1 band has no straight columns and so no
   *   shear; any other ratio shears its straight columns, the price of even
   *   rings. Equal counts give a plain grid.
   *
   * @param start Columns at `t` 0, a positive integer.
   * @param end Columns at `t` 1, a positive integer.
   * @param rows Rows across the band, a positive integer.
   * @returns Quads as four corners in patch coordinates, counterclockwise with
   *   `s` right and `t` up.
   * @throws Error when a count is not a positive integer, the column counts
   *   differ by an odd number, or the finer is more than twice the coarser.
   */
  export function layoutSurfaceTransition(start: number, end: number, rows: number): Array<
  [
    Pick<IAutoMovieSurfaceCoordinate, "s" | "t">,
    Pick<IAutoMovieSurfaceCoordinate, "s" | "t">,
    Pick<IAutoMovieSurfaceCoordinate, "s" | "t">,
    Pick<IAutoMovieSurfaceCoordinate, "s" | "t">,
  ]
> {
    return layoutSurfaceTransitionImplementation(start, end, rows);
  }

  /**
   * Compile a spine record into a transport: size it, write its points, starting
   * direction and end tangents, and update it.
   *
   * @param spine The spine, only read.
   * @param frames Whether the transport builds its frame table.
   * @returns The updated transport.
   * @throws Error when an end tangent is not finite or is zero, and whatever
   *   `transportSweepSpine` and its `update` refuse.
   */
  export function loadSweepSpine(spine: IAutoMovieSweepSpine, frames: boolean): IAutoMovieSweepTransport {
    return loadSweepSpineImplementation(spine, frames);
  }

  /**
   * Find the cage face and local coordinates of a surface coordinate on one
   * sampled tier.
   *
   * A patch's grid is even in `(s, t)`, so the face holding a coordinate is
   * column `floor(s * columns)` and row `floor(t * rows)`, the last column or row
   * taking `s` or `t` equal to 1, and the local coordinates are the fractional
   * parts. On a patch whose faces are no grid, a transition band, the face is the
   * first whose bilinear map of its corner coordinates reaches the coordinate,
   * inverted by Newton's method, and the local coordinates are that map's
   * parameters. They follow `IAutoMovieSubdivisionParameter`'s quad convention:
   * `(0, 0)` at corner 0, `u` toward corner 1 along `s`, `v` toward corner 3
   * along `t`, so the result addresses `subdivideSurface`'s output of
   * this cage directly.
   *
   * @param props.cage A sampled tier, only read.
   * @param props.coordinate The surface coordinate.
   * @returns The face's parameter, with `corner` null because every face is a
   *   quad.
   * @throws Error when the patch index is out of range or `s` or `t` lies outside
   *   0 to 1, or a coordinate of a non-grid patch lies on none of its faces.
   */
  export function locateSurfaceCoordinate(props: IAutoMovieLocateSurfaceCoordinate.IProps): IAutoMovieSubdivisionParameter {
    return locateSurfaceCoordinateImplementation(props);
  }

  /**
   * Locate every vertex of a subdivided surface network in the network's own
   * terms, so a field declared over the network, such as a displacement, can be
   * evaluated at each vertex.
   *
   * A vertex's cage face and quad-local coordinates give its surface coordinate,
   * the bilinear blend of the face's corner coordinates, the same chart
   * `mapSurfaceTier` uses, so the coordinate is exact on a grid patch
   * and continuous across faces inside that patch. Different patch charts can
   * assign different addresses to a shared edge; compatible fields must agree
   * there. Each vertex keeps its supplied incident-face address. A sweep or
   * transition patch also gives the sweep's domain point, `u` and `v` carried
   * from `t` and `s` by the patch's ranges. The locations depend only on the
   * network's layout and the tier, never on a pose, so they are computed once per
   * tier and level and serve every pose.
   *
   * @param props.network The network the cage was sampled from, only read.
   * @param props.cage The sampled cage, only read.
   * @param props.parameters Each subdivided vertex's cage face and quad-local
   *   coordinates, `IAutoMovieSubdivisionSurface.parameters` of the cage's
   *   subdivision.
   * @returns One location per vertex, in vertex order.
   * @throws Error when the network's patches are not the cage's, a parameter's
   *   face is out of range or not a quad, or its coordinates leave 0 to 1.
   */
  export function locateSurfaceVertices(props: IAutoMovieLocateSurfaceVertices.IProps): IAutoMovieSurfaceLocation[] {
    return locateSurfaceVerticesImplementation(props);
  }

  /**
   * Locate a point against a direction-correspondence sweep's sampled section
   * planes.
   *
   * Signed plane distance is sampled over 128 equal intervals; sign changes are
   * bisected 48 times and exact sample roots retained. The candidate with
   * smallest absolute radial offset wins. If no root is detected, the nearer end
   * plane is used. Tangential roots or multiple roots between probes can be
   * missed, so that fallback does not prove a point is beyond an end. Polar turns
   * match the surface parameter only for direction correspondence; parameter
   * correspondence is rejected. Offset is signed in-plane radial distance, not
   * Euclidean distance to the surface or a global closest-point certificate.
   *
   * @param props.surface The compiled sweep, only read.
   * @param props.point The point, metres.
   * @returns `u`, the spine parameter of the section plane holding the point, 0
   *   to 1; `v`, the point's polar direction in that plane, a turn from 0 to 1;
   *   and `offset`, its distance outside the surface along that direction in
   *   metres, negative inside.
   * @throws Error when the point is not finite or correspondence is parameter.
   */
  export function locateSweepPoint(props: IAutoMovieLocateSweepPoint.IProps): IAutoMovieLocateSweepPoint.IResult {
    return locateSweepPointImplementation(props);
  }

  /**
   * Carry a point bound to one tier's cage onto another tier of the same network.
   *
   * The point's face and local coordinates on the source tier give its surface
   * coordinate, the bilinear blend of the face's corner coordinates, which is
   * exact on a grid patch because every face spans an axis-aligned rectangle of
   * it, and on a transition band is the same bilinear map the locator inverts;
   * the target tier then locates that coordinate with
   * `locateSurfaceCoordinate`. Both tiers must come from the same
   * network, whose patch list is the shared chart.
   *
   * @param props.from The tier the point is bound to, only read.
   * @param props.to The tier to carry it to, only read.
   * @param props.at The point on `from`: a face index and quad-local coordinates
   *   in 0 to 1.
   * @returns The point on `to`, and its surface coordinate.
   * @throws Error when the face is out of range, the local coordinates leave 0 to
   *   1, or the two cages have different patch lists.
   */
  export function mapSurfaceTier(props: IAutoMovieMapSurfaceTier.IProps): IAutoMovieMapSurfaceTier.IResult {
    return mapSurfaceTierImplementation(props);
  }

  /**
   * Measure the volume a sweep encloses between its end sections.
   *
   * A planar section of area `A(u)` moving with spine point `C(u)` and plane
   * normal `N(u)` sweeps `dV = A(u) <N(u), C'(u)> du` when the section is centred
   * on the spine (Hyun et al. 2005, The Visual Computer 21(8-10):542-550, Section
   * 3.1). A section of this engine may lie off-centre, so the flux of every
   * section point's velocity through the plane is integrated instead: with plane
   * axes `X`, `Y`, a point `C + x X + y Y` moves along `N` at `<C', N> + x <X',
   * N> + y <Y', N>`, which integrates over the section to `A <C', N> + M_x <X',
   * N> + M_y <Y', N>` with the first moments `M_x = (1/3) integral r^3 cos a da`
   * and `M_y = (1/3) integral r^3 sin a da`, and reduces to the published formula
   * when both moments vanish. The area is `(1/2) integral r^2 da`. The integrals
   * use the midpoint rule, 400 steps along the spine and 256 directions round it,
   * with every derivative a difference over its step:
   * `momentSweepSections` integrates the sections before the scale
   * profile and `integrateSweepVolume` sums the flux with the scale and
   * frames, the same two steps a posed sweep's volume preservation runs.
   *
   * The formula counts a region twice where neighbouring sections cross, as on
   * the inside of a tight bend, so it measures the sweep's own volume only while
   * the surface has no self-intersection.
   *
   * @param surface A compiled sweep, only read.
   * @returns Cubic metres.
   */
  export function measureSweepVolume(surface: IAutoMovieSweepSurface): number {
    return measureSweepVolumeImplementation(surface);
  }

  /**
   * Triangulate a sweep directly into a closed mesh, for hard-edged members such
   * as profiles, rails, pipes and tapering piers that need no subdivision cage.
   *
   * Rings sit at the given spine parameters, by default the chord-length shares
   * of the spine's own points, so a sweep along a polyline gets one ring per
   * corner and straight walls between them. Each ring is every loop of the sweep
   * at that parameter: a polygon section under parameter correspondence gives
   * exactly its corners, so corners stay corners; any other loop gives `columns`
   * points at even parameters. Rings are laid out by `canonicalRegion`, outer
   * loop counterclockwise and holes clockwise, so the walls between consecutive
   * rings face out of the solid and the hole walls into the holes. Both ends are
   * capped by triangulating the end rings as planar regions (`trianglesOf`)
   * unless `caps` is false.
   *
   * `flat` shading gives every wall triangle its own corners and plane normal, so
   * section corners and ring edges stay creases; `smooth` shares each ring point
   * between its walls and takes area-weighted vertex normals (`meshOf`), so a
   * polygon approximating a round section reads round. The atlas is metric: on
   * the walls `u` is the distance round the ring and `v` the spine parameter
   * times the spine's polygon length, the distance along a path of straight legs;
   * caps take their section-plane coordinates. A smooth wall repeats each ring's
   * first point at the end of the ring so the seam can carry both `u` 0 and the
   * ring's length, and pools the two normals there.
   *
   * Whether the solid intersects itself is the author's: a spine turning tighter
   * than the section is wide folds the walls through each other.
   *
   * @param props.sweep The sweep, only read.
   * @param props.rows Spine parameters of the rings, at least two, strictly
   *   increasing from 0 to 1; omitted, the spine points' chord-length shares.
   * @param props.columns Points per loop for a section that is not a polygon
   *   under parameter correspondence, at least 3; omitted, 32.
   * @param props.caps Whether to close both ends; omitted, true.
   * @param props.shading `flat` or `smooth`; omitted, `flat`.
   * @returns A new mesh with normals and metric UVs and no skin.
   * @throws Error when `compileSweep` refuses the sweep, the rows or
   *   columns are invalid, a ring is not a valid planar region, or a ring winds
   *   the other way from the first.
   */
  export function meshSweep(props: IAutoMovieMeshSweep.IProps): IAutoMovieMesh {
    return meshSweepImplementation(props);
  }

  /**
   * Measure the area and first moments of a sweep's sections before its scale
   * profile, at the midpoints of 400 equal steps along the spine.
   *
   * At `u = (i + 0.5) / 400` the area is `(1/2) integral r^2 da` and the first
   * moments `M_x = (1/3) integral r^3 cos a da` and `M_y = (1/3) integral r^3 sin
   * a da` of the radius `r = profile(u, v)`, each by the midpoint rule over 256
   * directions. A scale `s` multiplies the area by `s^2` and the moments by
   * `s^3`, so a sweep whose scale or frames change keeps these numbers;
   * `integrateSweepVolume` combines them with its frames and scale.
   *
   * @param surface A compiled sweep, only read.
   * @returns Area, `M_x` and `M_y` per step, `3 * 400` numbers in square and
   *   cubic metres.
   */
  export function momentSweepSections(surface: IAutoMovieSweepSurface): Float64Array {
    return momentSweepSectionsImplementation(surface);
  }

  /**
   * Create the station-rotation buffers of a sweep and the in-place computation
   * of its section planes.
   *
   * The carried frame at `u` is the transport's rotation-minimizing frame, or
   * under the fixed orientation its first frame's axes moved to the spine point.
   * `update` stores each giving station's turn relative to the carried frame at
   * its `at`, the station's rotation premultiplied by the inverse of the carried
   * basis; a station without a rotation has no turn. The plane at `u` is the
   * carried frame turned by the normalized linear interpolation of the two
   * bracketing stations' turns, the second negated when their dot product is
   * negative, held beyond the end stations, as sweep-based deformation
   * interpolates key-ellipse orientations (Hyun et al. 2005, The Visual Computer
   * 21(8-10):542-550). Without any giving station the plane is the carried
   * frame.
   *
   * @param props.transport The spine's transport, with frames; only read.
   * @param props.knots The stations' `at`, strictly increasing; only read.
   * @param props.fixed Whether the carried frame keeps the first frame's axes.
   * @returns The orientation, every station without a rotation until written.
   */
  export function orientSweep(props: IAutoMovieOrientSweep.IProps): IAutoMovieSweepOrientation {
    return orientSweepImplementation(props);
  }

  /**
   * Parameterize a section curve over one closed parameter interval.
   *
   * The parameter `t` runs over `[0, 1)` and wraps; the curve is split into equal
   * parameter spans, one per segment. A superellipse has four, one per quadrant,
   * its angle parameter `p = 2 pi t` as `IAutoMovieSweepSection` defines. A
   * B-spline has one per control point, evaluated with the uniform cubic basis on
   * the four control points around it (Piegl and Tiller, The NURBS Book, 2nd ed.,
   * 1997, Section 2.2, for the uniform knot vector), so `t = k / n` lies opposite
   * control point `k`. A Bezier curve has one per anchor, evaluated with the
   * cubic Bernstein basis. A polygon has one per side, linear between corners, so
   * `t = k / n` is corner `k` exactly. Radial sections are read by direction
   * instead and are not accepted here.
   *
   * @param section The section, only read and retained by the returned closure.
   * @returns The point at a parameter, and the number of segments.
   * @throws Error when the section's numbers are not finite, a superellipse
   *   half-axis is not positive or an exponent lies outside 1 to 20, or a
   *   B-spline or polygon has fewer than three points, or a Bezier curve's point
   *   count is not a positive multiple of three.
   */
  export function parameterizeSweepSection(section: Exclude<IAutoMovieSweepSection, IAutoMovieSweepSection.IRadial>): IAutoMovieParameterizeSweepSection.IResult {
    return parameterizeSweepSectionImplementation(section);
  }

  /**
   * Wrap a transport in the object-returning path record.
   *
   * The record reads the transport as it stands at each query, so it follows a
   * later `update`, except `length`, which is copied when wrapped.
   *
   * @param transport An updated transport with frames, retained.
   * @returns The path.
   */
  export function pathSweepTransport(transport: IAutoMovieSweepTransport): IAutoMovieSweepPath {
    return pathSweepTransportImplementation(transport);
  }

  /**
   * Pose a whole surface network: re-sweep its bound sweeps and carry its free
   * points with their bones, keeping every patch, count and name.
   *
   * Each bound sweep is posed by `poseSweep`. A free node, a curve's
   * through points, direction and normal, and a ring's pinned positions move
   * rigidly with the bone named for them; nodes on a sweep follow that sweep by
   * construction. Anything without a binding keeps its rest position. Because the
   * patch layout is unchanged, sampling the posed network at a tier gives the
   * rest cage's topology, UVs and coordinates with posed positions, which is what
   * a renderer swaps in for the skinned positions.
   *
   * @param props.network The rest network, only read.
   * @param props.bindings Bones by name for its sweeps, free nodes, curves and
   *   rings; omitted entries stay at rest.
   * @param props.rest Bones at rest.
   * @param props.posed The same bones posed.
   * @param props.preserveVolume Passed to every sweep's posing; omitted, false.
   * @returns The posed network, a new record.
   * @throws Error when a binding names an unknown sweep, node, curve or ring, or
   *   a sweep's posing refuses.
   */
  export function poseSurfaceNetwork(props: IAutoMoviePoseSurfaceNetwork.IProps): IAutoMovieSurfaceNetwork {
    return poseSurfaceNetworkImplementation(props);
  }

  /**
   * Re-sweep a sweep in a pose: move its spine and section planes with the bones
   * they ride and rebuild the surface from them, sweep-based deformation after
   * Hyun, Yoon, Chang, Seong, Kim and Juttler (2005, "Sweep-based human
   * deformation", The Visual Computer 21(8-10):542-550).
   *
   * Each spine point moves rigidly with its bone, and the spine's starting
   * direction and any declared end tangents turn with the first or last point's
   * bone. Each station's rest plane, its own rotation or the rest sweep's frame
   * at its `at`, turns with its bone; a station on two bones takes the spherical
   * midpoint of the two turned planes. The posed sweep carries those planes as
   * station rotations, so between stations the turn relative to the posed spine's
   * rotation-minimizing frame is interpolated by normalized linear quaternion
   * interpolation: a twist at one station spreads evenly to the next instead of
   * wringing the surface beside one joint, and sections at a bent joint stay
   * across the tube rather than collapsing into it. Sections, guides, scale and
   * features are kept as they are, so the surface keeps its shape in each section
   * plane.
   *
   * With `preserveVolume`, the sections of stations on two bones are scaled
   * together by one factor until the posed volume, by
   * `measureSweepVolume`, equals the rest volume: the scale profile
   * gains a knot at every station, the factor at joint stations and 1 at the
   * others, multiplied into any existing profile, and the factor is found by
   * secant steps, as the paper first rescales the key section at the bent joint
   * (Section 4.4), by `settleSweepVolume`. Without joint stations the
   * sweep is returned unscaled. The scale applies after features, so the
   * section's shape is unchanged and only its size at the joints moves.
   *
   * @param props.sweep The rest sweep, only read.
   * @param props.binding Bones of its spine points and stations.
   * @param props.rest Bones at rest.
   * @param props.posed The same bones posed.
   * @param props.preserveVolume Whether to rescale joint sections to the rest
   *   volume; omitted, false.
   * @returns The posed sweep, a new record sharing the rest sweep's sections.
   * @throws Error when the binding does not align with the sweep, a bone is
   *   missing, or the rest sweep is refused by `compileSweep`.
   */
  export function poseSweep(props: IAutoMoviePoseSweep.IProps): IAutoMovieSweep {
    return poseSweepImplementation(props);
  }

  /**
   * Create the vertex registry of a surface rig.
   *
   * A point is one vertex per identity. Points other than sweep points get their
   * writer when first registered. A sweep point records, on each side along `u`
   * and `v`, the finest spacing to a neighbouring sample that any sampling of it
   * reports, and `finalize` makes its writer from that cell with
   * `IAutoMovieSweepRig.sample`, a side none reached mirroring the other and an
   * axis none spans having no extent, so the point does not depend on which patch
   * sampled it first. Its writer slot is held in registration order, so writers
   * still run after everything they read. After resolving every sweep writer,
   * finalization binds dependent geometric node writers and probes once, before
   * sweep sealing. This field is independent of later control pins. Registering
   * or binding after finalization, or finalizing twice, is refused.
   *
   * @param sweepRig The rig of a sweep by name.
   * @returns The empty registry.
   */
  export function registerSurfaceVertices(sweepRig: (name: string) => IAutoMovieSweepRig): IAutoMovieSurfaceRegistry {
    return registerSurfaceVerticesImplementation(sweepRig);
  }

  /**
   * Compile a bridge patch's interior for per-pose evaluation, returning the
   * writer that fills its rows into a target buffer.
   *
   * Column `k` joins loop point `k` of the first loop to loop point `k` of the
   * second by the cubic Hermite curve `h00 A + h10 m T_A + h01 B + h11 m T_B`,
   * `m` the tension times the chord, row `j` at `t = j / rows`. A loop point's
   * direction follows its loop's rule: at a sweep point the sweep's outward
   * normal for `normal`, its opposite for `inward`, and its unit derivative along
   * the spine, forward or backward, for `forward` and `backward`; at a curve
   * point the curve's declared direction. Under `across` the direction is the
   * normal, the sweep's or the curve's blended one, crossed with the loop's chord
   * between the points one first-row length, `m / rows`, before and after it
   * along the loop, at least reaching both neighbours. That chord is the loop's
   * tangent at the scale of the first row, so near a corner of the loop the
   * columns turn over the points within one row of it rather than at the corner
   * alone, and no column overtakes its neighbour.
   *
   * @param props.from The first loop's points, in order; their `sweep` and
   *   `curve` decide directions.
   * @param props.to The second loop's points, the same count.
   * @param props.fromIndex Vertex index of each first-loop point.
   * @param props.toIndex Vertex index of each second-loop point.
   * @param props.fromRule The first loop's tangent rule.
   * @param props.toRule The second loop's tangent rule.
   * @param props.probes Probe slot of each sweep point of both loops, first loop
   *   then second, -1 for a curve point.
   * @param props.rows Faces along each column.
   * @param props.tension Tangent length over chord length.
   * @param props.interior Vertex index of row `j` of column `k` at `k * (rows -
   *   1) + j - 1`.
   * @returns The writer, which reads the loops' vertices and writes the interior
   *   into the same buffer.
   */
  export function rigSurfaceBridge(props: IAutoMovieRigSurfaceBridge.IProps): ((targets: Float64Array) => void) {
    return rigSurfaceBridgeImplementation(props);
  }

  /**
   * Compile a Coons patch's interior for per-pose evaluation, returning the
   * writer that fills it from its boundary.
   *
   * The interior point at `(s, t) = (i / columns, j / rows)` is the bilinearly
   * blended Coons patch of its four sides (Coons 1967, MIT Project MAC TR-41):
   * the two ruled blends `(1 - t) B(s) + t T(s)` and `(1 - s) L(t) + s R(t)` less
   * the bilinear blend of the four corners, eight boundary points with weights
   * fixed by `(s, t)`.
   *
   * @param grid Vertex indices by row `j` from 0 to `rows` and column `i` from 0
   *   to `columns`, boundary and interior; only read.
   * @returns The writer, which reads the boundary vertices and writes the
   *   interior into the same buffer.
   */
  export function rigSurfaceCoons(grid: number[][]): ((targets: Float64Array) => void) {
    return rigSurfaceCoonsImplementation(grid);
  }

  /**
   * Compile a network curve for per-pose evaluation.
   *
   * The curve is the centripetal Catmull-Rom spline through its start node, its
   * through points and its end node, by chord-length share. At a node on a sweep
   * its end direction is the spline's own less its part along the sweep's normal
   * there, so it leaves or reaches the sweep in the sweep's tangent plane. A
   * bridge leaving the curve under the `across` rule takes the declared normal at
   * mid-curve, turning linearly toward each end to the sweep's normal at a sweep
   * node; under the other rules it takes the declared direction. Through points,
   * the normal and the direction ride the curve's bone when it has one, and the
   * nodes are written by their own rig.
   *
   * @param props.name The curve's name, for diagnostics.
   * @param props.curve The curve, only read.
   * @param props.from The start node.
   * @param props.to The end node.
   * @param props.bone Bone index of the through points, normal and direction, or
   *   -1 for none.
   * @param props.bones The rig's bone motions, or null for a rig without bones.
   * @returns The curve's rig.
   * @throws Error from `update` when the curve meets a sweep along its normal or
   *   the spline is refused by `transportSweepSpine`.
   */
  export function rigSurfaceCurve(props: IAutoMovieRigSurfaceCurve.IProps): IAutoMovieSurfaceCurveRig {
    return rigSurfaceCurveImplementation(props);
  }

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
   * fades instead of aliasing into ripples. A point sampled by several patches or
   * sides takes, on each side, the finest spacing any of them gives there, and a
   * side none of them reaches mirrors the other, so a point's position does not
   * depend on patch order and a mirrored layout samples to a mirrored cage; a
   * node on a sweep that no grid samples is the section point itself. A Coons
   * patch takes its four sides' points and fills the interior as
   * `rigSurfaceCoons` states; a bridge fills its rows with cubic Hermite
   * curves between its two loops, as `rigSurfaceBridge` states; a
   * transition band lays its quads out by `layoutSurfaceTransition` and
   * samples every corner on its sweep. A network curve is compiled by
   * `rigSurfaceCurve`, which regenerates its whole spline from sweep
   * nodes and tangent planes evaluated with the same registry-resolved cell as
   * their geometric targets. Observation-only sweep nodes keep a zero cell. This
   * is a fixed local footprint derivative, not a differential of footprint size
   * across the network. Vertices are shared by identity, never by distance: a
   * point of a sweep is named by the sweep and its domain coordinates rounded to
   * nine decimals, a curve point by the curve and its share, a node by its name.
   *
   * The patch grids alone decide the topology, so one network gives every input
   * and every pose the same cage at a tier. A ring may only name points that
   * patches made, and a bridge loop only sweep points that patches made, which
   * catches sides that do not meet; an edge used twice in the same direction is
   * refused as overlapping or misoriented patches.
   *
   * With `fit` (the default) the samples of sweeps and curves are targets the
   * cage's Catmull-Clark limit passes through, solved by
   * `solveSubdivisionLimit`; the interior vertices of Coons patches and
   * bridges are blend controls of their own construction and keep their samples
   * as control positions, because interpolating a blend's samples makes the limit
   * surface ring between them where a loop turns sharply; pinned ring vertices
   * keep their given positions. Without, controls are the samples themselves and
   * the residual is 0. A ring that declares a perimeter is held to it at rest by
   * `holdSurfaceGirths`, a radial factor along its sweep that every pose
   * keeps. Every face corner carries `(patch, s, t)` and a UV value: the patch's
   * rectangle in texture space, or the band `t in [k / P, (k + 1) / P]` of the
   * unit square for patch `k` of `P`.
   *
   * Bindings make the rig posable exactly as `poseSurfaceNetwork` poses
   * the network: bound sweeps by `rigSweep`, free nodes, curve through
   * points, normals and directions and ring positions rigidly with their bones.
   * Everything else is computed here once; `pose` refreshes only the bones, the
   * bound sweeps, the curves, the samples, the blends, the pins and the fit, into
   * buffers sized here.
   *
   * @param props.network The network, only read; its sweeps are retained through
   *   their rigs.
   * @param props.tier The tier to sample.
   * @param props.fit Whether to fit controls to the limit surface; omitted, true.
   * @param props.bindings Bones by name for sweeps, free nodes, curves and rings;
   *   omitted, none.
   * @param props.rest Bones at rest, required with bindings.
   * @param props.construction Optional rest construction sample counts;
   *   inspection uses raw sweep observation writers and the actual regenerated
   *   network curves after the girth solve; these are separate evaluation
   *   stages.
   * @param props.preserveVolume Whether bound sweeps keep their rest volume at
   *   joint stations; omitted, false.
   * @returns The rig.
   * @throws Error when a name is unknown or repeated, a binding names nothing in
   *   the network or comes without rest bones, a count is not a positive integer,
   *   a curve meets a sweep along its normal, a patch's opposite sides differ in
   *   count or its sides do not close, a bridge's loops differ in count or name
   *   points no patch made, a ring's positions do not match its loop, patches
   *   overlap, or the rest fit does not converge.
   */
  export function rigSurfaceNetwork(props: IAutoMovieRigSurfaceNetwork.IProps): IAutoMovieSurfaceRig {
    return rigSurfaceNetworkImplementation(props);
  }

  /**
   * Compile one sweep of a surface rig: its rest surface, and, when it rides
   * bones, the buffers that re-sweep it per pose as `poseSweep` does.
   *
   * At rest every slot reads the compiled rest surface. Posed, each spine point
   * moves with its bone, the starting direction and any end tangents turn with
   * the first or last point's bone, and the spine is re-transported in place;
   * each station's rest plane turns with its bone, or takes the spherical
   * midpoint of its two bones' turns, and the orientation is recomputed; every
   * registered plane is then read from it. With volume preservation and joint
   * stations, the scale profile gains a knot at every station and rest scale
   * knot, the rest scale times a joint factor at joint stations and times 1
   * elsewhere, and `settleSweepVolume` finds the factor whose volume,
   * from the rest section moments and this pose's frames by
   * `integrateSweepVolume`, equals the rest volume. Without either the
   * scale stays the rest profile. A girth factor set by `girth` then multiplies
   * every scale slot, at rest and after settling, so the settled volume is the
   * rest volume before that correction. Shapes before scale come directly from
   * the shared shape evaluator and are read once at registration; no scaled
   * result is divided back into a shape. Parameter-correspondence cells average
   * actual signed section coordinates; radial cells retain radius averaging about
   * their authored direction. Valid Cartesian cancellation at the origin is
   * allowed. Unrepresentable nonzero cell averages, scaled samples and girth
   * products are refused. Girth admission stages every factor, product and probe
   * before committing.
   *
   * @param props.sweep The sweep, only read and retained through its compiled
   *   surface.
   * @param props.binding Bone indices of its spine points and stations, as
   *   `IAutoMovieSweepBinding` names them; omitted, the sweep stays at rest.
   * @param props.preserveVolume Whether posing restores the rest volume at joint
   *   stations.
   * @returns The rig, open for registration.
   * @throws Error when `compileSweep` refuses the sweep, the binding
   *   does not align with it, a slot is registered after `seal`, or a probe cell
   *   is negative or nonfinite; and from `pose` whatever the spine transport
   *   refuses.
   */
  export function rigSweep(props: IAutoMovieRigSweep.IProps): IAutoMovieSweepRig {
    return rigSweepImplementation(props);
  }

  /**
   * Find the factor on a posed sweep's joint sections that restores its rest
   * volume, by secant steps.
   *
   * The first two trials are 1 and `sqrt(target / V(1))`, the factor that would
   * restore the volume if it scaled as an area; then up to eight secant steps,
   * each factor held at 0.1 or more, stop when the volume is within 1e-6 of the
   * target or two trials give the same volume. Volume preservation in sweep-based
   * deformation rescales the key section at the bent joint the same way (Hyun et
   * al. 2005, The Visual Computer 21(8-10):542-550, Section 4.4).
   *
   * @param target The rest volume, cubic metres.
   * @param volume The posed volume at a joint factor.
   * @returns The last factor tried.
   */
  export function settleSweepVolume(target: number, volume: (factor: number) => number): number {
    return settleSweepVolumeImplementation(target, volume);
  }

  /**
   * Solve, in place, the control positions whose Catmull-Clark limit points are
   * the targets.
   *
   * The free vertices satisfy `L P = T` for the limit stencils `L`, solved by
   * Jacobi iteration `P <- P + (T - L P)` from `P = T`; held vertices keep their
   * target as their control position. The iteration converges when every
   * eigenvalue of `L` lies between 0 and 2; on a regular grid they lie between
   * 1/9 and 1. It stops when the largest residual of a free vertex falls below
   * 1e-10 of the targets' extent or after 2,000 sweeps, and returns that
   * residual, so a caller can refuse a fit that did not converge.
   *
   * @param props.stencil Limit stencils of the cage; only read.
   * @param props.targets Packed targets `[x, y, z, ...]`; only read.
   * @param props.free 1 for each vertex to solve, 0 for one held at its target;
   *   only read.
   * @param props.positions Receives the controls, `3 * count` numbers.
   * @param props.scratch A second buffer of the same length, overwritten.
   * @returns The largest remaining residual of a free vertex, in the targets'
   *   unit; 0 when none is free.
   */
  export function solveSubdivisionLimit(props: IAutoMovieSolveSubdivisionLimit.IProps): number {
    return solveSubdivisionLimitImplementation(props);
  }

  /**
   * Build the Catmull-Clark limit stencil of every vertex of a quad cage.
   *
   * An interior vertex of valence `n` goes to `(n^2 P + 4 sum E + sum D) / (n (n
   *
   * - 5))`, its edge neighbours `E`and the opposite corners`D`of its quads
   *   (Halstead, Kass and DeRose 1993, SIGGRAPH, "Efficient, fair interpolation
   *   using Catmull-Clark surfaces"); a boundary vertex, whose boundary is an
   *   infinitely sharp crease, goes to`(A + 4 P + B) / 6`along its two boundary
   *   neighbours, the cubic B-spline limit`subdivideSurface` gives
   *   boundaries.
   *
   * @param faces Quads as four vertex indices, a manifold with consistent
   *   winding; only read.
   * @param count Number of vertices.
   * @returns The stencils.
   * @throws Error when a face is not a quad, an index is out of range, a vertex
   *   belongs to no face, or a vertex has other than zero or two boundary edges.
   */
  export function stencilSubdivisionLimit(faces: ReadonlyArray<readonly number[]>, count: number): IAutoMovieSubdivisionStencil {
    return stencilSubdivisionLimitImplementation(faces, count);
  }

  /**
   * Create the buffers of a spine of `count` points and the in-place compiler of
   * its curve, tangent and rotation-minimizing frames.
   *
   * `update` builds the centripetal Catmull-Rom spline through the points
   * (Yuksel, Schaefer and Keyser 2011, Computer-Aided Design 43(7):747-755),
   * continued straight beyond its ends through phantom points reflected from the
   * second and second-last points. Each segment is stored in its cubic Hermite
   * form, its end derivatives the spline's knot tangents `(P_k - P_k-1) / d_k-1 -
   * (P_k+1 - P_k-1) / (d_k-1 + d_k) + (P_k+1 - P_k) / d_k` over the centripetal
   * spacings `d` scaled by the segment's spacing, so positions and tangents are
   * closed forms. A declared end tangent replaces the first or last derivative's
   * direction and keeps its length. Within a segment the parameter runs linearly
   * from its start point's chord-length share to its end point's. With frames,
   * `update` then transports the first axis, `normal` made perpendicular to the
   * first tangent, by the double reflection method of Wang, Juttler, Zheng and
   * Liu (2008, ACM Trans. Graph. 27(1):2), 64 steps per segment, each reflecting
   * across the bisector plane of the step's chord and then across the plane
   * mapping the reflected tangent onto the next; a frame between two table
   * entries reflects once more from the entry below.
   *
   * @param count Number of spine points, at least two.
   * @param frames Whether to build the frame table; a curve sampled for points
   *   only omits it.
   * @returns The transport, its arrays zero until written.
   * @throws Error when `count` is below two; and from `update` when a point, the
   *   normal or an end tangent is not finite, two consecutive points coincide,
   *   the path reverses at a point, the normal is parallel to the first tangent,
   *   or the tangent vanishes somewhere on the path.
   */
  export function transportSweepSpine(count: number, frames: boolean): IAutoMovieSweepTransport {
    return transportSweepSpineImplementation(count, frames);
  }
}
