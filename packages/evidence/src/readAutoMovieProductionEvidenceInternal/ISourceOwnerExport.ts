import ts from "typescript-compiler";


/**
 * One exposed source owner and the AST declarations that carry its evidence.
 *
 * @evidence contracts/common.md#principled-implementation One exposed name groups its actual AST declarations and native evidence symbol kind.
 * @evidence contracts/common.md#clear-and-simple-design An internal export record supports overloads and local aliases with one owner identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts AST references describe parsed source rather than executed exports or patched module internals.
 * @evidence contracts/common.md#meaningful-documentation Members document exposed name, declaration nodes and symbol classification.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration selects no runtime algorithm; its producer owns parsing and traversal costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares representation without coordinating completed or in-flight operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased export-group type acquires no AST; exportedSourceOwners returns declaration-node groups that keep the parsed source tree reachable during sourceOwnerBindingsOf's citation join, while the published observation contains strings rather than AST nodes.
 *
 *
 * @author Samchon
 */
export interface ISourceOwnerExport {
  /** Public exposed name, including local export aliases or the default identity. */
  exportName: string;

  /** Actual declaration nodes sharing this exposed owner, including overloads. */
  nodes: readonly ts.Node[];

  /** Native evidence host category used by the graph selector. */
  symbolKind: "function" | "property" | "type";
}
