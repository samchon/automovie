// What every mode of the bake shares: the command line, the takes to bake
// with the digest of their inputs, and what an earlier bake left.
import type { HumanPerformance, HumanSegment } from "@automovie/motions";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type { IPlaygroundComposition } from "../src/playground/structures/IPlaygroundComposition";
import { SCENES } from "../src/scenes/SCENES";
import { SceneTake } from "../src/scenes/SceneTake";
import { SceneStatus } from "../src/scenes/package/SceneStatus";
import type { IScene } from "../src/scenes/structures/IScene";
import type { ISceneManifest } from "../src/scenes/structures/ISceneManifest";

/** The command line, the takes and their inputs, as every mode of the bake reads them. */
export namespace BakeSetup {
  /** What the command line asks for. */
  export interface IOptions {
    /** Frames a second of every track. */
    fps: number;

    /** The scenes to bake; every scene that plays when empty. */
    only: string[];

    /** This process's share, when it bakes one. */
    shard: number | null;

    /** The number of shares, each baked by one process. */
    shards: number;

    /** This machine's part of the takes, when several machines bake; null when one machine bakes them all. */
    runner: number | null;

    /** The number of machines that bake. */
    runners: number;

    /** Whether this process only joins the shares' results. */
    merge: boolean;

    /** Whether this process only plans every take, samples a few poses of each scene's first take for their cost, and reports refusals. */
    check: boolean;

    /** Actions the check plans alone on one person instead of the scenes. */
    rows: string[];
  }

  /** One take to bake. */
  export interface IJob {
    /** The scene. */
    scene: IScene;

    /** The take's index in the scene. */
    index: number;

    /** The composition the take performs. */
    composition: IPlaygroundComposition;

    /** The digest of its inputs. */
    digest: string;
  }

  /** What one share writes: the bodies it drew and the takes it baked. */
  export interface IPart {
    /** The bodies, by id. */
    bodies: Record<string, ISceneManifest.IBody>;

    /** The takes, by scene id and take index. */
    takes: Record<string, Record<number, ISceneManifest.ITake>>;
  }

  /** The workspace packages a track is computed from; a change in any re-bakes every take. */
  export const SOURCES: readonly string[] = [
    "archetypes",
    "engine",
    "human",
    "interface",
    "motions",
    "render",
  ];

  /**
   * The version of what a take's file and manifest entry hold. Raise it when
   * either changes shape, so every take is baked again; an edit elsewhere in
   * this script keeps the takes it would compute the same.
   */
  export const FORMAT: string = "2";

  /** The entry name of a prop's frame in a track. */
  export const PROP: string = "frame";

  /** The site's root. */
  export const root: string = path.resolve(__dirname, "..");

  /** Where the bake writes the tracks, the bodies and the manifest. */
  export const out: string = path.join(root, "public", "baked");

  /** Where each share writes what it baked, before the shares are joined. */
  export const parts: string = path.join(out, "parts");

  /** The command line, parsed. */
  export const options: IOptions = {
    fps: 12,
    only: [],
    shard: null,
    shards: Math.max(1, Math.min(8, os.availableParallelism() - 1)),
    runner: null,
    runners: 1,
    merge: false,
    check: false,
    rows: [],
  };

  /** The arguments this process was started with, which a share's process is started with too. */
  export const argv: string[] = process.argv.slice(2);
  for (let i: number = 0; i < argv.length; i++) {
    const arg: string = argv[i]!;
    if (arg === "--fps") options.fps = Number(argv[++i]);
    else if (arg === "--only") options.only.push(argv[++i]!);
    else if (arg === "--shard") options.shard = Number(argv[++i]);
    else if (arg === "--shards" || arg === "--jobs")
      options.shards = Math.max(1, Number(argv[++i]));
    else if (arg === "--runner") options.runner = Number(argv[++i]);
    else if (arg === "--runners")
      options.runners = Math.max(1, Number(argv[++i]));
    else if (arg === "--merge") options.merge = true;
    else if (arg === "--check") options.check = true;
    else if (arg === "--row") options.rows.push(argv[++i]!);
  }

  /** A digest of every source file of the packages a track is computed from, of the site code that computes it, and of the format. */
  export const sources: () => string = (): string => {
    const hash: crypto.Hash = crypto.createHash("sha256");
    const walk: (dir: string) => void = (dir: string): void => {
      for (const entry of fs
        .readdirSync(dir, { withFileTypes: true })
        .sort((a: fs.Dirent, b: fs.Dirent): number =>
          a.name.localeCompare(b.name),
        )) {
        const full: string = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(ts|tsx|json)$/.test(entry.name)) {
          hash.update(path.relative(root, full).replaceAll("\\", "/"));
          hash.update(fs.readFileSync(full));
        }
      }
    };
    for (const name of SOURCES)
      walk(path.resolve(root, "..", "packages", name, "src"));
    walk(path.join(root, "src", "playground"));
    hash.update(FORMAT);

