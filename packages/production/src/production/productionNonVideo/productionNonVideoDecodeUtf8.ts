import { TextDecoder } from "node:util";

/**
 * Decode complete borrowed bytes as fatal UTF-8 and prefix decoding refusal with the record label. Default TextDecoder BOM handling applies, so an initial UTF-8 BOM is omitted from returned text.
 *
 * @evidence contracts/common.md#principled-implementation The public UTF-8 TextDecoder with fatal:true rejects malformed sequences; a caught decoder failure becomes the existing labeled boundary error.
 * @evidence contracts/common.md#clear-and-simple-design This helper owns encoding admission only; caption plan equality and sound schema/current-owner checks stay in their callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No replacement characters repair malformed bytes and no newline or caption-content normalization is performed; initial BOM behavior follows the actual decoder default.
 * @evidence contracts/common.md#meaningful-documentation Documents fatal decoding, borrowed input, default BOM behavior and the labeled thrown refusal.
 * @evidence contracts/performance.md#efficient-algorithms Decoding scans B bytes and allocates decoded text proportional to its characters; buffer/text populations are uncapped here and bytes are not copied into another persistent store.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A fresh decoder serves one synchronous record. No completed or in-flight work is coordinated and no text result is cached across inputs.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only invocation-local decoder and text storage are acquired, with returned text owned by the caller. No file handle, retained cache or asynchronous task exists.
 */
export const productionNonVideoDecodeUtf8: (bytes: Uint8Array, label: string) => string = (bytes: Uint8Array, label: string): string => {
    try {
        return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    }
    catch {
        throw new Error(`${label} bytes are not valid UTF-8.`);
    }
};
