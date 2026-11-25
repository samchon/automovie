import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanAquatic,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanTrunk } from "../everyday/HumanTrunk";
import { ExerciseKey } from "../exercise/ExerciseKey";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanWater } from "../perform/HumanWater";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AquaticPosture } from "./AquaticPosture";

/**
 * Fin kick frequency, hertz: provisional until a measured fin-swimming study is
 * read.
 */
const KICK: number = 0.6;

/** Fin-tip heave, metres either way: provisional. */
const HEAVE: number = 0.15;

/** Thrust coefficient of a kicking fin blade: provisional. */
const THRUST: number = 0.5;

/** Fresh water's density, kg/m^3. */
const WATER_DENSITY: number = 1000;

/**
 * Descent and ascent speeds of a breath-hold dive, metres per second:
 * provisional.
 */
const DESCENT: number = 1;
const ASCENT: number = 0.8;

/**
 * Breath-hold seconds when none is authored: provisional, a recreational free
 * diver.
 */
const BREATH: number = 30;

/**
 * Seconds of the pike, the legs' lift and the bottom turn of a duck dive:
 * provisional.
 */
const PIKE: number = 0.8;

/**
 * Seconds a flutter kick takes to grow in from still legs: provisional, half a
 * kick.
 */
const KICK_IN: number = 0.4;
const LIFT: number = 0.6;
const TURN: number = 1;

/**
 * Swimming with fins after PADI's Open Water Diver Manual: a flutter kick with
 * the arms along the body at horizontal trim, under water at neutral buoyancy
 * (`finSwim`), face down at the surface breathing through a snorkel
 * (`snorkel`), or a breath-hold duck dive that pikes at the surface, lifts the
 * legs vertical above it, kicks down to the authored depth and ascends with one
 * hand overhead (`duckDive`). The cruising speed balances the fins' thrust, 0.5
 * ρ C_T A w² for both blades heaving at the kick, with the trimmed body's drag
 * as HumanWater sums it with the fins worn. Kick frequency and coefficients are
 * provisional. A dive deeper than the breath-hold reaches is refused.
 */
