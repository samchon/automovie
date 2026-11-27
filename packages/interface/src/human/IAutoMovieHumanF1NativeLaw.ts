import type { IAutoMovieHumanBodyIdentity } from "./IAutoMovieHumanBodyIdentity";
import type { IAutoMovieHumanConicLoft } from "./IAutoMovieHumanConicLoft";
import type { IAutoMovieHumanNativeProjectionCourse } from "./IAutoMovieHumanNativeProjectionCourse";
import type { IAutoMovieHumanF1 } from "./IAutoMovieHumanF1";
import type { IAutoMovieHumanF1SegmentLengths } from "./IAutoMovieHumanF1SegmentLengths";

/** Native F1 material inputs and reusable original-source preparation. */
export namespace IAutoMovieHumanF1NativeLaw {
  /** Full directional caliper size at its declared material site, millimetres. */
  export interface ISize {
    /** Complete +u to -u caliper in the declared plane, mm. */
    depth: number;

    /** Complete +v to -v caliper in the declared plane, mm. */
    breadth: number;
  }

  /**
   * Active full-field F1 inputs: qualified material sites, independent bone
   * support and root tissue. The wall sites are the recorded skin/authoring
   * proxies, not natural waist, bra-condition tapes, thyroid cartilage or
   * verified clinical HJC observations. The fixed accepted skeletal
   * lengths/rotations and station datums remain supplied priors in this
   * provisional entry, not newly inferred measurements.
   */
  export interface IFields extends Required<
    Pick<IAutoMovieHumanBodyIdentity, "hipJointCentreBreadth">
  > {
    /**
     * Hip104, omphalion268.60, bare underbust427.69, bare bust475.16, neck
     * skin690.26 and head792mm on the accepted trunk course.
     */
    wall: Record<
      | "hipSkin"
      | "omphalionWall"
      | "underbustWall"
      | "bustWall"
      | "neckSkin"
      | "headSkin",
      ISize
    >;

    /**
     * Complete calipers at nominal original material proxy sites
     * first+10/6/1/1.5mm; these are not measurements of every phase-varying
     * actual rail and remain independent of synthetic bone support.
     */
    roots: Record<"arm" | "leg" | "breast" | "nose", ISize>;

    /**
     * Breast projection, carried as the cap's rail-to-pole world chord, mm.
     * Only F1's own value is generated: the mound is split between the trunk's
     * tape hull, two reliefs and this rigid cap, so the builder refuses any
     * other value with a diagnostic until the breast is one mound family on a
     * bare thoracic wall. Bust and underbust girths (ISO 8559-1) are derived
     * checks.
     */
    breastProjection: number;

    /**
     * Qualified F1 limb-site calipers, with the accepted skeletal lengths
     * retained.
     */
    arm: Record<"upperArm" | "elbow" | "forearm" | "wrist", ISize>;

    /**
     * Leg root rail replaces the unobservable gluteal-furrow tape site; it is
     * not renamed a clinical thigh site.
     */
    leg: Record<"knee" | "calf" | "ankle", ISize>;

    /**
     * The hand's and the foot's calipers at their sites, and one finger's and
     * one toe's at their joints' sites (`AutoMovieHumanF1NativeSites`:
     * `extremities` and `digits`, the representative middle finger and big
     * toe). Their normalized shape/layout priors retain the existing working
     * families.
     */
    extremities: Record<"hand" | "foot" | "finger" | "toe", ISize>;

    /**
     * The joint-centre segment lengths, mm
     * (`AutoMovieHumanF1SegmentLengths.IFields`). Each moves the joint centre
     * at its segment's far end, and the stations of the run between its two
     * centres keep their place within the run (`AutoMovieHumanMaterialCourse`).
     * The limbs', the hand's, the foot's and the phalanges' lengths are
     * generated; a trunk length (`pelvisToThorax`, `thoraxToHead`) other than
     * f1's is refused by the builder until the trunk's course carries its own
     * joints.
     */
    lengths: IAutoMovieHumanF1SegmentLengths.IFields;
  }

  /** Only fields consumed by the two source families used in tape inversion. */
  export interface ITapeFields {
    /** All six wall calipers own the trunk's complete native functions. */
    wall: IFields["wall"];

    /** Arm shoulder-feature ownership and breast root ownership, respectively. */
    roots: Pick<IFields["roots"], "arm" | "breast">;

    /**
     * Breast projection as in `IFields`: the cap's rail-to-pole world chord,
     * mm, whose ratio scales the whole mound.
     */
    breastProjection: number;
  }

  /**
   * One immutable-original invocation shared by complete and tape-only
   * construction.
   */
  export interface IPrepared {
    /** Borrowed calibration P; callers build changed fields without mutating it. */
    readonly fields: IFields;

    /**
     * Actual original caliper and projection reads, with their shared
     * preparation time.
     */
    readonly calibration: IPreparedCalibration;

    /** Complete changed figure through the same native generating owner. */
    apply: (
      fields: IFields,
      bone: IAutoMovieHumanF1.IAssembly,
    ) => IAutoMovieHumanF1.IAssembly;

    /** Only the source definitions used by candidate tape inversion. */
    tapeFamilies: (fields: ITapeFields) => {
      trunk: IAutoMovieHumanConicLoft.IFamily;
      breast: IAutoMovieHumanConicLoft.IFamily;
    };
  }

  /** The calibration object of {@link IPrepared}. */
  export type IPreparedCalibration = {
    /** Complete-source caliper read attempts during this preparation. */
    nativeSourceReadAttempts: number;

    /**
     * Endpoint Point0 and station2 attempts for the one original projection
     * datum, separate from calipers.
     */
    originalProjection: IAutoMovieHumanNativeProjectionCourse.IProjectionOwner["calibration"];

    /** Elapsed preparation interval measured by the existing caller, ms. */
    milliseconds: number;
  };
}
