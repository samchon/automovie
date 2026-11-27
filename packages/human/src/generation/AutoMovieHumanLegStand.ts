import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanBodyCalibration,
  IAutoMovieHumanCalibrationBone,
  IAutoMovieHumanLegConstruction,
  IAutoMovieHumanSurfacePole,
  IAutoMovieLoftChain,
  IAutoMovieNaturalCubicSpline,
} from "@automovie/interface";

import { AutoMovieHumanPolarSection } from "../lofting/AutoMovieHumanPolarSection";
import { AutoMovieHumanLegAnkleSeam } from "./AutoMovieHumanLegAnkleSeam";
import { AutoMovieHumanLegCrotchRoot } from "./AutoMovieHumanLegCrotchRoot";
import { AutoMovieHumanLegLaw } from "./AutoMovieHumanLegLaw";

/**
 * The feet moved rigidly under the stance: each foot stands under its leg's
 * ankle, its chains and poles shifted horizontally by the move from its own
 * frame to the stance. The stance is the skeleton's ankle when the skeleton is
 * given, and otherwise the leg law's line at the ankle.
 */
export namespace AutoMovieHumanLegStand {
  /**
   * Calibration with the feet moved rigidly under the stance.
   *
   * @param calibration Calibration holding the foot family and trunk; not
   *   modified.
   * @param inputs Tape measures in calibration millimetres.
   * @param skeleton The bind skeleton: each foot stands under its ankle.
   *   Absent, the stance is read from the prior's line here.
   */
  export function of(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: IAutoMovieHumanLegConstruction.IInputs,
    skeleton?: readonly IAutoMovieHumanCalibrationBone[],
  ): IAutoMovieHumanBodyCalibration {
    const axis: IAutoMovieNaturalCubicSpline[] =
      AutoMovieHumanLegLaw.axisCurves();
    const moves: Map<"left" | "right", [number, number]> = new Map(
      (["left", "right"] as const).map(
        (side: "left" | "right"): ["left" | "right", [number, number]] => {
          const sign: 1 | -1 = side === "left" ? 1 : -1;
          const ankle: Vec3[] = AutoMovieHumanLegAnkleSeam.ring(
            calibration,
            side,
          );
          const at: [number, number] = AutoMovieHumanPolarSection.measure(
            ankle.map((p: Vec3): [number, number] => [p[0], p[2]]),
          ).centre;
          const joint: IAutoMovieHumanCalibrationBone | undefined =
            skeleton?.find(
              (b: IAutoMovieHumanCalibrationBone): boolean =>
                b.bone === `${side}Foot`,
            );
          if (skeleton !== undefined && joint === undefined)
            throw new Error(`The skeleton lacks the ${side} ankle`);
          if (joint !== undefined)
            return [
              side,
              [joint.position[0] - at[0], joint.position[2] - at[1]],
            ];
          const length: number =
            AutoMovieHumanLegLaw.level(
              AutoMovieHumanLegCrotchRoot.ring(calibration, side),
            ) - AutoMovieHumanLegLaw.level(ankle);
          return [
            side,
            [
              AutoMovieHumanLegLaw.forward(inputs) - at[0],
              sign * AutoMovieHumanLegLaw.lateral(axis, 0, length, inputs) -
                at[1],
            ],
          ];
        },
      ),
    );

    // The chains and poles of one side's foot, toes and forefoot.
    function owner(name: string): "left" | "right" | null {
      return !/^(foot|forefoot|toe)\./.test(name)
        ? null
        : name.includes("left")
          ? "left"
          : "right";
    }
    function shift(
      p: readonly [number, number, number],
      d: readonly [number, number],
    ): Vec3 {
      return [p[0] + d[0], p[1], p[2] + d[1]];
    }
    return {
      ...calibration,
      chains: calibration.chains.map(
        (c: IAutoMovieLoftChain): IAutoMovieLoftChain => {
          const side: "left" | "right" | null = owner(c.name);
          if (side === null) return c;
          const d: [number, number] = moves.get(side)!;
          return {
            ...c,
            ...(c.pole === undefined
              ? {}
              : { pole: { ...c.pole, point: shift(c.pole.point, d) } }),
            layers: c.layers.map(
              (l: IAutoMovieLoftChain.ILayer): IAutoMovieLoftChain.ILayer =>
                l.frame === undefined
                  ? l
                  : {
                      ...l,
                      frame: { ...l.frame, origin: shift(l.frame.origin, d) },
                    },
            ),
          };
        },
      ),
      poles: calibration.poles.map(
        (p: IAutoMovieHumanSurfacePole): IAutoMovieHumanSurfacePole => {
          const side: "left" | "right" | null = owner(p.chain);
          return side === null
            ? p
            : { ...p, point: shift(p.point, moves.get(side)!) };
        },
      ),
    };
  }
}

type Vec3 = AutoMovieVector3Tuple;
