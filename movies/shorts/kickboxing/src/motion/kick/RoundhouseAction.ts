import {
  AutoMovieHumanLegIk,
  AutoMovieHumanRigControls,
  type AutoMovieHumanSkeleton,
  type IAutoMovieHumanPose,
} from "@automovie/human";
import * as THREE from "three";

import { ActionClock } from "../core/ActionClock";
import { ActionVariation } from "../core/ActionVariation";
import { MotionAction } from "../core/MotionAction";
import { MotionRecovery } from "../core/MotionRecovery";
import { MotionSupportChannels } from "../core/MotionSupportChannels";
import { RoundhouseContinuation } from "./RoundhouseContinuation";
import { RoundhouseKinematics } from "./RoundhouseKinematics";
import { RoundhouseReach } from "./RoundhouseReach";
import { RoundhouseTrajectory } from "./RoundhouseTrajectory";

/**
 * Reusable roundhouse intent, interrupted by the host's first actual interception.
 *
 * @evidence contracts/common.md#implementation-and-ownership One side-aware family joins load transfer, unloaded roll, delivery and replant. Preparation plans unchanged original world plantar tasks and exposes unresolved clinical residuals. Internal shin/knee/ankle shape is diagnostic; independent opponent impact and original sole remain external tasks. Deep ownership and a bounded input/evaluator-keyed cache preserve guard/toes and seek order. Full-foot measurement separates orientation from ground load. Chan/PLOS phase relations inform authored proportions, not physical admission.
 * @evidence contracts/common.md#authoring-interface Actor-local metres and clinical degrees follow MotionAction. Both sides and arbitrary actor identities share this definition. The actual prepared evaluator, neutral anatomy, initial shin/foot/hip geometry and sole witnesses are mandatory. The independent target never moves the opponent or shortens to the achieved endpoint; unresolved clinical/host residuals remain failures. Output requests establish no balance, contact or visual approval.
 */
export class RoundhouseAction {
  /** Independent placement snapshot, used only for contact attribution. */
  private readonly placement: MotionAction.Request;
  /** Fixed caller-owned geometry copied at construction. */
  private readonly options: RoundhouseAction.Options;
  /** Deterministic variation sampled exactly once for this action instance. */
  private readonly varied: ActionVariation.Result;
  /** Optional detached actual body/leg entry; continuing arms remain separately owned. */
  private readonly entry: RoundhouseContinuation.Entry | undefined;

  /** Internal leg shape identities; the independent original sole anchor is deliberately excluded. */
  private readonly returnPoints: MotionRecovery.Kinematics["effectors"];

  /** One bounded endpoint plan, invalidated by changed inputs or borrowed evaluator identity. */
  private prepared:
    | {
        key: string;
        evaluate: MotionAction.Context["evaluatePose"];
        measurement: MotionAction.Context["supportFrame"];
        targets: MotionAction.Context["supportTargets"];
        value: RoundhousePlan;
      }
    | undefined;

  /** Validate and retain only this action's immutable local inputs. */
  public constructor(
    request: MotionAction.Request,
    options: RoundhouseAction.Options,
    entry?: RoundhouseContinuation.Entry,
  ) {
    this.varied = ActionVariation.create(request);
    this.placement = structuredClone(request);
    this.options = structuredClone(options);
    this.entry = entry ? structuredClone(entry) : undefined;
    if (
      this.entry &&
      (!Number.isFinite(this.entry.windowSeconds) ||
        this.entry.windowSeconds <= 0 ||
        this.entry.windowSeconds > this.varied.timing.preparation * 0.25)
    )
      throw new Error(
        "Roundhouse entry must finish before the original first unload",
      );
    this.returnPoints = [
      {
        bone: AutoMovieHumanRigControls.joint(`${request.side}LowerLeg`),
        localPoint: [...options.shinLocalPoint],
        role: "strike",
        radius: 0,
      },
      {
        bone: AutoMovieHumanRigControls.joint(`${request.side}LowerLeg`),
        role: "guide",
        constraint: "soft",
        radius: 0,
      },
      {
        bone: AutoMovieHumanRigControls.joint(`${request.side}Foot`),
        role: "guide",
        constraint: "soft",
        radius: 0,
      },
    ];
    const opposite: MotionAction.Side =
      request.side === "left" ? "right" : "left";
    const points: MotionAction.Vec3[] = [
      options.supportPivotStart,
      options.kneePoint,
      options.kickingFoot,
      options.shinPoint,
      options.shinLocalPoint,
      options.supportingFoot,
      options.supportPivot.localPoint,
      options.supportPivot.world,
    ];
    if (
      !points.every(
        (point: MotionAction.Vec3): boolean =>
          Array.isArray(point) &&
          point.length === 3 &&
          point.every(Number.isFinite),
      )
    )
      throw new Error(
        "Roundhouse geometry requires finite measured metre points",
      );
    const actualLever: number = Math.hypot(
      options.shinPoint[0] - options.kneePoint[0],
      options.shinPoint[1] - options.kneePoint[1],
      options.shinPoint[2] - options.kneePoint[2],
    );
    if (
      actualLever <= 1e-7 ||
      Math.abs(actualLever - Math.hypot(...options.shinLocalPoint)) > 1e-6
    )
      throw new Error(
        "Roundhouse shin witness and knee must identify the same rigid bone-bound point",
      );
    if (!["low", "body", "high"].includes(options.height))
      throw new Error("Roundhouse requires an explicit target-height family");
    if (Math.hypot(request.direction[0], request.direction[2]) < 1e-8)
      throw new Error("Roundhouse requires a horizontal delivery direction");
    if (
      options.supportPivot.side !== opposite ||
      !AutoMovieHumanRigControls.isJoint(options.supportPivot.bone) ||
      !options.supportPivot.bone.startsWith(opposite) ||
      options.supportPivot.mode === "free"
    )
      throw new Error("Roundhouse pivot must belong to the other actual foot");
    MotionAction.validateSupportFrame(options.supportPivot);
    if (!options.supportPivot.frameRotation)
      throw new Error(
        "Roundhouse requires an actual floor-compatible supporting-foot roll frame",
      );
    if (
      ![options.initialSupport.left, options.initialSupport.right].every(
        (share: number): boolean => Number.isFinite(share) && share >= 0,
      ) ||
      Math.abs(options.initialSupport.left + options.initialSupport.right - 1) >
        1e-9
    )
      throw new Error("Roundhouse initial support shares must sum to one");
    if (
      !["left", "right"].every(
        (side: string): boolean =>
          options.initialSupport.patches?.some(
            (patch: MotionAction.SupportPatch): boolean =>
              patch.side === side && patch.mode === "planted",
          ) === true,
      )
    )
      throw new Error("Roundhouse needs both actual initial plantar witnesses");
    if (
      !options.initialSupport.patches!.every(
        (patch: MotionAction.SupportPatch): boolean =>
          [patch.localPoint, patch.world].every(
            (point: MotionAction.Vec3): boolean =>
              point.length === 3 && point.every(Number.isFinite),
          ) &&
          AutoMovieHumanRigControls.isJoint(patch.bone) &&
          patch.bone.startsWith(patch.side),
      )
    )
      throw new Error(
        "Roundhouse plantar witnesses must use finite actual own-side bones",
      );
  }

