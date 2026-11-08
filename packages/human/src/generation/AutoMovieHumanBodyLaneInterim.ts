import type { AutoMovieLoftContract } from "@automovie/engine";

import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import { AutoMovieHumanBodyAnatomy } from "./AutoMovieHumanBodyAnatomy";
import type { AutoMovieHumanBodyFrame } from "./AutoMovieHumanBodyFrame";
import type { AutoMovieHumanBodyLane } from "./AutoMovieHumanBodyLane";
import { AutoMovieHumanLimbSources } from "./AutoMovieHumanLimbSources";
import type { AutoMovieHumanTrunkConstruction } from "./AutoMovieHumanTrunkConstruction";
import { AutoMovieHumanTrunkRows } from "./AutoMovieHumanTrunkRows";
import type { IAutoMovieHumanBodyMeasures } from "./IAutoMovieHumanBodyMeasures";
import type { IAutoMovieHumanTrunkSolution } from "./IAutoMovieHumanTrunkSolution";
import { AutoMovieHumanFootInterim } from "./foot/AutoMovieHumanFootInterim";
import type { AutoMovieHumanLegWalk } from "./leg/AutoMovieHumanLegWalk";
import type { AutoMovieHumanSiteViewPart } from "./limb/AutoMovieHumanSiteViewPart";
import { AutoMovieHumanMassInterim } from "./trunk/AutoMovieHumanMassInterim";
import type { AutoMovieHumanTrunkConnection } from "./trunk/AutoMovieHumanTrunkConnection";
import { AutoMovieHumanTrunkInterim } from "./trunk/AutoMovieHumanTrunkInterim";
import { AutoMovieHumanTrunkLaws } from "./trunk/AutoMovieHumanTrunkLaws";
import { AutoMovieHumanTrunkViews } from "./trunk/AutoMovieHumanTrunkViews";

