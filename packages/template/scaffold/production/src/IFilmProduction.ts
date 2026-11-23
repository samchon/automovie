import type {
  IAutoMovieContactReceipt,
  IAutoMovieDeliveryContentAudit,
  IAutoMovieMark,
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalOwnershipEvent,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSupportWrench,
  IAutoMovieRenderSoftPropFrame,
} from "@automovie/interface";
import type {
  IAutoMovieDrawScene,
  IObserveAutoMoviePlacedScene,
  ISelectAutoMoviePlacedChecks,
  observeAutoMoviePlacedCamera,
  observeAutoMovieSceneCollision,
} from "@automovie/render";
import type * as THREE from "three";

/**
 * A mounted film's scene, camera and exact-time performance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment names what one mount holds; each member states what it owns and when it runs.
 * @evidence contracts/development/design.md#principled-representation Playback, seeking and capture all place the scene through one seek per second, so a second reached by any path draws the same state.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The hosts read the film scene and placement, optional soft surfaces, and the review sources: physical marks, named views, and film marks.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No playback-only or capture-only member exists; named views move only a separate inspection camera, so the film camera and delivered captures are unchanged.
 */
export interface IFilmProduction {
  /** Scene the Viewer renders, owned by this mount. */
  scene: THREE.Scene;

  /** Camera the Viewer renders through; camera entities move it in `seek`. */
  camera: THREE.PerspectiveCamera;

  /**
   * Soft prop surfaces for an exact film second, read after the film's own
   * seek. Absent leaves all object placement with the film.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the film timebase, placement order and absent behavior.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation The film owns the surface producer; this signature has no algorithm.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The film owns the surface producer; this signature has no body.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The signature maintains producer-owned surface data without providing a fallback.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no traversal or allocation strategy.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The film owns the evaluation and its already planned solve.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the film and the draw scene own their lifetimes.
   */
  softPropsAt?: (seconds: number) => readonly IAutoMovieRenderSoftPropFrame[];

  /** Additional authored diagnostics for the settled film, read before inspection masks or review cameras. */
  inspectPlaced?: IAutoMovieDrawScene["inspectPlaced"];

  /**
   * Optional source-owned shot layers, exemptions and motion cells for the settled collision scene.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that the film supplies them for the settled sample and what they scope.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation The film owns the layer producer; this signature has no algorithm.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The film owns the layer producer; this signature has no body.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The signature returns producer-owned layers without providing a fallback.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no traversal or allocation strategy.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The film owns any reuse of its shot layers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the film and the inspection own their lifetimes.
   */
  inspectionLayers?: (
    sample: IAutoMovieDrawScene.IPlacedSample,
  ) => Parameters<typeof observeAutoMovieSceneCollision>[0]["layers"];

  /**
   * Independent support, grip, custody and continuity expectations for the settled film.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which expectations the film supplies and for which sample.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation The film owns the expectation producer; this signature has no algorithm.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The film owns the expectation producer; this signature has no body.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The signature returns producer-owned checks without providing a fallback.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no traversal or allocation strategy.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The film owns any reuse of its expectations.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the film and the inspection own their lifetimes.
   */
  inspectionChecks?: (
    sample: IAutoMovieDrawScene.IPlacedSample,
  ) => readonly IObserveAutoMoviePlacedScene.ICheck[];

  /**
   * Subjects the current source shot requires the delivery camera to show at the placed second.
   *
   * Return only the requirements active at `sample.time`: leaving a subject out before its intended entry, or while the shot means it to be hidden, is how a shot allows off-screen or obscured action. Each returned subject is checked against the delivery projection, crop and aspect for leaving the frame, lying wholly before the near or past the far plane, being cut by the near plane and, as a warning that never blocks delivery, being cut by a side of the frame, with an actor framed by its current pose. `maxOcclusionRatio` adds a pixel-occlusion limit that only the delivery render measures.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which subjects to return at the placed second, how omission allows off-screen action, and what each returned subject is checked against.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation The film owns the requirement producer; this signature has no algorithm.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The film owns the requirement producer; this signature has no body.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The signature returns producer-owned requirements without providing a fallback.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no traversal or allocation strategy.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The film owns any reuse of its requirements.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the film and the inspection own their lifetimes.
   */
  inspectionCamera?: (
    sample: IAutoMovieDrawScene.IPlacedSample,
  ) => Parameters<typeof observeAutoMoviePlacedCamera>[0]["targets"];

