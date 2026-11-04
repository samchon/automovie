/**
 * Generator-independent inputs consumed by the original cartoon face drawing.
 * These marks express selected action units; they are not anatomical skin.
 *
 * @evidence contracts/common.md#principled-implementation Structural action intensities and admitted gaze/jaw values preserve the original renderer's input semantics without importing a generator schema.
 * @evidence contracts/common.md#clear-and-simple-design Contains only expression and head-pose fields that the drawing reads.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No named emotion, likeness or authored motion enters these inputs; unsupported requested actions are reported by the builder.
 * @evidence contracts/common.md#meaningful-documentation States drawing-only expression, intensity, angle and displacement units.
 * @evidenceExclude contracts/performance.md#efficient-algorithms These erased input contracts perform no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work These types coordinate no cache or effects.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller-owned records acquire no native resources.
 */
export namespace AutoMovieHumanCartoon {

  /**
   * Sided FACS intensities and optional named mouth actions.
   *
   * @evidence contracts/common.md#principled-implementation Unit names remain strings so unsupported requests survive to explicit reporting; sided activations and named lip values have the same [0,1] intensity semantics.
   * @evidence contracts/common.md#clear-and-simple-design Exposes the consumed structural expression rather than depending on Human runtime enums or its skin deformation implementation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Tongue and viseme values are retained only for unsupported-field reporting, never claimed as drawn articulation.
   * @evidence contracts/common.md#meaningful-documentation States sided activation, neutral omission, duplicate-unit refusal and unsupported mouth fields.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This interface performs no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Explicit face construction owns input processing, not this record.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Expression records own no geometry or native resources.
   */
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

  /**
   * Already admitted finite eye and jaw articulation for face marks.
   *
   * @evidence contracts/common.md#principled-implementation Gaze remains degrees and jaw displacement millimetres, converted once by the original face formulas; skeletal head orientation stays on the parent.
   * @evidence contracts/common.md#clear-and-simple-design Separates facial mark articulation from evaluator-owned neck/head transforms.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This drawing contract introduces no clinical clamp, solver or anatomical motion claim.
   * @evidence contracts/common.md#meaningful-documentation Gives angle/displacement units, axis signs and neutral omission.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This pose shape computes nothing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The caller decides when an expression needs rebuilding.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Pose records own no native resource.
   */
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
