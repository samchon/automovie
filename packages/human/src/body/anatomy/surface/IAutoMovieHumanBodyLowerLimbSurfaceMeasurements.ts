import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyFootSurfaceMeasurements } from "./IAutoMovieHumanBodyFootSurfaceMeasurements";
import type { IAutoMovieHumanBodyLegSurfaceMeasurements } from "./IAutoMovieHumanBodyLegSurfaceMeasurements";
import type { IAutoMovieHumanBodyThighSurfaceMeasurements } from "./IAutoMovieHumanBodyThighSurfaceMeasurements";

/**
 * One leg and foot's exterior measurements from defined skin landmarks.
 *
 * Mid-thigh and maximum-calf circumferences are distinct from the volumes of quadriceps, hamstrings or triceps surae. A skin hip-to-knee distance does not equal maximum femur length, and a knee-to-ankle distance does not equal tibial length. Length and girth conditions can later be solved against generated skin while bone and tissue remain separately validated outputs.
 *
 * @evidence contracts/common.md#principled-implementation A nonempty lower-limb tree separately owns thigh, shank and foot exterior measurements without equating skin spans with bone lengths.
 * @evidence contracts/common.md#clear-and-simple-design Regional measurement types own their fields; this side-specific container only composes them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Thigh/calf circumferences cannot stand in for muscle volumes and skin hip-knee or knee-ankle distances cannot replace femur/tibia lengths.
 * @evidence contracts/common.md#meaningful-documentation The prose separates exterior conditions from generated bone/tissue outputs and member comments identify each region's ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Lower-limb surface grouping performs no muscle-volume estimate or bone-length solve.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Regional grouping caches no generated lower-limb exterior or completed skin instrumentation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This measurement tree acquires no lower-limb mesh or tissue-generation resources.
 * @author Samchon
 */
export type IAutoMovieHumanBodyLowerLimbSurfaceMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Exterior conditions of this side's thigh above the knee. */
    thigh?: IAutoMovieHumanBodyThighSurfaceMeasurements;

    /** Skin-defined shank conditions between this side's knee and ankle. */
    leg?: IAutoMovieHumanBodyLegSurfaceMeasurements;

    /** Overall length and breadth of this side's foot. */
    foot?: IAutoMovieHumanBodyFootSurfaceMeasurements;
  }>;
