import { Quaternion, ROM_TOLERANCE, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPlayback,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPreparedPlayback } from "../../perform/internal/HumanPreparedPlayback";
import { HumanArmTrajectoryModel } from "../../posture/internal/HumanArmTrajectoryModel";
import { HumanArmTrajectoryTerms } from "../../posture/internal/HumanArmTrajectoryTerms";
import { HumanBoneGroups } from "../../posture/internal/HumanBoneGroups";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPostureSource } from "../../posture/internal/resolveHumanPostureSource";
import type { fixedSeatWorkingPostures } from "./fixedSeatWorkingPostures";

const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];
/*
 * The native working-seat ride. It proposes torso articulation only when
 * keeping the original feet requires it. A complete actual pair judgement and
 * both actual sole positions admit a candidate. A single bare display leaf can
 * consume the very result that decided this law sample.
 */
export class WorkingSeatRidePlan implements WorkingSeatRidePlan.IPlan {
  /*
   * Duration of the original ride.
   */
  readonly duration: Plan["duration"];
  /*
   * The carrier law's named events.
   */
  readonly events: Plan["events"];
  /*
   * The original ride's declared support and grip windows.
   */
  readonly contacts: Plan["contacts"];
  /*
   * The original seat on which the ride ends.
   */
  readonly base?: Plan["base"];
  /*
   * The native ride reader; a direct observation owns a fresh, mutable posture.
   */
  readonly posture: Reader;
  /*
   * The same selected posture and carrier frame for a composed ride action.
   */
  readonly postureWithFrame: Frame;
  readonly #body: IAutoMovieMotionHumanBody;
  readonly #design: Design;
  readonly #frame: Frame;

