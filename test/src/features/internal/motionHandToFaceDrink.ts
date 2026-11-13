import { createDrinkware } from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanBend,
  AutoMovieMotionHumanDrinkingArm,
  AutoMovieMotionHumanTouchDrink,
  type AutoMovieMotionHumanTouchUpright,
  HumanChain,
  HumanObject,
  type HumanSegment,
  HumanTrunk,
  type IHumanBody,
  type IHumanPosture,
  handToFace,
} from "@automovie/motions";

import { motionComplaints } from "./motionComplaints";
import { motionHumanBody } from "./motionHumanBody";
import { motionHumanLaw } from "./motionHumanLaw";
import { motionHumanSignature as M } from "./motionHumanSignature";

/**
 * The drinking signature of one body, which the
 * `test_human_motion_signature_hand_to_face_drink_*` specs read one body
 * each: the right arm at `atMouth` of a drink and of a sip with the implied
 * glass, and of a drink from a real glass the hand took up for that use
 * first (`pickUp` with `use`, then `handToFace` with the prop), once with the
 * vessel searched afresh and once held as the grasp it was taken up by
 * presents it (`grasp`: only its lean is sought), so the same drink is read
 * however the glass came to the hand.
 *
 * Bound and source: a glass is brought to the mouth with the shoulder raised
 * about 40 to 50 degrees, the elbow low and in front of the body and the
 * forearm near vertical, not saluting at the forehead (Murphy, Willén and
 * Sunnerhagen 2011, Neurorehabil Neural Repair 25:71, drinking from a
 * glass). Bound: the upper arm raised at most 70 degrees from hanging, the
 * elbow at least 50 mm below the shoulder joint, and the wrist within a
 * hand length of the mouth region (provisional limits). The real glass
 * stands at waist height before the right shoulder, 0.6 of the arm's length
 * ahead, as `test_human_motion_prop_held_attitude` places it.
 *
 * With `least`, the search's least lean is read as well: the drink's lean
 * one `LEAN_STEP` below the one the law took must admit no drinking arm,
 * which the coarse-to-fine search assumes (`AutoMovieMotionHumanTouchDrink.drinking`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the cells, the bound with its source and status, the glass's place and the least-lean check.
 * @evidence contracts/development/implementation.md#principled-implementation Performs the real law on a real body and reads displayed joints, and the search's own admission one step below its answer.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over three cells, each staged, read and checked, then the optional least-lean check.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A cell that does not plan is a complaint with the refusal's words, not a skipped cell.
 * @evidence contracts/development/implementation.md#efficient-algorithms Four films per body; the least-lean check reads the drink's film again at its first second.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Stages through `motionHumanSignature` and `motionHumanLaw`, reads the region through `HumanTrunk.region` and admits through `AutoMovieMotionHumanTouchDrink.admitted`.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The films live as long as the call.
 */
export namespace motionHandToFaceDrink {
  /**
   * Read one body's drinking cells and assert them.
   *
   * @param name The body.
   * @param least Whether to check the search's least lean on the drink as well.
   */
  export function check(name: motionHumanBody.Name, least: boolean): void {
    const complaints: motionComplaints.IGatherer = motionComplaints();
    const body: IHumanBody = motionHumanBody(name);
    const stood: HumanObject.Placement = {
      at: {
        x: -body.measure.shoulderHalfWidth,
        y: body.measure.waistHeight,
        z: 0.6 * (body.measure.upperArm + body.measure.forearm),
      },
      yaw: 0,
    };
    const cells: [string, () => M.IStaged][] = [
      [
        `task=drink ${name}`,
        (): M.IStaged => M.stage("handToFace", "task=drink", name),
      ],
      [
        `task=sip ${name}`,
        (): M.IStaged => M.stage("handToFace", "task=sip", name),
      ],
      [
        `held glass ${name}`,
        (): M.IStaged => ({
          film: motionHumanLaw.perform(
            "signature",
            [{ subject: "a", body }],
            HumanChain.subject("a")
              .pickUp({
                prop: "glass",
                handle: "body",
                use: { tip: "lip", line: "square", at: "mouth" },
              })
              .handToFace({ task: "drink", prop: "glass" }),
            [
              HumanObject.prop(
                "glass",
                createDrinkware({ kind: "glass" }),
                stood,
              ),
            ],
          ),
          body,
          yaw: 0,
        }),
      ],
      [
        `held glass by its grasp ${name}`,
        (): M.IStaged => ({
          film: motionHumanLaw.perform(
            "signature",
            [{ subject: "a", body }],
            HumanChain.subject("a")
              .pickUp({
                prop: "glass",
                handle: "body",
                use: { tip: "lip", line: "square", at: "mouth" },
              })
              .handToFace({
                task: "drink",
                prop: "glass",
                grasp: { handle: "body", line: "square" },
              }),
            [
              HumanObject.prop(
                "glass",
                createDrinkware({ kind: "glass" }),
                stood,
              ),
            ],
          ),
          body,
          yaw: 0,
        }),
      ],
    ];
    for (const [label, perform] of cells) {
      const cell: string = `handToFace ${label}`;
      let s: M.IStaged;
      try {
        s = perform();
      } catch (error) {
        complaints.check(
          `${cell}: expected to plan, got ${(error as Error).message}`,
          false,
        );
        continue;
      }
      read(complaints, cell, s);
      if (least && label.startsWith("task=drink"))
        for (const c of below(s)) complaints.check(`${cell}: ${c}`, false);
    }
    complaints.assert(`a glass comes to the lips as people drink (${name})`);
  }

