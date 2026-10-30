import type {
  IAutoMovieHumanExpression,
  IAutoMovieHumanPose,
  AutoMovieHumanSkeleton as Skeleton,
} from "@automovie/human";
import { AutoMovieHumanController } from "@automovie/human/control";
import type * as THREE from "three";

import { reportAutoMovieResourceRetirement } from "../reportAutoMovieResourceRetirement.js";
import { HumanRigBinding } from "./HumanRigBinding.js";
import type { IAutoMovieHumanVisual } from "./IAutoMovieHumanVisual.js";

/**
 * Optional Three facade for one prepared Human and caller-owned rigid drawings.
 * Human control is the sole time owner; Three samples that local time through
 * its existing tracks and FK. Geometry, authored choreography and face drawing
 * stay with the caller. Construction transfers visual disposal ownership only
 * on success; failure restores its borrowed parent order and matrix state.
 * A fixed body's rest, definitions and prepared clips are private;
 * getters and prepareMotion return independent data/track copies.
 *
 * Explicit setPose stops body playback and retains endpoint ROM clamping.
 * setExpression preserves playback. Body clips reject eye/jaw keys; gaze and
 * jaw use explicit setPose, and expressions use the visual's explicit callback.
 * Between-key clinical ROM, natural performance, contact, continuous skin and
 * physics remain outside this rigid facade's guarantees.
 *
 * @evidence contracts/common.md#principled-implementation The pure Human controller owns admitted clocks and immutable motion definitions; the original Three binding samples its local time while the existing Human evaluator owns clinical poses.
 * @evidence contracts/common.md#clear-and-simple-design Transport, Three placement and structural drawing ownership have separate owners; the optional entry introduces no eager main-barrel dependency or geometry catalogue.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Caller bone identities remain exact, unsupported face motion keys reject before transport changes, and no second FK, interpolation sampler, shape evaluation loop or physics adapter is added.
 * @evidence contracts/common.md#meaningful-documentation States successful ownership transfer, prototype matching, seconds, defensive snapshots, static-versus-clip facial controls, reset placement and disposal failures.
 * @evidence contracts/performance.md#efficient-algorithms Clip preparation evaluates distinct keys once; each accepted update refreshes bounded rig/visual placements and samples Three tracks only when local time changes, without rebuilding geometry or evaluating body shape.
 * @evidence contracts/performance.md#reuse-equivalent-work The control's private definition snapshot supplies both duration/loop and compiled tracks; clips remain valid only for the supplied fixed rest/evaluator and a new facade is required for another body.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns one control, rig, admitted clips and transferred visual lifetime; disposal attempts each owner once, clears successful callback references and preserves a failed retirement cause without retry.
 */
export class AutoMovieHumanFacade {
  /** Actual scene placement root; reset preserves caller translation, rotation and scale. */
  public readonly object: THREE.Group;

  /** Sole semantic motion and clock owner. */
  private readonly control: AutoMovieHumanController;

  /** Original Three interpolation, FK and rigid drawing placement owner. */
  private readonly binding: HumanRigBinding;

  /** Explicit face callback identity captured at construction, never read from mutable options again. */
  private faceUpdate: IAutoMovieHumanVisual["updateFace"];

  /** Transferred visual closer, released after successful disposal. */
  private retireVisual: (() => void) | undefined;

  /** Last admitted explicit public pose. */
  private pose: IAutoMovieHumanPose = {};

  /** Public expression retained independently from body playback. */
  private expression: IAutoMovieHumanExpression;

  /** Last explicit pose's endpoint clamps, not interpolated-ROM evidence. */
  private clamped: Skeleton.IClamp[] = [];

  /** Drawing-specific unsupported explicit fields. */
  private unsupported: string[] = [];

  /** Sticky failed retirement, preserving the original cause without another attempt. */
  private retirementFailure: { error: unknown } | undefined;

