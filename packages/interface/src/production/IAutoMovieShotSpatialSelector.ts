import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A spatial operand measured from one compiled shot.
 *
 * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `IAutoMovieShotSpatialSelector` as the portable data boundary for the production design story boundary requirement.
 * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `IAutoMovieShotSpatialSelector` for the narrative intent story design ownership system contract.
 */
export type IAutoMovieShotSpatialSelector =
  | {
      /** One compiled scene node. */
      kind: "node";
      /** Exact scene-node id. */
      id: string;
    }
  | {
      /** Centroid of every builder-materialized formation slot. */
      kind: "formation";
      /** Exact formation design id. */
      id: string;
    }
  | {
      /** One named production-world landmark. */
      kind: "landmark";
      /** Exact landmark id. */
      id: string;
    }
  | {
      /** One literal world-space point. */
      kind: "point";
      /** Exact point in meters. */
      position: IAutoMovieVector3;
    };
