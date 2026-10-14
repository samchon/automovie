import type { IAutoMovieMaterial } from "@automovie/interface";

import type { IPortraitComponentHost } from "./IPortraitComponentHost";
import type { IPortraitComponentPlan } from "./IPortraitComponentPlan";

/**
 * A swappable anatomical component. The assembler depends on this protocol, rather than importing an eye or nose implementation. A new component can supply different geometry while retaining the same attachment protocol.
 *
 * @evidence contracts/common.md#principled-implementation Stable component identity and an unchanged-host fit produce explicit cut/constraint/attachment plans consumed by the shared head assembler.
 * @evidence contracts/common.md#clear-and-simple-design Identity, optional palette entries and fitting stay with the component; common skin assembly depends only on the plan protocol.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Component geometry is supplied by its owner without person-name dispatch in this interface; clinical plausibility and collision admission are not implied by satisfying the protocol.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish stable instance identity, optional component palette and a nonmutating unchanged-host fit.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This protocol declares palette and fit ownership; the fit callback separately answers its actual processing cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Component identity alone implements no fitted-plan cache or cross-assembly coordinator.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The interface acquires no material handles or host buffers; the component constructor and owning build control their lifetime.
 * @author Samchon
 */
export interface IPortraitComponent {
  /** Optional palette entries owned by the component and collected by its caller. */
  materials?: IAutoMovieMaterial[];

  /** Stable instance identity, allowing separate left/right components. */
  id: string;

  /**
   * Fit the component's numerical shape to this subject's declared socket. Read the unchanged millimetre host without mutation; the returned plan owns its construction and callbacks. Clinical fitting is not certified here.
   *
   * @evidence contracts/common.md#principled-implementation Every component fits the same unchanged source before any attachment; declared socket bindings identify its constraints and removed face ordinals.
   * @evidence contracts/common.md#clear-and-simple-design The callback returns one component plan while shared skin blending/refinement remain assembler responsibilities.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The callback must not fit against another component's edited host; this signature does not itself enforce purity or anatomical fit.
   * @evidence contracts/common.md#meaningful-documentation Prose states millimetres, unchanged borrowed host and plan ownership rather than promising clinical socket registration.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This fit signature executes no socket or mesh traversal; concrete component producers own their actual fitting cost.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The fit declaration implements no result cache; the assembler supplies each unchanged host and separately assembles appearance-reference geometry.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring the callback acquires no fitted plan or host handle; implementing producers transfer their actual plan/closure state to the head build.
   */
  fit: (host: IPortraitComponentHost) => IPortraitComponentPlan;
}
