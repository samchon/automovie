import type { Course } from "./Course.ts";
import type { Event } from "./Event.ts";
import type { Family } from "./Family.ts";
import type { FeatureLoop } from "./FeatureLoop.ts";
import type { Landmark } from "./Landmark.ts";
import type { Pose } from "./Pose.ts";
import type { Section } from "./Section.ts";
import type { Silhouette } from "./Silhouette.ts";

/**
 * Collects private regional observations with source byte identity, posture and explicit limits.
 * This observation document is neither a product mesh nor proof that its curves regenerate skin.
 *
 * @evidence contracts/common.md#principled-implementation Preserves input-byte identity, posture, all observation families and explicit limits in one regional document, separate from product geometry.
 * @evidence contracts/common.md#clear-and-simple-design This record carries only this declaration's observation responsibility; geometric operators and consumer fitting remain separately owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no private source coordinates, identity table, consumer exception or product mesh.
 * @evidence contracts/common.md#meaningful-documentation Defines the record's observation purpose and its non-obvious units, ownership or qualification limits above and beside the affected members.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural type selects no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This structural type coordinates no execution or cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This structural type acquires no runtime resource.
 * @author Samchon
 */
export interface RegionFile {
  /** Version of the preserved regional observation interchange. */
  schema: "c2852-reflines-v4";

  /** Private input identity used for registration and provenance, without a clinical population claim. */
  gate: string;

  /** Observed anatomical region or geometric branch responsibility. */
  region: string;

  /** Producer responsible for interpreting and correcting these observations. */
  owner: string;

  /** Producer-recorded observation time in ISO 8601 form. */
  createdAt: string;

  /** Length unit for all world coordinates and dimensional observations unless a field states otherwise. */
  units: "mm";

  /** Explicit axis, handedness, origin and registration convention. */
  frame: string;

  /** Source byte identities and the posture or auxiliary role for which each was read. */
  sources: { file: string; sha256: string; pose: Pose | "auxiliary" }[];

  /** Identity of the actual producing tool bytes. */
  tool: { file: string; sha256: string };

  /** Declared station and phase conventions consumed by the regional sections. */
  families: Family[];

  /** Observed plane intersections with topology and closure status. */
  sections: Section[];

  /** Observed longitudinal guide pieces, preserving unsupported gaps. */
  courses: Course[];

  /** Observed feature boundaries with their extraction methods. */
  loops: FeatureLoop[];

  /** Scoped orthographic outlines and source-rim registration evidence. */
  silhouettes: Silhouette[];

  /** Geometric point observations with protocol and confidence. */
  landmarks: Landmark[];

  /** Observed changes in source section topology. */
  events: Event[];

  /** Scalar observations carrying their own units, posture and measurement protocol. */
  measures?: {
    id: string;
    name: string;
    value: number;
    unit: string;
    pose: Pose;
    method: string;
  }[];

  /** Unresolved assumptions, source defects and unsupported interpretations retained by the producer. */
  limits: string[];

  /** Optional producer diagnostics; these do not supersede independent consumer qualification. */
  selfCheck?: unknown;
}