  /** Bind matching rest/evaluator/drawings; failed construction leaves visual disposal with the caller. */
  public constructor(options: AutoMovieHumanFacade.IOptions) {
    this.control = new AutoMovieHumanController(options.definitions);
    this.expression = structuredClone(options.expression ?? { units: [] });
    this.faceUpdate = options.visual.updateFace?.bind(options.visual);
    const retireVisual: () => void = options.visual.dispose.bind(
      options.visual,
    );
    this.binding = new HumanRigBinding(
      options.rest,
      options.evaluatePose,
      options.visual,
    );
    this.object = this.binding.object;
    try {
      this.unsupported = this.face(this.expression, undefined);
    } catch (error: unknown) {
      reportAutoMovieResourceRetirement(
        [
          (): void => this.binding.rollback(),
          (): void => this.control.dispose(),
        ],
        { error },
      );
      throw error;
    }
    this.retireVisual = retireVisual;
    this.binding.commit();
  }

  /** Fresh logical/input diagnostics, including final state after disposal. */
  public get state(): AutoMovieHumanFacade.IState {
    return {
      ...this.control.state,
      pose: structuredClone(this.pose),
      expression: structuredClone(this.expression),
      clamped: structuredClone(this.clamped),
      unsupported: [...this.unsupported],
      limitations: [
        "rigid-polygon-joints",
        "interpolated-ROM-unverified",
        "no-foot-contact-solver",
        "no-physics-or-ragdoll",
        "custom-Human-rig-not-engine-adapted",
        "clip-face-channels-require-explicit-controls",
      ],
    };
  }

  /** Independent fixed-rest snapshot; unavailable after disposal. */
  public get rest(): Skeleton.IOutput {
    this.open();
    return this.binding.rest;
  }

  /** Independent prepared clips and typed arrays; editing them changes no private playback. */
  public get clips(): ReadonlyMap<string, THREE.AnimationClip> {
    this.open();
    return this.binding.clips;
  }

  /** Independent admitted names; no authored catalogue is installed by this facade. */
  public get names(): string[] {
    return this.control.names;
  }

  /** Prepare a known body clip and return a copy, without selecting or playing it.
   *
   * @evidence contracts/common.md#principled-implementation Admits the name through the pure controller, prepares its body-specific Three clip and returns a clone without changing transport selection.
   * @evidence contracts/common.md#clear-and-simple-design The facade coordinates definition ownership while the binding owns compilation and private tracks.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown names or disposed ownership reject; preparation supplies no face-track or interpolated clinical-ROM guarantee.
   * @evidence contracts/common.md#meaningful-documentation Documents copy ownership and the absence of selection or playback effects.
   * @evidence contracts/performance.md#efficient-algorithms First preparation evaluates distinct key poses and emits key-by-bone tracks; later calls clone the prepared clip's arrays.
   * @evidence contracts/performance.md#reuse-equivalent-work The fixed body and private definition snapshot qualify named clip reuse in the binding.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The binding retains one clip per prepared admitted name until disposal; the caller owns each returned clone.
   */
  public prepareMotion(name: string): THREE.AnimationClip {
    this.prepare(name);
    return this.binding.clip(name);
  }

  /** Select and display a body clip at zero without playback; explicit face pose returns to default.
   *
   * @evidence contracts/common.md#principled-implementation Prepares a known clip, resets explicit face pose and samples the selected body at zero through the one logical controller.
   * @evidence contracts/common.md#clear-and-simple-design The facade sequences face update, transport selection and rigid binding rather than maintaining another clock.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Preparation or face refusal precedes logical selection; a later binding failure is propagated without a fabricated successful state.
   * @evidence contracts/common.md#meaningful-documentation States paused zero-time selection and the reset of explicit face pose while expression remains current.
   * @evidence contracts/performance.md#efficient-algorithms Reuses preparation and performs one body sample plus the explicit face callback's existing drawing work.
   * @evidence contracts/performance.md#reuse-equivalent-work The same prepared clip and drawing slots serve selection and later playback.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Clears prior explicit pose/clamp records; body and face lifetimes remain with their existing owners.
   */
  public select(name: string): void {
    this.prepare(name);
    const unsupported: string[] = this.face(this.expression, undefined);
    this.control.select(name);
    this.pose = {};
    this.clamped = [];
    this.unsupported = unsupported;
    this.binding.sample(name, 0);
  }

