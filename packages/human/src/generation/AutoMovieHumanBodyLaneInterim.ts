import type {
  IAutoMovieHumanBodyFrame,
  IAutoMovieHumanBodyLane,
  IAutoMovieHumanBodyLaneInterim,
  IAutoMovieHumanBodyMeasures,
  IAutoMovieHumanLegWalk,
  IAutoMovieHumanLimbSources,
  IAutoMovieHumanSourceDefinition,
  IAutoMovieHumanTrunkLaws,
  IAutoMovieHumanTrunkSolution,
  IAutoMovieHumanTrunkViewLaws,
  IAutoMovieLoftContract,
} from "@automovie/interface";

import { AutoMovieHumanBodyAnatomy } from "./AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanLimbSources } from "./AutoMovieHumanLimbSources";
import { AutoMovieHumanTrunkRows } from "./AutoMovieHumanTrunkRows";
import { AutoMovieHumanFootInterim } from "./foot/AutoMovieHumanFootInterim";
import { AutoMovieHumanMassInterim } from "./trunk/AutoMovieHumanMassInterim";
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
  /**
   * The lane's input.
   *
   * @param input The person, the old constructions and the skeleton.
   * @returns The body lane's input.
   */
  export function of(
    input: IAutoMovieHumanBodyLaneInterim.IInput,
  ): IAutoMovieHumanBodyLane.IInput {
    const diagnostics: IAutoMovieLoftContract.IDiagnostic[] = [];
    const measures: IAutoMovieHumanBodyMeasures =
      AutoMovieHumanBodyAnatomy.resolve(input.params);
    const solution: IAutoMovieHumanTrunkSolution = input.solution;
    const radius: number = AutoMovieHumanTrunkInterim.foldRadius(solution);

    // The same input-derived frame places head/S00 and the remaining legacy
    // trunk. A skeletal ankle offset must not be added to its skin priors again.
    const placed: IAutoMovieHumanBodyFrame.IOutput = input.frame;
    const pending: (
      upper: IAutoMovieHumanTrunkViewLaws.ILaws["upper"],
    ) => IAutoMovieHumanTrunkLaws.IPending = (
      upper: IAutoMovieHumanTrunkViewLaws.ILaws["upper"],
    ): IAutoMovieHumanTrunkLaws.IPending => ({
      chest: solution.landmarks.bustPoint[1],
      cervicale: placed.cervicale,
      perineum: placed.perineum,
      upper,
    });
    const laws: IAutoMovieHumanTrunkViewLaws.ILaws = AutoMovieHumanTrunkLaws.of(
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

    const side: (name: "left" | "right") => IAutoMovieHumanBodyLane.ISide = (
      name: "left" | "right",
    ): IAutoMovieHumanBodyLane.ISide => {
      const fold: (
        from: number,
        to: number,
      ) => IAutoMovieHumanBodyLane.IFold = (
        from: number,
        to: number,
      ): IAutoMovieHumanBodyLane.IFold => ({
        search: { phi: 0, from, to },
        radius,
      });
      return {
        get leg(): IAutoMovieHumanBodyLane.ISide["leg"] {
          const own: ReturnType<IAutoMovieHumanLimbSources.IOutput["leg"]> =
            input.sources.leg(name);
          return {
            bones: own.bones,
            law: own.law,
            get definition(): IAutoMovieHumanLegWalk.IDefinition {
              return own.leg.current();
            },
            bind: own.leg.bind,
            trunk: fold(0, 0.5),
            foot: fold(1, 0.85),
          };
        },
        get arm(): IAutoMovieHumanBodyLane.ISide["arm"] {
          return { ...input.sources.arm(name).arm(), trunk: fold(0, 0.4) };
        },
        get foot(): IAutoMovieHumanBodyLane.ISide["foot"] {
          return input.sources.leg(name).foot();
        },
        get footDefinition(): IAutoMovieHumanSourceDefinition {
          return input.sources.leg(name).definition();
        },
        get fingers(): IAutoMovieHumanBodyLane.IDigit[] {
          return input.sources.arm(name).fingers();
        },
        digitNames: AutoMovieHumanLimbSources.names().filter(
          (key: string): boolean =>
            key === "thumb." + name || key.startsWith("finger." + name + "."),
        ),
        digit(key: string): IAutoMovieHumanBodyLane.IDigit | undefined {
          return input.sources.arm(name).digit(key);
        },
        get toes(): IAutoMovieHumanBodyLane.IToe[] {
          return input.sources.leg(name).toes();
        },
        toeNames: AutoMovieHumanFootInterim.names(name),
      };
    };

    const sides: Record<"left" | "right", IAutoMovieHumanBodyLane.ISide> = {
      left: side("left"),
      right: side("right"),
    };
    return {
      diagnostics,
      trunk: {
        get legs(): NonNullable<
          IAutoMovieHumanBodyLane.IInput["trunk"]["legs"]
        > {
          return {
            left: sides.left.leg.definition,
            right: sides.right.leg.definition,
          };
        },
        bindLeg(
          side: "left" | "right",
          parent: IAutoMovieHumanSourceDefinition,
          station: number,
        ): IAutoMovieHumanLegWalk.IDefinition {
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
