import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanPersonBodyView } from "@automovie/human/human/structures/IAutoMovieHumanPersonBodyView";

/**
 * One admitted derived body view and its existing thickness producer.
 * The registration owns a fresh output epoch and may replace only its owned
 * candidate's surface records, never the original view's geometry or rig.
 * @author Samchon
 */
export interface IRegisterHumanBodySkinLayersProps {
  /** Candidate already registered by the normal assembly input owner. */
  candidate: IAutoMovieHumanBodyBasis;

  /** Original paired view supplying the same shared source metadata. */
  body: IAutoMovieHumanPersonBodyView;

  /** Exact maintained thickness producer, included in candidate identity. */
  producer: string;

  /** Fresh owning production output directory. */
  output: string;
}
