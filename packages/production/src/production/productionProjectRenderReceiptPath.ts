import { normalizeAutoMovieProductionProjectSlash as normalizeSlash } from "./normalizeAutoMovieProductionProjectSlash";
import path from "node:path";
import { digestAutoMovieBytes } from "./contentIdentity";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";

/**
 * Derive the selected production's receipt filename from a slash-normalized bundle address.
 *
 * @evidence contracts/common.md#principled-implementation The existing slash normalizer and UTF-8 SHA-256 byte owner yield a stable key under productionStateRoot/render-receipts; consumers separately admit the bundle and resident receipt.
 * @evidence contracts/common.md#clear-and-simple-design Receipt indexing stays separate from bundle publication and content verification; every receipt reader/writer uses this same address derivation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The key contains the full address digest rather than a selected filename or fixture exception; equal normalized addresses intentionally share a key without asserting equal bundle bytes.
 * @evidence contracts/common.md#meaningful-documentation Defines normalization, selected-production location and the distinction between an index path and a verified content receipt.
 * @evidence contracts/performance.md#efficient-algorithms Normalization, UTF-8 encoding and hashing traverse address text/bytes linearly; native path joining adds the state-root length and reads no bundle payload.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pure address derivation retains no cross-request key cache; publication owners decide whether a resident receipt is current.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Normalized text, encoded bytes and hash state are call-local; one pathname escapes with no open file or retained task.
 */
export function productionProjectRenderReceiptPath(state: AutoMovieProductionProjectState, relativeBundle: string): string {
    const digest: string = digestAutoMovieBytes(Buffer.from(normalizeSlash(relativeBundle), "utf8"));
    return path.join(state.productionStateRoot, "render-receipts", `${digest.slice("sha256:".length)}.json`);
}
