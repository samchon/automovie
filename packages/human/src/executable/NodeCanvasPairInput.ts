import { createHash } from "node:crypto";
import fs from "node:fs/promises";

import { HumanInspectionCurves } from "../inspection/HumanInspectionCurves";
import { NodeCanvasCamera } from "../inspection/NodeCanvasCamera";
import type { NodeCanvasTypes as N } from "../inspection/NodeCanvasTypes";
import { HumanCurveCostReport as R } from "./HumanCurveCostReport";
import type { NodeCanvasInventoryTypes as T } from "./NodeCanvasInventoryTypes";
import { NodeCanvasSourceDisplay as D } from "./NodeCanvasSourceDisplay";

/** Existing inventory display adapters, with source numbers and topology unchanged. */
export namespace NodeCanvasPairInput {
  /** Validates actual receipt and PNG identities before deriving any producer demand. */
  export async function read(
    session: N.Session,
    pairsPath: string,
  ): Promise<T.PairSet> {
    const input: T.PairSet = {
      rows: [],
      results: [],
      requested: 0,
      inputFailures: 0,
    };
    session.details.vitePairs = input.results;
    try {
      const bytes: Buffer = await fs.readFile(pairsPath);
      session.details.vitePairsInput = {
        path: pairsPath,
        bytes: bytes.length,
        sha256: R.hash(bytes),
      };
      const data: unknown = JSON.parse(bytes.toString("utf8"));
      if (
        !D.isRecord(data) ||
        !Array.isArray(data.rows) ||
        data.rows.length === 0
      )
        throw new Error(
          "Vite pair input requires a nonempty actual rows array",
        );
      input.requested = data.rows.length;
      const ids: Set<string> = new Set();
      for (const row of data.rows)
        try {
          if (
            !D.isRecord(row) ||
            typeof row.id !== "string" ||
            ids.has(row.id) ||
            (row.stage !== "original" && row.stage !== "raw-clay") ||
            !Array.isArray(row.names) ||
            row.names.length === 0 ||
            !row.names.every(
              (name: unknown): boolean =>
                typeof name === "string" && name.length !== 0,
            ) ||
            typeof row.snapshotPath !== "string" ||
            typeof row.pngPath !== "string"
          )
            throw new Error("Invalid or duplicate actual Vite pair row");
          ids.add(row.id);
          const names: string[] = row.names.map((name: unknown): string =>
            String(name),
          );
          const snapshotBytes: Buffer = await fs.readFile(row.snapshotPath);
          const receipt: unknown = JSON.parse(snapshotBytes.toString("utf8"));
          if (!D.isRecord(receipt) || !D.isRecord(receipt.snapshot))
            throw new Error(
              "Expected an actual capture receipt containing snapshot",
            );
          const snapshot: Record<string, unknown> = receipt.snapshot;
          if (
            !D.isRecord(snapshot.canvas) ||
            typeof snapshot.canvas.width !== "number" ||
            typeof snapshot.canvas.height !== "number"
          )
            throw new Error("Actual canvas metadata unavailable");
          if (
            !D.isRecord(snapshot.subject) ||
            snapshot.subject.person !== "f1" ||
            snapshot.subject.pose !== null
          )
            throw new Error("Actual pair requires static f1");
          const vitePngSha256: string = createHash("sha256")
            .update(await fs.readFile(row.pngPath))
            .digest("hex");
          if (
            vitePngSha256 !== receipt.pngSha256 ||
            typeof receipt.source !== "string"
          )
            throw new Error(
              "Vite PNG receipt identity is unavailable or mismatched",
            );
          if (!D.isRecord(snapshot.shown))
            throw new Error("Actual Vite shown IDs unavailable");
          const shownParts: unknown = snapshot.shown.parts;
          if (
            !Array.isArray(shownParts) ||
            !shownParts.every((id: unknown): boolean => typeof id === "string")
          )
            throw new Error("Actual shown mesh IDs unavailable");
          const referenceIds: string[] = shownParts.filter(
            (id: unknown): id is string =>
              typeof id === "string" && id.startsWith("human.skin.reference."),
          );
          if (
            new Set(referenceIds).size !== referenceIds.length ||
            referenceIds.some(
              (id: string): boolean =>
                ![
                  "human.skin.reference.head/0",
                  "human.skin.reference.body/0",
                ].includes(id),
            )
          )
            throw new Error(
              "Unsupported or duplicate actual native reference IDs",
            );
          const selected: unknown =
            row.stage === "original"
              ? snapshot.shown.curves
              : shownParts.filter(
                  (id: unknown): boolean =>
                    typeof id === "string" &&
                    !id.startsWith("human.skin.reference."),
                );
          if (
            !Array.isArray(selected) ||
            selected.length === 0 ||
            !selected.every((id: unknown): boolean => typeof id === "string")
          )
            throw new Error("Actual selected IDs unavailable");
          const expected: string[] = selected.map((id: unknown): string =>
            String(id),
          );
          if (
            new Set(expected).size !== expected.length ||
            (row.stage === "original" &&
              expected.some(
                (id: string): boolean =>
                  !names.some((name: string): boolean =>
                    id.startsWith(HumanInspectionCurves.PREFIX + name + "/"),
                  ),
              ))
          )
            throw new Error(
              "Shown IDs do not name the requested original source stage",
            );
          const presentation: Pick<
            T.Pair,
            "referencePatterns" | "lineMode" | "differences"
          > = demand(
            snapshot,
            names,
            referenceIds,
            row.stage,
            session.referenceSha256,
          );
          input.rows.push({
            id: row.id,
            stage: row.stage,
            names,
            ids: expected,
            referenceIds,
            ...presentation,
            camera: NodeCanvasCamera.saved(
              snapshot.camera,
              snapshot.canvas.width,
              snapshot.canvas.height,
              row.id,
            ),
            evidence: {
              snapshotPath: row.snapshotPath,
              snapshotSha256: R.hash(snapshotBytes),
              viteSource: receipt.source,
              vitePngPath: row.pngPath,
              vitePngSha256,
              originalCamera: snapshot.camera,
            },
          });
        } catch (error: unknown) {
          input.results.push({
            row,
            status: "unavailable",
            error: R.message(error),
          });
        }
    } catch (error: unknown) {
      input.inputFailures++;
      input.results.push({
        pairsPath,
        status: "input-failed",
        error: R.message(error),
      });
    }
    return input;
  }

