import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import type { IHumanSourceBodyReproduction } from "./IHumanSourceBodyReproduction.ts";
import type { IHumanSourceCut } from "./IHumanSourceCut.ts";
import type { IHumanSourceFaceReproduction } from "./IHumanSourceFaceReproduction.ts";
import type { IHumanSourceGenerationInput } from "./IHumanSourceGenerationInput.ts";
import type { IHumanSourceGenerationUpstream } from "./IHumanSourceGenerationUpstream.ts";
import type { IHumanSourceRigReproduction } from "./IHumanSourceRigReproduction.ts";
import type { IHumanSourceTopology } from "./IHumanSourceTopology.ts";

/**
 * Everything the bundle assembly consumes, already verified upstream of it.
 *
 * @author Samchon
 */
export interface IHumanSourceAssemblyInput {
  face: IAutoMovieHumanFaceBasis;
  body: IAutoMovieHumanBodyBasis;
  faceSha256: string;
  cut: IHumanSourceCut;
  topology: IHumanSourceTopology;
  faceRows: IHumanSourceFaceReproduction;
  bodyRows: IHumanSourceBodyReproduction;
  rig: IHumanSourceRigReproduction;
  upstream: IHumanSourceGenerationUpstream[];
  sample: Record<string, string | number>;
  inputs: IHumanSourceGenerationInput[];
  /** Explicit provider addressing after active compaction, when used. */
  nativeToSource?: Int32Array;
  sourceToNative?: Int32Array;
}
