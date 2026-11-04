import * as THREE from "three";

import { ActionVariation } from "../motion/core/ActionVariation";
import { MotionAction } from "../motion/core/MotionAction";
import { DefenseContinuation } from "../motion/defense/DefenseContinuation";
import { DefenseMotion } from "../motion/defense/DefenseMotion";
import { ContactResponse } from "../motion/interaction/ContactResponse";
import { ContactTrace } from "../motion/interaction/ContactTrace";
import { PunchAction } from "../motion/punch/PunchAction";
import { PunchArm } from "../motion/punch/PunchArm";
import { PunchCombination } from "../motion/punch/PunchCombination";
import { PunchContinuation } from "../motion/punch/PunchContinuation";
import { PunchTiming } from "../motion/punch/PunchTiming";
import { LabActor } from "./LabActor";
import { LabActualMotion } from "./LabActualMotion";
import type { LabArmWriter } from "./LabArmWriter";
import { LabBodyStage } from "./LabBodyStage";
import { LabCase } from "./LabCase";
import { LabFailure } from "./LabFailure";
import type { LabPlayable } from "./LabPlayable";
import { LabPunchRecovery } from "./LabPunchRecovery";
import { LabReceiving } from "./LabReceiving";
import type { LabRecovery } from "./LabRecovery";
import type { LabSettings } from "./LabSettings";
import { LabSharedBody } from "./LabSharedBody";
import { labContactFrame } from "./labContactFrame";
import { labDefenseConfig } from "./labDefenseConfig";

/**
 * Observe a continuing jab and cross on one actual supported body.
 * @evidence contracts/common.md#implementation-and-ownership Reuses the original jab case/contact and clock, samples both actual entry arms at fixed canonical times, and gives one body owner the finite continuation into the original cross body trajectory. Independent cross contact is traced through complete actual surfaces only after native support admission. No fake event, neutral reset or whole-pose average is used.
 * @evidence contracts/common.md#authoring-interface one-two and blocked-one-two are module cases, not a bout. The blocked case requires an actual first guard interception. Original goals, native budgets, floor and each loaded foot remain strict; a construction or seek refusal preserves raw evidence and the prior actual scene.
 */
export class LabCombinationCase implements LabPlayable {
  /** Original reproducible Viewer input. */ public readonly settings: LabSettings;
  /** Both original action clocks fit this sequence interval. */ public duration: number = 1;
  /** Refused preparation never becomes loaded transport. */ public admissionError:
    | string
    | null = null;
  /** Exactly the same two native actors as the Viewer pool. */ public readonly actors: Record<
    "a" | "b",
    LabActor
  >;
  /** Cross clock starts during the existing jab retraction. */ public crossStart: number = 0;
  /** Supported approach finishes before the original jab's local zero. */ public jabStart: number = 0;
  /** Existing contact-conditioned jab deadline, never extended by the new cross. */ public jabEnd: number = 0;
  /** A portable owner disposes its pair; Viewer borrowers do not. */ private readonly ownsActors: boolean;
  /** The existing first action remains the owner of its original contact and recovery. */ private first!: LabCase;
  /** Current committed display clock. */ private seconds: number = 0;
  /** Original immutable first-action definition and context. */ private jab!: PunchAction.Instance;
  /** Independent cross definition with an immutable actual entry. */ private cross!: PunchAction.Instance;
  /** Own-side writer scheduler, without a body plan. */ private combination!: PunchCombination.Instance;
  /** Sole finite body/support owner after the cross entry. */ private body!: LabSharedBody.Instance;
  /** Same original geometry providers; separate action contacts. */ private contexts!: {
    jab: MotionAction.Context;
    cross: MotionAction.Context;
  };
  /** Actual entry receipts for both arms and the same body. */ private entry!: Record<
    MotionAction.Side,
    LabActualMotion.Measurement
  >;
  /** Independent original cross WORLD goal fixed before any continuation fit. */ private crossWorldAim!: MotionAction.Vec3;
  /** The cross owns a separate incoming reaction on the original receiver body. */ private receiving!: {
    kind: DefenseMotion.Kind;
    request: MotionAction.Request;
    context: MotionAction.Context;
    config: DefenseMotion.Config;
    continuation: DefenseContinuation;
  };
  /** Both actual receiving arms and body at the cross handoff. */ private receivingEntry!: Record<
    MotionAction.Side,
    LabActualMotion.Measurement
  >;
  /** The first receiving arm keeps its original withdrawal deadline. */ private receivingReturn:
    | {
        side: MotionAction.Side;
        endSeconds: number;
        entry: MotionAction.Immutable<PunchContinuation.Entry>;
        context: MotionAction.Context;
      }
    | undefined;
  /** The original jab contact remains separate from the independent cross contact. */ private jabStopped:
    | {
        attacker: MotionAction.ContactState;
        receiver: MotionAction.ContactState;
        observedSupport: Record<"attacker" | "receiver", MotionAction.Support>;
      }
    | undefined;
  /** Independent actual first cross interception. */ public trace:
    | ContactTrace.Result
    | undefined;
  /** Actual contact pose/root beside original support tasks and detached observed support. */ private crossStopped:
    | {
        attacker: MotionAction.ContactState;
        receiver: MotionAction.ContactState;
        observedSupport: Record<"attacker" | "receiver", MotionAction.Support>;
      }
    | undefined;
  /** Most recent source cross intent is retained beside actual capture. */ private lastCross:
    | PunchAction.Sample
    | undefined;
  /** Explicit failed preparation/evaluation evidence before rollback. */ private failure:
    | object
    | undefined;
  /** Fixed actor baselines survive every later shared-actor production case. */ private activate:
    | (() => void)
    | undefined;
  /** Earlier opposing strike withdraws on this receiver's same body. */ private readonly receivingCarry:
    | LabReceiving.Carry
    | undefined;

