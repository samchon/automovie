import { IAutoMovieSoftBodyDomain } from "@automovie/interface";

/** One cloth panel drawn from a soft-body domain. */
export interface IAutoMovieRenderSoftPanel {
  /** The domain whose lattice is drawn as one panel. */
  domain: IAutoMovieSoftBodyDomain;

  /** Semantic id of the owning building space, or `null` when unowned. */
  owner: string | null;

  /** Material id the panel is drawn with, or `null` for the default. */
  material: string | null;
}
