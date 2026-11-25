import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanTravelCar,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanTrunk } from "../everyday/HumanTrunk";
import { sit } from "../everyday/sit";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPreparedPlayback } from "../perform/HumanPreparedPlayback";
import { HumanFrame } from "../posture/HumanFrame";
import { carryHumanPosture } from "../posture/carryHumanPosture";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";

/** The record of `IGetInDuckNeed`'s site. */
type IGetInDuckNeed = { at: number; degrees: number };

/** The record of `IGetInNeedsItem`'s site. */
type IGetInNeedsItem = { at: number; degrees: number };

/**
 * Getting into a car through its door: the person stands in the doorway with
 * the back to the seat, sits down onto it sideways with the legs still outside,
 * then swings round on the seat to face the way the seat faces, and the head is
 * ducked under the door's top throughout. Register `HumanTravelCar.getIn` to
 * use it.
 *
 * People get into a car seat by sitting first and bringing the legs in after,
 * and lower the head under the roof's edge as they go (the "sit-then-swing"
 * entry of the ergonomics of vehicle ingress; Giacomin and Quattrocolo 1997,
 * Appl Ergon 28:261, describe it; the timing and the angles here are
 * provisional, not read from them). The sitting is `sit` onto the seat turned
 * to face out of the door; the swing turns the seated body about the seat's
 * middle by the minimum-jerk profile (Flash and Hogan 1985) over `SWING`
 * seconds. The duck is a forward flexion of the spine added wherever the crown,
 * inside the door's plane or within `HEAD` of it, would come nearer than
 * `CLEAR` to the opening's top; it is solved at `SAMPLES` instants at plan time
 * and grows and fades over `LEAD` seconds around each, so the head goes down
 * before it reaches the edge.
 *
 * Refused: an opening narrower than the body's chest (`reach` on `aperture`,
 * with the width needed), and one so low that even `DUCK` degrees of flexion
 * leave the crown above its top (`reach` on `aperture`, with the height
 * needed). First pass: the legs are carried round with the body and are not
 * lifted over the sill, and the door's leaf is taken as open.
 *
 * The crown is read by one reader prepared for the entry
 * (`HumanTrunk.preparePoint`). Each sampled instant's search resolves the
 * sitting posture there once and bisects the flexion on one forward-kinematics
 * reader, each trial changing the spine's flexion alone; a refusal reports the
 * excess the full duck leaves.
 */
export namespace HumanTravelCar {
  /**
   * Seconds the seated body takes to swing round to face the seat's way
   * (provisional).
   */
  export const SWING: number = 1.2;

  /**
   * The least gap kept between the crown and the opening's top, metres
   * (provisional: a hair's thickness and a little more).
   */
  export const CLEAR: number = 0.03;

  /**
   * How far outside the door's plane the crown is still ducked, metres
   * (provisional: half a head's depth, the back of a head facing out of the
   * door).
   */
  export const HEAD: number = 0.1;

  /**
   * The most the spine flexes forward to duck, degrees (provisional, inside the
   * spine's 80 of flexion).
   */
  export const DUCK: number = 60;

  /**
   * Seconds before and after an instant that needs a duck over which the duck
   * grows and fades (provisional).
   */
  export const LEAD: number = 0.4;

  /**
   * Instants of the entry at which the duck is solved; each holds its duck
   * until the next, so the crown keeps `CLEAR` between them up to how far it
   * moves in one interval.
   */
  export const SAMPLES: number = 48;

