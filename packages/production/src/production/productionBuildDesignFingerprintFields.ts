import type { IAutoMovieFingerprintField } from "./IAutoMovieFingerprintField";
import { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import { canonicalAutoMovieJsonBytes } from "./contentIdentity";


/**
 * Encode the timed design graph in its existing deterministic field order.
 *
 * Production precedes models, world, formations, shots and acceptance; map iteration order is preserved. Null records encode explicit absent fields and other records use the shared canonical JSON domain, which can refuse unsupported values.
 *
 * @evidence contracts/common.md#principled-implementation Separate role labels preserve design-category and record identity before length-framed hashing. The project graph owner supplies map order and records; canonical JSON admits or refuses their value domain, while this projection performs no independent design validation or reordering.
 * @evidence contracts/common.md#clear-and-simple-design One internal graph projection serves the public fingerprint composer and keeps category ordering beside canonical record serialization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null differs from a present empty JSON value. Map order is not sorted or advertised as irrelevant, and no fixture id or design type bypasses canonical admission.
 * @evidence contracts/common.md#meaningful-documentation States category/map order, null encoding, canonical-domain failure and graph-owner premises.
 * @evidence contracts/performance.md#efficient-algorithms For N graph records, traversal allocates N field records and canonicalizes every present record, including nested key sorting and encoded bytes; the eventual composer hashes their complete payloads.
 * @evidence contracts/performance.md#reuse-equivalent-work Each record is encoded once in this projection, with no cross-call cache over mutable graph objects or map membership.
 * @evidence contracts/performance.md#bound-retention-and-release-resources New canonical buffers and role strings live until the composing hash releases them; the graph is borrowed and no file handle or task is acquired. Total retained bytes follow graph size without a fixed cap.
 */
export function productionBuildDesignFingerprintFields(
  graph: ReturnType<AutoMovieProductionProject["graph"]>
): IAutoMovieFingerprintField[] {
  const fields: IAutoMovieFingerprintField[] = [];
  const add: (role: string, value: unknown) => void = (role: string, value: unknown): void => {
    fields.push({
      role,
      kind: value === null ? "absent" : "canonical-json",
      payload:
        value === null ? new Uint8Array() : canonicalAutoMovieJsonBytes(value),
    });
  };
  add("design:production", graph.production);
  for (const [id, value] of graph.models) add(`design:model:${id}`, value);
  add("design:world", graph.world);
  for (const [id, value] of graph.formations)
    add(`design:formation:${id}`, value);
  for (const [id, value] of graph.shots) add(`design:shot:${id}`, value);
  for (const [id, value] of graph.acceptance)
    add(`design:acceptance:${id}`, value);
  return fields;
}