  /** Uses actual resolved presentation facts; legacy demand stays explicitly unknown instead of inventing defaults. */
  export function demand(
    snapshot: Record<string, unknown>,
    names: string[],
    referenceIds: string[],
    stage: "original" | "raw-clay",
    referenceSha256: string,
  ): Pick<T.Pair, "referencePatterns" | "lineMode" | "differences"> {
    const differences: string[] = [];
    if (referenceIds.length !== 0) {
      const provenance: unknown = snapshot.provenance;
      const reference: unknown = D.isRecord(provenance)
        ? provenance.referenceDisplay
        : null;
      if (
        !D.isRecord(reference) ||
        reference.representation !== "native-static-mesh" ||
        reference.sha256 !== referenceSha256
      )
        throw new Error(
          "Actual native reference producer/bytes do not match the saved scene",
        );
    }
    const display: unknown = snapshot.display;
    if (!D.isRecord(display))
      return {
        referencePatterns: names,
        lineMode: "xray",
        differences: [
          "Historical snapshot did not record resolved reference crop/alpha/depth demand; this is a source-only diagnostic with an explicit source-name crop and xray normalization.",
        ],
      };
    if (
      (referenceIds.length !== 0 && display.referenceStyle !== "clay") ||
      typeof display.referenceOpacity !== "number" ||
      !Number.isFinite(display.referenceOpacity) ||
      display.referenceOpacity <= 0 ||
      display.referenceOpacity > 1 ||
      typeof display.opacity !== "number" ||
      !Number.isFinite(display.opacity) ||
      display.opacity <= 0 ||
      display.opacity > 1 ||
      typeof display.xray !== "boolean" ||
      !Array.isArray(display.referencePart) ||
      !display.referencePart.every(
        (name: unknown): boolean => typeof name === "string",
      )
    )
      throw new Error(
        "Unsupported or missing actual presentation demand; native clay cannot replace a section-pack reference",
      );
    if (referenceIds.length !== 0 && display.referenceOpacity !== 1)
      differences.push(
        "Requested reference alpha " +
          display.referenceOpacity +
          "; Node supports opaque clay only",
      );
    if (stage === "raw-clay" && display.opacity !== 1)
      differences.push(
        "Requested raw alpha " +
          display.opacity +
          "; Node supports opaque clay only",
      );
    return {
      referencePatterns: display.referencePart.map((name: unknown): string =>
        String(name),
      ),
      lineMode: display.xray ? "xray" : "depth",
      differences,
    };
  }
}
