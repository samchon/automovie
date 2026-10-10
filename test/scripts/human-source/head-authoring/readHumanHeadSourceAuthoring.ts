import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import typia from "typia";

import { readHumanSourceProducerClosure } from "../readHumanSourceProducerClosure.ts";
import { readHumanSourceAcquisition } from "../readHumanSourceAcquisition.ts";
import { readHumanSourcePublication } from "../readHumanSourcePublication.ts";
import { readHumanSourceSample } from "../readHumanSourceSample.ts";
import type { IHumanSourceUpstreamLock } from "../structures/IHumanSourceUpstreamLock.ts";
import type { IHumanHeadSourceAuthoring } from "./structures/IHumanHeadSourceAuthoring.ts";
import type { IHumanHeadSourceAuthoringManifest } from "./structures/IHumanHeadSourceAuthoringManifest.ts";
import type { IHumanHeadSourceInputEntry } from "./structures/IHumanHeadSourceInputEntry.ts";
import type { IHumanHeadSourceProfiles } from "./structures/IHumanHeadSourceProfiles.ts";
import type { IHumanHeadSourceRecipe } from "./structures/IHumanHeadSourceRecipe.ts";

/** Capture the complete native sample and source-authoring byte authority.
 * Native data is already acquired; this reader launches no Blender, Python or
 * geometry extraction. Recipes/profiles are decoded only from captured buffers.
 * The existing compiler graph owns maintained TS producer identity, while the
 * manifest owns external data identity. Mutable bytes are reobserved before
 * component publication; nothing in the original source is written or repaired.
 */
