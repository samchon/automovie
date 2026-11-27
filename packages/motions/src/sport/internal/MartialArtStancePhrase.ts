import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanMartialArt,
  IAutoMovieMotionHumanPlaced,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionManner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanLeg } from "../../compose/internal/AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanPlaced } from "../../compose/internal/AutoMovieMotionHumanPlaced";
import { composeAutoMovieMotionHumanAction } from "../../compose/internal/composeAutoMovieMotionHumanAction";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { lowerHumanPosture } from "../../posture/internal/lowerHumanPosture";
import { StrikingFootPoint } from "../../striking/internal/StrikingFootPoint";
import { StrikingStance } from "../../striking/internal/StrikingStance";
import { StrikingTarget } from "../../striking/internal/StrikingTarget";
import { MartialArtStanceForms } from "./MartialArtStanceForms";
import { martialArtGuardSite } from "./martialArtGuardSite";
import { martialArtStanceClock } from "./martialArtStanceClock";
import { martialArtStanceTurn } from "./martialArtStanceTurn";

/** One side of the body, as the stance names its lead and rear. */
type Side = AutoMovieHumanSide;

/**
 * A lead step into two linked planted weight shifts and a return to entry. The
 * karate form links a front and back stance with a chambered fist and a
 * switching arm path. Tai chi links a forward shift and a rollback with open
 * palms and comparatively quiet torso carriage. The Shotokan stepping study and
 * the tai chi push case study distinguish the movement families. The taekwondo
 * reset turns a bladed, upright stance under a low sparring guard; the Muay
 * Thai reset keeps a square, lower stance under a high guard. The capoeira
 * ginga steps the lead foot back behind the middle of the stance, the third
 * corner of its triangle, and returns; the sumo shiko lifts the foot high to
 * the side and stamps it down wide; the wing chun stance takes a short step
 * under the centreline guard. A guard rises with the lead step, holds through
 * both transfers and lowers on the return. All blocking values are provisional
 * choices for the take.
 *
 * @param context The martial-art law's actual entering pose and body.
 * @param kind Which form phrase to author.
 * @param hold Seconds to hold the second stance before the return.
 * @param manner Timing and extent modifiers from the action's shared manner.
 * @returns The support and arm phrase on a single timeline.
 * @see https://pubmed.ncbi.nlm.nih.gov/34269821/
 * @see https://pmc.ncbi.nlm.nih.gov/articles/PMC1724683/
 */
