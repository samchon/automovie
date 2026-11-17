import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanWeb } from "./IAutoMovieHumanWeb";
import type { IAutoMovieHumanWebChild } from "./IAutoMovieHumanWebChild";
import type { IAutoMovieHumanWebColumn } from "./IAutoMovieHumanWebColumn";

/** The third stage of a web's build: the surface's laws, the points a row of a column takes.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The third stage of a web's build: the surface's laws, the points a row of a column takes.
 * @evidence contracts/development/design.md#principled-representation `levelOf`: A row's level in the chart of a web's child. `rowOf`: The row at a level of the chart of a web's child: the inverse of `levelOf`. `lip`: A margin's lip at a depth past the ring, as a share of its radius.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanWebSurface.of. Read by AutoMovieHumanWebMesh.of. Also types AutoMovieHumanBodyWeb.surface.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `levelOf`, `rowOf`, `lip`, `chart`, `plainAt`; callers supply the complete record.
 */
export interface IAutoMovieHumanWebSurface {
  /**
   * Dimensionless chart level at row r: -1 at the parent's ring, 0 at the crest and own.depth / web.rho at the child's section. r uses the row count supplied to AutoMovieHumanWebSurface.of and may be fractional.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A row's level in the chart of a web's child.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. IAutoMovieHumanWebSurface and the callback provider must satisfy the documented levelOf contract.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; IAutoMovieHumanWebSurface and its callback provider own the cost of each levelOf invocation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. IAutoMovieHumanWebSurface and the callback provider determine when the inputs to levelOf describe equivalent work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. IAutoMovieHumanWebSurface and the callback provider own any captured source data and the callable's lifetime.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanWebSurface.levelOf callable contract, without an implementation body. IAutoMovieHumanWebSurface and its supplied callbacks own the numerical method and admission of the documented arguments.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanWebSurface.levelOf declares only the invocation boundary; decomposition belongs to IAutoMovieHumanWebSurface and the callback provider.
   */
  levelOf: (
    r: number,
    own: IAutoMovieHumanWebChild,
    web: IAutoMovieHumanWeb,
  ) => number;

  /**
   * Fractional row at dimensionless chart level x, inverse to levelOf on the parent's-ring-to-child interval. Levels below -1 saturate to the ring's row; callers supply the same child and web used for levelOf.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The row at a level of the chart of a web's child: the inverse of `levelOf`.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. IAutoMovieHumanWebSurface and the callback provider must satisfy the documented rowOf contract.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; IAutoMovieHumanWebSurface and its callback provider own the cost of each rowOf invocation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. IAutoMovieHumanWebSurface and the callback provider determine when the inputs to rowOf describe equivalent work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. IAutoMovieHumanWebSurface and the callback provider own any captured source data and the callable's lifetime.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanWebSurface.rowOf callable contract, without an implementation body. IAutoMovieHumanWebSurface and its supplied callbacks own the numerical method and admission of the documented arguments.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanWebSurface.rowOf declares only the invocation boundary; decomposition belongs to IAutoMovieHumanWebSurface and the callback provider.
   */
  rowOf: (
    x: number,
    own: IAutoMovieHumanWebChild,
    web: IAutoMovieHumanWeb,
  ) => number;

  /**
   * Registered-frame margin point in millimetres. share is signed depth past the ring divided by the margin radius, clamped to [-1, 1]; side selects the signed margin direction, normally -1 or 1.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A margin's lip at a depth past the ring, as a share of its radius.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. IAutoMovieHumanWebSurface and the callback provider must satisfy the documented lip contract.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; IAutoMovieHumanWebSurface and its callback provider own the cost of each lip invocation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. IAutoMovieHumanWebSurface and the callback provider determine when the inputs to lip describe equivalent work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. IAutoMovieHumanWebSurface and the callback provider own any captured source data and the callable's lifetime.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanWebSurface.lip callable contract, without an implementation body. IAutoMovieHumanWebSurface and its supplied callbacks own the numerical method and admission of the documented arguments.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanWebSurface.lip declares only the invocation boundary; decomposition belongs to IAutoMovieHumanWebSurface and the callback provider.
   */
  lip: (
    web: IAutoMovieHumanWeb,
    side: number,
    share: number,
  ) => AutoMovieVector3Tuple;

  /**
   * Registered-frame point in millimetres on a column near a web, at fractional row r in the configured row count. Column and child geometry must stay unchanged while this surface retains their endpoint calculations.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A column near a web at a row: the saddle's translational chart.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. IAutoMovieHumanWebSurface and the callback provider must satisfy the documented chart contract.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; IAutoMovieHumanWebSurface and its callback provider own the cost of each chart invocation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. IAutoMovieHumanWebSurface and the callback provider determine when the inputs to chart describe equivalent work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. IAutoMovieHumanWebSurface and the callback provider own any captured source data and the callable's lifetime.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanWebSurface.chart callable contract, without an implementation body. IAutoMovieHumanWebSurface and its supplied callbacks own the numerical method and admission of the documented arguments.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanWebSurface.chart declares only the invocation boundary; decomposition belongs to IAutoMovieHumanWebSurface and the callback provider.
   */
  chart: (
    col: IAutoMovieHumanWebSurface.Plain,
    own: IAutoMovieHumanWebChild,
    r: number,
  ) => AutoMovieVector3Tuple;

  /**
   * Prepare a reader for a column away from the webs. Its fractional row argument uses the configured row count and returns registered-frame millimetres between the parent's and child's copied jets. The prepared reader owns that fixed column's sampled curve.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A column away from the webs: its point at a row, between the parent's and child's copied jets.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. IAutoMovieHumanWebSurface and the callback provider must satisfy the documented plainAt contract.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; IAutoMovieHumanWebSurface and its callback provider own the cost of each plainAt invocation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. IAutoMovieHumanWebSurface and the callback provider determine when the inputs to plainAt describe equivalent work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. IAutoMovieHumanWebSurface and the callback provider own any captured source data and the callable's lifetime.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanWebSurface.plainAt callable contract, without an implementation body. IAutoMovieHumanWebSurface and its supplied callbacks own the numerical method and admission of the documented arguments.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanWebSurface.plainAt declares only the invocation boundary; decomposition belongs to IAutoMovieHumanWebSurface and the callback provider.
   */
  plainAt: (
    col: IAutoMovieHumanWebSurface.Plain,
  ) => (r: number) => AutoMovieVector3Tuple;
}

/** Type contracts exchanged by IAutoMovieHumanWebSurface; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanWebSurface {
  /** A column away from the pinches.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A column away from the pinches.
   * @evidence contracts/development/design.md#principled-representation A column away from the pinches. Extract< IAutoMovieHumanWebColumn, { kind: "plain"; } > retains the referenced owner's constraints and mutability.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanWebSurface.Plain belongs to IAutoMovieHumanWebSurface; its public declaration is reached by the Human main-entry export closure.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A column away from the pinches. Its exported identity is retained for the existing Human public surface.
   */
  export type Plain = Extract<
    IAutoMovieHumanWebColumn,
    {
      /** Discriminant selecting the plain representation. */
      kind: "plain";
    }
  >;
}
