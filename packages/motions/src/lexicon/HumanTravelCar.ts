import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanTrunk } from "../everyday/HumanTrunk";
import type { seated } from "../everyday/seated";
import { sit } from "../everyday/sit";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { HumanObstacle } from "../perform/HumanObstacle";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { carryHumanPosture } from "../posture/carryHumanPosture";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";

/**
 * Getting into a car through its door: the person stands in the doorway
 * with the back to the seat, sits down onto it sideways with the legs
 * still outside, then swings round on the seat to face the way the seat
 * faces, and the head is ducked under the door's top throughout. Register
 * `HumanTravelCar.getIn` to use it.
 *
 * People get into a car seat by sitting first and bringing the legs in
 * after, and lower the head under the roof's edge as they go (the
 * "sit-then-swing" entry of the ergonomics of vehicle ingress; Giacomin
 * and Quattrocolo 1997, Appl Ergon 28:261, describe it; the timing and the
 * angles here are provisional, not read from them). The sitting is `sit`
 * onto the seat turned to face out of the door; the swing turns the seated
 * body about the seat's middle by the minimum-jerk profile (Flash and Hogan
 * 1985) over `SWING` seconds. The duck is a forward flexion of the spine
 * added wherever the crown, inside the door's plane or within `HEAD` of it,
 * would come nearer than `CLEAR` to the opening's top; it is solved at
 * `SAMPLES` instants at plan time and grows and fades over `LEAD` seconds
 * around each, so the head goes down before it reaches the edge.
 *
 * Refused: an opening narrower than the body's chest (`reach` on
 * `aperture`, with the width needed), and one so low that even `DUCK`
 * degrees of flexion leave the crown above its top (`reach` on
 * `aperture`, with the height needed). First pass: the legs are carried
 * round with the body and are not lifted over the sill, and the door's leaf
 * is taken as open.
 *
 * Each sampled headroom search owns a lazy exact-FK workspace across that
 * sample's flexion bisection. The workspace and posed readings end with the
 * search; refusal diagnostics reuse its measured maximum-duck excess.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the entry phases, sources, duck search, refusals and first-pass limits, together with synchronous sample-workspace lifetime and exact diagnostic reuse without a measured speedup claim.
 * @evidence contracts/development/design.md#principled-representation A law record over `sit`: the seat and the opening are the affordances the car declares (`HumanObject.seat`, `HumanObstacle.apertures`).
 * @evidence contracts/development/design.md#minimal-and-owned-surface The law, its parameters and its named constants.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No car is special-cased; the headroom is the opening's own and the duck is solved against it for each body.
 */
export namespace HumanTravelCar {
  /**
   * The existing seat and doorway affordances used by the entry, together
   * with an optional seated hold forwarded to the sitting law.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Members identify the owning seat/aperture geometry and the optional hold in seconds; the namespace states entry behavior and refusals.
   * @evidence contracts/development/design.md#principled-representation Reuses seated.ISeat and HumanObstacle.IAperture for their existing world geometry, plus optional seconds forwarded to sit rather than a second timing representation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Exactly the three inputs getIn.plan reads; seat placement and aperture geometry retain their existing owners and runtime admission.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No car, body dimensions or inferred doorway are embedded; the existing sitting and headroom checks own validity and the optional hold keeps sit's default.
   */
  export interface IParams {
    /** The seat sat on, as `HumanObject.seat` reads it from the car. */
    seat: seated.ISeat;

    /** The door's opening, as `HumanObstacle.apertures` reads it from the car. */
    through: HumanObstacle.IAperture;

    /** Seated hold forwarded to sit, seconds; sit's own when absent. */
    seconds?: number;
  }

  /** Seconds the seated body takes to swing round to face the seat's way (provisional). */
  export const SWING: number = 1.2;

  /** The least gap kept between the crown and the opening's top, metres (provisional: a hair's thickness and a little more). */
  export const CLEAR: number = 0.03;

  /** How far outside the door's plane the crown is still ducked, metres (provisional: half a head's depth, the back of a head facing out of the door). */
  export const HEAD: number = 0.1;

  /** The most the spine flexes forward to duck, degrees (provisional, inside the spine's 80 of flexion). */
  export const DUCK: number = 60;

  /** Seconds before and after an instant that needs a duck over which the duck grows and fades (provisional). */
  export const LEAD: number = 0.4;

