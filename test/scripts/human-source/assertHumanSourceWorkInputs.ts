import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { readHumanSourcePublication } from "./readHumanSourcePublication.ts";
import { serializeHumanSourceInspectionDescriptor } from "./serializeHumanSourceInspectionDescriptor.ts";
import type { IHumanSourceAuthoredStageReceipt } from "./structures/IHumanSourceAuthoredStageReceipt.ts";
import type { IHumanSourceGenerationInput } from "./structures/IHumanSourceGenerationInput.ts";

/**
 * Re-observe raw asset bytes at the publication boundary. A changed or absent
 * asset refuses publication; absolute location and acquisition time never
 * substitute for the portable recorded content identity.
 */
export function assertHumanSourceWorkInputs(
  inputs: readonly IHumanSourceGenerationInput[],
  work: string,
  provider?: string,
  replay?: string,
  headTraits?: string,
  inspectionCheckpoint?: string,
  repository?: string,
): void {
  const published = new Map<string, ReadonlyMap<string, Buffer>>();
  for (const [prefix, directory, receipt] of [
    ["provider/", provider, "head-provider-packet.json"],
    ["replay/", replay, "replay-manifest.json"],
    ["head-traits/", headTraits, "head-trait-endpoints.json"],
  ] as const) {
    if (!inputs.some((input) => input.path.startsWith(prefix))) continue;
    if (directory === undefined)
      throw new Error(`Source ${prefix} has no published component owner.`);
    published.set(
      prefix,
      readHumanSourcePublication(directory, [receipt], "component").outputs,
    );
  }
  for (const input of inputs) {
    if (input.role === "failed-qualified eye source descriptor") {
      if (inspectionCheckpoint === undefined)
        throw new Error("Inspection input lacks its checkpoint owner.");
      const admitted = readHumanSourcePublication(
        inspectionCheckpoint,
        ["stage-receipt.json", "full-stage-refusal.json"],
        "inspection",
      );
      const receipt = JSON.parse(
        admitted.outputs.get("stage-receipt.json")!.toString("utf8"),
      ) as IHumanSourceAuthoredStageReceipt;
      const descriptor = serializeHumanSourceInspectionDescriptor(receipt);
      if (
        descriptor.length !== input.bytes ||
        crypto.createHash("sha256").update(descriptor).digest("hex") !==
          input.sha256
      )
        throw new Error(
          "Source inspection descriptor changed during compilation.",
        );
      continue;
    }
    // Immutable Git blobs and the separately reobserved compiler graph are
    // not raw mutable filesystem inputs. The oral recipe is serialized from
    // this invocation's immutable scalar arguments, not a missing file.
    if (
      input.revision !== null ||
      input.role === "producer" ||
      input.role === "producer resolved graph" ||
      input.role === "explicit shared oral neutral source recipe"
    )
      continue;
    const roots: [string, string | undefined][] = [
      ["work/", work],
      ["sample/", path.join(work, "sample")],
      ["provider/", provider],
      ["replay/", replay],
      ["head-traits/", headTraits],
      ["inspection-checkpoint/", inspectionCheckpoint],
    ];
    const match = roots.find(([prefix]) => input.path.startsWith(prefix));
    const root = match === undefined ? repository : match[1];
    if (root === undefined)
      throw new Error(
        `Source raw input ${input.path} has no owning input directory.`,
      );
    const relative =
      match === undefined ? input.path : input.path.slice(match[0].length);
    const target = path.resolve(root, relative),
      resolvedRoot = path.resolve(root);
    const displacement = path.relative(resolvedRoot, target);
    if (
      path.isAbsolute(displacement) ||
      displacement === ".." ||
      displacement.startsWith(`..${path.sep}`)
    )
      throw new Error(`Source raw input escapes its owner: ${input.path}.`);
    const component = match === undefined ? undefined : published.get(match[0]);
    const bytes =
      component === undefined
        ? fs.readFileSync(target)
        : component.get(relative);
    if (bytes === undefined)
      throw new Error(`Source component does not publish ${input.path}.`);
    const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
    if (bytes.length !== input.bytes || sha256 !== input.sha256)
      throw new Error(`Source raw input changed: ${input.role} ${input.path}.`);
  }
}
