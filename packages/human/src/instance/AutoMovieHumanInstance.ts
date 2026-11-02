import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { AutoMovieHumanRig } from "../skeleton/AutoMovieHumanRig";
import type { AutoMovieHumanSkeleton } from "../skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanExpression } from "../structures/expression/IAutoMovieHumanExpression";
import type { IAutoMovieHumanPose } from "../structures/pose/IAutoMovieHumanPose";
import type { AutoMovieHumanChange } from "./AutoMovieHumanChange";
import { AutoMovieHumanEnginePose } from "./AutoMovieHumanEnginePose";
import { AutoMovieHumanMouthState } from "./AutoMovieHumanMouthState";
import { AutoMovieHumanStateAdmission as Admission } from "./AutoMovieHumanStateAdmission";

/**
 * The mutable state of one posed Human over an immutable prepared shape.
 *
 * Ownership: the body (an `IAutoMovieHumanPrepared`, or any evaluator with its
 * rig) is borrowed and shared by every instance of that person; this instance
 * owns only its pose, expression and root and the evaluation cached for them.
 * Two instances of one body therefore pose independently and share nothing
 * mutable.
 *
 * Initial state applies once: the prepared model is at the bind and carries
 * no pose, and the instance takes `initial` (by default the parameters' pose
 * and expression) as its first state. Every pose is absolute from neutral, so
 * a later update evaluates the whole requested pose again from neutral and
 * never composes onto what is shown; applying the same pose twice shows the
 * same body.
 *
 * Updates come as a full `snapshot`, where an omitted field returns to neutral
 * pose, neutral face or identity root, or as a `patch`, where a pose merges
 * field by field into the current pose and an expression or root replaces
 * the current one. {@link plan} admits and evaluates an update without
 * changing anything, {@link commit} adopts a plan, and {@link update} does
 * both. A consumer that writes the plan to a renderer commits only after the
 * write succeeds, so a failed update leaves the previous state in force. A
 * plan made before another commit is stale and refused.
 *
 * Equivalence: the evaluator is a pure function of the authored pose composed
 * with the expression's jaw request, so equal effective pose text reuses the evaluation
 * and reports no `pose` change. The instance declares no time-dependent
 * effect; a clock owner such as `AutoMovieHumanController` advances time
 * independently, and skipping equal state never skips its work.
 *
 * Dispose is terminal: it releases the cached evaluation and every later call
 * except {@link state} and dispose throws.
 */
export class AutoMovieHumanInstance {
  /** Borrowed shape; released on disposal. */
  private body: AutoMovieHumanInstance.IBody | undefined;

  /** Current admitted state. */
  private current: AutoMovieHumanInstance.IState;

  /** Canonical text of the current pose. */
  private poseKey: string;

  /** Evaluation of the current pose, computed when first needed. */
  private evaluated: AutoMovieHumanSkeleton.IOutput | undefined;

  /** Rig-local transforms of the current pose, computed when first needed. */
  private local:
    | ReadonlyMap<AutoMovieHumanoidBone, AutoMovieHumanRig.ILocal>
    | undefined;

  /** Commits so far; a plan records the revision it was made against. */
  private revisionCount: number = 0;

  /**
   * Admit the initial state; evaluation waits until a consumer needs it.
   *
   * @param body The prepared shape this instance poses.
   * @param initial First state; omitted fields are neutral, identity root.
   * @throws {Error} When the initial pose, expression or root is inadmissible.
   */
  public constructor(
    body: AutoMovieHumanInstance.IBody,
    initial: Partial<AutoMovieHumanInstance.IState> = {},
  ) {
    this.current = {
      pose: Admission.pose(initial.pose ?? {}),
      expression: Admission.expression(initial.expression ?? { units: [] }),
      root: Admission.root(initial.root ?? Admission.identity()),
    };
    this.body = body;
    this.poseKey = Admission.key(this.effective(this.current));
  }

  /** Independent copy of the current state, readable after disposal. */
  public get state(): AutoMovieHumanInstance.IState {
    return structuredClone(this.current);
  }

  /** Commits so far: a consumer compares it to know whether it is current. */
  public get revision(): number {
    return this.revisionCount;
  }

  /** The current pose's evaluation, shared read-only with the caller. */
  public get output(): AutoMovieHumanSkeleton.IOutput {
    const body: AutoMovieHumanInstance.IBody = this.open();
    this.evaluated ??= body.evaluate(this.effective(this.current));
    return this.evaluated;
  }

  /** Mouth channels with the total evaluated jaw opening, including speech. */
  public get mouth(): ReturnType<typeof AutoMovieHumanMouthState.channels> {
    return AutoMovieHumanMouthState.channels(
      this.open().mouth,
      this.current.pose,
      this.current.expression,
      this.output,
    );
  }

