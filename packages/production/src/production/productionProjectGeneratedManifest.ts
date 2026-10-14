import { IAutoMovieGeneratedManifest } from "@automovie/interface";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectLoadGeneratedManifest } from "./productionProjectLoadGeneratedManifest";
import { productionProjectRefreshRevision } from "./productionProjectRefreshRevision";

/**
 * Read the admitted generated manifest, or null for optional record absence.
 *
 * @evidence contracts/common.md#principled-implementation Refreshes the production namespace/revision then delegates owned-file JSON schema admission to loadGeneratedManifest; absent and malformed present records remain distinct.
 * @evidence contracts/common.md#clear-and-simple-design Separates currentness coordination from the generated manifest path/schema reader and preserves the facade's optional return shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not rebuild generated output or return a cached manifest after read failure; manifest schema validity alone does not prove every generated artifact's bytes.
 * @evidence contracts/common.md#meaningful-documentation Null means the optional tracked manifest is absent, while successful data is a typed current read requiring separate generated artifact identity checks.
 * @evidence contracts/performance.md#efficient-algorithms Includes refresh and a complete manifest read/parse/validation proportional to manifest bytes and nested records, without reading generated output payloads.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call reads the tracked manifest anew; returned data can be shared within the caller's attempt but is not memoized across revisions or file changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns parsed manifest data and delegated file acquisition closes its descriptor; this operation retains neither payload buffers nor tasks.
 */
export function productionProjectGeneratedManifest(state: AutoMovieProductionProjectState): IAutoMovieGeneratedManifest | null {
    productionProjectRefreshRevision(state);
    return productionProjectLoadGeneratedManifest(state);
}
