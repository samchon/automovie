import type { AutoMovieLoftContract, IAutoMovieLoftChain } from "@automovie/engine";
import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import { AutoMovieHumanBodyAnatomy } from "./AutoMovieHumanBodyAnatomy";
import type { AutoMovieHumanBodyLane } from "./AutoMovieHumanBodyLane";
import type { AutoMovieHumanFootConstruction } from "./AutoMovieHumanFootConstruction";
import type { AutoMovieHumanSkeletonLaw } from "./AutoMovieHumanSkeletonLaw";
import type { AutoMovieHumanTrunkConstruction } from "./AutoMovieHumanTrunkConstruction";
import { AutoMovieHumanTrunkRows } from "./AutoMovieHumanTrunkRows";
import { AutoMovieHumanTrunkSolver } from "./AutoMovieHumanTrunkSolver";
import type { AutoMovieHumanArmConstruction } from "./AutoMovieHumanArmConstruction";
import type { IAutoMovieHumanBodyMeasures } from "./IAutoMovieHumanBodyMeasures";
import type { IAutoMovieHumanTrunkSolution } from "./IAutoMovieHumanTrunkSolution";
import { AutoMovieHumanArmInterim } from "./arm/AutoMovieHumanArmInterim";
import type { AutoMovieHumanArmWalk } from "./arm/AutoMovieHumanArmWalk";
import type { AutoMovieHumanHandBones } from "./hand/AutoMovieHumanHandBones";
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
 * The trunk's owed values come from the old trunk's solve
 * (`AutoMovieHumanTrunkInterim`, `AutoMovieHumanMassInterim`), and the
 * joint centres from the bind skeleton. The arm, the digits, the foot and the
 * toes take their sections from the person's tapes, the published digit
 * joints and the reference set's outline tables
 * (`AutoMovieHumanArmInterim`, `AutoMovieHumanDigitInterim`,
 * `AutoMovieHumanFootInterim`); no old limb chain is read (`log-body.md`).
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
    /** Actual sided hand joints and material directions already used by the skeleton. */
    hands: Record<"left" | "right", AutoMovieHumanHandBones.IOutput>;

    /** The arms' tapes and the hands' dimensions, calibration mm. */
    arms: AutoMovieHumanArmConstruction.IInputs;
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
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [];
    const measures: IAutoMovieHumanBodyMeasures = AutoMovieHumanBodyAnatomy.resolve(input.params);
    const solution: IAutoMovieHumanTrunkSolution = AutoMovieHumanTrunkSolver.solve({ inputs: input.trunk, stature: input.stature, crotch: input.crotch, neck: input.neck });
    const radius: number = AutoMovieHumanTrunkInterim.foldRadius(solution);
    const bone = (name: string): AutoMovieHumanSkeletonLaw.IBone => {
      const found: AutoMovieHumanSkeletonLaw.IBone | undefined = input.skeleton.find((b: AutoMovieHumanSkeletonLaw.IBone): boolean => b.bone === name);
      if (found === undefined) throw new Error(`The skeleton lacks ${name}`);
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
      const hand: AutoMovieHumanHandBones.IOutput = input.hands[name];
      const knuckle: Vec3 = hand.knuckle;
      const crease: Vec3 = hand.crease;
      const fold = (from: number, to: number): AutoMovieHumanBodyLane.IFold => ({ search: { phi: 0, from, to }, radius });

      // The arm and palm's sites from the person's tapes.
      const arm: AutoMovieHumanArmWalk.ISiteLaw[] = AutoMovieHumanArmInterim.sites(name, input.arms, elbow, wrist, true, hand.radialCenter);
      const depth = (site: string): number => {
        const s: AutoMovieHumanArmWalk.ISiteLaw | undefined = arm.find((l: AutoMovieHumanArmWalk.ISiteLaw): boolean => l.site === site);
        if (s === undefined) throw new Error(`The ${name} arm lacks its named ${site} source law`);
        return s.edges[0] - s.edges[2];
      };
      const palm: AutoMovieHumanArmWalk.ISiteLaw = arm.find((site: AutoMovieHumanArmWalk.ISiteLaw): boolean => site.site === "knuckles")!;
      const palmDepth: number = palm.edges[1] - palm.edges[3];
      const branch = (walk: AutoMovieHumanDigitWalk.IInput): AutoMovieHumanBodyLane.IDigit => ({ digit: walk, fold: { search: { phi: 0, from: 0, to: 0.5 }, radius: walk.law("base").breadth / 2 } });
      const foot: AutoMovieHumanFootInterim.IDefinition = AutoMovieHumanFootInterim.define(name, input.feet[name], ankle, measures, input.scale);
      diagnostics.push(...foot.diagnostics);

      // The source hand owns these material directions. A cross product of
      // unequal metacarpals and an already flexed middle phalanx would
      // reconstruct a different frame and then lend it to every digit.
      const handLength: number = (name === "left" ? input.arms.left : input.arms.right).length / input.scale;
      const finger = (f: "Index" | "Middle" | "Ring" | "Little", digit: 2 | 3 | 4 | 5): AutoMovieHumanBodyLane.IDigit => {
        const source: AutoMovieHumanHandBones.IDigit = hand.fingers[f];
        return branch(AutoMovieHumanDigitInterim.finger(`finger.${name}.${f.toLowerCase()}`, source.centres, source.dorsal, measures.sex, handLength, digit, input.scale));
      };
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
          crease,
          radial: hand.frame.across,
          reach: palmDepth / 2,
          sites: arm,
          joints: { elbow: depth("elbow"), wrist: depth("wrist") },
          trunk: fold(0, 0.4),
        },
        foot: foot.foot,
        fingers: [
          ...FINGERS.map((f: "Index" | "Middle" | "Ring" | "Little", k: number): AutoMovieHumanBodyLane.IDigit => finger(f, (k + 2) as 2 | 3 | 4 | 5)),
          branch(
            AutoMovieHumanDigitInterim.finger(
              `thumb.${name}`,
              hand.thumb.centres,
              hand.thumb.dorsal,
              measures.sex,
              handLength,
              1,
              input.scale,
            ),
          ),
        ],
        toes: foot.toes.map((source: AutoMovieHumanFootInterim.IToe): AutoMovieHumanBodyLane.IToe => ({ toe: source.part, fold: { search: { phi: 0, from: 0, to: 0.5 }, radius: source.part.law("base").breadth / 2 } })),
      };
    };

    return {
      diagnostics,
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
