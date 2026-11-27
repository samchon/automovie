import type {
  AutoMovieHumanSide,
  AutoMovieVector3Tuple,
  IAutoMovieHumanArmBones,
  IAutoMovieHumanArmPrior,
  IAutoMovieHumanFootBones,
  IAutoMovieHumanHandBones,
  IAutoMovieHumanLegBones,
  IAutoMovieHumanLegConstruction,
  IAutoMovieHumanLimbRest,
} from "@automovie/interface";

import { AutoMovieHumanArmPrior } from "./AutoMovieHumanArmPrior";
import { AutoMovieHumanBodyFrame } from "./AutoMovieHumanBodyFrame";
import { AutoMovieHumanFootPrior } from "./AutoMovieHumanFootPrior";
import { AutoMovieHumanArmBones } from "./AutoMovieHumanArmBones";
import { AutoMovieHumanFootBones } from "./AutoMovieHumanFootBones";
import { AutoMovieHumanHandBones } from "./AutoMovieHumanHandBones";
import { AutoMovieHumanLegBones } from "./AutoMovieHumanLegBones";

/** Pure sided rest definitions shared by source authors and the full skeleton. */
export namespace AutoMovieHumanLimbRest {
  /**
   * Own one invocation's actual sided numerical rest records, without a whole
   * skeleton.
   */
  export function create(
    input: IAutoMovieHumanLimbRest.IInput,
  ): IAutoMovieHumanLimbRest.IOutput {
    const arms: Map<AutoMovieHumanSide, IAutoMovieHumanLimbRest.IArm> =
      new Map();
    const legs: Map<AutoMovieHumanSide, IAutoMovieHumanLimbRest.ILeg> =
      new Map();
    return {
      arm(side: AutoMovieHumanSide): IAutoMovieHumanLimbRest.IArm {
        const previous: IAutoMovieHumanLimbRest.IArm | undefined =
          arms.get(side);
        if (previous !== undefined) return previous;

        // Place the canonical arm from its direct attachment, then reflect
        // its rest/material data once; no adjoining source supplies a point.
        const attachment: IAutoMovieHumanLimbRest.IShoulder = input.shoulder();
        const sign: 1 | -1 = side === "left" ? 1 : -1;
        const prior: IAutoMovieHumanArmPrior.IArm =
          AutoMovieHumanArmPrior.PRIOR.arm;
        const original: IAutoMovieHumanArmBones.IBones =
          AutoMovieHumanArmBones.place(
            attachment.glenohumeral,
            unit(prior.upper),
            unit(prior.lower),
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
            ),
            sign,
          );
        function reflect(p: AutoMovieVector3Tuple): AutoMovieVector3Tuple {
          return [p[0], p[1], sign * p[2]];
        }
        const actual: IAutoMovieHumanLimbRest.IArm = {
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
      leg(side: AutoMovieHumanSide): IAutoMovieHumanLimbRest.ILeg {
        const previous: IAutoMovieHumanLimbRest.ILeg | undefined =
          legs.get(side);
        if (previous !== undefined) return previous;

        // FootBones owns an ankle at local XZ zero. The leg's explicit
        // nominal ankle placement supplies the sole world translation.
        const foot: IAutoMovieHumanFootBones.IBones =
          AutoMovieHumanFootBones.of(
            input.feet[side],
            side === "left" ? 1 : -1,
          ).bones;
        const actual: IAutoMovieHumanLimbRest.ILeg = {
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
  });
  function reflect(point: AutoMovieVector3Tuple): AutoMovieVector3Tuple {
    return [point[0], point[1], sign * point[2]];
  }
  return {
    hip: reflect(joints.hip),
    knee: reflect(joints.knee),
    ankle: reflect(joints.ankle),
    shift: [joints.ankle[0], sign * joints.ankle[2]],
  };
}

/** Normalize the original observed bind directions. */
function unit(direction: readonly number[]): AutoMovieVector3Tuple {
  const length: number = Math.hypot(...direction);
  if (!(length > 0))
    throw new Error("An arm bind direction must have positive length");
  return [
    direction[0]! / length,
    direction[1]! / length,
    direction[2]! / length,
  ];
}
