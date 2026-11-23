import type { IAutoMovieHumanBodyIdentity } from "../../body/IAutoMovieHumanBodyIdentity";
import type { IAutoMovieHumanConicLoft } from "../conic/IAutoMovieHumanConicLoft";
import type { IAutoMovieHumanF1 } from "./IAutoMovieHumanF1";
import type { IAutoMovieHumanF1SegmentLengths } from "./IAutoMovieHumanF1SegmentLengths";
import type { IAutoMovieHumanNativeProjectionCourse } from "../conic/IAutoMovieHumanNativeProjectionCourse";

/**
 * Native F1 material inputs and reusable original-source preparation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Native F1 material inputs and reusable original-source preparation.
 * @evidence contracts/development/design.md#principled-representation Wall and root calipers keep physical millimetres at named sites, and the preparation distinguishes full and tape-only generation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanF1NativeLaw provides the prepared owner used by F1 generation and tape inversion.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Input proxy definitions and provisional generation limits remain explicit.
 */
export namespace IAutoMovieHumanF1NativeLaw {
  /**
   * Full directional caliper size at its declared material site, millimetres.
   *
   * @evidence contracts/development/design.md#principled-representation Two positive calipers own chart depth and breadth; an AP partition/fullness prior remains independent and girth is a derived check.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Both dimensions drive every complete conic control at their site.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No bone/muscle/fat decomposition or clinical measurement is inferred from this geometry.
   * @evidence contracts/development/common.md#meaningful-documentation Names physical size and the separate prior/girth scope.
   */
  export interface ISize {
    /** Complete +u to -u caliper in the declared plane, mm. */
    depth: number;

    /** Complete +v to -v caliper in the declared plane, mm. */
    breadth: number;
  }

  /**
   * Active full-field F1 inputs: qualified material sites, independent bone support and root tissue.
   * The wall sites are the recorded skin/authoring proxies, not natural waist,
   * bra-condition tapes, thyroid cartilage or verified clinical HJC observations.
   * The fixed accepted skeletal lengths/rotations and station datums remain
   * supplied priors in this provisional entry, not newly inferred measurements.
   *
   * @evidence contracts/development/design.md#principled-representation Reuses only the actual supplied BodyIdentity support field and names all tissue/projection inputs this law reads, with site/frame qualifications.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The closed records drive the trunk, all dependent roots, limb profiles, extremities and appendages; no full public identity is silently ignored.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts F1 synthetic support and skin proxies stay qualified P; clinical regressions with unavailable covariates are not filled from these controls.
   * @evidence contracts/development/common.md#meaningful-documentation Names fixed frame, independent skeleton/tissue inputs and original proxy definitions.
   */
  export interface IFields extends Required<
    Pick<IAutoMovieHumanBodyIdentity, "hipJointCentreBreadth">
  > {
    /** Hip104, omphalion268.60, bare underbust427.69, bare bust475.16, neck skin690.26 and head792mm on the accepted trunk course. */
    wall: Record<
      | "hipSkin"
      | "omphalionWall"
      | "underbustWall"
      | "bustWall"
      | "neckSkin"
      | "headSkin",
      ISize
    >;

    /** Complete calipers at nominal original material proxy sites first+10/6/1/1.5mm; these are not measurements of every phase-varying actual rail and remain independent of synthetic bone support. */
    roots: Record<"arm" | "leg" | "breast" | "nose", ISize>;

    /**
     * Breast projection, carried as the cap's rail-to-pole world chord, mm. Only F1's own value is generated: the
     * mound is split between the trunk's tape hull, two reliefs and this rigid cap, so the builder refuses any
     * other value with a diagnostic until the breast is one mound family on a bare thoracic wall. Bust and
     * underbust girths (ISO 8559-1) are derived checks.
     */
    breastProjection: number;

    /** Qualified F1 limb-site calipers, with the accepted skeletal lengths retained. */
    arm: Record<"upperArm" | "elbow" | "forearm" | "wrist", ISize>;

    /** Leg root rail replaces the unobservable gluteal-furrow tape site; it is not renamed a clinical thigh site. */
    leg: Record<"knee" | "calf" | "ankle", ISize>;

    /**
     * The hand's and the foot's calipers at their sites, and one finger's and one toe's at their joints' sites
     * (`AutoMovieHumanF1NativeSites`: `extremities` and `digits`, the representative middle finger and big toe). Their normalized
     * shape/layout priors retain the existing working families.
     */
    extremities: Record<"hand" | "foot" | "finger" | "toe", ISize>;

    /**
     * The joint-centre segment lengths, mm (`AutoMovieHumanF1SegmentLengths.IFields`). Each moves the joint centre at its segment's far
     * end, and the stations of the run between its two centres keep their place within the run
     * (`AutoMovieHumanMaterialCourse`). The limbs', the hand's, the foot's and the phalanges' lengths are generated; a trunk length
     * (`pelvisToThorax`, `thoraxToHead`) other than f1's is refused by the builder until the trunk's course carries its own joints.
     */
    lengths: IAutoMovieHumanF1SegmentLengths.IFields;
  }

