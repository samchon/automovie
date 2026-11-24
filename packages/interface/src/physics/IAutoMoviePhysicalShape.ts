import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalHullFaces } from "./IAutoMoviePhysicalHullFaces";

/**
 * A finite solid collider placed in its segment's bone frame.
 *
 * A kind discriminator chooses sphere, local-Y capsule, oriented box or convex
 * hull dimensions. The hull is the convex hull of its supplied shape-local
 * points; interior points are refused by physical admission. Every shape
 * references a profile material and has an identity unique within its segment.
 * Dimensions are metres; soft-layer depth must leave a positive solid core.
 */
export type IAutoMoviePhysicalShape = {
  /** Unique within its segment. */
  id: string;

  /** Reference into the owning profile's materials. */
  material: string;

  /** Bone-local placement. */
  transform: IAutoMovieRigidTransform;
} & (
  | {
      /** Solid sphere. */ kind: "sphere";

      /** Positive metres. */ radius: number;
    }
  | {
      /** Capsule along local Y. */ kind: "capsule";

      /** Positive metres. */ radius: number;

      /** Nonnegative cylindrical half-length, metres. */ halfLength: number;
    }
  | {
      /** Solid oriented box. */ kind: "box";

      /** Positive local half-extents, metres. */ halfExtents: IAutoMovieVector3;
    }
  | {
      /** Solid convex polytope: the convex hull of its points. */ kind: "hull";

      /**
       * At least four shape-local vertices, metres, not all in one plane; every
       * point is a vertex or lies on the hull's surface, never inside it.
       */ points: IAutoMovieVector3[];

      /**
       * The convex hull of `points`, built when the shape is; a reader that
       * finds none computes it from the points.
       */ hull?: IAutoMoviePhysicalHullFaces.IHull;
    }
);
