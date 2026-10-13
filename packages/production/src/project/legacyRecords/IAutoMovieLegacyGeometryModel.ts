/**
 * Legacy project record boundary. The stored format preserves its existing
 * identities and units; runtime consumers use the same declared fields.
 */
import type { IAutoMovieSkeleton } from "@automovie/interface";

/**
 * Minimal model geometry lookup the v1 store answered with.
 *
 * @author Samchon
 */
export interface IAutoMovieLegacyGeometryModel {
  /**
   * Model id referenced by scene nodes.
   */
  id: string;

  /**
   * Skeleton used for FK and reach queries; null for props.
   */
  skeleton: IAutoMovieSkeleton | null;
}
