import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

import type { IConnectedPersonDraft } from "./IConnectedPersonDraft";
import type { IConnectedPersonViewport } from "./IConnectedPersonViewport";

/**
 * Inputs of `exportConnectedPersonAsset`: the person on screen, the viewport
 * whose worker encodes it, and the test that the same person is still
 * displayed when the bytes arrive.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Names the displayed person as the only subject of a static export.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Discards an encoded file when the displayed person changed while it was encoded.
 * @author Samchon
 */
export interface IConnectedPersonAssetExportProps<Model> {
  /** The viewport whose resident worker encodes the file. */
  viewport: Pick<IConnectedPersonViewport<never>, "export" | "exportConstruction">;

  /** The refused construction on screen, or null when the accepted person is. */
  draft: IConnectedPersonDraft<Model> | null;

  /** The committed document, used when no draft is displayed. */
  committed: IAutoMovieHumanPersonDocument | undefined;

  /** Whether the person these bytes were encoded from is still the one displayed. */
  unchanged: () => boolean;

  /** Save bytes the user asked for under a file name. */
  download: (name: string, bytes: BlobPart, mime: string) => void;
}
