import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A point, actor or named world anchor used by geometry queries.
 *
 * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-contract-guidance Exposes `IAutoMovieGeometrySelector` as the portable data boundary for the agent contract guidance requirement.
 * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-knowledge-request-output Types `IAutoMovieGeometrySelector` for the spec authoring knowledge request output system contract.
 */
export type IAutoMovieGeometrySelector =
  | {
      /** Explicit world-space point. */
      kind: "point";

      /** Position in meters. */
      position: IAutoMovieVector3;
    }
  | {
      /** Named actor root or bone. */
      kind: "actor";

      /** Actor id. */
      actor: string;

      /** Optional bone id. */
      bone?: string;
    }
  | {
      /** Named world landmark. */
      kind: "landmark";

      /** Landmark id. */
      landmark: string;
    };
