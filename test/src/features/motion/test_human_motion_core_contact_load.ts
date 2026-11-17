import { resolveAutoMovieCenterOfMass } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditMotion as IAutoMovieMotionHumanAuditMotionType,
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditBalance,
  AutoMovieMotionHumanAuditMotion,
  AutoMovieMotionHumanAuditStatics,
  HUMAN_LEXICON,
  HumanBase,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionAuditMoved } from "../internal/motionAuditMoved";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanLaw } from "../internal/motionHumanLaw";
import { motionHumanStance } from "../internal/motionHumanStance";

/**
 * Contact windows on any body region with a load share (#3425): a knee that
 * bears joins the base of support, declared loads must balance a still
 * body, and a bearing lower leg reads as kneeling.
 *
 * Scenarios:
 * 1. `kneelSit` on the average man, its kneeling span given a `bear` window
 *    on each lower leg at the knee (`kneeLeft`, `kneeRight`), from the first
 *    instant both knee joints lie within 0.06 statures of the floor (the
 *    kneeling-pose test's reading of a knee on the floor) to the action's
 *    end: the balance audit reads that instant, its base holds the knees, and
 *    the margin there is positive (a body sat back on its knees is
 *    balanced) and larger than the margin the feet alone give at that
 *    instant, which is what the audit reads without the knee windows.
 * 2. Statics, on the average man and the small woman in their quiet stance
 *    held still for a second with both feet planted: loads split by the
 *    lever rule (each sole's share the other sole's distance from the
 *    centre of mass along the line between them, over the line's length)
 *    leave the centre of mass within 2 % of stature (#3415's acceptance) of
 *    the load-weighted region of the soles; the whole weight declared on the
 *    left foot alone, the right still planted, leaves it beyond the bound,
 *    so the check can fail.
 * 3. `HumanBase.after` reads open `bear` supports on a lower leg as
 *    kneeling, and the same supports on a forearm (a bear that is not a
 *    knee) as standing.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the balance and statics audits on a performed kneel and on a held stance, and the base reader on declared supports; a knee that never joins the base, a load centre weighted wrongly, or a bearing knee read as standing fails.
 * @evidence contracts/development/testing.md#independent-expectations The lever rule of a body on two supports, the campaign's 2 % of stature, the kneeling-pose test's 0.06 statures for a knee on the floor; nothing is read from the audits' own output as an expectation.
 * @evidence contracts/development/testing.md#distinguishing-cases With and without knee windows, a right and a wrong split, two statures, a knee and a forearm bear; the slip of a knee through a cut belongs to the re-plant pass's own test once `HumanSegment` re-solves bearing regions.
 * @evidence contracts/development/testing.md#execution-ownership In memory on prepared bodies and one short performance, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios with their bounds and their bases.
 */
