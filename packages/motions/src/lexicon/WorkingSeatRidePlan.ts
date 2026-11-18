import { Quaternion, ROM_TOLERANCE, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPreparedPlayback } from "../perform/HumanPreparedPlayback";
import { HumanArmTrajectoryModel } from "../posture/HumanArmTrajectoryModel";
import { HumanArmTrajectoryTerms } from "../posture/HumanArmTrajectoryTerms";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPostureSource } from "../posture/resolveHumanPostureSource";
import type { fixedSeatWorkingPostures } from "./fixedSeatWorkingPostures";

type Plan = IAutoMovieMotionHumanActionPlan;
type Posture = IAutoMovieMotionHumanPosture;
type Seeded = IAutoMovieMotionHumanResolveHumanPosture.ISeeded;
type Reader = Plan["posture"];
type Design = NonNullable<ReturnType<typeof fixedSeatWorkingPostures>>;
type Publish<T> = (posture: Posture, solved?: Seeded) => T;
type Frame = (local: number) => WorkingSeatRidePlan.IWritten;
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];
/** Freeze a native structured clone before its source and display borrow the same raw graph. */
function immutable(value: unknown): void {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return;
  for (const field of Object.values(value)) immutable(field);
  Object.freeze(value);
}

const FEET: ReadonlySet<AutoMovieHumanoidBone> = new Set(["leftFoot", "rightFoot"]);

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
  readonly #body: IAutoMovieMotionHumanBody;
  readonly #design: Design;
  readonly #frame: Frame;

  constructor(plan: Plan, body: IAutoMovieMotionHumanBody, design: Design, frame: Frame) {
    this.duration = plan.duration;
    this.events = plan.events;
    this.contacts = plan.contacts;
    this.base = plan.base;
    this.#body = body;
    this.#design = design;
    this.#frame = frame;
    this.posture = (...args: Parameters<Reader>): Posture =>
      this.#sample(WorkingSeatRidePlan.postureOnly, ...args);
    HumanPreparedPlayback.attach(this, body, {
      mode: "fitted",
      phases: [{
        from: 0,
        to: plan.duration,
        sample: (...args: Parameters<Reader>): HumanPreparedPlayback.ISample =>
          this.#sample((posture: Posture, solved?: Seeded): HumanPreparedPlayback.ISample => {
            if (solved === undefined) return { posture };
            immutable(posture);
            return {
              posture,
              takeFit: (): Seeded | undefined => {
                const fit: Seeded | undefined = solved;
                solved = undefined;
                return fit;
              },
            };
          }, ...args),
      }],
    });
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
}