export function readHumanHeadSourceAuthoring(
  sampleDirectory: string,
  directory: string,
  repository: string,
  entryFile: string,
  recipeOverrides: ReadonlyMap<string, string> = new Map(),
): IHumanHeadSourceAuthoring {
  const root = path.resolve(directory), captured = new Map<string, Buffer>();
  const sha = (bytes: Uint8Array): string => crypto.createHash("sha256").update(bytes).digest("hex");
  const capture = (file: string, expected?: IHumanHeadSourceInputEntry): Buffer => {
    const resolved = path.resolve(file), bytes = fs.readFileSync(resolved);
    const previous = captured.get(resolved);
    if ((previous !== undefined && !previous.equals(bytes)) || (expected !== undefined &&
      (sha(bytes) !== expected.sha256 || (expected.bytes !== undefined && expected.bytes !== bytes.length))))
      throw new Error("Source authoring input differs from its original byte authority: " + resolved);
    captured.set(resolved, bytes);
    return bytes;
  };
  const manifestFile = path.join(root, "source-inputs.json");
  const manifestBytes = capture(manifestFile);
  const manifest = typia.assert<IHumanHeadSourceAuthoringManifest>(JSON.parse(manifestBytes.toString("utf8")));
  if (manifest.schema !== "automovie-canonical-head-authoring-inputs/1" || manifest.sourceId.trim() === "")
    throw new Error("Source authoring requires its original named manifest schema.");
  if (manifest.publication !== undefined) {
    if (manifest.publication !== "source-publication.json") throw new Error("Source authoring requires the common component publication authority.");
    const authority = capture(path.join(root, manifest.publication));
    const admission = readHumanSourcePublication(root, ["source-inputs.json"], "component");
    if (!admission.outputs.get("source-inputs.json")!.equals(manifestBytes) || !authority.equals(fs.readFileSync(path.join(root, manifest.publication))))
      throw new Error("Source authoring component changed during input capture.");
  }
  for (const entry of [...manifest.files, ...Object.values(manifest.recipe), ...Object.values(manifest.profiles)]) {
    if (entry.path.trim() === "" || !/^[0-9a-f]{64}$/u.test(entry.sha256)) throw new Error("Source authoring input needs a relative locator and exact SHA-256.");
    capture(path.resolve(root, entry.path), entry);
  }
  const profile = <T>(name: string): T => {
    const entry = manifest.profiles[name];
    if (entry === undefined) throw new Error("Source authoring lacks profile: " + name);
    return JSON.parse(captured.get(path.resolve(root, entry.path))!.toString("utf8")) as T;
  };
  const profiles = typia.assert<IHumanHeadSourceProfiles>({
    sourceGuide: profile("sourceGuide"), earGuide: profile("earGuide"),
    nasalSocket: profile("nasalSocket"), nasalAxis: profile("nasalAxis"),
    ...(manifest.profiles.nasalExteriorGuide === undefined ? {} : { nasalExteriorGuide: profile("nasalExteriorGuide") }),
  });
  const sample = readHumanSourceSample(path.resolve(sampleDirectory));
  capture(path.join(sample.directory, "manifest.json"), { path: "manifest.json", sha256: sha(sample.manifestBytes), bytes: sample.manifestBytes.length });
  const lockFile = path.join(repository, "test/scripts/human-source/upstream-lock.json");
  const lockBytes = capture(lockFile);
  const lock = typia.assert<IHumanSourceUpstreamLock>(JSON.parse(lockBytes.toString("utf8")));
  const work = path.dirname(sample.directory);
  capture(path.join(work, "acquisition.json"));
  const acquisition = readHumanSourceAcquisition(work, lock, sha(lockBytes));
  for (const upstream of lock.sources) if (upstream.consumed)
    for (const [name, digest] of Object.entries(upstream.licenses))
      capture(path.join(work, "upstream", upstream.name, name), { path: name, sha256: digest });
  if (profiles.sourceGuide.originalNativeCount !== sample.manifest.vertices ||
    profiles.earGuide.originalNativeCount !== sample.manifest.vertices ||
    profiles.sourceGuide.basis !== profiles.earGuide.generation ||
    (profiles.nasalExteriorGuide !== undefined && (profiles.nasalExteriorGuide.originalNativeCount !== sample.manifest.vertices || profiles.nasalExteriorGuide.basis !== profiles.sourceGuide.basis)))
    throw new Error("Head profiles have different original native source authorities.");
  const recipeEntries: Record<string, IHumanHeadSourceInputEntry> = {};
  const recipeValues: Record<string, unknown> = {};
  for (const name of ["head", "ears", "nose", "nasalExterior"]) {
    const original = manifest.recipe[name], override = recipeOverrides.get(name);
    if (original === undefined && override === undefined) {
      if (name === "nasalExterior") continue;
      throw new Error("Source authoring lacks numerical recipe: " + name);
    }
    const file = override === undefined ? path.resolve(root, original.path) : path.resolve(override);
    const bytes = override === undefined ? captured.get(file)! : capture(file);
    recipeEntries[name] = { path: path.relative(root, file).replaceAll("\\", "/"), bytes: bytes.length, sha256: sha(bytes) };
    recipeValues[name] = JSON.parse(bytes.toString("utf8"));
  }
  if ([...recipeOverrides.keys()].some((name) => !["head", "ears", "nose", "nasalExterior"].includes(name)))
    throw new Error("Source authoring refuses an unknown numerical recipe role.");
  const recipe = typia.assertEquals<IHumanHeadSourceRecipe>(recipeValues);
  const producer = readHumanSourceProducerClosure(repository, entryFile);
  return {
    directory: root, sample, manifest, manifestSha256: sha(manifestBytes), profiles,
    recipe, recipeEntries, captured,
    verifyUnchanged: () => {
      producer.verifyUnchanged();
      acquisition.verifyUnchanged();
      for (const [file, bytes] of captured) if (!bytes.equals(fs.readFileSync(file)))
        throw new Error("Source authoring input changed during production: " + file);
      for (const [name, expected] of Object.entries(sample.manifest.files)) {
        const bytes = fs.readFileSync(path.join(sample.directory, name));
        if (bytes.length !== expected.bytes || sha(bytes) !== expected.sha256)
          throw new Error("Native complete sample changed during source production: " + name);
      }
    },
  };
}
