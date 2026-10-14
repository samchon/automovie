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
 * @evidence contracts/performance.md#efficient-algorithms Includes complete refresh registry/incarnation/ancestry checks, then B-byte manifest acquisition, structured parsing and exact-schema traversal. Registry validation sorts P ids and can perform O(K*P) retired-key membership work; repeated numeric-token suffix slicing in the JSON parser can add quadratic copying in B, and no generated payload is read here.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call reads the tracked manifest anew; returned data can be shared within the caller's attempt but is not memoized across revisions or file changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns parsed manifest data; delegated readers attempt descriptor cleanup and report refusal rather than guaranteeing host release. Temporary bytes, parser data and schema diagnostics follow the complete record population without a local byte cap, and this operation retains no manifest cache or task.
 */
export function productionProjectGeneratedManifest(state: AutoMovieProductionProjectState): IAutoMovieGeneratedManifest | null {
    productionProjectRefreshRevision(state);
    return productionProjectLoadGeneratedManifest(state);
}
