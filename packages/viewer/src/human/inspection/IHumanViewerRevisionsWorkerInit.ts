import type { IHumanViewerRevisionsEntries } from "./IHumanViewerRevisionsEntries.js";
import type { IHumanViewerNodeInputScope } from "./IHumanViewerNodeInputScope.js";

/**
 * What the revision worker is started with: everything its digests need except file access, which it does itself, and the basis digests, which arrive with each change.
 *
 * @evidence contracts/common.md#principled-implementation Worker initialization supplies the repository root, graph entries, non-imported shared inputs and initial basis digests.
 * @evidence contracts/common.md#clear-and-simple-design File access stays inside the worker while initialization carries only graph configuration and starting authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Extra digest inputs are declared explicitly rather than supplied by hidden runtime or subject-specific dependencies.
 * @evidence contracts/common.md#meaningful-documentation Defines normalized root paths, entry graphs, cross-domain extra files and starting basis values.
 * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Worker initialization supplies the repository root, graph entries, non-imported shared inputs and initial basis digests.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity File access stays inside the worker while initialization carries only graph configuration and starting authority.
 * @author Samchon
 */
export interface IHumanViewerRevisionsWorkerInit {
  /** Same checked-loader input scope used by the host's numerical source witnesses. */
  checkedInputs?: IHumanViewerNodeInputScope;

  /**
   * Repository root with forward slashes.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Repository root with forward slashes. Worker initialization supplies the repository root, graph entries, non-imported shared inputs and initial basis digests.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Repository root with forward slashes. File access stays inside the worker while initialization carries only graph configuration and starting authority.
   */
  root: string;

  /**
   * Entry files of each digest's import graph.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Entry files of each digest's import graph. Worker initialization supplies the repository root, graph entries, non-imported shared inputs and initial basis digests.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Entry files of each digest's import graph. File access stays inside the worker while initialization carries only graph configuration and starting authority.
   */
  entries: IHumanViewerRevisionsEntries;

  /**
   * Files that change every result without being imported.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Files that change every result without being imported. Worker initialization supplies the repository root, graph entries, non-imported shared inputs and initial basis digests.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Files that change every result without being imported. File access stays inside the worker while initialization carries only graph configuration and starting authority.
   */
  extra: string[];

  /**
   * The published basis digests at start.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure The published basis digests at start. Worker initialization supplies the repository root, graph entries, non-imported shared inputs and initial basis digests.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The published basis digests at start. File access stays inside the worker while initialization carries only graph configuration and starting authority.
   */
  bases: string;
}

