import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyTomographicLength } from "../measurements/IAutoMovieHumanBodyTomographicLength";

/**
 * One rig-centred spherical humeral articular head in the posed body frame.
 *
 * A sphere-fitted imaging observation or explicit radius target describes an articular component, not the shaft, tubercles or complete humerus. Its centre is the existing rig's posed glenohumeral joint, which has not been verified as an individual's CT humeral-head centre. A separate skin query must establish geometric room.
 *
 * @evidence contracts/common.md#principled-implementation Bone identity, posed center and radius describe one rig-centered articular sphere; the observed branch retains its tomographic acquisition record.
 * @evidence contracts/common.md#clear-and-simple-design Shared sphere fields intersect source alternatives so CT/MRI provenance is required only for observed heads.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A posed rig joint is not a verified individual articular center, and the sphere cannot substitute for a complete humerus or skin-clearance proof.
 * @evidence contracts/common.md#meaningful-documentation Members give posed-frame meter units and distinguish prior, target, measured and acquisition-preserving observed sources.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The humeral-head result type performs no sphere fitting, joint posing or skin-clearance query.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Articular sphere metadata contains no equivalent posed-head evaluation cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Head records own neither tessellated sphere buffers nor tomographic scan handles.
 * @author Samchon
 */
export type IAutoMovieHumanBodyHumeralHead = {
  /** The upper-arm joint whose posed centre carries this side's head. */
  bone: "leftUpperArm" | "rightUpperArm";

  /** Posed glenohumeral rig centre in metres, Y up and Z forward. */
  center: IAutoMovieVector3;

  /** Articular sphere radius in metres, converted from supplied or prior mm. */
  radiusMetres: number;
} & (
  | {
      /** Population prior or supplied radius without an acquisition record. */
      readonly source: "adult-ct-prior" | "target" | "measured";
    }
  | {
      /** This source records CT/MRI method and posture instead of losing it. */
      readonly source: "observed";

      /** The observed radius's imaging method, posture and provenance. */
      readonly observation: Extract<
        IAutoMovieHumanBodyTomographicLength,
        { kind: "observed" }
      >;
    }
);
