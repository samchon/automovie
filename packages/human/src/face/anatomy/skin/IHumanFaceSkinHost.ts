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
 * @evidence contracts/common.md#principled-implementation Seating by nearest point and reading by barycentric transport are the two operations an attachment needs, and both are defined on the actual triangles instead of on a projection of them along a head axis.
 * @evidence contracts/common.md#clear-and-simple-design A one-state host keeps its native geometry private and compiles attached courses from that same geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native triangle correspondence defines every reading; no head-axis projection or per-region replacement defines the host.
 * @evidence contracts/common.md#meaningful-documentation States the one-state scope, the three questions it answers and who consumes them.
 * @evidence contracts/modeling.md#spatial-conventions All coordinates are head-frame metres; signed distances are metres, positive on the outward side of the skin.
 * @evidence contracts/modeling.md#shared-boundaries Every attached part and the skin read the same triangles through this host, so no consumer keeps a second copy of the skin's position or normal.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries the existing skin's geometry rather than defining another anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Introduces no authoring trait.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Defines no render primitive population.
 * @evidenceExclude contracts/modeling.md#rendered-observation The attached-part and skin consumers observe their assembled output.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries geometric correspondence without an anatomical measurement or acquisition protocol.
 * @evidenceExclude contracts/anatomy.md#permitted-range Source and anatomical parameter owners retain admission.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Provides internal geometric access, not personal sculpting inputs.
 *
 * @author Samchon
 */
export interface IHumanFaceSkinHost {
  /**
   * Triangle and barycentric coordinates of the skin point nearest to a free point.
   *
   * @evidence contracts/common.md#principled-implementation Nearest native triangle correspondence retains the actual host feature for later transport.
   * @evidence contracts/common.md#clear-and-simple-design Returns one seat rather than exposing the query index or mesh arrays.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The current native triangles decide the seat without an anatomical label or head-axis proxy.
   * @evidence contracts/common.md#meaningful-documentation Names the free-point input and native correspondence output.
   * @evidence contracts/modeling.md#spatial-conventions The query uses head-frame metres; barycentric coordinates are dimensionless.
   * @evidence contracts/modeling.md#shared-boundaries The seat identifies the same triangles used by the skin and its attached consumers.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
   * @evidenceExclude contracts/modeling.md#parameter-channels Defines no authoring channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no render primitive.
   * @evidenceExclude contracts/modeling.md#rendered-observation The attached consumers observe their emitted geometry.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Computes geometry rather than an anatomical measurement or acquisition protocol.
   * @evidenceExclude contracts/anatomy.md#permitted-range Adds no anatomical range.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Provides no personal authoring input.
   */
  seat(point: readonly number[]): IHumanFaceSkinSeat;

  /**
   * Read the skin position and normals at an existing seat in this host's state.
   *
   * @evidence contracts/common.md#principled-implementation Barycentric transport reads the seat's actual triangle corners and their normals.
   * @evidence contracts/common.md#clear-and-simple-design One frame combines the position and orientation an attached consumer needs.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the native seat instead of reconstructing a head-plane attachment.
   * @evidence contracts/common.md#meaningful-documentation States that the reading belongs to the host's immutable state.
   * @evidence contracts/modeling.md#spatial-conventions Position is in head-frame metres and normals are direction vectors.
   * @evidence contracts/modeling.md#shared-boundaries Native barycentric correspondence keeps the reading on the same skin feature.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
   * @evidenceExclude contracts/modeling.md#parameter-channels Defines no authoring channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Reads geometry without emitting a primitive.
   * @evidenceExclude contracts/modeling.md#rendered-observation The attached consumers observe the assembled result.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Computes geometry rather than a clinical measurement.
   * @evidenceExclude contracts/anatomy.md#permitted-range Adds no anatomical range.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Provides internal correspondence, not personal sculpting controls.
   */
  frame(seat: IHumanFaceSkinSeat): IHumanFaceSkinFrame;

