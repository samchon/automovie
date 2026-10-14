/**
 * Anatomical navigation over one immutable connected facial basis. The tree
 * owns the presentation of every fine shape/expression channel, resident
 * surface and supported non-channel document field exactly once. It does not
 * split the continuous skin or replace the flat numerical document: a nose,
 * lid, lip and ear can be distinct controls over the same `Human` surface.
 * A selected application's source basis supplies this tree separately, so a
 * different basis must declare its own component meanings rather than inherit
 * labels by channel spelling or a person's name.
 *
 * @evidence contracts/common.md#principled-implementation Exact basis revision and an authored unaliased tree present every channel/surface and the current closed DocumentField vocabulary once, keeping navigation ownership separate from continuous physical skin and flat replay order.
 * @evidence contracts/common.md#clear-and-simple-design One root owns ordered Nodes; the compiler returns copied tree and label paths while the numerical document remains independent.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Labels are not inferred from a person's name or channel spelling; stale revision, cycles, shared nodes and missing/duplicate supported owners refuse in the compiler.
 * @evidence contracts/common.md#meaningful-documentation The comment states application-authored navigation and continuous-skin ownership, with Node and DocumentField defining the supported populations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This schema runs no tree walk, path compilation or ownership validation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The authored hierarchy defines no cached paths or repeated compile strategy.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The application owns the recursive tree; this type acquires no geometry or renderer resource.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceComponentTree {
  /** Exact connected basis revision whose channels and surfaces are named. */
  basis: string;

  /** One face root containing every component below it. */
  root: IAutoMovieHumanFaceComponentTree.Node;
}

export namespace IAutoMovieHumanFaceComponentTree {
  /**
   * One named anatomical scope. `channels` own authoring coordinates while
   * `surfaces` name physical mesh owners; a child may affect a surface owned
   * by an ancestor. Appearance fields have no shape endpoint in the basis.
   * Empty arrays are valid for a parent that only groups its children.
   *
   * @evidence contracts/common.md#principled-implementation A named scope assigns channels, physical surfaces, supported non-channel fields and child presentation independently; a descendant's channel can affect its ancestor's continuous skin.
   * @evidence contracts/common.md#clear-and-simple-design Stable identity differs from label/description, and the four ordered populations make direct ownership versus child grouping explicit.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Shared node instances and cycles do not form a tree, empty leaves are not meaningful groups and anatomical labels certify no tissue mechanics.
   * @evidence contracts/common.md#meaningful-documentation Members state stable identity, interpretation, channel/surface ownership, supported document fields and ordered unaliased children.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This interface executes no recursive validation or path construction.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Node identity supplies hierarchy inputs, not a computed-path cache or geometry reuse.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The application owns arrays and child nodes; the compiler copies them and this declaration launches no task.
   *
   * @author Samchon
   */
  export interface Node {
    /** Stable identity unique across this tree, independent of the label. */
    id: string;

    /** Human-facing anatomical or appearance name. */
    label: string;

    /** What belongs here and what the name does not imply about tissue. */
    description: string;

    /** Basis shape/expression channel IDs owned directly by this node. */
    channels: string[];

    /** Basis surface IDs owned directly; descendants may still deform them. */
    surfaces: string[];

    /** Supported non-channel document fields owned directly, including optics and anatomy. */
    documentFields: DocumentField[];

    /** Ordered anatomical subgroups. A shared node instance is not a tree. */
    children: Node[];
  }

  /**
   * Data authored outside the flat basis channels: appearance (hair, iris,
   * skin, materials), independent shape inputs (eye optics, lash profiles) and
   * the anatomical record of measurement targets and observations.
   * This closed navigation vocabulary does not enumerate every newer numerical document section.
   *
   * @evidence contracts/common.md#principled-implementation Seven supported non-channel fields identify appearance, optical/lash inputs and anatomical records for the current component-tree compiler.
   * @evidence contracts/common.md#clear-and-simple-design One literal vocabulary joins Node ownership and document label-path lookup without duplicating geometry or record contents.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The list is not a claim that every newer BasisDocument section is navigable, and fields create no flat shape endpoint or biological preset.
   * @evidence contracts/common.md#meaningful-documentation The comment distinguishes appearance from independent geometry/anatomical records and states the vocabulary's current scope.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This erased union performs no field admission or navigation lookup.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Literal field identity defines no path cache or shared document evaluation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No document buffer, geometry or task is acquired by the vocabulary.
   *
   * @author Samchon
   */
  export type DocumentField =
    | "hair"
    | "iris"
    | "skin"
    | "materials"
    | "eyes"
    | "lashes"
    | "anatomical";
}
