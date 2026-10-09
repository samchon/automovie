import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { readHumanSourceAcquisition } from "./readHumanSourceAcquisition.ts";
import { readHumanSourceProducerClosure } from "./readHumanSourceProducerClosure.ts";
import { readHumanSourceSample } from "./readHumanSourceSample.ts";
import type { IHumanSourceSampleFile } from "./structures/IHumanSourceSampleFile.ts";
import type { IHumanSourceUpstreamLock } from "./structures/IHumanSourceUpstreamLock.ts";

/** Import one complete acquired native source into a new normal work directory.
 * The lock's sorted path/TAB/file-SHA/LF content digest and original license
 * texts identify upstream bytes. The existing sample owner admits complete
 * buffers, copied without frame conversion or numerical resampling. Historical
 * tool records remain original evidence; no Blender/MakeHuman extraction or
 * foreign program runs. Original data is read-only and destinations must be new.
 * Sample manifest and acquisition receipt commit last. Failed copies preserve
 * partial outputs without the normal compiler's complete input pair.
 */
export function acquireHumanSourceSample(
  originalWork: string,
  output: string,
  repository: string,
): string {
  const source = path.resolve(originalWork), destination = path.resolve(output);
  const relativeDestination = path.relative(source, destination);
  if (fs.existsSync(destination) || relativeDestination === "" ||
    (!path.isAbsolute(relativeDestination) && relativeDestination !== ".." && !relativeDestination.startsWith(".." + path.sep)))
    throw new Error("Source sample import requires a new directory outside its original source work.");
  const sha = (value: Uint8Array): string => crypto.createHash("sha256").update(value).digest("hex");
  const captured = new Map<string, IHumanSourceSampleFile>();
  const directories = new Map<string, string>();
  const bytes = (file: string, expected?: IHumanSourceSampleFile): Buffer => {
    const absolute = path.resolve(file), value = fs.readFileSync(absolute);
    const observed = { bytes: value.length, sha256: sha(value) }, previous = captured.get(absolute);
    if ((expected !== undefined && (expected.bytes !== observed.bytes || expected.sha256 !== observed.sha256)) ||
      (previous !== undefined && (previous.bytes !== observed.bytes || previous.sha256 !== observed.sha256)))
      throw new Error("Acquired source input differs from its pinned bytes: " + absolute);
    captured.set(absolute, observed);
    return value;
  };
  const lockFile = path.join(repository, "test/scripts/human-source/upstream-lock.json");
  const lockBytes = bytes(lockFile), lock = JSON.parse(lockBytes.toString("utf8")) as IHumanSourceUpstreamLock;
  const acquisitionBytes = bytes(path.join(source, "acquisition.json"));
  const acquisition = readHumanSourceAcquisition(source, lock, sha(lockBytes));
  const sample = readHumanSourceSample(path.join(source, "sample"));
  if (sample.manifest.neutralRecoveryMetres !== 0 || sample.manifest.landmarkRecoveryMetres !== 0)
    throw new Error("Imported sample must retain exact original neutral and joint recovery.");
  bytes(path.join(sample.directory, "manifest.json"), { bytes: sample.manifestBytes.length, sha256: sha(sample.manifestBytes) });
  const upstream = new Map<string, Map<string, IHumanSourceSampleFile>>();
  for (const entry of lock.sources) {
    if (!entry.consumed) continue;
    if (entry.name === "" || entry.name === "." || entry.name === ".." || path.basename(entry.name) !== entry.name || /[\\/:]/u.test(entry.name))
      throw new Error("Acquired upstream source needs a direct portable name.");
    const root = path.join(source, "upstream", entry.name), files = new Map<string, IHumanSourceSampleFile>();
    const visit = (directory: string): void => {
      const members = fs.readdirSync(directory, { withFileTypes: true });
      directories.set(directory, JSON.stringify(members.map((item) => item.name).sort((a, b) => a < b ? -1 : a > b ? 1 : 0)));
      for (const item of members) {
        const file = path.join(directory, item.name);
        if (item.isSymbolicLink()) throw new Error("Acquired upstream must remain ordinary recorded files: " + file);
        if (item.isDirectory()) visit(file);
        else if (item.isFile()) {
          bytes(file);
          files.set(path.relative(root, file).replaceAll("\\", "/"), captured.get(path.resolve(file))!);
        } else throw new Error("Acquired upstream contains an unsupported file kind: " + file);
      }
    };
    visit(root);
    const ordered = [...files].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
    const content = Buffer.from(ordered.map(([name, file]) => name + "\t" + file.sha256 + "\n").join(""));
    if (files.size !== entry.contentFiles || sha(content) !== entry.contentSha256 ||
      Object.entries(entry.licenses).some(([name, digest]) => files.get(name)?.sha256 !== digest) ||
      (entry.entries !== undefined && (entry.entries.length !== files.size || entry.entries.some((name) => !files.has(name)))))
      throw new Error("Acquired upstream content or original license differs from the pinned lock: " + entry.name);
    upstream.set(entry.name, files);
  }
  for (const [name, expected] of Object.entries(sample.manifest.files)) {
    if (name === "" || name === "." || name === ".." || path.basename(name) !== name || /[\\/:]/u.test(name))
      throw new Error("Acquired sample requires direct portable content names.");
    bytes(path.join(sample.directory, name), expected);
  }
  const producer = readHumanSourceProducerClosure(repository, "test/scripts/human-source/sample-source-generation.ts");
  const verifyInputs = (): void => {
    producer.verifyUnchanged(); acquisition.verifyUnchanged();
    for (const [directory, membership] of directories)
      if (JSON.stringify(fs.readdirSync(directory).sort((a, b) => a < b ? -1 : a > b ? 1 : 0)) !== membership)
        throw new Error("Acquired upstream membership changed during import: " + directory);
    for (const [file, expected] of captured) bytes(file, expected);
  };
  verifyInputs();
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.mkdirSync(destination);
  const copy = (original: string, target: string, expected: IHumanSourceSampleFile): void => {
    const value = bytes(original, expected);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, value, { flag: "wx" });
    const actual = fs.readFileSync(target);
    if (actual.length !== expected.bytes || sha(actual) !== expected.sha256)
      throw new Error("Imported copy differs from its recorded input: " + target);
  };
  for (const [name, files] of upstream)
    for (const [relative, expected] of files)
      copy(path.join(source, "upstream", name, relative), path.join(destination, "upstream", name, relative), expected);
  for (const [name, expected] of Object.entries(sample.manifest.files))
    copy(path.join(sample.directory, name), path.join(destination, "sample", name), expected);
  // Historical host facts remain evidence only, outside portable sample content.
  const historicalEnvironment = path.join(sample.directory, "run-environment.json");
  if (fs.existsSync(historicalEnvironment)) {
    const value = bytes(historicalEnvironment);
    copy(historicalEnvironment, path.join(destination, "sample", "run-environment.json"), { bytes: value.length, sha256: sha(value) });
  }
  verifyInputs();
  fs.writeFileSync(path.join(destination, "sample", "manifest.json"), sample.manifestBytes, { flag: "wx" });
  fs.writeFileSync(path.join(destination, "sample-import-receipt.json"), JSON.stringify({
    schema: "automovie-acquired-source-sample-import/1", sourceAcquisitionSha256: sha(acquisitionBytes),
    lockSha256: sha(lockBytes), sampleManifestSha256: sha(sample.manifestBytes), sampleFiles: sample.manifest.files,
    upstream: lock.sources.filter((entry) => entry.consumed).map((entry) => ({ name: entry.name, contentSha256: entry.contentSha256, licenses: entry.licenses, rights: entry.rights })),
    qualification: "Exact import of a preserved licensed complete native sample; historical tools and uncertainty retained. No fresh MPFB extraction, new geometry, clinical or rendered acceptance.",
  }, null, 2) + "\n", { flag: "wx" });
  verifyInputs();
  fs.writeFileSync(path.join(destination, "acquisition.json"), acquisitionBytes, { flag: "wx" });
  return destination;
}
