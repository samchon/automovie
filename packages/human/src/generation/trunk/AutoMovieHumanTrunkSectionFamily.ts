import {
  type AutoMovieLoftContract,
  AutoMovieViewSection,
} from "@automovie/engine";

import type { IAutoMovieHumanTrunkViews } from "./IAutoMovieHumanTrunkViews";

/** Common world-Y section definitions, authored before the trunk and its differently oriented attached originals. */
export namespace AutoMovieHumanTrunkSectionFamily {
  /** The actual independent scalar constraint result, including its unchanged admission failures. */
  export interface IFullness {
    /** Null preserves a failed original section rather than selecting another shoulder. */
    fullness: { shoulder: number } | null;
    /** Original section-solve diagnostics, with the same source/site producer. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];
  }

  /** One named measurement plane and its caller-owned four-support source. */
  export interface IPlane {
    /** Original anatomical site name, independent of output sampling. */
    site: string;
    /** World-Y station in calibration millimetres. */
    y: number;
    /** Section origin in world X/Z, calibration millimetres. */
    origin: [number, number];
    /** Independent original posterior profile value, retained without subtractive reconstruction. */
    back: number;
    /** The same original support box consumed by the trunk's view construction. */
    box: AutoMovieViewSection.IBox;
    /** Original independent fullness input; a changed tape requires a new family. */
    fullness: IAutoMovieHumanTrunkViews.ISite["fullness"];
    /** Solve this unchanged box/tape once at its first original-source demand. */
    resolve(): IFullness;
    /** Evaluate that original plane's conic family at the actual candidate shoulder. */
    section(shoulder: number): AutoMovieViewSection.ISection;
    /** Admit this exact support box's native shoulder reach once, including a null refusal. */
    range(): AutoMovieViewSection.IRange | null;
  }

  /** Retain each original site, sharing only an exactly equal native box/fullness input from this caller's previous trial. */
  export function define(
    views: IAutoMovieHumanTrunkViews,
    previous?: ReadonlyMap<string, IPlane>,
  ): ReadonlyMap<string, IPlane> {
    const planes: Map<string, IPlane> = new Map();
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
    previous?: IPlane,
  ): IPlane {
    const depth: number = (site.front - site.back) / 2;
    const box: AutoMovieViewSection.IBox = site.sectionBox === undefined ? {
      extents: [depth, site.half, depth, site.half],
    } : { extents: [...site.sectionBox.extents] };
    const sameBox: boolean =
      previous !== undefined &&
      previous.site === site.site &&
      box.extents.every(
        (value: number, index: number): boolean =>
          value === previous.box.extents[index],
      );
    const equivalent: boolean = sameBox && previous !== undefined &&
      ("shoulder" in site.fullness
        ? "shoulder" in previous.fullness &&
          site.fullness.shoulder === previous.fullness.shoulder
        : "girth" in previous.fullness &&
          site.fullness.girth === previous.fullness.girth);
    let prior: IPlane | undefined = equivalent ? previous : undefined;
    const priorRange: IPlane["range"] | undefined = sameBox ? previous?.range : undefined;
    let reach: AutoMovieViewSection.IRange | null | undefined;
    let resolved: IFullness | undefined;
    return {
      site: site.site,
      y: site.y,
      origin: [site.sectionBox === undefined ? (site.front + site.back) / 2 : site.back + box.extents[2], 0],
      back: site.back,
      box,
      fullness: site.fullness,
      range: priorRange ?? ((): AutoMovieViewSection.IRange | null => {
        if (reach === undefined)
          reach = AutoMovieViewSection.range(box);
        return reach;
      }),
      resolve(): IFullness {
        if (resolved !== undefined) return resolved;
        if (prior !== undefined) {
          resolved = prior.resolve();
          prior = undefined;
          return resolved;
        }
        if ("shoulder" in site.fullness)
          resolved = { fullness: site.fullness, diagnostics: [] };
        else {
          const solved: AutoMovieViewSection.ISolved =
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
      section(shoulder: number): AutoMovieViewSection.ISection {
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
