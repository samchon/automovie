import type { AutoMovieHumanSiteViewPart as Site } from "../limb/AutoMovieHumanSiteViewPart";
import { AutoMovieHumanGlutealParent } from "./AutoMovieHumanGlutealParent";
import type { AutoMovieHumanTrunkSectionFamily } from "./AutoMovieHumanTrunkSectionFamily";
import { AutoMovieHumanTrunkTape } from "./AutoMovieHumanTrunkTape";
import { AutoMovieHumanTrunkViewPart } from "./AutoMovieHumanTrunkViewPart";
import type { IAutoMovieHumanTrunkViews } from "./IAutoMovieHumanTrunkViews";

/** Couple the unmeasured proximal legs to each actual trial/final trunk original before reading their common-plane tape cuts. */
export namespace AutoMovieHumanTrunkLegs {
  /** Actual source preparation and its call-owned regional leg factory. */
  export interface IInput {
    /** Same complete trunk views used by production. */
    views: IAutoMovieHumanTrunkViews;
    /** Same optional source-owned upper closure. */
    top?: AutoMovieHumanTrunkViewPart.ITop;
    /** Retained standalone legs when no coupled factory was supplied. */
    legs?: Record<"left" | "right", Site.IDefinition>;
    /** Author and retain the regional leg against this identical parent and its named hip station. */
    bindLeg?(
      side: "left" | "right",
      parent: Site.IDefinition,
      station: number,
    ): Site.IDefinition;
  }

  /** Bind both legs to the actual parent object; the regional factory owns retention and the unchanged measured distal spans. */
  export function pair(
    input: IInput,
    parent: Site.IDefinition,
  ): IInput["legs"] {
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
    input: IInput,
    site: IAutoMovieHumanTrunkViews.ISite,
    shoulder: number,
    sections: ReadonlyMap<string, AutoMovieHumanTrunkSectionFamily.IPlane>,
  ): NonNullable<AutoMovieHumanTrunkTape.IInput["parents"]> {
    const parent: Site.IDefinition = AutoMovieHumanTrunkViewPart.define(
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
    const legs: IInput["legs"] = pair(input, parent);
    return (["left", "right"] as const).map(
      (
        side: "left" | "right",
      ): NonNullable<AutoMovieHumanTrunkTape.IInput["parents"]>[number] => {
        const leg: Site.IDefinition | undefined = legs?.[side];
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
