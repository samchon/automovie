/**
 * Coarse periocular document members edited through the whole-person transaction. These names identify authored face fields; their fine model, supported basis data and numerical admission stay with Human.
 *
 * @evidence contracts/common.md#principled-implementation The closed union names the four existing face-document groups used by whole-person coarse editing without conflating them with arbitrary control paths.
 * @evidence contracts/common.md#clear-and-simple-design One shared field-name type ties periocular form and transaction code to canonical document members while fine controls remain their separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Field identity is not a named subject preset or proof that the selected source carries validated periocular anatomy.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes authored field names from numerical model, source support and admission authority.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This literal union chooses no periocular edit or geometry algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Group identity alone declares no numerical result cache or shared evaluation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Literal names acquire no document frame or worker resource and are copied as ordinary form state.
 */
export type ConnectedPersonPeriocularGroup =
  | "eyelids"
  | "periocularTissues"
  | "brows"
  | "ocularSurfaces";