  /** Start a named clip from zero or resume a selected clip; selection is required when omitted.
   *
   * @evidence contracts/common.md#principled-implementation An explicit name starts at zero; omission resumes the selected motion, and the controller owns time while Three samples its local seconds.
   * @evidence contracts/common.md#clear-and-simple-design The facade distinguishes selection from resume before invoking the existing controller and binding.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No selection is invented when absent, and disposed or unknown input rejects; body playback does not synthesize facial tracks.
   * @evidence contracts/common.md#meaningful-documentation Documents named restart, selected resume and required selection on omission.
   * @evidence contracts/performance.md#efficient-algorithms Uses cached preparation when available and samples once; explicit naming additionally invokes the existing face update.
   * @evidence contracts/performance.md#reuse-equivalent-work Resume preserves the selected clip and expression; fixed-body named clips remain cached until disposal.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Owns no timer or frame callback; action and visual resources remain binding/visual owned.
   */
  public play(name?: string): void {
    this.open();
    const selected: string | null = name ?? this.control.state.motion;
    if (selected === null)
      throw new Error("Select a Human motion before playing");
    this.prepare(selected);
    if (name !== undefined) {
      const unsupported: string[] = this.face(this.expression, undefined);
      this.control.play(name);
      this.pose = {};
      this.clamped = [];
      this.unsupported = unsupported;
    } else this.control.play();
    this.binding.sample(selected, this.control.state.time);
  }

  /** Pause the one transport without changing body or expression.
   *
   * @evidence contracts/common.md#principled-implementation Delegates to the pure transport's pause operation without changing the drawing or expression.
   * @evidence contracts/common.md#clear-and-simple-design One logical controller owns playback state; this facade creates no second timing state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Pause does not reset pose, seek time or claim contact stability; disposed refusal comes from the controller.
   * @evidence contracts/common.md#meaningful-documentation States preservation of body and expression while playback pauses.
   * @evidence contracts/performance.md#efficient-algorithms Constant transport bookkeeping performs no clip sampling or mesh work.
   * @evidence contracts/performance.md#reuse-equivalent-work The existing selected action and drawing remain available for resume or refresh.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Acquires no task or resource and retains the already selected owner state.
   */
  public pause(): void {
    this.control.pause();
  }

  /** Seek seconds in the selected clip; a one-shot endpoint stops playback.
   *
   * @evidence contracts/common.md#principled-implementation Passes local seconds through the controller's selected-clip validation and samples the resulting admitted time once.
   * @evidence contracts/common.md#clear-and-simple-design The controller owns time and endpoint transport semantics; the binding owns Three interpolation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing selection or invalid seconds reject before sampling; one-shot endpoint stopping is not a physics event.
   * @evidence contracts/common.md#meaningful-documentation Documents seconds, selected-clip requirement and one-shot endpoint behavior.
   * @evidence contracts/performance.md#efficient-algorithms One controller seek and one existing rig sample scale with tracks and placement slots, without rebuilding geometry.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the selected prepared clip and fixed-body bindings.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains only existing transport/action state and acquires no clock or native resource.
   */
  public seek(seconds: number): void {
    this.control.seek(seconds);
    const state: AutoMovieHumanController.IState = this.control.state;
    this.binding.sample(state.motion!, state.time);
  }

