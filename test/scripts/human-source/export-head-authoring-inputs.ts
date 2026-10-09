/** Publish normal TS source authority over preserved recipes and acquired profiles.
 * From test: ttsx -P tsconfig.human-source.json scripts/human-source/export-head-authoring-inputs.ts SOURCE NEW_OUTPUT [HEAD_GUIDES EAR_GUIDES SOCKET_GUIDES [RAW_PROFILES]]
 * Two arguments retain exact original acquired profile bytes. Explicit completed
 * guide components replace their roles after matching original native authority.
 * The manifest addresses the actual TS producer closure and data; legacy Python
 * files remain historical provenance and are not active producer declarations.
 * No source geometry, license, original recipe or historical receipt is rewritten.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import typia from "typia";

import type { IHumanHeadSourceAuthoringManifest } from "./head-authoring/structures/IHumanHeadSourceAuthoringManifest.ts";
import type { IHumanHeadSourceInputEntry } from "./head-authoring/structures/IHumanHeadSourceInputEntry.ts";
import type { IHumanHeadSourceGuide } from "./head-authoring/structures/IHumanHeadSourceGuide.ts";
import type { IHumanHeadEarSourceGuide } from "./head-authoring/structures/IHumanHeadEarSourceGuide.ts";
import type { IHumanHeadNasalSocketGuide } from "./head-authoring/structures/IHumanHeadNasalSocketGuide.ts";
import { publishHumanSourceFiles } from "./publishHumanSourceFiles.ts";
import { readHumanSourceProducerClosure } from "./readHumanSourceProducerClosure.ts";
import { readHumanSourcePublication } from "./readHumanSourcePublication.ts";

const [source, output, ...components] = process.argv.slice(2);
if (source === undefined || output === undefined || ![0, 3, 4].includes(components.length))
  throw new Error("Usage: export-head-authoring-inputs.ts SOURCE NEW_OUTPUT [HEAD_GUIDES EAR_GUIDES SOCKET_GUIDES [RAW_PROFILES]]");
const repository = path.resolve(__dirname, "../../.."), sourceRoot = path.resolve(source), outputRoot = path.resolve(output);
const rawRoot = components[3] === undefined ? sourceRoot : path.resolve(components[3]);
const captured = new Map<string, Buffer>();
const sha = (bytes: Uint8Array): string => crypto.createHash("sha256").update(bytes).digest("hex");
const entry = (file: string, expected?: string): IHumanHeadSourceInputEntry => {
  const resolved = path.resolve(file), bytes = fs.readFileSync(resolved);
  if ((expected !== undefined && sha(bytes) !== expected) || (captured.has(resolved) && !captured.get(resolved)!.equals(bytes)))
    throw new Error("Original source authority changed: " + resolved);
  captured.set(resolved, bytes);
  return { path: path.relative(outputRoot, resolved).replaceAll("\\", "/"), bytes: bytes.length, sha256: sha(bytes) };
};
const originalFile = path.join(sourceRoot, "source-inputs.json");
entry(originalFile);
const authored = typia.assert<IHumanHeadSourceAuthoringManifest>(JSON.parse(captured.get(originalFile)!.toString("utf8")));
if (authored.schema !== "automovie-canonical-head-authoring-inputs/1") throw new Error("Source input export requires the original head authoring manifest.");
const originals: Record<string, IHumanHeadSourceInputEntry> = {};
for (const [name, one] of Object.entries(authored.profiles)) originals[name] = entry(path.resolve(rawRoot, one.path), one.sha256);
const profiles = { ...originals };
const admittedComponents = components.slice(0, 3).map((directory, ordinal) => {
  const required = ordinal === 0 ? ["head-source-guide.json", "head-source-guide-nasal.json"] : ordinal === 1 ? ["ear-source-guide.json"] : ["nasal-socket-ports.json"];
  const root = path.resolve(directory);
  entry(path.join(root, "source-publication.json"));
  const admitted = readHumanSourcePublication(root, required, "component");
  for (const [name, bytes] of admitted.outputs) entry(path.join(root, name), sha(bytes));
  return { root, admitted };
});
if (admittedComponents.length !== 0) {
  const [head, ear, socket] = admittedComponents;
  const headGuide = typia.assert<IHumanHeadSourceGuide>(JSON.parse(head.admitted.outputs.get("head-source-guide.json")!.toString("utf8")));
  const nasalGuide = typia.assert<IHumanHeadSourceGuide>(JSON.parse(head.admitted.outputs.get("head-source-guide-nasal.json")!.toString("utf8")));
  const earGuide = typia.assert<IHumanHeadEarSourceGuide>(JSON.parse(ear.admitted.outputs.get("ear-source-guide.json")!.toString("utf8")));
  const socketGuide = typia.assert<IHumanHeadNasalSocketGuide>(JSON.parse(socket.admitted.outputs.get("nasal-socket-ports.json")!.toString("utf8")));
  if (headGuide.basis !== nasalGuide.basis || headGuide.basis !== earGuide.generation || headGuide.basis !== socketGuide.nativeGeneration ||
    headGuide.originalNativeCount !== nasalGuide.originalNativeCount || headGuide.originalNativeCount !== earGuide.originalNativeCount)
    throw new Error("Generated source profiles have different historical native authorities.");
  profiles.sourceGuide = entry(path.join(head.root, "head-source-guide.json"));
  profiles.nasalExteriorGuide = entry(path.join(head.root, "head-source-guide-nasal.json"));
  profiles.earGuide = entry(path.join(ear.root, "ear-source-guide.json"));
  profiles.nasalSocket = entry(path.join(socket.root, "nasal-socket-ports.json"));
}
const recipe = Object.fromEntries(Object.entries(authored.recipe).map(([name, one]) => [name, entry(path.resolve(sourceRoot, one.path), one.sha256)]));
const producer = readHumanSourceProducerClosure(repository, "test/scripts/human-source/author-head-source-provider.ts");
const replayProducer = readHumanSourceProducerClosure(repository, "test/scripts/human-source/replay-head-source-provider.ts");
const traitProducer = readHumanSourceProducerClosure(repository, "test/scripts/human-source/compile-head-trait-endpoints.ts");
const currentProducer = readHumanSourceProducerClosure(repository, "test/scripts/human-source/export-head-authoring-inputs.ts");
const files = new Map<string, IHumanHeadSourceInputEntry>();
for (const one of [...Object.values(profiles), ...Object.values(recipe)]) files.set(one.path, one);
for (const closure of [producer, replayProducer, traitProducer, currentProducer])
  for (const input of closure.inputs) {
    if (input.path.startsWith("dependency/") || input.path.includes("#") || !/\.(?:ts|mts|cts|json)$/u.test(input.path)) continue;
    const one = entry(path.join(repository, input.path), input.sha256);
    files.set(one.path, one);
  }
const manifest: IHumanHeadSourceAuthoringManifest = {
  schema: authored.schema, sourceId: authored.sourceId, frame: authored.frame, publication: "source-publication.json", recipe, profiles,
  files: [...files.values()].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0),
  qualification: "TypeScript source-owned coarse formula and exact preserved/acquired input authority. Original source support uncertainty and clinical gaps remain; this component is not an accepted human generation.",
};
const bytes = JSON.stringify({ ...manifest, supersededProfiles: originals, historicalAuthoringInputs: entry(originalFile),
  legacyProducerQualification: "Original Python producer records remain historical input provenance only; no Python is executed or imported by this TypeScript production." }, null, 2) + "\n";
publishHumanSourceFiles({ directory: outputRoot, generation: sha(Buffer.from(bytes)), completeGeneration: false, inspectionOnly: false,
  files: new Map([["source-inputs.json", bytes]]),
  verifyInputs: () => {
    for (const closure of [producer, replayProducer, traitProducer, currentProducer]) closure.verifyUnchanged();
    for (const [file, original] of captured) if (!original.equals(fs.readFileSync(file))) throw new Error("Source input changed during manifest publication: " + file);
    for (const component of admittedComponents) {
      const actual = readHumanSourcePublication(component.root, [...component.admitted.outputs.keys()], "component");
      for (const [name, payload] of component.admitted.outputs) if (!actual.outputs.get(name)!.equals(payload)) throw new Error("Guide component changed during manifest publication: " + name);
    }
  },
});
console.log("[head-authoring-inputs]", manifest.files.length, "maintained TypeScript/data input records");
