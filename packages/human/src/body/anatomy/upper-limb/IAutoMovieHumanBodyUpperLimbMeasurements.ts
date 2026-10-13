import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyShoulderMeasurements } from "../shoulder/IAutoMovieHumanBodyShoulderMeasurements";
import type { IAutoMovieHumanBodyForearmMeasurements } from "./IAutoMovieHumanBodyForearmMeasurements";
import type { IAutoMovieHumanBodyHandMeasurements } from "./IAutoMovieHumanBodyHandMeasurements";
import type { IAutoMovieHumanBodyUpperArmMeasurements } from "./IAutoMovieHumanBodyUpperArmMeasurements";

/**
 * One upper limb's nested shoulder girdle, arm and forearm anatomy.
 *
 * The shoulder owns clavicle, scapula and deltoid; the arm owns humerus; the forearm owns radius and ulna. Cross-group attachments and joints are typed separately instead of duplicating a bone in each adjacent region. The hand owns carpal bones and digit rays; its exterior dimensions remain in the one connected skin observation.
 *
 * @evidence contracts/common.md#principled-implementation A nonempty upper-limb tree composes shoulder, arm, forearm and hand anatomical owners without duplicating shared bones or joints.
 * @evidence contracts/common.md#clear-and-simple-design Each region owns its internal components while cross-group attachments remain separate typed relationships and skin spans remain surface-owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neighboring region measurements cannot duplicate one bone or replace independently measured carpals/digits with overall skin dimensions.
 * @evidence contracts/common.md#meaningful-documentation Members give same-side regional scopes and prose explains anatomical versus connected-skin ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Upper-limb anatomical composition performs no shoulder/forearm articulation or hand generation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Nested regional schemas share definitions without caching completed limb geometry across individuals.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This anatomical tree acquires no limb mesh, joint solver or internal-part runtime.
 * @author Samchon
 */
export type IAutoMovieHumanBodyUpperLimbMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Clavicle, scapula and deltoid of this side. */
    shoulder?: IAutoMovieHumanBodyShoulderMeasurements;

    /** Humerus and arm tissues of this side. */
    upperArm?: IAutoMovieHumanBodyUpperArmMeasurements;

    /** Separate radius and ulna of this side. */
    forearm?: IAutoMovieHumanBodyForearmMeasurements;

    /** Wrist and five independently measured hand rays. */
    hand?: IAutoMovieHumanBodyHandMeasurements;
  }>;