  /**
   * Read exact source correspondence through the same native frame owner.
   * Position retains rational barycentrics until one final binary64 rounding;
   * the existing normal field reads their represented weight values.
   *
   * @evidence contracts/common.md#principled-implementation Exact affine position transport preserves the source chart's correspondence before output rounding.
   * @evidence contracts/common.md#clear-and-simple-design Uses the same position and normal reader as ordinary seats.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No reseating, replacement point or source-independent normal enters.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes position precision from the existing represented normal field.
   * @evidence contracts/modeling.md#spatial-conventions The resulting point remains head-frame metres and normals remain unit directions.
   * @evidence contracts/modeling.md#shared-boundaries Reads the actual triangle retained by the chart inverse.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
   * @evidenceExclude contracts/modeling.md#parameter-channels Adds no trait.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
   * @evidenceExclude contracts/modeling.md#rendered-observation Attached parts observe their output.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Performs geometry transport rather than a clinical measurement.
   * @evidenceExclude contracts/anatomy.md#permitted-range The source and contact owners admit construction.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Provides no personal authoring input.
   */
  frameExact(seat: IHumanFaceExactSkinSeat): IHumanFaceSkinFrame;

  /**
   * Native vertex identities of one host triangle, in its winding order.
   *
   * @evidence contracts/common.md#principled-implementation Index order preserves the exact native feature represented by a seat.
   * @evidence contracts/common.md#clear-and-simple-design Exposes one triangle's identities without exposing the complete mesh.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Returns native indices rather than coordinate-based replacement identities.
   * @evidence contracts/common.md#meaningful-documentation States the ordinal and winding convention.
   * @evidence contracts/modeling.md#shared-boundaries The corner identities address the same native skin samples used by attached consumers.
   * @evidenceExclude contracts/modeling.md#spatial-conventions Returns indices, not spatial quantities.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no anatomical part.
   * @evidenceExclude contracts/modeling.md#parameter-channels Defines no channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
   * @evidenceExclude contracts/modeling.md#rendered-observation Identity transport has no separate rendered result.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Carries source indices without inferring anatomy.
   * @evidenceExclude contracts/anatomy.md#permitted-range Bounds no anatomical value.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Introduces no authoring input.
   */
  corners(triangle: number): number[];

  /**
   * Signed distance to the nearest skin feature, positive on its outward side.
   * The open sheet's sign is meaningful within its local feature size.
   *
   * @evidence contracts/common.md#principled-implementation The native signed query supplies distance and orientation from the same nearest feature.
   * @evidence contracts/common.md#clear-and-simple-design Returns one signed scalar without a second collision representation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the actual sheet and retains its local-sign limitation.
   * @evidence contracts/common.md#meaningful-documentation States the sign and open-sheet validity condition.
   * @evidence contracts/modeling.md#spatial-conventions Input and signed distance are head-frame metres.
   * @evidenceExclude contracts/modeling.md#shared-boundaries Reads an existing boundary without constructing another join.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
   * @evidenceExclude contracts/modeling.md#parameter-channels Defines no channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
   * @evidenceExclude contracts/modeling.md#rendered-observation Numerical reading has no independent rendered output.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Geometric signed distance is not a tissue acquisition.
   * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical admission stays with its owners.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no personal authoring input.
   */
  signedDistance(point: readonly number[]): number;

  /** Smooth outward normals in position-aligned triples; nonzero incident-area sums are normalized and unsupported sums retain zero. Coincident source copies share an area sum. */
  normals: readonly number[];

  /**
   * Compile a finite source-projected guide on this immutable native geometry.
   * Native feature transitions determine the course, independently of relief width.
   *
   * @evidence contracts/common.md#principled-implementation The course compiler takes the lower envelope of actual native-feature distances and checks transition continuity.
   * @evidence contracts/common.md#clear-and-simple-design The host delegates course compilation over its own immutable geometry.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Relief width sets no sampling interval and unsupported nearest-sheet jumps refuse.
   * @evidence contracts/common.md#meaningful-documentation States source ownership, finite feature population and width independence.
   * @evidence contracts/modeling.md#spatial-conventions Input and projected course use head-frame metres.
   * @evidence contracts/modeling.md#shared-boundaries Native support and transition continuity keep the course on the host used by relief consumers.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no new anatomical part.
   * @evidenceExclude contracts/modeling.md#parameter-channels Consumes an internal guide and adds no public authoring channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Creates an internal course, not render primitives.
   * @evidenceExclude contracts/modeling.md#rendered-observation The relief consumers own assembled skin observations.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Geometric projection supplies no tissue measurement or clinical calibration.
   * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical input admission stays with the relief owners.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Does not expose guide points for personal sculpting.
   */
  compileProjectedCourse(
    guide: readonly (readonly number[])[],
  ): IHumanFaceProjectedSkinCourse;
}
