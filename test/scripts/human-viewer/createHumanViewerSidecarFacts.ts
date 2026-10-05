import { createHash } from "node:crypto";
import { promisify } from "node:util";
import { gunzip } from "node:zlib";

import type { ICreateHumanViewerSidecarFactsProps } from "./ICreateHumanViewerSidecarFactsProps";
import type { IHumanViewerSidecarFacts } from "./IHumanViewerSidecarFacts";
import { readHumanViewerBasisIdentity } from "./readHumanViewerBasisIdentity";
import { readHumanViewerPersonSidecar } from "./readHumanViewerPersonSidecar";
import { scanHumanViewerPacketIdentities } from "./scanHumanViewerPacketIdentities";

const gunzipAsync = promisify(gunzip);

/**
 * Learn the digest and identity of each candidate sidecar off the request
 * path. Sidecars are tens of megabytes compressed and a person packet a few
 * hundred inflated; hashing and reading them inside a catalogue read stalled
 * `/health` and every request for seconds. Here the file is read
 * asynchronously (the reads run outside the JavaScript thread), each chunk is
 * hashed on the event loop as it arrives, a packet or view inflates on the
 * zlib thread pool, and its structural scan runs on the event loop; no step
 * blocks for a whole file the way a synchronous read, hash and parse did. Until a file's facts are known
 * `facts` answers null and the catalogue lists the file as being read; when
 * they are stored, `changed` lets the host publish a catalogue that includes
 * it. Facts stay valid while the file's stamp is unchanged, so a rescan never
 * reads an unchanged sidecar again. A read failure is kept as the file's
 * failure reason, never hidden.
 *
 * @evidence contracts/common.md#principled-implementation Reads asynchronously, hashes chunk by chunk, inflates on the zlib pool, and reports a file still being read instead of blocking for it.
 * @evidence contracts/common.md#clear-and-simple-design One owner holds sidecar facts, their stamps and the reads in flight.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A file is never admitted before its digest and identity are actually known.
 * @evidence contracts/common.md#meaningful-documentation States the pending state, the republication signal, stamp validity and failure reporting.
 */
export function createHumanViewerSidecarFacts(props: ICreateHumanViewerSidecarFactsProps) {
  const known = new Map<string, IHumanViewerSidecarFacts>();
  const reading = new Map<string, string>();
  const inFlight = new Set<Promise<void>>();
  const read = async (file: string, stamp: string): Promise<IHumanViewerSidecarFacts> => {
    const hash = createHash("sha256");
    const chunks: Buffer[] = [];
    for await (const chunk of props.stream(file)) {
      hash.update(chunk);
      chunks.push(chunk);
    }
    const bytes = Buffer.concat(chunks);
    const facts: IHumanViewerSidecarFacts = { stamp, digest: hash.digest("hex"),
      basis: null, packet: null, view: null, failure: null };
    try {
      const kind = props.kind(file);
      if (kind === "person") facts.packet = readHumanViewerPersonSidecar(await gunzipAsync(bytes));
      else if (kind === "view") facts.view = scanHumanViewerPacketIdentities(await gunzipAsync(bytes));
      else facts.basis = readHumanViewerBasisIdentity(bytes);
    } catch (error) {
      facts.failure = error instanceof Error ? error.message : String(error);
    }
    return facts;
  };
  return {
    /** The file's facts at its current stamp, or null while they are being read. */
    facts: (file: string): IHumanViewerSidecarFacts | null => {
      const stamp = props.stamp(file);
      const kept = known.get(file);
      if (kept !== undefined && kept.stamp === stamp) return kept;
      if (reading.get(file) !== stamp) {
        reading.set(file, stamp);
        const request: Promise<void> = read(file, stamp).catch((error: unknown): IHumanViewerSidecarFacts => ({ stamp,
          digest: "", basis: null, packet: null, view: null,
          failure: "Could not read: " + (error instanceof Error ? error.message : String(error)) }))
          .then((facts) => {
            // A newer stamp started its own read; this result is outdated.
            if (reading.get(file) !== stamp) return;
            reading.delete(file);
            known.set(file, facts);
            props.changed();
          }).catch((error: unknown) => {
            console.error("Sidecar facts could not be published for " + file + ": " +
              (error instanceof Error ? error.message : String(error)));
          }).finally(() => { inFlight.delete(request); });
        inFlight.add(request);
      }
      return null;
    },

    /** Whether any sidecar read is still running. */
    busy: (): boolean => inFlight.size !== 0,

    /** Resolves when every sidecar read already started has stored its facts. */
    settled: async (): Promise<void> => {
      while (inFlight.size !== 0) await Promise.all([...inFlight]);
    },
  };
}
