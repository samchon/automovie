/**
 * Anatomical navigation over one immutable connected facial basis. The tree
 * owns the presentation of every fine shape/expression channel, resident
 * surface and optional appearance document field exactly once. It does not
 * split the continuous skin or replace the flat numerical document: a nose,
 * lid, lip and ear can be distinct controls over the same `Human` surface.
 * A selected application's source basis supplies this tree separately, so a
 * different basis must declare its own component meanings rather than inherit
 * labels by channel spelling or a person's name.
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
    /** Optional document appearance fields owned directly. */
    documentFields: DocumentField[];
    /** Ordered anatomical subgroups. A shared node instance is not a tree. */
    children: Node[];
  }

  /** Appearance data that is authored outside the flat basis channels. */
  export type DocumentField = "hair" | "iris" | "skin" | "materials";
}
