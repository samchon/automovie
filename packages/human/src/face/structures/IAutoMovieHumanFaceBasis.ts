import type { IAutoMovieMaterial } from "@automovie/interface";

/**
 * An immutable, externally authored connected facial surface and its endpoints.
 * The caller supplies licensed geometry; this package supplies no person's mesh.
 * Coordinates and sparse differences use metres in a right-handed Y-up frame.
 * Each surface owns connectivity and normals across all of its material regions.
 * Changes to geometry, endpoints or attachments require a new basis identity.
 *
 * Endpoint interpolation describes an authored shape, not a physical muscle or
 * rigid-joint simulation. Metadata names what a control does; it does not prove
 * anatomical correctness, nonpenetration or likeness of arbitrary combinations.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Carries a reusable connected facial prior with separately named shape and expression endpoints.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis Defines immutable shared surfaces, material regions and sparse endpoint correspondence in metres.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasis {
  /** Immutable revision identity, also stored in every dependent document. */
  id: string;

  /** Ordered controls. Evaluation follows this order, never object insertion order. */
  channels: {
    /** Anatomical or performance name unique within this basis. */
    id: string;

    /** Optional authored sign/shape meaning; it does not certify a biological range. */
    description?: string;

    /** Identity edits and transient performance remain separate in saved documents. */
    kind: "shape" | "expression";

    /** Finite envelope, including zero; weights are refused rather than clamped. */
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
   * point plus a translation coupled to it. Opening rotates by
   * `opening.degrees * weight` and translates the whole mandible by
   * `opening.translation * weight`, which is the in vivo coupling of condylar
   * translation to rotation the preparation cites; protrusion and each
   * laterotrusion add their own translation. The condylar axis point is the
   * `pivot` landmark plus `axisOffset`, derived once from the source's own
   * full-open transform under that coupling, and it follows the landmark
   * through every shape channel. The summed sagittal translation of opening
   * and protrusion may not exceed `translationLimitMetres`, which is what
   * closes the bottom of the envelope of motion: a jaw already fully open has
   * no protrusive capacity left, and a document asking for it is refused
   * rather than clamped.
   *
   * Each eye rotates about its `center` landmark by the gaze channels listed,
   * each an authored unit axis, the degrees reached at weight one and the
   * globe translation that accompanies it, fitted from the source globe's own
   * endpoint; the rotations compose in list order and the translations add. Lids are tissue and carry no globe weight: their gaze coupling is
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

  /** Connected skin and separately attached components, in the same head frame. */
  surfaces: {
    id: string;

    /** Shared flat XYZ positions, before material or UV seam splitting. */
    positions: number[];

    /** Oriented triangles over those shared vertex identities. */
    indices: number[];

    /** Sparse [vertex, dx, dy, dz] rows, strictly increasing by vertex per endpoint. */
    targets: Record<string, number[]>;

    /**
     * Optional shared anatomical hair-growth domains. Triangle ordinals refer
     * to this surface's complete indices, before material or UV separation.
     * Each nonempty domain has unique ascending ordinals and a finite neutral
     * chart origin in metres. These regions are common to every identity.
     */
    hairDomains?: {
      id: string;
      origin: [number, number, number];
      triangles: number[];
    }[];

    /**
     * Optional oriented triangles over resident vertices closing an otherwise
     * open contact surface. They participate only in numerical hair collision
     * queries, never visible geometry. The completed surface must be embedded,
     * closed and outward oriented; deformation must preserve those premises.
     * This is shared collision topology, not personal offsets or a fitted mesh.
     */
    hairContactClosure?: number[];

    /**
     * Optional sparse attachment of this surface's vertices to the articulated
     * owners of `articulation` (`jaw`, `leftEye`, `rightEye`). Rows are
     * `[vertex, weight]` pairs, strictly increasing by vertex, with each weight
     * in (0, 1] and the weights of one vertex over all owners summing to at
     * most one; the remainder is the cranium, which the head frame holds
     * still. A vertex bound to one owner with weight one moves as that bone,
     * which is what makes a tooth or a globe rigid without a post-hoc fit, and
     * a blended vertex takes the weighted mean of its owners' rigid images.
     * Weights are shared basis data measured from the source, never a
     * person's sculpt. Omission or an empty list attaches the whole surface to
     * the cranium.
     */
    attachments?: {
      /** An owner `articulation` declares: `jaw`, or an eye's `id`. */
      owner: string;
      rows: number[];
    }[];

    /** An exact partition of the surface triangles, preserving oriented triples. */
    regions: {
      id: string;
      material: string;
      indices: number[];

      /** Flat UV pairs per triangle corner, or null for untextured geometry. */
      uvs: number[] | null;
    }[];
  }[];

  /** Resident finishes; the existing static face exporter owns texture admission. */
  materials: IAutoMovieMaterial[];
}
