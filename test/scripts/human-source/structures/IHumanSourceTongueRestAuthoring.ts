import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import type { IHumanSourceTongueAttachmentLoop } from "./IHumanSourceTongueAttachmentLoop.ts";
import type { IHumanSourceTongueRestSearch } from "./IHumanSourceTongueRestSearch.ts";

/** Source neutral/delta candidate and exact native ventral material boundary. */
export interface IHumanSourceTongueRestAuthoring {
  face: IAutoMovieHumanFaceBasis;
  search: IHumanSourceTongueRestSearch;
  loop: IHumanSourceTongueAttachmentLoop;
  editedVertices: number[];
  editedEndpointVertices: Record<string, number[]>;
  qualification: string;
}
