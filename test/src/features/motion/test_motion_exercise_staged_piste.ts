import { createStageBladeProp } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieResolvedBone,
  IAutoMovieScheduleEntry,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanFoot,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanStagePiste,
  stageBladeFootwork,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";

/** Independent shot blocking and scripted results. */
const TAKES = [
  { kind: "foil", lead: "right", distance: 0.14, result: "first" },
  { kind: "epee", lead: "left", distance: 0.18, result: "both" },
  { kind: "sabre", lead: "right", distance: 0.2, result: "second" },
] as const;

/** The authored phase share appears independently of the floor marks. */
const CUE: number = 0.43;

/** Shared stage duration in seconds. */
const SECONDS: number = 1.4;

/**
 * A staged piste take reads one scripted result from the paired editing
 * cue while retaining real foot support and an inert prop on its actor.
 *
 * Scenarios:
 * 1. Stage three equipment silhouettes with varying first marks and
 *    leads, while actor and camera coordinate frames remain fixed.
 * 2. Each cast shares an independently timed editing cue and publishes
 *    its declared result without a collision or computed award.
 * 3. The single-result screenplay refuses a two-actor result.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the staged variants, physical display landmarks and result refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Places the public pair and samples both actors' displayed feet and hips through the inherited footwork. Reads the real fitted prop transformation and the resolved editing cue.
 * @evidence contracts/development/testing.md#independent-expectations The scripted mark distances and the assigned result are literal inputs. The independent cue is expected at 43 percent of an authored 1.4 seconds. The existing staged-footwork witness gives 5 mm sole, 8 mm travel and 1 mm held-grip tolerances.
 * @evidence contracts/development/testing.md#distinguishing-cases Both lead choices, three real inert silhouette instances and different scripted results distinguish contact, motion and edit clock. The denied case isolates the declared rule. Clearance is sampled only at listed steps and cue instants.
 * @evidence contracts/development/testing.md#execution-ownership Public in-memory placement and pose sampling on display geometry. No production viewer or native host is invoked.
 */
export function test_motion_exercise_staged_piste(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const complaints: motionComplaints.IGatherer = motionComplaints();
  for (const row of TAKES)
    try {
      const held = createStageBladeProp({
        kind: row.kind,
        id: "inert-stage-prop",
      });
      const grip: IAutoMovieVector3 = held.affordance("grip").frame.translation;
      const prop: IAutoMovieMotionHumanProp = HumanObject.prop(
        "inert-stage-prop",
        held,
        {
          at: {
            x: -0.8 - body.measure.shoulderHalfWidth,
            y: body.measure.waistHeight - grip.y,
            z: 0.6 * (body.measure.upperArm + body.measure.forearm),
          },
          yaw: 0,
        },
      );
      const take: HumanStagePiste.ITake = {
        anchor: "match",
        kind: row.kind,
        first: {
          chain: HumanChain.subject("a").pickUp({
            prop: prop.subject,
            handle: "grip",
            hand: "right",
          }),
          direction: "forward",
          distance: row.distance,
          lead: row.lead,
        },
        second: {
          chain: HumanChain.subject("b").stand({ seconds: 0.2, sway: 0 }),
          direction: "back",
          distance: 0.1,
          lead: "right",
        },
        duration: SECONDS,
        cue: CUE,
        result: row.result,
      };
      const placed: HumanStagePiste.IPlaced = HumanStagePiste.compose(take);
      const film: HumanPerformance = new HumanPerformance({
        seed: `studio-piste-${row.kind}`,
        laws: [stageBladeFootwork],
        performers: [
          {
            subject: "a",
            body,
            at: { x: -0.8, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
          {
            subject: "b",
            body,
            at: { x: 0.8, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        props: [prop],
        composition: placed.composition.node,
      });
      const a: IAutoMovieScheduleEntry = film.schedule.entries.find(
        (entry): boolean => entry.intent.anchor === "match.first",
      )!;
      const b: IAutoMovieScheduleEntry = film.schedule.entries.find(
        (entry): boolean => entry.intent.anchor === "match.second",
      )!;
      const announced: HumanStagePiste.IAnnouncement | undefined =
        placed.announced(film.schedule);
      complaints.check(
        `${row.kind}: publishes the scripted result on the shared cue`,
        announced?.result === row.result &&
          nclose(announced.seconds, a.start + CUE * SECONDS) &&
          nclose(a.start, b.start) &&
          nclose(a.end, b.end) &&
          film.hits().length === 0,
      );

      const rear: "left" | "right" = row.lead === "left" ? "right" : "left";
      const early: number = a.start + 0.27 * SECONDS;
      for (const [track, lead, support, travel] of [
        [a, row.lead, rear, row.distance],
        [b, "left", "right", -0.1],
      ] as const) {
        const foot = (
          side: "left" | "right",
          seconds: number,
        ): IAutoMovieVector3 => {
          const posed: IAutoMovieResolvedBone = film
            .bones(track.subject, seconds)
            .get(`${side}Foot`)!;
          return HumanFoot.point(body, side, "ball", {
            ankle: posed.worldPosition,
            rotation: posed.worldRotation,
          });
        };
        const hipsDelta: number =
          film.bones(track.subject, track.end).get("hips")!.worldPosition.z -
          film.bones(track.subject, track.start).get("hips")!.worldPosition.z;
        complaints.check(
          `${row.kind}/${track.subject}: first foot moves, support holds and pelvis follows the scripted mark`,
          Math.sign(travel) *
            (foot(lead, early).z - foot(lead, track.start).z) >
            0.02 &&
            Vector3.distance(
              foot(support, early),
              foot(support, track.start),
            ) <= 0.005 &&
            nclose(
              foot(lead, track.end).z - foot(lead, track.start).z,
              travel,
              0.008,
            ) &&
            Math.sign(travel) * hipsDelta > 0.04,
        );
      }

      const handGrip = (seconds: number): IAutoMovieVector3 => {
        const hand: IAutoMovieResolvedBone = film
          .bones("a", seconds)
          .get("rightHand")!;
        const pose = film.prop(prop.subject, seconds);
        return Quaternion.rotateVector(
          Quaternion.inverse(hand.worldRotation),
          Vector3.subtract(
            Vector3.add(
              pose.position,
              Quaternion.rotateVector(pose.rotation, grip),
            ),
            hand.worldPosition,
          ),
        );
      };
      complaints.check(
        `${row.kind}: holds the original inert grip through cue and settle`,
        announced !== undefined &&
          Vector3.distance(handGrip(a.start), handGrip(announced.seconds)) <=
            0.001 &&
          Vector3.distance(handGrip(a.start), handGrip(a.end)) <= 0.001,
      );

      if (row.kind === "foil") {
        try {
          HumanStagePiste.compose({ ...take, result: "both" });
          complaints.list.push("foil: accepted an unsupported double result");
        } catch (error) {
          if (!(error instanceof HumanRefusal) || error.axis !== "result")
            complaints.list.push(`foil: unexpected refusal ${String(error)}`);
        }
      }
    } catch (error) {
      complaints.list.push(`${row.kind}: ${String(error)}`);
    }
  complaints.assert("Staged piste takes");
}
