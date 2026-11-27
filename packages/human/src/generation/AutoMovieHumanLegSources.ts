import type {
  IAutoMovieHumanBodyLane,
  IAutoMovieHumanBodyMeasures,
  IAutoMovieHumanFootInterim,
  IAutoMovieHumanFootSource,
  IAutoMovieHumanFootToeSources,
  IAutoMovieHumanLegSourceFamily,
  IAutoMovieHumanLegSources,
  IAutoMovieHumanLegWalk,
  IAutoMovieHumanLimbRest,
  IAutoMovieHumanSiteControls,
  IAutoMovieHumanSourceDefinition,
  IAutoMovieLoftContract,
} from "@automovie/interface";

import { AutoMovieHumanLegSites } from "./AutoMovieHumanLegSites";
import { AutoMovieHumanTrunkRows } from "./AutoMovieHumanTrunkRows";
import { AutoMovieHumanFootInterim } from "./AutoMovieHumanFootInterim";
import { AutoMovieHumanToePart } from "./AutoMovieHumanToePart";
import { AutoMovieHumanSiteViewPart } from "./AutoMovieHumanSiteViewPart";
import { AutoMovieHumanLegLaws } from "./AutoMovieHumanLegLaws";
import { AutoMovieHumanLegSourceFamily } from "./AutoMovieHumanLegSourceFamily";

/** Local leg, foot and toe original factories, before trunk or whole-skeleton assembly. */
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

    const foot: () => IAutoMovieHumanFootInterim.IPrepared = lazy(
      (): IAutoMovieHumanFootInterim.IPrepared => {
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
        return prepared;
      },
      (): IAutoMovieHumanFootSource.IRegion | undefined =>
        legSource.ankle().source.region,
    );

    const toes: () => IAutoMovieHumanBodyLane.IToe[] = lazy(
      (): IAutoMovieHumanBodyLane.IToe[] =>
        foot().toes.map(
          (
            source: IAutoMovieHumanFootToeSources.ICandidate,
          ): IAutoMovieHumanBodyLane.IToe => ({
            toe: source.part,
            definition: AutoMovieHumanToePart.define(source.part),
            fold: {
              search: { phi: 0, from: 0, to: 0.5 },
              radius: source.part.law("base").breadth / 2,
            },
          }),
        ),
      (): IAutoMovieHumanSiteControls.IOutput => foot().controls,
    );

    return {
      leg: legSource,
      bones: { hip, knee, ankle },
      law: legLaw,
      foot: (): IAutoMovieHumanBodyLane.ISide["foot"] => foot().foot,
      definition: (): IAutoMovieHumanSourceDefinition => foot().definition(),
      toes,
    };
  }
}

/** Existing bounded source memoization; no original curve is reconstructed. */
const { lazy }: Pick<typeof AutoMovieHumanSiteViewPart, "lazy"> =
  AutoMovieHumanSiteViewPart;
