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
 * Observations the placed scene inspector can read synchronously without seeking
 * or selecting an intended contact, owner or edit relation on its own.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Native references, independent expectations, actual receipts and their clocks are explicit.
 * @evidence contracts/development/design.md#principled-representation Distinct inputs represent source facts, native references and compiled track admission. Coverage is independent of whether any fact reports a finding.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the active camera, scene, available physical frame and selected authored obligations reach the observer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing providers never imply zero residual or a clean continuity edge. Native matrix ownership and caller-declared semantics are preserved.
 */
export namespace IObserveAutoMoviePlacedScene {
  /**
   * The original placed scene and source-owned checks at the selected clock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the point after placement, optional physical state, source checks and the time used to admit an optional touch witness.
   * @evidence contracts/development/design.md#principled-representation A native Scene and delivery Camera reference the original placement. An optional physical snapshot stays separate from native presentation objects.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Uses the same inputs in Viewer, capture and delivery, with no render or visit-history dependency.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The observer does not seek, resolve a motion or infer optional source times.
   */
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
   * A contact rule bound to placed Three objects and an independent local anchor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The named socket origin is the observed contacting point. The expected point is expressed in the support's rigid metre frame.
   * @evidence contracts/development/design.md#principled-representation Keeps the observation, support basis and declared target as three distinct facts.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Uses the existing support limits and a real placed socket without resampling model bones.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The selected socket can change with the rolling phase. A missing native reference cannot imply successful support.
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

  /**
   * A grip rule bound to a placed hand socket and prop.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the two actual frames and independent target in hand-local metres.
   * @evidence contracts/development/design.md#principled-representation Retains the actual displayed hand and prop separate from the expected closure and in-hand motion.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Reuses canonical grip limits and existing native references.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The owner supplies the expected grip. Non-rigid frame bases leave this measurement unsupported.
   */
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

  /**
   * One source-selected obligation and its stable report identity.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the key, ordered source paths, required policy and optional separately timed touch evidence.
   * @evidence contracts/development/design.md#principled-representation Canonical source facts, native contact references and raw track results share the report envelope, with need and evidence declared independently.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Source-specific poses and track buffers are not retained in a diagnostic. The observer can consume source-validation results prepared once.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Actual receipt evidence supplements a measured gap, never becomes its expected target. Track admission remains a source operation, not a frame scan.
   */
  export interface ICheck {
    /** Stable identity of the same rule and entity occurrence across frames. Use a unique key per check kind in each sample. */
    readonly key: string;

    /** Whether this declared obligation is required for delivery. */
    readonly required: boolean;

    /** Ordered entity paths, in addition to the failed field when applicable. */
    readonly paths?: readonly string[];

    readonly input:
      | IAutoMoviePlacedContact.IProps
      | IAutoMoviePlacedContinuity.IProps
      | INativeSupport
      | INativeGrip
      | {
          readonly kind: "track";
          readonly path: string;

          /** Canonical raw clip findings prepared once by the source owner. */
          readonly violations?: readonly IAutoMovieConstraintViolation[];
        };

    /** Actual touching or proximity witness from the same declared pair.
     * The producer selects one exact geometric or completed solver observation.
     * A null impulse identifies the absence of solver evidence.
     */
    readonly observedContact?: {
      readonly seconds: number;
      readonly separation: number;
      readonly impulse: number | null;
    };
  }
}
