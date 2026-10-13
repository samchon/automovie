import type { IAutoMovieHumanBodyAnatomicalAssembly } from "@automovie/human/body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";

import type { createConnectedBodyViewport } from "@automovie/viewer/human/body/createConnectedBodyViewport";

/**
 * Where the body editor's head is shown and reported.
 *
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
