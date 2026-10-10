/**
 * Optional source-part identity request shared by the human glTF writers.
 *
 * `createGltfDocument` reads it directly, and `exportHumanBody` forwards it as
 * its third argument. Only `true` opts in; omission, `undefined` and `false`
 * leave the source-part namespace absent, independently of any physical
 * correspondence the model carries. An articular report in `exportHumanBody`
 * always writes source-part identity regardless of this option.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanExportOptions {
  /** Write source part IDs and prepared intervals even without an articular report. */
  sourcePartIdentity?: boolean;
}