  /** Optional source intent for the delivered media, including any soundtrack. */
  delivery?: IAutoMovieDeliveryContentAudit.IIntent;

  /** The film's cut, layout and declared breaks, so motion is never examined across a cut or break. Absent treats the whole film as one continuous shot. */
  playback?: Pick<
    ISelectAutoMoviePlacedChecks.IContinuity,
    "sequence" | "timeline" | "discontinuities"
  >;

  /** Inspection mark kinds that may first appear after second zero; `marks` still supplies their actual geometry at the drawn second. */
  markKinds?: readonly string[];

  /** Optional physical review source: `markFilmProduction` draws its bodies' skeleton, its contact forces and, when supplied, its support allocation as `joint`, `bone`, `contact`, `support/allocated` and `support/shortfall` marks. */
  performance?: {
    /** Scene ids and profiles for the displayed bodies. */
    bodies: { id: string; profile: IAutoMoviePhysicalProfile }[];
    /** Exact world state used by the current displayed frame. */
    frame: () => IAutoMoviePhysicalFrame;
    /** Actual geometric or solved contact episodes. */
    contacts: () => readonly IAutoMovieContactReceipt[];
    /** Optional ownership history of the same physics cache or playback, which tells the dynamic bodies a contact must reach from static and kinematic ones. Absent, no contact is flagged as unfelt. */
    ownership?: () => readonly IAutoMoviePhysicalOwnershipEvent[];
    /** Optional support wrenches of the same physics cache or playback, with the cache step each governs in seconds (the reciprocal of its rate). Absent, no support marks exist. */
    supports?: () => {
      wrenches: readonly IAutoMoviePhysicalSupportWrench[];
      interval: number;
    };
    /** Inspection vector length per newton of contact step-mean force or support force. */
    metresPerNewton: number;
    /** Optional longest contact arrow, metres, such as the height the camera frames around a body; a longer one, as an impact's, is drawn at this length as a `contact/clamped` mark whose label states the clamp. Absent, contact arrows keep their scaled length. */
    maximumArrowLength?: number;
  };

  /**
   * Optional named review cameras that the Viewer's `view` parameter selects,
   * such as a side-on view, one behind each subject or a high 45° view; each
   * places the inspection camera for the drawn second and leaves the film
   * camera untouched.
   */
  views?: Readonly<
    Record<
      string,
      (seconds: number) => {
        /** Camera position in world metres. */
        position: readonly [number, number, number];
        /** Point the camera looks at, in world metres. */
        target: readonly [number, number, number];
      }
    >
  >;

  /**
   * Optional inspection marks of the film at an exact second: what its owners locate, such as the construction curves of its built forms from `markAutoMovieConstructionCurves`. They are drawn only when an inspection's `marks` parameter names their kinds, in the Viewer and in a capture alike, and the drawn second's marks are asked for after `seek`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the marks locate, when they are drawn and when they are asked for.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature has no body; the film that implements it answers.
   */
  marks?: (seconds: number) => readonly IAutoMovieMark[];

  /**
   * Places every displayed object and the camera for an exact film second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that the call places every displayed object and the camera for one exact second.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature has no body; the film that implements it answers.
   */
  seek(seconds: number): void;

  /**
   * Releases the scene's resources when the Viewer page closes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the call releases and when.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature has no body; the film that implements it answers.
   */
  dispose(): void;
}
