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
}
