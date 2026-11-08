import type { AutoMovieLoftContract } from "@automovie/engine";

import type { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";
import type { AutoMovieHumanArmConstruction } from "./AutoMovieHumanArmConstruction";
import { AutoMovieHumanArmPrior } from "./AutoMovieHumanArmPrior";
import { AutoMovieHumanBodyFrame } from "./AutoMovieHumanBodyFrame";
import type { AutoMovieHumanFootConstruction } from "./AutoMovieHumanFootConstruction";
import { AutoMovieHumanFootPrior } from "./AutoMovieHumanFootPrior";
import type { AutoMovieHumanLegConstruction } from "./AutoMovieHumanLegConstruction";
import { AutoMovieHumanArmBones } from "./arm/AutoMovieHumanArmBones";
import { AutoMovieHumanFootBones } from "./foot/AutoMovieHumanFootBones";
import { AutoMovieHumanHandBones } from "./hand/AutoMovieHumanHandBones";
import { AutoMovieHumanLegBones } from "./leg/AutoMovieHumanLegBones";

/** Pure sided rest definitions shared by source authors and the full skeleton. */
export namespace AutoMovieHumanLimbRest {
  /** Only the attachment point/frame needed by the arm law; no parent part. */
  export interface IShoulder {
    /** Canonical-left glenohumeral centre in calibration mm. */
    glenohumeral: Vec3;

    /** Canonical-left acromion point in the same frame and unit. */
    shoulder: Vec3;
  }

  /** Required public inputs and explicit numerical attachment suppliers. */
  export interface IInput {
    /** Calibration stature, mm. */
    stature: number;

    /** Public arm/hand inputs in their original calibration units. */
    arms: AutoMovieHumanArmConstruction.IInputs;

    /** Public sided foot inputs. */
    feet: AutoMovieHumanFootConstruction.IInputs;

    /** Public leg inputs. */
    legs: AutoMovieHumanLegConstruction.IInputs;

    /** Resolved anatomical sex for the original hand law. */
    sex: AutoMovieHumanSex;

    /** Same call-owned diagnostics sink used by hand placement. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];

    /** Explicit common shoulder definition, requested only by an arm. */
    shoulder(): IShoulder;

    /** Common lower-body axis datum, calibration mm; no trunk solve. */
    hipForward: number;
  }

  /** Actual side-qualified arm and hand, before any source curve. */
  export interface IArm {
    /** Rest joint centres, calibration mm. */
    bones: Pick<AutoMovieHumanArmBones.IBones, "shoulder" | "elbow" | "wrist">;

    /** Identical hand record consumed by its source and bind bones. */
    hand: AutoMovieHumanHandBones.IOutput;

    /** Acromion-to-GH vertical projection used by the public upper-arm law. */
    projection: number;
  }

  /** Leg rest and the foot's own local centres, before skin. */
  export interface ILeg extends Leg {
    /** Original foot centres before the same stance translation. */
    foot: AutoMovieHumanFootBones.IBones;
  }

  /** Explicit independent requests; construction and metadata prepare no sibling. */
  export interface IOutput {
    /** Resolve only this arm and hand from their direct attachment definition. */
    arm(side: Side): IArm;

    /** Resolve only this leg and foot from the shared lower-body datum. */
    leg(side: Side): ILeg;
  }

  /** Own one invocation's actual sided numerical rest records, without a whole skeleton. */
  export function create(input: IInput): IOutput {
    const arms: Map<Side, IArm> = new Map();
    const legs: Map<Side, ILeg> = new Map();
    return {
      arm(side: Side): IArm {
        const previous: IArm | undefined = arms.get(side);
        if (previous !== undefined) return previous;

        // Place the canonical arm from its direct attachment, then reflect
        // its rest/material data once; no adjoining source supplies a point.
        const attachment: IShoulder = input.shoulder();
        const sign: 1 | -1 = side === "left" ? 1 : -1;
        const prior: AutoMovieHumanArmPrior.IArm =
          AutoMovieHumanArmPrior.PRIOR.arm;
        const original: AutoMovieHumanArmBones.IBones =
          AutoMovieHumanArmBones.place(
            attachment.glenohumeral,
            unit(prior.upper),
            unit(prior.lower),
            input.arms.upper,
            input.arms.lower,
            attachment.shoulder[1] - attachment.glenohumeral[1],
          );
        const hand: AutoMovieHumanHandBones.IOutput =
          AutoMovieHumanHandBones.sided(
            AutoMovieHumanHandBones.of(
              original.wrist,
              input.arms[side],
              input.sex,
              input.arms.scale,
              input.diagnostics,
            ),
            sign,
          );
        const reflect: (p: Vec3) => Vec3 = (p: Vec3): Vec3 => [
          p[0],
          p[1],
          sign * p[2],
        ];
        const actual: IArm = {
          bones: {
            shoulder: reflect(original.shoulder),
            elbow: reflect(original.elbow),
            wrist: reflect(original.wrist),
          },
          hand,
          projection: attachment.shoulder[1] - attachment.glenohumeral[1],
        };
        arms.set(side, actual);
        return actual;
      },
      leg(side: Side): ILeg {
        const previous: ILeg | undefined = legs.get(side);
        if (previous !== undefined) return previous;

        // FootBones owns an ankle at local XZ zero. The leg's explicit
        // nominal ankle placement supplies the sole world translation.
        const foot: AutoMovieHumanFootBones.IBones = AutoMovieHumanFootBones.of(
          input.feet[side],
          side === "left" ? 1 : -1,
        ).bones;
        const actual: ILeg = {
          ...leg(
            input.stature,
            input.legs,
            side,
            foot.ankle[1],
            input.hipForward,
          ),
          foot,
        };
        legs.set(side, actual);
        return actual;
      },
    };
  }
}

/** Original physical vector in calibration mm. */
type Vec3 = [number, number, number];

/** Side-qualified rest request. */
type Side = "left" | "right";

/** Original leg placement and stance translation; no skin is read. */
type Leg = Pick<AutoMovieHumanLegBones.IBones, "hip" | "knee" | "ankle"> & {
  /** Translation of the foot's own XZ origin under the actual ankle. */
  shift: [number, number];
};

/** Place one leg from public dimensions and its common frame datum. */
function leg(
  stature: number,
  inputs: AutoMovieHumanLegConstruction.IInputs,
  side: "left" | "right",
  ankleHeight: number,
  hipForward: number,
): Leg {
  const sign: number = side === "left" ? 1 : -1;
  const ankleForward: number = AutoMovieHumanBodyFrame.skeletalAnkleForward(
    inputs.fat,
    inputs.muscularity,
    inputs.scale,
  );
  const joints: AutoMovieHumanLegBones.IBones = AutoMovieHumanLegBones.of({
    stature,
    scale: inputs.scale,
    ankleHeight,
    medial: AutoMovieHumanFootPrior.PRIOR.malleoli.medial.height,
    hipForward,
    ankleForward,
  });
  const reflect: (point: Vec3) => Vec3 = (point: Vec3): Vec3 => [
    point[0],
    point[1],
    sign * point[2],
  ];
  return {
    hip: reflect(joints.hip),
    knee: reflect(joints.knee),
    ankle: reflect(joints.ankle),
    shift: [joints.ankle[0], sign * joints.ankle[2]],
  };
}

/** Normalize the original observed bind directions. */
function unit(direction: readonly number[]): Vec3 {
  const length: number = Math.hypot(...direction);
  if (!(length > 0))
    throw new Error("An arm bind direction must have positive length");
  return [
    direction[0]! / length,
    direction[1]! / length,
    direction[2]! / length,
  ];
}
