import { IPortraitComponentHost } from "./IPortraitComponentHost";
import { IPortraitComponentPlan } from "./IPortraitComponentPlan";
import { IAutoMovieMaterial } from "@automovie/interface";

/**
 * A swappable anatomical component. The assembler depends on this protocol,
 * rather than importing an eye or nose implementation. A new component can
 * supply different geometry while retaining the same attachment protocol.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Defines a swappable anatomical part through identity, optional finishes and a host-fitting operation.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments Lets separate left/right parts provide their own geometry while the assembler consumes one common attachment protocol.
 */
export interface IPortraitComponent {
  /** Optional component-owned finishes; scalar properties follow this part's dimensions. */
  materials?: IAutoMovieMaterial[];
  /** Stable instance identity, allowing separate left/right components. */
  id: string;
  /** Fit the component's numerical shape to this subject's declared socket. */
  fit: (host: IPortraitComponentHost) => IPortraitComponentPlan;
}
