/**
 * Optional source-part identity request shared by the human glTF writers.
 *
 * `createGltfDocument` reads it directly, and `exportHumanBody` forwards it as
 * its third argument. Only `true` opts in; omission, `undefined` and `false`
 * leave the source-part namespace absent, independently of any physical
 * correspondence the model carries. An articular, atlas or assembly report in `exportHumanBody`
 * always writes source-part identity regardless of this option.
 *
 *
 * @evidence contracts/common.md#principled-implementation The optional boolean opts into source-part identity only when exactly true; body export additionally requires identity for its supplied qualification reports.
 * @evidence contracts/common.md#clear-and-simple-design One small option separates requested source IDs from independently preserved physical lineage and qualification namespaces.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts False or omitted identity does not fabricate source mappings; qualification writers explicitly force the mapping they need.
 * @evidence contracts/common.md#meaningful-documentation Documents default namespace absence, the body third argument and qualification-driven identity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This option schema executes no serialization algorithm; createGltfDocument owns source-interval preparation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A request flag is not a cached export or coordinated operation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no resource; exporter/caller own the document and bytes.
 *
 *
 * @author Samchon
 */
export interface IAutoMovieHumanExportOptions {
  /** Write source part IDs and prepared intervals even without an articular report. */
  sourcePartIdentity?: boolean;
}
