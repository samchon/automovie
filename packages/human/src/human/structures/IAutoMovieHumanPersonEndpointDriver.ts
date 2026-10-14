/**
 * Source registration linking a face driver-only channel's positive endpoint to an actual body endpoint gain. Head vertices, carried parts and landmarks keep source-owned rows relative to the face anchor; body state supplies the dimensionless endpoint side/corrective gain before face expression/articulation. Explicit face driver-channel authorship refuses, including zero. Missing gain reads zero in derivation, while source registration/endpoint support admission belongs to compiler/body owners; the schema alone validates no clinical mechanics.
 *
 * @evidence contracts/common.md#principled-implementation Actual face channel and body endpoint identities route the same source gain across head/body partition ownership.
 * @evidence contracts/common.md#clear-and-simple-design This channel/endpoint pair stays separate from alias ownership, body endpoint activation and numerical face row evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Face authorship cannot silently override a driver, and identifier metadata does not invent missing head rows or authentic clinical support.
 * @evidence contracts/common.md#meaningful-documentation Prose states positive-endpoint relation, dimensionless gain, evaluation order, zero omission and source-admission boundary.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This registration record runs no gain calculation, row scan or face evaluation; its compiler/derivation owners perform those operations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared endpoint authority is source correspondence, not evaluated-state memoization implemented here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two identifiers acquire no source task or geometry; the containing generation owns actual driver records and row context.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonEndpointDriver {
  /** The face view's driver channel id. */
  channel: string;

  /** The body endpoint (channel side or corrective target) whose gain drives it. */
  endpoint: string;
}
