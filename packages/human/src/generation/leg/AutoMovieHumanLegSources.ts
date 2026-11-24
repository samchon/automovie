import type {
  IAutoMovieHumanBodyLane,
  IAutoMovieHumanBodyMeasures,
  IAutoMovieHumanFootInterim,
  IAutoMovieHumanFootToeSources,
  IAutoMovieHumanLegSourceFamily,
  IAutoMovieHumanLegSources,
  IAutoMovieHumanLegWalk,
  IAutoMovieHumanLimbRest,
  IAutoMovieHumanSourceDefinition,
  IAutoMovieLoftContract,
} from "@automovie/interface";

import { AutoMovieHumanLegSites } from "../AutoMovieHumanLegSites";
import { AutoMovieHumanTrunkRows } from "../AutoMovieHumanTrunkRows";
import { AutoMovieHumanFootInterim } from "../foot/AutoMovieHumanFootInterim";
import { AutoMovieHumanToePart } from "../foot/AutoMovieHumanToePart";
import { AutoMovieHumanLegLaws } from "./AutoMovieHumanLegLaws";
import { AutoMovieHumanLegSourceFamily } from "./AutoMovieHumanLegSourceFamily";

/**
 * Local leg, foot and toe original factories, before trunk or whole-skeleton
 * assembly.
 */
export namespace AutoMovieHumanLegSources {
  /** Prepare this side without an arm, head, trunk source or complete skeleton. */
  export function create(
    input: IAutoMovieHumanLegSources.IInput,
  ): IAutoMovieHumanLegSources.IOutput {
    const side: IAutoMovieHumanLegSources.IInput["side"] = input.side;
    const measures: IAutoMovieHumanBodyMeasures = input.measures;
    const diagnostics: IAutoMovieLoftContract.IDiagnostic[] = input.diagnostics;
    const { hip, knee, ankle }: IAutoMovieHumanLimbRest.ILeg = input.rest;
    const legLaw: IAutoMovieHumanLegWalk.ILaw = AutoMovieHumanLegLaws.of(
      measures,
      input.scale,
      knee[1],
      ankle[1],
      AutoMovieHumanLegSites.ankle(ankle[1]),
      input.crotch,
      side,
    );
    const legSource: IAutoMovieHumanLegSourceFamily.IOutput =
      AutoMovieHumanLegSourceFamily.create({
        name: `leg.${side}`,
        bones: { hip, knee, ankle },
        law: legLaw,
        gap: AutoMovieHumanTrunkRows.MAX_GAP,
        complete: input.completeLeg,
      });

    /** Author one toe from the prepared whole foot support plan. */
    const toe = (
      source: IAutoMovieHumanFootToeSources.ICandidate,
    ): IAutoMovieHumanBodyLane.IToe => ({
      toe: source.part,
      definition: AutoMovieHumanToePart.define(source.part),
      fold: {
        search: { phi: 0, from: 0, to: 0.5 },
        radius: source.part.law("base").breadth / 2,
      },
    });

    const prepareFoot: IAutoMovieHumanLegSources.IOutput["prepareFoot"] =
      () => {
        const prepared: IAutoMovieHumanFootInterim.IPrepared =
          AutoMovieHumanFootInterim.prepare(
            side,
            input.feet[side],
            ankle,
            legSource.ankle(),
            measures,
            input.scale,
          );
        diagnostics.push(...prepared.diagnostics);
        return {
          foot: () => prepared.foot,
          definition: prepared.definition,
          toe(name: string): IAutoMovieHumanBodyLane.IToe | undefined {
            const candidate:
              | IAutoMovieHumanFootToeSources.ICandidate
              | undefined = prepared.toes.find(
              (source): boolean => source.part.name === name,
            );
            return candidate === undefined ? undefined : toe(candidate);
          },
          toes: (): IAutoMovieHumanBodyLane.IToe[] => prepared.toes.map(toe),
        };
      };

    return {
      leg: legSource,
      bones: { hip, knee, ankle },
      law: legLaw,
      prepareFoot,
      foot: (): IAutoMovieHumanBodyLane.ISide["foot"] => prepareFoot().foot(),
      definition: (): IAutoMovieHumanSourceDefinition =>
        prepareFoot().definition(),
      toe: (name: string): IAutoMovieHumanBodyLane.IToe | undefined =>
        AutoMovieHumanFootInterim.names(side).includes(name)
          ? prepareFoot().toe(name)
          : undefined,
      toes: (): IAutoMovieHumanBodyLane.IToe[] => prepareFoot().toes(),
    };
  }
}
