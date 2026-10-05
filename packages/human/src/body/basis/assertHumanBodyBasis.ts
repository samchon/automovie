import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import { assertHumanBodyBasisEndpoints } from "./admission/assertHumanBodyBasisEndpoints";
import { assertHumanBodyBasisIdentity } from "./admission/assertHumanBodyBasisIdentity";
import { assertHumanBodyBasisShape } from "./admission/assertHumanBodyBasisShape";
import { assertHumanBodyBasisSurface } from "./admission/assertHumanBodyBasisSurface";
import { assertHumanSkinLandmarks } from "../../common/basis/assertHumanSkinLandmarks";
import { assertHumanBodyRig } from "./assertHumanBodyRig";

/**
 * Admit the caller-owned body basis once before any document can build.
 *
 * Identity, channel/corrective, connected skin, endpoint, named skin point
 * and rig stages run in that order. A shape endpoint may affect only skin or only rig
 * landmarks, but every name must move some resident geometry. Material
 * partitions retain the one shared skin answer. The final rig stage
 * admits pivots and clinical bounds after all source rows are valid.
 * This checks the representation and its revision, not the physiological
 * plausibility or contact of every resulting body and pose.
 */
export function assertHumanBodyBasis(basis: IAutoMovieHumanBodyBasis): void {
  assertHumanBodyBasisIdentity(basis);
  const endpoints = assertHumanBodyBasisShape(basis);
  const resident = assertHumanBodyBasisSurface(basis, endpoints);
  assertHumanBodyBasisEndpoints(basis, endpoints, resident);
  assertHumanSkinLandmarks(basis);
  assertHumanBodyRig(basis);
}
