import { AUTOMOVIE_PROJECT_WINDOWS_DEVICE_NAMES } from "./AUTOMOVIE_PROJECT_WINDOWS_DEVICE_NAMES";

/**
 * Encode a storage key as its historical .json filename, escaping asterisks and the first character of a listed Windows device stem after URI encoding. The spelling is shared by read/write/order owners; lone surrogates throw URIError, and native filename length/platform rules remain external.
 *
 * @evidence contracts/common.md#principled-implementation URI encoding plus asterisk/device-stem escapes produces the historical key.json spelling.
 * @evidence contracts/common.md#clear-and-simple-design Read, write and ordering use the same persisted filename owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The explicit Windows device policy covers the old listed basenames; native length/device differences beyond it remain filesystem responsibilities.
 * @evidence contracts/common.md#meaningful-documentation States suffix-sensitive ordering, reversible percent spelling and lone-surrogate URIError.
 * @evidence contracts/performance.md#efficient-algorithms Encodes/scans L key units with proportional result storage.
 * @evidence contracts/performance.md#reuse-equivalent-work One filename per staged/sorted key is reused by its owning operation; no global id cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only text transfers and no file is opened.
 */
export const autoMovieProjectSliceFilename: (key: string) => string = (key: string): string => {
    let encoded: string = encodeURIComponent(key).replace(/\*/g, "%2A");
    const stem: string = encoded.split(".", 1)[0]!;
    if (AUTOMOVIE_PROJECT_WINDOWS_DEVICE_NAMES.test(stem))
        encoded = `%${encoded
            .charCodeAt(0)
            .toString(16)
            .toUpperCase()
            .padStart(2, "0")}${encoded.slice(1)}`;
    return `${encoded}.json`;
};
