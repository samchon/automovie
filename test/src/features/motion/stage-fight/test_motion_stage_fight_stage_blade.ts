import { createStageBladeProp } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanStageBladeFootwork,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieScheduleEntry,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanObject, HumanPerformance } from "@automovie/motions";
import { HUMAN_LEXICON } from "@automovie/motions/internal";

import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Independent blocking marks and assertions for the sampled stage steps. */
interface ICase {
  /** The canonical body used by the performance. */
  body: motionHumanBody.Name;

  /** The authored stage shift. */
  params: IAutoMovieMotionHumanStageBladeFootwork.IParams;

  /** Foot expected to start travelling while the other holds. */
  first: "leftFoot" | "rightFoot";

  /** The separately authored full ankle translation in world metres. */
  travel: IAutoMovieVector3;

  /** Whether the travelling foot should visibly leave the floor. */
  lifts: boolean;
}

/**
 * The registered stage blade shift keeps the supporting foot and an attached
 * padded prop while publishing a separately placed prop cue.
 *
 * Scenarios:
 *
 * 1. In the fencing profile, the right foot starts a forward mark shift with
 *    visible clearance and a held foil keeps its named grip.
 * 2. In the kendo profile, the left foot crosses to a separate side mark near the
 *    floor. The prop cue falls separately from either settle.
 * 3. In the armoured profile, the trailing right foot starts the backward shift,
 *    both feet reach their return marks, and the omitted cue stays absent.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the tested directions, contact relationship, profile clearance and cue omission.
 * @evidence contracts/development/testing.md#behavioral-verification Places the actual blade law from the public lexicon, samples ankles from displayed FK, and reads a fitted prop grip and schedule event on the same film clock.
 * @evidence contracts/development/testing.md#independent-expectations Expected translations come from fixed authored marks. A four millimetre stationary-foot tolerance catches support drift, one centimetre separates visible lifts from a glide, and the named prop event is timed from the caller's duration and share. The grip is required to stay within one millimetre of its actual closure coordinates.
 * @evidence contracts/development/testing.md#distinguishing-cases Uses two proportional bodies, forward and lateral and backward directions, deliberate glide and raised travel, held and empty hands, cues present and absent, and out-of-order samples. The checks cover sample landmarks, not equipment scoring or swept clearance.
 * @evidence contracts/development/testing.md#execution-ownership The in-memory unit uses the public performance scheduler, actual archetype and canonical body, with no native host or rendered capture.
 */
