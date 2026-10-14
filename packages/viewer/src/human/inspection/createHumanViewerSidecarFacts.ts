import { createHash } from "node:crypto";
import { promisify } from "node:util";
import { gunzip } from "node:zlib";

import type { ICreateHumanViewerSidecarFactsProps } from "./ICreateHumanViewerSidecarFactsProps.js";
import type { IHumanViewerSidecarFacts } from "./IHumanViewerSidecarFacts.js";
import { readHumanViewerBasisIdentity } from "./readHumanViewerBasisIdentity.js";
import { readHumanViewerPersonSidecar } from "./readHumanViewerPersonSidecar.js";
import { scanHumanViewerPacketIdentities } from "./scanHumanViewerPacketIdentities.js";

const gunzipAsync: (buffer: Uint8Array) => Promise<Buffer> = promisify(gunzip);

/**
 * Learn each candidate sidecar's digest and identity without a synchronous whole-file catalogue read. The supplied stream yields chunks for event-loop hashing; packet/view inflation is asynchronous, while buffer concatenation and the subsequent structural scan still process the complete file synchronously on the event loop without yielding. Until facts are known `facts` answers null; storing them calls `changed` so the host can republish its catalogue. A matching provider stamp reuses known facts, including a retained read failure. Stamp equality depends on the provider: mtime/size can miss byte changes that preserve both values, and in-flight reads do not claim an atomic file snapshot against arbitrary external rewrites.
 *
 * @evidence contracts/common.md#principled-implementation Streaming hashes compressed bytes while asynchronous inflation feeds the existing packet/basis identity readers; pending files remain unknown until actual facts or a read failure are stored.
 * @evidence contracts/common.md#clear-and-simple-design Known facts, current read stamps and request promises separate memo identity, replacement selection and settlement without synchronous whole-file catalogue reads.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A result whose stamp differs from the currently tracked stamp cannot publish. Repeated stamps, including A-to-B-to-A, do not distinguish request generations; failures remain named facts and equal stamps prove neither fresh nor atomic bytes.
 * @evidence contracts/common.md#meaningful-documentation Documentation distinguishes stream hashing, asynchronous inflate, event-loop structural scanning, pending state and stamp/snapshot limitations.
 * @evidence contracts/performance.md#efficient-algorithms Hashing and identity scanning are linear in file bytes, but compressed chunks plus concatenated and inflated buffers can overlap; structural scanning still executes on the event loop.
 * @evidence contracts/performance.md#reuse-equivalent-work Equal file path and provider stamp reuse facts or the currently tracked read; a changed stamp starts another read. Publication compares the current stamp rather than request identity, so an earlier same-stamp read can publish after stamp recurrence and preserved-stamp rewrites can reuse old facts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Completed requests leave in-flight/request maps; known facts retain encountered paths without an independent cap, simultaneous reads have no byte/concurrency cap here and buffers remain until their actual read/scan settles.
 */
export function createHumanViewerSidecarFacts(
  props: ICreateHumanViewerSidecarFactsProps,
): {
  facts: (file: string) => IHumanViewerSidecarFacts | null;
  busy: (files?: readonly string[]) => boolean;
  settled: (files?: readonly string[]) => Promise<void>;
} {
  const known: Map<string, IHumanViewerSidecarFacts> = new Map();
  const reading: Map<string, string> = new Map();
  const inFlight: Set<Promise<void>> = new Set();
  const requests: Map<string, Promise<void>> = new Map();
  const read: (
    file: string,
    stamp: string,
  ) => Promise<IHumanViewerSidecarFacts> = async (
    file: string,
    stamp: string,
  ): Promise<IHumanViewerSidecarFacts> => {
    const hash: ReturnType<typeof createHash> = createHash("sha256");
    const chunks: Buffer[] = [];
    for await (const chunk of props.stream(file)) {
      hash.update(chunk);
      chunks.push(chunk);
    }
    const bytes: Buffer = Buffer.concat(chunks);
    const facts: IHumanViewerSidecarFacts = {
      stamp,
      digest: hash.digest("hex"),
      basis: null,
      packet: null,
      view: null,
      failure: null,
    };
    try {
      const kind: ReturnType<ICreateHumanViewerSidecarFactsProps["kind"]> =
        props.kind(file);
      if (kind === "person")
        facts.packet = readHumanViewerPersonSidecar(await gunzipAsync(bytes));
      else if (kind === "view")
        facts.view = scanHumanViewerPacketIdentities(await gunzipAsync(bytes));
      else facts.basis = readHumanViewerBasisIdentity(bytes);
    } catch (error) {
      facts.failure = error instanceof Error ? error.message : String(error);
    }
    return facts;
  };
  return {
    /** The file's facts at its current stamp, or null while they are being read. */
    facts: (file: string): IHumanViewerSidecarFacts | null => {
      const stamp: string = props.stamp(file);
      const kept: IHumanViewerSidecarFacts | undefined = known.get(file);
      if (kept !== undefined && kept.stamp === stamp) return kept;
      if (reading.get(file) !== stamp) {
        reading.set(file, stamp);
        const request: Promise<void> = read(file, stamp)
          .catch(
            (error: unknown): IHumanViewerSidecarFacts => ({
              stamp,
              digest: "",
              basis: null,
              packet: null,
              view: null,
              failure:
                "Could not read: " +
                (error instanceof Error ? error.message : String(error)),
            }),
          )
          .then((facts: IHumanViewerSidecarFacts): void => {
            // A different stamp is currently tracked; this result is outdated.
            if (reading.get(file) !== stamp) return;
            reading.delete(file);
            known.set(file, facts);
            props.changed();
          })
          .catch((error: unknown): void => {
            console.error(
              "Sidecar facts could not be published for " +
                file +
                ": " +
                (error instanceof Error ? error.message : String(error)),
            );
          })
          .finally((): void => {
            inFlight.delete(request);
            if (requests.get(file) === request) requests.delete(file);
          });
        inFlight.add(request);
        requests.set(file, request);
      }
      return null;
    },

    /** Whether any read remains globally, or a selected path's latest registered read remains; displaced older reads may still run. */
    busy: (files?: readonly string[]): boolean =>
      files === undefined
        ? inFlight.size !== 0
        : files.some((file: string): boolean => requests.has(file)),

    /** Await all in-flight reads globally, or successive latest registered reads for selected paths; displaced reads may remain and completion need not publish facts. */
    settled: async (files?: readonly string[]): Promise<void> => {
      if (files !== undefined) {
        while (files.some((file: string): boolean => requests.has(file)))
          await Promise.all(
            files.flatMap((file: string): Promise<void>[] => {
              const request: Promise<void> | undefined = requests.get(file);
              return request === undefined ? [] : [request];
            }),
          );
        return;
      }
      while (inFlight.size !== 0) await Promise.all([...inFlight]);
    },
  };
}