  /** Reject decreasing absolute clocks before any logical or Three mutation.
   *
   * @evidence contracts/common.md#principled-implementation The pure controller validates monotonic absolute seconds before any drawing update; changed local time samples, otherwise refresh publishes ancestor transforms.
   * @evidence contracts/common.md#clear-and-simple-design Logical time advancement is separate from Three placement publication, including paused external-root changes.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Decreasing or invalid clocks reject without a second clock or compensating time patch.
   * @evidence contracts/common.md#meaningful-documentation States absolute-second admission and preservation of caller ancestor placement on unchanged local time.
   * @evidence contracts/performance.md#efficient-algorithms Reads two small states and performs one sample or refresh over the existing rig/slots.
   * @evidence contracts/performance.md#reuse-equivalent-work Prepared tracks and original geometry are reused on every accepted frame.
   * @evidence contracts/performance.md#bound-retention-and-release-resources No per-frame listener, timer or shape owner is acquired; scratch placement state stays with the binding.
   */
  public update(absoluteSeconds: number): void {
    const previous: AutoMovieHumanController.IState = this.control.state;
    this.control.update(absoluteSeconds);
    const current: AutoMovieHumanController.IState = this.control.state;
    if (current.motion !== null && current.time !== previous.time)
      this.binding.sample(current.motion, current.time);
    else this.binding.refresh();
  }

  /** Apply an explicit clinical pose and stop body playback, keeping the current expression.
   *
   * @evidence contracts/common.md#principled-implementation Uses the existing prepared clinical evaluator and validates local transforms before applying an explicit pose while retaining expression.
   * @evidence contracts/common.md#clear-and-simple-design The private explicit operation owns cloning, clamp reporting, face update and transport reset.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No separate FK or fitted joint correction is added; explicit clamps do not prove interpolated clip ROM.
   * @evidence contracts/common.md#meaningful-documentation Documents clinical input, stopped body playback and retained expression.
   * @evidence contracts/performance.md#efficient-algorithms Per-call work clones pose data, evaluates the fixed skeleton and converts its bone population; geometry remains unchanged.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the fixed prepared body and rest record for an empty pose.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The facade retains independent admitted pose/clamp records; temporary evaluation data is call-owned.
   */
  public setPose(pose: IAutoMovieHumanPose): void {
    this.explicit(pose, this.expression);
  }

  /** Replace explicit expression without stopping playback; failed drawing preserves the prior input.
   *
   * @evidence contracts/common.md#principled-implementation Clones the public expression and calls the visual with the current explicit head input before committing logical expression state.
   * @evidence contracts/common.md#clear-and-simple-design Expression replacement is independent of body transport and delegated drawing remains visual-owned.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed callback preserves prior logical expression; the callback contract separately owns drawing refusal and retirement failure.
   * @evidence contracts/common.md#meaningful-documentation Documents playback preservation and prior-input retention on drawing failure.
   * @evidence contracts/performance.md#efficient-algorithms Copies expression fields and performs only the supplied explicit face callback's drawing work.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses current explicit head input and existing body buffers; body clips are not recompiled.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The facade replaces its expression/unsupported copies; the visual owns old and replacement face retirement.
   */
  public setExpression(expression: IAutoMovieHumanExpression): void {
    this.open();
    const snapshot: IAutoMovieHumanExpression = structuredClone(expression);
    const unsupported: string[] = this.face(snapshot, this.pose.head);
    this.expression = snapshot;
    this.unsupported = unsupported;
  }

  /** Restore the prepared rest pose and neutral expression while preserving external root placement.
   *
   * @evidence contracts/common.md#principled-implementation Applies empty pose and neutral expression through the same explicit path, restoring prepared rest while leaving caller root placement intact.
   * @evidence contracts/common.md#clear-and-simple-design Reset shares the existing pose/expression admission and transport reset operation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No external root coordinates are patched and no new neutral skeleton is prepared.
   * @evidence contracts/common.md#meaningful-documentation States prepared rest, neutral expression and preserved whole-character placement.
   * @evidence contracts/performance.md#efficient-algorithms Uses the existing rest snapshot and bone conversion plus face update; no body shape generation occurs.
   * @evidence contracts/performance.md#reuse-equivalent-work The same rest prototype and drawing bindings qualify reuse.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Replaces explicit diagnostic records; existing binding and visual owners retain resource responsibility.
   */
  public reset(): void {
    this.explicit({}, { units: [] });
  }

