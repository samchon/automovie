import { FamilyConicOwnershipPaths } from "./FamilyConicOwnershipPaths";
import {
  AutoMovieConstructionNativeProfile,
  AutoMovieLoftViewSource,
  AutoMovieLoftViewWorldJet,
} from "@automovie/engine";
import { AutoMovieHumanF1 } from "@automovie/human/capture";
import type {
  IAutoMovieConstructionProfileSource,
  IAutoMovieHumanF1,
  IAutoMovieLoftViewSource,
  IAutoMovieViewPart,
} from "@automovie/interface";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Capture the current public f1 constructor before an ownership refactor.
 * From test, build with pnpm exec esbuild src/reference-conics/FamilyConicOwnership.ts
 * --bundle --platform=node --format=cjs --outfile=<absolute bundle.cjs>, then run
 * node <bundle.cjs> --out=<absolute receipt.json>. --baseline=<old receipt>
 * reuses the old material addresses and compares payload hashes exactly.
 * This is a source diagnostic, never a unit test or anatomical acceptance.
 * NativeProfile and ViewWorldJet read bare originals, including their original
 * cap scalar laws. Relief definitions are retained, but relieved skin, lift,
 * emitted poles and sewn bands require the separate realized-figure capture.
 */
namespace FamilyConicOwnership {
  /** Fixed material stations and phases chosen by the old constructor. */
  interface Address {
    name: string;
    stations: number[];
    phases: number[];
  }

  /** A persisted payload and its exact source/bundle provenance. */
  interface Receipt {
    schema: 1;
    created: string;
    bundle: { file: string; sha256: string };
    sources: { file: string; sha256: string }[];
    addresses: Address[];
    payload: string;
    sha256: string;
  }

  /** SHA-256 of the exact bytes, with no numeric rounding. */
  function hash(data: string | Buffer): string {
    return createHash("sha256").update(data).digest("hex");
  }

  /** Callable owners cannot be serialized; retain their actual source text hash. */
  function encode(value: unknown): string {
    return JSON.stringify(value, (_key: string, item: unknown): unknown =>
      typeof item === "function"
        ? { callable: hash(Function.prototype.toString.call(item)) }
        : typeof item === "number" && !Number.isFinite(item)
          ? { nonfinite: String(item) }
          : item,
    );
  }

