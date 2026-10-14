import type { IHumanFaceExactSkinSeat } from "./IHumanFaceExactSkinSeat";
import type { IHumanFaceProjectedSkinCourse } from "./IHumanFaceProjectedSkinCourse";
import type { IHumanFaceSkinFrame } from "./IHumanFaceSkinFrame";
import type { IHumanFaceSkinSeat } from "./IHumanFaceSkinSeat";

/**
 * The face skin as a host for what grows on it or is pressed into it.
 *
 * One host is compiled for one state of one skin surface. It answers where a
 * free point lands on the skin, what the skin is at a seat, and on which side
 * of the skin a point lies. Brow shafts, skin relief and the surface readings
 * take their skin position and their skin normal from here, so the face has
 * one definition of "on the skin" and "away from the skin".
 *
 * @evidence contracts/common.md#principled-implementation createHumanFaceSkinHost copies one finite native mesh, welds area normals by exact coordinate identity, lazily builds its nearest index and reads persistent seats from that same geometry; an open-sheet distance sign has only local meaning.
 * @evidence contracts/common.md#clear-and-simple-design Seat selection, frame reading, native corners, signed distance and free-guide projection share one immutable physical host rather than separate attachment skins.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ordinary nearest seating recovers bounded binary64 barycentrics, whereas frameExact preserves supplied rational weights; neither certifies clinical accuracy or global inside/outside for an open sheet.
 * @evidence contracts/common.md#meaningful-documentation The API states one-state ownership, metre positions, smooth versus facet normals, exact correspondence and local signed-distance limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This host interface declares operations; createHumanFaceSkinHost and the engine query own construction and query costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no requests; the immutable host implementation owns lazy query reuse and skin-state invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Resource ownership belongs to the host closure and its consumers, not the interface declaration.
 *
 * @author Samchon
 */
export interface IHumanFaceSkinHost {
  /**
   * Triangle and barycentric coordinates of the skin point nearest to a free point.
   *
   * @evidence contracts/common.md#principled-implementation The engine's native nearest query selects a triangle; its Gram solve recovers binary64 barycentrics bounded to that triangle, which is a represented registration rather than an exact-nearest proof.
   * @evidence contracts/common.md#clear-and-simple-design Free-point selection returns topology correspondence while frame remains the physical point/normal reader.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Barycentric bounds are geometric recovery, not a clinical-range clamp or special consumer point; no head-axis projection replaces nearest selection.
   * @evidence contracts/common.md#meaningful-documentation The API distinguishes a free point from an existing persistent seat; host prose gives metre coordinates and local-state ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This method signature implements no nearest search; the host and engine query own it.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The signature schedules no work; the concrete host lazily reuses one query for unchanged copied geometry.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Query retention is owned by the host closure, not this method signature.
   */
  seat(point: readonly number[]): IHumanFaceSkinSeat;

  /**
   * Read the skin position and normals at an existing seat in this host's state.
   *
   * @evidence contracts/common.md#principled-implementation Represented seat weights convert to exact fractions before the common affine reader evaluates the original triangle; topology and barycentric validity remain caller premises.
   * @evidence contracts/common.md#clear-and-simple-design The ordinary seat path delegates to frameExact rather than implementing another point or normal formula.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Existing seats are not nearest-reselected after performance; supplied weights do not become an anatomical measurement certificate.
   * @evidence contracts/common.md#meaningful-documentation The result is explicitly tied to this host state and carries the separately documented smooth and facet normals.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature contains no affine implementation; its host reader owns fixed-corner cost.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The signature coordinates no cache; it reads existing immutable mesh and normals.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned frame arrays are consumer values; the signature acquires no handle or task.
   */
  frame(seat: IHumanFaceSkinSeat): IHumanFaceSkinFrame;

