import type {
  IAutoMovieConstraintViolation,
  IAutoMovieInspectionDiagnostics,
  IAutoMoviePhysicalFrame,
  IAutoMoviePlacedContact,
  IAutoMoviePlacedContinuity,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { Camera, Object3D, Scene } from "three";

/**
 * Observations the placed scene inspector can read synchronously without
 * seeking or selecting an intended contact, owner or edit relation on its own.
 */
export namespace IObserveAutoMoviePlacedScene {
  /** Findings and coverage produced by one placed-scene observation. */
  export type IResult = Pick<IAutoMovieInspectionDiagnostics, "findings" | "coverage">;
  /** The original placed scene and source-owned checks at the selected clock. */
  export interface IProps {
    /** Original scene before inspection overlays or visibility masks. */
    readonly scene: Scene;

    /** The canonical delivery camera, even when detached from the scene. */
    readonly camera: Camera;

    /** The clock of this observation when supplied by the host. */
    readonly time?: IAutoMovieInspectionDiagnostics.ITime;

    /** Physical snapshot already applied by the caller's placement. */
    readonly physicalFrame?: IAutoMoviePhysicalFrame;

    /** Authoritative checks selected for the placed occurrence by its owner. */
    readonly checks?: readonly ICheck[];
  }

  /**
   * A contact rule bound to placed Three objects and an independent local
   * anchor.
   */
  export type INativeSupport = Omit<
    Extract<IAutoMoviePlacedContact.IProps, { kind: "support" }>,
    "kind" | "sample"
  > & {
    readonly kind: "scene-support";
    readonly sample?: {
      /** Actual selected contact socket, with its origin at the observed point. */
      readonly socket: Object3D;

      /** Actual support reference, with local positive Y pointing outward. */
      readonly support: Object3D;

      /** Independent target in support-local metres. */
      readonly anchor: IAutoMovieVector3;
    };
  };

  /** A grip rule bound to a placed hand socket and prop. */
  export type INativeGrip = Omit<
    Extract<IAutoMoviePlacedContact.IProps, { kind: "grip" }>,
    "kind" | "sample"
  > & {
    readonly kind: "scene-grip";
    readonly sample?: {
      readonly hand: Object3D;
      readonly prop: Object3D;
      readonly expected: IAutoMovieRigidTransform;
    };
  };

  /** One source-selected obligation and its stable report identity. */
  export interface ICheck {
    /**
     * Stable identity of the same rule and entity occurrence across frames. Use
     * a unique key per check kind in each sample.
     */
    readonly key: string;

    /** Whether this declared obligation is required for delivery. */
    readonly required: boolean;

    /** Ordered entity paths, in addition to the failed field when applicable. */
    readonly paths?: readonly string[];

    /**
     * The obligation's observations and limits: a canonical contact or
     * continuity input, a contact bound to displayed native nodes, or the raw
     * clip findings of an authored track.
     */
    readonly input:
      | IAutoMoviePlacedContact.IProps
      | IAutoMoviePlacedContinuity.IProps
      | INativeSupport
      | INativeGrip
      | {
          /** Selects the authored track admission result. */
          readonly kind: "track";

          /** Source path of the authored track. */
          readonly path: string;

          /** Canonical raw clip findings prepared once by the source owner. */
          readonly violations?: readonly IAutoMovieConstraintViolation[];
        };

    /**
     * Actual touching evidence for the same declared pair at one film second,
     * in one of three classes. `measured` carries one exact geometric or
     * completed solver separation in metres, with a null impulse when no solver
     * evidence exists. `absent` states that the pair was completely observed at
     * that second and did not touch. `unobservable` states that the producer
     * could not observe the pair and why. The evidence supplements the measured
     * relation and its coverage. It never becomes the expected target, and it
     * never decides intended support or grip ownership on its own.
     */
    readonly observedContact?:
      | {
          readonly status: "measured";
          readonly seconds: number;
          readonly separation: number;
          readonly impulse: number | null;
        }
      | { readonly status: "absent"; readonly seconds: number }
      | {
          readonly status: "unobservable";
          readonly seconds: number;
          readonly reason: string;
        };
  }
}
