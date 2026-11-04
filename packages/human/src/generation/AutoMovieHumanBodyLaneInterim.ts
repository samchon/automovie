import type { IAutoMovieLoftChain } from "@automovie/engine";
import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import { AutoMovieHumanBodyAnatomy } from "./AutoMovieHumanBodyAnatomy";
import type { AutoMovieHumanBodyLane } from "./AutoMovieHumanBodyLane";
import type { AutoMovieHumanFootConstruction } from "./AutoMovieHumanFootConstruction";
import type { AutoMovieHumanSkeletonLaw } from "./AutoMovieHumanSkeletonLaw";
import type { AutoMovieHumanTrunkConstruction } from "./AutoMovieHumanTrunkConstruction";
import { AutoMovieHumanTrunkRows } from "./AutoMovieHumanTrunkRows";
import { AutoMovieHumanTrunkSolver } from "./AutoMovieHumanTrunkSolver";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanBodyMeasures } from "./IAutoMovieHumanBodyMeasures";
import type { IAutoMovieHumanTrunkSolution } from "./IAutoMovieHumanTrunkSolution";
import { AutoMovieHumanArmInterim } from "./arm/AutoMovieHumanArmInterim";
import type { AutoMovieHumanArmWalk } from "./arm/AutoMovieHumanArmWalk";
import { AutoMovieHumanFootInterim } from "./foot/AutoMovieHumanFootInterim";
import { AutoMovieHumanLegSites } from "./AutoMovieHumanLegSites";
import { AutoMovieHumanLegLaws } from "./leg/AutoMovieHumanLegLaws";
import { AutoMovieHumanDigitInterim } from "./limb/AutoMovieHumanDigitInterim";
import type { AutoMovieHumanDigitWalk } from "./limb/AutoMovieHumanDigitWalk";
import { AutoMovieHumanMassInterim } from "./trunk/AutoMovieHumanMassInterim";
import { AutoMovieHumanTrunkInterim } from "./trunk/AutoMovieHumanTrunkInterim";
import { AutoMovieHumanTrunkLaws } from "./trunk/AutoMovieHumanTrunkLaws";
import { AutoMovieHumanTrunkViews } from "./trunk/AutoMovieHumanTrunkViews";

type Vec3 = [number, number, number];

/**
 * The body lane's input for a person while some of its laws are still owed
 * (#3044's rule for priors the campaign has not yet replaced: read from the
 * construction that produces them today, listed as remaining, never refit).
 * Every owed value comes from one named interim accessor
 * (`AutoMovieHumanTrunkInterim`, `AutoMovieHumanMassInterim`,
 * `AutoMovieHumanArmInterim`,
 * `AutoMovieHumanFootInterim`, `AutoMovieHumanDigitInterim`), each reading today's
 * construction (the old trunk solve, the bind skeleton, the old foot frame
 * and prior, today's limb, foot, hand and digit chains) with no number of
 * its own, and each is swapped for its law the moment the input and laws
 * worker lands it (`log-body.md`, "Interim accessors").
 *
 * Published values and landed laws are read as they are: the trunk's boxes,
 * heights and back profile (`AutoMovieHumanTrunkViews`, `AutoMovieHumanTrunkLaws`),
 * the leg's tapes, sites, thigh depth and bone place (`AutoMovieHumanLegLaws`),
 * the foot's instep and ball lengths.
 */
export namespace AutoMovieHumanBodyLaneInterim {
  /** What the interim lane reads. */
  export interface IInput {
    /** The public input. */
    params: IAutoMovieHumanParameters;

    /** Calibration millimetres per world millimetre. */
    scale: number;

    /** Calibration stature, mm. */
    stature: number;

    /** The crotch's height, calibration mm. */
    crotch: number;

    /** The old trunk's inputs (`AutoMovieHumanBodyLaw` column). */
    trunk: AutoMovieHumanTrunkConstruction.IInputs;

    /** The neck chain `head`, which the old trunk solve stands under. */
    neck: IAutoMovieLoftChain;

    /** The feet's dimensions, calibration mm. */
    feet: AutoMovieHumanFootConstruction.IInputs;

    /** The bind skeleton. */
    skeleton: readonly AutoMovieHumanSkeletonLaw.IBone[];

    /** Today's whole body with its limb, foot, hand and digit chains. */
    old: IAutoMovieHumanBodyCalibration;
  }

  /** The fingers, as the skeleton and the chains name them. */
  const FINGERS: readonly ("Index" | "Middle" | "Ring" | "Little")[] = ["Index", "Middle", "Ring", "Little"];