  /** Instants of the entry at which the duck is solved; each holds its duck until the next, so the crown keeps `CLEAR` between them up to how far it moves in one interval. */
  export const SAMPLES: number = 48;

  /**
   * Get into a car seat through its door. Each headroom sample owns a lazy
   * exact-FK workspace across its unchanged flexion bisection; neither that
   * reader nor a posed result enters the returned time evaluator. Refusal
   * diagnostics reuse the measured excess of the same maximum-duck trial.
   */
  export const getIn: IHumanActionLaw<IParams> = {
    name: "getIn",
    interrupts: {},
    yields: ["leftHand", "rightHand", "leftArm", "rightArm"],
    plan: (context: IHumanActionContext<IParams>): IHumanActionPlan => {
      const { seat, through }: IParams = context.params;
      const body: IHumanBody = context.body;
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
        (centre.x - through.at.x) * out.x + (centre.z - through.at.z) * out.z >
        0
      )
        out = Vector3.scale(out, -1);
      const outward: number = (Math.atan2(out.x, out.z) * 180) / Math.PI;

      // Sit down sideways, facing out of the door.
      const aside: seated.ISeat = {
        ...seat,
        at: {
          ...Vector3.add(centre, Vector3.scale(out, depth / 2)),
          y: seat.at.y,
        },
        yaw: outward,
        depth,
      };
      const down: IHumanActionPlan = sit.plan({
        ...context,
        params: {
          seat: aside,
          ...(context.params.seconds === undefined
            ? {}
            : { seconds: context.params.seconds }),
        },
      });
      const sat: number = down.duration;
      const duration: number = sat + SWING;
      const end: IHumanPosture = down.posture(sat);
      const turn: number = ((((seat.yaw - outward) % 360) + 540) % 360) - 180;
      const pivot: IAutoMovieVector3 = { ...centre, y: seat.at.y };
      const swung = (u: number): IHumanPosture =>
        carryHumanPosture(
          end,
          { position: pivot, rotation: HumanFrame.turn(0) },
          {
            position: pivot,
            rotation: HumanFrame.turn(turn * minimumJerk(Math.min(1, u)).s),
          },
        );
      const undocked = (t: number): IHumanPosture =>
        t <= sat ? down.posture(t) : swung((t - sat) / SWING);

      // The duck each sampled instant needs, by bisection on the spine's added flexion.
      const top: number = through.at.y + through.height - CLEAR;
      const ducked = (
        posture: IHumanPosture,
        degrees: number,
      ): IHumanPosture => {
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
      const over = (
        posture: IHumanPosture,
        resolution: ReturnType<typeof prepareHumanPoseResolution>,
      ): number => {
        const crown: IAutoMovieVector3 = HumanTrunk.region(
          body,
          posture,
          "crown",
          resolution,
        ).point;
        const beyond: number =
          (crown.x - through.at.x) * out.x + (crown.z - through.at.z) * out.z;
        return beyond > HEAD ? -Infinity : crown.y - top;
      };
      const needs: { at: number; degrees: number }[] = [];
      for (let k: number = 0; k <= SAMPLES; ++k) {
        const t: number = (k / SAMPLES) * duration;
        const posture: IHumanPosture = undocked(t);
        const resolution: ReturnType<typeof prepareHumanPoseResolution> =
          prepareHumanPoseResolution();
        if (!(over(posture, resolution) > 0)) continue;
        const excess: number = over(ducked(posture, DUCK), resolution);
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
          if (over(ducked(posture, middle), resolution) > 0) low = middle;
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
          const need: { at: number; degrees: number } = needs[i]!;
          if (need.at - t > radius) break;
          most = Math.max(
            most,
            need.degrees *
              minimumJerk(
                Math.min(
                  1,
                  Math.max(0, (LEAD + spacing - Math.abs(t - need.at)) / LEAD),
                ),
              ).s,
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
      const contacts: IHumanContactWindow[] = down.contacts.map(
        (c: IHumanContactWindow): IHumanContactWindow =>
          c.part === "seat" && c.to >= 1 - 1e-9
            ? { ...c, from: share(c.from), to: 1 }
            : { ...c, from: share(c.from), to: share(c.to) },
      );
      return {
        duration,
        events,
        contacts,
        ...(down.contact === undefined ? {} : { contact: down.contact }),
        base: { kind: "seated", seat },
        posture: (t: number): IHumanPosture => {
          const at: number = Math.min(duration, Math.max(0, t));
          return ducked(undocked(at), duck(at));
        },
      };
    },
  };
}
