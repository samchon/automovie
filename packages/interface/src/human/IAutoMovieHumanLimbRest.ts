import type { IAutoMovieLoftContract } from "../construction/IAutoMovieLoftContract";
import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { AutoMovieHumanSex } from "./AutoMovieHumanSex";
import type { AutoMovieHumanSide } from "./AutoMovieHumanSide";
import type { IAutoMovieHumanArmConstruction } from "./IAutoMovieHumanArmConstruction";
import type { IAutoMovieHumanFootConstruction } from "./IAutoMovieHumanFootConstruction";
import type { IAutoMovieHumanLegConstruction } from "./IAutoMovieHumanLegConstruction";
import type { IAutoMovieHumanArmBones } from "./IAutoMovieHumanArmBones";
import type { IAutoMovieHumanFootBones } from "./IAutoMovieHumanFootBones";
import type { IAutoMovieHumanHandBones } from "./IAutoMovieHumanHandBones";
import type { IAutoMovieHumanLegBones } from "./IAutoMovieHumanLegBones";

/**
 * Independent sided limb-rest requests and numerical shoulder/lower-body
 * attachment inputs before skin. Runtime construction and admission remain with
 * AutoMovieHumanLimbRest in Human.
 */
export namespace IAutoMovieHumanLimbRest {
  /** Leg rest and the foot's own local centres, before skin. */
  export interface ILeg extends Leg {
    /** Original foot centres before the same stance translation. */
    foot: IAutoMovieHumanFootBones.IBones;
  }

  /** Original leg placement and stance translation; no skin is read. */
  export type Leg = Pick<
    IAutoMovieHumanLegBones.IBones,
    "hip" | "knee" | "ankle"
  > & {
    /** Translation of the foot's own XZ origin under the actual ankle. */
    shift: [number, number];
  };

  /**
   * Explicit independent requests; construction and metadata prepare no
   * sibling.
   */
  export interface IOutput {
    /** Resolve only this arm and hand from their direct attachment definition. */
    arm(side: AutoMovieHumanSide): IArm;

    /** Resolve only this leg and foot from the shared lower-body datum. */
    leg(side: AutoMovieHumanSide): ILeg;
  }

  /** Actual side-qualified arm and hand, before any source curve. */
  export interface IArm {
    /** Rest joint centres, calibration mm. */
    bones: Pick<IAutoMovieHumanArmBones.IBones, "shoulder" | "elbow" | "wrist">;

    /** Identical hand record consumed by its source and bind bones. */
    hand: IAutoMovieHumanHandBones.IOutput;

    /** Acromion-to-GH vertical projection used by the public upper-arm law. */
    projection: number;
  }

  /** Only the attachment point/frame needed by the arm law; no parent part. */
  export interface IShoulder {
    /** Canonical-left glenohumeral centre in calibration mm. */
    glenohumeral: AutoMovieVector3Tuple;

    /** Canonical-left acromion point in the same frame and unit. */
    shoulder: AutoMovieVector3Tuple;
  }

  /** Required public inputs and explicit numerical attachment suppliers. */
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