  /** A new timing object prevents caller mutation of the retained local clock. */
  public get timing(): MotionAction.Timing {
    return { ...this.varied.timing };
  }

  /** A new placement object preserves identity while preventing external mutation. */
  public get request(): MotionAction.Request {
    return structuredClone(this.placement);
  }

  /**
   * Report the actual shin witness's radial reach before composing an approach.
   *
   * @evidence contracts/common.md#implementation-and-ownership Public clinical fitting and its current FK supply the transformed hip and exact shin lever; the radial interval and remaining clinical error are separate diagnostics. The lab may compose separately supported footwork; this method never moves either actor or substitutes a closer target.
   * @evidence contracts/common.md#authoring-interface Context supplies the actual prepared evaluator, neutral and positive thigh measurement. Returned points use the requested-root FK frame. A zero radial deficit remains insufficient: clinicalErrorMetres and actual support plus full-limb contact still require admission.
   */
  public reach(context: MotionAction.Context): RoundhouseReach.Result {
    if (!context.geometry.hip || !context.geometry.thighMetres)
      throw new Error("Roundhouse reach requires measured hip and thigh");
    const seed: IAutoMovieHumanPose = this.articulate(
      context.basePose,
      1,
      1,
      1,
    );
    this.supportToes(seed, context.basePose, 1);
    const offset: MotionAction.Vec3 = this.rootOffset(1, context, seed);
    const target: MotionAction.Vec3 = [
      context.target[0] - offset[0],
      context.target[1] - offset[1],
      context.target[2] - offset[2],
    ];
    const actual: RoundhouseKinematics.Result = RoundhouseKinematics.fit(
      context,
      seed,
      this.placement.side,
      this.options.shinLocalPoint,
      target,
    );
    return {
      ...RoundhouseReach.solve(
        {
          hip: actual.hip,
          knee: actual.knee,
          ankle: actual.ankle,
          contact: actual.shin,
          thighMetres: context.geometry.thighMetres,
        },
        target,
        actual.knee,
      ),
      clinicalErrorMetres: actual.errorMetres,
    };
  }

  /**
   * Sample this action without integration history or a production event timeline.
   *
   * @evidence contracts/common.md#implementation-and-ownership Declared phases separate clinical witnesses from independent world tasks. Return uses one FK path and exact loaded endpoint. Shared seed/final policy permits functional planted Subtalar while preserving midfoot/toes; authored roll retains the compiled unload value. Endpoint and current planning reports keep bounded calls separate. The sole retains its original world replant anchor; actual contact retains achieved witnesses before folding.
   * @evidence contracts/common.md#authoring-interface Context target and path landmarks use the fixed actor-origin frame; output effectors compensate the requested root offset. supportFrame must measure the same authored baseline foot pose against all original foot vertices. A hard free frame provides orientation only; loaded phases also request an actual ground point. Initial ground anchors stay fixed, the rolled foot moves only while unloaded, and delivery starts after its load transfer. The host solves these requests on the actual drawing and supplies the fitted contact stop. Canonical limits, raw target/floor/contact residuals and full-path visual admission remain independent host outcomes.
   */
  public sample(
    context: MotionAction.Context,
    elapsed: number,
  ): RoundhouseAction.Sample {
    if (!context.supportFrame || !context.supportTargets)
      throw new Error(
        "Roundhouse requires actual full-foot measurement and original world frame targets",
      );
    const hip: MotionAction.Vec3 | undefined = context.geometry.hip;
    const thigh: number | undefined = context.geometry.thighMetres;
    const shin: number | undefined = context.geometry.shinMetres;
    if (
      !hip ||
      hip.length !== 3 ||
      !hip.every(Number.isFinite) ||
      ![thigh, shin].every(
        (length: number | undefined): boolean =>
          length !== undefined && Number.isFinite(length) && length > 0,
      )
    )
      throw new Error(
        "Roundhouse requires actual hip, thigh and shin geometry",
      );
    if (context.target.length !== 3 || !context.target.every(Number.isFinite))
      throw new Error("Roundhouse target must be finite actor-local metres");
    const contact: MotionAction.ContactState | undefined = context.contact;
    if (
      contact &&
      (contact.event.actionId !== this.placement.id ||
        contact.event.actorId !== this.placement.actorId ||
        contact.event.targetId !== this.placement.targetId)
    )
      throw new Error("Roundhouse contact belongs to different participants");
    const clock: ActionClock.State = ActionClock.sample(
      this.varied.timing,
      elapsed,
      contact?.event.time,
    );
    const plan: RoundhousePlan = this.plan(context);
    const original: RoundhouseAction.Sample = this.nominal(
      context,
      clock,
      elapsed,
      plan,
    );
    const goal: RoundhouseAction.Sample =
      plan.continuation &&
      elapsed >= 0 &&
      (!contact || elapsed < contact.event.time)
        ? plan.continuation.apply(original, elapsed, context.evaluatePose!)
        : original;
    if (!contact || elapsed < contact.event.time) return goal;

    const release: number = contact.event.time + this.varied.timing.contact;
    const end: number = release + this.varied.timing.retraction;
    const guard: MotionAction.Sample = this.internal(
      context,
      this.nominal(
        context,
        { phase: "recovery", progress: 0, weight: 0, duration: clock.duration },
        end,
        plan,
      ),
    );
    const returnFrame: MotionAction.SupportPatch = guard.support.patches!.find(
      (patch: MotionAction.SupportPatch): boolean =>
        patch.side !== this.placement.side && patch.frameRotation !== undefined,
    )!;
    guard.support.patches = contact.sample.support.patches?.map(
      (patch: MotionAction.SupportPatch): MotionAction.SupportPatch => ({
        ...structuredClone(patch),
        ...(patch.frameRotation !== undefined
          ? {
              frameRotation: [...returnFrame.frameRotation!] as [
                number,
                number,
                number,
                number,
              ],
            }
          : {}),
      }),
    );
    guard.preservedChannels = contact.sample.preservedChannels
      ? [...contact.sample.preservedChannels]
      : undefined;
    const stopped: MotionAction.Sample = this.internal(
      context,
      contact.sample,
      true,
    );
    const recovered: MotionAction.Sample = MotionRecovery.sample(
      { event: contact.event, sample: stopped },
      guard,
      elapsed,
      this.varied.timing.retraction,
      release,
      { evaluatePose: context.evaluatePose!, effectors: this.returnPoints },
    );
    if (elapsed <= release)
      return {
        ...structuredClone(contact.sample),
        elapsed,
        phase: clock.phase,
        progress: clock.progress,
        diagnostics: { clinical: stopped.effectors.slice(0, 3), planting: [] },
      };
    if (elapsed >= end) return goal;

    // Preserve the actual stop exactly, then fold before lowering the leg instead of retracing through its blocker.
    const progress: number =
      (elapsed - release) / this.varied.timing.retraction;
    const actualSole: MotionAction.Effector | undefined =
      contact.sample.effectors.find(
        (point: MotionAction.Effector): boolean =>
          point.bone === this.actingSole().bone &&
          point.constraint === "hard" &&
          point.role === "guide",
      );
    if (!actualSole || actualSole.bone !== this.actingSole().bone)
      throw new Error("Constrained roundhouse lost its actual sole trajectory");
    recovered.pose =
      progress < 0.45
        ? AutoMovieHumanRigControls.blend(
            contact.sample.pose,
            plan.foldedPose,
            ActionClock.ease(progress / 0.45),
          )
        : AutoMovieHumanRigControls.blend(
            plan.foldedPose,
            plan.loaded.pose,
            ActionClock.ease((progress - 0.45) / 0.55),
          );
    const first: boolean = progress < 0.45;
    const blend: number = ActionClock.ease(
      first ? progress / 0.45 : (progress - 0.45) / 0.55,
    );
    recovered.rootOffset = RoundhouseTrajectory.transfer(
      first ? contact.sample.rootOffset : plan.foldedRoot,
      first ? plan.foldedRoot : plan.loaded.rootOffset,
      blend,
    );
    for (const effector of recovered.effectors) {
      if (
        this.returnPoints.some(
          (point: MotionRecovery.Kinematics["effectors"][number]): boolean =>
            point.bone === effector.bone && point.role === effector.role,
        )
      )
        effector.target = RoundhouseKinematics.point(
          context,
          recovered.pose,
          effector.bone,
          effector.localPoint,
        );
      else
        effector.target = this.local(
          this.returnSole(
            context,
            recovered.pose,
            recovered.rootOffset,
            plan,
            progress,
            contact.sample,
          ),
          recovered.rootOffset,
        );
    }
    recovered.support = this.support(
      context,
      recovered.rootOffset,
      1 - ActionClock.ease(progress),
      "retraction",
      progress,
      contact.sample.support,
    );
    return {
      ...recovered,
      effectors: recovered.effectors.filter(
        (effector: MotionAction.Effector): boolean =>
          !this.returnPoints.some(
            (point: MotionRecovery.Kinematics["effectors"][number]): boolean =>
              point.bone === effector.bone && point.role === effector.role,
          ),
      ),
      diagnostics: { clinical: recovered.effectors.slice(0, 3), planting: [] },
      phase: "retraction",
      progress,
    };
  }

