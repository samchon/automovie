import fs from "node:fs";
import path from "node:path";
import { AUTOMOVIE_PRODUCTION_PROJECT_MARKERS } from "./AUTOMOVIE_PRODUCTION_PROJECT_MARKERS";

/**
 * Find the nearest ancestor containing both supported project marker paths.
 *
 * @evidence contracts/common.md#principled-implementation Resolves the host seed, converts an existing file seed to its parent and walks native ancestors until package.json and lint.config.ts both exist; process.cwd is evaluated only when the seed is omitted.
 * @evidence contracts/common.md#clear-and-simple-design Context construction and service opening share the same discovery rule before project admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Marker existence does not parse identity, require regular markers or prove an immutable/physical root; AutoMovieProductionProject.open owns later storage admission.
 * @evidence contracts/common.md#meaningful-documentation Defines nearest lexical ancestor selection, default seed and terminal no-project refusal without claiming a scaffold created any state tree.
 * @evidence contracts/performance.md#efficient-algorithms At depth D probes up to two markers per ancestor plus initial seed metadata and path construction; native stat latency and path lengths contribute to cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Marker paths are module-owned constants reused across visits, while every discovery request observes the namespace afresh.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Path strings expire after return/refusal and no descriptor or watcher is retained; the returned root is only a path.
 */
export const findAutoMovieProjectRoot: (seed?: string) => string = (seed: string = process.cwd()): string => {
    const resolved: string = path.resolve(seed);
    let current: string = fs.existsSync(resolved) && fs.statSync(resolved).isFile()
        ? path.dirname(resolved)
        : resolved;
    for (;;) {
        if (AUTOMOVIE_PRODUCTION_PROJECT_MARKERS.every((marker: string): boolean => fs.existsSync(path.join(current, ...marker.split("/")))))
            return current;
        const parent: string = path.dirname(current);
        if (parent === current)
            throw new Error(`No AutoMovie project was found above host seed "${resolved}". Run inside a generated project that carries both ${AUTOMOVIE_PRODUCTION_PROJECT_MARKERS.join(" and ")}.`);
        current = parent;
    }
};
