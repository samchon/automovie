import type { IAutoMovieHumanBodyBasisSurface } from "@automovie/human/body/structures/surface/IAutoMovieHumanBodyBasisSurface";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import type { IHumanSourceTopology } from "./IHumanSourceTopology.ts";

/**
 * Inputs of the neck cut. `fineHead` is the face extraction output before the
 * neck recrop (Git `0c75de1e`, id `...-2026-09-17-binocular-frame`), whose skin
 * vertices are exact source twins; `rigidFace` is the face the published body
 * was cut against (Git `bfbb0f885`, id `...-2026-09-20-rigid-mandible`);
 * `face` and `body` are the published skin surfaces. `minimumY` is the
 * published face recrop plane in metres.
 *
 * @author Samchon
 */
export interface IHumanSourceCutInput {
  topology: IHumanSourceTopology;
  fineHead: IAutoMovieHumanFaceBasis["surfaces"][number];
  rigidFace: IAutoMovieHumanFaceBasis["surfaces"][number];
  face: IAutoMovieHumanFaceBasis["surfaces"][number];
  body: IAutoMovieHumanBodyBasisSurface;
  minimumY: number;
}