  /** Private same-FK return topology keeps actual stops distinct from independent host world tasks. */
  private internal(
    context: MotionAction.Context,
    sample: MotionAction.Sample,
    actualStop: boolean = false,
  ): MotionAction.Sample {
    const guides: RoundhouseKinematics.Result = RoundhouseKinematics.inspect(
      context,
      sample.pose,
      this.placement.side,
      this.options.shinLocalPoint,
      context.target,
    );
    const clinical: MotionAction.Effector[] = [
      { ...structuredClone(this.returnPoints[0]!), target: guides.shin },
      { ...structuredClone(this.returnPoints[1]!), target: guides.knee },
      { ...structuredClone(this.returnPoints[2]!), target: guides.ankle },
    ];
    const original: MotionAction.Effector | undefined = sample.effectors.find(
      (point: MotionAction.Effector): boolean => point.role === "strike",
    );
    if (
      actualStop &&
      (!original ||
        new THREE.Vector3(...original.target).distanceTo(
          new THREE.Vector3(...guides.shin),
        ) > 1e-8)
    )
      throw new Error(
        "Actual stopped shin must already match the displayed clinical FK",
      );
    const sole: MotionAction.Effector | undefined = sample.effectors.find(
      (point: MotionAction.Effector): boolean =>
        point.bone === this.actingSole().bone &&
        point.role === "guide" &&
        point.constraint === "hard",
    );
    if (!sole)
      throw new Error(
        "Roundhouse return requires its unchanged external sole task",
      );
    return {
      ...structuredClone(sample),
      effectors: [...clinical, structuredClone(sole)],
    };
  }

