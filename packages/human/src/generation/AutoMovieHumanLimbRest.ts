import type {
  AutoMovieHumanSide,
  AutoMovieVector3Tuple,
  IAutoMovieHumanArmBones,
  IAutoMovieHumanFootBones,
  IAutoMovieHumanHandBones,
  IAutoMovieHumanLegBones,
  IAutoMovieHumanLegConstruction,
  IAutoMovieHumanLimbRest,
} from "@automovie/interface";

import { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";
import { AutoMovieHumanBodyFrame } from "./AutoMovieHumanBodyFrame";
import { AutoMovieHumanFootPrior } from "./AutoMovieHumanFootPrior";
import { AutoMovieHumanArmBones } from "./arm/AutoMovieHumanArmBones";
import { AutoMovieHumanFootBones } from "./foot/AutoMovieHumanFootBones";
import { AutoMovieHumanHandBones } from "./hand/AutoMovieHumanHandBones";
import { AutoMovieHumanLegBones } from "./leg/AutoMovieHumanLegBones";

/** Pure sided rest definitions shared by source authors and the full skeleton. */
export namespace AutoMovieHumanLimbRest {
  /**
   * Female and male full-extension carrying angles, in degrees. Paraskevas et
   * al., Surg Radiol Anat 26:19–23 (2004), 600 students (PMID 14648036).
   * Transfer the mean lateral angle to the corresponding coronal bind.
   */
  const CARRY: readonly [number, number] = [15.07, 10.97];

  /**
   * Own one invocation's actual sided numerical rest records, without a whole
   * skeleton.
   */
  export function create(
    input: IAutoMovieHumanLimbRest.IInput,
  ): IAutoMovieHumanLimbRest.IOutput {
    return {
      arm(side: AutoMovieHumanSide): IAutoMovieHumanLimbRest.IArm {
        // Place the canonical arm from its direct attachment, then reflect
        // its rest/material data once; no adjoining source supplies a point.
        const attachment: IAutoMovieHumanLimbRest.IShoulder = input.shoulder();
        const sign: 1 | -1 = side === "left" ? 1 : -1;
        const carrying: number =
          (CARRY[input.sex === AutoMovieHumanSex.Female ? 0 : 1] * Math.PI) /
          180;
        const original: IAutoMovieHumanArmBones.IBones =
          AutoMovieHumanArmBones.place(
            attachment.glenohumeral,
            downward(AutoMovieHumanArmBones.DEFAULT_ABDUCTION),
            downward(AutoMovieHumanArmBones.DEFAULT_ABDUCTION + carrying),
            input.arms.upper,
            input.arms.lower,
            attachment.shoulder[1] - attachment.glenohumeral[1],
          );
        const hand: IAutoMovieHumanHandBones.IOutput =
          AutoMovieHumanHandBones.sided(
            AutoMovieHumanHandBones.of(
              original.wrist,
              input.arms[side],
              input.sex,
              input.arms.scale,
              input.diagnostics,
              AutoMovieHumanHandBones.frame(original.lower),
            ),
            sign,
          );
        const reflect: (p: AutoMovieVector3Tuple) => AutoMovieVector3Tuple = (
          p: AutoMovieVector3Tuple,
        ): AutoMovieVector3Tuple => [p[0], p[1], sign * p[2]];
        return {
          bones: {
            shoulder: reflect(original.shoulder),
            elbow: reflect(original.elbow),
            wrist: reflect(original.wrist),
          },
          hand,
          projection: attachment.shoulder[1] - attachment.glenohumeral[1],
        };
      },
      leg(side: AutoMovieHumanSide): IAutoMovieHumanLimbRest.ILeg {
        // FootBones owns an ankle at local XZ zero. The leg's explicit
        // nominal ankle placement supplies the sole world translation.
        const foot: IAutoMovieHumanFootBones.IBones =
          AutoMovieHumanFootBones.of(
            input.feet[side],
            side === "left" ? 1 : -1,
          ).bones;
        return {
          ...leg(
            input.stature,
            input.legs,
            side,
            foot.ankle[1],
            input.hipForward,
          ),
          foot,
        };
      },
    };
  }
}

/** Place one leg from public dimensions and its common frame datum. */
function leg(
  stature: number,
  inputs: IAutoMovieHumanLegConstruction.IInputs,
  side: "left" | "right",
  ankleHeight: number,
  hipForward: number,
): IAutoMovieHumanLimbRest.Leg {
  const sign: number = side === "left" ? 1 : -1;
  const ankleForward: number = AutoMovieHumanBodyFrame.skeletalAnkleForward(
    inputs.fat,
    inputs.muscularity,
    inputs.scale,
  );
  const joints: IAutoMovieHumanLegBones.IBones = AutoMovieHumanLegBones.of({
    stature,
    scale: inputs.scale,
    ankleHeight,
    medial: AutoMovieHumanFootPrior.PRIOR.malleoli.medial.height,
    hipForward,
    ankleForward,
    lengths: inputs.lengths?.[side],
  });
  const reflect: (point: AutoMovieVector3Tuple) => AutoMovieVector3Tuple = (
    point: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple => [point[0], point[1], sign * point[2]];
  return {
    hip: reflect(joints.hip),
    knee: reflect(joints.knee),
    ankle: reflect(joints.ankle),
    shift: [joints.ankle[0], sign * joints.ankle[2]],
  };
}

/** A unit left-side direction by coronal abduction from the downward axis. */
function downward(angle: number): AutoMovieVector3Tuple {
  return [0, -Math.cos(angle), Math.sin(angle)];
}