    // The site modules outside the playground that a take is computed with:
    // the archetype of every placed object, and the track's encoding.
    for (const file of ["package/SceneArchetype.ts", "SceneTrack.ts"])
      hash.update(fs.readFileSync(path.join(root, "src", "scenes", file)));
    return hash.digest("hex");
  };

  /** Every take of every scene that plays or is marked refused, in the order shares are dealt. */
  export const plan: () => IJob[] = (): IJob[] => {
    const base: string = sources();
    return SCENES.filter(
      (scene: IScene): boolean =>
        (options.only.length === 0 || options.only.includes(scene.id)) &&
        SceneStatus.bakes(SceneStatus.of(scene)),
    ).flatMap((scene: IScene): IJob[] =>
      scene.takes.map((take: IScene.ITake, index: number): IJob => {
        const composition: IPlaygroundComposition = SceneTake.apply(
          scene.composition!,
          take,
        );
        return {
          scene,
          index,
          composition,
          digest: crypto
            .createHash("sha256")
            .update(base)
            .update(JSON.stringify(composition))
            .update(String(options.fps))
            .digest("hex"),
        };
      }),
    );
  };

  /**
   * The takes an earlier bake left, by scene and take: those of the merged
   * manifest, then those of any share's part, as a CI runner restores its own
   * share from its cache.
   */
  export const previous: () => Record<
    string,
    Record<number, ISceneManifest.ITake>
  > = (): Record<string, Record<number, ISceneManifest.ITake>> => {
    const known: Record<string, Record<number, ISceneManifest.ITake>> = {};
    const read: (file: string) => unknown = (file: string): unknown => {
      try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
      } catch {
        return null;
      }
    };
    const manifest: ISceneManifest | null = read(
      path.join(out, "manifest.json"),
    ) as ISceneManifest | null;
    if (manifest?.version === 1)
      for (const [id, scene] of Object.entries(manifest.scenes))
        Object.assign((known[id] ??= {}), { ...scene.takes });
    for (const name of fs.existsSync(parts) ? fs.readdirSync(parts) : []) {
      const part: IPart | null = read(path.join(parts, name)) as IPart | null;
      for (const [id, takes] of Object.entries(part?.takes ?? {}))
        Object.assign((known[id] ??= {}), takes);
    }
    return known;
  };

  /** The notice for a take that plans though its scene's record marks it refused, which the bake and its check both print, so the mark is dropped once every take plays. */
  export const outlived: (
    scene: IScene,
    index: number,
    label: string,
  ) => string = (scene: IScene, index: number, label: string): string =>
    `${scene.id} ${index} ${label}: plays, though its record says it is refused until #${scene.refusedUntil}; drop the mark once every take plays`;

  /** A take's stable number: from its scene and index, so adding a scene or a take moves no other take to another machine or process. */
  export const hash: (job: IJob) => number = (job: IJob): number => {
    let value: number = 0;
    for (const char of `${job.scene.id}#${job.index}`)
      value = (value * 31 + char.charCodeAt(0)) >>> 0;
    return value;
  };

  /** The takes this machine bakes: all of them, or its runner's part. */
  export const mine: () => IJob[] = (): IJob[] =>
    plan().filter(
      (job: IJob): boolean =>
        options.runner === null ||
        hash(job) % options.runners === options.runner,
    );

  /** A figure's placed actions, with those performed over others where the installed release has overlays. */
  export const spans: (
    performance: HumanPerformance,
    subject: string,
  ) => ISceneManifest.ISpan[] = (
    performance: HumanPerformance,
    subject: string,
  ): ISceneManifest.ISpan[] => {
    const span: (
      overlay: boolean,
    ) => (segment: HumanSegment.ISegment) => ISceneManifest.ISpan =
      (
        overlay: boolean,
      ): ((segment: HumanSegment.ISegment) => ISceneManifest.ISpan) =>
      (segment: HumanSegment.ISegment): ISceneManifest.ISpan => ({
        name: segment.name,
        from: segment.entryTime,
        to: segment.end,
        overlay,
      });
    const overlays:
      | ((subject: string) => readonly HumanSegment.ISegment[])
      | undefined = (
      performance as unknown as {
        overlays?: (subject: string) => readonly HumanSegment.ISegment[];
      }
    ).overlays;
    return [
      ...performance.segments(subject).map(span(false)),
      ...(overlays === undefined
        ? []
        : overlays.call(performance, subject).map(span(true))),
    ];
  };
}
