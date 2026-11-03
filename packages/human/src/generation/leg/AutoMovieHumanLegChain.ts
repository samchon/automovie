import type { IAutoMovieHumanLoftChain } from "../../lofting/IAutoMovieHumanLoftChain";
import type { AutoMovieHumanLegConstruction } from "../AutoMovieHumanLegConstruction";
import type { AutoMovieHumanSkeletonLaw } from "../AutoMovieHumanSkeletonLaw";
import type { IAutoMovieHumanBodyCalibration } from "../IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLegAxis } from "./AutoMovieHumanLegAxis";
import { AutoMovieHumanLegCentreLine } from "./AutoMovieHumanLegCentreLine";
import { AutoMovieHumanLegCrotchRoot } from "./AutoMovieHumanLegCrotchRoot";
import { AutoMovieHumanLegReflection } from "./AutoMovieHumanLegReflection";
import { AutoMovieHumanLegSampling } from "./AutoMovieHumanLegSampling";
import { AutoMovieHumanLegSection } from "./AutoMovieHumanLegSection";
import { AutoMovieHumanLegSectionLaw } from "./AutoMovieHumanLegSectionLaw";
import { AutoMovieHumanLegStations } from "./AutoMovieHumanLegStations";
import { AutoMovieHumanLegVector } from "./AutoMovieHumanLegVector";

type Vec3 = AutoMovieHumanLegVector.Vec3;
const { lerp, norm, sub } = AutoMovieHumanLegVector;

/**
 * One leg's chain `leg.<side>`: the layers between the ankle ring and the
 * crotch ring, each the section of {@link AutoMovieHumanLegSection} at its
 * station with its station derivative, in the left leg's canonical frame and
 * the side's reflection.
 *
 * Central differences inside, one-sided of second order at the ends: nothing
 * exists past the rings. The skin depths at the joints (the distance from each
 * joint to the skin nearest it) size the joints' bends, over which the frames
 * turn and the rows are spaced.
 */
export namespace AutoMovieHumanLegChain {
  /** The hip, knee and ankle of a side, read in the canonical frame. */
  export function joints(
    skeleton: readonly AutoMovieHumanSkeletonLaw.IBone[],
    side: "left" | "right",
    sign: 1 | -1,
  ): AutoMovieHumanLegAxis.IJoints {
    const at = (name: string): Vec3 => {
      const bone: AutoMovieHumanSkeletonLaw.IBone | undefined = skeleton.find((b: AutoMovieHumanSkeletonLaw.IBone): boolean => b.bone === `${side}${name}`);
      if (bone === undefined) throw new Error(`The skeleton lacks the ${side} ${name}`);
      return [bone.position[0], bone.position[1], sign * bone.position[2]];
    };
    return { hip: at("UpperLeg"), knee: at("LowerLeg"), ankle: at("Foot") };
  }