  constructor(
    plan: Plan,
    body: IAutoMovieMotionHumanBody,
    design: Design,
    frame: Frame,
  ) {
    this.duration = plan.duration;
    this.events = plan.events;
    this.contacts = plan.contacts;
    this.base = plan.base;
    this.#body = body;
    this.#design = design;
    this.#frame = frame;
    this.posture = (...args: Parameters<Reader>): Posture =>
      this.#sample(this.#frame(args[0]), WorkingSeatRidePlan.postureOnly, args);
    this.postureWithFrame = (at: number): WorkingSeatRidePlan.IWritten => {
      const written: WorkingSeatRidePlan.IWritten = this.#frame(at);
      return this.#sample(
        written,
        (posture: Posture): WorkingSeatRidePlan.IWritten =>
          WorkingSeatRidePlan.withFrame(posture, written.frame),
        [at],
      );
    };
    HumanPreparedPlayback.attach(this, body, {
      mode: "fitted",
      phases: [
        {
          from: 0,
          to: plan.duration,
          sample: (
            ...args: Parameters<Reader>
          ): IAutoMovieMotionHumanPlayback.ISample =>
            this.#sample(
              this.#frame(args[0]),
              (
                posture: Posture,
                solved?: Seeded,
              ): IAutoMovieMotionHumanPlayback.ISample =>
                solved === undefined
                  ? { posture }
                  : {
                      posture,
                      takeFit: (): Seeded | undefined => {
                        const fit: Seeded | undefined = solved;
                        solved = undefined;
                        return fit;
                      },
                    },
              args,
            ),
        },
      ],
    });
  }

  /*
   * Select the exact working-seat variant for the instantaneous demands.
   */
  #sample<T>(
    written: WorkingSeatRidePlan.IWritten,
    publish: Publish<T>,
    args: Parameters<Reader>,
  ): T {
    const raw: Posture = written.posture;
    const choices: ReturnType<Design> = this.#design(raw, written.frame);
    let feedback: fixedSeatWorkingPostures.IFeedback = { neck: false };
    let best: Posture | undefined;
    let least: number = Infinity;
    for (;;) {
      const next: ReturnType<typeof choices.next> = choices.next(feedback);
      if (next.done && best === undefined) return publish(raw);
      const candidate: Posture = next.done
        ? best!
        : structuredClone(next.value);
      let violation: number = Infinity;
      let neck: boolean = false;
      const assembled: resolveHumanPostureSource.IAssembled =
        resolveHumanPostureSource.assemble(
          this.#body,
          candidate,
          undefined,
          args[3],
        );
      const fit: Seeded = resolveHumanPostureSource.fit(
        this.#body,
        assembled,
        undefined,
        {},
        args[2],
        undefined,
        {
          analytic: !next.done,
          inspect: (
            reading: Readonly<HumanArmTrajectoryModel.IEvaluation>,
          ): void => {
            violation = reading.worst.value;
            if (reading.worst.term !== "embedded") return;
            for (const arm of reading.pairs)
              for (const pairs of arm)
                if (pairs !== undefined)
                  for (const pair of pairs.embedded.values())
                    if (
                      (pair.bone === "head" || pair.bone === "neck") &&
                      pair.short >
                        HumanArmTrajectoryTerms.SKIN +
                          HumanArmTrajectoryModel.TOLERANCE
                    )
                      neck = true;
          },
        },
      );
      if (
        violation <= HumanArmTrajectoryModel.TOLERANCE &&
        this.#grounded(candidate, fit)
      ) {
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

  /*
   * Check ankle and material sole at the angular resolution of this rig.
   */
  #grounded(raw: Posture, solved: Seeded): boolean {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      this.#body,
      solved.pose,
      undefined,
      HumanBoneGroups.FEET,
    );
    for (const side of SIDES) {
      const goal: IAutoMovieHumanLimbGoal | undefined = raw.limbs[`${side}Leg`];
      if (!goal?.planted || !goal.contact || !goal.rotation) return false;
      const foot: IAutoMovieResolvedBone = bones.get(`${side}Foot`)!;
      const ankle: IAutoMovieVector3 = Vector3.subtract(
        foot.worldPosition,
        goal.point,
      );
      const sole: IAutoMovieVector3 = Vector3.add(
        ankle,
        Vector3.subtract(
          Quaternion.rotateVector(foot.worldRotation, goal.contact),
          Quaternion.rotateVector(goal.rotation, goal.contact),
        ),
      );
      const tolerance: number =
        (this.#body.measure.thigh +
          this.#body.measure.shank +
          Vector3.length(goal.contact)) *
        ROM_TOLERANCE *
        Quaternion.DEG2RAD;
      if (Vector3.length(ankle) > tolerance || Vector3.length(sole) > tolerance)
        return false;
    }
    return true;
  }
}
export namespace WorkingSeatRidePlan {
  /*
   * A ride plan whose composition can sample posture and carrier together.
   */
  export interface IPlan extends Plan {
    /*
     * Select a posture with the carrier frame that placed it.
     */
    postureWithFrame: Frame;
  }

  /*
   * The original posture and the exact carrier frame that placed it.
   */
  export interface IWritten {
    /*
     * The current original authoring.
     */
    posture: Posture;
    /*
     * The carrier read used to produce that authoring.
     */
    frame: IAutoMovieRigidTransform;
  }

  /*
   * A normal ride has no use for the carrier frame after authoring.
   */
  export function postureOnly(posture: Posture): Posture {
    return posture;
  }

  /*
   * A working ride's alternative borrows the carrier frame read by its author.
   */
  export function withFrame(
    posture: Posture,
    frame: IAutoMovieRigidTransform,
  ): IWritten {
    return { posture, frame };
  }
}
type Plan = IAutoMovieMotionHumanActionPlan;
type Posture = IAutoMovieMotionHumanPosture;
type Seeded = IAutoMovieMotionHumanResolveHumanPosture.ISeeded;
type Reader = Plan["posture"];
type Design = NonNullable<ReturnType<typeof fixedSeatWorkingPostures>>;

type Publish<T> = (posture: Posture, solved?: Seeded) => T;

type Frame = (local: number) => WorkingSeatRidePlan.IWritten;
