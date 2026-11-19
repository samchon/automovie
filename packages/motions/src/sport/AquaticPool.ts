import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { ExerciseKey } from "../exercise/ExerciseKey";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AquaticPosture } from "./AquaticPosture";
import { swim } from "./swim";

/**
 * A pool start, first stroke and wall reversal, or a forward tucked dive.
 * World Aquatics rules distinguish crawl wall contact from a two-hand
 * breaststroke touch. Puel et al. (PMID 22176710) motivate separating rotation,
 * plant and push. Springboard flight phases follow the observation protocol
 * in PMID 27762669, with provisional timings and take-off velocity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the phase references and the authored quantities.
 * @evidence contracts/development/design.md#principled-representation Take-off, flight and immersed path share one reference plane, with wall contacts placed from canonical markers.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Supplies only the aquatic law's pool branches.
 */
export namespace AquaticPool {
  /** A block or board departure with a resolved first surface crossing. */
  interface IEntryFlight {
    /** Seconds spent on the board before release. */
    release: number;
    /** Local second at which the leading hands reach the water. */
    entry: number;
    /** Pose at the entry event. */
    immersed: IAutoMovieMotionHumanPosture;
    /** World velocity of the hips at entry, metres per second. */
    velocity: IAutoMovieVector3;
    /** Foot windows on the entered support. */
    contacts: IAutoMovieMotionHumanContactWindow[];
    /** Dry and airborne trajectory up to the entry event. */
    posture(seconds: number): IAutoMovieMotionHumanPosture;
  }

  /** Pool race with an authored short course, resolved wall contacts and a reused stroke cycle on either course. */
  export function race(
    context: AquaticPosture.Context,
    water: number,
    kind: "crawlStartTurn" | "breaststrokeStartTurn",
  ): IAutoMovieMotionHumanActionPlan {
    const { body, entry } = context;
    const forward: IAutoMovieVector3 = HumanFrame.forward(entry.posture.yaw);
    const support: string | undefined = context.params.support;
    const endWall: IAutoMovieVector3 = support === undefined
      ? AquaticPosture.along(entry.posture, context.params.wall ?? 6, water)
      : context.aim({ kind: "prop", subject: support, point: "edge" }, context.start).point;
    const distance: number = Vector3.dot(Vector3.subtract(endWall, entry.posture.root), forward);
    HumanBound.above("wall", distance, 3, "m");
    const flight: IEntryFlight = departure(context, water, false);
    const breast: boolean = kind === "breaststrokeStartTurn";
    const stroke: "breaststroke" | "frontCrawl" = breast ? "breaststroke" : "frontCrawl";
    const inbound: IAutoMovieMotionHumanActionPlan = swim.plan({
      ...context,
      params: { kind: stroke, water, cycles: 2 },
    });
    const outbound: IAutoMovieMotionHumanActionPlan = swim.plan({
      ...context,
      entry: { ...entry, posture: { ...entry.posture, yaw: entry.posture.yaw + 180 } },
      params: { kind: stroke, water, cycles: 1 },
    });
    const wall: IAutoMovieVector3 = AquaticPosture.along(entry.posture, distance, water - 0.32);
    const tuck: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      entry.posture,
      ExerciseKey.from(body, { pitch: breast ? 47 : 160, spine: [22, 0, 0] }, {
        hip: 65, knee: 95, shoulder: 40, raise: 16, elbow: 75,
      }),
      AquaticPosture.along(entry.posture, distance - 0.55, water - 0.57),
    );
    const touched: IAutoMovieMotionHumanPosture = pin(
      context,
      AquaticPosture.key(entry.posture, ExerciseKey.from(body, { pitch: 85 }, {
        shoulder: 160, raise: 8, elbow: 14, ankle: -18, knee: 18,
      }), tuck.root),
      ["leftHand", "rightHand"],
      { ...wall, y: water - 0.07 },
    );
    const planted: IAutoMovieMotionHumanPosture = pin(
      context,
      AquaticPosture.key(entry.posture, ExerciseKey.from(body, {
        yaw: 180, pitch: 68, spine: [14, 0, 0],
      }, {
        hip: 50, spread: 8, knee: 95, ankle: 10, shoulder: 165, raise: 8, elbow: 10,
      }), tuck.root),
      ["leftFoot", "rightFoot"],
      wall,
    );
    const pushing: IAutoMovieMotionHumanPosture = pin(
      context,
      AquaticPosture.key(entry.posture, ExerciseKey.from(body, { yaw: 180, pitch: 89 }, {
        hip: 3, spread: 4, knee: 14, ankle: -29, shoulder: 172, raise: 7, elbow: 5,
      }), planted.root),
      ["leftFoot", "rightFoot"],
      wall,
    );
    const approaching: IAutoMovieMotionHumanPosture = breast ? touched : tuck;
    const tBreakout: number = flight.entry + 0.55;
    const tApproach: number = tBreakout + inbound.duration;
    const tTouch: number = tApproach + 0.28;
    const tPlant: number = tTouch + (breast ? 0.43 : 0.35);
    const tPush: number = tPlant + 0.2;
    const tResume: number = tPush + 0.56;
    const duration: number = tResume + outbound.duration;