  /**
   * One leg's chain.
   *
   * @param calibration Calibration holding `trunk` and the feet.
   * @param side The leg's side.
   * @param inputs Tape measures in calibration millimetres.
   * @param skeleton The bind skeleton the leg is lofted on.
   */
  export function of(
    calibration: IAutoMovieHumanBodyCalibration,
    side: "left" | "right",
    inputs: AutoMovieHumanLegConstruction.IInputs,
    skeleton: readonly AutoMovieHumanSkeletonLaw.IBone[],
  ): IAutoMovieHumanLoftChain {
    const sign: 1 | -1 = side === "left" ? 1 : -1;
    const bones: AutoMovieHumanLegAxis.IJoints = joints(skeleton, side, sign);
    const heights: AutoMovieHumanLegStations.IBones = { hip: bones.hip[1], knee: bones.knee[1], ankle: bones.ankle[1] };
    const law: AutoMovieHumanLegSectionLaw.ILaw = AutoMovieHumanLegSectionLaw.of(calibration, side, sign, inputs, heights);
    const root: AutoMovieHumanLegCrotchRoot.IRoot = law.root;
    const s0: number = law.bottom;
    const s1: number = law.top;

    // Skin depths at the joints: the distance from each joint to the skin
    // nearest it there. The centre line crosses the knee on its joint, so the
    // tube's chart origin there is the knee centre.
    const kneeDepth: number = Math.min(...AutoMovieHumanLegSectionLaw.radii(law.tube(bones.knee[1])));
    const ankleDepth: number = Math.min(...law.ankleWorld.map((p: Vec3): number => norm(sub(p, bones.ankle))));
    const hipDepth: number = Math.min(
      ...root.arc.map((p: Vec3): number => norm(sub(p, bones.hip))),
      ...[0, 0.25, 0.5, 0.75, 1].map((f: number): number => norm(sub(lerp(root.arc[root.arc.length - 1]!, root.arc[0]!, f), bones.hip))),
    );
    const BEND: number = AutoMovieHumanLegStations.BEND;
    const frames: AutoMovieHumanLegAxis.IFrames = AutoMovieHumanLegAxis.of(bones, s0, s1, BEND * kneeDepth, law.ankleReach, law.crotchReach);
    const centre: (s: number) => [number, number] = AutoMovieHumanLegCentreLine.of({
      frames,
      ankle: { at: s0, point: law.ankleCentre },
      crotch: { at: s1, point: law.crotchCentre },
      knee: bones.knee[1],
    });
    const trunk: IAutoMovieHumanLoftChain = calibration.chains.find((c: IAutoMovieHumanLoftChain): boolean => c.name === "trunk")!;
    const stations: number[] = AutoMovieHumanLegStations.layers({
      bottom: s0,
      top: s1,
      bends: [
        { at: bones.ankle[1], half: BEND * ankleDepth, range: AutoMovieHumanLegStations.range("ankle.dorsiflexion") },
        { at: bones.knee[1], half: BEND * kneeDepth, range: AutoMovieHumanLegStations.range("knee.flexion") },
        { at: bones.hip[1], half: BEND * hipDepth, range: AutoMovieHumanLegStations.range("hip.flexion") },
      ],
      first: trunk.layers[1]!.y - trunk.layers[0]!.y,
      coarsest: AutoMovieHumanLegStations.COARSEST * inputs.scale,
    });
    const section = (s: number): AutoMovieHumanLegSection.ISection => AutoMovieHumanLegSection.of(law, frames, centre, root, s);
    const last: number = stations.length - 1;
    const layers: IAutoMovieHumanLoftChain.ILayer[] = stations.map((s: number, k: number): IAutoMovieHumanLoftChain.ILayer => {
      const here: AutoMovieHumanLegSection.ISection = section(s);

      // The station derivative of every point.
      const rate: Vec3[] =
        k === 0 || k === last
          ? ((): Vec3[] => {
              const d: number = k === 0 ? STEP : -STEP;
              const a: AutoMovieHumanLegSection.ISection = section(s + d);
              const b: AutoMovieHumanLegSection.ISection = section(s + 2 * d);
              return here.local.map(
                (p: Vec3, m: number): Vec3 =>
                  [0, 1, 2].map((c: number): number => (-3 * p[c]! + 4 * a.local[m]![c]! - b.local[m]![c]!) / (2 * d)) as Vec3,
              );
            })()
          : ((): Vec3[] => {
              const a: AutoMovieHumanLegSection.ISection = section(s - STEP);
              const b: AutoMovieHumanLegSection.ISection = section(s + STEP);
              return here.local.map(
                (_: Vec3, m: number): Vec3 => [0, 1, 2].map((c: number): number => (b.local[m]![c]! - a.local[m]![c]!) / (2 * STEP)) as Vec3,
              );
            })();
      const values = AutoMovieHumanLegReflection.sided(here.local, sign);
      const slopes = AutoMovieHumanLegReflection.sided(rate, sign);
      return {
        y: s,
        frame: AutoMovieHumanLegReflection.placed(here.frame, sign),
        frameSlopes: AutoMovieHumanLegReflection.placed(AutoMovieHumanLegAxis.frameRate(frames, s, k === 0 ? 1 : k === last ? -1 : 0), sign),
        coefficients: values.coefficients,
        slopes: slopes.coefficients,
        lift: values.lift,
        liftSlopes: slopes.lift,
      };
    });
    return {
      name: `leg.${side}`,
      basis: "spline",
      order: AutoMovieHumanLegSampling.ORDER,
      rule: "polar",
      samples: AutoMovieHumanLegSampling.SAMPLES,
      layers,
    };
  }

  /** Station step of the section differences, mm. */
  export const STEP: number = 0.05;
}
