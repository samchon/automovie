import type {
  IAutoMovieHumanSourceDefinition,
  IAutoMovieHumanTrunkLegs,
  IAutoMovieHumanTrunkSectionFamily,
  IAutoMovieHumanTrunkTape,
  IAutoMovieHumanTrunkViews,
} from "@automovie/interface";

import { AutoMovieHumanGlutealParent } from "./AutoMovieHumanGlutealParent";
import { AutoMovieHumanTrunkTape } from "./AutoMovieHumanTrunkTape";
import { AutoMovieHumanTrunkViewPart } from "./AutoMovieHumanTrunkViewPart";

/** Couple the unmeasured proximal legs to each actual trial/final trunk original before reading their common-plane tape cuts. */
export namespace AutoMovieHumanTrunkLegs {
  /** Bind both legs to the actual parent object; the regional factory owns retention and the unchanged measured distal spans. */
  export function pair(
    input: IAutoMovieHumanTrunkLegs.IInput,
    parent: IAutoMovieHumanSourceDefinition,
  ): IAutoMovieHumanTrunkLegs.IInput["legs"] {
    if (input.bindLeg === undefined) return input.legs;
    const station: number | undefined = input.views.sites.find(
      (site: IAutoMovieHumanTrunkViews.ISite): boolean =>
        site.site === "buttock",
    )?.y;
    if (station === undefined)
      throw new Error(
        "Coupled proximal legs require the actual named buttock station",
      );
    return {
      left: input.bindLeg("left", parent, station),
      right: input.bindLeg("right", parent, station),
    };
  }

  /** One shoulder trial prepares its actual whole trunk source and the legs that consume it. No raw loft, public-width clamp or alternate hip section supplies the cuts. */
  export function trial(
    input: IAutoMovieHumanTrunkLegs.IInput,
    site: IAutoMovieHumanTrunkViews.ISite,
    shoulder: number,
    sections: ReadonlyMap<string, IAutoMovieHumanTrunkSectionFamily.IPlane>,
  ): NonNullable<IAutoMovieHumanTrunkTape.IInput["parents"]> {
    const parent: IAutoMovieHumanSourceDefinition =
      AutoMovieHumanTrunkViewPart.define(
        {
          ...input.views,
          sites: input.views.sites.map(
            (
              row: IAutoMovieHumanTrunkViews.ISite,
            ): IAutoMovieHumanTrunkViews.ISite =>
              row.site === site.site ? { ...row, fullness: { shoulder } } : row,
          ),
        },
        input.top,
        sections,
      );
    const legs: IAutoMovieHumanTrunkLegs.IInput["legs"] = pair(input, parent);
    return (["left", "right"] as const).map(
      (
        side: "left" | "right",
      ): NonNullable<IAutoMovieHumanTrunkTape.IInput["parents"]>[number] => {
        const leg: IAutoMovieHumanSourceDefinition | undefined = legs?.[side];
        return AutoMovieHumanTrunkTape.parent(
          leg?.part?.name ?? `leg.${side}`,
          leg?.part === undefined || leg.part === null
            ? `The coupled leg original is unavailable: ${JSON.stringify(leg?.diagnostics ?? [])}`
            : AutoMovieHumanGlutealParent.levelCutRecords(
                leg.part,
                site.y,
                AutoMovieHumanTrunkTape.PHASES,
              ),
        );
      },
    );
  }
}
