import { AutoMovieViewSection } from "@automovie/engine";
import type {
  IAutoMovieHumanTrunkSectionFamily,
  IAutoMovieHumanTrunkViews,
  IAutoMovieViewSection,
} from "@automovie/interface";

/**
 * Common world-Y section definitions, authored before the trunk and its
 * differently oriented attached originals.
 */
export namespace AutoMovieHumanTrunkSectionFamily {
  /**
   * Prepare the independent tape results shared by the two passes and their
   * trials.
   */
  export function prepare(
    views: IAutoMovieHumanTrunkViews,
  ): ReadonlyMap<string, IAutoMovieHumanTrunkSectionFamily.IPlane> {
    return new Map(
      [...define(views)].map(([site, plane]) => {
        if (!("girth" in plane.fullness)) return [site, plane];
        const result: IAutoMovieHumanTrunkSectionFamily.IFullness =
          plane.resolve();
        return [site, { ...plane, resolve: () => result }];
      }),
    );
  }

  /** Retain each original site and any exactly matching supplied preparation. */
  export function define(
    views: IAutoMovieHumanTrunkViews,
    previous?: ReadonlyMap<string, IAutoMovieHumanTrunkSectionFamily.IPlane>,
  ): ReadonlyMap<string, IAutoMovieHumanTrunkSectionFamily.IPlane> {
    const planes: Map<string, IAutoMovieHumanTrunkSectionFamily.IPlane> =
      new Map();
    for (const site of views.sites) {
      if (planes.has(site.site))
        throw new Error(
          `Trunk section family repeats the named plane ${site.site}`,
        );
      planes.set(site.site, at(site, previous?.get(site.site)));
    }
    return planes;
  }

  /**
   * A moved plane keeps its new frame; only identical local box/fullness data
   * may share a scalar solve or its original failure.
   */
  export function at(
    site: IAutoMovieHumanTrunkViews.ISite,
    previous?: IAutoMovieHumanTrunkSectionFamily.IPlane,
  ): IAutoMovieHumanTrunkSectionFamily.IPlane {
    const depth: number = (site.front - site.back) / 2;
    const box: IAutoMovieViewSection.IBox =
      site.sectionBox === undefined
        ? {
            extents: [depth, site.half, depth, site.half],
          }
        : { extents: [...site.sectionBox.extents] };
    const matched: IAutoMovieHumanTrunkSectionFamily.IPlane | undefined =
      previous !== undefined &&
      previous.site === site.site &&
      box.extents.every(
        (value: number, index: number): boolean =>
          value === previous.box.extents[index],
      )
        ? previous
        : undefined;
    const equivalent: boolean =
      matched !== undefined &&
      ("shoulder" in site.fullness
        ? "shoulder" in matched.fullness &&
          site.fullness.shoulder === matched.fullness.shoulder
        : "girth" in matched.fullness &&
          site.fullness.girth === matched.fullness.girth);
    return {
      site: site.site,
      y: site.y,
      origin: [
        site.sectionBox === undefined
          ? (site.front + site.back) / 2
          : site.back + box.extents[2],
        0,
      ],
      back: site.back,
      box,
      fullness: site.fullness,
      range: matched?.range ?? (() => AutoMovieViewSection.range(box)),
      resolve(): IAutoMovieHumanTrunkSectionFamily.IFullness {
        if (matched !== undefined && equivalent) return matched.resolve();
        if ("shoulder" in site.fullness)
          return { fullness: site.fullness, diagnostics: [] };
        const solved: IAutoMovieViewSection.ISolved =
          AutoMovieViewSection.solve(
            `view.trunk ${site.site}`,
            box,
            site.fullness.girth,
          );
        return {
          fullness:
            solved.section === null
              ? null
              : { shoulder: solved.section.shoulders[0] },
          diagnostics: [
            ...solved.diagnostics,
            ...(solved.section === null
              ? [
                  {
                    producer: "view.trunk",
                    level: 2 as const,
                    contract: "fullness",
                    detail: `site ${site.site}: no section fits the tape ${site.fullness.girth} mm`,
                  },
                ]
              : []),
          ],
        };
      },
      section(shoulder: number): IAutoMovieViewSection.ISection {
        return AutoMovieViewSection.bare(box, [
          shoulder,
          shoulder,
          shoulder,
          shoulder,
        ]);
      },
    };
  }
}
