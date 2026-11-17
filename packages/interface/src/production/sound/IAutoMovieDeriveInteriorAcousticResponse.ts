import type { IAutoMovieAcousticRequest } from "../../analysis/IAutoMovieAcousticRequest";
import type { IAutoMovieAcousticResponseProfile } from "../IAutoMovieAcousticResponseProfile";

/** Data and callback contracts shared by the DeriveInteriorAcousticResponse operations. */
export namespace IAutoMovieDeriveInteriorAcousticResponse {
  /**
   * Derive a closed room-path receipt from explicit space bindings and an acoustic profile.
   */
  export type IProps = {
    /** Source space, or `null` outdoors. */
    sourceSpace: string | null;
    /** Listener space, or `null` outdoors. */
    listenerSpace: string | null;
    /** Exact geometry/material/emitter/listener input digest. */
    inputRevision: string;
    /** Shared acoustic request for the source room, when available. */
    request: IAutoMovieAcousticRequest | null;
    /** Explicit production-owned response source. */
    profile: IAutoMovieAcousticResponseProfile;
  };
}
