import { autoMovieProjectFormatKey } from "./autoMovieProjectFormatKey";

/**
 *
 * @evidence contracts/common.md#principled-implementation Native Error records the file, key role, expected filename identity and formatted actual optional key.
 * @evidence contracts/common.md#clear-and-simple-design Directory reads and malformed percent decoding share this keyed-slice refusal identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional actual keys keep their none spelling; explanation quoting does not authenticate or repair a filename.
 * @evidence contracts/common.md#meaningful-documentation States file/key-role context, expected-versus-actual optional identity and stable mismatch Error name.
 * @evidence contracts/performance.md#efficient-algorithms Message formatting and native stack allocation depend on explanation text and host stack behavior.
 * @evidence contracts/performance.md#reuse-equivalent-work Each current refusal creates its own message/stack rather than sharing an earlier Error.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Catching callers retain the Error; construction opens no descriptor, token or task.
 */
export class AutoMovieProjectKeyError extends Error {
    public constructor(file: string, label: string, expected: string, actual: string | null | undefined) {
        super(`AutoMovie project file "${file}" has a keyed-slice mismatch. ` +
            `Fix or remove this file, then call openProject again. ` +
            `The filename expected ${label} "${expected}", but found ${autoMovieProjectFormatKey(actual)}.`);
        this.name = "AutoMovieProjectKeyError";
    }
}
