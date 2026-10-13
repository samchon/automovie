


/** Maximum bytes admitted from one Markdown source.
 *
 * The reader checks this inclusive 8 MiB source-byte ceiling before bounded read allocation, and the parser checks it before decoding. Scalar lookup is O(1); each source operation owns copying and parsing costs under the shared boundary, while the module-owned constant retains no source bytes or handles.
 */
export const MAX_SOURCE_BYTES: number = 8_388_608;
