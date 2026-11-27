import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanLeg } from "../../compose/internal/AutoMovieMotionHumanLeg";
import { ExerciseKey } from "../../exercise/internal/ExerciseKey";
import { HumanBound } from "../../law/internal/HumanBound";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { AquaticPosture } from "./AquaticPosture";

/*
 * Pool departure and springboard dive. Springboard flight phases follow PMID
 * 27762669, with provisional timings and take-off velocity.
 */
export namespace AquaticDive {
  /*
   * One forward tucked dive and its first underwater recovery.
   */
  export function dive(
    context: AquaticPosture.Context,
    water: number,
  ): IAutoMovieMotionHumanActionPlan {
    const flight: IEntryFlight = departure(context, water, true);
    const open: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      context.entry.posture,
      ExerciseKey.from(
        context.body,
        { pitch: 116, neck: -7 },
        {
          shoulder: 165,
          raise: 12,
          elbow: 10,
          hip: 9,
          knee: 21,
          ankle: -25,
        },
      ),
      flight.immersed.root,
    );
    const hipsAt: ReturnType<typeof AquaticPosture.markers> =
      AquaticPosture.markers(context.body, ["hips"]);
    const enteredHips: IAutoMovieVector3 = hipsAt(flight.immersed).get(
      "hips",
    )!.worldPosition;
    const extremities: readonly AutoMovieHumanoidBone[] = [
      "head",
      "leftHand",
      "rightHand",
      "leftFoot",
      "rightFoot",
    ];
    const markers: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      AquaticPosture.markers(context.body, ["hips", ...extremities])(open);
    const highest: number = Math.max(
      ...extremities.map(
        (name: AutoMovieHumanoidBone): number =>
          markers.get(name)!.worldPosition.y,
      ),
    );
    const size: number = context.body.measure.stature;
    const depth: number = Math.min(
      enteredHips.y - size * 0.55,
      water - size * 0.08 - (highest - markers.get("hips")!.worldPosition.y),
    );
    const drop: number = enteredHips.y - depth;
    const speed: number = -flight.velocity.y;
    const immersion: number = Math.max(0.6, (2 * drop) / speed);
    const fall: number = (speed * immersion) / drop;
    const recover: ReturnType<typeof AquaticPosture.blend> =
      AquaticPosture.blend(flight.immersed, open);
    const duration: number = flight.entry + immersion;
    return {
      duration,
      events: [
        { name: "takeOff", share: flight.release / duration },
        {
          name: "tuck",
          share:
            (flight.release + 0.43 * (flight.entry - flight.release)) /
            duration,
        },
        {
          name: "open",
          share:
            (flight.release + 0.68 * (flight.entry - flight.release)) /
            duration,
        },
        { name: "waterEntry", share: flight.entry / duration },
        { name: "relax", share: 1 },
      ],
      contacts: flight.contacts.map(
        (
          contact: IAutoMovieMotionHumanContactWindow,
        ): IAutoMovieMotionHumanContactWindow => ({
          ...contact,
          to: flight.release / duration,
        }),
      ),
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        if (seconds <= flight.entry) return flight.posture(seconds);
        const u: number = Math.min(1, (seconds - flight.entry) / immersion);
        const shape: IAutoMovieMotionHumanPosture = recover(u);
        const travel: number = immersion * (u - (u * u) / 2);
        // Shape changes about the hips as the water arrests the entry
        // velocity. Determine recovery depth from its highest turned marker.
        const point: IAutoMovieVector3 = {
          x: enteredHips.x + flight.velocity.x * travel,
          y: enteredHips.y - drop * (1 - (1 - u) ** fall),
          z: enteredHips.z + flight.velocity.z * travel,
        };
        const current: IAutoMovieVector3 =
          hipsAt(shape).get("hips")!.worldPosition;
        return AquaticPosture.translate(
          shape,
          AutoMovieEngineVector3.add(shape.root, AutoMovieEngineVector3.subtract(point, current)),
        );
      },
    };
  }

  /*
   * Solve a ballistic entry at the actual leading hand height; dry legs retain
   * their entered ankle targets.
   */
  export function departure(
    context: AquaticPosture.Context,
    water: number,
    tuck: boolean,
  ): IEntryFlight {
    const { body, entry } = context;
    const original: IAutoMovieMotionHumanPosture = entry.posture;
    if (
      !entry.feet.left.planted ||
      !entry.feet.right.planted ||
      original.root.y <= water
    )
      throw new AutoMovieMotionHumanRefusal({
        kind: "base",
        axis: "base",
        value: entry.base.kind,
        feasible: { kind: "alternatives", values: ["standing"] },
        reason:
          "the pool sequence leaves a block or board above the water from two planted feet",
        fix: "stage both feet on the raised launch surface before the aquatic action",
      });
    const release: number = tuck ? 0.52 : 0.48;
    const low: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      original,
      ExerciseKey.from(
        body,
        {
          pitch: 26,
          spine: [18, 0, 0],
        },
        { ...ExerciseKey.stood(26, 65, 25), shoulder: -18, elbow: 15 },
      ),
      {
        ...original.root,
        y: original.root.y - body.measure.stature * 0.15,
      },
    );
    const launch: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      original,
      ExerciseKey.from(
        body,
        {
          pitch: tuck ? 22 : 43,
        },
        { shoulder: 145, raise: 8, elbow: 15, ankle: -10, knee: 10 },
      ),
    );
    const folded: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      original,
      ExerciseKey.from(
        body,
        {
          pitch: tuck ? 99 : 61,
          spine: [24, 0, 0],
        },
        {
          hip: tuck ? 88 : 14,
          knee: tuck ? 108 : 22,
          shoulder: tuck ? 42 : 165,
          raise: 10,
          elbow: tuck ? 106 : 10,
          ankle: -32,
        },
      ),
    );
    const final: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      original,
      ExerciseKey.from(
        body,
        {
          pitch: tuck ? 176 : 112,
          neck: -5,
        },
        { shoulder: 173, raise: 7, elbow: 5, ankle: -35, knee: 7 },
      ),
    );
    const hipsAt: ReturnType<typeof AquaticPosture.markers> =
      AquaticPosture.markers(body, ["hips"]);
    const finalMarkers: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      AquaticPosture.markers(body, ["hips", "leftHand", "rightHand"])(final);
    const finalHips: IAutoMovieVector3 =
      finalMarkers.get("hips")!.worldPosition;
    const launchHips: IAutoMovieVector3 =
      hipsAt(launch).get("hips")!.worldPosition;
    const left: number =
      finalMarkers.get("leftHand")!.worldPosition.y - finalHips.y;
    const right: number =
      finalMarkers.get("rightHand")!.worldPosition.y - finalHips.y;
    const drop: number = launchHips.y + Math.min(left, right) - water;
    const rise: number = tuck ? 2.15 : 1.45;
    const gravity: number = 9.81;
    const apex: number = HumanBound.above(
      "launch apex above entry plane",
      drop + (rise * rise) / (2 * gravity),
      0,
      "m",
    );
    const impact: number = Math.sqrt(2 * gravity * apex);
    const airtime: number = (rise + impact) / gravity;
    const speed: number = tuck ? 1.25 : 2.7;
    const forward: IAutoMovieVector3 = HumanFrame.forward(original.yaw);
    const point: (seconds: number) => IAutoMovieVector3 = (
      seconds: number,
    ): IAutoMovieVector3 => {
      const along: IAutoMovieVector3 = AquaticPosture.along(
        original,
        speed * seconds,
        original.root.y,
      );
      return {
        x: launchHips.x + along.x - original.root.x,
        y: launchHips.y + rise * seconds - (gravity * seconds * seconds) / 2,
        z: launchHips.z + along.z - original.root.z,
      };
    };
    const floating = (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IAutoMovieMotionHumanPosture => {
      const hips: IAutoMovieVector3 =
        hipsAt(posture).get("hips")!.worldPosition;
      return AquaticPosture.translate(
        posture,
        AutoMovieEngineVector3.add(posture.root, AutoMovieEngineVector3.subtract(point(seconds), hips)),
      );
    };
    const crouch: ReturnType<typeof AquaticPosture.blend> =
      AquaticPosture.blend(original, low);
    const jump: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      low,
      launch,
    );
    const gather: ReturnType<typeof AquaticPosture.blend> =
      AquaticPosture.blend(launch, folded);
    const open: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      folded,
      final,
    );
    const floor: number =
      (entry.feet.left.ankle.y + entry.feet.right.ankle.y) / 2 -
      body.rest.get("leftFoot")!.y;
    const contacts: IAutoMovieMotionHumanContactWindow[] = (
      ["left", "right"] as const
    ).map(
      (side: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow => ({
        part: `${side}Foot`,
        kind: "plant",
        from: 0,
        to: 1,
        support: { kind: "ground", height: floor },
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
          const dry: IAutoMovieMotionHumanPosture =
            u < 0.65 ? crouch(u / 0.65) : jump((u - 0.65) / 0.35);
          return {
            ...dry,
            limbs: {
              leftLeg: AutoMovieMotionHumanLeg.goal(
                body,
                dry,
                "left",
                entry.feet.left,
                true,
              ),
              rightLeg: AutoMovieMotionHumanLeg.goal(
                body,
                dry,
                "right",
                entry.feet.right,
                true,
              ),
            },
          };
        }
        const u: number = Math.min(1, (t - release) / airtime);
        const airborne: IAutoMovieMotionHumanPosture =
          u < 0.43 ? gather(u / 0.43) : open((u - 0.43) / 0.57);
        return floating(airborne, u * airtime);
      },
    };
  }

  /*
   * A block or board departure with a resolved first surface crossing.
   */
  interface IEntryFlight {
    /*
     * Seconds spent on the board before release.
     */
    release: number;
    /*
     * Local second at which the leading hands reach the water.
     */
    entry: number;
    /*
     * Pose at the entry event.
     */
    immersed: IAutoMovieMotionHumanPosture;
    /*
     * World velocity of the hips at entry, metres per second.
     */
    velocity: IAutoMovieVector3;
    /*
     * Foot windows on the entered support.
     */
    contacts: IAutoMovieMotionHumanContactWindow[];
    /*
     * Dry and airborne trajectory up to the entry event.
     */
    posture(seconds: number): IAutoMovieMotionHumanPosture;
  }
}
