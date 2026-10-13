

/**
 * Exact lossy predecessor used only to verify a declared v1 source digest.
 *
 * @evidence contracts/common.md#principled-implementation Node's replacement decoding, one initial BOM removal and CR/CRLF conversion reproduce the exact v1 source representation.
 * @evidence contracts/common.md#clear-and-simple-design Only explicit v1 source verification calls this predecessor after current strict normalization succeeds.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Lossy replacement decoding is preserved solely to authenticate declared legacy digests; it is not current source admission.
 * @evidence contracts/common.md#meaningful-documentation States the legacy-only role and the strict-current gate in its sole caller.
 * @evidence contracts/performance.md#efficient-algorithms Decoding, replacement and encoding traverse B bytes with proportional text and output buffers.
 * @evidence contracts/performance.md#reuse-equivalent-work The historical representation differs from current admission and is computed only for a declared v1 verification.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Its temporary output is hashed by the caller and then released; no predecessor buffer is cached.
 */
export const legacyNormalizeAutoMovieSource: (source: Uint8Array) => Uint8Array = (source: Uint8Array): Uint8Array => {
    let text: string = Buffer.from(source).toString("utf8");
    if (text.charCodeAt(0) === 0xfeff)
        text = text.slice(1);
    return Buffer.from(text.replace(/\r\n?/g, "\n"), "utf8");
};
