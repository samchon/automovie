import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieMotionHumanWeaponHeld,
  IAutoMovieMotionHumanWeaponPresent,
  IAutoMovieMotionPropDrive,
  IAutoMovieMotionPropLaunch,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanSupportFrame } from "../../carrier/internal/HumanSupportFrame";
import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionManner } from "../../compose/internal/AutoMovieMotionManner";
import { courseArmGoal } from "../../compose/internal/courseArmGoal";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { HumanSkill } from "../../skill/internal/HumanSkill";
import { StrikingBlade } from "../../striking/internal/StrikingBlade";
import { StrikingHeld } from "../../striking/internal/StrikingHeld";
import { HumanWeaponHeld } from "./HumanWeaponHeld";
import { HumanWeaponPresent } from "./HumanWeaponPresent";
import { HumanWeaponPresentOnChest } from "./HumanWeaponPresentOnChest";
import { HumanWeaponPresentPlacedElbows } from "./HumanWeaponPresentPlacedElbows";
import { humanWeaponFireRecoil } from "./humanWeaponFireRecoil";

/*
 * Fire one shot from where the weapon is held: the trigger breaks at
 * `strokeStart` (the decisive instant), the recoil peaks at `stroke`, and the
 * weapon is back where it was held at the end.
 */
export const HumanWeaponPresentFire: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanWeaponPresent.IWield> =
  {
    name: "fireWeapon",
    interrupts: StrikingHeld.follows("relax"),
    overlay: true,
    plan: (
      context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWeaponPresent.IWield>,
    ): IAutoMovieMotionHumanActionPlan => {
      const s: IAutoMovieMotionHumanWeaponHeld.ISetup = HumanWeaponHeld.setup(
        context,
        HumanWeaponHeld.held(context),
      );
      const bones: ReturnType<typeof poseBones> = poseBones(
        context.body,
        context.entry.pose,
      );
      const entered: IAutoMovieMotionHumanStrikingHeld.IHandFrame = {
        point: HumanHand.frame(context.body, bones, s.tool.side, "grip").point,
        rotation: bones.get(`${s.tool.side}Hand`)!.worldRotation,
      };
      // Over a carrier the hand is laid on the chest the carrier holds at
      // the shot's own start, kept where the entry put it on the chest, so
      // a moving support never leaves the shot's hand behind; on foot it is
      // the entry's own.
      const held: IAutoMovieMotionHumanStrikingHeld.IHandFrame =
        context.carrier === undefined
          ? entered
          : HumanWeaponPresentOnChest(
              entered,
              bones.get("chest")!,
              poseBones(
                context.body,
                resolveHumanPosture(context.body, context.carrier.posture(0)),
              ).get("chest")!,
            );
      const rise: number = HumanSkill.quantity(
        context.skill,
        "recovery",
        HumanWeaponPresent.RISE[0],
        HumanWeaponPresent.RISE[1],
      );
      const recoil: humanWeaponFireRecoil.IRecoil = humanWeaponFireRecoil(
        held.rotation,
        s.tool.axis,
        s.tool.edge,
        rise,
      );
      const { bore, about } = recoil;
      const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
        AutoMovieMotionClock.phrase({
          prepare: 0,
          wait: HumanWeaponPresent.SHOT.press,
          attack: HumanWeaponPresent.SHOT.rise,
          retract: HumanWeaponPresent.SHOT.recover,
        }),
        AutoMovieMotionManner(context, context.params.manner),
      );
      const shot: IAutoMovieMotionHumanActionPlan = StrikingBlade.plan(
        context,
        {
          tool: s.tool,
          clock,
          path: (
            progress: number,
          ): IAutoMovieMotionHumanStrikingHeld.IHandFrame => ({
            point: held.point,
            rotation: recoil.turned(progress),
          }),
          back: s.tool.length,
          support: s.support,
          advance: "none",
          line: { x: 0, y: 0, z: 1 },
          stay: false,
          stop: 1,
          decisive: "strokeStart",
          kept: true,
        },
      );

      // The trigger is pressed to its full travel by the break and springs
      // back by the end, on the clock's minimum-jerk envelope.
      const trigger: IAutoMovieAffordance | undefined =
        context.params.gun === undefined
          ? undefined
          : (context.prop(context.params.gun).prop.affordances ?? []).find(
              (a: IAutoMovieAffordance): boolean => a.kind === "trigger",
            );
      const full: number | undefined = trigger?.travel;
      const drives: IAutoMovieMotionPropDrive[] =
        trigger === undefined || full === undefined
          ? []
          : [
              {
                prop: context.params.gun!,
                articulation: trigger.id,
                from: 0,
                to: 1,
                travel: (seconds: number): number =>
                  full *
                  clock.envelope(
                    ["start", "strokeStart"],
                    ["strokeEnd", "end"],
                    seconds,
                  ),
              },
            ];

      // The shot leaves the muzzle along the bore, its direction drawn
      // inside the declared dispersion's cone from the shooter's own stream
      // (uniform over the cone's disc), at the break plus the lock's time,
      // with the support's velocity added.
      const fired: IAutoMovieMotionHumanWeaponPresent.IWield["shot"] =
        context.params.shot;
      const launches: IAutoMovieMotionPropLaunch[] = [];
      if (fired !== undefined) {
        const random: ReturnType<typeof context.random> =
          context.random("dispersion");
        const off: number =
          HumanWeaponPresent.DISPERSION * Math.sqrt(random.float(0));
        const around: number = 360 * random.float(1);
        const square: IAutoMovieVector3 = Quaternion.rotateVector(
          Quaternion.fromAxisAngle(bore, around),
          about,
        );
        const direction: IAutoMovieVector3 = Quaternion.rotateVector(
          Quaternion.fromAxisAngle(square, off),
          bore,
        );
        const seconds: number = clock.at("strokeStart") + (fired.lock ?? 0);
        launches.push({
          prop: fired.prop,
          seconds,
          point: Vector3.add(
            held.point,
            Quaternion.rotateVector(held.rotation, s.tool.tip),
          ),
          velocity: Vector3.add(
            Vector3.scale(direction, fired.speed),
            HumanSupportFrame.at(context, context.start + seconds).velocity,
          ),
          attitude: { kind: "velocity" },
        });
      }
      const shooting: IAutoMovieMotionHumanActionPlan = HumanWeaponHeld.carried(
        context,
        s,
        {
          ...shot,
          ...(drives.length === 0 ? {} : { drives }),
          ...(launches.length === 0 ? {} : { launches }),
        },
      );
      if (s.support === null) return shooting;
      // Two hands on one weapon ride the shot in one course, the hands on
      // it excused from each other, so neither arm is refitted at each
      // instant and both stay rigid on the weapon through the recoil.
      const other: AutoMovieHumanSide =
        s.tool.side === "left" ? "right" : "left";
      return courseArmGoal({
        context,
        plan: HumanWeaponPresentPlacedElbows(
          context.body,
          shooting,
          s.tool.side,
        ),
        side: s.tool.side,
        grasp: ["hand"],
        span: {
          start: 0,
          ready: Math.min(clock.at("strokeStart"), shooting.duration),
          relax: shooting.duration,
          end: shooting.duration,
        },
        // The clock is the law's own, lengthened by a slower tempo.
        together: AutoMovieMotionHumanArm.together(
          context.handover,
          true,
          context.tempo,
        ),
        with: [
          {
            side: other,
            grasp: ["hand"],
          },
        ],
      });
    },
  };
