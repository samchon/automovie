import type { IAutoMovieLoftSectionFrame } from "@automovie/interface";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { FamilyConicLoft as K } from "./FamilyConicLoft";
import type { FamilyConicSection as C } from "./FamilyConicSection";
import type { FamilyConicSource as R } from "./FamilyConicSource";

/** Recheck supplied stored walls and their directed cut evidence. */
export namespace FamilyConicBody {
  /** Millimetre error bound of the original prefix replay. */
  const TARGET_MM: number = 0.5;

  /** Replay the explicit manifest without starting a fit. */
  export async function main(): Promise<void> {
    const started: number = performance.now();
    const args: string[] = process.argv.slice(2);
    const manifests = args.filter((argument) => argument.startsWith("--verify-prefix="));
    const outputs = args.filter((argument) => argument.startsWith("--out="));
    if (
      manifests.length !== 1 ||
      outputs.length > 1 ||
      args.length !== manifests.length + outputs.length ||
      manifests[0] === "--verify-prefix=" ||
      outputs[0] === "--out="
    )
      throw new Error("Supply --verify-prefix=<manifest> and optional --out=<directory>");
    const manifest: string = path.resolve(manifests[0]!.slice("--verify-prefix=".length));
    const out: string = outputs[0] === undefined
      ? path.resolve("..", "test/.shots/family-conic-body", new Date().toISOString().replaceAll(":", "-"))
      : path.resolve(outputs[0].slice("--out=".length));
    await fs.mkdir(out, { recursive: true });
    await replayPrefixes(manifest, out, (event, detail): void => {
      process.stdout.write(JSON.stringify({ event, ...detail, elapsedMs: Math.round(performance.now() - started) }) + "\n");
    });
  }

  /** A section chart's point in the world, mm. */
  function chartToWorld(frame: IAutoMovieLoftSectionFrame, p: C.P): R.V {
    return [0, 1, 2].map(
      (k: number): number =>
        frame.origin[k]! + p[0] * frame.u[k]! + p[1] * frame.v[k]!,
    ) as R.V;
  }

  /** Re-read stored walls and directed source cuts without starting a fit or rasterizer. */
  async function replayPrefixes(
    manifest: string,
    out: string,
    log: (event: string, detail: object) => void,
  ): Promise<void> {
    const inputs = JSON.parse(await fs.readFile(manifest, "utf8")) as {
      part: string;
      wall: { file: string; sha256: string };
      measured: { file: string; sha256: string };
      mark: number;
    }[];
    if (inputs.length === 0 || new Set(inputs.map(({ part }): string => part)).size !== inputs.length)
      throw new Error("prefix replay needs distinct named input records");
    const read = async ({ file, sha256 }: { file: string; sha256: string }): Promise<string> => {
      const contents: Buffer = await fs.readFile(file);
      if (createHash("sha256").update(contents).digest("hex") !== sha256.toLowerCase())
        throw new Error("prefix replay input changed: " + file);
      return contents.toString("utf8");
    };
    const receipts: unknown[] = [];
    for (const input of inputs) {
      const final = JSON.parse(await read(input.wall)) as K.IStored;
      const measured = JSON.parse(await read(input.measured)) as {
        part: string;
        domain: [number, number];
        units: "mm";
        rows: { s: number; heldout: boolean; frame: IAutoMovieLoftSectionFrame; runs?: C.P[][] }[];
      };
      if (final.name !== input.part || measured.part !== input.part || measured.units !== "mm" ||
          measured.domain[0] !== final.knots[0] || input.mark <= measured.domain[0] ||
          input.mark > measured.domain[1] || !final.knots.includes(input.mark))
        throw new Error("prefix replay source, station or units mismatch: " + input.part);
      const cuts = measured.rows.filter(({ s, runs }): boolean => s < input.mark && (runs?.length ?? 0) > 0)
        .map(({ s, heldout, frame, runs }): K.IPrefixCut => ({
          s, heldout, world: runs!.flat().map((point: C.P): R.V => chartToWorld(frame, point)),
        }));
      const checked = K.verifyPrefix(final, final.knots, input.mark, cuts, TARGET_MM);
      const receipt = { ...input, targetMm: TARGET_MM, ...checked };
      receipts.push(receipt);
      log("family-body-prefix-replay", receipt);
    }
    await fs.writeFile(path.join(out, "prefix-replay.json"), JSON.stringify(receipts));
  }

}

void FamilyConicBody.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
