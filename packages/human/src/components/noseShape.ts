/**
 * Nasal socket and authoring contracts shared by document resolution, editor
 * controls and the nose component. Host coordinates and displacements use
 * millimetres (+X subject left, +Y superior, +Z anterior); angles use degrees.
 * The caller owns these records. createPortraitNoseComponent copies admitted
 * settings before fitting, and the lining reads the resulting shared aperture.
 * Optional complete depth bases are alternatives, not additive corrections.
 * This module declares shape inputs; it does not infer individual anatomy.
 */
import type { IPortraitNasalBodyShape } from "./nasalBody";
import type { IPortraitNasalEnvelope } from "./nasalEnvelope";
import type { IPortraitNasalLobule } from "./nasalLobule";
import type { IPortraitNasalRimSection } from "./nasalRimSection";
import type { IPortraitNasalSection } from "./nasalSection";

/**
 * Subject-owned nasal attachment. The two cut populations are triangle ordinals
 * on the measured host, fixed before a component deforms its openings.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Binds replaceable nasal skin and openings to the caller's host rather than embedding a person's coordinates.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines the midline, relief support locations, surface vertices, original cut-face ordinals and optional section/support datums.
 */
export interface IPortraitNoseSocket {
  /** Nasal midline in the host frame, in mm. */
  midline: number;
  /** Tip influence centre Y, in mm. */
  tipY: number;
  /** Tip influence radii in X/Y, in mm. */
  tipRadius: [number, number];
  /** Alar centres' distance from the midline, in mm. */
  alarOffset: number;
  /** Alar centre Y, in mm. */
  alarY: number;
  /** Alar influence radius, in mm. */
  alarRadius: number;
  /** Host skin vertices that the component directly sculpts. */
  surface: number[];
  /** Original triangle ordinals for each nasal opening. */
  nostrils: number[][];
  /** Optional retained vertex supplying the local section loft's XYZ datum. */
  sectionAnchor?: number;
  /** Three retained skin datums spanning the nasal root and paired facial base. */
  supportPlane?: readonly number[];
}

/**
 * Numerical nasal shape. Width and opening scales change the shared rim; the
 * same changed vertices seed the surrounding skin blend and recessed cavity.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Separates nasal body, tip, alae, nostril aperture, rim tissue and cavity dimensions.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Carries explicit alternative depth bases plus coupled opening scales, tilt, rim refinement and lining controls on the same host.
 */
export interface IPortraitNoseShape {
  /** Width multiplier about the socket midline. */
  widthScale: number;
  /**
   * Optional projection ratio relative to the socket's common skin support
   * plane. Omission/one is identity. Positive smaller values reduce the entire
   * nose's inferred depth, including the samples used by rim fitting. This is
   * a basis replacement and cannot combine with another complete section/body
   * basis. Local final-body lobules may use the scaled datums.
   */
  depthScale?: number;
  /** Optional local tip/alar sections after support scaling; empty/omitted is identity. */
  lobules?: readonly IPortraitNasalLobule[];
  /** Tip displacement along host Z, in mm. */
  tipProjection: number;
  /** Alar displacement along host Z, in mm. */
  alarProjection: number;
  /** Width multiplier in the aperture plane, before overall head-X nasal scaling. */
  nostrilWidthScale: number;
  /** Height multiplier in the aperture plane; preserves its orientation about its centre. */
  nostrilHeightScale: number;
  /** Aperture displacement upwards in host Y, in mm. */
  nostrilRise: number;
  /** Additional rotation around host X, in degrees; positive faces the opening down. */
  nostrilTilt: number;
  /** Inner lining's retained fraction of the fitted rim width/height. */
  cavityContraction: number;
  /** Fraction of cavity travel at the rim support ring; strictly between zero and one. */
  rimSupport: number;
  /** Blend from the measured rim to its fitted smooth ellipse, in [0,1]. */
  rimRoundness: number;
  /**
   * Optional shared anatomical-curve refinement of each aperture. Omission or
   * surface retains general Loop weights; curve uses the host's existing 1D
   * rule on the same skin/lining vertices, without creating a normal crease.
   */
  rimRefinement?: "surface" | "curve";
  /** Optional exterior skin band; omission retains direct skin-to-lining attachment. */
  rimSection?: IPortraitNasalRimSection;
  /**
   * Optional complete envelope per opening, in socket.nostrils order. Empty or
   * omitted retains legacy construction. Each envelope supplies independent
   * circumferential sections after subdivision. It replaces rimSection and
   * surface/curve refinement of the aperture, and cannot stack a final body
   * deformation that would invalidate its shared skin-to-vestibule jets.
   */
  envelopes?: readonly IPortraitNasalEnvelope[];
  /** Cavity floor offset in host XYZ millimetres, rotated with the nostril tilt. */
  cavityOffset: number[];
  /** Reach of adjacent skin adaptation along the original mesh, in mm. */
  blendReach: number;
  /** Optional connected depth basis for the lower nasal body; omission is identity. */
  section?: IPortraitNasalSection;
  /**
   * Optional final exterior construction, after shared refinement. Choose either
   * additive anatomical body sections or a target-depth grid. Both preserve the
   * fitted aperture and its first derivative. joinWidth/depthReach are positive
   * millimetre distances. A pre-fit section cannot also be selected: each is a
   * complete alternative basis, and stacking them would silently compound form.
   * The local lobule alternative instead binds to the same pre-fit scaled
   * datums as ordinary lobules and evaluates after subdivision. It may retain
   * depthScale but cannot stack pre-fit lobules or a complete section. Its depth
   * support is full through half depthReach and fades to zero at depthReach;
   * all alternatives preserve the actual rim and lining. Arrays replace the
   * complete local section population, and an empty population is identity.
   */
  body?: {
    shape:
      | IPortraitNasalBodyShape
      | { section: IPortraitNasalSection }
      | { lobules: readonly IPortraitNasalLobule[] };
    joinWidth: number;
    depthReach: number;
  };
}
