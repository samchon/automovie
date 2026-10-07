import type { IAutoMovieHumanBodyAnatomicalAssembly } from "@automovie/human/body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";

import type { createConnectedBodyViewport } from "./connectedBodyViewport";

/**
 * Where the body editor's head is shown and reported.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Names where the companion head is shown and where its failure is reported.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Keeps the companion head's visibility and status as display state outside the document.
 * @author Samchon
 */
export interface IConnectedBodyHeadSeatProps {
  /** Actual loaded body source authority for companion document serialization; absent sources retain legacy admission. */
  source?: IAutoMovieHumanBodyAnatomicalAssembly;
  /** The page's viewport, read when a head arrives (it is created after the seat). */
  viewport: () => Pick<
    ReturnType<typeof createConnectedBodyViewport>,
    "companion"
  >;

  /** Append one line to the body status. */
  status: (text: string) => void;

  /** Name the head as preparing until its first build answers. */
  preparing?: (active: boolean) => void;
}
