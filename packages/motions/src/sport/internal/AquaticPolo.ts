import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionPropLaunch,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { ExerciseKey } from "../../exercise/internal/ExerciseKey";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanPropHold } from "../../perform/internal/HumanPropHold";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { throwObjectLaunch } from "../../throwing/internal/throwObjectLaunch";
import { AquaticPosture } from "./AquaticPosture";

/*
 * Water polo support, throwing and defending. The eggbeater follows the opposed
 * kick and hip and foot variables in Oliveira et al. (PMID 25599265).
 */
export namespace AquaticPolo {
  /*
   * Polo player using opposed eggbeater kicks and a staged attack, block or
   * save.
   */
  export function plan(
    context: AquaticPosture.Context,
    water: number,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, params, entry } = context;
    const side: AutoMovieHumanSide = params.side ?? "right";
    const handed: number = side === "left" ? 1 : -1;
    const attack: boolean =
      params.role !== "defend" && params.role !== "keeper";
    const keeper: boolean = params.role === "keeper";
    const performanceSeconds: number = 2.3;
    let duration: number = performanceSeconds;
    const release: number = 1.28;
    const draw: number = 0.94;
    const relax: number = 1.57;
    const base: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      entry.posture,
      ExerciseKey.from(
        body,
        { neck: -5 },
        { hip: 53, spread: 23, knee: 90, shoulder: 35, raise: 45, elbow: 65 },
      ),
    );
    const mouth: number =
      HumanTrunk.region(body, base, "mouth").point.y - base.root.y;

    /*
     * One leg's researched cycle topology, with provisional angle ranges in
     * clinical degrees.
     */
    const kick = (phase: number) => ({
      hip: 51 + 13 * Math.cos(phase),
      spread: 27 + 9 * Math.sin(phase),
      turn: 16 + 12 * Math.cos(phase),
      knee: 82 + 21 * Math.sin(phase + 0.8),
      // Kept within the dorsiflexion an unloaded ankle takes (20 degrees).
      ankle: 6 + 14 * Math.cos(phase - 0.5),
    });
    const tuck: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      entry.posture,
      ExerciseKey.from(
        body,
        { yaw: -handed * 8, spine: [-8, 0, -handed * 18], neck: -8 },
        { shoulder: 30, raise: 65, elbow: 55 },
        side === "left" && attack
          ? { shoulder: -10, raise: 95, elbow: 82 }
          : {},
        side === "right" && attack
          ? { shoulder: -10, raise: 95, elbow: 82 }
          : {},
      ),
    );
    const attackArm: IAutoMovieMotionHumanExerciseKey.ILimb = {
      shoulder: 132,
      raise: 24,
      elbow: 17,
      wrist: 17,
    };
    const blockArm: IAutoMovieMotionHumanExerciseKey.ILimb = {
      shoulder: 140,
      // A keeper's two raised arms block overhead: at this flexion a
      // raise carries each arm across the head into the other, so none is
      // taken. A defender's arms spread wide.
      raise: keeper ? 0 : 60,
      elbow: keeper ? 15 : 20,
      wrist: -10,
    };
    const reach: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      entry.posture,
      ExerciseKey.from(
        body,
        {
          yaw: attack ? handed * 9 : 0,
          spine: [attack ? 9 : -5, 0, attack ? handed * 16 : 0],
          neck: -8,
        },
        { shoulder: 35, raise: 66, elbow: 56 },
        side === "left" || keeper ? (attack ? attackArm : blockArm) : {},
        side === "right" || keeper ? (attack ? attackArm : blockArm) : {},
      ),
    );
    const a: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      base,
      tuck,
    );
    const b: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      tuck,
      reach,
    );
    const c: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      reach,
      base,
    );

    const posture = (seconds: number): IAutoMovieMotionHumanPosture => {
      const t: number = Math.max(0, Math.min(duration, seconds));
      const u: number = Math.PI * 2 * (t / 0.92 + (params.phase ?? 0));
      const upper: IAutoMovieMotionHumanPosture =
        t < draw
          ? a(t / draw)
          : t <= release
            ? b((t - draw) / (release - draw))
            : c((t - release) / (relax - release));
      const legs: IAutoMovieMotionHumanPosture["joints"] = ExerciseKey.from(
        body,
        {},
        {},
        kick(u),
        kick(u + Math.PI),
      ).joints;
      const rise: number =
        t < draw ? 0 : Math.sin(Math.PI * Math.min(1, (t - draw) / 0.7)) ** 2;
      return {
        ...upper,
        root: AquaticPosture.along(
          entry.posture,
          attack
            ? 0.24 * AutoMovieEngineMotionSampling.minimumJerkShare(Math.min(1, t / performanceSeconds))
            : 0,
          water +
            0.055 -
            mouth +
            (keeper ? 0.26 : 0.19) * rise +
            0.012 * Math.cos(2 * u),
        ),
        joints: {
          ...upper.joints,
          leftUpperLeg: legs.leftUpperLeg,
          rightUpperLeg: legs.rightUpperLeg,
          leftLowerLeg: legs.leftLowerLeg,
          rightLowerLeg: legs.rightLowerLeg,
          leftFoot: legs.leftFoot,
          rightFoot: legs.rightFoot,
        },
      };
    };

    let launches: IAutoMovieMotionPropLaunch[] = [];
    if (attack && params.prop !== undefined) {
      const grip = (seconds: number): IAutoMovieRigidTransform =>
        HumanPropHold.frame(
          body,
          poseBones(body, resolveHumanPosture(body, posture(seconds))),
          { side },
        );
      const first: IAutoMovieRigidTransform = grip(0);
      const last: IAutoMovieRigidTransform = grip(release);
      const ballProp: ReturnType<typeof context.prop> = context.prop(
        params.prop,
      );
      const ball: IAutoMovieRigidTransform = ballProp.frame(context.start);
      // A round grip whose aperture is the ball's diameter, centred on the
      // model origin, declares the collision sphere the flight owner and the
      // goal rule read. There the origin is the centre, so the aimed origin
      // and the sphere's centre take the same path. A ball modelled from
      // another origin keeps the point flight its aim describes.
      const socket: IAutoMovieAffordance | undefined =
        ballProp.prop.affordances?.find(
          (site: IAutoMovieAffordance): boolean =>
            site.id === "grip" &&
            site.kind === "handle" &&
            site.symmetry === "round" &&
            (site.aperture ?? 0) > 0 &&
            Vector3.length(site.frame.translation) === 0,
        );
      const turn: IAutoMovieQuaternion = Quaternion.multiply(
        last.rotation,
        Quaternion.inverse(first.rotation),
      );
      const point: IAutoMovieVector3 = Vector3.add(
        last.position,
        Quaternion.rotateVector(
          turn,
          Vector3.subtract(ball.position, first.position),
        ),
      );
      const target: IAutoMovieVector3 | undefined = params.at;
      const velocity: IAutoMovieVector3 | undefined =
        target === undefined
          ? undefined
          : throwObjectLaunch.aimed(point, target, 24);
      if (target === undefined || velocity === undefined)
        throw new HumanRefusal({
          kind: "parameter",
          axis: "at",
          value: target ?? null,
          feasible: null,
          reason:
            "a held water polo ball needs a reachable flight target below the release ray",
          fix: "give a downrange world point for the pass or shot",
        });
      const flightSeconds: number =
        Math.hypot(target.x - point.x, target.z - point.z) /
        Math.hypot(velocity.x, velocity.z);
      duration = Math.max(duration, release + flightSeconds + 0.12);

      // The flight owner sees the carried prop's displayed release after
      // composition. Use the planned arc to choose flight time, then aim
      // from that authoritative origin instead of mixing two release frames.
      launches = [
        {
          prop: params.prop,
          seconds: release,
          point,
          velocity,
          ...(socket?.aperture === undefined
            ? {}
            : {
                sphere: {
                  centre: socket.frame.translation,
                  radius: socket.aperture / 2,
                },
              }),
          ...(ballProp.prop.body?.drag === undefined
            ? { aim: { point: target, seconds: flightSeconds } }
            : {}),
        },
      ];
    }
    const contacts: IAutoMovieMotionHumanContactWindow[] = attack
      ? throwObjectLaunch.held(params.prop, side, release / duration)
      : [];
    return {
      duration,
      ...(!attack
        ? { yields: ["leftArm", "leftHand", "rightArm", "rightHand"] }
        : {}),
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
}