/**
 * The body lane's input for a person while some of its laws are still owed
 * (#3044's rule for priors the campaign has not yet replaced: read from the
 * construction that produces them today, listed as remaining, never refit).
 * The trunk's owed values come from the old trunk's solve
 * (`AutoMovieHumanTrunkInterim`, `AutoMovieHumanMassInterim`), and the
 * spine joints from the remaining legacy trunk. Limb originals and the full
 * bind skeleton consume the same independent local rest/source owners. The arm, the digits, the foot and the
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
    /** The same canonical solved placement, including its actual neck owner. */
    solution: IAutoMovieHumanTrunkSolution;

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

    /** Common original neck definition, captured before raw lofting. */
    neckConnection: AutoMovieHumanTrunkConnection.IDefinition;

    /** Same invocation's direct source factories, also consumed by scoped originals. */
    sources: AutoMovieHumanLimbSources.IOutput;

    /** Direct common skin-based AP frame, distinct from the nominal skeletal ankle. */
    frame: AutoMovieHumanBodyFrame.IOutput;
  }

  /**
   * The lane's input.
   *
   * @param input The person, the old constructions and the skeleton.
   * @returns The body lane's input.
   */
  export function of(input: IInput): AutoMovieHumanBodyLane.IInput {
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [];
    const measures: IAutoMovieHumanBodyMeasures =
      AutoMovieHumanBodyAnatomy.resolve(input.params);
    const solution: IAutoMovieHumanTrunkSolution = input.solution;
    const radius: number = AutoMovieHumanTrunkInterim.foldRadius(solution);

    // The same input-derived frame places head/S00 and the remaining legacy
    // trunk. A skeletal ankle offset must not be added to its skin priors again.
    const placed: AutoMovieHumanBodyFrame.IOutput = input.frame;
    const pending: (
      upper: AutoMovieHumanTrunkViews.ILaws["upper"],
    ) => AutoMovieHumanTrunkLaws.IPending = (
      upper: AutoMovieHumanTrunkViews.ILaws["upper"],
    ): AutoMovieHumanTrunkLaws.IPending => ({
      chest: solution.landmarks.bustPoint[1],
      cervicale: placed.cervicale,
      perineum: placed.perineum,
      upper,
    });
    const laws: AutoMovieHumanTrunkViews.ILaws = AutoMovieHumanTrunkLaws.of(
      measures,
      input.scale,
      input.crotch,
      pending(
        AutoMovieHumanTrunkInterim.upperSites(
          solution,
          measures,
          input.scale,
          input.crotch,
          input.stature,
          placed.cervicale,
        ),
      ),
    );

    const side: (name: "left" | "right") => AutoMovieHumanBodyLane.ISide = (
      name: "left" | "right",
    ): AutoMovieHumanBodyLane.ISide => {
      const fold: (from: number, to: number) => AutoMovieHumanBodyLane.IFold = (
        from: number,
        to: number,
      ): AutoMovieHumanBodyLane.IFold => ({
        search: { phi: 0, from, to },
        radius,
      });
      return {
        get leg(): AutoMovieHumanBodyLane.ISide["leg"] {
          const own: ReturnType<AutoMovieHumanLimbSources.IOutput["leg"]> =
            input.sources.leg(name);
          return {
            bones: own.bones,
            law: own.law,
            get definition(): AutoMovieHumanLegWalk.IDefinition {
              return own.leg.current();
            },
            bind: own.leg.bind,
            trunk: fold(0, 0.5),
            foot: fold(1, 0.85),
          };
        },
        get arm(): AutoMovieHumanBodyLane.ISide["arm"] {
          return { ...input.sources.arm(name).arm(), trunk: fold(0, 0.4) };
        },
        get foot(): AutoMovieHumanBodyLane.ISide["foot"] {
          return input.sources.leg(name).foot();
        },
        get footDefinition(): AutoMovieHumanSiteViewPart.IDefinition {
          return input.sources.leg(name).definition();
        },
        get fingers(): AutoMovieHumanBodyLane.IDigit[] {
          return input.sources.arm(name).fingers();
        },
        digitNames: AutoMovieHumanLimbSources.names().filter(
          (key: string): boolean =>
            key === "thumb." + name || key.startsWith("finger." + name + "."),
        ),
        digit(key: string): AutoMovieHumanBodyLane.IDigit | undefined {
          return input.sources.arm(name).digit(key);
        },
        get toes(): AutoMovieHumanBodyLane.IToe[] {
          return input.sources.leg(name).toes();
        },
        toeNames: AutoMovieHumanFootInterim.names(name),
      };
    };

    const sides: Record<"left" | "right", AutoMovieHumanBodyLane.ISide> = {
      left: side("left"),
      right: side("right"),
    };
    return {
      diagnostics,
      trunk: {
        get legs(): NonNullable<
          AutoMovieHumanBodyLane.IInput["trunk"]["legs"]
        > {
          return {
            left: sides.left.leg.definition,
            right: sides.right.leg.definition,
          };
        },
        bindLeg(
          side: "left" | "right",
          parent: AutoMovieHumanSiteViewPart.IDefinition,
          station: number,
        ): AutoMovieHumanLegWalk.IDefinition {
          return sides[side].leg.bind(parent, station);
        },
        views: AutoMovieHumanTrunkViews.of(
          measures,
          input.crotch,
          input.scale,
          laws,
          {
            breast: AutoMovieHumanMassInterim.breastAmplitude(
              measures,
              input.scale,
            ),
            gluteal: AutoMovieHumanMassInterim.glutealAmplitude(
              measures,
              input.scale,
            ),
          },
          input.neckConnection,
        ),
        tapes: {
          chest: measures.chestCircumference * input.scale,
          hip: measures.hipCircumference * input.scale,
        },
        breast: AutoMovieHumanMassInterim.breast(
          measures,
          input.scale,
          laws,
          radius,
        ),
        gluteal: AutoMovieHumanMassInterim.gluteal(
          solution,
          measures,
          input.scale,
          laws,
          radius,
        ),
      },
      sides,
      gap: AutoMovieHumanTrunkRows.MAX_GAP,
    };
  }
}
