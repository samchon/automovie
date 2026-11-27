import type { IAutoMovieHumanHeadIdentity } from "./IAutoMovieHumanHeadIdentity";

/**
 * Partial anatomical head measures and the closed set of measures receiving
 * sex-specific defaults. Runtime construction and admission remain with
 * AutoMovieHumanHeadAnatomy in Human.
 */
export namespace IAutoMovieHumanHeadAnatomy {
  /** A record in which every measure, at any depth, may be omitted. */
  export type Partially<T> = {
    [K in keyof T]?: T[K] extends number ? T[K] : Partially<T[K]>;
  };

  /** A head input in which every measure may be omitted. */
  export type IInput = Partially<IAutoMovieHumanHeadIdentity>;

  /** A head measure that defaults to its sex's adult mean. */
  export type FaceMean =
    | "faceHeight"
    | "mandibularWidth"
    | "minimumFrontalWidth"
    | "mouthOpening"
    | "mandibularLaterotrusion"
    | "palpebralFissureLength"
    | "palpebralFissureHeight"
    | "intercanthalWidth"
    | "noseWidth"
    | "noseHeight"
    | "noseProtrusion"
    | "mouthWidth"
    | "upperVermilionHeight"
    | "lowerVermilionHeight";
}