  /** Build diagnostic clinical witnesses separately from the original sole and independent impact tasks. */
  private nominal(
    context: MotionAction.Context,
    clock: ActionClock.State,
    elapsed: number,
    plan: RoundhousePlan,
  ): RoundhouseAction.Sample {
    const phase: MotionAction.Phase = clock.phase;
    const progress: number = clock.progress;
    let pose: IAutoMovieHumanPose;
    let rootOffset: MotionAction.Vec3;
    let point: MotionAction.Vec3;
    let sole: MotionAction.Vec3;
    let turn: number = 0;
    let planting: RoundhouseKinematics.PlantResult[] = [];
    if (phase === "idle" || phase === "complete") {
      pose = structuredClone(context.basePose);
      rootOffset = [0, 0, 0];
      point = [...this.options.shinPoint];
      sole = this.worldFixed(context, this.actingSole().world);
    } else if (phase === "preparation" || phase === "recovery") {
      const loaded: RoundhousePlan["loaded"] =
        phase === "recovery" && progress === 0
          ? structuredClone(plan.loaded)
          : this.loaded(context, phase, progress, plan.unloaded);
      pose = loaded.pose;
      rootOffset = loaded.rootOffset;
      point = loaded.shin;
      sole = loaded.sole;
      planting = loaded.planting;
    } else {
      const target: MotionAction.Vec3 = [
        context.target[0] + this.varied.aimOffset[0],
        context.target[1] + this.varied.aimOffset[1],
        context.target[2] + this.varied.aimOffset[2],
      ];
      if (phase === "retraction") {
        const first: boolean = progress < 0.45;
        const blend: number = ActionClock.ease(
          first ? progress / 0.45 : (progress - 0.45) / 0.55,
        );
        pose = AutoMovieHumanRigControls.blend(
          first ? plan.peakPose : plan.foldedPose,
          first ? plan.foldedPose : plan.loaded.pose,
          blend,
        );
        rootOffset = RoundhouseTrajectory.transfer(
          first ? plan.peakRoot : plan.foldedRoot,
          first ? plan.foldedRoot : plan.loaded.rootOffset,
          blend,
        );
        point = this.fixed(
          RoundhouseKinematics.point(
            context,
            pose,
            AutoMovieHumanRigControls.joint(`${this.placement.side}LowerLeg`),
            this.options.shinLocalPoint,
          ),
          rootOffset,
        );
        sole = this.returnSole(context, pose, rootOffset, plan, progress);
        turn = 1 - ActionClock.ease(progress);
      } else {
        const chambering: boolean = phase === "delivery" && progress < 0.35;
        const extension: number =
          phase === "contact" ? 1 : ActionClock.ease((progress - 0.35) / 0.65);
        const loading: number =
          phase === "contact" ? 1 : ActionClock.ease(progress / 0.35);
        turn = 0.2 * loading + 0.8 * extension;
        pose = chambering
          ? AutoMovieHumanRigControls.blend(
              plan.loaded.pose,
              plan.foldedPose,
              loading,
            )
          : this.articulate(context.basePose, 1, turn, extension);
        this.retainRoll(pose, plan.loaded.pose);
        if (!chambering) this.supportToes(pose, context.basePose, 1);
        rootOffset = chambering
          ? RoundhouseTrajectory.transfer(
              plan.loaded.rootOffset,
              plan.foldedRoot,
              loading,
            )
          : this.rootOffset(1, context, pose);
        point = chambering
          ? this.fixed(
              RoundhouseKinematics.point(
                context,
                pose,
                AutoMovieHumanRigControls.joint(
                  `${this.placement.side}LowerLeg`,
                ),
                this.options.shinLocalPoint,
              ),
              rootOffset,
            )
          : RoundhouseTrajectory.delivery(
              plan.chamber,
              target,
              this.placement.direction,
              this.placement.side,
              context.geometry.thighMetres! + context.geometry.shinMetres!,
              phase === "contact" ? 1 : (progress - 0.35) / 0.65,
            );
        if (!chambering)
          pose = RoundhouseKinematics.fit(
            context,
            pose,
            this.placement.side,
            this.options.shinLocalPoint,
            this.local(point, rootOffset),
          ).pose;
        sole = this.fixed(
          RoundhouseKinematics.point(
            context,
            pose,
            this.actingSole().bone,
            this.actingSole().localPoint,
          ),
          rootOffset,
        );
        if (chambering) {
          const initial: MotionAction.Vec3 = this.fixed(
            RoundhouseKinematics.point(
              context,
              plan.loaded.pose,
              this.actingSole().bone,
              this.actingSole().localPoint,
            ),
            plan.loaded.rootOffset,
          );
          sole = sole.map(
            (value: number, axis: number): number =>
              value +
              (plan.loaded.sole[axis]! - initial[axis]!) * (1 - loading),
          ) as MotionAction.Vec3;
        }
      }
    }
    const guides: RoundhouseKinematics.Result = RoundhouseKinematics.inspect(
      context,
      pose,
      this.placement.side,
      this.options.shinLocalPoint,
      this.local(point, rootOffset),
    );
    const foot: MotionAction.SupportPatch = this.actingSole();
    const clinical: MotionAction.Effector[] = [
      { ...structuredClone(this.returnPoints[0]!), target: guides.shin },
      { ...structuredClone(this.returnPoints[1]!), target: guides.knee },
      { ...structuredClone(this.returnPoints[2]!), target: guides.ankle },
    ];
    const effectors: MotionAction.Effector[] = [
      {
        bone: foot.bone,
        localPoint: [...foot.localPoint],
        target: this.local(sole, rootOffset),
        role: "guide",
        constraint: "hard",
        radius: 0,
      },
    ];
    if (phase === "contact" || (phase === "delivery" && progress >= 0.35))
      effectors.unshift({
        ...structuredClone(this.returnPoints[0]!),
        target: this.local(point, rootOffset),
      });
    const preservedChannels: AutoMovieHumanRigControls.DegreeChannel[] = [
      ...MotionSupportChannels.select(
        "left",
        this.supportPolicy(phase, progress, "left"),
      ).preserved,
      ...MotionSupportChannels.select(
        "right",
        this.supportPolicy(phase, progress, "right"),
      ).preserved,
    ];
    const endpointPlanning: RoundhouseAction.Sample["diagnostics"]["endpointPlanning"] =
      [plan.unloaded, plan.loaded].map(
        (
          endpoint: RoundhousePlan["loaded"],
        ): Omit<RoundhouseKinematics.PlantResult, "pose">[] =>
          endpoint.planting.map(
            ({
              pose: _pose,
              ...report
            }: RoundhouseKinematics.PlantResult): Omit<
              RoundhouseKinematics.PlantResult,
              "pose"
            > => structuredClone(report),
          ),
      );
    return {
      pose,
      rootOffset,
      preservedChannels,
      support: this.support(context, rootOffset, turn, phase, progress),
      effectors,
      diagnostics: { clinical, planting, endpointPlanning },
      phase,
      elapsed,
      progress,
    };
  }

  /** Compile owned local endpoints from one immutable body/context; caller changes invalidate the bounded cache. */
  private plan(context: MotionAction.Context): RoundhousePlan {
    const key: string = JSON.stringify([
      context.basePose,
      context.target,
      context.geometry,
      context.frame,
    ]);
    if (
      this.prepared?.key === key &&
      this.prepared.evaluate === context.evaluatePose &&
      this.prepared.measurement === context.supportFrame &&
      this.prepared.targets === context.supportTargets
    )
      return this.prepared.value;
    const unloaded: RoundhousePlan["loaded"] = this.loaded(
      context,
      "preparation",
      0.25,
      undefined,
      true,
    );
    const loaded: RoundhousePlan["loaded"] = this.loaded(
      context,
      "preparation",
      1,
      unloaded,
    );
    const folded: IAutoMovieHumanPose = this.articulate(
      context.basePose,
      1,
      0.2,
      0,
    );
    this.retainRoll(folded, loaded.pose);
    this.supportToes(folded, context.basePose, 1);
    const foldedRoot: MotionAction.Vec3 = this.rootOffset(1, context, folded);
    const foldedPose: IAutoMovieHumanPose = folded;
    const chamber: MotionAction.Vec3 = this.fixed(
      RoundhouseKinematics.point(
        context,
        foldedPose,
        AutoMovieHumanRigControls.joint(`${this.placement.side}LowerLeg`),
        this.options.shinLocalPoint,
      ),
      foldedRoot,
    );
    const peak: IAutoMovieHumanPose = this.articulate(
      context.basePose,
      1,
      1,
      1,
    );
    this.retainRoll(peak, loaded.pose);
    this.supportToes(peak, context.basePose, 1);
    const peakRoot: MotionAction.Vec3 = this.rootOffset(1, context, peak);
    const target: MotionAction.Vec3 = [
      context.target[0] + this.varied.aimOffset[0],
      context.target[1] + this.varied.aimOffset[1],
      context.target[2] + this.varied.aimOffset[2],
    ];
    const peakPose: IAutoMovieHumanPose = RoundhouseKinematics.fit(
      context,
      peak,
      this.placement.side,
      this.options.shinLocalPoint,
      this.local(target, peakRoot),
    ).pose;
    const value: RoundhousePlan = {
      unloaded,
      loaded,
      chamber,
      foldedPose,
      foldedRoot,
      peakPose,
      peakRoot,
    };
    if (this.entry) {
      const first: RoundhouseAction.Sample = this.nominal(
        context,
        ActionClock.sample(this.varied.timing, 0),
        0,
        value,
      );
      const h: number = this.entry.provenance.h2;
      const next: RoundhouseAction.Sample = this.nominal(
        context,
        ActionClock.sample(this.varied.timing, h),
        h,
        value,
      );
      value.continuation = new RoundhouseContinuation(first, next, this.entry);
    }
    this.prepared = {
      key,
      evaluate: context.evaluatePose,
      measurement: context.supportFrame,
      targets: context.supportTargets,
      value,
    };
    return value;
  }

