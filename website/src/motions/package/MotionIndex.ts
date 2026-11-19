import { BakedManifest } from "../../baked/BakedManifest";
import type { IBakedManifest } from "../../baked/IBakedManifest";
import { PlaygroundAddress } from "../../playground/PlaygroundAddress";
import { SCENES } from "../../scenes/SCENES";
import type { IScene } from "../../scenes/structures/IScene";
import { MOTION_CATEGORIES, type IMotionCategory } from "../MOTION_CATEGORIES";
import { MotionUsage } from "../MotionUsage";
import type { IMotionReference } from "../structures/IMotionReference";
import { MotionReference } from "./MotionReference";

/**
 * The motion catalogue and each motion's page, read while the site is
 * exported: the installed vocabulary arranged by `MOTION_CATEGORIES`, each
 * motion with the still a card shows, and each motion's parameters, uses
 * and the take its page plays.
 */
export namespace MotionIndex {
  /** The catalogue. */
  export interface IIndex {
    /** The categories, in order, each with its families. */
    categories: ICategory[];

    /** How many motions there are. */
    total: number;
  }

  /** One category of the catalogue. */
  export interface ICategory {
    id: string;
    title: string;
    summary: string;
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

    /** The still a card shows: the motion's own, a scene's that performs it, or none. */
    poster: { kind: "motion" | "scene"; id: string } | null;

    /** Its parameters, and how many of them are required. */
    parameters: number;
    required: number;
  }

  /** One motion's page. */
  export interface IDetail {
    name: string;
    family: { name: string; label: string };
    category: { id: string; title: string };
    parameters: IMotionReference.IParameter[] | null;

    /** The scenes that compose it. */
    uses: { id: string; title: string }[];

    /** What its page plays: the motion alone or the first scene that performs it, with whether it was baked; null when nothing would play. */
    play: { record: IScene; baked: "motion" | "scene" | null; label: string } | null;

    /** The playground's address of its trial; null when none would play. */
    playground: string | null;

    /** The motions before and after it in its family. */
    previous: string | null;
    next: string | null;
  }

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
                extra.map((name: string): [string, string] => [name, spell(name)]),
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
                detailOf(row, { name, label }, category, manifest, rows[i - 1]?.name ?? null, rows[i + 1]?.name ?? null),
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
                  parameters: row.parameters?.length ?? 0,
                  required: (row.parameters ?? []).filter(
                    (p: IMotionReference.IParameter): boolean => p.required,
                  ).length,
                };
              }),
            };
          }),
      }),
    );
    cached = { index: { categories: out, total: details.size }, details };
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
    const trial: MotionUsage.ITrial | null = MotionUsage.trial(row.name, row.parameters);
    let play: IDetail["play"] = null;

    // A trial alone that was baked plays alone; one the bake refused, or a
    // trial in a scene, plays the first scene that performs it.
    if (trial !== null && trial.alone && manifest.motions[row.name] !== undefined)
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
        play = { record: scene, baked: "scene", label: `Performed in ${scene.title}` };
    }
    return {
      name: row.name,
      family,
      category: { id: category.id, title: category.title },
      parameters: row.parameters,
      uses: uses.scenes,
      play,
      playground:
        trial === null
          ? null
          : `/playground/${PlaygroundAddress.encode({
              ...trial.composition,
              version: PlaygroundAddress.VERSION,
            })}`,
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
