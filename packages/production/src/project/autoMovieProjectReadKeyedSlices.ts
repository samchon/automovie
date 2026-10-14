import { compareCodeUnits } from "@automovie/engine";
import path from "node:path";
import { productionFileSystem as fileSystem } from "./productionFileSystem";
import { AutoMovieProjectKeyError } from "./AutoMovieProjectKeyError";
import { autoMovieProjectReadJson } from "./autoMovieProjectReadJson";
import { autoMovieProjectSliceKeyFromFilename } from "./autoMovieProjectSliceKeyFromFilename";
import type { IAutoMovieProjectState } from "./IAutoMovieProjectState";

/**
 * Read sorted .json members of a project directory, skip absent or parsed-null values, and require each record's projected identity to equal its decoded filename key before optional validation. Returned records retain parsed identity under caller ownership. Generic T and key matching alone do not admit the complete field schema, and file observations are sequential.
 *
 * @evidence contracts/common.md#principled-implementation Sorted .json names are parsed, URI-decoded and checked against supplied keys before optional validation.
 * @evidence contracts/common.md#clear-and-simple-design One directory reader serves scene, shot, beat-end, prop and actor storage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Generic T is no schema proof; parsed nulls are skipped and callers select deeper validation.
 * @evidence contracts/common.md#meaningful-documentation States callbacks, optional validator, order and key mismatch refusal.
 * @evidence contracts/performance.md#efficient-algorithms Lists/sorts F names, reads B bytes and includes every callback cost; trees scale with population.
 * @evidence contracts/performance.md#reuse-equivalent-work One parse feeds identity and semantic checks; no cross-read cache stands for current bytes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Callers own records; readers close descriptors and no local size cap exists.
 */
export function autoMovieProjectReadKeyedSlices<T>(_project: IAutoMovieProjectState, dir: string, key: {
    /** Key role named by a filename/internal-identity mismatch. */
    label: string;

    /** Project the expected stored identity from this decoded filename key. */
    expected: (fileKey: string) => string;

    /** Read the actual internal identity from the parsed record; null/undefined remain mismatch values. */
    actual: (value: T) => string | null | undefined;
}, validate?: (file: string, value: T) => void): T[] {
    const base: string = path.join(_project.root, dir);
    const out: T[] = [];
    for (const name of fileSystem
        .readdirSync(base)
        .filter((name: string): boolean => name.endsWith(".json"))
        .sort(compareCodeUnits)) {
        const file: string = path.join(base, name);
        const value: T | null = autoMovieProjectReadJson<T>(_project.root, file);
        if (value === null)
            continue;
        const fileKey: string = autoMovieProjectSliceKeyFromFilename(file, name);
        const expected: string = key.expected(fileKey);
        const actual: string | null | undefined = key.actual(value);
        if (actual !== expected)
            throw new AutoMovieProjectKeyError(file, key.label, expected, actual);
        validate?.(file, value);
        out.push(value);
    }
    return out;
}
