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

  /** Prepare a known body clip and return a copy, without selecting or playing it. */
  public prepareMotion(name: string): THREE.AnimationClip {
    this.prepare(name);
    return this.binding.clip(name);
  }

  /** Select and display a body clip at zero without playback; explicit face pose returns to default. */
  public select(name: string): void {
    this.prepare(name);
    const unsupported: string[] = this.face(this.expression, undefined);
    this.control.select(name);
    this.pose = {};
    this.clamped = [];
    this.unsupported = unsupported;
    this.binding.sample(name, 0);
  }

  /** Start a named clip from zero or resume a selected clip; selection is required when omitted. */
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

  /** Pause the one transport without changing body or expression. */
  public pause(): void {
    this.control.pause();
  }

  /** Seek seconds in the selected clip; a one-shot endpoint stops playback. */
  public seek(seconds: number): void {
    this.control.seek(seconds);
    const state: AutoMovieHumanController.IState = this.control.state;
    this.binding.sample(state.motion!, state.time);
  }

  /** Reject decreasing absolute clocks before any logical or Three mutation. */
  public update(absoluteSeconds: number): void {
    const previous: AutoMovieHumanController.IState = this.control.state;
    this.control.update(absoluteSeconds);
    const current: AutoMovieHumanController.IState = this.control.state;
    if (current.motion !== null && current.time !== previous.time)
      this.binding.sample(current.motion, current.time);
    else this.binding.refresh();
  }

  /** Apply an explicit clinical pose and stop body playback, keeping the current expression. */
  public setPose(pose: IAutoMovieHumanPose): void {
    this.explicit(pose, this.expression);
  }

  /** Replace explicit expression without stopping playback; failed drawing preserves the prior input. */
  public setExpression(expression: IAutoMovieHumanExpression): void {
    this.open();
    const snapshot: IAutoMovieHumanExpression = structuredClone(expression);
    const unsupported: string[] = this.face(snapshot, this.pose.head);
    this.expression = snapshot;
    this.unsupported = unsupported;
  }

  /** Restore the prepared rest pose and neutral expression while preserving external root placement. */
  public reset(): void {
    this.explicit({}, { units: [] });
  }

  /** Attempt each owned retirement once; repeated failed disposal rethrows its stored original cause. */
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
  /** Matching body/evaluator/visual inputs, with private definition and rest snapshots. */
  export interface IOptions {
    /** Existing caller-authored choreography; no catalogue is imported. */
    definitions: Readonly<Record<string, AutoMovieHumanController.IDefinition>>;

    /** Pose {} output from the same fixed prepared evaluator. */
    rest: Skeleton.IOutput;

    /** Prepared clinical evaluator; body shape must remain fixed for this facade lifetime. */
    evaluatePose: (pose: IAutoMovieHumanPose) => Skeleton.IOutput;

    /** Original structural drawing slots, transferred only after successful construction. */
    visual: IAutoMovieHumanVisual;

    /** Explicit public expression; omission means neutral. */
    expression?: IAutoMovieHumanExpression;
  }

  /** Logical transport plus independent explicit pose/expression diagnostics. */
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