export function test_motion_stage_fight_stage_blade(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  const cases: readonly ICase[] = [
    {
      body: "m-average",
      params: {
        style: "fencing",
        direction: "forward",
        lead: "right",
        distance: 0.16,
        duration: 1.2,
        propCue: 0.34,
      },
      first: "rightFoot",
      travel: { x: 0, y: 0, z: 0.16 },
      lifts: true,
    },
    {
      body: "f-small",
      params: {
        style: "kendo",
        direction: "left",
        lead: "left",
        distance: 0.15,
        duration: 1.5,
        propCue: 0.57,
      },
      first: "leftFoot",
      travel: { x: 0.15, y: 0, z: 0 },
      lifts: false,
    },
    {
      body: "m-average",
      params: {
        style: "armoured",
        direction: "back",
        lead: "left",
        distance: 0.16,
        duration: 1.7,
      },
      first: "rightFoot",
      travel: { x: 0, y: 0, z: -0.16 },
      lifts: true,
    },
  ];

  for (const sample of cases) {
    try {
      const style: string = sample.params.style;
      const body: IAutoMovieMotionHumanBody = motionHumanBody(sample.body);
      const subject: string = "performer";
      const anchor: string = "marked-shift";
      const paddedFoil = createStageBladeProp({
        kind: "foil",
        id: "inert-foil",
      });
      const grip: IAutoMovieVector3 =
        paddedFoil.affordance("grip").frame.translation;
      const prop: IAutoMovieMotionHumanProp = HumanObject.prop(
        "inert-foil",
        paddedFoil,
        {
          at: {
            x: -body.measure.shoulderHalfWidth,
            y: body.measure.waistHeight - grip.y,
            z: 0.6 * (body.measure.upperArm + body.measure.forearm),
          },
          yaw: 0,
        },
      );
      const performer: IAutoMovieMotionHumanChain = HumanChain.subject(subject);
      const hasProp: boolean = sample.params.style === "fencing";
      const entry: IAutoMovieMotionHumanChain = hasProp
        ? performer.pickUp({
            prop: prop.subject,
            handle: "grip",
            hand: "right",
          })
        : performer.stand({ hold: 0.3 });
      const performance: IAutoMovieMotionHumanPerformance =
        new HumanPerformance({
          seed: `stage-blade-${style}`,
          laws: HUMAN_LEXICON.blade,
          performers: [
            {
              subject,
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          props: hasProp ? [prop] : [],
          composition: entry.registered(
            "stageBladeFootwork",
            sample.params,
            anchor,
          ).node,
        });
      const stage: IAutoMovieScheduleEntry | undefined =
        performance.schedule.entries.find(
          (span: IAutoMovieScheduleEntry): boolean =>
            span.intent.anchor === anchor,
        );
      if (stage === undefined)
        throw new Error(`Missing the ${style} stage shift`);

      const first: ICase["first"] = sample.first;
      const other: ICase["first"] =
        first === "leftFoot" ? "rightFoot" : "leftFoot";
      const ankle = (
        foot: ICase["first"],
        seconds: number,
      ): IAutoMovieVector3 =>
        performance.bones(subject, seconds).get(foot)!.worldPosition;
      const early: number = stage.start + 0.27 * sample.params.duration!;
      const drawnEarly: IAutoMovieVector3 = ankle(first, early);
      const from: IAutoMovieVector3 = ankle(first, stage.start);
      const firstTravel: IAutoMovieVector3 = Vector3.subtract(drawnEarly, from);
      checks.check(
        `${style} moves the leading foot toward the mark while the other foot holds`,
        Vector3.dot(firstTravel, sample.travel) /
          Vector3.length(sample.travel) >
          0.03 && vclose(ankle(other, early), ankle(other, stage.start), 0.004),
      );
      checks.check(
        `${style} has the requested floor relationship`,
        sample.lifts ? firstTravel.y >= 0.01 : nclose(firstTravel.y, 0, 0.006),
      );
      for (const foot of [first, other])
        checks.check(
          `${style} ${foot} settles on the authored mark`,
          vclose(
            ankle(foot, stage.end),
            Vector3.add(ankle(foot, stage.start), sample.travel),
            0.008,
          ),
        );
      checks.check(
        `${style} poses the same ankle after seeking backwards`,
        vclose(ankle(first, early), drawnEarly),
      );

      const cue: number | undefined = stage.events?.find(
        (event) => event.name === "propCue",
      )?.seconds;
      const share: number | undefined = sample.params.propCue;
      checks.check(
        `${style} publishes only the authored editing cue`,
        share === undefined
          ? cue === undefined
          : cue !== undefined &&
              nclose(cue, stage.start + sample.params.duration! * share) &&
              stage.events!.every(
                (event) =>
                  !event.name.endsWith("Settle") || !nclose(event.seconds, cue),
              ),
      );
      checks.check(
        `${style} reports no physical hit from the visual staging cue`,
        stage.contact === undefined && performance.hits().length === 0,
      );

      if (hasProp) {
        const handleInHand = (seconds: number): IAutoMovieVector3 => {
          const hand: IAutoMovieResolvedBone = performance
            .bones(subject, seconds)
            .get("rightHand")!;
          const frame: IAutoMovieRigidTransform = performance.prop(
            prop.subject,
            seconds,
          );
          const handle: IAutoMovieVector3 = Vector3.add(
            frame.position,
            Quaternion.rotateVector(frame.rotation, grip),
          );
          return Quaternion.rotateVector(
            Quaternion.inverse(hand.worldRotation),
            Vector3.subtract(handle, hand.worldPosition),
          );
        };
        checks.check(
          "the named padded foil grip stays on its holding hand during the stage shift",
          vclose(handleInHand(stage.start), handleInHand(cue!), 0.001) &&
            vclose(handleInHand(stage.end), handleInHand(cue!), 0.001) &&
            Vector3.distance(
              performance.prop(prop.subject, stage.start).position,
              performance.prop(prop.subject, stage.end).position,
            ) > 0.1,
        );
      }
    } catch (error: unknown) {
      checks.check(`${String(sample)}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.assert("stage fight stage blade");
}
