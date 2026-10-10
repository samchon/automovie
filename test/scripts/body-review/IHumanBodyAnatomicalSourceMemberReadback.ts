import type { inspectAutoMovieMeshTopology } from "@automovie/engine";
import type { IAutoMovieHumanBodyAssemblyPartQualification } from "@automovie/human/body/export/IAutoMovieHumanBodyAssemblyPartQualification";
import type { IAutoMovieValidation } from "@automovie/interface";

/**
 * Actual Float32 accessor replay of one registered static source member.
 * The acquired mesh identity stays separate from exported buffer topology.
 * @author Samchon
 */
export interface IHumanBodyAnatomicalSourceMemberReadback extends Pick<IAutoMovieHumanBodyAssemblyPartQualification,
  "id" | "tissue" | "sourceVertices" | "qualification" | "source" | "clinical"> {
  /** Closed logical owner retained from the registered source. */
  anatomicalOwner: IAutoMovieHumanBodyAssemblyPartQualification["part"];

  /** Original registered mesh SHA, not the Float32 accessor digest. */
  sourceMesh: string;

  /** Actual number of POSITION vertices in this member interval. */
  vertices: number;

  /** Actual scalar index count in this member interval. */
  indices: number;

  /** Zero only after every accessor coordinate equals the rounded model coordinate. */
  maximumFloat32ReplayDifference: number;

  /** Topology measured on the actual exported Float32 coordinates. */
  float32Topology: ReturnType<typeof inspectAutoMovieMeshTopology>;

  /** Existing closed static-member topology admission, unchanged by native layers. */
  float32Admission: IAutoMovieValidation;
}
