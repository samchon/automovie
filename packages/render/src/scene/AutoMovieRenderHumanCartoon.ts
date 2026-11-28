import type * as THREE from "three";
import { buildHumanCartoonFace as buildHumanCartoonFaceImplementation } from "./human-polygon/internal/buildHumanCartoonFace";
/**
 * Generator-independent inputs consumed by the original cartoon face drawing.
 * These marks express selected action units; they are not anatomical skin.
 */
export namespace AutoMovieRenderHumanCartoon {
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
    mouth?: IExpressionMouth;
  }

  /** The mouth object of {@link IExpression}. */
  export type IExpressionMouth = {
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

  /** Already admitted finite eye and jaw articulation for face marks. */
  export interface IHeadPose {
    /** Gaze of each eye; omitted coordinates are zero degrees. */
    eyes?: IHeadPoseEyes;

    /** Jaw displacement at the incisors; omitted coordinates are zero mm. */
    jaw?: IHeadPoseJaw;
  }

  /** The jaw object of {@link IHeadPose}. */
  export type IHeadPoseJaw = {
    /** Opening in millimetres. */
    opening?: number;

    /** Forward protrusion in millimetres. */
    protrusion?: number;

    /** Lateral millimetres, positive toward anatomical left. */
    lateralExcursion?: number;
  };

  /** The eyes object of {@link IHeadPose}. */
  export type IHeadPoseEyes = {
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

  /** Actual local polygon head bounds and front-silhouette query. */
  export interface IHeadBounds {
    /** Actual head-local minimum in metres. */
    min: [number, number, number];
    /** Actual head-local maximum in metres. */
    max: [number, number, number];
    /** Most anterior local triangle X at Y/Z; undefined outside its silhouette. */
    frontAt: (y: number, z: number) => number | undefined;
    /** Stock sites in head-local metres. Omission uses bounds-based placement. */
    anchors?: IHeadAnchors;
  }

  /** Head-local Y/Z projections of the visible face sites, in metres. */
  export interface IHeadAnchors {
    /** Left rest eye joint, projected onto the head front when mounting. */
    leftEye: readonly [y: number, z: number];
    /** Right rest eye joint, projected onto the head front when mounting. */
    rightEye: readonly [y: number, z: number];
    /** Front shell exit in the nose contact direction. */
    nose: readonly [y: number, z: number];
    /** Front shell exit in the mouth contact direction. */
    mouth: readonly [y: number, z: number];
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
   * Build an owned cartoon face for a polygon head attachment.
   *
   * Add the result to the posed head group once. The group uses head-local
   * metres with +X forward, +Y up and +Z left. Marks follow the shell front
   * and stay inside its projected silhouette. By default the bounds determine
   * their positions. A supplied stock anchor replaces its mark's default site.
   * The marks are independent of collision.
   *
   * Supported units are AU1/2/4/5/6/7/12/15/20/23/24/25/26/27/41/43. Named
   * lip fields use the same units. Other actions, tongue and visemes are
   * reported as unsupported. Gaze changes the pupils and jaw displacement
   * changes the mouth marks. The caller supplies already admitted pose values.
   *
   * @param head Local polygon bounds and front query, with optional anchors.
   * @param expression Sided action units; omission means neutral.
   * @param pose Finite eye angles in degrees and jaw displacements in millimetres.
   * @returns Owned face geometry, explicit unsupported fields and its disposer.
   * @throws {Error} On invalid bounds, duplicate or invalid activations, or a mark whose front cannot be resolved.
   */
  export function buildFace(
    head: IHeadBounds,
    expression?: IExpression,
    pose?: IHeadPose,
  ): IFace {
    return buildHumanCartoonFaceImplementation(head, expression, pose);
  }
}
