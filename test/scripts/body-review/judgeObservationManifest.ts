import { OBSERVATION_MANIFEST_SCHEMA } from "./OBSERVATION_MANIFEST_SCHEMA";
import type { IBodyObservationManifestIdentity } from "./IBodyObservationManifestIdentity";
import type { IBodyObservationSource } from "./IBodyObservationSource";
import type { IBodyObservationJudgment } from "./IBodyObservationJudgment";

/**
 * Whether an observation manifest still describes the current source.
 *
 * A change to a shared basis reaches every part built on it, so an answer
 * written from an old observation no longer describes the result. A manifest
 * is stale when its response source digest is not the current viewer digest,
 * when it names another basis, when its build was not fresh when it was drawn,
 * or when its schema is one this reader does not
 * know. The first reason found is returned, in that order of severity: an
 * unknown schema cannot be read at all, so it wins.
 *
 * @param manifest The record to judge.
 * @param current The current revision and basis id.
 */
export function judgeObservationManifest(
  manifest: IBodyObservationManifestIdentity,
  current: IBodyObservationSource,
): IBodyObservationJudgment {
  if (manifest.schema !== OBSERVATION_MANIFEST_SCHEMA)
    return {
      stale: true,
      reason: `The manifest schema ${manifest.schema} is not the known ${OBSERVATION_MANIFEST_SCHEMA}.`,
    };
  if (manifest.basisId !== current.basisId)
    return {
      stale: true,
      reason: `The manifest was drawn on basis ${manifest.basisId}, not ${current.basisId}.`,
    };
  if (manifest.revision !== current.revision)
    return {
      stale: true,
      reason: `The manifest was drawn at revision ${manifest.revision}, not ${current.revision}.`,
    };
  if (!manifest.humanBuildFresh)
    return {
      stale: true,
      reason:
        "The manifest was drawn from a human build older than its source.",
    };
  return { stale: false, reason: "" };
}
