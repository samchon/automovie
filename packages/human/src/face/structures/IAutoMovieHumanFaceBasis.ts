import type { IAutoMovieHumanSkinLandmark } from "../../common/basis/IAutoMovieHumanSkinLandmark";
import type { IAutoMovieMaterial } from "@automovie/interface";

import type { IAutoMovieHumanFaceBasisContact } from "./IAutoMovieHumanFaceBasisContact";
import type { IAutoMovieHumanFaceBasisSurface } from "./IAutoMovieHumanFaceBasisSurface";
import type { IAutoMovieHumanFaceOpticalSupport } from "./IAutoMovieHumanFaceOpticalSupport";

/**
 * An immutable, externally authored connected facial surface and its endpoints.
 * The caller supplies licensed geometry; this package supplies no person's mesh.
 * Coordinates and sparse differences use metres in a right-handed Y-up frame.
 * Each surface owns connectivity and normals across all of its material regions.
 * Changes to geometry, endpoints or attachments require a new basis identity.
 * Endpoint interpolation describes an authored shape, not a physical muscle or
 * rigid-joint simulation. Metadata names what a control does; it does not prove
 * anatomical correctness, nonpenetration or likeness of arbitrary combinations.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasis {
  /** Immutable revision identity, also stored in every dependent document. */
  id: string;

  /**
   * Optional producer-qualified native optical registration, independent of skin
   * source partitions. Supplied numerical optics require the matching side's
   * exact source/chart witnesses. Omission retains the legacy authored globes.
   * These records qualify geometric placement, not clinical ocular dimensions
   * or an observed eyelid margin.
   */
  opticalSupport?: IAutoMovieHumanFaceOpticalSupport[];

  /** Ordered controls. Evaluation follows this order, never object insertion order. */
  channels: {
    /** Anatomical or performance name unique within this basis. */
    id: string;

    /** Optional authored sign/shape meaning; it does not certify a biological range. */
    description?: string;

    /** Identity edits and transient performance remain separate in saved documents. */
    kind: "shape" | "expression";

    /**
     * Finite source-authoring envelope, including zero; weights are refused
     * rather than clamped. This bounds interpolation of authored endpoints,
     * not population anatomy. A measured parameter needs a landmark mapping
     * and population-appropriate norms before such a claim is possible.
     */
    minimum: number;
    maximum: number;

    /** Endpoint applied with abs(weight) on the positive side. */
    positive: string;

    /** Negative-side endpoint, or null for a nonnegative control. */
    negative: string | null;
  }[];

  /**
   * Combination correctives, evaluated after the channels that drive them.
   *
   * Linear addition cannot describe every tissue interaction. For example,
   * independently authored jaw opening and mouth closure may sum to a pose
   * where teeth pass through a lip. A corrective is the authored difference
   * between that sum and the intended combined shape, activated only over the
   * declared driving combination. Sharing tissue alone does not establish that
   * an additive combination is wrong; the combined result needs verification.
   *
   * The activation is a product, not a sum, which is what makes it a
   * corrective rather than another control: it is zero unless every driving
   * side is present, and at half strength on two drivers it contributes a
   * quarter. The form is MetaHuman's, read from Epic's own `PSDNetImpl` rather
   * than from a description of it: `min(1, weight * product of clamped
   * inputs)`.
   *
   * A product of clamped inputs is bilinear, so a corrective solved at full
   * weight on both drivers lands at a quarter of itself when both are at half,
   * on a pose that may cross by more than a quarter as much. The rig answers
   * that the way every blendshape rig does, with an in-between: a driver may
   * name the weight it peaks at and the weights on either side where it fades
   * out, and its factor is then a tent that rises to one there and falls back
   * to zero, by default at full, where the full-weight corrective has taken
   * over. MetaHuman's `ConditionalTable` is the same device, a piecewise-linear
   * ramp per input ahead of the product.
   *
   * Omission is a basis with no correctives, which is exactly what a purely
   * linear prior is. Nothing here infers a corrective; the endpoint it applies
   * has to be authored like any other.
   */
  correctives?: {
    /** Name unique within this basis, distinct from every channel id. */
    id: string;

    /**
     * The driving sides. Each names a channel and which of its two endpoints
     * this corrective answers for, because a signed channel reaches two
     * different faces and a combination of one is not a combination of the
     * other.
     */
    inputs: {
      channel: string;
      side: "positive" | "negative";

      /**
       * The driver weight this input is fully present at, in (0,1]; omitted
       * is 1. Below it the factor rises linearly from zero at `between[0]`;
       * above it, when the peak is under one, it falls linearly to zero at
       * `between[1]`, so an in-between corrective is absent from the full
       * pose it was not solved for.
       */
      peak?: number;

      /**
       * The driver weights on either side of the peak at which this input
       * fades to nothing, `[below, above]` with `below < peak <= above`;
       * omitted is `[0, 1]`. Two in-betweens on one driver whose tents both
       * span the whole envelope fire into each other's poses, and a tongue
       * solved at three quarters was measured to re-cross at a half that had
       * been clear; naming the neighbouring peaks as the span is what makes
       * each in-between whole at its own weight and absent at its neighbours'.
       */
      between?: [number, number];
    }[];

    /** Authored gain in (0,1]; the product of a rig row's authored weights. */
    weight: number;

    /** Endpoint name, resolved in each surface's targets like any other. */
    target: string;
  }[];

  /**
   * Named points of the skin, each a vertex of one surface, for measurement
   * rules that read a drawn landmark (`glabella`, `sellion`, `menton`,
   * `tragion-right`). Rules name a point instead of numbering a vertex, which
   * belongs to one basis's topology; a rule naming a point this basis does
   * not declare refuses by that name. Omission declares none.
   */
  skinLandmarks?: Record<string, IAutoMovieHumanSkinLandmark>;

  /**
   * Named points that move with the shape and define the joints: the
   * centroids of the source's joint cubes, in the head frame. Their endpoint
   * rows use the same sparse `[landmark, dx, dy, dz]` format as a surface,
   * indexed into `ids`, and are resolved by endpoint name alongside the
   * surfaces, so a shape channel that widens the head carries the globe
   * centres with it. Expression endpoints carry no landmark row: a joint's
   * position is identity, its motion is articulation. Required whenever
   * `articulation` is declared.
   */
  landmarks?: {
    ids: string[];

    /** Flat XYZ per landmark, in the basis frame. */
    positions: number[];

    /** Sparse rows per endpoint name, strictly increasing by landmark. */
    targets: Record<string, number[]>;
  };

  /**
   * The articulated performance the basis evaluates before tissue detail:
   * one mandible and two globes, each a rigid transform driven by expression
   * channels and applied through the surfaces' `attachments` before the
   * residual expression endpoints are read. Expression rows on an attached
   * surface are therefore rest-space residuals over the articulation, the
   * way a pose-space blend shape sits under a joint; the preparation that
   * publishes a basis measures them from the source and records the fit.
   *
   * The jaw is a rotation about a transverse axis through the condylar axis
   * point plus a translation coupled to it. In vivo observations show both
   * movements from initial opening (Lindauer et al. 1995,
   * https://pubmed.ncbi.nlm.nih.gov/7771361/); Jasz et al. 2024 measured a
   * near-linear relation only over the first 5 mm of incisal opening
   * (https://pmc.ncbi.nlm.nih.gov/articles/PMC11026373/). The following
   * endpoint-linear trajectory is an authored deterministic approximation,
   * not a clinical path for the entire opening envelope. Opening rotates by
   * `opening.degrees * weight` and translates the whole mandible by
   * `opening.translation * weight`; protrusion and each
   * laterotrusion add their own translation. The condylar axis point is the
   * `pivot` landmark plus `axisOffset`, derived once from the source's own
   * full-open transform under that coupling, and it follows the landmark
   * through every shape channel. The summed sagittal translation of opening
   * and protrusion may not exceed `translationLimitMetres`, which is what
   * sets this basis's supported simultaneous-motion budget. It is an authored
   * refusal boundary, not a measured universal lack of protrusive capacity
   * at full opening; a document past it is refused rather than clamped.
   *
   * Each eye rotates about its `center` landmark by the gaze channels listed,
   * each an authored unit axis, the degrees reached at weight one and the
   * globe translation that accompanies it, fitted from the source globe's own
   * endpoint; the rotations compose in list order and the translations add.
   * Demer and Clark 2019 measured eccentric, gaze-dependent rotation and
   * translation (https://pubmed.ncbi.nlm.nih.gov/31239125/); this fixed
   * landmark plus linear per-channel shift does not recover their individual
   * trajectories. Lids are tissue and carry no globe weight: their gaze coupling is
   * whatever the source authored in the residual rows. Omission of the whole
   * field keeps a purely linear basis.
   */
  articulation?: {
    jaw: {
      /** Landmark id of the source jaw pivot. */
      pivot: string;

      /** Metre offset from that landmark to the condylar axis point. */
      axisOffset: [number, number, number];

      /** Unit rotation axis; a positive angle opens the mouth. */
      axis: [number, number, number];

      opening: {
        channel: string;
        /** Rotation at weight one, in degrees. */
        degrees: number;
        /** Mandibular translation at weight one, in metres, coupled linearly with the angle. */
        translation: [number, number, number];
      };

      protrusion: {
        channel: string;
        /** Mandibular translation at weight one, in metres. */
        translation: [number, number, number];
      };

      laterotrusion: {
        left: { channel: string; translation: [number, number, number] };
        right: { channel: string; translation: [number, number, number] };
      };

      /** Supported magnitude of the summed opening and protrusion translation, in metres. */
      translationLimitMetres: number;
    };

    eyes: {
      /** Attachment owner name, `leftEye` or `rightEye`. */
      id: string;

      /** Landmark id of the globe's rotation centre. */
      center: string;

      /**
       * Gaze channels; each rotates about `axis` by `degrees * weight` and
       * translates the globe by `translation * weight`, the small eccentric
       * shift the source authored with its lids (the ocular literature
       * reports a varying, eccentric centre of rotation; the preparation
       * records each channel's figure and bounds it).
       */
      gaze: {
        channel: string;
        axis: [number, number, number];
        degrees: number;
        translation: [number, number, number];
      }[];
    }[];
  };

  /**
   * The coupled oral contact the basis evaluates after articulation: lip
   * closure scaled to the aperture it has to close, the tongue's passage
   * through the incisors and lips, and soft tissue kept outside the rigid
   * dental and ocular surfaces. Every quantity is measured on the evaluated document,
   * never read from a per-person table, and an impossible combination is
   * refused by name with the millimetres that decide it rather than clamped.
   *
   * `lips` and `incisors` name the vermilion seam and incisal edge midline
   * vertex pairs, found once on the shared topology, whose posed separations
   * along the basis frame's vertical (made perpendicular to the mandibular
   * axis) are the interlabial and interincisal apertures. `closure` is the channel
   * whose rows were decomposed as a delta at `reference` weight one (the
   * ARKit sense of a lip closure over an open jaw). Legacy replay scales that
   * native companion by the authored aperture ratio. A prepared `sourceSpan`
   * instead reads fixed native closure-zero/one states, replays their source
   * points, forms the registered closed endpoint and applies the requested
   * weight once before rigid contact. Its registered representative supplies
   * the final interlabial reading; the native pair still owns companion gain.
   * Source registration and final geometry/contact observation establish seal,
   * rather than native aperture scaling alone. `passage` names the tongue surface and its protrusion
   * channel: a tongue past the incisal plane must be thinner, over the slab
   * about that plane, than both apertures, because a constant-volume muscular
   * hydrostat cannot be pressed through closed teeth or sealed lips.
   * `colliders` are rigid surfaces, the dental arches and the globes, with
   * `closure` triangles that seal each crown at its root ring or a globe at
   * its posterior pole and a `reachMetres` within which an open gum sheet's
   * orientation still tells its sides apart, and an optional `coverMetres`,
   * the thinnest soft tissue that lies over that surface (a lid over a globe;
   * zero, the default, where mucosa meets the surface itself, as lips on
   * teeth). A `soft` vertex's floor is its clearance in the shape-only rest
   * state, or the cover where it rested farther out, or its rest depth where
   * the source authored it inside: a vertex pushed past that floor is moved
   * back to it along the nearest feature, and a push beyond `budgetMetres`
   * refuses the document. The
   * arches themselves are rigid and no channel brings them closer than rest;
   * occlusal overlap under laterotrusion is a crossing census fact, not a
   * refusal here. Omission keeps the articulated basis without contact
   * evaluation.
   */
  contact?: IAutoMovieHumanFaceBasisContact;

  /** Connected skin and separately attached components, in the same head frame. */
  surfaces: IAutoMovieHumanFaceBasisSurface[];

  /** Resident finishes; the existing static face exporter owns texture admission. */
  materials: IAutoMovieMaterial[];
}
