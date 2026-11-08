import type { AutoMovieLoftContract } from "@automovie/engine";

import type { AutoMovieHumanBodyLane } from "../AutoMovieHumanBodyLane";
import type { AutoMovieHumanFootConstruction } from "../AutoMovieHumanFootConstruction";
import { AutoMovieHumanLegSites } from "../AutoMovieHumanLegSites";
import type { AutoMovieHumanLimbRest } from "../AutoMovieHumanLimbRest";
import { AutoMovieHumanTrunkRows } from "../AutoMovieHumanTrunkRows";
import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import { AutoMovieHumanFootInterim } from "../foot/AutoMovieHumanFootInterim";
import type { AutoMovieHumanFootSource } from "../foot/AutoMovieHumanFootSource";
import { AutoMovieHumanToePart } from "../foot/AutoMovieHumanToePart";
import type { AutoMovieHumanSiteControls } from "../limb/AutoMovieHumanSiteControls";
import { AutoMovieHumanSiteViewPart } from "../limb/AutoMovieHumanSiteViewPart";
import { AutoMovieHumanLegLaws } from "./AutoMovieHumanLegLaws";
import { AutoMovieHumanLegSourceFamily } from "./AutoMovieHumanLegSourceFamily";
import type { AutoMovieHumanLegWalk } from "./AutoMovieHumanLegWalk";

/** Local leg, foot and toe original factories, before trunk or whole-skeleton assembly. */
export namespace AutoMovieHumanLegSources {
  /** Public inputs and their directly generated rest/attachment datum. */
  export interface IInput {
    /** Canonical source side. */
    side: "left" | "right";

    /** Actual rest joints and local foot centres, before any skin. */
    rest: AutoMovieHumanLimbRest.ILeg;

    /** Sided public foot dimensions. */
    feet: AutoMovieHumanFootConstruction.IInputs;

    /** Same resolved public body measures. */
    measures: IAutoMovieHumanBodyMeasures;

    /** Calibration millimetres per world millimetre. */
    scale: number;

    /** Original crotch station in calibration mm. */
    crotch: number;

    /** Actual shared diagnostic sink. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];

    /** Explicit full-parent demand; ordinary ankle/foot/original reads do not call it. */
    completeLeg?: () => void;
  }

  /** Prejoin originals and the honest explicit coupled-parent seam. */
  export interface IOutput {
    /** The same call-owned leg family used by production's eventual bind. */
    leg: AutoMovieHumanLegSourceFamily.IOutput;

    /** Actual shared rest joints used by the same original source. */
    bones: Pick<AutoMovieHumanLimbRest.ILeg, "hip" | "knee" | "ankle">;

    /** Original leg law. */
    law: AutoMovieHumanLegWalk.ILaw;

    /** Explicit foot input request, using only its actual distal authority. */
    foot(): AutoMovieHumanBodyLane.ISide["foot"];

    /** Same foot original consumed by its explicit loft. */
    definition(): AutoMovieHumanSiteViewPart.IDefinition;

    /** Explicit toe originals from the same foot controls. */
    toes(): AutoMovieHumanBodyLane.IToe[];
  }

  /** Prepare this side without an arm, head, trunk source or complete skeleton. */
  export function create(input: IInput): IOutput {
    const side: IInput["side"] = input.side;
    const measures: IAutoMovieHumanBodyMeasures = input.measures;
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = input.diagnostics;
    const { hip, knee, ankle }: AutoMovieHumanLimbRest.ILeg = input.rest;
    const legLaw: AutoMovieHumanLegWalk.ILaw = AutoMovieHumanLegLaws.of(
      measures,
      input.scale,
      knee[1],
      ankle[1],
      AutoMovieHumanLegSites.ankle(ankle[1]),
      input.crotch,
      side,
    );
    const legSource: AutoMovieHumanLegSourceFamily.IOutput =
      AutoMovieHumanLegSourceFamily.create({
        name: `leg.${side}`,
        bones: { hip, knee, ankle },
        law: legLaw,
        gap: AutoMovieHumanTrunkRows.MAX_GAP,
        complete: input.completeLeg,
      });

    const foot: () => AutoMovieHumanFootInterim.IPrepared = lazy(
      (): AutoMovieHumanFootInterim.IPrepared => {
        const prepared: AutoMovieHumanFootInterim.IPrepared =
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
      (): AutoMovieHumanFootSource.IRegion | undefined =>
        legSource.ankle().source.region,
    );

    const toes: () => AutoMovieHumanBodyLane.IToe[] = lazy(
      (): AutoMovieHumanBodyLane.IToe[] =>
        foot().toes.map(
          (
            source: AutoMovieHumanFootInterim.IToe,
          ): AutoMovieHumanBodyLane.IToe => ({
            toe: source.part,
            definition: AutoMovieHumanToePart.define(source.part),
            fold: {
              search: { phi: 0, from: 0, to: 0.5 },
              radius: source.part.law("base").breadth / 2,
            },
          }),
        ),
      (): AutoMovieHumanSiteControls.IOutput => foot().controls,
    );

    return {
      leg: legSource,
      bones: { hip, knee, ankle },
      law: legLaw,
      foot: (): AutoMovieHumanBodyLane.ISide["foot"] => foot().foot,
      definition: (): AutoMovieHumanSiteViewPart.IDefinition =>
        foot().definition(),
      toes,
    };
  }
}

/** Existing bounded source memoization; no original curve is reconstructed. */
const { lazy }: Pick<typeof AutoMovieHumanSiteViewPart, "lazy"> =
  AutoMovieHumanSiteViewPart;
