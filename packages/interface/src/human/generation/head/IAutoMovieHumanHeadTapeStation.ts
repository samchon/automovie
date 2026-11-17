import type { IAutoMovieLoftSectionFrame } from "../../../construction/IAutoMovieLoftSectionFrame";
import type { IAutoMovieLoftSectionPhase } from "../../../construction/IAutoMovieLoftSectionPhase";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanHeadTapeSource } from "./IAutoMovieHumanHeadTapeSource";

/**
 * Original physical-station preparations and phase readers, retaining the exact source behind each measured point.
 *
 * The interface package owns these declarations; AutoMovieHumanHeadTapeStation in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Original physical-station preparations and phase readers, retaining the exact source behind each measured point. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IValue, IPrepared, IReading, IOutput, CreateEnds, VectorLocal declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IValue, IPrepared, IReading, IOutput, CreateEnds, VectorLocal separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanHeadTapeStation exchanges the named IValue, IPrepared, IReading, IOutput, CreateEnds, VectorLocal contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanHeadTapeStation {
  /** An actual value query and the identical station that produced it.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation An actual value query and the identical station that produced it.
   * @evidence contracts/development/design.md#principled-representation `point`: Original world point, calibration mm. `source`: Same input/station preparation, not another inverse trial.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanHeadTapeSource.locate. Also types AutoMovieHumanHeadTapeSource.at.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `point`, `source`; callers supply the complete record.
   */
  export interface IValue {
    /** Original world point, calibration mm. */
    point: AutoMovieVector3Tuple;

    /** Same input/station preparation, not another inverse trial. */
    source: IPrepared;
  }

  /** One original numeric station; no inverse solve or physical2 is hidden in it.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One original numeric station; no inverse solve or physical2 is hidden in it.
   * @evidence contracts/development/design.md#principled-representation `reader`: Actual unchanged original reader owning this station. `station`: Original physical station, calibration mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadTapeStation.prepare. Also types AutoMovieHumanHeadTapeStation.endpoints, AutoMovieHumanHeadTapeStation.at.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `reader`, `station`; callers supply the complete record.
   */
  export interface IPrepared {
    /** Actual unchanged original reader owning this station. */
    readonly reader: IAutoMovieHumanHeadTapeSource.IReader;

    /** Original physical station, calibration mm. */
    readonly station: number;

    /**
     * Point0 inversion retains its exact prepared frame after a successful first read.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Point0 inversion retains its exact prepared frame after a successful first read.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. AutoMovieHumanHeadTapeStation and the callback provider must satisfy the documented point contract.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; AutoMovieHumanHeadTapeStation and its callback provider own the cost of each point invocation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. AutoMovieHumanHeadTapeStation and the callback provider determine when the inputs to point describe equivalent work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. AutoMovieHumanHeadTapeStation and the callback provider own any captured source data and the callable's lifetime.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanHeadTapeStation.IPrepared.point callable contract, without an implementation body. AutoMovieHumanHeadTapeStation and its supplied callbacks own the numerical method and admission of the documented arguments.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanHeadTapeStation.IPrepared.point declares only the invocation boundary; decomposition belongs to AutoMovieHumanHeadTapeStation and the callback provider.
     */
    point(phase: number): AutoMovieVector3Tuple;

    /**
     * Explicit phase demand reads its actual frame and shares only the numeric native source.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Explicit phase demand reads its actual frame and shares only the numeric native source.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. AutoMovieHumanHeadTapeStation and the callback provider must satisfy the documented value contract.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; AutoMovieHumanHeadTapeStation and its callback provider own the cost of each value invocation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. AutoMovieHumanHeadTapeStation and the callback provider determine when the inputs to value describe equivalent work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. AutoMovieHumanHeadTapeStation and the callback provider own any captured source data and the callable's lifetime.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanHeadTapeStation.IPrepared.value callable contract, without an implementation body. AutoMovieHumanHeadTapeStation and its supplied callbacks own the numerical method and admission of the documented arguments.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanHeadTapeStation.IPrepared.value declares only the invocation boundary; decomposition belongs to AutoMovieHumanHeadTapeStation and the callback provider.
     */
    value(phase: number): IReading;
  }

  /** Complete phase reading before the separate physical source2 request.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Complete phase reading before the separate physical source2 request.
   * @evidence contracts/development/design.md#principled-representation `point`: Original world point, calibration mm. `frame`: Actual current world frame; phase reads do not borrow an inverse trial's frame. `local`: Same native point and its first two phase derivatives.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanHeadTapeSource.original, AutoMovieHumanHeadTapeStation.local.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `point`, `frame`, `local`; callers supply the complete record.
   */
  export interface IReading {
    /** Original world point, calibration mm. */
    point: AutoMovieVector3Tuple;

    /** Actual current world frame; phase reads do not borrow an inverse trial's frame. */
    frame: IAutoMovieLoftSectionFrame;

    /** Same native point and its first two phase derivatives. */
    local: IAutoMovieLoftSectionPhase;
  }

  /** One measured course retains only its two successful endpoint preparations.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One measured course retains only its two successful endpoint preparations.
   * @evidence contracts/development/design.md#principled-representation One measured course retains only its two successful endpoint preparations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadTapeStation.create. Read by AutoMovieHumanHeadTapeSource.course. Also types AutoMovieHumanHeadTapeSource.sources.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHeadTapeSource.course, AutoMovieHumanHeadTapeSource.sources, AutoMovieHumanHeadTapeStation.create for one measured course retains only its two successful endpoint preparations.
   */
  export interface IOutput {
    /**
     * Actual Point0 and the source that produced this bracket trial.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Actual Point0 and the source that produced this bracket trial.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. AutoMovieHumanHeadTapeStation and the callback provider must satisfy the documented point contract.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; AutoMovieHumanHeadTapeStation and its callback provider own the cost of each point invocation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. AutoMovieHumanHeadTapeStation and the callback provider determine when the inputs to point describe equivalent work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. AutoMovieHumanHeadTapeStation and the callback provider own any captured source data and the callable's lifetime.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanHeadTapeStation.IOutput.point callable contract, without an implementation body. AutoMovieHumanHeadTapeStation and its supplied callbacks own the numerical method and admission of the documented arguments.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanHeadTapeStation.IOutput.point declares only the invocation boundary; decomposition belongs to AutoMovieHumanHeadTapeStation and the callback provider.
     */
    point(station: number, phase: number): IValue;

    /**
     * Read phase data from the selected trial, or its actual endpoint station.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Read phase data from the selected trial, or its actual endpoint station.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. AutoMovieHumanHeadTapeStation and the callback provider must satisfy the documented value contract.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; AutoMovieHumanHeadTapeStation and its callback provider own the cost of each value invocation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. AutoMovieHumanHeadTapeStation and the callback provider determine when the inputs to value describe equivalent work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. AutoMovieHumanHeadTapeStation and the callback provider own any captured source data and the callable's lifetime.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanHeadTapeStation.IOutput.value callable contract, without an implementation body. AutoMovieHumanHeadTapeStation and its supplied callbacks own the numerical method and admission of the documented arguments.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanHeadTapeStation.IOutput.value declares only the invocation boundary; decomposition belongs to AutoMovieHumanHeadTapeStation and the callback provider.
     */
    value(station: number, phase: number, selected?: IPrepared): IReading;
  }

  /** The ends argument of AutoMovieHumanHeadTapeStation.create. Share only exact unchanged endpoints, and carry an arbitrary selected
  bracket trial directly into its final phase read. No trial-station map,
  failed preparation, whole part or physical Hessian is cached.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Share only exact unchanged endpoints, and carry an arbitrary selected bracket trial directly into its final phase read.
 * @evidence contracts/development/design.md#principled-representation Share only exact unchanged endpoints, and carry an arbitrary selected bracket trial directly into its final phase read. The outer tuple/array is readonly; nested element types determine whether their contents can change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHeadTapeStation.CreateEnds is the canonical exchange used by AutoMovieHumanHeadTapeStation.create.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHeadTapeStation.create for share only exact unchanged endpoints, and carry an arbitrary selected bracket trial directly into its final phase read.
 */
  export type CreateEnds = readonly [number, number];

  /** The local argument of AutoMovieHumanHeadTapeStation.vector. Restore a native local vector without an origin translation.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Restore a native local vector without an origin translation.
   * @evidence contracts/development/design.md#principled-representation Restore a native local vector without an origin translation. The outer tuple/array is readonly; nested element types determine whether their contents can change.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHeadTapeStation.VectorLocal is the canonical exchange used by AutoMovieHumanHeadTapeStation.vector.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHeadTapeStation.vector for restore a native local vector without an origin translation.
   */
  export type VectorLocal = readonly [number, number];
}
