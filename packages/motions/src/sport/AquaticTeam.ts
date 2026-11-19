import { Quaternion, Vector3, minimumJerk, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionPropLaunch,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ExerciseKey } from "../exercise/ExerciseKey";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPropHold } from "../perform/HumanPropHold";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { throwObjectLaunch } from "../throwing/throwObjectLaunch";
import { AquaticPosture } from "./AquaticPosture";

/**
 * Water polo support, throwing/defending and one artistic figure phrase.
 * The eggbeater follows the opposed kick and hip/foot variables measured by
 * Oliveira et al. (PMID 25599265). Flat and vertical support sculls follow the
 * form distinctions measured by Homma et al. (PMID 31718520).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the sporting references and the independent motion families.
 * @evidence contracts/development/design.md#principled-representation Cyclic support is combined with authored upper-body actions and a normal prop release.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns water-polo and artistic swimming motion only.
 */
export namespace AquaticTeam {
  /** Polo player using opposed eggbeater kicks and a staged attack, block or save. */
  export function polo(
    context: AquaticPosture.Context,
    water: number,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, params, entry } = context;
    const side: "left" | "right" = params.side ?? "right";
    const handed: number = side === "left" ? 1 : -1;
    const attack: boolean = params.role !== "defend" && params.role !== "keeper";
    const keeper: boolean = params.role === "keeper";
    const performanceSeconds: number = 2.3;
    let duration: number = performanceSeconds;
    const release: number = 1.28;
    const draw: number = 0.94;
    const relax: number = 1.57;
    const base: IAutoMovieMotionHumanPosture = AquaticPosture.key(entry.posture, ExerciseKey.from(
      body, { neck: -5 }, { hip: 53, spread: 23, knee: 90, shoulder: 35, raise: 45, elbow: 65 },
    ));
    const mouth: number = HumanTrunk.region(body, base, "mouth").point.y - base.root.y;

    /** One leg's researched cycle topology, with provisional angle ranges in clinical degrees. */
    const kick = (phase: number) => ({
      hip: 51 + 13 * Math.cos(phase),
      spread: 27 + 9 * Math.sin(phase),
      turn: 16 + 12 * Math.cos(phase),
      knee: 82 + 21 * Math.sin(phase + 0.8),
      ankle: 10 + 14 * Math.cos(phase - 0.5),
    });
    const tuck: IAutoMovieMotionHumanPosture = AquaticPosture.key(entry.posture, ExerciseKey.from(
      body, { yaw: -handed * 8, spine: [-8, 0, -handed * 18], neck: -8 },
      { shoulder: 30, raise: 65, elbow: 55 },
      side === "left" && attack ? { shoulder: -10, raise: 95, elbow: 82 } : {},
      side === "right" && attack ? { shoulder: -10, raise: 95, elbow: 82 } : {},
    ));
    const attackArm: { shoulder: number; raise: number; elbow: number; wrist: number } = {
      shoulder: 132, raise: 24, elbow: 17, wrist: 17,
    };
    const blockArm: { shoulder: number; raise: number; elbow: number; wrist: number } = {
      shoulder: 152, raise: 22, elbow: keeper ? 15 : 20, wrist: -10,
    };
    const reach: IAutoMovieMotionHumanPosture = AquaticPosture.key(entry.posture, ExerciseKey.from(
      body, { yaw: attack ? handed * 9 : 0, spine: [attack ? 9 : -5, 0, attack ? handed * 16 : 0], neck: -8 },
      { shoulder: 35, raise: 66, elbow: 56 },
      side === "left" || keeper ? (attack ? attackArm : blockArm) : {},
      side === "right" || keeper ? (attack ? attackArm : blockArm) : {},
    ));
    const a: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(base, tuck);
    const b: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(tuck, reach);
    const c: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(reach, base);

