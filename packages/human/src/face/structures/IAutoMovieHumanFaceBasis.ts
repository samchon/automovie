
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
   * Linear endpoints added together are wrong wherever two of them move the
   * same tissue: a jaw that opens and a mouth that closes each describe a
   * reachable face, and their sum describes teeth through a lip. A corrective
   * is the authored difference between the sum and the face that combination
   * should actually be, and it is applied in proportion to how much of the
   * combination is present.
   *
   * The activation is a product, not a sum, which is what makes it a
   * corrective rather than another control: it is zero unless every driving
   * side is present, and at half strength on two drivers it contributes a
   * quarter. The form is MetaHuman's, read from Epic's own `PSDNetImpl` rather
   * than from a description of it: `min(1, weight * product of clamped
   * inputs)`.
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
    }[];

    /** Authored gain in (0,1]; the product of a rig row's authored weights. */
    weight: number;

    /** Endpoint name, resolved in each surface's targets like any other. */
    target: string;
  }[];

  /** Connected skin and separately attached components, in the same head frame. */
  surfaces: {
    id: string;

    /** Shared flat XYZ positions, before material or UV seam splitting. */
    positions: number[];

    /** Oriented triangles over those shared vertex identities. */
    indices: number[];

    /** Sparse [vertex, dx, dy, dz] rows, strictly increasing by vertex per endpoint. */
    targets: Record<string, number[]>;

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