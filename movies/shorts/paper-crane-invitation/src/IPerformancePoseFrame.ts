import type { IAutoMovieHumanPose } from "@automovie/human";

/**
 * One fixed24fps pair of actually solved Human states, before prop/camera draw.
 *
 * @evidence contracts/common.md#implementation-and-ownership Stores the actual public solver poses and scene root transforms, with the matching residual observations. This is replay data, not a substitute solver or an independent contact certificate.
 * @evidence contracts/common.md#authoring-interface Index is the nonnegative24fps global frame. Pose uses Human clinical units; root translation uses world metres and quaternion x/y/z/w. The source controller owns creation and admission; consumers replay identical frame states without accumulating motion.
 */
export interface IPerformancePoseFrame {
  /** Global frame index at24fps. */
  index: number;
  /** Carina's actual applied Human state. */
  carina: {
    pose: IAutoMovieHumanPose;
    position: [number, number, number];
    rotation: [number, number, number, number];
  };
  /** Harry's actual applied Human state. */
  harry: {
    pose: IAutoMovieHumanPose;
    position: [number, number, number];
    rotation: [number, number, number, number];
  };
  /** Matching numerical support/hand observations; no visual approval. */
  diagnostics: {
    implementedThrough: number;
    time: number;
    /** Actual role-specific contact, requests, route correction and failures retained with this frame. */
    interaction?: {role:string;failures:string[];observations:object};
    carina: { support: "admitted" | "unresolved"; supportError: number; floorMinimum: number; handMode: "wrist" | "rigid-grasp-carrier" | "directed-grasp-carrier" | "directed-palm"; handDirectionError?:number;handDirectionGoal?:{origin:[number,number,number];direction:[number,number,number];probeLength:number;iterations:number}; wristGoalError: number | null; clamps: unknown[]; pinchGap: number | null; pinchGoalError: number | null; wristSeedError?: number; handFrameGoalError?: number; handFrameFitError?: number; handFrameGoal?: {origin:[number,number,number];rotation:[number,number,number,number];iterations:number}; handFrameRotationError?: number; handGoalKind?: string; pinchValid?: boolean; pinchMargin?: number; pinchNormalDot?: number; reason: string; iterations: number };
    harry: { handMode?:"palm-frame"|"palm-normal";handDirectionError?:number; support: "admitted" | "unresolved"; supportError: number; floorMinimum: number; handFrameGoalError?:number|null;handFrameFitError?:number|null;handFrameRotationError?:number|null;palmNormal?:number[];wristGoalError: number | null; clamps: unknown[]; reason: string; iterations: number };
  };
}
