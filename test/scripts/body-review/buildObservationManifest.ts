import { createHash } from "node:crypto";

import type { IBodyObservationUnit } from "./IBodyObservationUnit";

/** The manifest's schema version; a reader refuses one it does not know. */
export const OBSERVATION_MANIFEST_SCHEMA = 1;

/**
 * The record of one observation run, stable enough for a contract answer to
 * cite: what was derived for the unit, what was drawn and on which device and
 * source, and an identity for every frame, without image bytes.
 *
 * `derived` counts the frames the derivation asked for; `drawn` lists the
 * frames that exist, each with its file and SHA-256 computed here from the
 * bytes; `refused` lists the states the editor's own validator refused (their
 * frames are absent); `excluded` lists the extremes the rig's limits did not
 * admit, so a reader can tell "not observed because not permitted" from "not
 * observed because skipped". `revision` and `basisId` name the source and the
 * basis the frames came from, which `judgeObservationManifest` compares with
 * the current ones. The unit, its extremes and the views and passes are read
 * back from `drawn`, not restated, so the manifest cannot claim a view it
 * did not draw.
 *
 * A digest names the exact bytes of one frame. Two runs of the same frame on
 * the same GPU are not guaranteed to share it: in a measured pair of runs 18
 * of 20 frames matched and the other two differed by one colour level in one
 * pixel, which is rasterization noise and not a change of shape. Equal
 * digests therefore prove identity, unequal ones do not prove difference.
 *
 * @param input The unit, the run identity and what was drawn.
 */
export function buildObservationManifest(input: {
  unit: IBodyObservationUnit;
  revision: string;
  basisId: string;
  renderer: string;
  humanBuildFresh: boolean;
  drawn: {
    state: string;
    view: string;
    pass: string;
    file: string;
    bytes: Uint8Array;
    isolate: string[] | null;
  }[];
  refused: { state: string; reason: string }[];
}) {
  return {
    schema: OBSERVATION_MANIFEST_SCHEMA,
    kind: "body" as const,
    unit: input.unit.unit,
    id: input.unit.id,
    revision: input.revision,
    basisId: input.basisId,
    renderer: input.renderer,
    humanBuildFresh: input.humanBuildFresh,
    derived: input.unit.frames.length,
    drawn: input.drawn.map(({ bytes, ...frame }) => ({
      ...frame,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    })),
    refused: input.refused,
    excluded: input.unit.excluded,
  };
}
