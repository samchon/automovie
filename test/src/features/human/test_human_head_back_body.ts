import { TestValidator } from "@nestia/e2e";

import { AutoMovieHumanHeadConstruction as H } from "../../../../packages/human/src/generation/AutoMovieHumanHeadConstruction";
import { nclose } from "../internal/nclose";

/**
 * The vault's posterior depth does not impose a second oversized front face.
 *
 * Scenarios:
 * 1. Independent anterior depth, posterior depth and breadth retain their sizes.
 * 2. Increasing posterior depth leaves the face-shield contact unchanged.
 *
 * @evidence contracts/testing.md#behavioral-verification Cuts an analytic back-body primitive through the production field and radial solver. The former symmetric 80 mm anterior extension is red against the prescribed 20 mm face-shield contact; the correct asymmetric primitive is green.
 * @evidence contracts/testing.md#independent-expectations The fixture prescribes the three geometric semiaxes 20, 80 or 120, and 40 mm. Cardinal intercepts of that piecewise superellipse equal those dimensions by definition, independently of any person, fitted prior or numerical closure.
 * @evidence contracts/testing.md#distinguishing-cases Checks anterior, posterior and lateral rays and an independently enlarged posterior vault. The complete head identity and curve audits own the composed mandible, reliefs, neck, skin and all supported people.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU test reached by --include human_head_back_body. It constructs a local analytic section and starts no person generation, host or GPU.
 */
export function test_human_head_back_body(): void {
  for (const back of [80, 120]) {
    const section: H.ISection = { t: 3, tilt: 0, axis: 0, front: 90, back: -back, width: 40, waist: 20, face: 30, shield: 0, powerBack: 2, powerFace: 2, station: 0 };
    TestValidator.predicate("anterior contact", nclose(H.radius(section, 0, 0), 20, 1e-5));
    TestValidator.predicate("posterior depth", nclose(H.radius(section, 0, Math.PI), back, 1e-5));
    TestValidator.predicate("lateral breadth", nclose(H.radius(section, 0, Math.PI / 2), 40, 1e-5));
    const neck: H.ISection = { ...section, t: 0, back: -40, width: 40 };
    TestValidator.predicate("neck anterior radius stays circular", nclose(H.radius(neck, 0, 0), 40, 1e-5));
    TestValidator.predicate("neck posterior radius stays circular", nclose(H.radius(neck, 0, Math.PI), 40, 1e-5));
  }
}
