import type { IAutoMovieHumanBodyBuild } from "../../body/structures/IAutoMovieHumanBodyBuild";
import type { IHumanBodyPreparedBuild } from "../../body/structures/IHumanBodyPreparedBuild";

/**
 * Prepared garment authority and unchanged body before final Person placement.
 *
 * @evidence contracts/common.md#principled-implementation Prepared rest coverage and the unchanged body preserve garment attachment until final person placement instead of evaluating coverage on posed coordinates.
 * @evidence contracts/common.md#clear-and-simple-design The dress stage needs only the prepared garment authority and the completed source body, keeping final stitching with the person builder.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Prepared coverage is source-owned; this record introduces no body-specific garment mask or substitute posed skin.
 * @evidence contracts/common.md#meaningful-documentation The two members distinguish compiled rest coverage from body source parts still awaiting person placement.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Dress inputs select no material or coverage algorithm; the prepared body's dress callback owns that operation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The input pair implements no shared dress request; reusable preparation remains in the supplied prepared build.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources References to prepared authority and body acquire no handles and are released with their caller's ordinary object lifetime.
 *
 * @author Samchon
 */
export interface IHumanPersonBodyDressInput {
  /** The admitted document's compiled rest coverage authority. */
  prepared: IHumanBodyPreparedBuild;

  /** Completed Body whose original source parts still await Person placement. */
  body: IAutoMovieHumanBodyBuild;
}
