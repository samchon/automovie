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
 * Resolve a compiled subject review wrapper with inspection-owned viewpoint and delivery-evidence ineligibility. Formations list only hero-slot members plus explicit omitted count; other subjects use the shared descriptor. Target and compiled records remain borrowed.
 *
 * @evidence contracts/common.md#principled-implementation Resolve revision-qualified compiled composition, using compact hero-slot formation members or the shared descriptor; viewpoint is inspection-owned and delivery evidence remains ineligible.
 * @evidence contracts/common.md#clear-and-simple-design The adapter adds review authority without another subject model or expansion of all population members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing subjects throw and omitted formation members remain explicit; supplied target identity does not independently prove current revision equality or rendering.
 * @evidence contracts/common.md#meaningful-documentation Docs identify borrowed target/compiled records, compact members and inspection/delivery authority separation.
 * @evidence contracts/performance.md#efficient-algorithms Formation lookup scans F records and sorts H hero slots with O(H) output; other subjects include their descriptor's actual lookup/projection costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Subject semantics and code-unit ordering share canonical owners; each mutable artifact is read anew without target-id-only caching.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns review wrapper/member array and borrows compiled/target records; no viewer session, camera, resource handle or task is held.
 */
export const resolveAutoMovieSubjectReviewUnit: (
  artifact: IAutoMovieSubjectArtifact,
  target: IAutoMovieSubjectReviewTarget,
) => IAutoMovieSubjectReviewUnit = (
  artifact: IAutoMovieSubjectArtifact,
  target: IAutoMovieSubjectReviewTarget,
): IAutoMovieSubjectReviewUnit => {
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
};
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