  /** Mouth channels for a plan a consumer is about to write. */
  public mouthOf(plan: AutoMovieHumanInstance.IPlan): ReturnType<typeof AutoMovieHumanMouthState.channels> {
    this.check(plan);
    return AutoMovieHumanMouthState.channels(
      this.open().mouth,
      plan.state.pose,
      plan.state.expression,
      plan.output ?? this.output,
    );
  }

  /**
   * Deform immutable bind buffers for the current state or an uncommitted plan.
   * A renderer owns the returned buffers and restores its bind when null is returned.
   */
  public deformMouth(
    id: string,
    positions: ArrayLike<number>,
    normals: ArrayLike<number> | null,
    plan?: AutoMovieHumanInstance.IPlan,
  ): ReturnType<typeof AutoMovieHumanMouthState.deform> {
    return AutoMovieHumanMouthState.deform(
      this.open().mouth,
      plan === undefined ? this.mouth : this.mouthOf(plan),
      id,
      positions,
      normals,
    );
  }

  /** Clamps the evaluator applied to the current pose. */
  public get clamped(): AutoMovieHumanSkeleton.IClamp[] {
    return structuredClone(this.output.clamped);
  }

  /**
   * The current pose as each rig bone's transform in its parent's frame.
   *
   * @throws {Error} When the body has no rig.
   */
  public locals(): ReadonlyMap<
    AutoMovieHumanoidBone,
    AutoMovieHumanRig.ILocal
  > {
    this.local ??= AutoMovieHumanRig.locals(this.rig(), this.output);
    return this.local;
  }

  /**
   * The rig's bind as local transforms: the posture the skin was generated
   * in, which is not neutral. Showing it changes no state.
   *
   * @throws {Error} When the body has no rig.
   */
  public bindLocals(): ReadonlyMap<
    AutoMovieHumanoidBone,
    AutoMovieHumanRig.ILocal
  > {
    return AutoMovieHumanRig.bindLocals(this.rig());
  }

  /**
   * A plan's pose as rig-local transforms, for a consumer that writes it
   * before committing; a plan that keeps the pose gives the current ones.
   *
   * @param plan Output of {@link plan} on this instance.
   * @throws {Error} When the plan is stale or foreign, or the body has no rig.
   */
  public localsOf(
    plan: AutoMovieHumanInstance.IPlan,
  ): ReadonlyMap<AutoMovieHumanoidBone, AutoMovieHumanRig.ILocal> {
    if (plan.owner !== this || plan.revision !== this.revisionCount)
      throw new Error("Human instance plan is stale or foreign");
    return plan.output === undefined
      ? this.locals()
      : AutoMovieHumanRig.locals(this.rig(), plan.output);
  }

  /**
   * The current pose as an engine pose on the body's rig, through the
   * admitted adapter.
   *
   * @throws {Error} When the body has no rig or the pose cannot be carried; see `AutoMovieHumanEnginePose.admit`.
   */
  public enginePose(): IAutoMoviePose {
    return AutoMovieHumanEnginePose.admit(
      this.rig(),
      this.output,
      this.current.root,
    );
  }

  /**
   * Admit and evaluate an update without changing the instance.
   *
   * @param update The requested change.
   * @returns The plan, holding the next state and what changed.
   * @throws {Error} When any requested field is inadmissible; nothing changes.
   */
  public plan(
    update: AutoMovieHumanInstance.IUpdate,
  ): AutoMovieHumanInstance.IPlan {
    const body: AutoMovieHumanInstance.IBody = this.open();
    const snapshot: boolean = update.kind === "snapshot";
    const pose: IAutoMovieHumanPose =
      update.pose !== undefined
        ? snapshot
          ? Admission.pose(update.pose)
          : Admission.merge(this.current.pose, Admission.pose(update.pose))
        : snapshot
          ? {}
          : this.current.pose;
    const expression: IAutoMovieHumanExpression =
      update.expression !== undefined
        ? Admission.expression(update.expression)
        : snapshot
          ? { units: [] }
          : this.current.expression;
    const root: Admission.IRoot =
      update.root !== undefined
        ? Admission.root(update.root)
        : snapshot
          ? Admission.identity()
          : this.current.root;

    // Equal pose text means equal evaluation, so the current one is reused.
    const effective: IAutoMovieHumanPose = this.effective({ pose, expression, root });
    const key: string = Admission.key(effective);
    const changed: AutoMovieHumanChange.Class[] = [];
    let output: AutoMovieHumanSkeleton.IOutput | undefined = undefined;
    if (key !== this.poseKey) {
      changed.push("pose");
      output = body.evaluate(effective);
    }
    if (Admission.key(expression) !== Admission.key(this.current.expression))
      changed.push("expression");
    if (Admission.key(root) !== Admission.key(this.current.root))
      changed.push("root");
    return {
      owner: this,
      revision: this.revisionCount,
      state: { pose, expression, root },
      poseKey: key,
      output,
      changed,
    };
  }

