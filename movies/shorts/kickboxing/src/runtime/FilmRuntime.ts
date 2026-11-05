import type {
  AutoMovieHumanSkeleton,
  IAutoMovieHumanPose,
} from "@automovie/human";

import type { AudioMix } from "../audio/AudioMix";
import { Aftermath } from "../bout/Aftermath";
import { Blocking } from "../bout/Blocking";
import { BoutScript } from "../bout/BoutScript";
import { Fighter } from "../bout/Fighter";
import type { FighterBody } from "../bout/FighterBody";
import { Knockdown } from "../bout/Knockdown";
import { Referee } from "../bout/Referee";
import { RefereeCues } from "../bout/RefereeCues";
import { Resolve } from "../bout/Resolve";
import { Rhythm } from "../bout/Rhythm";
import { createPersonParameters } from "../createPersonParameters";
import { BodyRig } from "../rig/BodyRig";
import { Vec3 } from "../rig/Vec3";
import { FilmActor } from "./FilmActor";
import { FilmEvents } from "./FilmEvents";
import type { FilmPlan } from "./FilmPlan";
import { ImpactEffects } from "./ImpactEffects";

/**
 * The three performers on one film clock.
 *
 * @evidence contracts/common.md#implementation-and-ownership Every evaluation runs the same pure pipeline (fighter, knockdown, aftermath and referee frames → cross-body goal resolution → per-body IK → display), so seek, playback and export draw identical frames. Contact and mat receipts are measured once during `prepare` from the displayed FK at the planned seconds; nothing is assumed from the plan.
 * @evidence contracts/common.md#authoring-interface `evaluate(seconds)` places all actors for a film second in [0, 180]. `prepare` must resolve before contacts, mat contacts and audio events are read. `dispose` frees all actors.
 */
export class FilmRuntime {
  /** Displayed performers. */
  public readonly actors: Record<FilmPlan.ActorId, FilmActor>;

  /** Whether receipts have been measured. */
  public ready: boolean = false;

  /** Last committed film second. */
  public seconds: number = 0;

  /** Worst IK residual of the last evaluation, metres. */
  public residual: number = 0;

  /** CPU cost of the last evaluation, milliseconds. */
  public lastMotionMs: number = 0;

  private readonly fighters: Record<"a" | "b", Fighter>;
  private readonly knockdown: Knockdown;
  private readonly referee: Referee;
  /** Body rig of each performer (A and B share one body). */
  public readonly rigs: Record<FilmPlan.ActorId, BodyRig>;
  private contactReceipts: AudioMix.Contact[] = [];
  private refusedContacts: { actionId: string; gap: number }[] = [];
  private matReceipts: AudioMix.FloorContact[] = [];
  /** Measured landings that drive sweat, blood, flush and glove squash. */
  private impacts: ImpactEffects.Impact[] = [];
  /** Sweat and blood droplets and canvas stains; the Viewer adds its object to the scene. */
  public readonly effects: ImpactEffects = new ImpactEffects();

  public constructor() {
    const fighterRig: BodyRig = new BodyRig(createPersonParameters(1800, true));
    const refereeRig: BodyRig = new BodyRig(
      createPersonParameters(1780, false),
    );
    this.rigs = { a: fighterRig, b: fighterRig, referee: refereeRig };
    const ko: number = BoutScript.finish.at;
    this.fighters = {
      a: new Fighter(
        "a",
        fighterRig,
        (t: number): Fighter.Stance => {
          if (t < Aftermath.kickEnd) return rocking("a", Blocking.pair(t).a, t);
          return Aftermath.stance(t);
        },
        { start: -1, end: 180 },
      ),
      b: new Fighter(
        "b",
        fighterRig,
        (t: number): Fighter.Stance => {
          return rocking(
            "b",
            Blocking.pair(Math.min(t, ko)).b,
            Math.min(t, ko),
          );
        },
        {
          start: -1,
          end: 180,
          reserved: [
            { side: "left", start: ko, end: 181 },
            { side: "right", start: ko, end: 181 },
          ],
        },
      ),
    };
    this.knockdown = new Knockdown(this.fighters.b.frame(ko), fighterRig);
    this.referee = new Referee(
      refereeRig,
      RefereeCues.scene((t: number): Vec3.Value => {
        const stance: Fighter.Stance =
          t < Aftermath.kickEnd
            ? { ...Blocking.pair(t).a, walk: 0 }
            : Aftermath.stance(t);
        return [stance.origin[0], 1.6, stance.origin[1]];
      }),
    );
    this.actors = {
      a: new FilmActor("a", fighterRig, createPersonParameters(1800, true)),
      b: new FilmActor("b", fighterRig, createPersonParameters(1800, true)),
      referee: new FilmActor(
        "referee",
        refereeRig,
        createPersonParameters(1780, false),
      ),
    };
  }

