import { readAutoMovieProductionProjectTypedJson as readOwnedTypedJson } from "./readAutoMovieProductionProjectTypedJson";
import path from "node:path";
import type { IValidation } from "typia";
import type { Dirent } from "node:fs";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { compareCodeUnits } from "./contentIdentity";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectEncodeId } from "./productionProjectEncodeId";
import { productionProjectOwnedRootReal } from "./productionProjectOwnedRootReal";

/**
 * Read a complete keyed design directory in code-unit filename order and refuse noncanonical or case-colliding IDs.
 *
 * @evidence contracts/common.md#principled-implementation The physical state root fences each guarded schema read; JSON file/link candidates are sorted, each admitted ID must reproduce its filename, and lower-case equality refuses distinct portable spellings before the map is returned.
 * @evidence contracts/common.md#clear-and-simple-design The caller supplies the directory and exact schema, while this operation owns complete ordered membership and filename/ID agreement for graph assembly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Linked candidates reach the guarded reader and refuse rather than being silently omitted; disappearance and case collisions throw without returning a partial or renamed population.
 * @evidence contracts/common.md#meaningful-documentation States complete discovery, sort order, schema ownership and refusal conditions; non-JSON and non-file entries are outside the selected design-file population.
 * @evidence contracts/performance.md#efficient-algorithms E directory entries are filtered and F candidates sorted in O(E+F log F); guarded parsing scales with total bytes/path depths, while the existing previous-ID case scans take O(F squared) comparisons and allocate temporary key arrays.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each graph load observes the current directory and bytes; cached path membership or an earlier valid ID does not establish an unchanged physical generation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Guarded reads close their descriptors; discovery arrays and temporary keys are local, and the F-entry map and admitted records transfer to the graph owner without a persistent directory cache.
 */
export function productionProjectReadKeyedDesigns<T extends {
    id: string;
}>(state: AutoMovieProductionProjectState, directory: string, validate: (input: unknown) => IValidation<T>): ReadonlyMap<string, T> {
    const absolute: string = directory;
    const stateRootReal: string = productionProjectOwnedRootReal(state.rootReal, state.automovieRoot);
    const output: Map<string, T> = new Map<string, T>();
    for (const entry of fileSystem
        .readdirSync(absolute, { withFileTypes: true })
        .filter((item: Dirent): boolean => (item.isFile() || item.isSymbolicLink()) &&
        item.name.endsWith(".json"))
        .sort((left: Dirent, right: Dirent): number => compareCodeUnits(left.name, right.name))) {
        const value: T | null = readOwnedTypedJson(stateRootReal, path.join(absolute, entry.name), validate);
        if (value === null)
            throw new Error(`Design file "${entry.name}" disappeared while reading.`);
        const id: string = value.id;
        if (entry.name !== `${productionProjectEncodeId(id)}.json`)
            throw new Error(`Design file "${entry.name}" does not match its content id "${id}". Rename it to the canonical portable filename.`);
        const folded: string | undefined = [...output.keys()].find((other: string): boolean => other.toLowerCase() === id.toLowerCase());
        if (folded !== undefined)
            throw new Error(`Design ids "${folded}" and "${id}" collide by case. Rename one design artifact.`);
        output.set(id, value);
    }
    return output;
}