  /**
   * Get into a car seat through its door: sit sideways, swing in, the head
   * ducked under the opening's top.
   */
  export const getIn: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanTravelCar.IParams> =
    {
      name: "getIn",
      interrupts: {},
      yields: ["leftHand", "rightHand", "leftArm", "rightArm"],
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTravelCar.IParams>,
      ): IAutoMovieMotionHumanActionPlan => {
        const { seat, through }: IAutoMovieMotionHumanTravelCar.IParams =
          context.params;
        const body: IAutoMovieMotionHumanBody = context.body;
        if (through.width < body.measure.chestBreadth)
          throw new HumanRefusal({
            kind: "reach",
            axis: "aperture",
            value: through.width,
            feasible: {
              kind: "range",
              minimum: body.measure.chestBreadth,
              maximum: null,
              unit: "m",
            },
            reason: `the door's opening is ${through.width.toFixed(3)} m wide, narrower than the chest's ${body.measure.chestBreadth.toFixed(3)} m`,
            fix: "get in by a wider door, or as a smaller body",
          });

        // Out of the door: level, across the opening's width, away from the seat.
        const depth: number = seat.depth ?? 0.45;
        const facing: IAutoMovieVector3 = HumanFrame.point(
          { origin: { x: 0, y: 0, z: 0 }, yaw: seat.yaw },
          { x: 0, y: 0, z: 1 },
        );
        const centre: IAutoMovieVector3 = Vector3.subtract(
          seat.at,
          Vector3.scale(facing, depth / 2),
        );
        let out: IAutoMovieVector3 = {
          x: through.across.z,
          y: 0,
          z: -through.across.x,
        };
        if (
          (centre.x - through.at.x) * out.x +
            (centre.z - through.at.z) * out.z >
          0
        )
          out = Vector3.scale(out, -1);
        const outward: number = (Math.atan2(out.x, out.z) * 180) / Math.PI;

        // Sit down sideways, facing out of the door.
        const aside: IAutoMovieMotionHumanSeated.ISeat = {
          ...seat,
          at: {
            ...Vector3.add(centre, Vector3.scale(out, depth / 2)),
            y: seat.at.y,
          },
          yaw: outward,
          depth,
        };
        const down: IAutoMovieMotionHumanActionPlan = sit.plan({
          ...context,
          params: {
            seat: aside,
            ...(context.params.hold === undefined
              ? {}
              : { hold: context.params.hold }),
          },
        });
        const sat: number = down.duration;
        const duration: number = sat + SWING;
        const end: IAutoMovieMotionHumanPosture = down.posture(sat);
        const turn: number = ((((seat.yaw - outward) % 360) + 540) % 360) - 180;
        const pivot: IAutoMovieVector3 = { ...centre, y: seat.at.y };
        const seatedFrame: IAutoMovieRigidTransform = {
          position: pivot,
          rotation: HumanFrame.turn(0),
        };
        /** Move the actual seated endpoint around the fixed seat pivot. */
        const swung = (u: number): IAutoMovieMotionHumanPosture =>
          carryHumanPosture(end, seatedFrame, {
            position: pivot,
            rotation: HumanFrame.turn(turn * minimumJerk.share(Math.min(1, u))),
          });
        const undocked: IAutoMovieMotionHumanActionPlan["posture"] = (
          t: number,
          channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
          resolution?: Parameters<
            IAutoMovieMotionHumanActionPlan["posture"]
          >[2],
          projection?: Parameters<
            IAutoMovieMotionHumanActionPlan["posture"]
          >[3],
        ): IAutoMovieMotionHumanPosture =>
          t <= sat
            ? down.posture(t, channels, resolution, projection)
            : swung((t - sat) / SWING);

        // The duck each sampled instant needs, by bisection on the spine's added flexion.
        const top: number = through.at.y + through.height - CLEAR;
        const ducked = (
          posture: IAutoMovieMotionHumanPosture,
          degrees: number,
        ): IAutoMovieMotionHumanPosture => {
          const spine: readonly [number, number, number] = posture.joints
            .spine ?? [0, 0, 0];
          return degrees === 0
            ? posture
            : {
                ...posture,
                joints: {
                  ...posture.joints,
                  spine: [spine[0] + degrees, spine[1], spine[2]],
                },
              };
        };
        const crownOf: ReturnType<typeof HumanTrunk.preparePoint> =
          HumanTrunk.preparePoint(body, "crown");
        const over = (
          posture: IAutoMovieMotionHumanPosture,
          resolution: ReturnType<typeof prepareHumanPoseResolution>,
        ): number => {
          const crown: IAutoMovieVector3 = crownOf(posture, resolution);
          const beyond: number =
            (crown.x - through.at.x) * out.x + (crown.z - through.at.z) * out.z;
          return beyond > HEAD ? -Infinity : crown.y - top;
        };
        const needs: IGetInNeedsItem[] = [];
        for (let k: number = 0; k <= SAMPLES; ++k) {
          const t: number = (k / SAMPLES) * duration;
          const resolution: ReturnType<typeof prepareHumanPoseResolution> =
            prepareHumanPoseResolution();
          const posture: IAutoMovieMotionHumanPosture = undocked(
            t,
            undefined,
            resolution,
          );
          if (!(over(posture, resolution) > 0)) continue;

          // This sample's positive trials change only spine flexion. The raw
          // input is private to this synchronous search and never returned.
          const spine: readonly [number, number, number] = posture.joints
            .spine ?? [0, 0, 0];
          const angles: [number, number, number] = [
            spine[0],
            spine[1],
            spine[2],
          ];
          const trial: IAutoMovieMotionHumanPosture = {
            ...posture,
            joints: { ...posture.joints, spine: angles },
          };
          const overAt: (degrees: number) => number = (
            degrees: number,
          ): number => {
            angles[0] = spine[0] + degrees;
            return over(trial, resolution);
          };
          const excess: number = overAt(DUCK);
          if (excess > 0)
            throw new HumanRefusal({
              kind: "reach",
              axis: "aperture",
              value: through.height,
              feasible: {
                kind: "range",
                minimum: through.height + excess,
                maximum: null,
                unit: "m",
              },
              reason: `the door's opening is ${through.height.toFixed(3)} m high, and the crown stays ${(excess * 1000).toFixed(0)} mm above its top even ducked ${DUCK} degrees at ${t.toFixed(2)} s`,
              fix: "get in by a higher door, or into a lower seat",
            });
          let low: number = 0;
          let high: number = DUCK;
          for (let i: number = 0; i < 16; ++i) {
            const middle: number = (low + high) / 2;
            if (overAt(middle) > 0) low = middle;
            else high = middle;
          }
          needs.push({ at: t, degrees: high });
        }
        // A duck is held in full over the interval on either side of its instant and grows and fades over `LEAD` beyond it.
        const spacing: number = duration / SAMPLES;
        const radius: number = LEAD + spacing;
        const duck = (t: number): number => {
          let lo: number = 0;
          let hi: number = needs.length;
          while (lo < hi) {
            const mid: number = Math.floor((lo + hi) / 2);
            if (t - needs[mid]!.at > radius) lo = mid + 1;
            else hi = mid;
          }
          let most: number = 0;
          for (let i: number = lo; i < needs.length; i++) {
            const need: IGetInDuckNeed = needs[i]!;
            if (need.at - t > radius) break;
            most = Math.max(
              most,
              need.degrees *
                minimumJerk.share(
                  Math.min(
                    1,
                    Math.max(
                      0,
                      (LEAD + spacing - Math.abs(t - need.at)) / LEAD,
                    ),
                  ),
                ),
            );
          }
          return most;
        };

        // The sitting's events and contacts on the longer clock, and the seat borne through the swing.
        const share = (was: number): number => (was * sat) / duration;
        const events: IAutoMovieMotionEvent[] = [
          ...down.events.map(
            (e: IAutoMovieMotionEvent): IAutoMovieMotionEvent => ({
              ...e,
              share: share(e.share),
            }),
          ),
          { name: "swung", share: 1 },
        ];
        const contacts: IAutoMovieMotionHumanContactWindow[] =
          down.contacts.map(
            (
              c: IAutoMovieMotionHumanContactWindow,
            ): IAutoMovieMotionHumanContactWindow =>
              c.part === "seat" && c.to >= 1 - 1e-9
                ? { ...c, from: share(c.from), to: 1 }
                : { ...c, from: share(c.from), to: share(c.to) },
          );
        const plan: IAutoMovieMotionHumanActionPlan = {
          duration,
          events,
          contacts,
          ...(down.contact === undefined ? {} : { contact: down.contact }),
          base: { kind: "seated", seat },
          posture: (
            t: number,
            channels?: Parameters<
              IAutoMovieMotionHumanActionPlan["posture"]
            >[1],
            resolution?: Parameters<
              IAutoMovieMotionHumanActionPlan["posture"]
            >[2],
            projection?: Parameters<
              IAutoMovieMotionHumanActionPlan["posture"]
            >[3],
          ): IAutoMovieMotionHumanPosture => {
            const at: number = Math.min(duration, Math.max(0, t));
            return ducked(
              undocked(at, channels, resolution, projection),
              duck(at),
            );
          },
        };
        HumanPreparedPlayback.attach(plan, body, {
          mode: "posture",
          phases: [
            {
              from: sat,
              to: duration,
              sample: (t: number): HumanPreparedPlayback.ISample | undefined =>
                t > sat
                  ? { posture: ducked(swung((t - sat) / SWING), duck(t)) }
                  : undefined,
            },
          ],
        });
        return plan;
      },
    };
}
