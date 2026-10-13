


/** Maximum bytes admitted from one Markdown source.
 *
 * The 8 MiB limit is the shared source-byte admission ceiling checked before decoding and bounded read allocation.
 * One named byte ceiling is reused by host reader and parser rather than duplicated policy literals.
 * The constant represents a documented resource boundary, with no consumer-specific exception.
 * The comment states maximum admitted Markdown source bytes.
 * Reading this scalar is O(1); source operations account for copying and parsing under its bound.
 * All source consumers share this fixed process-owned policy value.
 * One scalar is retained for module lifetime without source bytes or handles.
 */
export const MAX_SOURCE_BYTES: number = 8_388_608;