  /** Keep the original WORLD feet planted while planning the leg; its shin follows this anatomical configuration. */
  private loaded(
    context: MotionAction.Context,
    phase: "preparation" | "recovery",
    progress: number,
    unloaded?: RoundhousePlan["loaded"],
    compileUnload: boolean = false,
  ): RoundhousePlan["loaded"] {
    const stage: ReturnType<RoundhouseAction["supportStage"]> =
      this.supportStage(phase, progress);
    const continuation: number =
      phase === "preparation"
        ? ActionClock.ease(progress / 0.25)
        : ActionClock.ease((1 - progress) / 0.25);
    let pose: IAutoMovieHumanPose = unloaded
      ? AutoMovieHumanRigControls.blend(
          context.basePose,
          unloaded.pose,
          continuation,
        )
      : structuredClone(context.basePose);
    this.supportToes(
      pose,
      unloaded?.pose ?? context.basePose,
      stage.roll,
      stage.height,
    );
    const rootOffset: MotionAction.Vec3 = this.rootOffset(
      stage.height,
      context,
      pose,
      stage.horizontal,
      stage.roll,
    );
    const supporting: RoundhouseKinematics.PlantResult =
      RoundhouseKinematics.plant(
        context,
        pose,
        this.supportMeasurement(context, rootOffset, stage.roll, 0).frame,
        rootOffset,
        compileUnload
          ? "planted"
          : this.supportPolicy(
              phase,
              progress,
              this.placement.side === "left" ? "right" : "left",
            ),
      );
    pose = supporting.pose;
    const foot: MotionAction.SupportPatch = this.actingSole();
    const frame: MotionAction.SupportPatch = context.supportFrame!(
      context.basePose,
      rootOffset,
      { ...structuredClone(foot), mode: "free", constraint: "hard" },
    ).frame;
    const acting: RoundhouseKinematics.PlantResult = RoundhouseKinematics.plant(
      context,
      pose,
      frame,
      rootOffset,
      this.supportPolicy(phase, progress, this.placement.side),
    );
    pose = acting.pose;
    return {
      pose,
      rootOffset,
      shin: this.fixed(
        RoundhouseKinematics.point(
          context,
          pose,
          AutoMovieHumanRigControls.joint(`${this.placement.side}LowerLeg`),
          this.options.shinLocalPoint,
        ),
        rootOffset,
      ),
      sole: this.worldFixed(context, foot.world),
      planting: [supporting, acting],
    };
  }

  /** Follow clinical foot shape with a predeclared smooth correction to the unchanged external landing anchor. */
  private returnSole(
    context: MotionAction.Context,
    pose: IAutoMovieHumanPose,
    rootOffset: MotionAction.Vec3,
    plan: RoundhousePlan,
    progress: number,
    stopped?: MotionAction.Sample,
  ): MotionAction.Vec3 {
    const foot: MotionAction.SupportPatch = this.actingSole();
    const point: MotionAction.Vec3 = this.fixed(
      RoundhouseKinematics.point(context, pose, foot.bone, foot.localPoint),
      rootOffset,
    );
    const loaded: MotionAction.Vec3 = this.fixed(
      RoundhouseKinematics.point(
        context,
        plan.loaded.pose,
        foot.bone,
        foot.localPoint,
      ),
      plan.loaded.rootOffset,
    );
    const landing: number = ActionClock.ease((progress - 0.45) / 0.55);
    const actual: MotionAction.Effector | undefined = stopped?.effectors.find(
      (effector: MotionAction.Effector): boolean =>
        effector.bone === foot.bone &&
        effector.role === "guide" &&
        effector.constraint === "hard",
    );
    const initial: MotionAction.Vec3 = stopped
      ? this.fixed(
          RoundhouseKinematics.point(
            context,
            stopped.pose,
            foot.bone,
            foot.localPoint,
          ),
          stopped.rootOffset,
        )
      : point;
    const retained: MotionAction.Vec3 = actual
      ? this.fixed(actual.target, stopped!.rootOffset)
      : initial;
    const release: number = 1 - ActionClock.ease(progress / 0.45);
    return point.map(
      (value: number, axis: number): number =>
        value +
        (plan.loaded.sole[axis]! - loaded[axis]!) * landing +
        (retained[axis]! - initial[axis]!) * release,
    ) as MotionAction.Vec3;
  }

