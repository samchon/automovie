import {
  IAutoMovieSubjectArtifact,
  IAutoMovieSubjectDescription,
} from "@automovie/interface";

import { AutoMovieEngineSubjectDescriber } from "../AutoMovieEngineSubjectDescriber";

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
 */
export function describeAutoMovieSubjects(
  artifact: IAutoMovieSubjectArtifact,
): IAutoMovieSubjectDescription[] {
  return new AutoMovieEngineSubjectDescriber(artifact).inventory();
}
