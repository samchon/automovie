import { AutoMovieViewSection } from "@automovie/engine";

import { AutoMovieHumanBodyPlaces } from "../AutoMovieHumanBodyPlaces";
import { AutoMovieHumanTrunkLandmarks } from "../AutoMovieHumanTrunkLandmarks";
import type { AutoMovieHumanTorsoPlan } from "./AutoMovieHumanTorsoPlan";
import { AutoMovieHumanTrunkLaws } from "./AutoMovieHumanTrunkLaws";
import { AutoMovieHumanTrunkViews } from "./AutoMovieHumanTrunkViews";
import type { IAutoMovieHumanTrunkViews } from "./IAutoMovieHumanTrunkViews";

/** Common skin-wall authoring at adjacent thoracic planes, independently of a completed loft. */
export namespace AutoMovieHumanTorsoThorax {
  /** One input's invariant thoracic aspect and laws, retained only through its candidate/closure call. */
  export interface IFamily {
    /** Author the changed physical height without measurement inversion or another part's construction. */
    at(chest: number): AutoMovieHumanTorsoPlan.IOutput;
  }

  /**
   * Reauthor the same wall and mammary controls at an actual chest/course height.
   *
   * Chest skin calipers, including their unchanged supplied/default provenance,
   * and the retained wall setback define the one bare-wall aspect prior.
   * The underbust tape scales that same aspect rather than importing a second
   * compressed-skeleton ratio. It imposes no order on adjacent widths. Chest
   * fullness is subsequently constrained by the whole composed source tape.
   */
  export function at(
    plan: AutoMovieHumanTorsoPlan.IOutput,
    chest: number,
    shoulder: number = AutoMovieViewSection.ELLIPSE,
  ): AutoMovieHumanTorsoPlan.IOutput {
    return withShoulder(prepare(plan).at(chest), shoulder);
  }