  /**
   * Only fields consumed by the two source families used in tape inversion.
   *
   * @evidence contracts/development/design.md#principled-representation The trunk reads every wall site and the arm-root-owned shoulder feature; its breast neighbour additionally reads its own root calipers and free course. No limb, digit or support input is silently accepted here.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Every member generates trunk/breast originals through the same builder used by full assembly.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts This is a two-family source request, never a partial IAssembly padded with a prior figure.
   * @evidence contracts/development/common.md#meaningful-documentation Retains IFields' physical mm, fixed accepted frame and provisional material-site qualifications.
   */
  export interface ITapeFields {
    /** All six wall calipers own the trunk's complete native functions. */
    wall: IFields["wall"];

    /** Arm shoulder-feature ownership and breast root ownership, respectively. */
    roots: Pick<IFields["roots"], "arm" | "breast">;

    /** Breast projection as in `IFields`: the cap's rail-to-pole world chord, mm, whose ratio scales the whole mound. */
    breastProjection: number;
  }

  /**
   * One immutable-original invocation shared by complete and tape-only construction.
   *
   * @evidence contracts/development/design.md#principled-representation Captures one original assembly/bank, its actual calibration and two closed generation scopes; the common private builder receives that same calibration directly.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Both methods are real production/constraint consumers, while fields and measured calibration costs are consumed by their callers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Borrowed original controls and returned calibration are immutable for reader lifetime by contract; this interface does not claim runtime freezing or permit a late replacement bank.
   * @evidence contracts/development/common.md#meaningful-documentation Separates fixed original coefficients, actual preparation cost and changed candidate generation.
   */
  export interface IPrepared {
    /** Borrowed calibration P; callers build changed fields without mutating it. */
    readonly fields: IFields;

    /** Actual original caliper and projection reads, with their shared preparation time. */
    readonly calibration: {
      /** Complete-source caliper read attempts during this preparation. */
      nativeSourceReadAttempts: number;

      /** Endpoint Point0 and station2 attempts for the one original projection datum, separate from calipers. */
      originalProjection: IAutoMovieHumanNativeProjectionCourse.IProjectionOwner["calibration"];

      /** Elapsed preparation interval measured by the existing caller, ms. */
      milliseconds: number;
    };

    /**
     * Complete changed figure through the same native generating owner.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Supplies full native fields and the same invocation's skeletal assembly.
     */
    apply: (fields: IFields, bone: IAutoMovieHumanF1.IAssembly) => IAutoMovieHumanF1.IAssembly;

    /**
     * Only the source definitions used by candidate tape inversion.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Supplies wall and breast calipers for original-source tape inversion.
     */
    tapeFamilies: (fields: ITapeFields) => {
      trunk: IAutoMovieHumanConicLoft.IFamily;
      breast: IAutoMovieHumanConicLoft.IFamily;
    };
  }
}
