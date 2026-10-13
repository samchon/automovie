import { compareCodeUnits } from "@automovie/engine";

/**
 * Exact predecessor algorithm, used only to verify a declared v1 digest.
 *
 * Its verification caller first admits the same value through identifyAutoMovieCanonicalJson. If that graph remains unchanged, numbers are finite, bigint is absent and the root has a JSON representation; this predecessor reproduces v1 object ordering, omission and historical array-hole spelling. Reflection on a mutable Proxy can observe changed values on the second pass, and verification catches any resulting refusal rather than treating prior admission as an immutable lease.
 *
 * @evidence contracts/common.md#principled-implementation The recursive predecessor preserves v1 object sorting, omission and map/join array-hole spelling after v2 admitted the same value.
 * @evidence contracts/common.md#clear-and-simple-design Only explicit legacy JSON verification uses this compatibility encoder; current JSON remains engine-owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The caller's prior v2 pass establishes finite scalar-safe acyclic values; repeated reflection can still invoke Proxy traps and no immutable graph is enforced.
 * @evidence contracts/common.md#meaningful-documentation States admitted-domain premises and the intentional historical array-hole difference.
 * @evidence contracts/performance.md#efficient-algorithms Re-encodes each tree occurrence with per-object key sorting and proportional intermediate text; recursion and expanded output have no independent bound.
 * @evidence contracts/performance.md#reuse-equivalent-work The v2 result is not a substitute for v1 spelling; predecessor bytes are recomputed only when a declared v1 digest needs authentication.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Call-local recursive text/arrays expire after hashing or failure; no handles or cross-call graph references are retained.
 */
export const legacyCanonicalizeJson: (value: unknown) => string = (value: unknown): string => {
    const encode: (current: unknown, arrayItem: boolean) => string | undefined = (current: unknown, arrayItem: boolean): string | undefined => {
        if (current === undefined ||
            typeof current === "function" ||
            typeof current === "symbol")
            return arrayItem ? "null" : undefined;
        if (Array.isArray(current))
            return `[${current.map((item: unknown) : string => encode(item, true)!).join(",")}]`;
        if (typeof current === "object" && current !== null) {
            const record: Record<string, unknown> = current as Record<string, unknown>;
            const entries: string[] = Object.keys(record)
                .sort(compareCodeUnits)
                .flatMap((key: string): string[] => {
                const encoded: string | undefined = encode(record[key], false);
                return encoded === undefined
                    ? []
                    : [`${JSON.stringify(key)}:${encoded}`];
            });
            return `{${entries.join(",")}}`;
        }
        return JSON.stringify(current);
    };
    return encode(value, false)!;
};