  /** Attempt each owned retirement once; repeated failed disposal rethrows its stored original cause.
   *
   * @evidence contracts/common.md#principled-implementation Disposes the logical controller then attempts binding and transferred visual retirement through the existing failure collector.
   * @evidence contracts/common.md#clear-and-simple-design One terminal facade owner coordinates independent transform and drawing cleanup.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed retirement is stored and rethrown on later calls instead of retrying uncertain cleanup or reporting success.
   * @evidence contracts/common.md#meaningful-documentation Documents one-attempt fan-out and sticky original failure behavior.
   * @evidence contracts/performance.md#efficient-algorithms Retirement scales with owned clips, nodes and visual resources; successful repeats are constant-time.
   * @evidence contracts/performance.md#reuse-equivalent-work Repeated failed calls reuse the stored cause; successful disposal releases captured visual callbacks.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Attempts every independent owner once and drops callback references only on successful completion; failure retains uncertainty.
   */
  public dispose(): void {
    if (this.retirementFailure !== undefined)
      throw this.retirementFailure.error;
    if (this.control.state.disposed) return;
    this.control.dispose();
    try {
      reportAutoMovieResourceRetirement([
        (): void => this.binding.dispose(),
        (): void => this.retireVisual!(),
      ]);
      this.retireVisual = undefined;
      this.faceUpdate = undefined;
    } catch (error: unknown) {
      this.retirementFailure = { error };
      throw error;
    }
  }

  /** Both timing and track construction read this control's exact private definition source. */
  private prepare(name: string): void {
    this.open();
    this.binding.prepare(name, this.control.definition(name));
  }

  /** Validate evaluated transforms and face input before committing an explicit control. */
  private explicit(
    pose: IAutoMovieHumanPose,
    expression: IAutoMovieHumanExpression,
  ): void {
    this.open();
    const snapshot: IAutoMovieHumanPose = structuredClone(pose);
    const face: IAutoMovieHumanExpression = structuredClone(expression);
    const output: Skeleton.IOutput =
      Object.keys(snapshot).length === 0
        ? this.binding.rest
        : this.binding.evaluate(snapshot);
    const local: Map<string, HumanRigBinding.ILocal> =
      this.binding.pose(output);

    // Drawing gaze and jaw use the same admitted values as the existing clinical evaluator.
    for (const clamp of output.clamped) {
      const keys: string[] = clamp.path.split(".");
      let branch: Record<string, unknown> = snapshot as Record<string, unknown>;
      for (const key of keys.slice(0, -1))
        branch = branch[key] as Record<string, unknown>;
      branch[keys[keys.length - 1]!] = clamp.applied;
    }
    const unsupported: string[] = this.face(face, snapshot.head);
    this.control.reset();
    this.pose = snapshot;
    this.expression = face;
    this.clamped = structuredClone(output.clamped);
    this.unsupported = unsupported;
    this.binding.apply(local);
  }

  /** Explicit callback inputs and unsupported output never alias facade-owned records. */
  private face(
    expression: IAutoMovieHumanExpression,
    head: IAutoMovieHumanPose["head"],
  ): string[] {
    return [
      ...(this.faceUpdate?.(
        structuredClone(expression),
        structuredClone(head),
      ) ?? []),
    ];
  }

  /** A disposed facade admits only state diagnostics, root access and repeated disposal. */
  private open(): void {
    if (this.control.state.disposed)
      throw new Error("Human facade is disposed");
  }
}

