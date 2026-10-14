import {
  IAutoMovieSubjectArtifact,
  IAutoMovieSubjectDescription,
} from "@automovie/interface";

import { AutoMovieSubjectDescriber } from "./AutoMovieSubjectDescriber";

/**
 * Enumerate directly stored compiled subjects without expanding placed parts or
 * compact instance members.
 *
 * The inventory holds every model as a prototype with its prototype parts,
 * every staged scene node as an element, every instance set, and, per built
 * environment, its transform-only groups, logical spaces and building units.
 * Element parts and single instances are left out;
 * {@link describeAutoMovieSubject} answers them by address. Descriptions are
 * sorted by render-id order, and each member page starts at the first member.
 *
 * @param artifact Compiled shot artifact and its revision.
 * @returns One description per stored subject, sorted by id.
 *
 * @evidence contracts/common.md#principled-implementation Lists exactly the records the artifact stores through `AutoMovieSubjectDescriber.inventory`, so the inventory is a census of the work rather than of the expanded scene, in one deterministic order.
 * @evidence contracts/common.md#clear-and-simple-design A thin public entry point over the describer shared with `describeAutoMovieSubject`, replacing the full private copy of every description rule this file used to keep.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject is filtered beyond leaving out regenerated element parts and single instances, which the single-subject entry answers by address.
 * @evidence contracts/common.md#meaningful-documentation The documentation states every included kind, what is left out and where to get it, the order, and where member pages start.
 * @evidence contracts/performance.md#efficient-algorithms One describer pass, linear in stored subjects and their measured vertices plus a sort, with each model tessellated once and each environment staged once for its buildings, where the old copy re-tessellated a model for every element and restaged an environment for every element a building owns.
 * @evidence contracts/performance.md#reuse-equivalent-work Within the call, model geometry is shared across the prototype, its parts and every element of that model and part boxes across every building of an environment; across calls nothing is cached because the artifact is the caller's value.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The describer and its caches live only for this call and are released on return; the caller owns the returned list, one description per stored subject.
 */
export const describeAutoMovieSubjects: (
  artifact: IAutoMovieSubjectArtifact,
) => IAutoMovieSubjectDescription[] = (
  artifact: IAutoMovieSubjectArtifact,
): IAutoMovieSubjectDescription[] =>
  new AutoMovieSubjectDescriber(artifact).inventory();