  /**
   * Read exact source correspondence through the same native frame owner.
   * Position retains rational barycentrics until one final binary64 rounding;
   * the existing normal field reads their represented weight values.
   *
   * @evidence contracts/common.md#principled-implementation Rational weights remain exact through each position sum and round once; normals use represented weights and fall back to the facet if their blend vanishes or reverses.
   * @evidence contracts/common.md#clear-and-simple-design One reader owns exact position and both normal outputs for chart and ordinary-seat consumers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact arithmetic preserves native binary64 input correspondence, not hidden anatomical accuracy; no separately rounded position recipe is used.
   * @evidence contracts/common.md#meaningful-documentation The prose distinguishes final position rounding from represented normal interpolation and the common native owner.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature implements no rational evaluation; the concrete host owns fixed-corner arithmetic with input-bit-size cost.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The signature owns no cache; current copied corners and welded normals are reused by the host.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Exact frame temporaries and returned arrays belong to the invoking operation, not this signature.
   */
  frameExact(seat: IHumanFaceExactSkinSeat): IHumanFaceSkinFrame;

  /**
   * Native vertex identities of one host triangle, in its winding order.
   *
   * @evidence contracts/common.md#principled-implementation The host slices three indices at the requested triangle ordinal, preserving its original native winding; valid resident ordinals are a caller premise.
   * @evidence contracts/common.md#clear-and-simple-design Exposing one triangle's identities lets chart admission compare incidence without exposing mutable host indices.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It returns native indices rather than coordinate-nearest aliases or replacement topology.
   * @evidence contracts/common.md#meaningful-documentation The comment defines triangle-local winding order, not world coordinate values.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature implements no slice; the host owns its three-index copy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The signature schedules no cache and reads the immutable index owner.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned small array retains no host handle; the host owns its index copy.
   */
  corners(triangle: number): number[];

  /**
   * Signed distance to the nearest skin feature, positive on its outward side.
   * The open sheet's sign is meaningful within its local feature size.
   *
   * @evidence contracts/common.md#principled-implementation The native signed-mesh query supplies nearest-feature distance and outward sign on this open sheet, without claiming a globally closed-volume classification.
   * @evidence contracts/common.md#clear-and-simple-design Distance reuses the same nearest owner used for seating instead of maintaining a second skin index.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Sign follows actual native features, not a forward-facing head-plane heuristic; the local open-sheet limit remains explicit.
   * @evidence contracts/common.md#meaningful-documentation The comment defines positive outward distance and its local-feature validity limit.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature implements no distance search; the engine query owns traversal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Lazy same-state nearest-index reuse belongs to the concrete host, not this signature.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The host closure owns its retained query; a scalar distance retains no external resource.
   */
  signedDistance(point: readonly number[]): number;

  /** Smooth outward normals in position-aligned triples; nonzero incident-area sums are normalized and unsupported sums retain zero. Coincident source copies share an area sum. */
  normals: readonly number[];

  /**
   * Compile a finite source-projected guide on this immutable native geometry.
   * Native feature transitions determine the course, independently of relief width.
   *
   * @evidence contracts/common.md#principled-implementation The compiler builds exact affine native candidates and their quadratic lower envelope, then refuses discontinuous or unrelated-sheet transitions; physical output rounds to binary64.
   * @evidence contracts/common.md#clear-and-simple-design Guide projection belongs to one course compiler while the relief kernel independently consumes its metric and authored width.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No width-sensitive uniform samples or unsupported chord through air replace complete native-feature intervals.
   * @evidence contracts/common.md#meaningful-documentation The comment gives finite-guide, immutable-host and width-independent transition semantics.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This method signature implements no envelope algorithm; projection helpers own candidate and merge work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Guide-local pair reuse belongs to its compiler; the signature schedules no cross-guide cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned course owns spans and retained geometry references; this signature acquires no handles or tasks.
   */
  compileProjectedCourse(
    guide: readonly (readonly number[])[],
  ): IHumanFaceProjectedSkinCourse;
}