/** Optional Three facade construction and diagnostic contracts. */
export namespace AutoMovieHumanFacade {
  /** Matching body/evaluator/visual inputs, with private definition and rest snapshots.
   *
   * @evidence contracts/common.md#principled-implementation Combines authored definitions, matching fixed rest/evaluator and original structural drawing with optional public expression.
   * @evidence contracts/common.md#clear-and-simple-design The construction boundary keeps reusable control and Three placement separate from caller-owned shape/example authoring.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Rest must be the same evaluator's empty pose for a fixed body; no visual ownership transfer occurs before successful facade construction.
   * @evidence contracts/common.md#meaningful-documentation Documents definition snapshots, prepared evaluator identity, transfer timing and neutral expression omission.
   * @evidence contracts/performance.md#efficient-algorithms The erased type adds no algorithm; construction clones definition/rest inputs and binds original drawing slots.
   * @evidence contracts/performance.md#reuse-equivalent-work One fixed body qualifies later pose evaluation and private named clip reuse.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains visuals on construction failure; successful construction transfers their disposer to the facade.
   */
  export interface IOptions {
    /** Existing caller-authored choreography; no catalogue is imported. */
    definitions: Readonly<Record<string, AutoMovieHumanController.IDefinition>>;

    /** Pose {} output from the same fixed prepared evaluator. */
    rest: Skeleton.IOutput;

    /** Prepared clinical evaluator; body shape must remain fixed for this facade lifetime.
     *
     * @evidence contracts/common.md#principled-implementation Maps clinical pose input through the caller's existing fixed prepared evaluator to metre-valued world placements and applied clamp diagnostics.
     * @evidence contracts/common.md#clear-and-simple-design The callback supplies Human semantics while the binding only converts the returned placements into local transforms.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The callback must preserve body shape and rest identities; it is not a second shape generator or facade-owned FK.
     * @evidence contracts/common.md#meaningful-documentation Documents the prepared clinical evaluator and fixed-body lifetime premise.
     * @evidence contracts/performance.md#efficient-algorithms The callback signature is erased; each explicit pose or distinct compiled key incurs its existing evaluator cost.
     * @evidence contracts/performance.md#reuse-equivalent-work Reuses one prepared body throughout facade lifetime rather than preparing shape per sample.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The binding retains the callback until disposal; evaluated records are consumed without transferring evaluator ownership.
     */
    evaluatePose: (pose: IAutoMovieHumanPose) => Skeleton.IOutput;

    /** Original structural drawing slots, transferred only after successful construction. */
    visual: IAutoMovieHumanVisual;

    /** Explicit public expression; omission means neutral. */
    expression?: IAutoMovieHumanExpression;
  }

  /** Logical transport plus independent explicit pose/expression diagnostics.
   *
   * @evidence contracts/common.md#principled-implementation Extends the pure controller's logical state with defensive explicit pose, expression, applied clamps and declared limitations.
   * @evidence contracts/common.md#clear-and-simple-design One diagnostic record keeps body playback distinct from explicit facial/clinical inputs.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty explicit pose during clips and endpoint clamp records do not certify interpolated ROM, skin binding or physics.
   * @evidence contracts/common.md#meaningful-documentation Documents unsupported face fields and the physical/clinical properties not established by this facade.
   * @evidence contracts/performance.md#efficient-algorithms The erased interface adds no work; the state getter copies current plain diagnostic populations.
   * @evidence contracts/performance.md#reuse-equivalent-work References the public controller state contract instead of duplicating transport semantics.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Callers own returned copies; the record exposes no mixer, mutable clip cache or visual resource handle.
   */
  export interface IState extends AutoMovieHumanController.IState {
    /** Last explicit admitted pose; body clips have an empty explicit pose. */
    pose: IAutoMovieHumanPose;

    /** Explicit expression, independent from body playback. */
    expression: IAutoMovieHumanExpression;

    /** Current explicit pose's endpoint clamps; not interpolated-ROM proof. */
    clamped: Skeleton.IClamp[];

    /** Explicit fields the supplied face drawing does not support. */
    unsupported: readonly string[];

    /** Physical, clinical and binding properties not established by this facade. */
    limitations: readonly string[];
  }
}
