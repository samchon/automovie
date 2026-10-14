import { compareCodeUnits } from "./contentIdentity";
import { IAutoMovieProductionProjectProductionRegistry } from "./IAutoMovieProductionProjectProductionRegistry";
import { productionProjectIsUuid } from "./productionProjectIsUuid";
import { productionProjectValidateProductionId } from "./productionProjectValidateProductionId";
import { productionProjectPortableProductionKey } from "./productionProjectPortableProductionKey";

/**
 * Admit portable registry ids and normalize the retained tracked registry shape.
 *
 * @evidence contracts/common.md#principled-implementation Requires version 1, layout 0/1 and trimmed production strings, validates each id and rejects duplicate encoded lowercase keys, then checks any historical inline incarnations before returning a code-unit-sorted id list.
 * @evidence contracts/common.md#clear-and-simple-design One validator serves opening, registration, migration and current-id reads; its normalized result deliberately omits retired inline incarnations because resident generation records own currentness.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or malformed registry data refuses rather than becoming an empty registry; historical incarnation keys must belong to registered ids and have UUIDv4 spelling even though the normalized publication drops that retired member.
 * @evidence contracts/common.md#meaningful-documentation States accepted versions, portable collision checks, deterministic sorting and the distinction between validated historical fields and retained current registry fields.
 * @evidence contracts/performance.md#efficient-algorithms For P production ids and K retired incarnation keys, key encoding/map work is linear in id characters, membership includes can cost O(K*P), and result sorting costs O(P log P) code-unit comparisons; storage includes keys and a detached sorted id array.
 * @evidence contracts/performance.md#reuse-equivalent-work Computes and stores each folded production key once within validation, while fresh read callers validate newly acquired records instead of caching an earlier mutable registry result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary collision maps and entry arrays are released after validation; the detached normalized registry transfers to its caller, with no filesystem handle or task acquired by the validator itself.
 */
export function productionProjectValidateProductionRegistry(value: unknown, file: string): IAutoMovieProductionProjectProductionRegistry {
    const record: (Partial<IAutoMovieProductionProjectProductionRegistry> & { incarnations?: unknown; }) | null = value as (Partial<IAutoMovieProductionProjectProductionRegistry> & {
        incarnations?: unknown;
    }) | null;
    if (record === null ||
        record === undefined ||
        record.version !== 1 ||
        (record.layoutVersion !== 0 && record.layoutVersion !== 1) ||
        Array.isArray(record.productions) === false ||
        record.productions.some((production: string): boolean => typeof production !== "string" ||
            production.trim().length === 0 ||
            production.trim() !== production))
        throw new Error(`Invalid production registry "${file}". Restore version 1 with a trimmed, portable production id list.`);
    const spellings: Map<string, string> = new Map<string, string>();
    for (const production of record.productions) {
        productionProjectValidateProductionId(production);
        const folded: string = productionProjectPortableProductionKey(production);
        const previous: string | undefined = spellings.get(folded);
        if (previous !== undefined)
            throw new Error(`Invalid production registry "${file}": production "${production}" collides with "${previous}". Keep one portable id spelling.`);
        spellings.set(folded, production);
    }
    const incarnationRecord: {} | null = record.incarnations === undefined ? {} : record.incarnations;
    if (typeof incarnationRecord !== "object" ||
        incarnationRecord === null ||
        Array.isArray(incarnationRecord) ||
        Object.entries(incarnationRecord).some(([production, incarnation]: [string, unknown]): boolean => record.productions!.includes(production) === false ||
            productionProjectIsUuid(incarnation) === false))
        throw new Error(`Invalid production registry "${file}". Production incarnations must be UUIDs keyed only by registered production ids.`);
    return {
        version: 1,
        layoutVersion: record.layoutVersion,
        productions: [...record.productions].sort(compareCodeUnits),
    };
}
