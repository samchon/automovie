import type { IBodyAnatomicalRequestModel } from "./IBodyAnatomicalRequestModel";
import type { IBodyAnatomicalRequestViewport } from "./IBodyAnatomicalRequestViewport";

/**
 * Inputs of `mountBodyAnatomicalRequestPanel`.
 *
 * `basis` names the neutral reference rig requests are evaluated against,
 * `viewport` builds and shows frames, and `download` saves an explicitly
 * exported candidate file.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Supplies the reference basis, viewport and download the numerical request panel needs.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Keeps explicit candidate export separate from the request document.
 * @author Samchon
 */
export interface IBodyAnatomicalRequestPanelProps<
  Model extends IBodyAnatomicalRequestModel,
> {
  /** Exact basis identity of the neutral reference rig. */
  basis: string;

  /** Viewport that builds, publishes and exports frames. */
  viewport: IBodyAnatomicalRequestViewport<Model>;

  /** Save bytes under a file name and MIME type. */
  download: (name: string, bytes: BlobPart, mime: string) => void;
}
