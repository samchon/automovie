import { AutoMovieViewSection } from "@automovie/engine";
import type {
  IAutoMovieHumanTrunkSectionFamily,
  IAutoMovieHumanTrunkViews,
  IAutoMovieViewSection,
} from "@automovie/interface";

/** Common world-Y section definitions, authored before the trunk and its differently oriented attached originals. */
export namespace AutoMovieHumanTrunkSectionFamily {
  /** Retain each original site, sharing only an exactly equal native box/fullness input from this caller's previous trial. */
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

  /** A moved plane keeps its new frame; only identical local box/fullness data may share a scalar solve or its original failure. */
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
    const sameBox: boolean =
      previous !== undefined &&
      previous.site === site.site &&
      box.extents.every(
        (value: number, index: number): boolean =>
          value === previous.box.extents[index],
      );
    const equivalent: boolean =
      sameBox &&
      previous !== undefined &&
      ("shoulder" in site.fullness
        ? "shoulder" in previous.fullness &&
          site.fullness.shoulder === previous.fullness.shoulder
        : "girth" in previous.fullness &&
          site.fullness.girth === previous.fullness.girth);
    let prior: IAutoMovieHumanTrunkSectionFamily.IPlane | undefined = equivalent
      ? previous
      : undefined;
    const priorRange:
      | IAutoMovieHumanTrunkSectionFamily.IPlane["range"]
      | undefined = sameBox ? previous?.range : undefined;
    let reach: IAutoMovieViewSection.IRange | null | undefined;
    let resolved: IAutoMovieHumanTrunkSectionFamily.IFullness | undefined;
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
      range:
        priorRange ??
        ((): IAutoMovieViewSection.IRange | null => {
          if (reach === undefined) reach = AutoMovieViewSection.range(box);
          return reach;
        }),
      resolve(): IAutoMovieHumanTrunkSectionFamily.IFullness {
        if (resolved !== undefined) return resolved;
        if (prior !== undefined) {
          resolved = prior.resolve();
          prior = undefined;
          return resolved;
        }
        if ("shoulder" in site.fullness)
          resolved = { fullness: site.fullness, diagnostics: [] };
        else {
          const solved: IAutoMovieViewSection.ISolved =
            AutoMovieViewSection.solve(
              `view.trunk ${site.site}`,
              box,
              site.fullness.girth,
            );
          resolved = {
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
        }
        return resolved;
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
