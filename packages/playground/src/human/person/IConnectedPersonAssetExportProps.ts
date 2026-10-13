import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

import type { IConnectedPersonDraft } from "./IConnectedPersonDraft";
import type { IConnectedPersonViewport } from "./IConnectedPersonViewport";

/**
 * Inputs of `exportConnectedPersonAsset`: the person on screen, the viewport
 * whose worker encodes it, and the test that the same person is still
 * displayed when the bytes arrive.
 *
 * @author Samchon
 */
export interface IConnectedPersonAssetExportProps<Model> {
  /** The viewport whose resident worker encodes the file. */
  viewport: Pick<
    IConnectedPersonViewport<never>,
    "export" | "exportConstruction"
  >;

  /** The refused construction on screen, or null when the accepted person is. */
  draft: IConnectedPersonDraft<Model> | null;

  /** The committed document, used when no draft is displayed. */
  committed: IAutoMovieHumanPersonDocument | undefined;

  /** Whether the person these bytes were encoded from is still the one displayed. */
  unchanged: () => boolean;

  /** Save bytes the user asked for under a file name. */
  download: (name: string, bytes: BlobPart, mime: string) => void;
}
