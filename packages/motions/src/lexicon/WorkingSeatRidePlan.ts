import { Quaternion, ROM_TOLERANCE, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { prepareJumpPosture } from "../actions/prepareJumpPosture";
import { HumanArmTrajectoryModel } from "../posture/HumanArmTrajectoryModel";
import { HumanArmTrajectoryTerms } from "../posture/HumanArmTrajectoryTerms";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPostureSource } from "../posture/resolveHumanPostureSource";
import type { fixedSeatWorkingPostures } from "./fixedSeatWorkingPostures";

type Plan = IAutoMovieMotionHumanActionPlan;
type Posture = IAutoMovieMotionHumanPosture;
type Seeded = IAutoMovieMotionHumanResolveHumanPosture.ISeeded;
type Reader = Plan["posture"];
const OWNER: unique symbol = Symbol("native working seat reader");
interface NativeReader extends Reader {
  readonly [OWNER]?: WorkingSeatRidePlan;
}
type Design = NonNullable<ReturnType<typeof fixedSeatWorkingPostures>>;
type Publish<T> = (posture: Posture, solved?: Seeded) => T;
type Frame = (local: number) => WorkingSeatRidePlan.IWritten;
type OptionalSample = WorkingSeatRidePlan.ISample | undefined;
type OptionalSeeded = Seeded | undefined;
type Location = Parameters<HumanRefusal["locate"]>[0];
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];
/** Freeze a native structured clone before its source and display borrow the same raw graph. */
function immutable(value: unknown): void {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return;
  for (const field of Object.values(value)) immutable(field);
  Object.freeze(value);
}

const FEET: ReadonlySet<AutoMovieHumanoidBone> = new Set(["leftFoot", "rightFoot"]);

/** A private, synchronous handoff. Its ordinary raw posture and fitted records belong to one sampled law call. */
class Sample implements WorkingSeatRidePlan.ISample {
  readonly posture: Posture;
  readonly #body: IAutoMovieMotionHumanBody;
  readonly #local: number;
  #solved: OptionalSeeded;

  constructor(posture: Posture, body: IAutoMovieMotionHumanBody, local: number, solved?: Seeded) {
    this.posture = posture;
    this.#body = body;
    this.#local = local;
    this.#solved = solved;
  }

  /** Consume the fit once and only at its original, unmodified bare leaf. */
  take(body: IAutoMovieMotionHumanBody, posture: Posture, local: number): OptionalSeeded {
    if (body !== this.#body || posture !== this.posture || local !== this.#local) return undefined;
    const solved: OptionalSeeded = this.#solved;
    this.#solved = undefined;
    return solved;
  }
}

/**
 * The native working-seat ride. It proposes torso articulation only when
 * keeping the original feet requires it. A complete actual pair judgement
 * and both actual sole positions admit a candidate. A single bare display
 * leaf can consume the very result that decided this law sample.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The original world-space goals enter the ordinary ordered/mirrored refit. Both original sole offsets are transformed by their realised bone frames. A candidate is accepted only on the complete existing pair predicate.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only this native plan with its original reader issues a private single-use sample. A changed or composed raw posture never consumes it. No previous sample, frame key, prepared flag on user data or global result history is involved.
 */
export class WorkingSeatRidePlan implements Plan {
  /** Duration of the original ride. */
  readonly duration: Plan["duration"];
  /** The carrier law's named events. */
  readonly events: Plan["events"];
  /** The original ride's declared support and grip windows. */
  readonly contacts: Plan["contacts"];
  /** The original seat on which the ride ends. */
  readonly base?: Plan["base"];
  /** The native ride reader; a direct observation owns a fresh, mutable posture. */
  readonly posture: Reader;
  readonly #reader: Reader;
  readonly #body: IAutoMovieMotionHumanBody;
  readonly #design: Design;
  readonly #frame: Frame;
  #located?: Reader;
  #where?: Location;

