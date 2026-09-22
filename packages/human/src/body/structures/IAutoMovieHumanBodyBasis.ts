import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointConstraint,
  IAutoMovieMaterial,
} from "@automovie/interface";

/**
 * An immutable, externally authored connected body below the neck, with the
 * joints that move it and the endpoints that shape it.
 *
 * The caller supplies licensed geometry; this package supplies no person's
 * mesh. Coordinates and sparse differences use metres in a right-handed Y-up,
 * Z-forward frame shared with the face basis: the ring of vertices at
 * Y = -0.145 m is the same set of points in both, which is what lets a
 * separate combination stage join them by position instead of by a transform.
 * The ground therefore sits well below the origin; a consumer that wants the
 * feet at zero translates the whole model by the neutral's lowest Y.
 *
 * What the face basis lacked and the body cannot do without is the joint. A
 * 145 degree elbow walked as a linear endpoint leaves the forearm centimetres
 * off the arc, so joints, their landmarks and the skin weights are part of
 * this contract from the first revision rather than a later layer. Evaluation
 * is identity, then channels, then correctives, then landmarks, then the rest
 * skeleton, then the pose, then skinning (`createHumanBodyBasisBuilder`).
 *
 * Every endpoint name (`channels[].positive`, `negative`, `correctives[].target`)
 * resolves in each surface's `targets` and in `landmarks.targets` alike, so one
 * shape moves the skin and the joints that live under it. Changes to geometry,
 * endpoints, landmarks, joints or weights require a new basis identity.
 *
 * Endpoint interpolation describes an authored shape, not muscle; skinning
 * describes a rigid attachment, not tissue. Neither proves nonpenetration or
 * physiological range for arbitrary combinations, which the body-review
 * census measures separately. Genital and nipple geometry, clothing, hair and
 * ethnicity axes are not channels of this basis: the first two are product
 * exclusions that reopen only with a product decision, the rest belong to
 * other owners (clothing to a production's own assets, hair to the face's
 * groom, ethnicity to the face track that declined it too).
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-connected-basis Carries the neutral, identity-ready surfaces, signed channels with explicit mirrors, correctives, landmarks and weights one document replays without Blender.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-joints Puts the joints, their landmark-defined pivots and their clinical limits inside the basis contract instead of a later layer.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis Fixes the shared frame, the sparse row format, the channel envelope and the product activation this type is evaluated under.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-joints Declares each joint by landmark ids, flexion reference, measured clinical signs and range, and each surface's four-influence skin.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBasis {
  /** Immutable revision identity, also stored in every dependent document. */
  id: string;

  /** Ordered shape controls. Evaluation follows this order, never object insertion order. */
  channels: {
    /** Trait name unique within this basis, e.g. `torsoScaleVert` or `upperarmFatLeft`. */
    id: string;

    /** Body channels are identity edits; a pose is not a channel. */
    kind: "shape";

    /** Source region or `macro`, for grouping in an editor; not evaluated. */
    group: string;

    /**
     * The channel this one mirrors across X, or null for a midline control.
     * Left and right are explicit data so a consumer never infers a pair from
     * a name, and so the extraction can prove each right endpoint is the mirror
     * of its left and record the residual.
     */
    mirror: string | null;

    /** Finite envelope, including zero; weights are refused rather than clamped. */
    minimum: number;
    maximum: number;

    /** Endpoint applied with abs(weight) on the positive side. */
    positive: string;

    /** Negative-side endpoint, or null for a nonnegative control. */
    negative: string | null;
  }[];

  /**
   * Combination correctives, evaluated after the channels that drive them, with
   * the activation `min(1, weight * product of clamped inputs)` of
   * `createHumanFaceBasisBuilder`. Two kinds of driver exist. A channel driver
   * reads a shape weight, and the first revision's macro pair residuals use
   * it: the source blends its macro targets as products of node weights, so a
   * tall child is not a scaled tall adult, and the difference is sampled and
   * published rather than approximated. A channel driver may carry its own
   * ramp over the weight, so a corrective solved at an envelope extreme past
   * the source's unit node stays off at the node, where the body it corrects
   * does not yet exist. A joint driver reads a clinical pose
   * angle as a ramp: zero until the joint has moved `onset` degrees from its
   * rest toward the named side, one from `full` degrees on, linear between.
   * That is RigLogic's conditional table applied to a joint, and it is how a
   * pose corrective (a fold pushed out, a girth restored) fires only where
   * the census found the defect and not across the whole range.
   *
   * Every corrective endpoint is a rest-space displacement applied before the
   * skin is posed, as MetaHuman applies its pose-space deformations as blend
   * shapes under the joints; the skinning then carries the correction with
   * the bone.
   */
  correctives?: {
    /** Name unique within this basis, distinct from every channel id. */
    id: string;

    /** Driving sides; a channel driver or a joint-angle ramp, all multiplied. */
    inputs: (
      | {
          channel: string;
          side: "positive" | "negative";
          /** Weight toward `side` at which the ramp leaves zero; zero when absent. */
          onset?: number;
          /** Weight toward `side` at which the ramp reaches one; one when absent, above `onset` and within the envelope on that side. */
          full?: number;
        }
      | {
          bone: AutoMovieHumanoidBone;
          axis: "flexion" | "abduction" | "twist";
          /** Positive counts clinical degrees above the rest angle, negative below it. */
          side: "positive" | "negative";
          /** Degrees from rest at which the ramp leaves zero. */
          onset: number;
          /** Degrees from rest at which the ramp reaches one; above `onset` and within the range. */
          full: number;
        }
    )[];

    /** Authored gain in (0,1]. */
    weight: number;

    /** Endpoint name, resolved in every surface's targets and in the landmarks. */
    target: string;
  }[];

  /**
   * Named points that move with the shape and define the joints: the centroids
   * of the source's joint cubes. Their endpoint rows use the same sparse
   * `[landmark, dx, dy, dz]` format as a surface, indexed into `ids`.
   */
  landmarks: {
    ids: string[];

    /** Flat XYZ per landmark, in the basis frame. */
    positions: number[];

    /** Sparse rows per endpoint name, strictly increasing by landmark. */
    targets: Record<string, number[]>;
  };

  /**
   * The skeleton as data: one entry per humanoid slot the body carries, in an
   * order where every parent precedes its children. The builder projects these
   * onto `IAutoMovieSkeleton` after the shape has moved the landmarks.
   */
  joints: {
    bone: AutoMovieHumanoidBone;

    /** Parent slot, or null for the root (`hips`). */
    parent: AutoMovieHumanoidBone | null;

    /** Landmark ids of the joint centre and of the bone's distal end. */
    head: string;
    tail: string;

    /**
     * The direction a positive flexion swings the bone toward, in the basis
     * frame of the neutral. The bone frame is Y along head to tail, X equal to
     * `Y x F` and Z equal to `X x Y`, which is the engine's default clinical
     * basis (flexion about X, abduction about Z, twist about Y).
     */
    reference: [number, number, number];

    /**
     * Clinical sign of each axis under that frame, measured at extraction:
     * flexion is +1 by construction; abduction is the sign that carries the
     * bone away from the midline (or toward the thumb at the wrist); twist is
     * the sign of external rotation. Null marks an axis the constraint holds
     * immobile. These become the bone's `IAutoMovieRestFrame` at pose time.
     */
    signs: {
      flexion: 1;
      abduction: 1 | -1 | null;
      twist: 1 | -1 | null;
    };

    /**
     * Clinical angle of the rest direction on each axis, in degrees, measured
     * at extraction against the joint's anatomical zero (hanging limbs, a
     * straight elbow, an upright trunk). The source stands in an A-pose with
     * the arms 42 degrees out and the elbows bent 43 degrees, so a document's
     * "abduction 180" is read from the anatomical position and the rig turns
     * by `clinical - neutral`; without this offset a clinical range would
     * mean a different arc on every rest pose. An immobile axis rests at 0.
     */
    neutral: {
      flexion: number;
      abduction: number;
      twist: number;
    };

    /** Range of motion in clinical degrees, or null for the root. */
    constraint: IAutoMovieJointConstraint | null;
  }[];

  /** Connected skin surfaces in the shared frame. */
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

    /**
     * Four influences per shared vertex, glTF style: `boneIndices[4v..4v+3]`
     * index `joints` and `weights[4v..4v+3]` sum to one. A vertex bound to one
     * bone with weight one moves rigidly with it, which is the property the
     * rigid-segment check measures.
     */
    skin: {
      joints: AutoMovieHumanoidBone[];
      boneIndices: number[];
      weights: number[];
    };
  }[];

  /** Resident finishes; the static exporter owns texture admission. */
  materials: IAutoMovieMaterial[];
}