    const inboundStart: IAutoMovieVector3 = AquaticPosture.along(
      entry.posture, 1.55, inbound.posture(0).root.y,
    );
    const inboundEnd: IAutoMovieVector3 = AquaticPosture.along(
      entry.posture, distance - 1.1, inbound.posture(inbound.duration).root.y,
    );
    const outboundStart: IAutoMovieVector3 = AquaticPosture.along(
      entry.posture, distance - 1.65, outbound.posture(0).root.y,
    );
    const outShift: IAutoMovieVector3 = Vector3.subtract(outboundStart, outbound.posture(0).root);
    const swimIn: (seconds: number) => IAutoMovieMotionHumanPosture = (seconds: number): IAutoMovieMotionHumanPosture => {
      const shaped: IAutoMovieMotionHumanPosture = inbound.posture(seconds);
      const root: IAutoMovieVector3 = Vector3.lerp(inboundStart, inboundEnd, seconds / inbound.duration);
      return translate(shaped, { ...root, y: shaped.root.y });
    };
    const swimOut: (seconds: number) => IAutoMovieMotionHumanPosture = (seconds: number): IAutoMovieMotionHumanPosture => {
      const shaped: IAutoMovieMotionHumanPosture = outbound.posture(seconds);
      return translate(shaped, Vector3.add(shaped.root, outShift));
    };
    const entering: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(flight.immersed, swimIn(0));
    const reach: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(swimIn(inbound.duration), approaching);
    const turn: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(approaching, planted);
    const push: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(planted, pushing);
    const glide: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(pushing, swimOut(0));

    // Keep the measured foot midpoint on the wall while shape extends to push-off.
    const wallContacts: IAutoMovieMotionHumanContactWindow[] = context.params.support === undefined ? [] :
      (["left", "right"] as const).flatMap((side: "left" | "right"): IAutoMovieMotionHumanContactWindow[] => [
        ...(breast ? [{
          part: `${side}Hand` as const,
          kind: "strike" as const,
          from: tTouch / duration,
          to: tTouch / duration,
          support: { kind: "prop" as const, subject: context.params.support! },
        }] : []),
        {
          part: `${side}Foot` as const,
          kind: "bear",
          from: tPlant / duration,
          to: tPush / duration,
          support: { kind: "prop", subject: context.params.support! },
        },
      ]);

