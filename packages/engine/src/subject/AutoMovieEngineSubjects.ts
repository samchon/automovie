import type {
  IAutoMovieBuildingUnit,
  IAutoMovieBuiltEnvironment,
  IAutoMovieCompiledInstanceSet,
  IAutoMovieCurrentSubjectReviewObservation,
  IAutoMovieDescribeSubject,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieSubjectArtifact,
  IAutoMovieSubjectBox,
  IAutoMovieSubjectContribution,
  IAutoMovieSubjectDescription,
  IAutoMovieSubjectDiff,
  IAutoMovieSubjectMemberSummary,
  IAutoMovieSubjectReviewCoverage,
  IAutoMovieSubjectReviewCurrentContext,
  IAutoMovieSubjectReviewTarget,
  IAutoMovieSubjectReviewUnit,
  IAutoMovieSubjectReviewViewpoint,
  IAutoMovieVector3,
} from "@automovie/interface";

import { autoMovieSubjectAddress } from "./internal/autoMovieSubjectAddress";
import { autoMovieSubjectMemberSummary } from "./internal/autoMovieSubjectMemberSummary";
import { createAutoMovieSubjectPartIndex } from "./internal/createAutoMovieSubjectPartIndex";
import { describeAutoMovieBuildingSubject } from "./internal/describeAutoMovieBuildingSubject";
import { describeAutoMovieInstanceSetSubject } from "./internal/describeAutoMovieInstanceSetSubject";
import { describeAutoMovieInstanceSubject } from "./internal/describeAutoMovieInstanceSubject";
import { describeAutoMovieSpaceSubject } from "./internal/describeAutoMovieSpaceSubject";
import { describeAutoMovieSubject } from "./internal/describeAutoMovieSubject";
import { describeAutoMovieSubjects } from "./internal/describeAutoMovieSubjects";
import { diffAutoMovieSubjects } from "./internal/diffAutoMovieSubjects";
import { foldAutoMovieSubjectReviewCoverage } from "./internal/foldAutoMovieSubjectReviewCoverage";
import { mergeAutoMovieSubjectContributions } from "./internal/mergeAutoMovieSubjectContributions";
import { resolveAutoMovieSubjectReviewUnit } from "./internal/resolveAutoMovieSubjectReviewUnit";

/** Address, describe, compare and compose subjects in compiled shots. */
export namespace AutoMovieEngineSubjects {
  /** Return the stable address for a subject kind and its ids. */
  export function address(
    ...subject: Parameters<typeof autoMovieSubjectAddress>
  ): string {
    return autoMovieSubjectAddress(...subject);
  }

  /** Page subject member addresses in render-id order. */
  export function memberSummary(
    ids: readonly string[],
    offset: number,
  ): IAutoMovieSubjectMemberSummary {
    return autoMovieSubjectMemberSummary(ids, offset);
  }

  /** Index model parts by their complete prototype-part address. */
  export function createPartIndex(
    models: ReadonlyMap<string, IAutoMovieModel>,
  ): (modelId: string, address: string) => IAutoMovieModelPart | undefined {
    return createAutoMovieSubjectPartIndex(models);
  }

  /** Describe one building unit in a built environment. */
  export function describeBuilding(
    environment: IAutoMovieBuiltEnvironment,
    building: IAutoMovieBuildingUnit,
    boxes: ReadonlyMap<string, readonly IAutoMovieSubjectBox[]>,
    revision: string,
    memberOffset: number,
  ): IAutoMovieSubjectDescription {
    return describeAutoMovieBuildingSubject(
      environment,
      building,
      boxes,
      revision,
      memberOffset,
    );
  }

  /** Describe one compiled instance set. */
  export function describeInstanceSet(
    set: IAutoMovieCompiledInstanceSet,
    models: ReadonlyMap<string, IAutoMovieModel>,
    space: string | null,
    revision: string,
    memberOffset: number,
  ): IAutoMovieSubjectDescription {
    return describeAutoMovieInstanceSetSubject(
      set,
      models,
      space,
      revision,
      memberOffset,
    );
  }

  /** Regenerate and describe one compact instance-set member. */
  export function describeInstance(
    set: IAutoMovieCompiledInstanceSet,
    slot: number,
    models: ReadonlyMap<string, IAutoMovieModel>,
    space: string | null,
    revision: string,
    points: (model: IAutoMovieModel) => readonly IAutoMovieVector3[],
  ): IAutoMovieSubjectDescription {
    return describeAutoMovieInstanceSubject(
      set,
      slot,
      models,
      space,
      revision,
      points,
    );
  }

  /** Describe one logical space in a built environment. */
  export function describeSpace(
    environment: IAutoMovieBuiltEnvironment,
    space: IAutoMovieBuiltEnvironment["spaces"][number],
    revision: string,
    memberOffset: number,
  ): IAutoMovieSubjectDescription {
    return describeAutoMovieSpaceSubject(
      environment,
      space,
      revision,
      memberOffset,
    );
  }

  /** Describe one stored or regenerable subject by its stable address. */
  export function describe(
    artifact: IAutoMovieSubjectArtifact,
    subjectId: string,
    props?: IAutoMovieDescribeSubject.IProps,
  ): IAutoMovieSubjectDescription {
    return describeAutoMovieSubject(artifact, subjectId, props);
  }

  /** List directly stored subjects, sorted by stable address. */
  export function describeAll(
    artifact: IAutoMovieSubjectArtifact,
  ): IAutoMovieSubjectDescription[] {
    return describeAutoMovieSubjects(artifact);
  }

  /** Compare two subject inventories without rendering either artifact. */
  export function diff(
    beforeArtifact: IAutoMovieSubjectArtifact,
    afterArtifact: IAutoMovieSubjectArtifact,
    tolerance?: number,
  ): IAutoMovieSubjectDiff {
    return diffAutoMovieSubjects(beforeArtifact, afterArtifact, tolerance);
  }

  /** Fold current observation receipts against a resolved review unit. */
  export function foldReviewCoverage(
    unit: IAutoMovieSubjectReviewUnit,
    current: IAutoMovieSubjectReviewCurrentContext,
    viewpoints: readonly IAutoMovieSubjectReviewViewpoint[],
    observations: readonly IAutoMovieCurrentSubjectReviewObservation[],
  ): IAutoMovieSubjectReviewCoverage {
    return foldAutoMovieSubjectReviewCoverage(
      unit,
      current,
      viewpoints,
      observations,
    );
  }

  /** Merge contributions in their authored order. */
  export function mergeContributions(
    contributions: readonly IAutoMovieSubjectContribution[],
  ): IAutoMovieSubjectContribution {
    return mergeAutoMovieSubjectContributions(contributions);
  }

  /** Resolve a review unit with its inspection-owned description. */
  export function resolveReviewUnit(
    artifact: IAutoMovieSubjectArtifact,
    target: IAutoMovieSubjectReviewTarget,
  ): IAutoMovieSubjectReviewUnit {
    return resolveAutoMovieSubjectReviewUnit(artifact, target);
  }
}