export function test_human_motion_core_contact_load(): void {
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  const findings: string[] = [];

  // 1. A kneel whose knees bear joins them to the base.
  const man: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "contact-load",
    laws: [...HUMAN_LEXICON.pose!],
    performers: [
      {
        subject: "a",
        body: man,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a")
      .stand({ seconds: 0.3 })
      .registered("kneelSit").node,
  });
  const film: motionHumanLaw.IFilm = motionHumanLaw.film(performance);
  const kneel: IAutoMovieMotionHumanSegment = performance.segments("a")[1]!;
  const floor: number = 0.06 * man.measure.stature;
  let down: number | null = null;
  for (let t: number = kneel.entryTime; t <= kneel.end; t += 1 / 24) {
    const bones: Bones = film.bones("a", t);
    if (
      bones.get("leftLowerLeg")!.worldPosition.y <= floor &&
      bones.get("rightLowerLeg")!.worldPosition.y <= floor
    ) {
      down = t;
      break;
    }
  }
  if (down === null) findings.push("kneelSit: the knees never come down");
  else {
    const share: number = (down - kneel.start) / kneel.plan.duration;
    const knee = (
      part: IAutoMovieMotionHumanContactWindow["part"],
      region: "kneeLeft" | "kneeRight",
    ): IAutoMovieMotionHumanContactWindow => ({
      part,
      region,
      kind: "bear",
      from: share,
      to: 1,
      support: { kind: "ground" },
    });
    const withKnees: IAutoMovieMotionHumanAuditMotionType = {
      duration: film.duration,
      bones: film.bones,
      segments: (
        subject: string,
      ): IAutoMovieMotionHumanAuditMotionType.ISpan[] =>
        film.segments(subject).map(
          (
            s: IAutoMovieMotionHumanAuditMotionType.ISpan,
            i: number,
          ): IAutoMovieMotionHumanAuditMotionType.ISpan =>
            i === 1
              ? {
                  ...s,
                  plan: {
                    duration: s.plan.duration,
                    contacts: [
                      ...s.plan.contacts,
                      knee("leftLowerLeg", "kneeLeft"),
                      knee("rightLowerLeg", "kneeRight"),
                    ],
                  },
                }
              : s,
        ),
    };
    const at: number = (down + kneel.end) / 2;
    const model: IAutoMovieResolveCenterOfMass.IModel =
      resolveAutoMovieCenterOfMass(man.skeleton, man.profile);
    const read: boolean = AutoMovieMotionHumanAuditBalance.standing(
      AutoMovieMotionHumanAuditMotion.windows(withKnees, "a"),
      at,
    );
    const margin: number = AutoMovieMotionHumanAuditBalance.margin(
      withKnees,
      "a",
      man,
      model,
      at,
    );
    if (!read)
      findings.push(
        `kneelSit with knee windows: the instant ${at.toFixed(2)} s is not read`,
      );
    if (!(margin > 0))
      findings.push(
        `kneelSit with knee windows: margin ${(1000 * margin).toFixed(1)} mm at ${at.toFixed(2)} s`,
      );
    const feet: number = AutoMovieMotionHumanAuditBalance.margin(
      film,
      "a",
      man,
      model,
      at,
    );
    if (!(margin > feet))
      findings.push(
        `kneelSit: the knees do not widen the base, margin ${(1000 * margin).toFixed(1)} mm with them and ${(1000 * feet).toFixed(1)} mm on the feet alone`,
      );
  }

  // 2. Statics: lever-rule loads balance a held stance; a wrong split does not.
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const stance: Bones = motionHumanStance(body);
    const model: IAutoMovieResolveCenterOfMass.IModel =
      resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
    const c: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
      model,
      stance,
    );
    const foot = (
      part: "leftFoot" | "rightFoot",
      load: number,
    ): IAutoMovieMotionHumanContactWindow => ({
      part,
      kind: "plant",
      from: 0,
      to: 1,
      support: { kind: "ground" },
      load,
    });
    const sole = (part: "leftFoot" | "rightFoot"): IAutoMovieVector3 =>
      AutoMovieMotionHumanAuditStatics.point(body, stance, foot(part, 0));
    const l: IAutoMovieVector3 = sole("leftFoot");
    const r: IAutoMovieVector3 = sole("rightFoot");
    const length: number = Math.hypot(l.x - r.x, l.z - r.z);
    const along: number =
      ((c.x - r.x) * (l.x - r.x) + (c.z - r.z) * (l.z - r.z)) / length;
    const left: number = along / length;
    const held = (a: number, b: number): IAutoMovieMotionHumanAuditMotionType =>
      motionAuditMoved(
        stance,
        1,
        (): IAutoMovieVector3 => ({ x: 0, y: 0, z: 0 }),
        [
          {
            name: "stand",
            start: 0,
            entryTime: 0,
            end: 1,
            plan: {
              duration: 1,
              contacts: [foot("leftFoot", a), foot("rightFoot", b)],
            },
          },
        ],
      );
    const bound: number =
      AutoMovieMotionHumanAuditStatics.SHARE * body.measure.stature;
    const right: number = AutoMovieMotionHumanAuditStatics.measure(
      held(left, 1 - left),
      "a",
      body,
    ).value;
    const wrong: number = AutoMovieMotionHumanAuditStatics.measure(
      held(1, 0),
      "a",
      body,
    ).value;
    if (!(right <= bound))
      findings.push(
        `${name}: lever-rule loads (${left.toFixed(3)} left) leave ${(1000 * right).toFixed(1)} mm, bound ${(1000 * bound).toFixed(1)} mm`,
      );
    if (!(wrong > bound))
      findings.push(
        `${name}: a 1 / 0 split reads ${(1000 * wrong).toFixed(1)} mm, within the bound`,
      );
  }

  // 3. A bearing lower leg is kneeling; a bearing forearm is not.
  const supports = (
    part: IAutoMovieMotionHumanContactWindow["part"],
  ): IAutoMovieMotionHumanEntryState.ISupport[] => [
    { part, kind: "bear", support: { kind: "ground" } },
  ];
  const kneeling: IAutoMovieMotionHumanBase = HumanBase.after({
    declared: undefined,
    entered: { kind: "standing" },
    supports: supports("leftLowerLeg"),
    share: 0.5,
  });
  const leaning: IAutoMovieMotionHumanBase = HumanBase.after({
    declared: undefined,
    entered: { kind: "standing" },
    supports: supports("leftLowerArm"),
    share: 0.5,
  });
  if (kneeling.kind !== "kneeling")
    findings.push(`a bearing lower leg reads as ${kneeling.kind}`);
  if (leaning.kind !== "standing")
    findings.push(`a bearing forearm reads as ${leaning.kind}`);

  TestValidator.predicate(
    `contact windows with load: ${findings.join("; ") || "all hold"}`,
    findings.length === 0,
  );
}
