import {
  IAutoMovieSubjectArtifact,
  IAutoMovieSubjectReviewTarget,
  IAutoMovieSubjectReviewUnit,
} from "@automovie/interface";

import { describeAutoMovieSubject } from "./describeAutoMovieSubject";

/**
 * Resolve one subject-review unit from compiled truth.
 *
 * Subject identity and composition come from the shared subject-description
 * query. This resolver adds only review semantics: artifact qualification,
 * inspection-owned viewpoint authority, and delivery-evidence separation.
 */
export const resolveAutoMovieSubjectReviewUnit = (
  artifact: IAutoMovieSubjectArtifact,
  target: IAutoMovieSubjectReviewTarget,
): IAutoMovieSubjectReviewUnit => {
  const description = target.subject.startsWith("formation:")
    ? formationDescription(artifact, target.subject)
    : describeAutoMovieSubject(artifact, target.subject);
  return {
    version: 1,
    target,
    description,
    viewpointOwner: "inspection",
    deliveryEvidenceEligible: false,
  };
};

const formationDescription = (
  artifact: IAutoMovieSubjectArtifact,
  subject: string,
): Extract<
  IAutoMovieSubjectReviewUnit["description"],
  { kind: "formation" }
> => {
  const id = subject.slice("formation:".length);
  const formation = artifact.compiled.formations.find(
    (candidate) => candidate.id === id,
  );
  if (formation === undefined)
    throw new Error(
      `Compiled subject "${subject}" does not exist in revision "${artifact.revision}".`,
    );
  const heroes = formation.heroes
    .map((hero) => `formation-slot:${formation.id}:${hero.slot}`)
    .sort(compareCodeUnits);
  return {
    revision: artifact.revision,
    id: subject,
    kind: "formation",
    formation,
    members: {
      total: formation.count,
      offset: 0,
      items: heroes,
      omitted: formation.count - heroes.length,
    },
  };
};

const compareCodeUnits = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;
