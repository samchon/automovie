import path from "node:path";
import { productionProjectEncodeId } from "./productionProjectEncodeId";

/**
 * Address a production's encoded tracked-design namespace.
 *
 * @evidence contracts/common.md#principled-implementation Encodes the id as one admitted segment and joins the fixed automovie/design layout under the selected root; physical containment remains the consuming reader's responsibility.
 * @evidence contracts/common.md#clear-and-simple-design Keeps constructor, graph and static-design reader routing on one layout formatter rather than copying its path segments.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the same segment encoding for every production, with no filesystem creation or existence inference from the formatted path.
 * @evidence contracts/common.md#meaningful-documentation The result is the production-local design directory address, distinct from the project-shared model/formation directory and from physical namespace admission.
 * @evidence contracts/performance.md#efficient-algorithms Path joining and id encoding cost time/space proportional to root and id lengths, without directory enumeration or content parsing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Pure address formatting has no acquired work or effect to share; consumers retain the resulting namespace string for their own lifetime.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one string and opens no descriptor, lease, directory or task; later consumers own physical fencing and any created records.
 */
export function productionProjectProductionDesignRootOf(root: string, productionId: string): string {
    return path.join(root, "automovie", "design", productionProjectEncodeId(productionId));
}