  /**
   * Frames of all performers at a film second.
   *
   * @evidence contracts/common.md#implementation-and-ownership Fighter frames, the aftermath overlay for A, the knockdown for B after contact and the referee frame.
   * @evidence contracts/common.md#authoring-interface Film seconds; fresh frames.
   */
  public frames(t: number): Record<FilmPlan.ActorId, FighterBody.Frame> {
    const ko: number = BoutScript.finish.at;
    const a: FighterBody.Frame = this.fighters.a.frame(t);
    Aftermath.apply(
      a,
      t,
      (): Vec3.Value => [Aftermath.fallenHead[0], 0.2, Aftermath.fallenHead[1]],
    );
    const b: FighterBody.Frame =
      t <= ko ? this.fighters.b.frame(t) : this.knockdown.frame(t);
    return { a, b, referee: this.referee.frame(t) };
  }

  /**
   * Place every actor at a film second.
   *
   * @evidence contracts/common.md#implementation-and-ownership Solves three bodies (about 4 ms each) and, for B after the knockout, lifts or lowers the root so the lowest body point rests exactly on the canvas; before that, any body is only lifted, never sunk.
   * @evidence contracts/common.md#authoring-interface Seconds in [0, 180]; throws on a non-finite input.
   */
  public evaluate(t: number): void {
    const begun: number = performance.now();
    const solved: Record<FilmPlan.ActorId, FilmRuntime.Solved> = this.solve(t);
    let residual: number = 0;
    for (const id of ["a", "b", "referee"] as const) {
      residual = Math.max(residual, solved[id].error);
      this.actors[id].place(
        solved[id].root,
        solved[id].pose,
        solved[id].frame.wince,
      );
      if (id !== "referee") {
        this.actors[id].bruise(ImpactEffects.flush(this.impacts, id, t));
        for (const side of ["left", "right"] as const)
          this.actors[id].squash(
            side,
            ImpactEffects.squash(this.impacts, id, side, t),
          );
      }
    }
    this.effects.update(t);
    this.residual = residual;
    this.seconds = t;
    this.lastMotionMs = performance.now() - begun;
  }

  /**
   * Solve every performer for a film second without touching the display.
   *
   * @evidence contracts/common.md#implementation-and-ownership Frames → cross-body goals → per-body IK → FK. The ground correction uses the same FK joints and skin radii as the drawn body: any body is lifted out of the canvas, and B is settled exactly onto it once his fall has begun. Shared by the Viewer, export and the motion audit, so all three see identical motion.
   * @evidence contracts/common.md#authoring-interface Seconds in [0, 180]; returns corrected root placements, poses, world-space FK and the requests that produced them.
   */
  public solve(t: number): Record<FilmPlan.ActorId, FilmRuntime.Solved> {
    if (!Number.isFinite(t) || t < 0 || t > 180)
      throw new Error("Film second outside [0,180]");
    const frames: Record<FilmPlan.ActorId, FighterBody.Frame> = this.frames(t);
    const resolved: Resolve.Output = Resolve.requests(frames, this.rigs);
    const result = {} as Record<FilmPlan.ActorId, FilmRuntime.Solved>;
    for (const id of ["a", "b", "referee"] as const) {
      const request: BodyRig.Request = resolved.requests[id]!;
      const solved: BodyRig.Result = this.rigs[id].solve(request);
      const output: AutoMovieHumanSkeleton.IOutput = this.rigs[id].evaluate(
        solved.pose,
      );
      const world = (index: number): Vec3.Value =>
        Vec3.add(
          request.root.position,
          Vec3.rotate(output.posed[index]!.position, request.root.rotation),
        );
      let lowest: number = Infinity;
      output.posed.forEach(
        (_: AutoMovieHumanSkeleton.IPlacement, index: number): void => {
          lowest = Math.min(
            lowest,
            world(index)[1] - Math.min(output.bones[index]?.radius ?? 0, 0.08),
          );
        },
      );
      const settle: number =
        id === "b"
          ? Math.max(0, Math.min(1, (t - BoutScript.finish.at - 0.45) / 0.5))
          : 0;
      const correction: number =
        settle * -lowest + (1 - settle) * Math.max(0, -lowest);
      const root: BodyRig.Placement = {
        position: [
          request.root.position[0],
          request.root.position[1] + correction,
          request.root.position[2],
        ],
        rotation: request.root.rotation,
      };
      const joints: Map<string, Vec3.Value> = new Map();
      output.posed.forEach(
        (placement: AutoMovieHumanSkeleton.IPlacement, index: number): void => {
          const point: Vec3.Value = world(index);
          joints.set(placement.bone, [
            point[0],
            point[1] + correction,
            point[2],
          ]);
        },
      );
      result[id] = {
        root,
        pose: solved.pose,
        error: solved.error,
        joints,
        request,
        frame: frames[id],
        radii: new Map(output.bones.map((bone) => [bone.bone, bone.radius])),
      };
    }
    return result;
  }

