import type { IAutoMovieAcousticRequest } from "../../analysis/IAutoMovieAcousticRequest";
import type { IAutoMovieAcousticResponseProfile } from "../IAutoMovieAcousticResponseProfile";

/**
 * Data and callback contracts shared by the DeriveInteriorAcousticResponse operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Derive a closed room-path receipt from explicit space bindings and an acoustic profile. Member documentation states the supplied records, units and absence meanings used by deriveAutoMovieInteriorAcousticResponse.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nullable room/request evidence stays explicit; the profile selects an admitted response path instead of guessing a room or acoustic measurement.
 * @evidence contracts/development/design.md#principled-representation sourceSpace and listenerSpace use null for outdoors, inputRevision stamps the measured input, and request may be unavailable while profile states the chosen response source.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieDeriveInteriorAcousticResponse, used by deriveAutoMovieInteriorAcousticResponse. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieDeriveInteriorAcousticResponse {
  /**
   * Derive a closed room-path receipt from explicit space bindings and an acoustic profile.
   *
   * Both spaces null selects the available outdoor path; exactly one null leaves
   * room binding unsupported. An adopted-response profile returns not-run because
   * this operation receives no adopted bytes. A missing acoustic request also
   * returns not-run. A supplied request must name sourceSpace as its subject and
   * match inputRevision; profile id and revision digest syntax are checked first.
   *
   * Same-room response requires diffuse-field metrics and exactly one source and
   * receiver; cross-room response requires composite transmission loss. Missing
   * metrics remain unsupported with the analyzer's reason. The digest is compared,
   * not recomputed from geometry. The caller owns the scalar receipt, which retains
   * no request geometry; analyzer and metadata refusals propagate as exceptions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Derive a closed room-path receipt from explicit space bindings and an acoustic profile. Member documentation states the supplied records, units and absence meanings used by deriveAutoMovieInteriorAcousticResponse.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Nullable room/request evidence stays explicit; the profile selects an admitted response path instead of guessing a room or acoustic measurement.
   * @evidence contracts/development/design.md#principled-representation sourceSpace and listenerSpace use null for outdoors, inputRevision stamps the measured input, and request may be unavailable while profile states the chosen response source.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieDeriveInteriorAcousticResponse.IProps, used by deriveAutoMovieInteriorAcousticResponse. Its sourceSpace, listenerSpace, inputRevision, request, profile members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
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
