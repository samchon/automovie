import type { IAutoMovieHumanFacePeriocularAttachmentCharts } from "@automovie/human/face/structures/IAutoMovieHumanFacePeriocularAttachmentCharts";

import type { IHumanSourceAttachmentCoverage } from "./IHumanSourceAttachmentCoverage.ts";

/** One expanded source material domain and its complete column coverage. */
export interface IHumanSourceAttachmentExtension {
  charts: IAutoMovieHumanFacePeriocularAttachmentCharts;
  coverage: IHumanSourceAttachmentCoverage[];
  outerDualDepth: number;
}