  /**
   * Measure contact and mat receipts once.
   *
   * @evidence contracts/common.md#implementation-and-ownership For every planned contact, evaluates the film at the contact second and measures the gap between the attacking glove (sphere) or shin (segment) and the receiving glove, shin, rib capsule or jaw surface; a receipt needs the surfaces to meet (guard and shin contacts) or the weapon to sink at least 1 cm (clean hits). B's hip and shoulder arrivals are sampled at 120 Hz. Yields between groups keep the page responsive.
   * @evidence contracts/common.md#authoring-interface Resolves when all receipts are measured; progress reports completed counts.
   */
  public async prepare(
    progress?: (id: string, completed: number, total: number) => void,
  ): Promise<void> {
    const contacts: AudioMix.Contact[] = [];
    const refused: { actionId: string; gap: number }[] = [];
    const impacts: ImpactEffects.Impact[] = [];
    const planned: BoutScript.Action[] = BoutScript.actions.filter(
      (action: BoutScript.Action): boolean =>
        FilmEvents.relation(action) !== null,
    );
    const total: number = planned.length + 2;

    // Opening glove touch.
    this.evaluate(1.0);
    const touch: number =
      Vec3.distance(this.actors.a.glove("left"), this.actors.b.glove("left")) -
      0.19;
    if (touch <= 0)
      contacts.push({
        eventId: "touch",
        actionId: "touch",
        actorId: "a",
        targetId: "b",
        seconds: 1.0,
        relation: "guard",
        provenance: `glove-glove gap ${touch.toFixed(3)} m at displayed FK`,
      });
    else refused.push({ actionId: "touch", gap: touch });
    for (let index: number = 0; index < planned.length; index++) {
      const action: BoutScript.Action = planned[index]!;
      this.evaluate(action.at);
      const gap: number = this.gap(action);
      const relation = FilmEvents.relation(action)!;
      // A clean hit must sink into the receiver's skin; a guard or shin contact
      // must at least touch. No air gap counts as a landing.
      const needed: number =
        relation === "head" || relation === "body" ? -0.01 : 0;
      if (gap <= needed) {
        impacts.push(this.impact(action, relation));
        contacts.push({
          eventId: `contact:${action.id}`,
          actionId: action.id,
          actorId: action.actor,
          targetId: action.actor === "a" ? "b" : "a",
          seconds: action.at,
          relation,
          provenance: `${relation} gap ${gap.toFixed(3)} m at displayed FK`,
        });
      } else refused.push({ actionId: action.id, gap });

      // Full reaction once the surfaces meet, none beyond a 2.5 cm air gap.
      this.fighters[action.actor === "a" ? "b" : "a"].strength.set(
        action.id,
        Math.max(0, Math.min(1, (0.025 - gap) / 0.025)),
      );
      if (index % 8 === 7) {
        progress?.(action.id, index + 1, total);
        await new Promise<void>(
          (resolve: () => void): void => void setTimeout(resolve, 0),
        );
      }
    }

    // Mat arrivals: first 120 Hz sample within 2 cm of the joint's settled height on the canvas.
    const mats: AudioMix.FloorContact[] = [];
    this.evaluate(BoutScript.finish.at + 4);
    for (const [part, bone] of [
      ["hip", "rightUpperLeg"],
      ["shoulder", "rightUpperArm"],
    ] as const) {
      this.evaluate(BoutScript.finish.at + 4);
      const rest: number = this.actors.b.point(bone)[1];
      for (
        let t: number = BoutScript.finish.at + 0.2;
        t < BoutScript.finish.at + 2.5;
        t += 1 / 120
      ) {
        this.evaluate(t);
        const height: number = this.actors.b.point(bone)[1];
        if (height <= rest + 0.02) {
          mats.push({
            eventId: `fall:${part}`,
            actorId: "b",
            seconds: t,
            bodyPart: part,
            provenance: `${bone} joint reached ${height.toFixed(3)} m, within 2 cm of its settled ${rest.toFixed(3)} m, at 120 Hz`,
          });
          break;
        }
      }
    }
    this.contactReceipts = contacts;
    this.impacts = impacts;
    this.effects.configure(impacts);
    this.refusedContacts = refused;
    this.matReceipts = mats;
    this.ready = true;
    progress?.("complete", total, total);
    this.evaluate(0);
  }

