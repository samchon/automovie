import { BakedManifest } from "../../baked/BakedManifest";
import type { IBakedManifest } from "../../baked/IBakedManifest";
import { SCENES } from "../../scenes/SCENES";
import type { IScene } from "../../scenes/structures/IScene";
import type { IMotionCategory } from "../IMotionCategory";
import { MOTION_CATEGORIES } from "../MOTION_CATEGORIES";
import { MotionUsage } from "../MotionUsage";
import type { IMotionReference } from "../structures/IMotionReference";
import { MotionReference } from "./MotionReference";

/**
 * The motion catalogue and each motion's page, read while the site is exported:
 * the installed vocabulary arranged by `MOTION_CATEGORIES`, each motion with
 * the still a card shows, and each motion's parameters, uses and the take its
 * page plays.
 */
export namespace MotionIndex {
  /** The catalogue. */
  export interface IIndex {
    /** The categories, in order, each with its families. */
    categories: ICategory[];

    /** How many motions there are. */
    total: number;

    /**
     * Seconds a motion tried alone stands before it starts, which a card's loop
     * skips.
     */
    opening: number;
  }

  /** One category of the catalogue. */
  export interface ICategory {
    /** Its anchor on the catalogue page. */
    id: string;

    /** Its heading. */
    title: string;

    /** One sentence saying what it holds. */
    summary: string;

    /** Its families, in order. */
    families: IFamily[];
  }

  /** One family and its motions. */
  export interface IFamily {
    /** The lexicon's name, or `actions` for the core vocabulary. */
    name: string;

    /** The label its section shows. */
    label: string;

    /** Its motions, in the package's order. */
    motions: IEntry[];
  }

  /** One motion as a card shows it. */
  export interface IEntry {
    /** The name a chain appends it by. */
    name: string;

    /**
     * The still a card shows: the motion's own, a scene's that performs it, or
     * none.
     */
    poster: { kind: "motion" | "scene"; id: string } | null;
  }

  /** One motion's page. */
  export interface IDetail {
    /** The name a chain appends it by. */
    name: string;

    /** Its family's name and label. */
    family: { name: string; label: string };

    /** Its category's anchor and heading. */
    category: { id: string; title: string };

    /** The exported namespace a lexicon row is taken from; null for an action. */
    namespace: string | null;

    /**
     * Its entry in the API reference, a path under the site such as
     * `/api/classes/_automovie_motions.HumanChain.html#walk`.
     */
    api: string;

    /** The scenes that compose it. */
    uses: { id: string; title: string }[];

    /**
     * What its page plays: the motion alone or the first scene that performs
     * it, with whether it was baked; null when nothing would play.
     */
    play: {
      record: IScene;
      baked: "motion" | "scene" | null;
      label: string;
    } | null;

    /** The motion before it in its family; null for the first. */
    previous: string | null;

    /** The motion after it in its family; null for the last. */
    next: string | null;
  }

  /** The catalogue and the pages, read once per export. */
  let cached: { index: IIndex; details: Map<string, IDetail> } | null = null;

  /**
   * The catalogue.
   *
   * @returns The categories, families and motions.
   */
  export function index(): IIndex {
    return build().index;
  }

  /**
   * Every motion's name, for the pages to export.
   *
   * @returns The names.
   */
  export function names(): string[] {
    return [...build().details.keys()];
  }

  /**
   * The families whose name no motion has, for the pages that forward a
   * family's former address to its section of the catalogue.
   *
   * @returns The family names.
   */
  export function families(): string[] {
    const { index, details }: { index: IIndex; details: Map<string, IDetail> } =
      build();
    return index.categories
      .flatMap((c: ICategory): string[] =>
        c.families.map((f: IFamily): string => f.name),
      )
      .filter((name: string): boolean => !details.has(name));
  }

  /**
   * Whether a name is a motion's.
   *
   * @param name The name.
   * @returns Whether the vocabulary has a motion of that name.
   */
  export function has(name: string): boolean {
    return build().details.has(name);
  }

  /**
   * One motion's page.
   *
   * @param name The motion's name.
   * @returns Its page's data.
   * @throws {Error} When the vocabulary has no such motion.
   */
  export function detail(name: string): IDetail {
    const found: IDetail | undefined = build().details.get(name);
    if (found === undefined) throw new Error(`No motion is named ${name}`);
    return found;
  }