    const posture = (seconds: number): IAutoMovieMotionHumanPosture => {
      const t: number = Math.max(0, Math.min(duration, seconds));
      const u: number = Math.PI * 2 * (t / 0.92 + (params.phase ?? 0));
      const upper: IAutoMovieMotionHumanPosture = t < draw ? a(t / draw)
        : t <= release ? b((t - draw) / (release - draw))
        : c((t - release) / (relax - release));
      const legs: IAutoMovieMotionHumanPosture["joints"] = ExerciseKey.from(
        body, {}, {}, kick(u), kick(u + Math.PI),
      ).joints;
      const rise: number = t < draw ? 0 : Math.sin(Math.PI * Math.min(1, (t - draw) / 0.7)) ** 2;
      return {
        ...upper,
        root: AquaticPosture.along(entry.posture, attack ? 0.24 * minimumJerk.share(Math.min(1, t / performanceSeconds)) : 0,
          water + 0.055 - mouth + (keeper ? 0.26 : 0.19) * rise + 0.012 * Math.cos(2 * u)),
        joints: {
          ...upper.joints,
          leftUpperLeg: legs.leftUpperLeg, rightUpperLeg: legs.rightUpperLeg,
          leftLowerLeg: legs.leftLowerLeg, rightLowerLeg: legs.rightLowerLeg,
          leftFoot: legs.leftFoot, rightFoot: legs.rightFoot,
        },
      };
    };

