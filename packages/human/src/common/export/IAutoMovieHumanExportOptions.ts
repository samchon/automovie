/**
 * Optional source-part identity request shared by the human glTF writers.
 *
 * `createGltfDocument` reads it directly, and `exportHumanBody` forwards it as
 * its third argument. Only `true` opts in; omission, `undefined` and `false`
 * leave the source-part namespace absent, independently of any physical
 * correspondence the model carries. An articular report in `exportHumanBody`
 * always writes source-part identity regardless of this option.
 *
 * @evidence contracts/common.md#principled-implementation One option type serves the common writer and the body exporter, so the opt-in has a single definition.
 * @evidence contracts/common.md#clear-and-simple-design One optional flag replaces anonymous options objects; both writers admit it exactly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source-part identity never certifies tissue or material names.
 * @evidence contracts/common.md#meaningful-documentation States the opt-in value, the defaults and the interaction with an articular report.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanExportOptions {
  /** Write source part IDs and prepared intervals even without an articular report. */
  sourcePartIdentity?: boolean;
}