  /**
   * Measured contact receipts.
   *
   * @evidence contracts/common.md#implementation-and-ownership Copies the measured receipts.
   * @evidence contracts/common.md#authoring-interface Valid after `prepare`.
   */
  public contacts(): AudioMix.Contact[] {
    return structuredClone(this.contactReceipts);
  }

  /**
   * Measured mat arrivals.
   *
   * @evidence contracts/common.md#implementation-and-ownership Copies the measured mat arrivals.
   * @evidence contracts/common.md#authoring-interface Valid after `prepare`.
   */
  public floorContacts(): AudioMix.FloorContact[] {
    return structuredClone(this.matReceipts);
  }

  /**
   * Complete cue list.
   *
   * @evidence contracts/common.md#implementation-and-ownership Builds the cue list from the same schedules and moves fall cues to their measured seconds, dropping unmeasured ones.
   * @evidence contracts/common.md#authoring-interface Valid after `prepare`.
   */
  public audioEvents(): FilmPlan.Event[] {
    const events: FilmPlan.Event[] = FilmEvents.build({
      steps: {
        a: this.fighters.a.steps,
        b: this.fighters.b.steps,
        referee: this.referee.steps,
      },
    });
    for (const event of events)
      if (event.kind === "fall") {
        const receipt: AudioMix.FloorContact | undefined =
          this.matReceipts.find(
            (item: AudioMix.FloorContact): boolean => item.eventId === event.id,
          );
        if (receipt) event.seconds = receipt.seconds;
      }
    return events.filter(
      (event: FilmPlan.Event): boolean =>
        event.kind !== "fall" ||
        this.matReceipts.some(
          (item: AudioMix.FloorContact): boolean => item.eventId === event.id,
        ),
    );
  }

  /**
   * Summary for the Viewer's inspection panel.
   *
   * @evidence contracts/common.md#implementation-and-ownership Snapshot of the last evaluation and the receipt outcome.
   * @evidence contracts/common.md#authoring-interface Plain JSON-safe object.
   */
  public inspect(): object {
    return {
      seconds: this.seconds,
      residualMetres: this.residual,
      lastMotionMs: this.lastMotionMs,
      contacts: this.contactReceipts.length,
      refusedContacts: this.refusedContacts,
      mats: this.matReceipts,
    };
  }

  /**
   * Free all actors.
   *
   * @evidence contracts/common.md#implementation-and-ownership Disposes every actor.
   * @evidence contracts/common.md#authoring-interface The runtime must not be evaluated afterwards.
   */
  public dispose(): void {
    this.effects.dispose();
    for (const actor of Object.values(this.actors)) actor.dispose();
  }

  /** The landing of a measured contact at the currently displayed second. */
  private impact(
    action: BoutScript.Action,
    relation: ImpactEffects.Impact["relation"],
  ): ImpactEffects.Impact {
    const attacker: FilmActor = this.actors[action.actor];
    const receiver: FilmActor = this.actors[action.actor === "a" ? "b" : "a"];
    const spec = BoutScript.specs[action.technique];
    const kick: boolean = action.technique.endsWith("kick");
    const point: Vec3.Value = kick
      ? Vec3.lerp(
          attacker.point(`${spec.side}LowerLeg`),
          attacker.point(`${spec.side}Foot`),
          0.7,
        )
      : attacker.glove(spec.side);
    return {
      id: action.id,
      seconds: action.at,
      attacker: action.actor,
      receiver: action.actor === "a" ? "b" : "a",
      relation,
      side: spec.side === "left" ? "right" : "left",
      weapon: kick ? "shin" : spec.side,
      point,
      direction: Vec3.normalize(
        Vec3.sub(receiver.point("chest"), attacker.point("chest")),
      ),
      strength: 1,
      finish: action === BoutScript.finish,
    };
  }