  /**
   * Arrange the installed vocabulary by the categories, once, with each
   * motion's page.
   */
  function build(): { index: IIndex; details: Map<string, IDetail> } {
    if (cached !== null) return cached;
    const reference: IMotionReference = MotionReference.read();
    const manifest: IBakedManifest = BakedManifest.read();
    const families: Map<string, IMotionReference.IRow[]> = new Map([
      ["actions", reference.actions],
      ...reference.families.map(
        (f: IMotionReference.IFamily): [string, IMotionReference.IRow[]] => [
          f.name,
          f.rows,
        ],
      ),
    ]);

    // Every family the table names, then any family it does not, under More.
    const named: Set<string> = new Set(
      MOTION_CATEGORIES.flatMap((c: IMotionCategory): string[] =>
        Object.keys(c.families),
      ),
    );
    const extra: string[] = [...families.keys()].filter(
      (name: string): boolean => !named.has(name),
    );
    const categories: IMotionCategory[] = [
      ...MOTION_CATEGORIES,
      ...(extra.length === 0
        ? []
        : [
            {
              id: "more",
              title: "More",
              summary: "Families this release adds.",
              families: Object.fromEntries(
                extra.map((name: string): [string, string] => [
                  name,
                  spell(name),
                ]),
              ),
            },
          ]),
    ];

    const seen: Set<string> = new Set<string>();
    const details: Map<string, IDetail> = new Map();
    const out: ICategory[] = categories.map(
      (category: IMotionCategory): ICategory => ({
        id: category.id,
        title: category.title,
        summary: category.summary,
        families: Object.entries(category.families)
          .filter(([name]): boolean => families.has(name))
          .map(([name, label]: [string, string]): IFamily => {
            const rows: IMotionReference.IRow[] = families
              .get(name)!
              .filter((row: IMotionReference.IRow): boolean => {
                if (seen.has(row.name)) return false;
                seen.add(row.name);
                return true;
              });
            rows.forEach((row: IMotionReference.IRow, i: number): void => {
              details.set(
                row.name,
                detailOf(
                  row,
                  { name, label },
                  category,
                  manifest,
                  rows[i - 1]?.name ?? null,
                  rows[i + 1]?.name ?? null,
                ),
              );
            });
            return {
              name,
              label,
              motions: rows.map((row: IMotionReference.IRow): IEntry => {
                const play: IDetail["play"] = details.get(row.name)!.play;
                return {
                  name: row.name,
                  poster:
                    play === null || play.baked === null
                      ? null
                      : { kind: play.baked, id: play.record.id },
                };
              }),
            };
          }),
      }),
    );
    cached = {
      index: {
        categories: out,
        total: details.size,
        opening: MotionUsage.OPENING,
      },
      details,
    };
    return cached;
  }

  /** One motion's page from its row, its family and what was baked. */
  function detailOf(
    row: IMotionReference.IRow,
    family: { name: string; label: string },
    category: IMotionCategory,
    manifest: IBakedManifest,
    previous: string | null,
    next: string | null,
  ): IDetail {
    const uses: MotionUsage.IUse = MotionUsage.of(row.name);
    const trial: MotionUsage.ITrial | null = MotionUsage.trial(row.name);
    let play: IDetail["play"] = null;

    // A trial alone that was baked plays alone; one the bake refused, or a
    // trial in a scene, plays the first scene that performs it.
    if (
      trial !== null &&
      trial.alone &&
      manifest.motions[row.name] !== undefined
    )
      play = {
        record: {
          id: row.name,
          title: row.name,
          summary: `${row.name}, performed alone.`,
          setting: "everyday",
          cast: [{ subject: "a", role: "performer" }],
          composition: trial.composition,
          takes: [{ label: "Alone" }],
          camera: { view: "three-quarter" },
          needs: [],
        },
        baked: "motion",
        label: "Performed alone after a half-second stand",
      };
    else {
      const scene: IScene | undefined = SCENES.find(
        (s: IScene): boolean =>
          manifest.scenes[s.id] !== undefined &&
          uses.scenes.some((u: { id: string }): boolean => u.id === s.id),
      );
      if (scene !== undefined)
        play = {
          record: scene,
          baked: "scene",
          label: `Performed in ${scene.title}`,
        };
    }
    return {
      name: row.name,
      family,
      category: { id: category.id, title: category.title },
      namespace: row.namespace,
      api:
        row.namespace === null
          ? family.name === "actions"
            ? `/api/classes/_automovie_motions.HumanChain.html#${row.name}`
            : "/api/variables/_automovie_motions.HUMAN_LEXICON.html"
          : `/api/variables/_automovie_motions.${row.namespace}.${row.name}.html`,
      uses: uses.scenes,
      play,
      previous,
      next,
    };
  }

  /** A family's name as words: `stageFight` is "Stage fight". */
  function spell(name: string): string {
    const words: string = name.replace(/([A-Z])/g, " $1").toLowerCase();
    return words[0]!.toUpperCase() + words.slice(1);
  }
}
