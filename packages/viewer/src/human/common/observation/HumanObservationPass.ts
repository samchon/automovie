import { HUMAN_OBSERVATION_PASSES } from "./HUMAN_OBSERVATION_PASSES.js";

/**
 * Display pass admitted by the shared Human observation definition.
 * Beauty is the material/lighting view; structural passes expose their named
 * quantities and do not certify material appearance.
 *
 * @evidence contracts/common.md#principled-implementation The union derives from the canonical eight pass names, keeping typed requests aligned with the runtime pass table and its actual material parameters.
 * @evidence contracts/common.md#clear-and-simple-design One shared literal population supplies types and runtime admission; body and face stages do not maintain separate pass spellings.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supported passes are explicit product choices rather than fixture names. A structural image is not accepted as proof of beauty or a numerical anatomical quantity it does not encode.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes beauty from structural reading limits and names the canonical definition owner.
 * @evidence contracts/performance.md#efficient-algorithms This finite union adds no runtime traversal; pass installation costs belong to observation's actual scene/material transformation.
 * @evidence contracts/performance.md#reuse-equivalent-work The type shares canonical names with the runtime table; equal names do not permit sharing reversible state between independent scenes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The type retains no material, scene or task. Temporary pass resources and restoration lifetime belong to the observation owner.
 */
export type HumanObservationPass = (typeof HUMAN_OBSERVATION_PASSES)[number];
