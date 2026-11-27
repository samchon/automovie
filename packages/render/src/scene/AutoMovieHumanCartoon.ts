import type * as THREE from "three";
import { buildHumanCartoonFace as buildHumanCartoonFaceImplementation } from "./human-polygon/internal/buildHumanCartoonFace.js";
/**
 * Generator-independent inputs consumed by the original cartoon face drawing.
 * These marks express selected action units; they are not anatomical skin.
 */
export namespace AutoMovieHumanCartoon {
  /** Sided FACS intensities and optional named mouth actions. */
  export interface IExpression {
    /** Omitted units are neutral; overlapping unit/side activations refuse. */
    units: {
      /** FACS action name; unsupported nonzero actions are reported. */
      unit: string;

      /** Drawing intensity from zero to one. */
      intensity: number;

      /** Anatomical side, or the same value on both sides. */
      side: "left" | "right" | "both";
    }[];

    /** Optional named lip actions; tongue/visemes are explicitly unsupported. */
    mouth?: {
      /** Named scalar or bilateral [0,1] mouth action intensities. */
      lips?: Partial<
        Record<
          | "upperLipRaiser"
          | "lipCornerPuller"
          | "lipCornerDepressor"
          | "lipStretcher"
          | "lowerLipDepressor"
          | "chinRaiser"
          | "lipPucker"
          | "lipFunneler"
          | "lipTightener"
          | "lipPressor"
          | "lipsPart"
          | "lipSuck"
          | "cheekPuff",
          | number
          | {
              /** Left intensity. */ left: number;

              /** Right intensity. */ right: number;
            }
        >
      >;

      /** Presence is reported as unsupported; contents are not interpreted. */
      tongue?: unknown;

      /** Presence is reported as unsupported; contents are not interpreted. */
      visemes?: unknown;
    };
  }

  /** Already admitted finite eye and jaw articulation for face marks. */
  export interface IHeadPose {
    /** Gaze of each eye; omitted coordinates are zero degrees. */
    eyes?: {
      /** Anatomical left-eye gaze. */
      left?: {
        /** Degrees, positive upward. */
        vertical?: number;

        /** Degrees, positive toward anatomical left. */
        horizontal?: number;
      };

      /** Anatomical right-eye gaze. */
      right?: {
        /** Degrees, positive upward. */
        vertical?: number;

        /** Degrees, positive toward anatomical left. */
        horizontal?: number;
      };
    };

    /** Jaw displacement at the incisors; omitted coordinates are zero mm. */
    jaw?: {
      /** Opening in millimetres. */
      opening?: number;

      /** Forward protrusion in millimetres. */
      protrusion?: number;

      /** Lateral millimetres, positive toward anatomical left. */
      lateralExcursion?: number;
    };
  }

  /** Actual local polygon head bounds and front-silhouette query. */
  export interface IHeadBounds {
    /** Actual head-local minimum in metres. */
    min: [number, number, number];
    /** Actual head-local maximum in metres. */
    max: [number, number, number];
    /** Most anterior local triangle X at Y/Z; undefined outside its silhouette. */
    frontAt: (y: number, z: number) => number | undefined;
  }

  /** Owned cartoon face drawing and unsupported expression fields. */
  export interface IFace {
    /** Add once to the polygon head's already posed group. */
    object: THREE.Group;
    /** Requested fields outside this cartoon's supported subset. */
    unsupported: readonly string[];
    /** Release every created geometry and material. */
    dispose: () => void;
  }

    /**
   * Build a deliberately exaggerated cartoon face for a posed polygon head. The
   * caller adds the returned object to the already posed head group once. Bounds
   * use that group's metres, +X forward, +Y up and +Z anatomical left. Eyes,
   * brows, nose and mouth are dimensioned marks, not anatomical skin. Supported
   * units are AU1/2/4/5/6/7/12/15/20/23/24/25/26/27/41/43; named lip fields reuse
   * those units. Other actions, tongue and visemes are reported as unsupported.
   * Head orientation stays with the parent; gaze moves pupils and jaw millimetres
   * move the mouth marks. Marks follow the actual polygon front; the silhouette
   * limits exaggerated brow and jaw travel. Pose values must be finite and
   * already admitted by the caller; this drawing applies no second clinical range
   * limit, including when clamping is disabled.
   *
   * @param head Actual local bounds of the polygon head, metres.
   * @param expression Existing public action-unit input; omission means neutral.
   * @param pose Admitted finite eye/jaw pose; neck motion is already on the
   *   parent.
   * @returns Owned face geometry, explicit unsupported fields and its disposer.
   */
  export function buildFace(
    head: IHeadBounds,
    expression?: IExpression,
    pose?: IHeadPose,
  ): IFace {
    return buildHumanCartoonFaceImplementation(head, expression, pose);
  }
}
