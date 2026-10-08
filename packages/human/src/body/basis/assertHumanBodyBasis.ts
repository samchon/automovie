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
 * Identity, channel/corrective, connected skin, endpoint, named skin point,
 * named skin area
 * and rig stages run in that order. A shape endpoint may affect skin or rig
 * landmarks, or a person's actual same-generation head source. Every name
 * must move resident geometry in its declared owner. Standalone bodies retain
 * their own skin/landmark requirement. Material
 * partitions retain the one shared skin answer. The final rig stage
 * admits pivots and clinical bounds after all source rows are valid.
 * This checks the representation and its revision, not the physiological
 * plausibility or contact of every resulting body and pose.
 */
export function assertHumanBodyBasis(
  basis: IAutoMovieHumanBodyBasis,
  endpointSource?: IAutoMovieHumanBodyEndpointSource,
): void {
  assertHumanBodyBasisIdentity(basis);
  const endpoints = assertHumanBodyBasisShape(basis);
  const resident = assertHumanBodyBasisSurface(basis, endpoints);
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