  /** The original vertex stays an independent hard sole trajectory during every phase. */
  private actingSole(): MotionAction.SupportPatch {
    return this.options.initialSupport.patches!.find(
      (patch: MotionAction.SupportPatch): boolean =>
        patch.side === this.placement.side,
    )!;
  }
  /** Authored supporting-foot roll retains its planned unload Subtalar instead of restarting a numerical branch. */
  private retainRoll(
    pose: IAutoMovieHumanPose,
    endpoint: IAutoMovieHumanPose,
  ): void {
    const side: MotionAction.Side =
      this.placement.side === "left" ? "right" : "left";
    pose.legs ??= { left: {}, right: {} };
    pose.legs[side].foot ??= {};
    pose.legs[side].foot!.subtalarInversion =
      endpoint.legs?.[side].foot?.subtalarInversion ?? 0;
  }
  /** The same declared ground/roll authority selects both seed channels and final preservation. */
  private supportPolicy(
    phase: MotionAction.Phase,
    progress: number,
    side: MotionAction.Side,
  ): "planted" | "authored" {
    if (phase === "idle" || phase === "complete") return "planted";
    if (phase !== "preparation" && phase !== "recovery") return "authored";
    return side === this.placement.side ||
      this.supportStage(phase, progress).ground === "initial"
      ? "planted"
      : "authored";
  }
  /** Convert fixed actor-origin coordinates to the requested-root FK frame. */
  private local(
    point: MotionAction.Vec3,
    root: MotionAction.Vec3,
  ): MotionAction.Vec3 {
    return [point[0] - root[0], point[1] - root[1], point[2] - root[2]];
  }
  /** Convert requested-root FK coordinates to the fixed actor-origin frame. */
  private fixed(
    point: MotionAction.Vec3,
    root: MotionAction.Vec3,
  ): MotionAction.Vec3 {
    return [point[0] + root[0], point[1] + root[1], point[2] + root[2]];
  }
  /** Convert an unchanged WORLD anchor through the caller's fixed actor frame. */
  private worldFixed(
    context: MotionAction.Context,
    point: MotionAction.Vec3,
  ): MotionAction.Vec3 {
    if (!context.frame)
      throw new Error("Roundhouse sole requires its actual scene frame");
    return new THREE.Vector3(...point)
      .sub(new THREE.Vector3(...context.frame.origin))
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), -context.frame.yawRadians)
      .toArray();
  }

  /** Author high-kick elevation from the actual supporting leg and original foot frame. */
  private rootOffset(
    load: number,
    context: MotionAction.Context,
    pose: IAutoMovieHumanPose,
    horizontal?: MotionAction.Vec3,
    roll: number = load,
  ): MotionAction.Vec3 {
    const offset: MotionAction.Vec3 = horizontal
      ? [...horizontal]
      : [
          this.options.supportingFoot[0] * 0.25 * load,
          0,
          this.options.supportingFoot[2] * 0.25 * load,
        ];
    if (this.options.height !== "high" || load === 0) return offset;
    if (
      !context.frame ||
      !context.evaluatePose ||
      !context.neutral ||
      !context.supportFrame
    )
      throw new Error(
        "High roundhouse requires actual support height and scene frame",
      );
    const other: MotionAction.Side =
      this.placement.side === "left" ? "right" : "left";
    const reference: IAutoMovieHumanPose = this.supportReference(context, roll);
    const output: AutoMovieHumanSkeleton.IOutput =
      context.evaluatePose(reference);
    const bone: AutoMovieHumanSkeleton.IPlacement | undefined =
      output.posed.find(
        (point: AutoMovieHumanSkeleton.IPlacement): boolean =>
          point.bone === this.options.supportPivot.bone,
      );
    const ankle: AutoMovieHumanSkeleton.IPlacement | undefined =
      output.posed.find(
        (point: AutoMovieHumanSkeleton.IPlacement): boolean =>
          point.bone === `${other}Foot`,
      );
    if (!bone || !ankle)
      throw new Error(
        "High roundhouse requires actual supporting ankle and retained foot bone",
      );
    const pivot: MotionAction.SupportPatch = context.supportFrame(
      reference,
      offset,
      {
        ...structuredClone(this.options.supportPivot),
        mode: "free",
        constraint: "hard",
        initialWorld: [...this.options.supportPivotStart],
      },
    ).frame;
    const heading: THREE.Quaternion = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      context.frame.yawRadians,
    );
    const footPoint: THREE.Vector3 = new THREE.Vector3(...pivot.localPoint)
      .applyQuaternion(new THREE.Quaternion(...bone.rotation))
      .add(new THREE.Vector3(...bone.position));
    const ankleGoal: MotionAction.Vec3 = new THREE.Vector3(...ankle.position)
      .sub(footPoint)
      .applyQuaternion(heading)
      .add(new THREE.Vector3(...pivot.world))
      .toArray();
    const root: {
      translation: MotionAction.Vec3;
      rotation: [number, number, number, number];
    } = {
      translation: new THREE.Vector3(...offset)
        .applyQuaternion(heading)
        .add(new THREE.Vector3(...context.frame.origin))
        .toArray(),
      rotation: heading.toArray(),
    };
    const height: ReturnType<typeof AutoMovieHumanLegIk.supportHeight> =
      AutoMovieHumanLegIk.supportHeight(
        context.evaluatePose(pose),
        context.neutral,
        root,
        [
          {
            side: other,
            position: ankleGoal,
            kneeFlexion: pose.legs?.[other].knee?.flexion ?? 0,
          },
        ],
      );
    if (!height.feasible)
      throw new Error(
        "High roundhouse supporting ankle is outside its actual horizontal reach",
      );
    offset[1] = (height.height - context.frame.origin[1]) * load;
    return offset;
  }

  /** Authored 12-degree ankle release and 20-degree toe extension seed forefoot roll; final constraints remain authoritative. */
  private supportToes(
    pose: IAutoMovieHumanPose,
    base: IAutoMovieHumanPose,
    load: number,
    kneeLoad: number = load,
  ): void {
    if (load === 0 && kneeLoad === 0) return;
    const other: MotionAction.Side =
      this.placement.side === "left" ? "right" : "left";
    pose.legs ??= { left: {}, right: {} };
    if (this.options.height === "high")
      pose.legs[other].knee = {
        ...pose.legs[other].knee,
        flexion:
          (base.legs?.[other].knee?.flexion ?? 0) * (1 - kneeLoad) +
          Math.min(8, base.legs?.[other].knee?.flexion ?? 0) * kneeLoad,
      };
    const ankleRange: { minimum: number; maximum: number } =
      AutoMovieHumanRigControls.bounds(`legs.${other}.ankle.dorsiflexion`);
    pose.legs[other].ankle = {
      ...pose.legs[other].ankle,
      dorsiflexion: Math.max(
        ankleRange.minimum,
        Math.min(
          ankleRange.maximum,
          (base.legs?.[other].ankle?.dorsiflexion ?? 0) - 12 * load,
        ),
      ),
    };
    pose.legs[other].foot ??= {};
    for (const digit of [
      "hallux",
      "second",
      "third",
      "fourth",
      "fifth",
    ] as const) {
      const channel: AutoMovieHumanRigControls.DegreeChannel = `legs.${other}.foot.${digit}.mtpFlexion`;
      const range: { minimum: number; maximum: number } =
        AutoMovieHumanRigControls.bounds(channel);
      pose.legs[other].foot![digit] = {
        ...pose.legs[other].foot![digit],
        mtpFlexion: Math.max(
          range.minimum,
          Math.min(
            range.maximum,
            (base.legs?.[other].foot?.[digit]?.mtpFlexion ?? 0) * (1 - load) -
              20 * load,
          ),
        ),
      };
    }
  }

  /** Preserve the caller's measured guard while applying bounded whole-chain seed changes. */
  private articulate(
    base: IAutoMovieHumanPose,
    load: number,
    turn: number,
    extension: number,
  ): IAutoMovieHumanPose {
    if (load === 0 && turn === 0) return structuredClone(base);
    const pose: IAutoMovieHumanPose = structuredClone(base);
    const side: MotionAction.Side = this.placement.side;
    const other: MotionAction.Side = side === "left" ? "right" : "left";
    const sign: number = side === "right" ? 1 : -1;
    const high: number = this.options.height === "high" ? 1 : 0;
    const low: number = this.options.height === "low" ? 1 : 0;
    const scale: number = this.varied.amplitude;
    const directionDegrees: number =
      (Math.atan2(this.placement.direction[2], this.placement.direction[0]) *
        180) /
      Math.PI;
    const bounded: (
      channel: AutoMovieHumanRigControls.DegreeChannel,
      value: number,
    ) => number = (
      channel: AutoMovieHumanRigControls.DegreeChannel,
      value: number,
    ): number => {
      const range: { minimum: number; maximum: number } =
        AutoMovieHumanRigControls.bounds(channel);
      return Math.max(range.minimum, Math.min(range.maximum, value));
    };

    // These clinical seeds express the researched chain order; actual FK and interception are host responsibilities.
    pose.pelvis = {
      ...pose.pelvis,
      rotation: bounded(
        "pelvis.rotation",
        (base.pelvis?.rotation ?? 0) +
          (directionDegrees + sign * 68 * scale) * turn,
      ),
      obliquity: (base.pelvis?.obliquity ?? 0) - sign * high * 16 * load,
    };
    pose.spine = {
      ...pose.spine,
      thoracic: {
        ...pose.spine?.thoracic,
        rotation: bounded(
          "spine.thoracic.rotation",
          (base.spine?.thoracic?.rotation ?? 0) + sign * 12 * turn * scale,
        ),
        lateralFlexion: bounded(
          "spine.thoracic.lateralFlexion",
          (base.spine?.thoracic?.lateralFlexion ?? 0) +
            sign * (6 + high * 7) * load,
        ),
      },
    };
    pose.legs ??= { left: {}, right: {} };
    pose.legs[side] = {
      ...pose.legs[side],
      hip: {
        ...base.legs?.[side].hip,
        flexion: bounded(
          `legs.${side}.hip.flexion`,
          (base.legs?.[side].hip?.flexion ?? 0) * (1 - load) +
            (83 + high * 23 - low * 25) * load * scale,
        ),
        abduction: bounded(
          `legs.${side}.hip.abduction`,
          (base.legs?.[side].hip?.abduction ?? 0) * (1 - load) +
            32 * load * scale,
        ),
        rotation: bounded(
          `legs.${side}.hip.rotation`,
          (base.legs?.[side].hip?.rotation ?? 0) * (1 - load) + 28 * turn,
        ),
      },
      knee: {
        ...base.legs?.[side].knee,
        flexion: bounded(
          `legs.${side}.knee.flexion`,
          (base.legs?.[side].knee?.flexion ?? 0) * (1 - load) +
            (103 - 75 * extension) * load,
        ),
      },
      ankle: {
        ...base.legs?.[side].ankle,
        dorsiflexion: bounded(
          `legs.${side}.ankle.dorsiflexion`,
          (base.legs?.[side].ankle?.dorsiflexion ?? 0) * (1 - load) - 45 * load,
        ),
      },
    };
    pose.legs[other] = {
      ...pose.legs[other],
      knee: {
        ...base.legs?.[other].knee,
        flexion: bounded(
          `legs.${other}.knee.flexion`,
          base.legs?.[other].knee?.flexion ?? 0,
        ),
      },
      ankle: {
        ...base.legs?.[other].ankle,
        dorsiflexion: bounded(
          `legs.${other}.ankle.dorsiflexion`,
          (base.legs?.[other].ankle?.dorsiflexion ?? 0) - 8 * turn,
        ),
      },
    };
    return pose;
  }

  /** Keep actual ground roles while transferring load before and after an unloaded roll. */
  private supportStage(
    phase: MotionAction.Phase,
    progress: number,
  ): {
    roll: number;
    other: number;
    ground: "initial" | "pivot" | undefined;
    horizontal: MotionAction.Vec3;
    height: number;
  } {
    const side: MotionAction.Side = this.placement.side;
    const initialOther: number =
      this.options.initialSupport[side === "left" ? "right" : "left"];
    const acting: THREE.Vector3 = new THREE.Vector3(...this.options.kickingFoot)
      .multiplyScalar(0.25)
      .setY(0);
    const other: THREE.Vector3 = new THREE.Vector3(
      ...this.options.supportingFoot,
    )
      .multiplyScalar(0.25)
      .setY(0);
    if (phase === "idle" || phase === "complete")
      return {
        roll: 0,
        other: initialOther,
        ground: "initial",
        horizontal: [0, 0, 0],
        height: 0,
      };
    if (phase !== "preparation" && phase !== "recovery")
      return {
        roll: 1,
        other: 1,
        ground: "pivot",
        horizontal: other.toArray(),
        height: 1,
      };
    const p: number = phase === "recovery" ? 1 - progress : progress;
    if (p < 0.25) {
      const transfer: number = ActionClock.ease(p / 0.25);
      return {
        roll: 0,
        other: initialOther * (1 - transfer),
        ground: "initial",
        horizontal: acting.multiplyScalar(transfer).toArray(),
        height: 0,
      };
    }
    if (p < 0.75)
      return {
        roll: ActionClock.ease((p - 0.25) / 0.5),
        other: 0,
        ground: undefined,
        horizontal: acting.toArray(),
        height: 0,
      };
    const transfer: number = ActionClock.ease((p - 0.75) / 0.25);
    return {
      roll: 1,
      other: transfer,
      ground: "pivot",
      horizontal: acting.lerp(other, transfer).toArray(),
      height: transfer,
    };
  }

  /** Measure one base-reference roll and apply exactly one world-vertical pivot about its retained point. */
  private supportMeasurement(
    context: MotionAction.Context,
    rootOffset: MotionAction.Vec3,
    roll: number,
    turn: number,
  ): MotionAction.SupportMeasurement {
    const source: MotionAction.SupportPatch = {
      ...structuredClone(this.options.supportPivot),
      initialWorld: [...this.options.supportPivotStart],
      mode: "free",
      constraint: "hard",
      world: this.options.supportPivotStart.map(
        (value: number, index: number): number =>
          value + (this.options.supportPivot.world[index]! - value) * roll,
      ) as MotionAction.Vec3,
    };
    const measured: MotionAction.SupportMeasurement = context.supportFrame!(
      this.supportReference(context, roll),
      rootOffset,
      source,
    );
    const direction: number =
      (Math.atan2(this.placement.direction[2], this.placement.direction[0]) *
        180) /
      Math.PI;
    const yaw: THREE.Quaternion = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      (-(direction + (this.placement.side === "right" ? 85 : -85)) *
        turn *
        Math.PI) /
        180,
    );
    measured.frame.frameRotation = yaw
      .clone()
      .multiply(new THREE.Quaternion(...measured.frame.frameRotation!))
      .toArray();
    measured.contact.world = new THREE.Vector3(...measured.contact.world)
      .sub(new THREE.Vector3(...measured.frame.world))
      .applyQuaternion(yaw)
      .add(new THREE.Vector3(...measured.frame.world))
      .toArray();
    return measured;
  }

  /** Consume the actual minimum only in grounded stages; a hard free frame never carries load. */
  private support(
    context: MotionAction.Context,
    rootOffset: MotionAction.Vec3,
    turn: number,
    phase: MotionAction.Phase,
    progress: number,
    constrained?: MotionAction.Support,
  ): MotionAction.Support {
    if (phase === "idle" || phase === "complete")
      return structuredClone(this.options.initialSupport);
    const side: MotionAction.Side = this.placement.side;
    const other: MotionAction.Side = side === "left" ? "right" : "left";
    const stage: ReturnType<RoundhouseAction["supportStage"]> =
      this.supportStage(phase, progress);
    const measured: MotionAction.SupportMeasurement = this.supportMeasurement(
      context,
      rootOffset,
      stage.roll,
      constrained ? 0 : turn,
    );
    let frame: MotionAction.SupportPatch = measured.frame;
    let contact: MotionAction.SupportPatch = measured.contact;
    if (constrained?.patches) {
      const actualFrame: MotionAction.SupportPatch | undefined =
        constrained.patches.find(
          (patch: MotionAction.SupportPatch): boolean =>
            patch.side === other && patch.frameRotation !== undefined,
        );
      const actualContact: MotionAction.SupportPatch | undefined =
        constrained.patches.find(
          (patch: MotionAction.SupportPatch): boolean =>
            patch.side === other &&
            patch.mode !== "free" &&
            patch.frameRotation === undefined,
        );
      if (!actualFrame?.frameRotation || !actualContact)
        throw new Error(
          "Constrained kick requires its actual frame and ground contact",
        );
      const start: THREE.Quaternion = new THREE.Quaternion(
        ...actualFrame.frameRotation,
      );
      const rotation: THREE.Quaternion = start
        .clone()
        .slerp(
          new THREE.Quaternion(...measured.frame.frameRotation!),
          ActionClock.ease(progress),
        );
      frame = {
        ...structuredClone(actualFrame),
        frameRotation: rotation.toArray(),
      };
      contact = {
        ...structuredClone(actualContact),
        world: new THREE.Vector3(...actualContact.world)
          .sub(new THREE.Vector3(...frame.world))
          .applyQuaternion(rotation.clone().multiply(start.clone().invert()))
          .add(new THREE.Vector3(...frame.world))
          .toArray(),
      };
    }
    const patches: MotionAction.SupportPatch[] = [frame];
    if (stage.ground === "pivot") patches.push(contact);
    else if (stage.ground === "initial")
      patches.push({
        ...structuredClone(
          this.options.initialSupport.patches!.find(
            (patch: MotionAction.SupportPatch): boolean => patch.side === other,
          )!,
        ),
        constraint: "hard",
      });
    if (phase === "preparation")
      patches.push({
        ...structuredClone(
          this.options.initialSupport.patches!.find(
            (patch: MotionAction.SupportPatch): boolean => patch.side === side,
          )!,
        ),
        constraint: "hard",
      });
    else if (phase === "recovery")
      patches.push({
        ...structuredClone(this.actingSole()),
        constraint: "hard",
      });
    const left: number = side === "left" ? 1 - stage.other : stage.other;
    return { left, right: 1 - left, patches };
  }

  /** Match the exact base-body reference that selected the roll witness; clinical body yaw is not world yaw. */
  private supportReference(
    context: MotionAction.Context,
    load: number,
  ): IAutoMovieHumanPose {
    const reference: IAutoMovieHumanPose = structuredClone(context.basePose);
    const other: MotionAction.Side =
      this.placement.side === "left" ? "right" : "left";
    this.supportToes(reference, context.basePose, load);
    reference.legs ??= { left: {}, right: {} };
    reference.legs![other].knee = structuredClone(
      context.basePose.legs?.[other].knee ?? {},
    );
    return reference;
  }
}

