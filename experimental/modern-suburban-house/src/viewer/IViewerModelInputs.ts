import type { IAutoMovieMeshTransform } from "@automovie/engine";
import type { IAutoMovieModel, IAutoMoviePropArticulation } from "@automovie/interface";


/** Prototypes, placements and finishes the viewer lowers into scene items. */
export interface IViewerModelInputs {
  /** House draw batches default on; isolated inspection retains every source part. */
  batchRepetitions?: boolean;
  /**
   * Models with the face role of each part and, optionally, articulation, review yaw and collection
   * membership.
   */
  prototypes: readonly {
    model: IAutoMovieModel;
    faceByPart: Readonly<Record<string, string>>;
    articulation?: IAutoMoviePropArticulation;
    reviewYaw?: number;
    memberByPart?: Readonly<Record<string, string>>;
  }[];
  /** Placements of the prototypes. */
  instances: readonly {
    id: string;
    modelId: string;
    transform: IAutoMovieMeshTransform;
  }[];
  /** Display finish of each face role. */
  finishes: Readonly<
    Record<
      string, {
        color: number;
        roughness: number;
        metalness: number;
        transmission?: number;
        ior?: number;
        thickness?: number;
        doubleSided?: boolean;
        texture?: string;
        textureMetres?: readonly [number, number];
      }
    >
  >;
}
