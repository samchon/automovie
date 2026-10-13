import type { IAutoMovieHumanBodyAnatomicalAssembly } from "@automovie/human/body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";

import type { IBodyAnatomicalRequestModel } from "./IBodyAnatomicalRequestModel";
import type { IBodyAnatomicalRequestViewport } from "./IBodyAnatomicalRequestViewport";

/**
 * Inputs of `mountBodyAnatomicalRequestPanel`.
 *
 * `basis` names the neutral reference rig requests are evaluated against,
 * `viewport` builds and shows frames, and `download` saves an explicitly
 * exported candidate file.
 *
 * @author Samchon
 */
export interface IBodyAnatomicalRequestPanelProps<
  Model extends IBodyAnatomicalRequestModel,
> {
  /** Exact basis identity of the neutral reference rig. */
  basis: string;
  /** Loaded source quantity authority for request admission and persistence; absent sources retain legacy unsupported-path refusals. */
  source?: IAutoMovieHumanBodyAnatomicalAssembly;

  /** Viewport that builds, publishes and exports frames. */
  viewport: IBodyAnatomicalRequestViewport<Model>;

  /** Save bytes under a file name and MIME type. */
  download: (name: string, bytes: BlobPart, mime: string) => void;
}