/** Construction-time geometry and target-height style for the same roundhouse family. */
export namespace RoundhouseAction {
  /**
   * World tasks and diagnostic clinical witnesses have separate authoring authority.
   * @evidence contracts/common.md#implementation-and-ownership The host receives only the original sole and the authored extension/contact impact tasks. Same-FK shin/knee/ankle remain observable diagnostics, never duplicated as independent preparation world constraints. Loaded planning retains raw bounded solver outcomes without physical admission claims.
   * @evidence contracts/common.md#authoring-interface Effectors follow the declared action phase, independent of fit success. diagnostics owns its tuples/results; pose and original support goals retain MotionAction units and semantics. A caller must inspect both planning residuals and the actual final full-foot state.
   */
  export interface Sample extends MotionAction.Sample {
    /** Internal shape, current planning and ordered cached unload/loaded reports; cached calls are not per-sample calls. */
    diagnostics: {
      clinical: MotionAction.Effector[];
      planting: RoundhouseKinematics.PlantResult[];
      endpointPlanning?: Omit<RoundhouseKinematics.PlantResult, "pose">[][];
      continuation?: object;
    };
  }
  /**
   * Real actor geometry is separate from reusable local phase timings.
   *
   * @evidence contracts/common.md#implementation-and-ownership Both initial feet and the other-foot pivot come from the consumer's actual drawing. The action copies their inputs and owns no render or physics resource.
   * @evidence contracts/common.md#authoring-interface The shin point and its bone-local counterpart identify the same LowerLeg surface witness; supportPivot belongs to the opposite foot and initialSupport includes both original planted feet.
   */
  export interface Options {
    /** Requested target family affects chamber/lean seeds; target position remains explicit. */
    height: "low" | "body" | "high";
    /** Actual initial acting knee centre in actor-local metres. */
    kneePoint: MotionAction.Vec3;
    /** Actual initial kicking ankle centre in actor-local metres. */
    kickingFoot: MotionAction.Vec3;
    /** Actual initial striking shin witness in actor-local metres. */
    shinPoint: MotionAction.Vec3;
    /** The same real witness in the acting LowerLeg bone's local metres. */
    shinLocalPoint: MotionAction.Vec3;
    /** Actual other ankle centre in actor-local metres. */
    supportingFoot: MotionAction.Vec3;
    /** Actual same ball point before support roll, in world metres; it may start above the floor. */
    supportPivotStart: MotionAction.Vec3;
    /** Actual foot-frame witness selected from the original full-foot geometry under the same baseline roll reference. */
    supportPivot: MotionAction.SupportPatch;
    /** Caller guard/load shares and real initial plantar patches, including the kicking foot. */
    initialSupport: MotionAction.Support;
  }
}

/** Owned endpoint plan; never returned by the public sampler or shared with caller inputs. */
interface RoundhousePlan {
  /** Optional actual-entry correction, compiled once with its unchanged canonical samples. */
  continuation?: RoundhouseContinuation;
  /** Exact planned loaded endpoint and its fixed-origin shin/sole. */
  loaded: {
    pose: IAutoMovieHumanPose;
    rootOffset: MotionAction.Vec3;
    shin: MotionAction.Vec3;
    sole: MotionAction.Vec3;
    planting: RoundhouseKinematics.PlantResult[];
  };
  /** One separately compiled planted unload endpoint, shared by forward roll and reverse recovery. */
  unloaded: RoundhousePlan["loaded"];
  /** Chamber target connected to the loaded endpoint. */
  chamber: MotionAction.Vec3;
  /** Bounded clinical endpoint poses and their authored roots. */
  foldedPose: IAutoMovieHumanPose;
  foldedRoot: MotionAction.Vec3;
  peakPose: IAutoMovieHumanPose;
  peakRoot: MotionAction.Vec3;
}
