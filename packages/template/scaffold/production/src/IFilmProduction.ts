import type {
  IAutoMovieContactReceipt,
  IAutoMovieDeliveryContentAudit,
  IAutoMovieDialogueMouths,
  IAutoMovieFilmOptics,
  IAutoMovieFilmShading,
  IAutoMovieFilmSound,
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
 * @evidence contracts/development/design.md#minimal-and-owned-surface The hosts read the film scene and placement, optional soft surfaces and render-target work, the delivery intent and sound list, and the review sources: physical marks, named views, and film marks; they hand the film its dialogue mouths.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No playback-only or capture-only member exists; named views move only a separate inspection camera, so the film camera and delivered captures are unchanged. `speak` comes from every host that reads the sound files, the capture and the render alike, so stills and delivered frames show the same mouths; the Viewer reads no sound file and shows the authored mouth.
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

  /**
   * The film's camera response at an exact second: exposure in EV100, white balance, tone curve, glare and the adopted grade as ASC CDL values. Read after the film's own seek, before each beauty picture of the Viewer, a capture or the delivered video. Absent draws the scene light straight to the display under the renderer's default curve, which suits only light values already scaled to the display.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the response holds, when it is read and for which pictures, and what absence draws.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation The film owns the response producer; this signature has no algorithm.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The film owns the response producer; this signature has no body.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The signature returns producer-owned optics without providing a fallback.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no traversal or allocation strategy.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The film owns any reuse of its optics.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the draw host owns the response stage.
   */
  optics?: (seconds: number) => IAutoMovieFilmOptics;

  /**
   * The film's indirect shading at an exact second: the ambient occlusion of indirect light around each visible point and one diffuse bounce from probes baked over the static set. Read beside `optics` before each beauty picture, and at each sub-frame sample's own second when `optics` sets `samples`; a member without `optics` is refused. Absent leaves indirect light as the scene's image lighting gives it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the shading holds, when it is read, its dependency on optics and what absence draws.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation The film owns the shading producer; this signature has no algorithm.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The film owns the shading producer; this signature has no body.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The signature returns producer-owned shading without providing a fallback.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no traversal or allocation strategy.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The film owns any reuse of its shading.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the draw host owns the indirect stage.
   */
  shading?: (seconds: number) => IAutoMovieFilmShading;

  /**
   * Render-target work at an exact film second, run on the host's renderer after the film's own seek and before each picture of the Viewer, a capture or the delivered video: draw the shot's surface feeds with `renderFeeds` of the surface graphics `prepareAutoMovieSurfaceGraphics` returned, resolving each feed camera by id. It must leave the renderer's render target as it found it. Absent, no feed is drawn and a feed layer shows an empty target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States when the work runs, for which pictures, what it draws, the renderer state it must keep and what absence shows.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation The film owns its feeds; this signature has no algorithm.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The film owns its feeds; this signature has no body.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The signature draws film-owned feeds without providing a fallback.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no traversal or allocation strategy.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The film's surface graphics own their feed targets for every picture.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the film's surface graphics own the feed targets until `dispose`.
   */
  beforeDraw?: (renderer: THREE.WebGLRenderer, seconds: number) => void;

  /** Optional source intent for the delivered media, including any soundtrack. */
  delivery?: IAutoMovieDeliveryContentAudit.IIntent;

  /** Optional adopted sound: lines with their receipts, cues, speaker bindings and score ducking, which `npm run render` mixes into the delivered soundtrack; a film with a sound list leaves `delivery.audio.path` unset. */
  sound?: IAutoMovieFilmSound;

  /**
   * Takes the dialogue mouths of `sound`'s lines, handed once before the first frame by the capture and the render. Keep them, and in `seek` read each speaking actor's mouth for the second placed: `jaw(actor, seconds)` as the jaw opening of a Human or polygon man, or `visemes(actor, seconds)` for `applyExpression` on a VRM or imported model, layered over the authored expression. The render measures each phoneme-driven line's lip sync on the mouths read here. Absent, no mouth follows the sound. The Viewer hands none and shows the authored mouth.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States when the mouths arrive, how and where the film reads each form, what the render measures, and what absence and the Viewer show.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation The film owns its figures; this signature has no algorithm.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The film owns its figures; this signature has no body.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The signature hands over host-owned mouths without providing a fallback.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no traversal or allocation strategy.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The film keeps the one handed sampler for every seek.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The film holds the sampler until `dispose`; the draw page owns its record.
   */
  speak?: (mouths: IAutoMovieDialogueMouths) => void;

  /** The film's cut, layout and declared breaks, so motion is never examined across a cut or break, and whose sequence's transitions every film picture draws through `seekShot`. Absent treats the whole film as one continuous shot. */
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
   * Places every displayed object and the camera as one shot of `playback.sequence` shows them at its own shot-local `seconds`, during the film second `filmSeconds`: a transition's outgoing shot, which `seek` cannot place because the incoming entry is live there. Read the dialogue mouths and anything else on the film clock at `filmSeconds`. The hosts call it before placing `filmSeconds` again with `seek`, then dissolve the two pictures or dip them through black, as the entry's transition says. Required when the sequence has a transition: a delivered, captured or viewed picture inside one is refused without it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the call places, on which two clocks, when the hosts call it, what they do with the picture and when it is required.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature has no body; the film that implements it answers.
   */
  seekShot?(shot: string, seconds: number, filmSeconds: number): void;

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
