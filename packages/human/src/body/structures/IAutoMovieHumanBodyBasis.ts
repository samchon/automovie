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
 * Z-forward frame shared with the face basis. In the shipped body, the
 * nonplanar collar boundary has 120 vertices with Y between -0.0902116299 m
 * and -0.0807635784 m. These are the face collar's same source vertices in
 * the common frame, so a separate combination stage can join the two by
 * position instead of by a transform.
 * The ground therefore sits well below the origin; a consumer that wants the
 * feet at zero translates the whole model by the neutral's lowest Y.
 *
 * What the face basis lacked and the body cannot do without is the joint. A
 * 145 degree elbow walked as a linear endpoint leaves the forearm centimetres
 * off the arc, so joints, their landmarks and the skin weights are part of
 * this contract from the first revision rather than a later layer. Evaluation
 * is channels, then correctives, then landmarks, then the rest skeleton, then
 * the pose with the declared couplings added and shoulder goals resolved,
 * then skinning
 * (`createHumanBodyBasisBuilder`).
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
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-connected-basis Carries shared face/body collar vertices, neutral surfaces, signed named channels with explicit mirrors, correctives, landmarks and weights one document replays without Blender.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-joints Puts the joints, their landmark-defined pivots and their clinical limits inside the basis contract instead of a later layer.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis Fixes the shared face/body collar frame, the sparse row format, the channel envelope and the product activation this type is evaluated under.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-joints Declares landmark-defined joints, generic signs and ranges for non-humeral bones, measured TT coordinates for upper arms and each surface's four-influence skin.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBasis {
  /** Immutable revision identity, also stored in every dependent document. */
  id: string;

  /** Ordered shape controls. Evaluation follows this order, never object insertion order. */
  channels: {
    /** Trait name unique within this basis, e.g. `torsoScaleVert` or `upperarmFatLeft`. */
    id: string;

    /** Named body shape edit; a pose is not a channel. */
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

    /** Driving sides or shoulder pose kernels, all multiplied. */
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
          axis: "flexion" | "abduction" | "twist" | "elevation";
          /** Positive counts clinical degrees above the rest angle, negative below it. */
          side: "positive" | "negative";
          /** Degrees from rest at which the ramp leaves zero. */
          onset: number;
          /** Degrees from rest at which the ramp reaches one; above `onset` and within the range. */
          full: number;
        }
      | {
          /** Humerus whose whole physical orientation gates the corrective. */
          shoulder: "leftUpperArm" | "rightUpperArm";
          /** TT coordinates of the kernel's central humerothoracic pose. */
          orientation: {
            plane: number;
            elevation: number;
            axialRotation: number;
          };
          /** Angular distance at or within which the kernel reaches one. */
          innerDegrees: number;
          /** Angular distance at or beyond which the kernel is zero. */
          outerDegrees: number;
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
     * The reference direction for the bone frame's X axis, in the basis frame
     * of the neutral. The frame is Y along head to tail, X equal to `Y x F`
     * and Z equal to `X x Y`. Non-humeral joints use this frame for the
     * engine's flexion/abduction/twist axes; the upper arms use it only for
     * skin binding, while their clinical goal uses `shoulder` below.
     */
    reference: [number, number, number];

    /**
     * Clinical sign of each non-humeral axis under that frame, measured at extraction:
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
     * Clinical rest angle of each non-humeral axis in degrees, measured from
     * its anatomical zero. The upper arms hold these generic axes at zero;
     * their separate `shoulder.neutral` records the A-pose direction and
     * axial zero in the thorax's anatomical frame.
     */
    neutral: {
      flexion: number;
      abduction: number;
      twist: number;
    };

    /** Generic clinical range, or null for the root; all upper-arm generic axes are held. */
    constraint: IAutoMovieJointConstraint | null;

    /**
     * Spread this bone's axial twist along its skin, as a rig's twist joints
     * do. The bone's rotation relative to its parent is split into a swing
     * and a twist about its rest axis (its head to its one child joint's
     * head); a vertex it moves takes the swing whole and the twist in
     * proportion to where it lies along that axis, none at the head and all
     * of it at the child's head. Absent, the bone carries its skin rigidly.
     */
    distributeTwist?: boolean;

    /**
     * Humerothoracic authoring coordinates for an upper arm. Only the two
     * upper arms carry this field. Their generic Euler axes are held at zero;
     * the shoulder goal is resolved from the thorax after girdle coupling.
     */
    shoulder?: {
      coordinates: "thorax-tt";
      /** Anatomical A-pose direction and axial zero in thorax coordinates. */
      neutral: {
        plane: number;
        elevation: number;
        axialRotation: number;
      };
      /**
       * Total humerothoracic elevation and axial rotation in degrees, and the
       * plane-dependent reach (`humanBodyShoulderReaches`).
       */
      range: {
        elevation: { min: number; max: number };
        axialRotation: { min: number; max: number };
        /**
         * The humeral joint sinus as `[plane, maximum total elevation]` knots:
         * at least three, planes strictly increasing inside [-180, 180),
         * maxima in (0, `elevation.max`], linear between neighbours and
         * periodic across the -180/180 seam. A goal is admitted when its
         * elevation is at most the envelope at its plane; the overhead pole
         * is admitted when any knot reaches 180.
         */
        envelope: [number, number][];
      };
    };
  }[];

  /**
   * Declared joint couplings: one joint's motion adding a bounded angle to
   * another joint's clinical axis, applied by the builder to the document's
   * pose before that pose is validated and resolved
   * (`resolveHumanBodyCouplings`). The upper arm supplies a total
   * humerothoracic TT elevation, while its parent girdle can also move. The
   * builder solves the humeral child after the girdle moves so the coupled
   * contribution does not add to the authored total. The intended data is
   * the scapulohumeral rhythm:
   * Inman, Saunders and Abbott 1944 (J Bone Joint Surg 26:1) measured
   * glenohumeral to scapulothoracic motion at about 2:1 past 30 degrees of
   * elevation, and Ludewig et al. 2009 (J Bone Joint Surg Am 91:378) put the
   * clavicle at about 11 degrees of elevation and 16 degrees of retraction at
   * full arm elevation; a basis that declares the rhythm carries those
   * figures as curves from each upper arm's elevation to its girdle bone's
   * abduction and flexion, and a basis that declares nothing poses exactly
   * as before.
   *
   * A coupling is a declared driver in the sense of the rig control driver
   * requirement rather than a hidden corrective: its input, output, bounded
   * function and range are data of the basis, the builder applies it in a
   * stated order, the editor shows the addition beside the joint row, and the
   * document never stores it. For a TT shoulder source, `source.measure` is
   * the document's total `shoulders[].elevation`, or the measured A-pose
   * elevation when omitted. For a non-humeral source it retains the engine's
   * `swingConeAngle` of the clinical flexion and abduction. The curve is
   * piecewise linear over
   * `[elevation, degrees]` knots: zero at and below the first knot, linear
   * between knots, the last ordinate held past the last knot; a shipped
   * shoulder curve therefore starts at the rest elevation, approximating
   * Inman's 30 degree onset as zero up to it. The ordinate is added to the
   * output joint's clinical angle on `output.axis`, the document's angle when
   * it has one and the rest angle otherwise; the sum is validated like any
   * document angle and refused past the range, never clamped.
   *
   * Admission (`assertHumanBodyRig`) requires a unique nonblank `id`, declared
   * source and output joints, an output axis the output joint's constraint
   * leaves open (which excludes the unconstrained root), at least two finite
   * knots strictly increasing in elevation, the first at or above the source
   * joint's rest elevation with an ordinate of zero so the rest, the hanging
   * arm and every pose below the rest add nothing, every `rest + ordinate`
   * inside the output axis's clinical range, no output joint that
   * is any coupling's source (so no chain and no cycle), and no output axis
   * driven twice. Correctives read the coupled angles, so a joint ramp on the
   * girdle fires on an automatic elevation exactly as on an authored one.
   */
  couplings?: {
    /** Name unique among the couplings, shown beside the coupled joint row. */
    id: string;

    /** The driving joint and the measure read from it. */
    source: {
      bone: AutoMovieHumanoidBone;

      /** TT total elevation on an upper arm, otherwise the clinical flexion/abduction swing cone. */
      measure: "elevation";
    };

    /** The driven joint and the clinical axis the ordinate is added to. */
    output: {
      bone: AutoMovieHumanoidBone;
      axis: "flexion" | "abduction" | "twist";
    };

    /** `[elevation, degrees]` knots, strictly increasing in elevation from the source's rest elevation or above, the first ordinate zero. */
    curve: [number, number][];
  }[];

  /**
   * The declared pelvifemoral rhythm: the posterior pelvic tilt that goes
   * with hip flexion, applied by the builder after the couplings
   * (`resolveHumanBodyPelvifemoralRhythm`, called inside
   * `resolveHumanBodyCouplings`).
   *
   * With a rhythm declared, each upper leg's document flexion is the thigh's
   * flexion relative to the trunk, the angle a goniometer reads without
   * stabilizing the pelvis, rather than the femur's angle to the pelvis.
   * Standing unilateral hip flexion carries the pelvis with it: Murray et al.
   * 2002 (Clin Biomech 17:147, doi:10.1016/s0268-0033(01)00115-2) measured
   * pelvic rotation contributing 18.1% of the change in hip flexion,
   * throughout the movement, with the stance thigh held vertical; Tully et al.
   * 2002 (Spine 27:E432) measured lumbar flexion concurrent with it. The curve
   * maps the larger of the two legs' trunk-relative flexions to the tilt `T`;
   * the pelvis turns posteriorly by `T` about the line through both hip
   * centres (the root's flexion gains `-T` and the body is translated so the
   * hip centres do not move), the lumbar joint's flexion gains `+T` so the
   * trunk keeps its orientation, and each hip's pelvic-relative flexion is its
   * document flexion minus `T`, so the lifted thigh reaches the authored
   * direction and the other thigh stays where the author put it. One tilt for
   * both legs is what a pelvis can do; the bilateral lift shares the larger
   * side's tilt, which the declared curve must justify for the tasks it is
   * cited for (Dewberry et al. 2003, Clin Biomech 18:494, measured 13.1 to
   * 35.5% for suspended bilateral flexion, depending on knee position and
   * hamstring length).
   *
   * A trunk-relative flexion past the leg's clinical range is refused, and so
   * is a resulting pelvic-relative or lumbar angle past its own range; nothing
   * is clamped. Correctives driven by a hip or the lumbar joint read the
   * document's coupled angles (the hips trunk-relative): the tilt is a
   * function of those, so a ramp on them is a ramp on the whole
   * configuration, and the thigh's contact with the belly and chest follows
   * the trunk-relative angle rather than the pelvic-relative one. A basis
   * without the field poses hips pelvic-relative as before. Admission (`assertHumanBodyPelvifemoral`) requires both upper
   * legs and the lumbar joint to be children of the root with open flexion,
   * a nonblank id, at least two finite knots strictly increasing in flexion,
   * the first at or above the legs' rest flexion with a zero ordinate,
   * nondecreasing nonnegative ordinates and every `rest + ordinate` of the
   * lumbar joint inside its flexion range, and no coupling driving a leg's or
   * the lumbar joint's flexion.
   */
  pelvifemoral?: {
    /** Name shown beside the rows it moves. */
    id: string;

    /** The lumbar joint whose flexion restores the trunk. */
    lumbar: AutoMovieHumanoidBone;

    /** `[trunk-relative hip flexion, posterior pelvic tilt]` knots in degrees. */
    curve: [number, number][];
  };

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
     * index `joints` and `weights[4v..4v+3]` sum to one. The weights blend the
     * bones' `posed ∘ rest⁻¹` transforms as unit dual quaternions, so a shared
     * vertex follows one rigid screw motion between its bones and keeps its
     * distance from the joint at a fold or a twist, and a vertex bound to one
     * bone with weight one moves rigidly with it, which is the property the
     * rigid-segment check measures.
     */
    skin: {
      joints: AutoMovieHumanoidBone[];
      boneIndices: number[];
      weights: number[];
    };

    /**
     * Soft-tissue sag under gravity after skinning, or absent for none. A
     * vertex carries the tissue the document's rest body has over the same
     * body with each `lean` channel at its weight, along the rest normal;
     * its compliance is that times `gain` and the softness, `base` plus the
     * sum of each `softness.channels` gain times the document's weight of that
     * channel, held in `range`; it moves by compliance times the change of
     * gravity's direction (-Y) in its skin's frame, smoothed over `sweeps`
     * half-steps with the open boundary held.
     */
    sag?: {
      lean: Record<string, number>;
      gain: number;
      sweeps: number;
      softness: {
        base: number;
        channels: Record<string, number>;
        range: [number, number];
      };
    };
  }[];

  /** Resident finishes; the static exporter owns texture admission. */
  materials: IAutoMovieMaterial[];
}
