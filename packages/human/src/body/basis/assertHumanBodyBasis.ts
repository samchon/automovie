import { assertHumanSkinLandmarks } from "../../common/basis/assertHumanSkinLandmarks";
import { assertHumanSkinRegions } from "../../common/basis/assertHumanSkinRegions";
import { assertHumanBodyNativeSubcutaneousSource } from "../anatomy/layer/assertHumanBodyNativeSubcutaneousSource";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyEndpointSource } from "../structures/IAutoMovieHumanBodyEndpointSource";
import { assertHumanBodyBasisEndpoints } from "./admission/assertHumanBodyBasisEndpoints";
import { assertHumanBodyBasisIdentity } from "./admission/assertHumanBodyBasisIdentity";
import { assertHumanBodyBasisShape } from "./admission/assertHumanBodyBasisShape";
import { assertHumanBodyBasisSurface } from "./admission/assertHumanBodyBasisSurface";
import { assertHumanBodyRig } from "./assertHumanBodyRig";
import { humanBodyExternalEndpointContributions } from "./humanBodyExternalEndpointContributions";

/**
 * Admit the caller-owned body basis once before any document can build.
 *
 * Identity, channel/corrective, connected skin, endpoint, named skin point, named skin area and rig stages run in that order. A shape endpoint may affect skin or rig landmarks, or a person's actual same-generation head source. Every name must move resident geometry in its declared owner. Standalone bodies retain their own skin/landmark requirement. Material partitions retain the one shared skin answer. The final rig stage admits pivots and clinical bounds after all source rows are valid. This checks the representation and its revision, not the physiological plausibility or contact of every resulting body and pose.
 *
 * @evidence contracts/common.md#principled-implementation Ordered source identity, shape, neutral surface, layer, endpoint, skin-site and rig admission establishes each later stage's dependency premises before document construction.
 * @evidence contracts/common.md#clear-and-simple-design One basis boundary coordinates specialized guards and optional same-generation head contributions without duplicating their geometry or range rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every endpoint must affect a resident owner; admitted source representation does not certify physiology or contact for all shape/pose combinations.
 * @evidence contracts/common.md#meaningful-documentation The prose gives stage order, standalone versus same-generation head residency and the limits of representation admission.
 * @evidence contracts/performance.md#efficient-algorithms Total work includes full source buffer/row/rig scans plus neutral crossing and capped-surface overlap queries; those geometric checks dominate and are needed before the builder trusts resident topology.
 * @evidence contracts/performance.md#reuse-equivalent-work Returned endpoint/resident sets are shared between shape, surface and landmark checks, and common guards supply named skin-site and rig validation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local admission sets expire after success/failure; source geometry and optional head source remain caller-owned without retained construction tasks.
 */
export function assertHumanBodyBasis(
  basis: IAutoMovieHumanBodyBasis,
  endpointSource?: IAutoMovieHumanBodyEndpointSource,
): void {
  assertHumanBodyBasisIdentity(basis);
  const endpoints: Set<string> = assertHumanBodyBasisShape(basis);
  const resident: Set<string> = assertHumanBodyBasisSurface(basis, endpoints);
  assertHumanBodyNativeSubcutaneousSource(basis);
  if (endpointSource !== undefined)
    for (const endpoint of humanBodyExternalEndpointContributions(
      basis,
      endpointSource,
    ))
      resident.add(endpoint);
  assertHumanBodyBasisEndpoints(basis, endpoints, resident);
  assertHumanSkinLandmarks(basis);
  assertHumanSkinRegions(basis);
  assertHumanBodyRig(basis);
}