  /** Prepare the unchanged aspect, perimeter, upper controls and back/lumbar laws once before height and shoulder trials. */
  export function prepare(plan: AutoMovieHumanTorsoPlan.IOutput): IFamily {
    const scale: number = plan.scale;
    const measures: typeof plan.measures = plan.measures;
    const oldChest: IAutoMovieHumanTrunkViews.ISite | undefined =
      plan.wall.sites.find(
        (site: IAutoMovieHumanTrunkViews.ISite): boolean =>
          site.site === "chest",
      );
    if (oldChest === undefined)
      throw new Error(
        "The common thorax requires its original chest wall plane",
      );
    const setback: number =
      measures.chestDepth * scale - (oldChest.front - oldChest.back);
    const glutealSetback: number =
      measures.buttockDepth * scale -
      (plan.wall.sites[0]!.front - plan.wall.sites[0]!.back);
    const width: number = measures.chestBreadth * scale;
    const depth: number = measures.chestDepth * scale - setback;
    const chestBox: AutoMovieViewSection.IBox = {
      extents: [depth / 2, width / 2, depth / 2, width / 2],
    };
    const ellipse: number = AutoMovieViewSection.ELLIPSE;
    const perimeter: number = AutoMovieViewSection.of(
      { extents: [depth / 2, width / 2, depth / 2, width / 2] },
      [ellipse, ellipse, ellipse, ellipse],
    ).girth;
    if (!(Number.isFinite(perimeter) && perimeter > 0))
      throw new Error(
        "The common thorax skin aspect has no admitted ellipse perimeter",
      );
    const factor: number =
      (measures.underbustCircumference * scale) / perimeter;
    const upper: AutoMovieHumanTrunkViews.ILaws["upper"] = plan.wall.sites
      .filter((site: IAutoMovieHumanTrunkViews.ISite): boolean =>
        ["axilla", "acromion", "neck"].includes(site.site),
      )
      .map(
        (
          site: IAutoMovieHumanTrunkViews.ISite,
        ): AutoMovieHumanTrunkViews.ILaws["upper"][number] => {
          if (!("shoulder" in site.fullness))
            throw new Error("An upper thorax plane has no owned shoulder");
          return {
            site: site.site,
            y: site.y,
            half: site.half,
            front: site.front,
            back: site.back,
            shoulder: site.fullness.shoulder,
          };
        },
      );
    const foldDrop: number =
      AutoMovieHumanTrunkLandmarks.FOLD_DROP *
      (measures.cervicaleHeight * scale - plan.domain[0]);
    const originalLaws: AutoMovieHumanTrunkViews.ILaws =
      AutoMovieHumanTrunkLaws.of(measures, scale, plan.domain[0], {
        chest: oldChest.y,
        cervicale: AutoMovieHumanBodyPlaces.cervicale(measures) * scale,
        perineum: plan.wall.perineum.x,
        upper,
      });
    const lumbar: AutoMovieHumanTrunkViews.IBox = originalLaws.lumbar(
      measures.highHipCircumference * scale,
    );
    return {
      at(chest: number): AutoMovieHumanTorsoPlan.IOutput {
        if (
          !(
            chest - foldDrop > measures.waistHeight * scale &&
            chest < measures.axillaHeight * scale
          )
        )
          throw new Error(
            "Chest and underbust must occupy their actual open waist-to-axilla authoring interval",
          );
        const laws: AutoMovieHumanTrunkViews.ILaws = {
          ...originalLaws,
          chest,
          lumbar: (): AutoMovieHumanTrunkViews.IBox => lumbar,
          chestWall: (): AutoMovieHumanTrunkViews.IBox => ({
            breadth: width * factor,
            depth: depth * factor,
          }),
        };
        const authored: IAutoMovieHumanTrunkViews = AutoMovieHumanTrunkViews.of(
          measures,
          plan.domain[0],
          scale,
          laws,
          { breast: setback, gluteal: glutealSetback },
          plan.neck,
        );
        const wall: IAutoMovieHumanTrunkViews = { ...authored,
          sites: authored.sites.map((site: IAutoMovieHumanTrunkViews.ISite): IAutoMovieHumanTrunkViews.ISite =>
            site.site !== "chest" ? site : { ...site, sectionBox: chestBox,
              half: chestBox.extents[1], front: site.back + (chestBox.extents[0] + chestBox.extents[2]) }),
        };
        const site: IAutoMovieHumanTrunkViews.ISite = wall.sites.find(
          (entry: IAutoMovieHumanTrunkViews.ISite): boolean =>
            entry.site === "chest",
        )!;
        const regions: AutoMovieHumanTorsoPlan.IRegion[] = plan.regions.map(
          (
            region: AutoMovieHumanTorsoPlan.IRegion,
          ): AutoMovieHumanTorsoPlan.IRegion =>
            region.outward === -1
              ? region
              : {
                  ...region,
                  apex: [
                    laws.back(chest) + measures.chestDepth * scale,
                    chest,
                    region.apex[2],
                  ],
                  footprint: [
                    foldDrop,
                    site.half - Math.abs(region.apex[2]),
                    foldDrop,
                    Math.abs(region.apex[2]),
                  ],
                },
        );
        return { ...plan, wall, regions };
      },
    };
  }

  /** Only explicit chest fullness changes; height, frames and all independent tapes retain their original inputs. */
  export function withShoulder(
    plan: AutoMovieHumanTorsoPlan.IOutput,
    shoulder: number,
  ): AutoMovieHumanTorsoPlan.IOutput {
    return {
      ...plan,
      wall: {
        ...plan.wall,
        sites: plan.wall.sites.map(
          (site: IAutoMovieHumanTrunkViews.ISite): IAutoMovieHumanTrunkViews.ISite =>
            site.site === "chest"
              ? { ...site, fullness: { shoulder } }
              : site,
        ),
      },
    };
  }
}