  /** The Murphy bounds of one staged cell at `atMouth`, with the goal and the law's own reader on a miss. */
  function read(
    complaints: motionComplaints.IGatherer,
    cell: string,
    s: M.IStaged,
  ): void {
    const at: number = M.event(s, "atMouth")!;
    const shoulder: IAutoMovieVector3 = M.joint(s, at, "rightUpperArm");
    const knuckle: IAutoMovieVector3 = M.joint(s, at, "rightLowerArm");
    const hand: IAutoMovieVector3 = M.joint(s, at, "rightHand");
    const arm: IAutoMovieVector3 = {
      x: knuckle.x - shoulder.x,
      y: knuckle.y - shoulder.y,
      z: knuckle.z - shoulder.z,
    };
    const elevation: number =
      (Math.acos(-arm.y / Math.hypot(arm.x, arm.y, arm.z)) * 180) / Math.PI;
    // The arm's goal there, for the fit it came from: the elbow's hint and
    // the reference arm, and where the fitted elbow and the wrist lie.
    const posture: IHumanPosture = s.film.performance.posture("a", at);
    const segments: readonly HumanSegment.ISegment[] =
      s.film.performance.segments("a");
    const entered: IHumanPosture = s.film.performance.posture(
      "a",
      segments[segments.length - 1]!.start,
    );
    const mouth: IAutoMovieVector3 = M.region(s, "a", s.body, "mouth", at);
    const goal: IHumanPosture.IGoal | undefined = posture.limbs.rightArm;
    const v = (p: IAutoMovieVector3 | undefined): string =>
      p === undefined
        ? "none"
        : `(${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)})`;
    const drinks: boolean = elevation <= 70 && shoulder.y - knuckle.y >= 0.05;
    // On a miss, what the law's own drinking reader reads for this very
    // posture and goal, so a reader that admits what is not shown is told
    // apart from a goal or posture the plan did not foresee.
    const reader: AutoMovieMotionHumanDrinkingArm.IArm | undefined =
      drinks || goal === undefined
        ? undefined
        : AutoMovieMotionHumanDrinkingArm.read(
            s.body,
            posture,
            "right",
            goal,
            false,
          );
    complaints.check(
      `${cell}: at the mouth (${at.toFixed(2)} s) the upper arm is raised ${elevation.toFixed(1)} deg from hanging and the elbow stands ${((shoulder.y - knuckle.y) * 1000).toFixed(0)} mm below the shoulder, at most 70 deg and at least 50 mm below expected (Murphy et al. 2011; provisional); shoulder ${v(shoulder)}, elbow ${v(knuckle)}, wrist ${v(hand)}, the goal's point ${v(goal?.point)}, rotation ${JSON.stringify(goal?.rotation ?? null)}, hint ${v(goal?.bend)}, reference ${JSON.stringify(goal?.reference ?? null)}; the drinking reader reads ${reader === undefined ? "nothing" : `${reader.elevation.toFixed(1)} deg and ${(reader.drop * 1000).toFixed(0)} mm`} on this posture and goal; neck and head ${JSON.stringify([posture.joints.neck, posture.joints.head])} against ${JSON.stringify([entered.joints.neck, entered.joints.head])} at the act's start, mouth ${v(mouth)}`,
      drinks,
    );
    const gap: number = Math.hypot(
      hand.x - mouth.x,
      hand.y - mouth.y,
      hand.z - mouth.z,
    );
    complaints.check(
      `${cell}: at the mouth (${at.toFixed(2)} s) the wrist is ${(gap * 1000).toFixed(0)} mm from the mouth, within a hand length (${(s.body.measure.hand * 1000).toFixed(0)} mm) expected`,
      gap <= s.body.measure.hand,
    );
  }

  /** The drink's least lean, read on the posture its search was given (the act's first second, the head not yet turned): the lean one step below must admit no arm. */
  function below(s: M.IStaged): string[] {
    const posture: IHumanPosture = s.film.performance.posture("a", 0);
    const place: ReturnType<typeof HumanTrunk.region> = HumanTrunk.region(
      s.body,
      posture,
      "mouth",
    );
    const hint: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
      s.body,
      posture,
      "right",
    );
    const effector: handToFace.IRow["effector"] =
      handToFace.ROWS.drink.effector;
    const found: AutoMovieMotionHumanTouchUpright.IFacing =
      AutoMovieMotionHumanTouchDrink.drinking(
        s.body,
        posture,
        "right",
        effector,
        place,
        hint,
      );
    if (found.lean === 0) return [];
    const lower: number = found.lean - AutoMovieMotionHumanTouchDrink.LEAN_STEP;
    return AutoMovieMotionHumanTouchDrink.admitted(
      s.body,
      posture,
      "right",
      effector,
      place,
      hint,
      lower,
    ) === undefined
      ? []
      : [
          `the search took a lean of ${found.lean} degrees, yet ${lower} admits a drinking arm too: admission is not monotone in the lean`,
        ];
  }
}
