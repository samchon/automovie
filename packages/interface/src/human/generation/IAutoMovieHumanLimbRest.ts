import type { IAutoMovieLoftContract } from "../../construction/IAutoMovieLoftContract";
import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";
import type { AutoMovieHumanSex } from "../AutoMovieHumanSex";
import type { AutoMovieHumanSide } from "../AutoMovieHumanSide";
import type { IAutoMovieHumanArmConstruction } from "./IAutoMovieHumanArmConstruction";
import type { IAutoMovieHumanFootConstruction } from "./IAutoMovieHumanFootConstruction";
import type { IAutoMovieHumanLegConstruction } from "./IAutoMovieHumanLegConstruction";
import type { IAutoMovieHumanArmBones } from "./arm/IAutoMovieHumanArmBones";
import type { IAutoMovieHumanFootBones } from "./foot/IAutoMovieHumanFootBones";
import type { IAutoMovieHumanHandBones } from "./hand/IAutoMovieHumanHandBones";
import type { IAutoMovieHumanLegBones } from "./leg/IAutoMovieHumanLegBones";

/** Type contracts exchanged by AutoMovieHumanLimbRest; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanLimbRest {
  /** Leg rest and the foot's own local centres, before skin.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Leg rest and the foot's own local centres, before skin.
   * @evidence contracts/development/design.md#principled-representation `foot`: Original foot centres before the same stance translation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanLimbRest.legs, AutoMovieHumanLimbRest.previous.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `foot`; callers supply the complete record.
   */
  export interface ILeg extends Leg {
    /** Original foot centres before the same stance translation. */
    foot: IAutoMovieHumanFootBones.IBones;
  }

  /** Original leg placement and stance translation; no skin is read.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Original leg placement and stance translation; no skin is read.
   * @evidence contracts/development/design.md#principled-representation Original leg placement and stance translation; no skin is read.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by leg.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by leg for original leg placement and stance translation; no skin is read.
   */
  export type Leg = Pick<
    IAutoMovieHumanLegBones.IBones,
    "hip" | "knee" | "ankle"
  > & {
    /** Translation of the foot's own XZ origin under the actual ankle. */
    shift: [number, number];
  };

  /** Explicit independent requests; construction and metadata prepare no sibling.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Explicit independent requests; construction and metadata prepare no sibling.
   * @evidence contracts/development/design.md#principled-representation Explicit independent requests; construction and metadata prepare no sibling.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanLimbRest.create. Also types AutoMovieHumanBodySources.rests, AutoMovieHumanSkeletonLaw.limbs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanBodySources.rests, AutoMovieHumanBodySources.limbRest, AutoMovieHumanLimbRest.create, AutoMovieHumanSkeletonLaw.limbs for explicit independent requests; construction and metadata prepare no sibling.
   */
  export interface IOutput {
    /** Resolve only this arm and hand from their direct attachment definition. */
    arm(side: AutoMovieHumanSide): IArm;

    /** Resolve only this leg and foot from the shared lower-body datum. */
    leg(side: AutoMovieHumanSide): ILeg;
  }

  /** Actual side-qualified arm and hand, before any source curve.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Actual side-qualified arm and hand, before any source curve.
   * @evidence contracts/development/design.md#principled-representation `bones`: Rest joint centres, calibration mm. `hand`: Identical hand record consumed by its source and bind bones. `projection`: Acromion-to-GH vertical projection used by the public upper-arm law.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanLimbRest.arms, AutoMovieHumanLimbRest.previous.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `bones`, `hand`, `projection`; callers supply the complete record.
   */
  export interface IArm {
    /** Rest joint centres, calibration mm. */
    bones: Pick<IAutoMovieHumanArmBones.IBones, "shoulder" | "elbow" | "wrist">;

    /** Identical hand record consumed by its source and bind bones. */
    hand: IAutoMovieHumanHandBones.IOutput;

    /** Acromion-to-GH vertical projection used by the public upper-arm law. */
    projection: number;
  }

  /** Only the attachment point/frame needed by the arm law; no parent part.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Only the attachment point/frame needed by the arm law; no parent part.
   * @evidence contracts/development/design.md#principled-representation `glenohumeral`: Canonical-left glenohumeral centre in calibration mm. `shoulder`: Canonical-left acromion point in the same frame and unit.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanShoulderDatum.create. Also types AutoMovieHumanLimbRest.attachment.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `glenohumeral`, `shoulder`; callers supply the complete record.
   */
  export interface IShoulder {
    /** Canonical-left glenohumeral centre in calibration mm. */
    glenohumeral: AutoMovieVector3Tuple;

    /** Canonical-left acromion point in the same frame and unit. */
    shoulder: AutoMovieVector3Tuple;
  }

  /** Required public inputs and explicit numerical attachment suppliers.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Required public inputs and explicit numerical attachment suppliers.
   * @evidence contracts/development/design.md#principled-representation `stature`: Calibration stature, mm. `arms`: Public arm/hand inputs in their original calibration units. `feet`: Public sided foot inputs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanLimbRest.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `stature`, `arms`, `feet`, `legs`, `sex`, `diagnostics`, `hipForward`; callers supply the complete record.
   */
  export interface IInput {
    /** Calibration stature, mm. */
    stature: number;

    /** Public arm/hand inputs in their original calibration units. */
    arms: IAutoMovieHumanArmConstruction.IInputs;

    /** Public sided foot inputs. */
    feet: IAutoMovieHumanFootConstruction.IInputs;

    /** Public leg inputs. */
    legs: IAutoMovieHumanLegConstruction.IInputs;

    /** Resolved anatomical sex for the original hand law. */
    sex: AutoMovieHumanSex;

    /** Same call-owned diagnostics sink used by hand placement. */
    diagnostics: IAutoMovieLoftContract.IDiagnostic[];

    /** Explicit common shoulder definition, requested only by an arm. */
    shoulder(): IShoulder;

    /** Common lower-body axis datum, calibration mm; no trunk solve. */
    hipForward: number;
  }
}