export function MartialArtStancePhrase(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanMartialArt.IParams>,
  kind: MartialArtStanceForms.Kind,
  hold: number,
  manner: IAutoMovieMotionManner.IModifiers,
): IAutoMovieMotionHumanActionPlan {
  const { body, entry, params } = context;
  const m: typeof body.measure = body.measure;
  const form: MartialArtStanceForms.IForm = MartialArtStanceForms.FORM[kind];
  const karate: boolean = form.arms === "karate";
  const lead: Side = params.lead ?? "left";
  const rear: Side = StrikingStance.rear({ lead });
  const feet: ReturnType<typeof StrikingTarget.feet> =
    StrikingTarget.feet(entry);
  const sole: Record<Side, IAutoMovieVector3> = {
    left: HumanFoot.offset(body, "left", "ball"),
    right: HumanFoot.offset(body, "right", "ball"),
  };
  const start: IAutoMovieMotionHumanPosture = entry.posture;
  const axis: IAutoMovieMotionHumanFrame = {
    origin: feet[rear].ankle,
    yaw: start.yaw,
  };
  const oldLead: IAutoMovieVector3 = HumanFrame.local(axis, feet[lead].ankle);
  // The ginga steps back to its triangle's third corner; the shiko widens.
  const reach: number = form.stride * m.stature * manner.extent;
  const finish: IAutoMovieMotionHumanFoot.IPlacement = {
    ankle: HumanFrame.point(axis, {
      ...oldLead,
      x: form.lateral
        ? oldLead.x + (lead === "left" ? reach : -reach)
        : oldLead.x / (form.stride < 0 ? 2 : 1),
      z:
        form.stride < 0
          ? reach
          : form.lateral
            ? oldLead.z
            : Math.max(oldLead.z, reach),
    }),
    rotation: HumanFoot.rotation(
      start.yaw,
      HumanFoot.pitch(feet[lead].rotation),
    ),
  };
  const clock: IAutoMovieMotionClock = martialArtStanceClock(
    form,
    hold,
    manner,
  );

  const open: (seconds: number) => number =
    AutoMovieMotionClock.prepareEnvelope(
      clock,
      ["start", "ready"],
      ["relax", "end"],
    );
  const fore: ReturnType<typeof AutoMovieMotionClock.prepare> =
    AutoMovieMotionClock.prepare(clock, "strokeStart", "stroke");
  const back: ReturnType<typeof AutoMovieMotionClock.prepare> =
    AutoMovieMotionClock.prepare(clock, "stroke", "strokeEnd");
  const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
    start: clock.at("start"),
    ready: clock.at("ready"),
    relax: clock.at("relax"),
    end: clock.at("end"),
  };
  const contact: IAutoMovieMotionHumanContactWindow[] = [
    {
      part: `${rear}Foot`,
      kind: "plant",
      from: 0,
      to: 1,
      support: { kind: "ground" },
    },
    {
      part: `${lead}Foot`,
      kind: "plant",
      from: span.ready / clock.duration,
      to: span.relax / clock.duration,
      support: { kind: "ground" },
    },
  ];
  const legs: IAutoMovieMotionHumanPrimitive = {
    channels: ["root", "trunk", "leftLeg", "rightLeg"],
    from: 0,
    to: clock.duration,
    write: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      _before?: IAutoMovieMotionHumanPrimitive.Reader,
      resolution?: Parameters<typeof lowerHumanPosture>[3],
    ): IAutoMovieMotionHumanPosture => {
      const shown: number = open(seconds);
      const advance: number = fore.progress(seconds);
      const recover: number = back.progress(seconds);
      const transfer: number =
        form.weight[0] + form.weight[1] * advance - form.weight[2] * recover;
      // The moving foot points its toes in the air (`StrikingFootPoint`).
      const ankles: ReturnType<typeof StrikingTarget.feet> = {
        ...feet,
        [lead]: StrikingFootPoint(
          body,
          lead,
          AutoMovieMotionHumanLeg.arc(
            feet[lead],
            finish,
            (form.lift ?? 0.025) * m.stature,
            shown,
          ),
          Math.sin(Math.PI * shown),
        ),
      };
      const centre: IAutoMovieVector3 = Vector3.lerp(
        feet[rear].ankle,
        finish.ankle,
        transfer,
      );
      const yaw: number =
        start.yaw + martialArtStanceTurn(form, lead, shown, recover);

      const horizontal: IAutoMovieVector3 = Vector3.lerp(
        posture.root,
        { ...centre, y: posture.root.y },
        shown,
      );
      const sink: number = StrikingStance.sink(
        body,
        centre,
        yaw,
        {
          left: feet.left.ankle,
          right: feet.right.ankle,
          [lead]: finish.ankle,
        },
        form.knee,
      );
      const joints: IAutoMovieMotionHumanPosture["joints"] =
        StrikingStance.facing(posture.joints, yaw - start.yaw);
      const goals: ReturnType<typeof StrikingStance.legs> = StrikingStance.legs(
        body,
        ankles,
        {
          left: rear === "left" || shown === 0 || shown === 1,
          right: rear === "right" || shown === 0 || shown === 1,
        },
      );

      // These forms bear on the visible sole. The generic striking goals
      // lock the MTP joint above it, so an ankle rotated by the range fit
      // can leave that joint fixed while shifting the ball on the floor.
      for (const side of ["left", "right"] as const) {
        const key = `${side}Leg` as const;
        const goal = goals[key];
        if (goal?.planted) goals[key] = { ...goal, contact: sole[side] };
      }
      const minimumKnee: number =
        lowerHumanPosture.KNEE + shown * (form.knee - lowerHumanPosture.KNEE);
      return lowerHumanPosture(
        body,
        {
          ...posture,
          root: {
            ...horizontal,
            y: horizontal.y + Math.min(0, sink - start.root.y) * shown,
          },
          yaw,
          joints,
          limbs: { ...posture.limbs, ...goals },
        },
        minimumKnee,
        resolution,
      );
    },
  };
  const primitives: IAutoMovieMotionHumanPrimitive[] = [legs];
  const guard: MartialArtStanceForms.IGuard | undefined =
    form.arms === "highGuard" ||
    form.arms === "lowGuard" ||
    form.arms === "centreline"
      ? MartialArtStanceForms.GUARDS[form.arms]
      : undefined;
  const fist: boolean = karate || guard !== undefined;
  const sides: readonly Side[] = ["left", "right"];
  for (const side of sides)
    primitives.push(
      ...AutoMovieMotionHumanPlaced.arm({
        body,
        side,
        from: 0,
        to: clock.duration,
        span,
        // The clock is the law's own, lengthened by a slower tempo.
        together: AutoMovieMotionHumanArm.together(
          context.handover,
          true,
          context.tempo,
        ),
        rest: AutoMovieMotionHumanArm.angles(entry.pose, side),
        weight: open,
        surface: fist ? "fist" : "palm",
        shape: fist ? "fist" : "flat",
        bend: fist ? "tucked" : "front",
        place: (
          posture: IAutoMovieMotionHumanPosture,
          seconds: number,
          resolution?: Parameters<
            IAutoMovieMotionHumanActionPlan["posture"]
          >[2],
        ): ReturnType<IAutoMovieMotionHumanPlaced.IArm["place"]> => {
          // Hand sites ride the lowering torso. The shared grid's standing
          // heights would lift the hands relative to the shoulders as the
          // stance sinks, especially when the fist leaves the waist chamber.
          const frame: IAutoMovieMotionHumanFrame = {
            origin: AutoMovieMotionHumanPlaced.joint(
              body,
              posture,
              `${side}UpperArm`,
              resolution,
            ),
            yaw: posture.yaw,
          };
          const arm: number = m.upperArm + m.forearm;
          const outward: number = side === "left" ? 1 : -1;
          const facing: IAutoMovieVector3 = HumanFrame.point(
            { ...frame, origin: { x: 0, y: 0, z: 0 } },
            { x: 0, y: 0, z: 1 },
          );

          // A guard holds one site from the lead step to the return; the
          // weight raises and lowers it (`martialArtGuardSite`).
          if (guard !== undefined)
            return {
              point: HumanFrame.point(
                frame,
                martialArtGuardSite(
                  side === lead ? guard.lead : guard.rear,
                  side,
                  m,
                ),
              ),
              facing,
            };
          const near: IAutoMovieVector3 = {
            x: (karate ? 0.75 : -0.5) * outward * m.forearmRadius,
            y: (karate ? -0.72 : -0.34) * m.upperArm,
            z: (karate ? 0.25 : 0.32) * arm,
          };
          const far: IAutoMovieVector3 = {
            x: (karate ? -0.5 : 0) * outward * m.forearmRadius,
            y: -0.22 * m.upperArm,
            z: (karate ? 0.62 : 0.65) * arm,
          };
          const advance: number = fore.progress(seconds);
          const recover: number = back.progress(seconds);
          const swing: number = karate
            ? side === lead
              ? 1 - recover
              : recover
            : advance * (1 - recover);
          const rollBack: number = karate
            ? 0
            : outward * 4 * recover * (1 - recover) * m.forearmRadius;
          const site: IAutoMovieVector3 = Vector3.lerp(near, far, swing);
          return {
            point: HumanFrame.point(frame, { ...site, x: site.x + rollBack }),
            facing,
            ...(karate ? {} : { forward: { x: 0, y: 1, z: 0 } }),
          };
        },
      }),
    );
  return composeAutoMovieMotionHumanAction({
    base: AutoMovieMotionHumanBase.still(clock.duration, start, contact),
    clock,
    primitives,
  });
}
