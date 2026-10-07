import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { IHumanSourceUpstreamLock } from "./structures/IHumanSourceUpstreamLock.ts";
import type { IHumanSourceAcquisition } from "./structures/IHumanSourceAcquisition.ts";
import type { IHumanSourceAcquisitionReading } from "./structures/IHumanSourceAcquisitionReading.ts";

/** Read and reverify the exact acquisition receipt used by this invocation.
 * Consumed content and license digests must match the existing pinned lock.
 * The raw receipt remains run evidence, because download state and physical
 * locators do not distinguish portable source content. Missing or changed
 * bytes refuse publication without modifying the acquired source.
 * @author Samchon
 */
export function readHumanSourceAcquisition(work: string, lock: IHumanSourceUpstreamLock,
  lockSha256: string): IHumanSourceAcquisitionReading {
  const file = path.join(work, "acquisition.json"), bytes = fs.readFileSync(file);
  const acquisition = JSON.parse(bytes.toString("utf8")) as IHumanSourceAcquisition;
  if (acquisition.observeOnly !== false || acquisition.lockSha256 !== lockSha256 ||
      !Array.isArray(acquisition.sources) || new Set(acquisition.sources.map((source) => source.name)).size !== acquisition.sources.length)
    throw new Error("The work directory lacks one verified acquisition for the current upstream lock.");
  for (const source of lock.sources) {
    if (!source.consumed) continue;
    const actual = acquisition.sources.find((entry) => entry.name === source.name);
    if (actual?.contentSha256 !== source.contentSha256 || Object.entries(source.licenses).some(([name, digest]) => actual.licenses?.[name] !== digest))
      throw new Error(`Consumed source ${source.name} lacks its exact content and license authority.`);
  }
  return { acquisition, sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
    verifyUnchanged: () => {
      if (!bytes.equals(fs.readFileSync(file))) throw new Error("Acquisition receipt changed during source production.");
    } };
}
