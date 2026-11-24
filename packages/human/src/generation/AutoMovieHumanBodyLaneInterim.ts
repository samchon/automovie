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
 * Assemble the person's trunk laws and independently prepared limb sources. The
 * trunk solve supplies the common shoulder, chest and neck landmarks. The torso
 * and its masses read the person's tapes and posture. Each limb source and its
 * bind consume the same local rest definition.
 */
export namespace AutoMovieHumanBodyLaneInterim {
  /**
   * The lane's input.
   *
   * @param input The person, the common trunk landmarks and the limb sources.
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
    const pending: IAutoMovieHumanTrunkLaws.IPending = {
      chest: solution.landmarks.bustPoint[1],
      cervicale: placed.cervicale,
      perineum: placed.perineum,
      upper: [],
    };
    const breastSetback: number = AutoMovieHumanMassInterim.breastAmplitude(
      measures,
      input.scale,
    );
    const glutealSetback: number = AutoMovieHumanMassInterim.glutealAmplitude(
      measures,
      input.scale,
    );
    const outline: IAutoMovieHumanTrunkViewLaws.ILaws =
      AutoMovieHumanTrunkLaws.of(measures, input.scale, input.crotch, pending);
    const laws: IAutoMovieHumanTrunkViewLaws.ILaws = {
      ...outline,
      upper: AutoMovieHumanTrunkInterim.upperSites(
        solution,
        measures,
        input.scale,
        outline.back,
        breastSetback,
      ),
    };
    const breast: IAutoMovieHumanBodyLane.IInput["trunk"]["breast"] =
      AutoMovieHumanMassInterim.breast(
        measures,
        input.scale,
        laws,
        radius,
        input.crotch,
        breastSetback,
      );
    const gluteal: IAutoMovieHumanBodyLane.IInput["trunk"]["gluteal"] =
      AutoMovieHumanMassInterim.gluteal(
        solution.landmarks,
        measures,
        input.scale,
        laws,
        radius,
        glutealSetback,
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
            breast: breast === null ? 0 : breastSetback,
            gluteal: gluteal === null ? 0 : glutealSetback,
          },
          input.neckConnection,
        ),
        tapes: {
          chest: measures.chestCircumference * input.scale,
          hip: measures.hipCircumference * input.scale,
        },
        breast,
        gluteal,
      },
      sides,
      gap: AutoMovieHumanTrunkRows.MAX_GAP,
    };
  }
}