    let launches: IAutoMovieMotionPropLaunch[] = [];
    if (attack && params.prop !== undefined) {
      const grip = (seconds: number): IAutoMovieRigidTransform => HumanPropHold.frame(
        body, poseBones(body, resolveHumanPosture(body, posture(seconds))), { side },
      );
      const first: IAutoMovieRigidTransform = grip(0);
      const last: IAutoMovieRigidTransform = grip(release);
      const ballProp: ReturnType<typeof context.prop> = context.prop(params.prop);
      const ball: IAutoMovieRigidTransform = ballProp.frame(context.start);
      const turn: IAutoMovieQuaternion = Quaternion.multiply(last.rotation, Quaternion.inverse(first.rotation));
      const point: IAutoMovieVector3 = Vector3.add(last.position, Quaternion.rotateVector(
        turn, Vector3.subtract(ball.position, first.position),
      ));
      const target: IAutoMovieVector3 | undefined = params.at;
      const velocity: IAutoMovieVector3 | undefined = target === undefined ? undefined :
        throwObjectLaunch.aimed(point, target, 24);
      if (target === undefined || velocity === undefined)
        throw new HumanRefusal({
          kind: "parameter",
          axis: "at",
          value: target ?? null,
          feasible: null,
          reason: "a held water polo ball needs a reachable flight target below the release ray",
          fix: "give a downrange world point for the pass or shot",
        });
      const flightSeconds: number = Math.hypot(target.x - point.x, target.z - point.z) / Math.hypot(velocity.x, velocity.z);
      duration = Math.max(duration, release + flightSeconds + 0.12);

      // The flight owner sees the carried prop's displayed release after
      // composition. Use the planned arc to choose flight time, then aim
      // from that authoritative origin instead of mixing two release frames.
      launches = [{
        prop: params.prop,
        seconds: release,
        point,
        velocity,
        ...(ballProp.prop.body?.drag === undefined ? { aim: { point: target, seconds: flightSeconds } } : {}),
      }];
    }
    const contacts: IAutoMovieMotionHumanContactWindow[] = attack
      ? throwObjectLaunch.held(params.prop, side, release / duration) : [];
    return {
      duration,
      events: [
        { name: "support", share: 0 },
        { name: attack ? "draw" : "raise", share: draw / duration },
        { name: attack ? "release" : "block", share: release / duration },
        { name: "recover", share: relax / duration },
        { name: "relax", share: 1 },
      ],
      contacts,
      launches,
      posture,
    };
  }

  /** A flat-layout-to-vertical artistic phrase with optional ensemble role and beat offset. */
  export function artistic(
    context: AquaticPosture.Context,
    water: number,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, entry, params } = context;
    const duration: number = 4;
    const lifted: boolean = params.role === "flyer";
    const base: boolean = params.role === "base";
    const measured: IAutoMovieMotionHumanPosture = AquaticPosture.key(entry.posture,
      ExerciseKey.from(body, { pitch: -90 }, { shoulder: 6, raise: 19, elbow: 32, hip: 6, knee: 10, ankle: -24 }),
    );
    const laid: IAutoMovieMotionHumanPosture = {
      ...measured,
      root: { ...measured.root, y: measured.root.y + water - 0.13 - AquaticPosture.marker(body, measured, "hips").y },
    };
    const upright: IAutoMovieMotionHumanPosture = AquaticPosture.key(entry.posture, ExerciseKey.from(body, {
      pitch: 2, spine: [-4, 0, 0],
    }, { shoulder: 12, raise: 55, elbow: 82, hip: 16, spread: 17, knee: 43, ankle: -16 }), {
      ...entry.posture.root, y: water - body.measure.stature * 0.81,
    });
    const high: IAutoMovieMotionHumanPosture = AquaticPosture.key(entry.posture, ExerciseKey.from(body, {
      pitch: lifted ? -9 : 3, spine: [-9, 0, 0], neck: base ? -20 : 3,
    }, {
      shoulder: base ? 138 : 164, raise: base ? 25 : 17, elbow: base ? 26 : 7,
      hip: lifted ? 10 : 35, spread: lifted ? 30 : 19, knee: lifted ? 8 : 57, ankle: -25,
    }), { ...upright.root, y: upright.root.y + (lifted ? 0.76 : 0.18) });
    const vertical: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(laid, upright);
    const rise: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(upright, high);
    const fall: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(high, upright);
    const settle: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(upright, laid);
    const lag: number = 0.35 * (params.phase ?? 0);
    const tVertical: number = 1.35 + lag;
    const tHigh: number = 2.3 + lag;
    const tReturn: number = 3.15 + lag;
    const partners: readonly [IAutoMovieMotionHumanPerformerReader, IAutoMovieMotionHumanPerformerReader] | undefined =
      lifted && params.bases !== undefined
        ? [context.performer(params.bases[0]), context.performer(params.bases[1])]
        : undefined;
    const gripStart: number = tHigh - 0.14;
    const gripEnd: number = tHigh + 0.14;
    const hands: ReadonlySet<AutoMovieHumanoidBone> = new Set(["leftHand", "rightHand"]);
    const contacts: IAutoMovieMotionHumanContactWindow[] = partners === undefined ? [] : (["left", "right"] as const).map(
      (side: "left" | "right", i: number): IAutoMovieMotionHumanContactWindow => ({
        part: `${side}Foot`, kind: "bear", from: gripStart / duration, to: gripEnd / duration,
        support: { kind: "person", subject: params.bases![i]!, region: side === "left" ? "palmRight" : "palmLeft" },
      }),
    );

    return {
      duration,
      events: [
        { name: "flatScull", share: 0 },
        { name: "supportScull", share: tVertical / duration },
        { name: "figure", share: tHigh / duration },
        { name: "return", share: tReturn / duration },
        { name: "relax", share: 1 },
      ],
      contacts,
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const result: IAutoMovieMotionHumanPosture = t <= tVertical ? vertical((t - 0.65 - lag) / 0.7)
          : t <= tHigh ? rise((t - tVertical) / (tHigh - tVertical))
          : t <= tReturn ? fall((t - tHigh) / (tReturn - tHigh))
          : settle((t - tReturn) / (duration - tReturn));
        const phase: number = 2 * Math.PI * (t - lag) / 0.66;
        const active: number = 1 - 0.97 * Math.max(0, 1 - Math.abs(t - tHigh) / 0.47);
        const joint = (part: "leftUpperArm" | "rightUpperArm" | "leftHand" | "rightHand", change: number) => {
          const [x, y, z]: readonly [number, number, number] = result.joints[part] ?? [0, 0, 0];
          return [x, y + change * active * Math.sin(phase), z + change * active * Math.cos(phase) / 2] as const;
        };
        const shaped: IAutoMovieMotionHumanPosture = {
          ...result,
          joints: {
            ...result.joints,
            leftUpperArm: joint("leftUpperArm", 12), rightUpperArm: joint("rightUpperArm", 12),
            leftHand: joint("leftHand", 18), rightHand: joint("rightHand", 18),
          },
        };
        if (partners === undefined || t < gripStart - 0.22 || t > gripEnd + 0.22) return shaped;
        const w: number = minimumJerk.share(Math.min(1, (t - gripStart + 0.22) / 0.22, (gripEnd + 0.22 - t) / 0.22));
        const limb = (side: "left" | "right", base: IAutoMovieMotionHumanPerformerReader) => {
          const region = base.body.surfaces.regions[side === "left" ? "palmRight" : "palmLeft"];
          const bone = base.bones(context.start + t, hands).get(region.bone)!;
          const palm: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(region, bone).point;
          const ankle: IAutoMovieVector3 = AquaticPosture.marker(body, shaped, `${side}Foot`);
          const knee: IAutoMovieVector3 = AquaticPosture.marker(body, shaped, `${side}LowerLeg`);
          return { point: Vector3.lerp(ankle, palm, w), bend: knee };
        };
        return { ...shaped, limbs: { leftLeg: limb("left", partners[0]), rightLeg: limb("right", partners[1]) } };
      },
    };
  }
}