  /** Bind existing definitions; preserved entry borrows adopted actors and caller-unique IDs. */
  public constructor(
    settings: LabSettings,
    actors?: Record<"a" | "b", LabActor>,
    options: {
      preserveEntry?: boolean;
      actionId?: string;
      receivingCarry?: LabReceiving.Carry;
      entryMotion?: {
        attacker: LabActualMotion.Measurement;
        receiver: LabActualMotion.Measurement;
      };
    } = {},
  ) {
    if (settings.action !== "one-two" && settings.action !== "blocked-one-two")
      throw new Error("Unknown overlapping punch case");
    if (settings.defense === "check")
      throw new Error(
        "A punch combination requires an arm defense or evasion; shin checks have an independent kick preparation clock",
      );
    if (options.preserveEntry && !actors)
      throw new Error("Preserved entry requires borrowed adopted actors");
    if (
      options.actionId !== undefined &&
      (typeof options.actionId !== "string" || !options.actionId.trim())
    )
      throw new Error("An action ID must be a nonempty string");
    this.settings = structuredClone(settings);
    this.receivingCarry = options.receivingCarry
      ? Object.freeze({ ...options.receivingCarry })
      : undefined;
    this.ownsActors = actors === undefined;
    this.actors = actors ?? {
      a: new LabActor("a", "a", -settings.distance / 2, 0),
      b: new LabActor("b", "b", settings.distance / 2, Math.PI),
    };
    const restore: (() => void)[] = Object.values(this.actors).map(
      (actor: LabActor): (() => void) => actor.checkpoint(),
    );
    try {
      this.first = new LabCase({ ...settings, action: "jab" }, this.actors, {
        preserveEntry: options.preserveEntry,
        actionId: options.actionId ? `${options.actionId}:jab` : undefined,
        receivingCarry: options.receivingCarry,
        entryMotion: options.entryMotion,
      });
      if (this.first.admissionError)
        throw new Error(this.first.admissionError, {
          cause: this.first.inspect(),
        });
      const entry: (() => void)[] = Object.values(this.actors).map(
        (actor: LabActor): (() => void) => actor.checkpoint(),
      );
      this.activate = (): void => {
        for (const restoreEntry of entry) restoreEntry();
      };
      if (
        settings.action === "blocked-one-two" &&
        this.first.trace?.event?.relation !== "guard"
      )
        throw new Error(
          "Blocked jab-to-cross requires an actual guard interception",
        );
      const source: {
        request: MotionAction.Request;
        aim: { originalWorld: MotionAction.Vec3 };
        stopped?: LabCombinationCase["jabStopped"];
      } = this.first.inspect() as {
        request: MotionAction.Request;
        aim: { originalWorld: MotionAction.Vec3 };
        stopped?: LabCombinationCase["jabStopped"];
      };
      if (!this.first.punchAction)
        throw new Error("The first case has no immutable jab instance");
      this.jab = this.first.punchAction;
      this.jabStart = this.first.entrySeconds + this.first.readySeconds;
      this.jabStopped = structuredClone(source.stopped);
      const release: number =
        (this.first.trace?.event?.time ??
          this.jab.timing.preparation + this.jab.timing.delivery) +
        this.jab.timing.contact;
      this.jabEnd =
        this.jabStart +
        (this.first.trace?.event
          ? release + this.jab.timing.retraction + this.jab.timing.recovery
          : this.jab.duration);
      this.crossStart =
        this.jabStart + release + this.jab.timing.retraction * 0.35;
      const actor: LabActor = this.actors[settings.actor];
      const receiver: LabActor =
        this.actors[settings.actor === "a" ? "b" : "a"];
      const crossSide: MotionAction.Side =
        settings.side === "left" ? "right" : "left";
      this.crossWorldAim = [...source.aim.originalWorld];
      const context: MotionAction.Context = actor.context(
        crossSide,
        actor.local(this.crossWorldAim),
      );
      const profile: PunchTiming.Measurement = PunchTiming.measurement("cross");
      const request: MotionAction.Request = {
        ...structuredClone(source.request),
        id: options.actionId ? `${options.actionId}:cross` : "laboratory-cross",
        side: crossSide,
        timing: {
          preparation: 0.08 * settings.timingScale,
          delivery: profile.delivery * settings.timingScale,
          contact: 0.025 * settings.timingScale,
          retraction: profile.retraction * settings.timingScale,
          recovery: 0.12 * settings.timingScale,
        },
      };
      const originalCross: PunchAction.Instance = PunchAction.create(
        "cross",
        request,
      );
      this.crossWorldAim = new THREE.Vector3(...context.target)
        .add(new THREE.Vector3(...originalCross.aimOffset))
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), actor.yaw)
        .add(actor.origin)
        .toArray();
      const cache: Map<
        number,
        Record<MotionAction.Side, LabActualMotion.Snapshot>
      > = new Map();
      const receivingCache: Map<
        number,
        Record<MotionAction.Side, LabActualMotion.Snapshot>
      > = new Map();
      const canonical: (
        time: number,
        side: MotionAction.Side,
        receiving?: boolean,
      ) => LabActualMotion.Snapshot = (
        time: number,
        side: MotionAction.Side,
        receiving: boolean = false,
      ): LabActualMotion.Snapshot => {
        if (!cache.has(time)) {
          const rollback: () => void = this.first.checkpoint();
          try {
            this.first.evaluate(time);
            const branch: string = this.first.trace?.event
              ? time >= this.jabStart + this.first.trace.event.time
                ? "post-contact"
                : "pre-contact"
              : "free";
            cache.set(time, {
              left: LabActualMotion.capture(actor, "left", time, branch),
              right: LabActualMotion.capture(actor, "right", time, branch),
            });
            receivingCache.set(time, {
              left: LabActualMotion.capture(receiver, "left", time, branch),
              right: LabActualMotion.capture(receiver, "right", time, branch),
            });
          } finally {
            rollback();
          }
        }
        return structuredClone(
          (receiving ? receivingCache : cache).get(time)![side],
        );
      };
      const h: number = 1 / 2400;
      this.entry = {
        left: LabActualMotion.measure(
          (time: number): LabActualMotion.Snapshot => canonical(time, "left"),
          this.crossStart,
          h,
          "before",
        ),
        right: LabActualMotion.measure(
          (time: number): LabActualMotion.Snapshot => canonical(time, "right"),
          this.crossStart,
          h,
          "before",
        ),
      };
      this.receivingEntry = {
        left: LabActualMotion.measure(
          (time: number): LabActualMotion.Snapshot =>
            canonical(time, "left", true),
          this.crossStart,
          h,
          "before",
        ),
        right: LabActualMotion.measure(
          (time: number): LabActualMotion.Snapshot =>
            canonical(time, "right", true),
          this.crossStart,
          h,
          "before",
        ),
      };
      this.body = LabSharedBody.create(
        this.entry[crossSide],
        originalCross,
        context,
      );
      const end: number =
        originalCross.timing.preparation + originalCross.timing.delivery;
      const continuation: PunchAction.Continuation = this.continuation(
        crossSide,
        end,
        this.crossWorldAim,
      );
      this.cross = PunchAction.create("cross", request, continuation);
      const guardWorld: MotionAction.Vec3 = new THREE.Vector3(
        ...actor.context(settings.side, [0, 0, 0]).geometry.hand!,
      )
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), actor.yaw)
        .add(actor.origin)
        .toArray();
      this.combination = PunchCombination.create({
        jab: this.jab,
        cross: this.cross,
        jabStart: this.jabStart,
        crossStart: this.crossStart,
        jabReturn: this.continuation(
          settings.side,
          this.jabEnd - this.crossStart,
          guardWorld,
        ),
      });
      this.contexts = {
        jab: {
          ...actor.context(
            settings.side,
            actor.local(source.aim.originalWorld),
          ),
          contact: this.jabStopped?.attacker,
        },
        cross: context,
      };
      const defenseSide: MotionAction.Side =
        settings.side === "left" ? "right" : "left";
      const defenseRequest: MotionAction.Request = {
        ...structuredClone(source.request),
        id: options.actionId
          ? `${options.actionId}:defense`
          : "laboratory-defense",
        actorId: receiver.id,
        targetId: actor.id,
        side: defenseSide,
        leadSide: receiver.leadSide,
        timing: {
          ...this.jab.timing,
          preparation: 0,
          delivery: Math.max(
            0.08,
            this.jab.timing.preparation + this.jab.timing.delivery * 0.85,
          ),
          retraction: 0.18 * settings.timingScale,
          recovery: 0.1 * settings.timingScale,
        },
      };
      const nextSide: MotionAction.Side =
        defenseSide === "left" ? "right" : "left";
      const nextKind: DefenseMotion.Kind =
        settings.defense === "none"
          ? "guard"
          : ["parry", "catch", "check"].includes(settings.defense)
            ? "cover"
            : settings.defense;
      const nextRequest: MotionAction.Request = {
        ...defenseRequest,
        id: `${defenseRequest.id}:cross`,
        side: nextSide,
        timing: {
          ...this.cross.timing,
          preparation: 0,
          delivery: Math.max(
            0.08,
            this.cross.timing.preparation + this.cross.timing.delivery * 0.85,
          ),
          retraction: 0.18 * settings.timingScale,
          recovery: 0.1 * settings.timingScale,
        },
      };
      const nextContext: MotionAction.Context = receiver.context(
        nextSide,
        [0, 0, 0],
      );
      const nextConfig: DefenseMotion.Config = labDefenseConfig(
        receiver,
        nextRequest,
        nextKind,
        settings.target,
        0,
      );
      if (nextKind === "slip" || nextKind === "weave")
        nextConfig.lateralMetres = -(nextConfig.lateralMetres ?? 0);
      const canonicalReceiving: DefenseMotion.Sample = DefenseMotion.sample(
        nextKind,
        nextRequest,
        nextContext,
        0,
        nextConfig,
      );
      const nextTiming: MotionAction.Timing =
        ActionVariation.create(nextRequest).timing;
      this.receiving = {
        kind: nextKind,
        request: nextRequest,
        context: nextContext,
        config: nextConfig,
        continuation: new DefenseContinuation(
          canonicalReceiving,
          LabActualMotion.defenseEntry(
            this.receivingEntry[nextSide],
            canonicalReceiving,
            nextContext,
            nextSide,
            nextTiming.preparation + nextTiming.delivery,
          ),
        ),
      };
      if (["parry", "catch", "cover"].includes(settings.defense)) {
        const firstTiming: MotionAction.Timing =
          ActionVariation.create(defenseRequest).timing;
        const deadline: number =
          this.jabStart +
          (this.first.trace?.event?.time ??
            firstTiming.preparation + firstTiming.delivery) +
          firstTiming.contact +
          firstTiming.retraction;
        if (deadline > this.crossStart)
          this.receivingReturn = {
            side: defenseSide,
            endSeconds: deadline,
            entry: PunchContinuation.createEntry(
              LabActualMotion.punchEntry(
                this.receivingEntry[defenseSide],
                defenseSide,
                deadline - this.crossStart,
                [0, 0, 0],
              ),
              defenseSide,
            ),
            context: receiver.context(defenseSide, [0, 0, 0]),
          };
      }
      this.duration = Math.max(
        this.combination.duration,
        this.crossStart + this.cross.duration + 0.3,
      );
      this.trace = ContactTrace.resolve({
        actionId: request.id,
        actorId: actor.id,
        targetId: receiver.id,
        start: this.cross.timing.preparation,
        end: this.cross.timing.preparation + this.cross.timing.delivery,
        stepSeconds: 1 / 60,
        refinementSteps: 8,
        maximumCaptures: 160,
        grazeCosine: 0.25,
        capture: (local: number): ContactTrace.Frame => {
          this.apply(this.crossStart + local);
          const sample: MotionAction.Sample = actor.constrained();
          sample.elapsed = local;
          return labContactFrame(
            actor,
            receiver,
            sample,
            {
              action: "cross",
              side: crossSide,
              defense: nextKind === "guard" ? "none" : nextKind,
            },
            nextSide,
          );
        },
      });
      if (this.trace.event) {
        this.apply(this.crossStart + this.trace.event.time);
        const actual: MotionAction.Sample = actor.constrained();
        const receiving: MotionAction.Sample = receiver.constrained();

        // Actual contact receipts do not redefine the original WORLD support tasks.
        const stopped: MotionAction.Sample = {
          ...structuredClone(this.lastCross!),
          pose: actual.pose,
          rootOffset: actual.rootOffset,
          support: structuredClone(actor.sample!.support),
          effectors: actual.effectors.filter(
            (effector: MotionAction.Effector): boolean =>
              effector.bone.startsWith(crossSide),
          ),
          elapsed: this.trace.event.time,
        };
        this.crossStopped = {
          attacker: { event: this.trace.event, sample: stopped },
          receiver: {
            event: this.trace.event,
            sample: {
              ...receiving,
              support: structuredClone(receiver.sample!.support),
            },
          },
          observedSupport: {
            attacker: structuredClone(actual.support),
            receiver: structuredClone(receiving.support),
          },
        };
      }
      this.evaluate(0);
    } catch (error: unknown) {
      this.admissionError =
        error instanceof Error ? error.message : String(error);
      this.failure = structuredClone({
        stage: "combination-preparation",
        error: this.admissionError,
        producerCause: error instanceof Error ? error.cause : undefined,
        first: this.first?.inspect(),
        entry: this.entry,
        body: this.body?.inspect(),
        actors: Object.values(this.actors).map((actor: LabActor): object =>
          actor.inspect(),
        ),
      });
      for (const rollback of restore) rollback();
    }
  }

  /** Convert one fixed actual owned-arm receipt into the source's immutable entry. */
  private continuation(
    side: MotionAction.Side,
    endSeconds: number,
    terminal: MotionAction.Vec3,
  ): PunchAction.Continuation {
    return LabActualMotion.punchEntry(
      this.entry[side],
      side,
      endSeconds,
      terminal,
    );
  }

  /** Apply one body owner and both existing independent arm clocks. */
  private apply(seconds: number): void {
    if (seconds < this.crossStart) {
      this.first.evaluate(seconds);
      return;
    }
    const actor: LabActor = this.actors[this.settings.actor];
    const receiver: LabActor =
      this.actors[this.settings.actor === "a" ? "b" : "a"];
    const local: number = seconds - this.crossStart;
    const reaction: ContactResponse.Sample | undefined =
      this.crossStopped && this.trace
        ? response(this.trace, local - this.crossStopped.attacker.event.time)
        : undefined;
    const displacement: MotionAction.Vec3 = new THREE.Vector3(
      ...(reaction?.attacker ?? ([0, 0, 0] as MotionAction.Vec3)),
    )
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), -actor.yaw)
      .toArray();
    const placement: MotionAction.BodyPlacement = actor.prepareBody(
      this.body.sample(local, this.crossStopped?.attacker, displacement),
    );
    const contexts: { jab: MotionAction.Context; cross: MotionAction.Context } =
      {
        jab: this.contexts.jab,
        cross: { ...this.contexts.cross, contact: this.crossStopped?.attacker },
      };
    const writers: PunchCombination.Writer[] = this.combination.sample(
      seconds,
      contexts,
      placement,
      displacement,
    );
    this.lastCross = writers.find(
      (writer: PunchCombination.Writer): boolean =>
        writer.side !== this.settings.side,
    )?.sample;
    actor.applyArms(writers, placement);
    const contact: MotionAction.ContactState | undefined =
      this.crossStopped && local >= this.crossStopped.receiver.event.time
        ? this.crossStopped.receiver
        : undefined;
    const age: number | undefined = contact
      ? local - contact.event.time
      : undefined;
    const config: DefenseMotion.Config = {
      ...this.receiving.config,
      contactElapsed: age,
    };
    const receiving: MotionAction.Sample = DefenseMotion.sample(
      this.receiving.kind,
      this.receiving.request,
      { ...this.receiving.context, contact },
      local,
      config,
      this.receiving.continuation,
    );

    // A new impact adopts the actual receiver, including the earlier normal response.
    // That ends the earlier normal branch once; its offset must not be added again.
    const normal: MotionAction.Vec3 = contact
      ? (reaction?.receiver ?? [0, 0, 0])
      : [0, 0, 0];
    const receiverOffset: THREE.Vector3 = new THREE.Vector3(
      ...normal,
    ).applyAxisAngle(new THREE.Vector3(0, 1, 0), -receiver.yaw);
    receiving.rootOffset = receiving.rootOffset.map(
      (value: number, index: number): number =>
        value + receiverOffset.getComponent(index),
    ) as MotionAction.Vec3;
    const returning: LabReceiving.Return | undefined = this.receivingReturn
      ? {
          side: this.receivingReturn.side,
          endSeconds: this.receivingReturn.endSeconds,
          sample: (actual: MotionAction.BodyPlacement): LabArmWriter => {
            const source: NonNullable<LabCombinationCase["receivingReturn"]> =
              this.receivingReturn!;
            const sample: MotionAction.Sample = LabBodyStage.sample(actual);
            sample.pose = PunchContinuation.returnArm(
              source.entry,
              local,
              source.side,
              source.context.basePose,
              structuredClone(actual.pose) as MotionAction.Sample["pose"],
            );
            sample.effectors = PunchArm.frame(
              source.context,
              sample.pose,
              source.side,
              false,
            );
            sample.elapsed = seconds;
            sample.phase =
              seconds < source.endSeconds ? "retraction" : "complete";
            return {
              side: source.side,
              sample,
              channels: PunchArm.armChannels(source.side),
            };
          },
        }
      : undefined;
    LabReceiving.apply(
      receiver,
      receiving,
      seconds,
      this.receivingCarry,
      returning,
    );
  }

  /**
   * Commit a sequence time only after both actual actors remain admitted.
   * @evidence contracts/common.md#implementation-and-ownership Atomic rollback covers both native actors, source intent and committed display time. Jab and cross keep separate contact identities and clocks; support, source-fit and receiving failures retain their already computed raw causes.
   * @evidence contracts/common.md#authoring-interface The closed interval supports arbitrary seek. Playback FPS never enters evaluation and a failed state cannot masquerade as a displayed completion.
   */
  public evaluate(seconds: number): void {
    if (this.admissionError)
      throw new Error(`No combination loaded: ${this.admissionError}`);
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > this.duration)
      throw new Error("Combination time is outside its closed interval");
    const restore: () => void = this.checkpoint();
    try {
      this.activate?.();
      this.apply(seconds);
      if (
        Object.values(this.actors).some(
          (actor: LabActor): boolean => actor.support?.status !== "admitted",
        )
      )
        throw new Error("Combination actual support is unresolved");
      this.seconds = seconds;
      this.failure = undefined;
    } catch (error: unknown) {
      const observed: object = structuredClone({
        seconds,
        producerCause: error instanceof Error ? error.cause : undefined,
        actors: Object.values(this.actors).map((actor: LabActor): object =>
          actor.inspect(),
        ),
      });
      restore();
      this.failure = observed;
      throw LabFailure.error("combination-evaluation", error, observed);
    }
  }

  /**
   * Preserve actual actors and each committed clock without reevaluation.
   * @evidence contracts/common.md#implementation-and-ownership Reuses both actor checkpoint closures and the original first-case transaction, retaining source intent and the committed local clock without solving again.
   * @evidence contracts/common.md#authoring-interface The synchronous restore belongs to this live case and restores display state only; immutable entry, original contacts and action definitions remain unchanged.
   */
  public checkpoint(): () => void {
    const restore: () => void = this.first.checkpoint();
    const seconds: number = this.seconds;
    const last: PunchAction.Sample | undefined = this.lastCross;
    const failure: object | undefined = this.failure;
    return (): void => {
      restore();
      this.seconds = seconds;
      this.lastCross = last;
      this.failure = failure;
    };
  }

  /**
   * Read both exact independently resolved action clocks for picture and sound.
   * @evidence contracts/common.md#implementation-and-ownership Publishes detached original jab and cross timings with their actual sequence offsets. No source timing is inferred from a film beat or recreated variation.
   * @evidence contracts/common.md#authoring-interface startSeconds is case-local. Both identities remain distinct and timing values are resolved phase seconds; the snapshots cannot mutate either original instance.
   */
  public actionClocks(): readonly {
    actionId: string;
    startSeconds: number;
    timing: MotionAction.Timing;
  }[] {
    if (this.admissionError)
      throw new Error("No admitted combination clock is available");
    return Object.freeze([
      Object.freeze({
        actionId: this.jab.request.id,
        startSeconds: this.jabStart,
        timing: Object.freeze(structuredClone(this.jab.timing)),
      }),
      Object.freeze({
        actionId: this.cross.request.id,
        startSeconds: this.crossStart,
        timing: Object.freeze(structuredClone(this.cross.timing)),
      }),
    ]);
  }

  /**
   * Borrow both original released arms while preserving the same jab-return bridge.
   * @evidence contracts/common.md#implementation-and-ownership Captures the existing combination, fixed contexts and independent actual contacts. The pure adapter samples the same original arm curves on the consumer's single body, without calling either whole case or resetting the jab clock.
   * @evidence contracts/common.md#authoring-interface Both arms must be strictly released before borrowing. Each retains its original deadline and contact identity; the receiving host must reject conflicting active same-side defensive tasks.
   */
  public recoveryPort(): LabRecovery {
    if (this.admissionError)
      throw new Error("An admitted combination is required for recovery");
    const combination: PunchCombination.Instance = this.combination;
    const originalTaskFrame: MotionAction.Context["frame"] = structuredClone(
      this.contexts.cross.frame,
    );
    return LabPunchRecovery.create(
      [
        {
          action: this.jab,
          context: this.contexts.jab,
          startSeconds: this.jabStart,
          contact: this.jabStopped?.attacker,
        },
        {
          action: this.cross,
          context: this.contexts.cross,
          startSeconds: this.crossStart,
          contact: this.crossStopped?.attacker,
        },
      ],
      (
        seconds: number,
        contexts: readonly MotionAction.Context[],
        placement: MotionAction.BodyPlacement,
      ): LabArmWriter[] =>
        combination.sample(
          seconds,
          { jab: contexts[0]!, cross: contexts[1]! },
          placement,
          undefined,
          originalTaskFrame,
        ),
    );
  }

  /**
   * Independently inspect post-fit rates around any valid canonical point.
   * @evidence contracts/common.md#implementation-and-ownership Applies the same actual sequence at fixed h and h/2 with checkpoint restoration, then uses the public actual-motion reader. Branch changes or failed physical states refuse instead of producing a synthetic tangent.
   * @evidence contracts/common.md#authoring-interface Side is anatomical and oneSided must respect actual contact. Returned approximations disclose rate disagreement and are independent of render history or caller seek order.
   */
  public ratesAt(
    seconds: number,
    side: MotionAction.Side,
    h: number,
    oneSided: "before" | "after",
    performer: "attacker" | "receiver" = "attacker",
  ): LabActualMotion.Measurement {
    return LabActualMotion.measure(
      (time: number): LabActualMotion.Snapshot => {
        const restore: () => void = this.checkpoint();
        try {
          this.evaluate(time);
          const jabEvent: MotionAction.ContactEvent | undefined =
            this.first.trace?.event ?? undefined;
          const crossEvent: MotionAction.ContactEvent | undefined =
            this.trace?.event ?? undefined;
          const branch: string = JSON.stringify({
            jab: jabEvent
              ? time >= this.jabStart + jabEvent.time
                ? "post-contact"
                : "pre-contact"
              : "free",
            cross: crossEvent
              ? time >= this.crossStart + crossEvent.time
                ? "post-contact"
                : "pre-contact"
              : "free",
          });
          return LabActualMotion.capture(
            this.actors[
              performer === "attacker"
                ? this.settings.actor
                : this.settings.actor === "a"
                  ? "b"
                  : "a"
            ],
            side,
            time,
            branch,
          );
        } finally {
          restore();
        }
      },
      seconds,
      h,
      oneSided,
    );
  }

  /**
   * Publish separate original action, actual-entry, body, contact and failed-state evidence.
   * @evidence contracts/common.md#implementation-and-ownership Observations retain the fixed canonical actual entry and one original cross terminal while both actual actors provide independent support/floor/shape results. The first action/contact is never relabelled as the second.
   * @evidence contracts/common.md#authoring-interface entry contains h/h2 rates and root/torso/pad provenance. Body receipt names the finite return to the original cross body trajectory. No field claims a continuous watched review or physical pass.
   */
  public inspect(): object {
    return structuredClone({
      kind: this.settings.action,
      seconds: this.seconds,
      admissionError: this.admissionError,
      jabStart: this.jabStart,
      approach: this.first
        ? (this.first.inspect() as { entry: object }).entry
        : undefined,
      crossStart: this.crossStart,
      jabEnd: this.jabEnd,
      jabClock: this.seconds - this.jabStart,
      crossClock: this.seconds - this.crossStart,
      entry: this.entry,
      receiving: {
        entry: this.receivingEntry,
        kind: this.receiving?.kind,
        request: this.receiving?.request,
        continuation: this.receiving?.continuation.inspect(),
        firstReturn: this.receivingReturn && {
          side: this.receivingReturn.side,
          endSeconds: this.receivingReturn.endSeconds,
          entry: this.receivingReturn.entry,
        },
      },
      sharedBody: this.body?.inspect(),
      originalCrossWorldAim: this.crossWorldAim,
      originalCrossTiming: this.cross?.timing,
      jabContact: this.first?.trace,
      crossContact: this.trace,
      stopped: { jab: this.jabStopped, cross: this.crossStopped },
      sourceWriters: this.actors[this.settings.actor].sample,
      failedEvaluation: this.failure,
      actors: { a: this.actors.a.inspect(), b: this.actors.b.inspect() },
      limits: [
        "finite canonical velocity estimates with explicit h/h2 disagreement",
        "complete original full-foot admission remains required",
        "no force or full articulated CCD claim",
      ],
    });
  }

  /**
   * Name original and overlapping action clocks with actual support outcomes.
   * @evidence contracts/common.md#implementation-and-ownership Reports the independent contact outcomes and currently committed phase instead of a canned completion label.
   * @evidence contracts/common.md#authoring-interface A refusal remains inspectable and cannot replace a previous healthy loaded case.
   */
  public summary(): string {
    return `${this.settings.action} · jab ${(this.seconds - this.jabStart).toFixed(3)} s · cross ${(this.seconds - this.crossStart).toFixed(3)} s\nJab contact: ${this.first?.trace?.outcome ?? "none"}; cross contact: ${this.trace?.outcome ?? "none"}. One shared body/support. A: ${this.actors.a.support?.status}, B: ${this.actors.b.support?.status}`;
  }

  /**
   * Retire the first case and only a locally owned actor pair.
   * @evidence contracts/common.md#implementation-and-ownership The existing first case borrows this pair, so disposing it never removes Viewer actors; portable owners retire their original geometry once.
   * @evidence contracts/common.md#authoring-interface This does not stop servers, Viewer controls or another selection's borrowed objects.
   */
  public dispose(): void {
    this.activate = undefined;
    this.admissionError ??= "Combination has been disposed";
    this.first?.dispose();
    if (this.ownsActors)
      for (const actor of Object.values(this.actors)) actor.dispose();
  }
}

/** Keep the same authored normal-compliance controls as each standalone encounter. */
function response(
  trace: ContactTrace.Result,
  sinceContact: number,
): ContactResponse.Sample {
  return ContactResponse.sample(trace, sinceContact, {
    attackerSeconds: 0.18,
    receiverSeconds: 0.3,
    attackerGainSeconds: 0.003,
    bodyGainSeconds: 0.008,
    guardGainSeconds: 0.004,
    grazeFraction: 0.4,
    maximumMetres: 0.035,
  });
}
