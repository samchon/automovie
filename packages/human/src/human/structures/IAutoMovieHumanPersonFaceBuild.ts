import type { IAutoMovieModel } from "@automovie/interface";

import type { IHumanFaceHairContactLayout } from "../../face/anatomy/hair/IHumanFaceHairContactLayout";
import type { IHumanFaceOralMeasurementRegistration } from "../../face/anatomy/oral/IHumanFaceOralMeasurementRegistration";
import type { IHumanFaceMaterialAttachment } from "../../face/structures/IHumanFaceMaterialAttachment";

/**
 * One admitted ordinary face-producer result captured for legacy person assembly. Model, copied emitted hair identities/contact layouts, exact material seats and optional source-neutral/oral correspondence belong to this call; later mouthClose-zero normal-reference evaluations cannot overwrite these snapshots. Omitted source-neutral reference remains a named acquisition gap rather than implicit basis-neutral coordinates. Readonly collection types alone are not a runtime deep freeze or source-authenticity certificate.
 *
 * @evidence contracts/common.md#principled-implementation One actual successful face call keeps model/emitted hair/native seats and optional references paired with its own source identity/population.
 * @evidence contracts/common.md#clear-and-simple-design Canonical model and specialised hair/material/oral carriers retain their owners while the person adapter captures evaluation-local snapshots.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing reference/crowns remain unavailable and later reference calls cannot substitute their geometry; snapshots do not claim authentic clinical acquisition or current visual acceptance.
 * @evidence contracts/common.md#meaningful-documentation Prose states admitted ordinary-call timing, snapshot ownership, distinct normal-reference evaluation and readonly/runtime boundary.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This result schema performs no face evaluation, hair copy or material/oral scatter; the face adapter owns those operations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Snapshot reuse across person placement is consumer behavior rather than an evaluation cache implemented by this record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no source stream or worker; actual caller/adapter values own model, snapshot and optional reference lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonFaceBuild {
  /** Successfully admitted face model, owned by this evaluation's caller. */
  model: IAutoMovieModel;

  /** Copied semantic identities of hair emitted by this call. */
  hairPartIds: ReadonlySet<string>;

  /** Owned geometry-produced per-part station membership and clearance from this same call. */
  hairContactLayouts: ReadonlyMap<string, IHumanFaceHairContactLayout>;

  /** This emission's exact material seats, keyed by physical domain and ID. */
  materialAttachments: ReadonlyMap<
    string,
    ReadonlyMap<number, IHumanFaceMaterialAttachment>
  >;

  /** Owned source-neutral reference snapshot, when requested and available. */
  reference?: ReadonlyMap<string, readonly number[]>;

  /** Owned successful oral correspondence; absent crowns remain unavailable. */
  oral?: IHumanFaceOralMeasurementRegistration;
}