  /**
   * Adopt a plan made against the current revision.
   *
   * @param plan Output of {@link plan} on this instance.
   * @throws {Error} When the plan belongs to another instance or a later commit made it stale.
   */
  public commit(plan: AutoMovieHumanInstance.IPlan): void {
    this.open();
    if (plan.owner !== this || plan.revision !== this.revisionCount)
      throw new Error("Human instance plan is stale or foreign");
    if (plan.changed.length === 0) return;
    this.current = structuredClone(plan.state);
    if (plan.changed.includes("pose")) {
      this.poseKey = plan.poseKey;
      this.evaluated = plan.output;
      this.local = undefined;
    }
    this.revisionCount++;
  }

  /**
   * Plan and commit one update.
   *
   * @param update The requested change.
   * @returns The classes that changed; empty when the state was already equal.
   */
  public update(
    update: AutoMovieHumanInstance.IUpdate,
  ): AutoMovieHumanChange.Class[] {
    const plan: AutoMovieHumanInstance.IPlan = this.plan(update);
    this.commit(plan);
    return [...plan.changed];
  }

  /** Release the body and evaluation; repeated calls are harmless. */
  public dispose(): void {
    this.body = undefined;
    this.evaluated = undefined;
    this.local = undefined;
  }

  /** The rig, or a refusal for a body prepared without one. */
  private rig(): IAutoMovieSkeleton {
    const skeleton: IAutoMovieSkeleton | null = this.open().skeleton;
    if (skeleton === null)
      throw new Error("Human instance body was prepared without a rig");
    return skeleton;
  }

  /** The body, or a refusal after disposal. */
  private open(): AutoMovieHumanInstance.IBody {
    if (this.body === undefined) throw new Error("Human instance is disposed");
    return this.body;
  }

  /** The skeleton consumes the authored pose and speech request exactly once. */
  private effective(state: AutoMovieHumanInstance.IState): IAutoMovieHumanPose {
    return AutoMovieHumanMouthState.pose(this.open().mouth, state.pose, state.expression);
  }

  /** Refuse a consumer's stale or foreign plan before reading its expression. */
  private check(plan: AutoMovieHumanInstance.IPlan): void {
    this.open();
    if (plan.owner !== this || plan.revision !== this.revisionCount)
      throw new Error("Human instance plan is stale or foreign");
  }
}

/** Contracts of {@link AutoMovieHumanInstance}. */
export namespace AutoMovieHumanInstance {
  /** What an instance borrows from its prepared shape. */
  export interface IBody {
    /** The body's prepared clinical evaluator. */
    evaluate: AutoMovieHumanSkeleton.PoseEvaluator;

    /** The rig the skin is bound to, or null for a body drawn without one. */
    skeleton: IAutoMovieSkeleton | null;

    /** Mouth geometry and articulation data, absent on a shape without an oral opening. */
    mouth?: AutoMovieHumanMouthState.IPrepared;
  }

  /** An instance's mutable state. */
  export interface IState {
    /** Clinical pose from neutral; `{}` is neutral, not the bind. */
    pose: IAutoMovieHumanPose;

    /** Supported lip and tongue fields, visemes and bilateral jaw action units. */
    expression: IAutoMovieHumanExpression;

    /** Placement of the model root in its parent, metres. */
    root: Admission.IRoot;
  }

  /** A requested change; fields are untrusted and admitted by the instance. */
  export interface IUpdate {
    /** `snapshot` replaces the whole state, `patch` changes the given fields. */
    kind: "snapshot" | "patch";

    /** Pose: the whole pose for a snapshot, fields to merge for a patch. */
    pose?: unknown;

    /** Expression, replacing the current one. */
    expression?: unknown;

    /** Root placement, replacing the current one. */
    root?: unknown;
  }

  /** An admitted, evaluated update not yet committed. */
  export interface IPlan {
    /** The instance that made it. */
    readonly owner: AutoMovieHumanInstance;

    /** The instance revision it was made against. */
    readonly revision: number;

    /** The state a commit adopts. */
    readonly state: IState;

    /** Canonical text of the authored pose composed with the speech jaw. */
    readonly poseKey: string;

    /** The new pose's evaluation, absent when the pose did not change. */
    readonly output: AutoMovieHumanSkeleton.IOutput | undefined;

    /** Classes that differ from the current state. */
    readonly changed: readonly AutoMovieHumanChange.Class[];
  }
}
