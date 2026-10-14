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
 * Learn the digest and identity of each candidate sidecar off the request path. Sidecars are tens of megabytes compressed and a person packet a few hundred inflated; hashing and reading them inside a catalogue read stalled `/health` and every request for seconds. Here the file is read asynchronously (the reads run outside the JavaScript thread), each chunk is hashed on the event loop as it arrives, a packet or view inflates on the zlib thread pool, and its structural scan runs on the event loop; no step blocks for a whole file the way a synchronous read, hash and parse did. Until a file's facts are known `facts` answers null and the catalogue lists the file as being read; when they are stored, `changed` lets the host publish a catalogue that includes it. Facts stay valid while the file's stamp is unchanged, so a rescan never reads an unchanged sidecar again. A read failure is kept as the file's failure reason, never hidden. Stamp equality depends on the provider: mtime/size can miss byte changes that preserve both values, and in-flight reads do not claim an atomic file snapshot against arbitrary external rewrites.
 *
 * @evidence contracts/common.md#principled-implementation Streaming hashes compressed bytes while asynchronous inflation feeds the existing packet/basis identity readers; pending files remain unknown until actual facts or a read failure are stored.
 * @evidence contracts/common.md#clear-and-simple-design Known facts, current read stamps and request promises separate memo identity, replacement selection and settlement without synchronous whole-file catalogue reads.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An older-stamp result cannot replace a newer request, failures remain named facts and stamp equality is disclosed as provider-limited rather than fresh or atomic byte proof.
 * @evidence contracts/common.md#meaningful-documentation Documentation distinguishes stream hashing, asynchronous inflate, event-loop structural scanning, pending state and stamp/snapshot limitations.
 * @evidence contracts/performance.md#efficient-algorithms Hashing and identity scanning are linear in file bytes, but compressed chunks plus concatenated and inflated buffers can overlap; structural scanning still executes on the event loop.
 * @evidence contracts/performance.md#reuse-equivalent-work Equal file path and provider stamp reuse its facts, a changed stamp starts a distinct read and stale publication is refused; same-stamp rewrites are outside that equivalence guarantee.
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
  const read: (file: string, stamp: string) => Promise<IHumanViewerSidecarFacts> = async (
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
      const kind: ReturnType<ICreateHumanViewerSidecarFactsProps["kind"]> = props.kind(file);
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
            // A newer stamp started its own read; this result is outdated.
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

    /** Whether any sidecar read is still running. */
    busy: (files?: readonly string[]): boolean => files === undefined ? inFlight.size !== 0 : files.some((file: string): boolean => requests.has(file)),

    /** Resolves when every sidecar read already started has stored its facts. */
    settled: async (files?: readonly string[]): Promise<void> => {
      if (files !== undefined) {
        while (files.some((file: string): boolean => requests.has(file)))
          await Promise.all(files.flatMap((file: string): Promise<void>[] => {
            const request: Promise<void> | undefined = requests.get(file);
            return request === undefined ? [] : [request];
          }));
        return;
      }
      while (inFlight.size !== 0) await Promise.all([...inFlight]);
    },
  };
}