  /** Record unavailable native capabilities without fabricating a value or jet. */
  function read(query: () => unknown): unknown {
    try {
      return query();
    } catch (error: unknown) {
      return {
        unavailable: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /** Hash every maintained generating-source file; private references are never read. */
  async function hashes(
    root: string,
  ): Promise<{ file: string; sha256: string }[]> {
    const out: { file: string; sha256: string }[] = [];
    const walk = async (directory: string): Promise<void> => {
      const entries: import("node:fs").Dirent[] = await fs.readdir(directory, {
        withFileTypes: true,
      });
      for (const entry of entries.sort((a, b): number =>
        a.name.localeCompare(b.name),
      )) {
        const file: string = path.join(directory, entry.name);
        if (entry.isDirectory()) await walk(file);
        else if (entry.name.endsWith(".ts"))
          out.push({
            file: path.relative(root, file).replaceAll("\\", "/"),
            sha256: hash(await fs.readFile(file)),
          });
      }
    };
    await walk(path.join(root, "packages/human/src/generation"));
    await walk(path.join(root, "packages/engine/src/geometry/construction"));
    return out;
  }

  /** Read one exact old material address through the existing original evaluators. */
  function original(part: IAutoMovieViewPart, address: Address): unknown {
    const prepared: IAutoMovieLoftViewSource.IResult | null =
      AutoMovieLoftViewSource.create(part);
    const source: IAutoMovieLoftViewSource.ISource | null =
      prepared?.source ?? null;
    let profile: IAutoMovieConstructionProfileSource | undefined;
    const admission: unknown = read((): unknown => {
      profile = AutoMovieConstructionNativeProfile(part, {
        material: part.name,
        binding: part.name,
        revisions: {
          source: "ownership-receipt",
          constraints: "unchanged",
          topology: "unchanged",
        },
      });
      return profile.definition;
    });
    const curve: IAutoMovieConstructionProfileSource.ICurve | undefined =
      profile?.curves.get(part.name + ".native");
    return {
      name: part.name,
      scope:
        "bare original; actual cap scalar laws retained; relief/lift/realized pole/band excluded",
      admission,
      scalarAdmission: prepared,
      reliefs: part.reliefs ?? [],
      pole: part.pole ?? "open",
      readings: address.stations.map((station: number): unknown => ({
        station,
        frame: read((): unknown => part.axis.at(station)),
        axis2: read(
          (): unknown =>
            part.axis.jet?.(station) ?? {
              unavailable: "actual axis2 absent or singular",
            },
        ),
        phases: address.phases.map((phase: number): unknown => ({
          phase,
          point0: read(
            (): unknown =>
              curve?.point(station, phase) ?? {
                unavailable: "native Point0 unavailable",
              },
          ),
          phase2: read(
            (): unknown =>
              curve?.phase?.(station, phase) ?? {
                unavailable: "native phase2 unavailable",
              },
          ),
          local2: read(
            (): unknown =>
              curve?.jet(station, phase) ?? {
                unavailable: "native physical2 unavailable",
              },
          ),
          world2: read((): unknown =>
            source === null
              ? { unavailable: "direct scalar source unavailable" }
              : AutoMovieLoftViewWorldJet(source, part.axis, station, phase),
          ),
        })),
      })),
    };
  }

  /** Capture old API output, or compare a new invocation with the immutable old receipt. */
  export async function main(): Promise<void> {
    const option = (name: string): string | undefined =>
      process.argv
        .find((argument: string): boolean => argument.startsWith(name + "="))
        ?.slice(name.length + 1);
    const output: string | undefined = option("--out");
    if (output === undefined || !path.isAbsolute(output))
      throw new Error("--out must be an absolute receipt path");
    const outputPaths: ReturnType<typeof FamilyConicOwnershipPaths> =
      FamilyConicOwnershipPaths(output);
    const root: string = path.resolve(
      process.cwd(),
      process.cwd().endsWith("test") ? ".." : ".",
    );
    const allowed: string = path.join(root, "packages/human/.shots") + path.sep;
    if (!path.resolve(output).startsWith(allowed))
      throw new Error("receipt must be under packages/human/.shots");
    const oldPath: string | undefined = option("--baseline");
    if (
      oldPath !== undefined &&
      path.resolve(oldPath).toLowerCase() === path.resolve(output).toLowerCase()
    )
      throw new Error("--out must not overwrite --baseline");
    const old: Receipt | undefined =
      oldPath === undefined
        ? undefined
        : (JSON.parse(await fs.readFile(oldPath, "utf8")) as Receipt);
    const declared: IAutoMovieHumanF1.IConstruction =
      AutoMovieHumanF1.construction();
    const addresses: Address[] =
      old?.addresses ??
      [...declared.sources].map(([name, part]): Address => {
        const from: number = part.stations[0]!;
        const to: number = part.stations.at(-1)!;
        return {
          name,
          stations: [0, 0.25, 0.5, 0.75, 1].map(
            (share: number): number => from + (to - from) * share,
          ),
          phases: [0, Math.PI / 4, Math.PI / 2, Math.PI, (3 * Math.PI) / 2],
        };
      });
    const payload: string = encode({
      root: declared.root,
      fills: declared.fills,
      parts: [...declared.sources],
      originals: addresses.map((address: Address): unknown => {
        const part: IAutoMovieViewPart | undefined = declared.sources.get(
          address.name,
        );
        return part === undefined
          ? { name: address.name, unavailable: "source absent" }
          : original(part, address);
      }),
      unavailable: [
        "relieved skin/lift total2",
        "emitted pole regularity",
        "realized bands and trims",
        "full-figure/reference acceptance",
      ],
    });
    const file: string = path.resolve(process.argv[1]!);
    const receipt: Receipt = {
      schema: 1,
      created: new Date().toISOString(),
      bundle: { file, sha256: hash(await fs.readFile(file)) },
      sources: await hashes(root),
      addresses,
      payload,
      sha256: hash(payload),
    };
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(outputPaths.receipt, JSON.stringify(receipt), {
      flag: "wx",
    });
    await fs.writeFile(outputPaths.companion, payload, { flag: "wx" });
    process.stdout.write(
      JSON.stringify({
        output,
        sha256: receipt.sha256,
        sourceCount: declared.sources.size,
        addresses: addresses.reduce(
          (sum: number, address: Address): number =>
            sum + address.stations.length * address.phases.length,
          0,
        ),
        baseline: oldPath ?? null,
        identical: old === undefined ? null : old.payload === payload,
      }) + "\n",
    );
    if (old !== undefined && old.payload !== payload) process.exitCode = 1;
  }
}

void FamilyConicOwnership.main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
