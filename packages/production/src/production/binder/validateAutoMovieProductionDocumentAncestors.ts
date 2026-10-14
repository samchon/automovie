import type { Stats } from "node:fs";
import * as path from "node:path";
import { AutoMovieProductionDocumentPass } from "./AutoMovieProductionDocumentPass";

/**
 * Refuse missing, linked or nondirectory authored-pass ancestors before document reading.
 *
 * @evidence contracts/common.md#principled-implementation Observes docs for construction and docs then docs/final for final, rejecting absent, linked or nondirectory observations. The injected lstat capability retains the same boundary for both reader topologies.
 * @evidence contracts/common.md#clear-and-simple-design One pass-aware ancestor rule precedes document reading; layer/leaf admission stays with their readers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Observation rejection becomes the same corrective physical-directory refusal; these sequential checks do not prevent a directory replacement after observation.
 * @evidence contracts/common.md#meaningful-documentation Defines the one/two ancestor order, observer result premise and error replacement, without claiming the selected layer or its bytes are admitted here.
 * @evidence contracts/performance.md#efficient-algorithms Performs one or two awaited metadata observations and path construction; the supplied observer owns host latency, and no document population is read.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares the same observer within a call but reobserves each distinct ancestor and every invocation rather than trusting a previous pass.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only path/status temporaries are retained until return/refusal; the capability owns any resources it opens and this validator creates no task or descriptor.
 */
export async function validateAutoMovieProductionDocumentAncestors(root: string, pass: AutoMovieProductionDocumentPass, lstat: (directory: string) => Promise<Pick<Stats, "isSymbolicLink" | "isDirectory">>): Promise<void> {
    const docs: string = path.join(root, "docs");
    const ancestors: string[] = pass === "final" ? [docs, path.join(docs, "final")] : [docs];
    for (const directory of ancestors) {
        const status: Pick<Stats, "isSymbolicLink" | "isDirectory"> | undefined = await lstat(directory).catch((): undefined => undefined);
        if (status === undefined ||
            status.isSymbolicLink() ||
            !status.isDirectory())
            throw new Error(`${directory}: authored docs must be one physical directory.`);
    }
}
