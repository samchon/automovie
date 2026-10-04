import type { IAutoMovieHumanBodyBasisCoupling } from "@automovie/human/body/structures/rig/IAutoMovieHumanBodyBasisCoupling";
import type { IAutoMovieHumanBodyBasisJoint } from "@automovie/human/body/structures/rig/IAutoMovieHumanBodyBasisJoint";
import type { IAutoMovieHumanBodyBasisPelvifemoral } from "@automovie/human/body/structures/rig/IAutoMovieHumanBodyBasisPelvifemoral";

import type { IHumanSourceGenerationAlias } from "./IHumanSourceGenerationAlias.ts";
import type { IHumanSourceGenerationAnchor } from "./IHumanSourceGenerationAnchor.ts";
import type { IHumanSourceGenerationAttachment } from "./IHumanSourceGenerationAttachment.ts";
import type { IHumanSourceGenerationBand } from "./IHumanSourceGenerationBand.ts";
import type { IHumanSourceGenerationBandTarget } from "./IHumanSourceGenerationBandTarget.ts";
import type { IHumanSourceGenerationChannel } from "./IHumanSourceGenerationChannel.ts";
import type { IHumanSourceGenerationCorrective } from "./IHumanSourceGenerationCorrective.ts";
import type { IHumanSourceGenerationGap } from "./IHumanSourceGenerationGap.ts";
import type { IHumanSourceGenerationInput } from "./IHumanSourceGenerationInput.ts";
import type { IHumanSourceGenerationLandmarks } from "./IHumanSourceGenerationLandmarks.ts";
import type { IHumanSourceGenerationPart } from "./IHumanSourceGenerationPart.ts";
import type { IHumanSourceGenerationPartition } from "./IHumanSourceGenerationPartition.ts";
import type { IHumanSourceGenerationSkin } from "./IHumanSourceGenerationSkin.ts";
import type { IHumanSourceGenerationStamp } from "./IHumanSourceGenerationStamp.ts";
import type { IHumanSourceGenerationUpstream } from "./IHumanSourceGenerationUpstream.ts";
import type { IHumanSourceGenerationWeights } from "./IHumanSourceGenerationWeights.ts";

/**
 * Source generation bundle G1 (#2689 N1): one person as one connected skin
 * with a head/body partition, the published face and body controls
 * re-addressed onto it, one weight map, the carried rig and parts, and the
 * dependency stamp of every derivative.
 *
 * `id` is the SHA-256 of the canonical upstream, sample and input digests, so
 * any change to a source byte names a different generation. Endpoint names
 * are unique across origins; `unavailable` lists body endpoints whose value
 * on vertices the published body never had has no producer, with the reason.
 * Face articulation and contact are carried in face-vertex terms through
 * `skin.faceVertexToSkin` and stamped accordingly. This is offline producer
 * data for the N2 comparison, not yet a runtime contract.
 *
 * The face owns the head partition's shape and the body carries the head
 * rigidly with `anchor` (the eye joint-cube mean of each body endpoint's
 * landmark rows). Endpoints in `anchor.targets` (every MPFB macro, defined
 * once over the whole skin) also store head-only rows relative to that anchor
 * and need no band; the others cross the cut only on `band` (null until
 * defined), recorded per endpoint in `bandTargets`. `drivers` lists the body
 * endpoints whose state drives head-partition data: macro head rows, part
 * `bodyTargets`, face landmark body rows and face corrective inputs;
 * `aliases` records the face controls that named the same macros; `gaps`
 * names what is deliberately left unrepresented, with its size and owners.
 *
 * @author Samchon
 */
export interface IHumanSourceGeneration {
  schema: string;
  id: string;
  upstream: IHumanSourceGenerationUpstream[];
  sample: Record<string, string | number>;
  inputs: IHumanSourceGenerationInput[];
  skin: IHumanSourceGenerationSkin;
  partition: IHumanSourceGenerationPartition;
  channels: IHumanSourceGenerationChannel[];
  correctives: IHumanSourceGenerationCorrective[];
  targets: Record<string, number[]>;
  unavailable: Record<string, string>;
  landmarks: IHumanSourceGenerationLandmarks[];
  joints: IAutoMovieHumanBodyBasisJoint[];
  couplings: IAutoMovieHumanBodyBasisCoupling[];
  pelvifemoral: IAutoMovieHumanBodyBasisPelvifemoral | null;
  weights: IHumanSourceGenerationWeights;
  parts: IHumanSourceGenerationPart[];
  stamps: IHumanSourceGenerationStamp[];
  band: IHumanSourceGenerationBand | null;
  bandTargets: IHumanSourceGenerationBandTarget[];
  attachments: IHumanSourceGenerationAttachment[];
  anchor: IHumanSourceGenerationAnchor | null;
  aliases: IHumanSourceGenerationAlias[];
  gaps: IHumanSourceGenerationGap[];
  drivers: string[];
}