export namespace AquaticFin {
  /** Plan one of the fin kinds. */
  export function plan(
    context: AquaticPosture.Context,
    water: number,
    kind: IAutoMovieMotionHumanAquatic.Kind,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, entry, params } = context;
    const area: number = blade(context);
    const prone: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      entry.posture,
      ExerciseKey.from(
        body,
        { pitch: 90, neck: -30 },
        { shoulder: 0, raise: 10, elbow: 5 },
      ),
    );
    const hipsAt: ReturnType<typeof AquaticPosture.markers> =
      AquaticPosture.markers(body, ["hips"]);

    // The flutter kick laid over a key's legs, at a share `k` of its
    // stroke, so a kick that starts from still legs grows in without a jump.
    const kick: (
      posture: IAutoMovieMotionHumanPosture,
      t: number,
      k?: number,
    ) => IAutoMovieMotionHumanPosture = (
      posture: IAutoMovieMotionHumanPosture,
      t: number,
      k: number = 1,
    ): IAutoMovieMotionHumanPosture => {
      const kicked: IAutoMovieMotionHumanPosture["joints"] = legs(
        2 * Math.PI * KICK * t,
      );
      const joints: IAutoMovieMotionHumanPosture["joints"] = {
        ...posture.joints,
      };
      for (const [bone, angles] of Object.entries(kicked) as [
        AutoMovieHumanoidBone,
        readonly [number, number, number],
      ][]) {
        const from: readonly [number, number, number] = posture.joints[
          bone
        ] ?? [0, 0, 0];
        joints[bone] = [
          from[0] + (angles[0] - from[0]) * k,
          from[1] + (angles[1] - from[1]) * k,
          from[2] + (angles[2] - from[2]) * k,
        ];
      }
      return { ...posture, joints };
    };
    const place = (
      posture: IAutoMovieMotionHumanPosture,
      hips: IAutoMovieVector3,
      at: IAutoMovieVector3 = hipsAt(posture).get("hips")!.worldPosition,
    ): IAutoMovieMotionHumanPosture =>
      AquaticPosture.translate(
        posture,
        Vector3.add(posture.root, Vector3.subtract(hips, at)),
      );
    const entered: IAutoMovieVector3 = hipsAt(entry.posture).get(
      "hips",
    )!.worldPosition;

    if (kind !== "duckDive") {
      const seconds: number = params.duration ?? 4;
      const depth: number = kind === "snorkel" ? 0 : (params.depth ?? 2);
      const hips: IAutoMovieVector3 = hipsAt(prone).get("hips")!.worldPosition;
      const heading: IAutoMovieVector3 = Vector3.subtract(
        AquaticPosture.along(entry.posture, 1, 0),
        AquaticPosture.along(entry.posture, 0, 0),
      );
      // Only the cruising strokes need the drag and thrust balance. One
      // reading at 1 m/s supplies the coefficient of quadratic resistance.
      const deep: IAutoMovieMotionHumanPosture = AquaticPosture.translate(
        prone,
        {
          ...prone.root,
          y: water - body.measure.stature,
        },
      );
      const resistance: number = -Vector3.dot(
        HumanWater.sum(
          body,
          poseBones(body, resolveHumanPosture(body, deep)),
          heading,
          { surface: water, fins: area },
        ).drag,
        heading,
      );
      const thrust: number =
        0.5 *
        WATER_DENSITY *
        THRUST *
        2 *
        area *
        (2 * Math.PI * KICK * HEAVE) ** 2;
      const speed: number = Math.sqrt(thrust / resistance);
      // At the surface the face is in the water with the back of the head
      // just under it; under water the hips hold the authored depth.
      const hipsY: number =
        kind === "snorkel"
          ? water -
            0.03 -
            (HumanTrunk.region(body, prone, "crown").point.y - hips.y)
          : water - depth;
      return {
        duration: seconds,
        contacts: [],
        yields: ["leftArm", "leftHand", "rightArm", "rightHand"],
        events: [
          { name: "trim", share: 0 },
          { name: "relax", share: 1 },
        ],
        posture: (time: number): IAutoMovieMotionHumanPosture => {
          const t: number = Math.max(0, Math.min(seconds, time));
          const settle: number = minimumJerk.share(Math.min(1, t));
          const travelled: number = speed * Math.max(0, t - 0.5);
          return place(
            kick(prone, t),
            {
              x: entered.x + heading.x * travelled,
              y: entered.y + (hipsY - entered.y) * settle,
              z: entered.z + heading.z * travelled,
            },
            hips,
          );
        },
      };
    }

    // The duck dive.
    const depth: number = params.depth ?? 3;
    const budget: number = params.duration ?? BREATH;
    const reachable: number =
      Math.max(0, budget - PIKE - LIFT - TURN) / (1 / DESCENT + 1 / ASCENT);
    if (!(depth > 0) || depth > reachable)
      throw new HumanRefusal({
        kind: "reach",
        axis: "depth",
        value: depth,
        feasible: { kind: "range", minimum: 0, maximum: reachable, unit: "m" },
        reason: `a ${budget} s breath hold reaches ${reachable.toFixed(2)} m and back`,
        fix: "dive shallower, or give a longer breath hold in seconds",
      });
    const down: number = depth / DESCENT;
    const up: number = depth / ASCENT;
    const tBottom: number = PIKE + LIFT + down;
    const tAscend: number = tBottom + TURN;
    const duration: number = tAscend + up;
    const headDown: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      entry.posture,
      ExerciseKey.from(
        body,
        { pitch: 180 },
        // At this flexion a raise carries the arms toward each other: a
        // small one keeps the hands apart overhead, so the hand that sweeps
        // down on the turn passes outside the other.
        { shoulder: 170, raise: 5, elbow: 5 },
      ),
    );
    const pike: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      entry.posture,
      ExerciseKey.from(
        body,
        { pitch: 170 },
        { hip: 90, shoulder: 170, raise: 5, elbow: 5 },
      ),
    );
    const headUp: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      entry.posture,
      ExerciseKey.from(
        body,
        { pitch: 0, neck: -20 },
        { shoulder: 0, raise: 10, elbow: 10 },
        {},
        { shoulder: 170, raise: 5, elbow: 5 },
      ),
    );
    const grow: (seconds: number) => number = (seconds: number): number =>
      minimumJerk.share(Math.max(0, Math.min(1, seconds / KICK_IN)));
    const a: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      prone,
      pike,
    );
    const b: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      pike,
      headDown,
    );
    const c: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      headDown,
      headUp,
    );
    const downHips: IAutoMovieVector3 =
      hipsAt(headDown).get("hips")!.worldPosition;
    const upHips: IAutoMovieVector3 = hipsAt(headUp).get("hips")!.worldPosition;
    return {
      duration,
      contacts: [],
      events: [
        { name: "pike", share: 0 },
        { name: "legsUp", share: (PIKE + LIFT) / duration },
        { name: "bottom", share: tBottom / duration },
        { name: "ascend", share: tAscend / duration },
        { name: "surface", share: 1 },
      ],
      posture: (time: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.max(0, Math.min(duration, time));
        const hipsY: number =
          t < PIKE + LIFT
            ? water
            : t < tBottom
              ? water - DESCENT * (t - PIKE - LIFT)
              : t < tAscend
                ? water - depth
                : water - depth + ASCENT * (t - tAscend);
        const shaped: IAutoMovieMotionHumanPosture =
          t < PIKE
            ? a(t / PIKE)
            : t < PIKE + LIFT
              ? b((t - PIKE) / LIFT)
              : t < tBottom
                ? kick(headDown, t, grow(t - PIKE - LIFT))
                : // The kick goes on through the turn and the ascent.
                  t < tAscend
                  ? kick(c((t - tBottom) / TURN), t)
                  : kick(headUp, t);
        const keyedHips: IAutoMovieVector3 | undefined =
          t >= tAscend
            ? upHips
            : t >= PIKE + LIFT && t < tBottom
              ? downHips
              : undefined;
        return place(
          shaped,
          { x: entered.x, y: hipsY, z: entered.z },
          keyedHips,
        );
      },
    };
  }

  /** The two worn fins' blade area, square metres, from the named fin's `blade`. */
  function blade(context: AquaticPosture.Context): number {
    const id: string | undefined = context.params.prop;
    const face: IAutoMovieAffordance | undefined =
      id === undefined
        ? undefined
        : (context.prop(id).prop.affordances ?? []).find(
            (a: IAutoMovieAffordance): boolean => a.id === "blade",
          );
    if (face?.width === undefined || face.depth === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "prop",
        value: id ?? null,
        reason: "fin swimming reads the worn fin's blade",
        fix: "name a worn fin with a `blade` contact in prop",
      });
    return face.width * face.depth;
  }

  /** Alternating flutter-kick hip and knee joints at a kick phase. */
  function legs(phase: number): IAutoMovieMotionHumanPosture["joints"] {
    const hip: number = 10 * Math.sin(phase);
    const knee: number = 15 * Math.sin(phase + 0.6);
    return {
      leftUpperLeg: [hip, 0, 0],
      rightUpperLeg: [-hip, 0, 0],
      leftLowerLeg: [15 + knee, 0, 0],
      rightLowerLeg: [15 - knee, 0, 0],
    };
  }
}
