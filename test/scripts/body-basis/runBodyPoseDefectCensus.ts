import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasisDocument";

import type { IBodyReviewState } from "../body-review/IBodyReviewState";
import { assertBodyPoseCensusIdentity } from "./assertBodyPoseCensusIdentity";
import { bodyPoseCensusRefusalMessage } from "./bodyPoseCensusRefusalMessage";
import type { BodyPoseDefectZone } from "./bodyPoseDefectZone";
import type { IBodyPoseDefectRow } from "./formatBodyPoseDefectTable";
import type { IBodyPoseCensusIdentity } from "./IBodyPoseCensusIdentity";
import { measureBodyPoseDefects } from "./measureBodyPoseDefects";

/**
 * Evaluate selected shape/pose pairs against one captured numerical input.
 * The command supplies a prepared body builder and fresh identity reader;
 * positions are the basis-ordered skin, never a material-split model. Each
 * shape's own rest is the denominator of its pose measurements. A refused
 * rest becomes a refusal for every requested pose instead of dropping that
 * shape from the population. Source or basis drift aborts the whole run outside
 * the refusal handler, so it cannot be reported as an anatomical rejection.
 * Only a builder call is caught as a refused state. Document preparation,
 * measurement and progress failures escape unchanged and prevent publication.
 * Results and documents are owned; the supplied states are never mutated.
 *
 * @evidence contracts/common.md#principled-implementation Each pose is measured against its own shape's rest with fixed basis-ordered correspondence. Only builder calls become refused states; document preparation, measurement and identity failures escape unchanged, so changed inputs or failed instruments cannot masquerade as rejected anatomical states.
 * @evidence contracts/common.md#clear-and-simple-design One shape loop and one pose loop distinguish rest refusal, pose refusal, measurement and provenance drift; the measurement formulas have one separate owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A refused build keeps its named row without a fabricated measurement. Input drift and measurement failures abort the table instead of being swallowed as builder refusals.
 * @evidence contracts/common.md#meaningful-documentation States the command consumer, correspondence, per-shape denominator, refusal handling and owned-input/result rules.
 */
export function runBodyPoseDefectCensus(input: {
  identity: IBodyPoseCensusIdentity;
  snapshot: () => IBodyPoseCensusIdentity;
  states: Readonly<Record<string, IBodyReviewState>>;
  shapes: readonly string[];
  poses: readonly string[];
  indices: readonly number[];
  zoneOfVertex: (vertex: number) => BodyPoseDefectZone;
  build: (document: IAutoMovieHumanBodyBasisDocument) => readonly number[];
  progress: (shape: string, pose: string) => void;
}): IBodyPoseDefectRow[] {
  const identity = structuredClone(input.identity);
  const states = structuredClone(input.states);
  const rows: IBodyPoseDefectRow[] = [];
  const state = (name: string): IBodyReviewState => {
    if (!Object.hasOwn(states, name))
      throw new Error("Unknown census review state: " + name);
    return states[name];
  };
  const buildState = (
    document: IAutoMovieHumanBodyBasisDocument,
  ): { positions: readonly number[] } | { refused: string } => {
    try {
      return { positions: input.build(document) };
    } catch (error: unknown) {
      return { refused: bodyPoseCensusRefusalMessage(error) };
    }
  };
  for (const shape of input.shapes) {
    assertBodyPoseCensusIdentity(identity, input.snapshot());
    const shapeState = state(shape);
    const rest = buildState({
      id: shape,
      name: shape,
      basis: identity.basis.id,
      shape: structuredClone(shapeState.shape),
    });
    for (const pose of input.poses) {
      assertBodyPoseCensusIdentity(identity, input.snapshot());
      const poseState = state(pose);
      if ("refused" in rest)
        rows.push({ shape, pose, defects: null, refused: rest.refused });
      else {
        const posed = buildState({
          id: shape + "-" + pose,
          name: shape + "-" + pose,
          basis: identity.basis.id,
          shape: structuredClone(shapeState.shape),
          pose: structuredClone(poseState.pose),
          shoulders: structuredClone(poseState.shoulders),
        });
        if ("refused" in posed)
          rows.push({ shape, pose, defects: null, refused: posed.refused });
        else
          rows.push({
            shape,
            pose,
            defects: measureBodyPoseDefects({
              indices: input.indices,
              rest: rest.positions,
              posed: posed.positions,
              zoneOfVertex: input.zoneOfVertex,
            }),
          });
      }
      assertBodyPoseCensusIdentity(identity, input.snapshot());
      input.progress(shape, pose);
    }
  }
  assertBodyPoseCensusIdentity(identity, input.snapshot());
  return rows;
}