  constructor(plan: Plan, body: IAutoMovieMotionHumanBody, design: Design, frame: Frame) {
    this.duration = plan.duration;
    this.events = plan.events;
    this.contacts = plan.contacts;
    this.base = plan.base;
    this.#body = body;
    this.#design = design;
    this.#frame = frame;
    this.#reader = (...args: Parameters<Reader>): Posture => this.#sample(WorkingSeatRidePlan.postureOnly, ...args);
    Object.defineProperty(this.#reader, OWNER, { value: this });
    this.posture = this.#reader;
  }

  /** A wrapped or replaced law reader no longer owns this transfer. */
  static owns(plan: Plan): boolean {
    return WorkingSeatRidePlan.#owner(plan) !== undefined;
  }

  /** Placement wraps ordinary posture refusals and binds the same location to private fit reads. */
  static located(plan: Plan, original: Reader, where: Location): Reader {
    const located: Reader = prepareJumpPosture.located(original, where);
    if (#reader in plan && original === plan.#reader) {
      Object.defineProperty(located, OWNER, { value: plan });
      plan.#located = located;
      plan.#where = where;
    }
    return located;
  }

  /** Read the actual native provider without exposing its solve to author callbacks. */
  static read(plan: Plan, ...args: Parameters<Reader>): OptionalSample {
    const owner: WorkingSeatRidePlan | undefined = WorkingSeatRidePlan.#owner(plan);
    if (owner === undefined) return undefined;
    try {
      return owner.#sample((pose: Posture, solved?: Seeded): Sample => {
        if (solved !== undefined) immutable(pose);
        return new Sample(pose, owner.#body, args[0], solved);
      }, ...args);
    } catch (error) {
      if (plan.posture === owner.#located && owner.#where && error instanceof HumanRefusal)
        throw error.locate(owner.#where);
      throw error;
    }
  }

  /** The one-cell transfer is private to this owner and ends at the first consumption. */
  static take(sample: OptionalSample, body: IAutoMovieMotionHumanBody, posture: Posture,
    carrier: IAutoMovieMotionHumanSegment | undefined, seconds: number, bare: boolean): OptionalSeeded {
    if (!bare || carrier === undefined || sample === undefined) return undefined;
    const local: number = Math.min(carrier.plan.duration, Math.max(0, seconds - carrier.start));
    return sample instanceof Sample ? sample.take(body, posture, local) : undefined;
  }

  static #owner(plan: Plan): WorkingSeatRidePlan | undefined {
    const reader: NativeReader = plan.posture;
    const owner: WorkingSeatRidePlan | undefined = reader[OWNER];
    return owner instanceof WorkingSeatRidePlan && #reader in owner && (reader === owner.#reader || reader === owner.#located) ? owner : undefined;
  }

  #sample<T>(publish: Publish<T>, ...args: Parameters<Reader>): T {
    const local: number = args[0];
    const written: WorkingSeatRidePlan.IWritten = this.#frame(local);
    const raw: Posture = written.posture;
    const choices: ReturnType<Design> = this.#design(raw, written.frame);
    let feedback: fixedSeatWorkingPostures.IFeedback = { neck: false };
    let best: Posture | undefined;
    let least: number = Infinity;
    for (;;) {
      const next: ReturnType<typeof choices.next> = choices.next(feedback);
      if (next.done && best === undefined) return publish(raw);
      const candidate: Posture = next.done ? best! : structuredClone(next.value);
      let violation: number = Infinity;
      let neck: boolean = false;
      const assembled: resolveHumanPostureSource.IAssembled =
        resolveHumanPostureSource.assemble(this.#body, candidate, undefined, args[3]);
      const fit: Seeded = resolveHumanPostureSource.fit(
        this.#body, assembled, undefined, {}, args[2], undefined, undefined, {
          analytic: !next.done,
          inspect: (reading: Readonly<HumanArmTrajectoryModel.IEvaluation>): void => {
            violation = reading.worst.value;
            if (reading.worst.term !== "embedded") return;
            for (const arm of reading.pairs)
              for (const pairs of arm)
                if (pairs !== undefined)
                  for (const pair of pairs.embedded.values())
                    if ((pair.bone === "head" || pair.bone === "neck") &&
                        pair.short > HumanArmTrajectoryTerms.SKIN + HumanArmTrajectoryModel.TOLERANCE)
                      neck = true;
          },
        },
      );
      if (violation <= HumanArmTrajectoryModel.TOLERANCE && this.#grounded(candidate, fit)) {

        return publish(candidate, fit);
      }
      if (next.done) return publish(raw);
      if (violation < least) {
        least = violation;
        best = candidate;
      }
      feedback = { neck };
    }
  }

  /** Check ankle and material sole at the angular resolution of this rig. */
  #grounded(raw: Posture, solved: Seeded): boolean {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(this.#body, solved.pose, undefined, FEET);
    for (const side of SIDES) {
      const goal: IAutoMovieHumanLimbGoal | undefined = raw.limbs[`${side}Leg`];
      if (!goal?.planted || !goal.contact || !goal.rotation) return false;
      const foot: IAutoMovieResolvedBone = bones.get(`${side}Foot`)!;
      const ankle: IAutoMovieVector3 = Vector3.subtract(foot.worldPosition, goal.point);
      const sole: IAutoMovieVector3 = Vector3.add(ankle, Vector3.subtract(
        Quaternion.rotateVector(foot.worldRotation, goal.contact),
        Quaternion.rotateVector(goal.rotation, goal.contact),
      ));
      const tolerance: number = (this.#body.measure.thigh + this.#body.measure.shank +
        Vector3.length(goal.contact)) * ROM_TOLERANCE * Quaternion.DEG2RAD;
      if (Vector3.length(ankle) > tolerance || Vector3.length(sole) > tolerance) return false;
    }
    return true;
  }
}

export namespace WorkingSeatRidePlan {
  /** The original posture and the exact carrier frame that placed it. */
  export interface IWritten {
    /** The current original authoring. */
    posture: Posture;
    /** The carrier read used to produce that authoring. */
    frame: IAutoMovieRigidTransform;
  }

  /** A normal ride has no use for the carrier frame after authoring. */
  export function postureOnly(posture: Posture): Posture { return posture; }

  /** A working ride's alternative borrows the carrier frame read by its author. */
  export function withFrame(posture: Posture, frame: IAutoMovieRigidTransform): IWritten {
    return { posture, frame };
  }

  /** The visible authoring is always a normal posture. The private result has no public access. */
  export interface ISample {
    /** The raw demands actually selected for this instant. */
    readonly posture: Posture;
  }
}
