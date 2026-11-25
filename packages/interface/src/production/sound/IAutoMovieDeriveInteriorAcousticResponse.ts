import type { IAutoMovieAcousticRequest } from "../../analysis/IAutoMovieAcousticRequest";
import type { IAutoMovieAcousticResponseProfile } from "../IAutoMovieAcousticResponseProfile";

/**
 * Data and callback contracts shared by the DeriveInteriorAcousticResponse
 * operations.
 */
export namespace IAutoMovieDeriveInteriorAcousticResponse {
  /**
   * Derive a closed room-path receipt from explicit space bindings and an
   * acoustic profile.
   *
   * Both spaces null selects the available outdoor path; exactly one null
   * leaves room binding unsupported. An adopted-response profile returns
   * not-run because this operation receives no adopted bytes. A missing
   * acoustic request also returns not-run. A supplied request must name
   * sourceSpace as its subject and match inputRevision; profile id and revision
   * digest syntax are checked first.
   *
   * Same-room response requires diffuse-field metrics and exactly one source
   * and receiver; cross-room response requires composite transmission loss.
   * Missing metrics remain unsupported with the analyzer's reason. The digest
   * is compared, not recomputed from geometry. The caller owns the scalar
   * receipt, which retains no request geometry; analyzer and metadata refusals
   * propagate as exceptions.
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