    return {
      duration,
      events: [
        { name: "takeOff", share: flight.release / duration },
        { name: "waterEntry", share: flight.entry / duration },
        { name: "breakout", share: tBreakout / duration },
        { name: breast ? "twoHandTouch" : "tumble", share: tTouch / duration },
        { name: "wallPlant", share: tPlant / duration },
        { name: "pushOff", share: tPush / duration },
        { name: "resumeStroke", share: tResume / duration },
        { name: "relax", share: 1 },
      ],
      contacts: [...flight.contacts.map((contact: IAutoMovieMotionHumanContactWindow): IAutoMovieMotionHumanContactWindow => ({
        ...contact, to: flight.release / duration,
      })), ...wallContacts],
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        if (t <= flight.entry) return flight.posture(t);
        if (t < tBreakout) return entering((t - flight.entry) / (tBreakout - flight.entry));
        if (t < tApproach) return swimIn(t - tBreakout);
        if (t < tTouch) return reach((t - tApproach) / (tTouch - tApproach));
        if (t < tPlant) return turn((t - tTouch) / (tPlant - tTouch));
        if (t <= tPush)
          return pin(context, push((t - tPlant) / (tPush - tPlant)), ["leftFoot", "rightFoot"], wall);
        if (t < tResume) return glide((t - tPush) / (tResume - tPush));
        return swimOut(t - tResume);
      },
    };
  }

  /** One forward tucked dive and its first underwater recovery. */
  export function dive(
    context: AquaticPosture.Context,
    water: number,
  ): IAutoMovieMotionHumanActionPlan {
    const flight: IEntryFlight = departure(context, water, true);
    const open: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      context.entry.posture,
      ExerciseKey.from(context.body, { pitch: 116, neck: -7 }, {
        shoulder: 165, raise: 12, elbow: 10, hip: 9, knee: 21, ankle: -25,
      }),
      flight.immersed.root,
    );
    const enteredHips: IAutoMovieVector3 = AquaticPosture.marker(context.body, flight.immersed, "hips");
    const markers: ReturnType<typeof poseBones> = poseBones(context.body, resolveHumanPosture(context.body, open));
    const highest: number = Math.max(...(["head", "leftHand", "rightHand", "leftFoot", "rightFoot"] as const).map(
      (name: AutoMovieHumanoidBone): number => markers.get(name)!.worldPosition.y,
    ));
    const size: number = context.body.measure.stature;
    const depth: number = Math.min(
      enteredHips.y - size * 0.55,
      water - size * 0.08 - (highest - markers.get("hips")!.worldPosition.y),
    );
    const drop: number = enteredHips.y - depth;
    const speed: number = -flight.velocity.y;
    const immersion: number = Math.max(0.6, 2 * drop / speed);
    const fall: number = speed * immersion / drop;
    const recover: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(flight.immersed, open);
    const duration: number = flight.entry + immersion;
    return {
      duration,
      events: [
        { name: "takeOff", share: flight.release / duration },
        { name: "tuck", share: (flight.release + 0.43 * (flight.entry - flight.release)) / duration },
        { name: "open", share: (flight.release + 0.68 * (flight.entry - flight.release)) / duration },
        { name: "waterEntry", share: flight.entry / duration },
        { name: "relax", share: 1 },
      ],
      contacts: flight.contacts.map((contact: IAutoMovieMotionHumanContactWindow): IAutoMovieMotionHumanContactWindow => ({
        ...contact, to: flight.release / duration,
      })),
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        if (seconds <= flight.entry) return flight.posture(seconds);
        const u: number = Math.min(1, (seconds - flight.entry) / immersion);
        const shape: IAutoMovieMotionHumanPosture = recover(u);
        const travel: number = immersion * (u - u * u / 2);
        // Shape changes about the hips as the water arrests the entry
        // velocity. Determine recovery depth from its highest turned marker.
        const point: IAutoMovieVector3 = {
          x: enteredHips.x + flight.velocity.x * travel,
          y: enteredHips.y - drop * (1 - (1 - u) ** fall),
          z: enteredHips.z + flight.velocity.z * travel,
        };
        const current: IAutoMovieVector3 = AquaticPosture.marker(context.body, shape, "hips");
        return translate(shape, Vector3.add(shape.root, Vector3.subtract(point, current)));
      },
    };
  }

  /** Solve a ballistic entry at the actual leading hand height; dry legs retain their entered ankle targets. */
  function departure(context: AquaticPosture.Context, water: number, tuck: boolean): IEntryFlight {
    const { body, entry } = context;
    const original: IAutoMovieMotionHumanPosture = entry.posture;
    if (!entry.feet.left.planted || !entry.feet.right.planted || original.root.y <= water)
      throw new HumanRefusal({
        kind: "base",
        axis: "base",
        value: entry.base.kind,
        feasible: { kind: "alternatives", values: ["standing"] },
        reason: "the pool sequence leaves a block or board above the water from two planted feet",
        fix: "stage both feet on the raised launch surface before the aquatic action",
      });
    const release: number = tuck ? 0.52 : 0.48;
    const low: IAutoMovieMotionHumanPosture = AquaticPosture.key(original, ExerciseKey.from(body, {
      pitch: 26, spine: [18, 0, 0],
    }, { ...ExerciseKey.stood(26, 65, 25), shoulder: -18, elbow: 15 }), {
      ...original.root, y: original.root.y - body.measure.stature * 0.15,
    });
    const launch: IAutoMovieMotionHumanPosture = AquaticPosture.key(original, ExerciseKey.from(body, {
      pitch: tuck ? 22 : 43,
    }, { shoulder: 145, raise: 8, elbow: 15, ankle: -10, knee: 10 }));
    const folded: IAutoMovieMotionHumanPosture = AquaticPosture.key(original, ExerciseKey.from(body, {
      pitch: tuck ? 99 : 61, spine: [24, 0, 0],
    }, {
      hip: tuck ? 88 : 14, knee: tuck ? 108 : 22, shoulder: tuck ? 42 : 165,
      raise: 10, elbow: tuck ? 106 : 10, ankle: -32,
    }));
    const final: IAutoMovieMotionHumanPosture = AquaticPosture.key(original, ExerciseKey.from(body, {
      pitch: tuck ? 176 : 112, neck: -5,
    }, { shoulder: 173, raise: 7, elbow: 5, ankle: -35, knee: 7 }));
    const finalHips: IAutoMovieVector3 = AquaticPosture.marker(body, final, "hips");
    const launchHips: IAutoMovieVector3 = AquaticPosture.marker(body, launch, "hips");
    const left: number = AquaticPosture.marker(body, final, "leftHand").y - finalHips.y;
    const right: number = AquaticPosture.marker(body, final, "rightHand").y - finalHips.y;
    const drop: number = launchHips.y + Math.min(left, right) - water;
    const rise: number = tuck ? 2.15 : 1.45;
    const gravity: number = 9.81;
    const apex: number = HumanBound.above("launch apex above entry plane", drop + rise * rise / (2 * gravity), 0, "m");
    const impact: number = Math.sqrt(2 * gravity * apex);
    const airtime: number = (rise + impact) / gravity;
    const speed: number = tuck ? 1.25 : 2.7;
    const forward: IAutoMovieVector3 = HumanFrame.forward(original.yaw);
    const point: (seconds: number) => IAutoMovieVector3 = (seconds: number): IAutoMovieVector3 => {
      const along: IAutoMovieVector3 = AquaticPosture.along(original, speed * seconds, original.root.y);
      return {
        x: launchHips.x + along.x - original.root.x,
        y: launchHips.y + rise * seconds - gravity * seconds * seconds / 2,
        z: launchHips.z + along.z - original.root.z,
      };
    };
    const floating = (posture: IAutoMovieMotionHumanPosture, seconds: number): IAutoMovieMotionHumanPosture => {
      const hips: IAutoMovieVector3 = AquaticPosture.marker(body, posture, "hips");
      return translate(posture, Vector3.add(posture.root, Vector3.subtract(point(seconds), hips)));
    };
    const crouch: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(original, low);
    const jump: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(low, launch);
    const gather: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(launch, folded);
    const open: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(folded, final);
    const floor: number = (entry.feet.left.ankle.y + entry.feet.right.ankle.y) / 2 - body.rest.get("leftFoot")!.y;
    const contacts: IAutoMovieMotionHumanContactWindow[] = (["left", "right"] as const).map(
      (side: "left" | "right"): IAutoMovieMotionHumanContactWindow => ({
        part: `${side}Foot`, kind: "plant", from: 0, to: 1, support: { kind: "ground", height: floor },
      }),
    );

    return {
      release,
      entry: release + airtime,
      immersed: floating(final, airtime),
      velocity: { x: forward.x * speed, y: -impact, z: forward.z * speed },
      contacts,
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.max(0, seconds);
        if (t < release) {
          const u: number = t / release;
          const dry: IAutoMovieMotionHumanPosture = u < 0.65 ? crouch(u / 0.65) : jump((u - 0.65) / 0.35);
          return {
            ...dry,
            limbs: {
              leftLeg: AutoMovieMotionHumanLeg.goal(body, dry, "left", entry.feet.left, true),
              rightLeg: AutoMovieMotionHumanLeg.goal(body, dry, "right", entry.feet.right, true),
            },
          };
        }
        const u: number = Math.min(1, (t - release) / airtime);
        const airborne: IAutoMovieMotionHumanPosture = u < 0.43 ? gather(u / 0.43) : open((u - 0.43) / 0.57);
        return floating(airborne, u * airtime);
      },
    };
  }

  /** Translate the whole posture and any world-space rotation pivot together. */
  function translate(posture: IAutoMovieMotionHumanPosture, root: IAutoMovieVector3): IAutoMovieMotionHumanPosture {
    return {
      ...posture,
      root,
      rotation: posture.rotation === undefined ? undefined : {
        ...posture.rotation,
        about: Vector3.add(posture.rotation.about, Vector3.subtract(root, posture.root)),
      },
    };
  }

  /** Place two displayed marker centres symmetrically about a wall-local target. */
  function pin(
    context: AquaticPosture.Context,
    posture: IAutoMovieMotionHumanPosture,
    bones: readonly [AutoMovieHumanoidBone, AutoMovieHumanoidBone],
    target: IAutoMovieVector3,
  ): IAutoMovieMotionHumanPosture {
    const a: IAutoMovieVector3 = AquaticPosture.marker(context.body, posture, bones[0]);
    const b: IAutoMovieVector3 = AquaticPosture.marker(context.body, posture, bones[1]);
    return translate(posture, Vector3.add(posture.root, Vector3.subtract(target, Vector3.lerp(a, b, 0.5))));
  }
}
