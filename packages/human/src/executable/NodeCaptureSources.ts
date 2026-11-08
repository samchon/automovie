import { createHash } from "node:crypto";
import { readdirSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import type { IAutoMovieModel } from "@automovie/interface";

import type { CaptureModel } from "../inspection/CaptureModel";
import type { IHumanInspectionPerson } from "../inspection/IHumanInspectionPerson";
import { HumanNodeInput } from "./HumanNodeInput";
import { HumanNodePaths } from "./HumanNodePaths";

/**
 * Capture providers of `node:capture` and the figure inventory they answer
 * for. A provider turns one region's actual spec and loft constructors into
 * {@link CaptureModel.IPart}s; it is the only region-specific code the
 * capture reads. A region joins the capture with its own
 * `Node<Region>CaptureSource.ts` module ({@link providers}); a provided name
 * leaves {@link KNOWN}'s unavailable list, and the selection, cameras,
 * stages, sheets and manifest stay unchanged.
 *
 * The run's shared context loads the typed f1 input once and reads the
 * reference artifact at most once, on the first provider that asks for it.
 */
export namespace NodeCaptureSources {
  /** What a provider reads, prepared once per run. */
  export interface IContext {
    /** The typed f1 input; calibration stays lazy and is never requested here. */
    person: IHumanInspectionPerson;

    /** Requested display pose. */
    pose: "neutral" | "reference";

    /** The native reference model, read and parsed once. */
    reference(): Promise<IReference>;
  }

  /** The adopted reference artifact. */
  export interface IReference {
    /** Parsed model. */
    model: IAutoMovieModel;

    /** SHA-256 of its bytes. */
    sha256: string;

    /** Read, hash and parse time, milliseconds. */
    milliseconds: number;
  }

  /** One region provider. */
  export interface IProvider {
    /** Part names it draws. */
    names: readonly string[];

    /** Region source files whose bytes identify the drawn source. */
    files: readonly string[];

    /** Build one of its parts. */
    prepare(name: string, context: IContext): Promise<CaptureModel.IPart>;
  }

  /** Built-in providers; every region now supplies its own module, so none is built in. */
  export const PROVIDERS: readonly IProvider[] = [];

  /**
   * Every provider by part name: the built-in ones, then each region's
   * `src/executable/Node<Region>CaptureSource.ts` module exporting a
   * namespace of its file name with a `PROVIDER`. A region module loaded
   * later replaces a built-in provider of the same part name, so a region
   * owner takes over its parts without editing the capture.
   */
  export function providers(): Map<string, IProvider> {
    const out: Map<string, IProvider> = new Map();
    for (const p of PROVIDERS) for (const n of p.names) out.set(n, p);
    const directory: string = HumanNodePaths.resolve("packages/human/src/executable");
    for (const file of readdirSync(directory)
      .filter((f: string): boolean => /^Node[A-Za-z0-9]+CaptureSource\.ts$/.test(f))
      .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0))) {
      const loaded: Record<string, { PROVIDER?: IProvider } | undefined> = require(path.join(directory, file));
      const provider: IProvider | undefined = loaded[file.slice(0, -3)]?.PROVIDER;
      if (provider === undefined) throw new Error(`${file} exports no ${file.slice(0, -3)}.PROVIDER`);
      for (const n of provider.names) out.set(n, provider);
    }
    return out;
  }

  /**
   * Figure parts without a capture provider, with their relations from the
   * existing inventory: the legacy view-part names (`NodeCanvasSourceDisplay`
   * groups `arm.left` with `thumb.left` and `finger.left.*`;
   * `AutoMovieHumanTorsoArmPort` hangs both arms on the trunk) and the
   * reference regions (`HumanInspectionReferencePieces`).
   */
  export const KNOWN: readonly CaptureModel.IKnown[] = [
    known("trunk", null, ["head", "arm.left", "arm.right", "leg.left", "leg.right"]),
    known("head", "trunk", []),
    known("arm.right", "trunk", ["thumb.right", "finger.right.1", "finger.right.2", "finger.right.3", "finger.right.4"]),
    known("thumb.left", "arm.left", []),
    ...[1, 2, 3, 4].map((k: number): CaptureModel.IKnown => known(`finger.left.${k}`, "arm.left", [])),
    known("thumb.right", "arm.right", []),
    ...[1, 2, 3, 4].map((k: number): CaptureModel.IKnown => known(`finger.right.${k}`, "arm.right", [])),
    known("leg.left", "trunk", ["foot.left"]),
    known("leg.right", "trunk", ["foot.right"]),
    known("foot.left", "leg.left", []),
    known("foot.right", "leg.right", []),
  ];

  /**
   * SHA-256 of each source file, repository-relative; an entry ending in `/`
   * stands for every `.ts` file directly in that directory, and a file that
   * cannot be read is recorded as `missing` rather than failing the run. The
   * capture hashes at entry and again at exit: a file whose two hashes differ
   * changed while the run evaluated it, and neither hash certifies the bytes
   * `ttsx` compiled before the entry ran.
   */
  export async function identities(files: readonly string[]): Promise<Record<string, string>> {
    const expanded: string[] = [];
    for (const file of files)
      if (!file.endsWith("/")) expanded.push(file);
      else
        try {
          for (const name of readdirSync(HumanNodePaths.resolve(file))
            .filter((n: string): boolean => n.endsWith(".ts"))
            .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)))
            expanded.push(`${file}${name}`);
        } catch {
          expanded.push(file);
        }
    const out: Record<string, string> = {};
    for (const file of [...new Set(expanded)])
      try {
        out[file] = createHash("sha256")
          .update(await fs.readFile(HumanNodePaths.resolve(file)))
          .digest("hex");
      } catch {
        out[file] = "missing";
      }
    return out;
  }

  /** Create the run's context: the input is loaded now, the reference on first demand. */
  export async function context(pose: "neutral" | "reference"): Promise<IContext> {
    const person: IHumanInspectionPerson = await HumanNodeInput.of();
    let pending: Promise<IReference> | null = null;
    return {
      person,
      pose,
      reference(): Promise<IReference> {
        pending ??= (async (): Promise<IReference> => {
          const started: number = performance.now();
          const bytes: Buffer = await fs.readFile(HumanNodePaths.resolve("test/.shots/f1/reference-model.json"));
          const sha256: string = createHash("sha256").update(bytes).digest("hex");
          const model: IAutoMovieModel = JSON.parse(bytes.toString("utf8"));
          return { model, sha256, milliseconds: performance.now() - started };
        })();
        return pending;
      },
    };
  }

  function known(name: string, parent: string | null, children: string[]): CaptureModel.IKnown {
    return {
      name,
      cause: "no capture provider registered: no view-curve specs or loft exist for this part in the current construction",
      relations: { parent, children, shares: [], basis: "existing inventory (legacy view-part names, reference regions)" },
    };
  }
}
