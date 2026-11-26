import {
  IAutoMovieCompiledFormation,
  IAutoMovieCompiledFormationHero,
  IAutoMovieFormationSubjectReviewDescription,
  IAutoMovieSubjectArtifact,
  IAutoMovieSubjectDescription,
  IAutoMovieSubjectReviewTarget,
  IAutoMovieSubjectReviewUnit,
} from "@automovie/interface";

import { describeAutoMovieSubject } from "./describeAutoMovieSubject";
import { compareAutoMovieRenderIds } from "./render/compareAutoMovieRenderIds";

/**
 * Resolve a compiled subject review wrapper with inspection-owned viewpoint and
 * delivery-evidence ineligibility. Formations list only hero-slot members plus
 * explicit omitted count; other subjects use the shared descriptor. Target and
 * compiled records remain borrowed.
 */
export function resolveAutoMovieSubjectReviewUnit(
  artifact: IAutoMovieSubjectArtifact,
  target: IAutoMovieSubjectReviewTarget,
): IAutoMovieSubjectReviewUnit {
  const description:
    | IAutoMovieSubjectDescription
    | IAutoMovieFormationSubjectReviewDescription = target.subject.startsWith(
    "formation:",
  )
    ? formationDescription(artifact, target.subject)
    : describeAutoMovieSubject(artifact, target.subject);
  return {
    version: 1,
    target,
    description,
    viewpointOwner: "inspection",
    deliveryEvidenceEligible: false,
  };
}
const formationDescription: (
  artifact: IAutoMovieSubjectArtifact,
  subject: string,
) => Extract<
  IAutoMovieSubjectReviewUnit["description"],
  { kind: "formation" }
> = (
  artifact: IAutoMovieSubjectArtifact,
  subject: string,
): Extract<
  IAutoMovieSubjectReviewUnit["description"],
  { kind: "formation" }
> => {
  const id: string = subject.slice("formation:".length);
  const formation: IAutoMovieCompiledFormation | undefined =
    artifact.compiled.formations.find(
      (candidate: IAutoMovieCompiledFormation): boolean => candidate.id === id,
    );
  if (formation === undefined)
    throw new Error(
      `Compiled subject "${subject}" does not exist in revision "${artifact.revision}".`,
    );
  const heroes: string[] = formation.heroes
    .map(
      (hero: IAutoMovieCompiledFormationHero): string =>
        `formation-slot:${formation.id}:${hero.slot}`,
    )
    .sort(compareAutoMovieRenderIds);
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