  /** Gap between the attacking surface and its planned receiving surface, metres. */
  private gap(action: BoutScript.Action): number {
    const attacker: FilmActor = this.actors[action.actor];
    const receiver: FilmActor = this.actors[action.actor === "a" ? "b" : "a"];
    const spec = BoutScript.specs[action.technique];
    const struck: "left" | "right" = spec.side === "left" ? "right" : "left";
    const kick: boolean = action.technique.endsWith("kick");
    const weapon = (point: Vec3.Value): number => {
      if (!kick) return Vec3.distance(attacker.glove(spec.side), point) - 0.095;
      const knee: Vec3.Value = attacker.point(`${spec.side}LowerLeg`);
      const ankle: Vec3.Value = attacker.point(`${spec.side}Foot`);
      return segment(point, knee, ankle) - 0.055;
    };
    switch (action.defense) {
      case "check": {
        const knee: Vec3.Value = receiver.point("leftLowerLeg");
        const ankle: Vec3.Value = receiver.point("leftFoot");
        const kneeA: Vec3.Value = attacker.point(`${spec.side}LowerLeg`);
        const ankleA: Vec3.Value = attacker.point(`${spec.side}Foot`);
        let best: number = Infinity;
        for (let i: number = 0; i <= 10; i++)
          best = Math.min(
            best,
            segment(Vec3.lerp(kneeA, ankleA, i / 10), knee, ankle),
          );
        return best - 0.11;
      }
      case "hit": {
        if (spec.target === "head") {
          // The struck jaw-side surface point in the frame the face looks along (toward
          // the attacker), the same point the kick aims at in Resolve.
          const toward: Vec3.Value = Vec3.sub(
            attacker.point("hips"),
            receiver.point("head"),
          );
          const forward: Vec3.Value = Vec3.normalize([toward[0], 0, toward[2]]);
          const left: Vec3.Value = Vec3.rotateY(
            [0, 0, 1],
            Vec3.heading(forward),
          );
          const jaw: Vec3.Value = Vec3.add(
            receiver.point("head"),
            Vec3.add(
              Vec3.add(
                Vec3.scale(forward, 0.06),
                Vec3.scale(left, struck === "left" ? 0.07 : -0.07),
              ),
              [0, -0.05, 0],
            ),
          );
          return weapon(jaw);
        }
        const chest: Vec3.Value = receiver.point("chest");
        const hips: Vec3.Value = receiver.point("hips");
        let best: number = Infinity;
        for (let i: number = 0; i <= 10; i++)
          best = Math.min(best, weapon(Vec3.lerp(hips, chest, i / 10)));
        return best - 0.14;
      }
      case "parry":
      case "cover":
      case "catch":
      case "block":
      case "slip":
      case "weave": {
        if (action.technique === "uppercut")
          return (
            Math.min(
              weapon(receiver.glove("left")),
              weapon(receiver.glove("right")),
            ) - 0.095
          );
        if (kick) {
          const forearm: Vec3.Value = Vec3.lerp(
            receiver.point(`${struck}LowerArm`),
            receiver.point(`${struck}Hand`),
            0.5,
          );
          return Math.min(
            weapon(receiver.glove(struck)) - 0.095,
            weapon(forearm) - 0.05,
          );
        }
        return weapon(receiver.glove(struck)) - 0.095;
      }
    }
  }
}

/**
 * Types of {@link FilmRuntime}.
 */
export namespace FilmRuntime {
  /**
   * One solved performer.
   *
   * @evidence contracts/common.md#implementation-and-ownership Plain solve result shared by display and audit.
   * @evidence contracts/common.md#authoring-interface World metres; joints keyed by Human bone id.
   */
  export interface Solved {
    /** Root placement after ground correction. */ root: BodyRig.Placement;
    /** Solved clinical pose. */ pose: IAutoMovieHumanPose;
    /** Worst primary IK residual, metres. */ error: number;
    /** World joint centres by bone id, after ground correction. */ joints: Map<
      string,
      Vec3.Value
    >;
    /** Skin radius of the segment leaving each joint, metres. */ radii: Map<
      string,
      number
    >;
    /** The IK request (goals before ground correction). */ request: BodyRig.Request;
    /** The authored frame. */ frame: FighterBody.Frame;
  }
}

/** A fighter's bout stance with the live rhythm's rocking added. */
function rocking(
  id: "a" | "b",
  frame: Blocking.Frame,
  t: number,
): Fighter.Stance {
  const [forward, left] = Rhythm.stance(id, t);
  const offset: Vec3.Value = Vec3.rotateY([forward, 0, left], frame.heading);
  return {
    origin: [frame.origin[0] + offset[0], frame.origin[1] + offset[2]],
    heading: frame.heading,
    walk: 0,
  };
}

/** Distance from a point to a segment. */
function segment(point: Vec3.Value, a: Vec3.Value, b: Vec3.Value): number {
  const ab: Vec3.Value = Vec3.sub(b, a);
  const u: number = Math.max(
    0,
    Math.min(
      1,
      Vec3.dot(Vec3.sub(point, a), ab) / Math.max(1e-12, Vec3.dot(ab, ab)),
    ),
  );
  return Vec3.distance(point, Vec3.add(a, Vec3.scale(ab, u)));
}