  /**
   * The lane's input.
   *
   * @param input The person, the old constructions and the skeleton.
   * @returns The body lane's input.
   */
  export function of(input: IInput): AutoMovieHumanBodyLane.IInput {
    const measures: IAutoMovieHumanBodyMeasures = AutoMovieHumanBodyAnatomy.resolve(input.params);
    const solution: IAutoMovieHumanTrunkSolution = AutoMovieHumanTrunkSolver.solve({ inputs: input.trunk, stature: input.stature, crotch: input.crotch, neck: input.neck });
    const radius: number = AutoMovieHumanTrunkInterim.foldRadius(solution);
    const bone = (name: string): AutoMovieHumanSkeletonLaw.IBone => {
      const found: AutoMovieHumanSkeletonLaw.IBone | undefined = input.skeleton.find((b: AutoMovieHumanSkeletonLaw.IBone): boolean => b.bone === name);
      if (found === undefined) throw new Error(`The skeleton lacks ${name}`);
      return found;
    };
    const chain = (name: string): IAutoMovieLoftChain => {
      const found: IAutoMovieLoftChain | undefined = input.old.chains.find((c: IAutoMovieLoftChain): boolean => c.name === name);
      if (found === undefined) throw new Error(`Today's body lacks the chain ${name}`);
      return found;
    };

    // The trunk: the published boxes and the landed laws, the owed values
    // read on the old trunk's solve.
    const ankles: number = (bone("leftFoot").position[0] + bone("rightFoot").position[0]) / 2;
    const placed: { cervicale: number; perineum: number } = AutoMovieHumanTrunkInterim.places(measures, input.scale, ankles);
    const pending = (upper: AutoMovieHumanTrunkViews.ILaws["upper"]): AutoMovieHumanTrunkLaws.IPending => ({
      cervicale: placed.cervicale,
      perineum: placed.perineum,
      upper,
    });
    const laws: AutoMovieHumanTrunkViews.ILaws = AutoMovieHumanTrunkLaws.of(
      measures,
      input.scale,
      input.crotch,
      pending(AutoMovieHumanTrunkInterim.upperSites(solution, measures, input.scale, input.crotch, input.stature, placed.cervicale)),
    );

    const side = (name: "left" | "right"): AutoMovieHumanBodyLane.ISide => {
      const hip: Vec3 = bone(`${name}UpperLeg`).position;
      const knee: Vec3 = bone(`${name}LowerLeg`).position;
      const ankle: Vec3 = bone(`${name}Foot`).position;
      const shoulder: Vec3 = bone(`${name}UpperArm`).position;
      const elbow: Vec3 = bone(`${name}LowerArm`).position;
      const wrist: Vec3 = bone(`${name}Hand`).position;
      const knuckle: Vec3 = bone(`${name}MiddleProximal`).position;
      const fold = (from: number, to: number): AutoMovieHumanBodyLane.IFold => ({ search: { phi: 0, from, to }, radius });

      // The arm and palm's sites, each box read on today's arm and palm.
      const arm: AutoMovieHumanArmWalk.ISiteLaw[] = AutoMovieHumanArmInterim.sites(chain(`arm.${name}`), chain(`hand.${name}.1`), shoulder, elbow, wrist, knuckle);
      const depth = (site: string): number => {
        const s: AutoMovieHumanArmWalk.ISiteLaw | undefined = arm.find((l: AutoMovieHumanArmWalk.ISiteLaw): boolean => l.site === site);
        return s === undefined ? 0 : s.edges[0] - s.edges[2];
      };
      const digit = (chainName: string, centres: Vec3[]): AutoMovieHumanBodyLane.IDigit => {
        const walk: AutoMovieHumanDigitWalk.IInput = AutoMovieHumanDigitInterim.walk(chainName, chain(chainName), centres);
        return { digit: walk, fold: { search: { phi: 0, from: 0, to: 0.5 }, radius: walk.law("base").breadth / 2 } };
      };
      const toes: IAutoMovieLoftChain[] = [1, 2, 3, 4, 5].map((k: number): IAutoMovieLoftChain => chain(`toe.${name}.${k}`));
      return {
        leg: {
          bones: { hip, knee, ankle },
          law: AutoMovieHumanLegLaws.of(measures, input.scale, knee[1], ankle[1], AutoMovieHumanLegSites.ankle(ankle[1]), input.crotch, name),
          trunk: fold(0, 0.5),
          foot: fold(1, 0.85),
        },
        arm: {
          bones: { shoulder, elbow, wrist },
          knuckle,
          reach: depth("knuckles") / 2,
          sites: arm,
          joints: { elbow: depth("elbow"), wrist: depth("wrist") },
          trunk: fold(0, 0.4),
        },
        foot: AutoMovieHumanFootInterim.of(name, chain(`foot.${name}`), toes, input.feet[name], ankle, measures, input.scale),
        fingers: [
          ...FINGERS.map((f: string): AutoMovieHumanBodyLane.IDigit => {
            const distal: AutoMovieHumanSkeletonLaw.IBone = bone(`${name}${f}Distal`);
            return digit(`finger.${name}.${f.toLowerCase()}`, [bone(`${name}${f}Proximal`).position, bone(`${name}${f}Intermediate`).position, distal.position, distal.tip ?? distal.position]);
          }),
          digit(`thumb.${name}`, [bone(`${name}ThumbMetacarpal`).position, bone(`${name}ThumbProximal`).position, bone(`${name}ThumbDistal`).position, bone(`${name}ThumbDistal`).tip ?? bone(`${name}ThumbDistal`).position]),
        ],
        toes: toes.map((toe: IAutoMovieLoftChain): AutoMovieHumanBodyLane.IDigit => digit(toe.name, AutoMovieHumanDigitInterim.toeCentres(toe))),
      };
    };

    return {
      trunk: {
        views: AutoMovieHumanTrunkViews.of(measures, input.crotch, input.scale, laws, {
          breast: AutoMovieHumanMassInterim.breastAmplitude(measures, input.scale),
          gluteal: AutoMovieHumanMassInterim.glutealAmplitude(measures, input.scale),
        }),
        tapes: { chest: measures.chestCircumference * input.scale, hip: measures.hipCircumference * input.scale },
        breast: AutoMovieHumanMassInterim.breast(solution, measures, input.scale, radius),
        gluteal: AutoMovieHumanMassInterim.gluteal(solution, measures, input.scale, laws, radius),
      },
      sides: { left: side("left"), right: side("right") },
      gap: AutoMovieHumanTrunkRows.MAX_GAP,
    };
  }
}
