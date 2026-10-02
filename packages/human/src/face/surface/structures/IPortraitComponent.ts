import { IAutoMovieMaterial } from "@automovie/interface";

import { IPortraitComponentHost } from "./IPortraitComponentHost";
import { IPortraitComponentPlan } from "./IPortraitComponentPlan";

/**
 * A swappable anatomical component. The assembler depends on this protocol,
 * rather than importing an eye or nose implementation. A new component can
 * supply different geometry while retaining the same attachment protocol.
 *
 * @evidence contracts/common.md#principled-implementation A component is an id plus a fit function from a host to a plan, so the assembler depends on the protocol and never imports an eye or nose implementation; separate left and right instances differ only by id.
 * @evidence contracts/common.md#clear-and-simple-design One protocol with two required members and an optional palette.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts IPortraitComponent carries no behaviour, special case or compensating path; it is a declaration.
 * @evidence contracts/common.md#meaningful-documentation States the protocol role, the swappability and the meaning of id and materials.
 * @evidence contracts/modeling.md#part-identity-and-grouping Each swappable anatomical part is one declaration implementing this protocol under its own stable instance id, and the assembler composes them without copying any member's shape.
 * @evidenceExclude contracts/modeling.md#spatial-conventions IPortraitComponent states no unit or frame beyond what its members document.
 * @evidenceExclude contracts/anatomy.md#anatomical-source IPortraitComponent carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range IPortraitComponent admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority IPortraitComponent defines no input through which a caller shapes a human form.
 * @evidenceExclude contracts/modeling.md#parameter-channels IPortraitComponent defines and consumes no parameter channel of a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry IPortraitComponent emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries IPortraitComponent constructs no surface that meets another part.
 * @evidenceExclude contracts/modeling.md#rendered-observation IPortraitComponent owns no part, group or joint that a viewer displays; the parts built with it are observed by their owners.
 * @author Samchon
 */
export interface IPortraitComponent {
  /** Optional component-owned finishes; scalar properties follow this part's dimensions. */
  materials?: IAutoMovieMaterial[];

  /** Stable instance identity, allowing separate left/right components. */
  id: string;

  /**
   * Fit the component's numerical shape to this subject's declared socket.
   *
   * @evidence contracts/common.md#principled-implementation Fitting reads the unchanged host and returns a plan, so all components fit the same basis and the result cannot depend on component order.
   * @evidence contracts/common.md#clear-and-simple-design One function from host to plan.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts IPortraitComponent.fit is a signature; it carries no behaviour, special case or compensating path.
   * @evidence contracts/common.md#meaningful-documentation States that the component fits its numerical shape to the subject's declared socket.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IPortraitComponent.fit is a declaration and defines no part or group of parts.
   * @evidenceExclude contracts/modeling.md#parameter-channels IPortraitComponent.fit carries no parameter channel of a form.
   * @evidenceExclude contracts/modeling.md#emitted-geometry IPortraitComponent.fit decides no primitive population; it only describes data.
   * @evidenceExclude contracts/modeling.md#shared-boundaries IPortraitComponent.fit constructs no surface; it describes data only.
   * @evidenceExclude contracts/modeling.md#rendered-observation IPortraitComponent.fit is a declaration and displays nothing itself; the parts built from it are observed by their owners.
   * @evidenceExclude contracts/modeling.md#spatial-conventions IPortraitComponent.fit states no unit or frame beyond what its members document.
   * @evidenceExclude contracts/anatomy.md#anatomical-source IPortraitComponent.fit carries no anatomical value, range, proportion, landmark or tissue behaviour.
   * @evidenceExclude contracts/anatomy.md#permitted-range IPortraitComponent.fit admits, bounds and combines no anatomical value.
   * @evidenceExclude contracts/anatomy.md#parametric-authority IPortraitComponent.fit defines no input through which a caller shapes a human form.
   */
  fit: (host: IPortraitComponentHost) => IPortraitComponentPlan;
}
