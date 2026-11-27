import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTravelCarExit,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { HumanSupportFrame } from "../../carrier/internal/HumanSupportFrame";
import { AutoMovieMotionInterval } from "../../compose/internal/AutoMovieMotionInterval";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { rise } from "../../everyday/internal/rise";
import { seated } from "../../everyday/internal/seated";
import { sitPlace } from "../../everyday/internal/sitPlace";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { HumanMount } from "./HumanMount";
import { admitCarExitSill } from "./admitCarExitSill";
import { carExitAnkleAt } from "./carExitAnkleAt";
import { verifyCarExitSill } from "./verifyCarExitSill";

/**
 * Static rear-seat egress via the adjacent, already-open door. Shippen (2012,
 * IJTTE 2:107–117) studied occupants leaving the rear seat through the nearest
 * door and measured lumbar flexion, lateral bending and axial rotation. This
 * provisional staging uses a seated turn and staggered ground placements
 * followed by the existing sit-to-stand law.
 * https://pure.coventry.ac.uk/ws/portalfiles/portal/4013131/shippen2comb.pdf
 */
export namespace HumanTravelCarExit {
  /**
   * Turn and move to the bench edge, pass each foot over the sill, then rise on
   * the exterior floor. Refuses loss of seat support, an opening too narrow or
   * low at seat-off, or a final stance inside. The author supplies the opening
   * clearance, turn timing, landing offset and flexion. The pelvis rocks back
   * about the supported seat socket through the two sill crossings, and the
   * spine completes its duck before the last one.
   */
  export const getOut: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanTravelCarExit.IParams> =
    {
      name: "getOut",
      interrupts: {},
      yields: ["leftHand", "rightHand", "leftArm", "rightArm"],
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTravelCarExit.IParams>,
      ): IAutoMovieMotionHumanActionPlan => {
        const { body, entry, params }: typeof context = context;
        const {
          bench,
          through,
          width,
          floor,
          clearance: gap,
          landingDistance,
          duckDegrees,
          turnSeconds,
          stagger,
          liftShare,
        }: typeof params = params;
        if (
          !(
            width > 0 &&
            gap >= 0 &&
            bench.depth > 2 * gap &&
            landingDistance > 0 &&
            duckDegrees >= 0 &&
            turnSeconds > 0 &&
            stagger >= 0 &&
            stagger < 1 &&
            liftShare > 0 &&
            liftShare < 0.5
          )
        )
          throw new HumanRefusal({
            kind: "parameter",
            axis: "getOut",
            value: params,
            reason:
              "the seated turn requires valid dimensions, flexion and phase controls",
            fix: "use the authored bounds for the bench and turn controls",
          });
        const start: IAutoMovieVector3 = seated.socket(body, entry.posture);
        const local: IAutoMovieVector3 = HumanFrame.local(
          { origin: bench.at, yaw: bench.yaw },
          start,
        );
        const inset: number = body.measure.thighRadius;
        if (
          entry.base.kind !== "seated" ||
          !entry.supports.some(
            (s: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
              s.kind === "seat",
          ) ||
          Math.abs(local.y) > gap ||
          Math.abs(local.x) > width / 2 ||
          local.z < -bench.depth ||
          local.z > 0
        )
          throw new HumanRefusal({
            kind: "base",
            axis: "seat",
            value: entry.base.kind,
            reason: "rear egress starts supported by the given bench",
            fix: "start seated on the rear bench",
          });

        const across: IAutoMovieVector3 = through.across;
        const normal: IAutoMovieVector3 = { x: across.z, y: 0, z: -across.x };
        const out: IAutoMovieVector3 =
          Vector3.dot(Vector3.subtract(start, through.at), normal) > 0
            ? Vector3.scale(normal, -1)
            : normal;
        const outward = (point: IAutoMovieVector3): number =>
          Vector3.dot(Vector3.subtract(point, through.at), out);
        const along = (point: IAutoMovieVector3): number =>
          Vector3.dot(Vector3.subtract(point, through.at), across);
        const targetYaw: number = (Math.atan2(out.x, out.z) * 180) / Math.PI;
        const delta: number = targetYaw - entry.posture.yaw;
        const turn: number = delta - 360 * Math.round(delta / 360);
        const yaw: number = entry.posture.yaw + turn;
        const clearance: number = body.measure.chestBreadth + 2 * gap;
        if (through.width < clearance || width <= 2 * inset)
          throw new HumanRefusal({
            kind: "reach",
            axis: "aperture",
            value: through.width,
            feasible: {
              kind: "range",
              unit: "m",
              minimum: clearance,
              maximum: null,
            },
            reason: "the door and the bench must accommodate the seated turn",
            fix: "use a wider door or bench",
          });

        // Set the seat socket along the door centerline as far as the cushion permits.
        const frame: IGetOutFrame = {
          origin: bench.at,
          yaw: bench.yaw,
        };
        const opening: IAutoMovieVector3 = HumanFrame.local(frame, through.at);
        const edge: IAutoMovieVector3 = HumanFrame.point(frame, {
          x: Math.sign(opening.x) * (width / 2 - inset),
          y: 0,
          z: Math.max(-bench.depth + gap, Math.min(-gap, opening.z)),
        });
        const needed: number = clearance + 2 * Math.abs(along(edge));
        if (needed > through.width)
          throw new HumanRefusal({
            kind: "reach",
            axis: "aperture",
            value: through.width,
            feasible: {
              kind: "range",
              unit: "m",
              minimum: needed,
              maximum: null,
            },
            reason:
              "the supported seat position does not align with the usable opening",
            fix: "use a wider adjacent opening",
          });

        const ankleY: number = floor + body.measure.ankleHeight;
        const stance: IAutoMovieVector3 = {
          ...Vector3.add(
            edge,
            Vector3.scale(out, -outward(edge) + landingDistance),
          ),
          y: ankleY,
        };
        const level = (side: AutoMovieHumanSide): IAutoMovieVector3 =>
          HumanFrame.point(
            { origin: stance, yaw },
            {
              x: body.rest.get(`${side}Foot`)!.x,
              y: 0,
              z: 0,
            },
          );
        const ankles: Ankles = { left: level("left"), right: level("right") };
        const support: IAutoMovieMotionHumanContactWindow.Support =
          entry.supports.find(
            (s: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
              s.kind === "seat",
          )!.support;
        const poseAtEdge: IAutoMovieMotionHumanPosture = {
          ...entry.posture,
          root: seated.root(body, edge, {
            yaw,
            pitch: entry.posture.pitch,
            roll: entry.posture.roll,
          }),
          yaw,
          limbs: {},
        };
        poseAtEdge.limbs = stand.legs(body, poseAtEdge.root, yaw, ankles);
        const planted = (side: AutoMovieHumanSide): Feet["left"] => ({
          ...entry.feet[side],
          ankle: ankles[side],
          rotation: poseAtEdge.limbs[`${side}Leg`]!.rotation!,
          planted: true,
        });
        const { from: _previous, ...atBench }: IAutoMovieMotionHumanEntryState =
          entry;
        const up: IAutoMovieMotionHumanActionPlan = rise.plan({
          ...context,
          params: {},
          entry: {
            ...atBench,
            posture: poseAtEdge,
            pose: resolveHumanPosture(body, poseAtEdge),
            feet: { left: planted("left"), right: planted("right") },
            supports: [
              { part: "seat", kind: "seat", support },
              { part: "leftFoot", kind: "plant", support: { kind: "ground" } },
              { part: "rightFoot", kind: "plant", support: { kind: "ground" } },
            ],
          },
        });

        // Rise can flatten a displayed foot around its sole contact. Land on
        // its resulting stance so that transfer does not refit a planted foot.
        const riseEntry: IAutoMovieMotionHumanPosture = up.posture(0);

        // The outward knee leads and the second foot lands just before the rise.
        const lead: AutoMovieHumanSide = turn > 0 ? "left" : "right";
        const timing: Record<AutoMovieHumanSide, readonly [number, number]> = {
          left: lead === "left" ? [0, 1 - stagger] : [stagger, 1],
          right: lead === "right" ? [0, 1 - stagger] : [stagger, 1],
        };
        const prepare: number = turnSeconds * (context.tempo ?? 1);
        const duration: number = prepare + up.duration;
        const starts: Record<AutoMovieHumanSide, HumanMount.IFoot> = {
          left: HumanMount.held(entry, "left"),
          right: HumanMount.held(entry, "right"),
        };
        const sill: Ankles = admitCarExitSill({
          starts,
          landing: riseEntry,
          through,
          gap,
          outward,
          along,
        });

        const seatOff: number =
          up.events.find(
            (e: IAutoMovieMotionEvent): boolean => e.name === "seatOff",
          )!.share * up.duration;
        const ducked = (
          p: IAutoMovieMotionHumanPosture,
          amount: number,
        ): IAutoMovieMotionHumanPosture => {
          const spine: readonly [number, number, number] = p.joints.spine ?? [
            0, 0, 0,
          ];
          return {
            ...p,
            joints: {
              ...p.joints,
              spine: [spine[0] + amount, spine[1], spine[2]],
            },
          };
        };
        // Keep the seat socket on its sliding course while the pelvis rocks
        // back into the seated lean to open the hips for the raised ankles.
        const firstSill: number = (1 - stagger) / 2;
        const lastSill: number = (1 + stagger) / 2;
        const leaned: number = Math.min(
          entry.posture.pitch,
          sitPlace.BACKS.lean.pitch,
        );
        const posture = (time: number): IAutoMovieMotionHumanPosture => {
          if (time <= 0) return entry.posture;
          if (time >= prepare) {
            const elapsed: number = Math.min(up.duration, time - prepare);
            const held: number =
              1 -
              AutoMovieMotionInterval.progress(seatOff, up.duration, elapsed);
            return ducked(up.posture(elapsed), duckDegrees * held);
          }
          const u: number = time / prepare;
          const share: number = AutoMovieEngineMotionSampling.minimumJerkShare(u);
          const heading: number = entry.posture.yaw + turn * share;
          const rock: number =
            AutoMovieEngineMotionSampling.minimumJerkShare(u / firstSill) *
            AutoMovieEngineMotionSampling.minimumJerkShare((1 - u) / (1 - lastSill));
          const pitch: number =
            entry.posture.pitch + (leaned - entry.posture.pitch) * rock;
          const root: IAutoMovieVector3 = seated.root(
            body,
            Vector3.lerp(start, edge, share),
            {
              yaw: heading,
              pitch,
              roll: entry.posture.roll,
            },
          );
          const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
          for (const side of ["left", "right"] as const) {
            const [from, to]: readonly [number, number] = timing[side];
            const phase: number = Math.min(
              1,
              Math.max(0, (u - from) / (to - from)),
            );
            const initial: HumanMount.IFoot = starts[side];
            const part: GetOutPosturePart = `${side}Leg`;
            const landed: IAutoMovieHumanLimbGoal = riseEntry.limbs[part]!;
            if (u >= to) {
              limbs[part] = landed;
              continue;
            }
            if (u <= from && entry.feet[side].planted) {
              const contact: IAutoMovieVector3 | undefined =
                entry.posture.limbs[part]?.contact;
              limbs[part] = {
                point: initial.ankle,
                bend: initial.bend,
                rotation: entry.feet[side].rotation,
                planted: true,
                ...(contact === undefined ? {} : { contact }),
              };
              continue;
            }

            const flight: number = AutoMovieEngineMotionSampling.minimumJerkShare(phase);
            limbs[part] = {
              point: carExitAnkleAt(
                initial.ankle,
                sill[side],
                landed.point,
                through.at.y + body.measure.ankleHeight + gap,
                phase,
                liftShare,
              ),
              bend: Vector3.lerp(initial.bend, landed.bend, flight),
              rotation: Quaternion.slerp(
                entry.feet[side].rotation,
                landed.rotation!,
                flight,
              ),
              planted: false,
            };
          }
          return ducked(
            { ...entry.posture, root, yaw: heading, pitch, limbs },
            duckDegrees * AutoMovieEngineMotionSampling.minimumJerkShare(u / lastSill),
          );
        };

        verifyCarExitSill(
          context,
          posture,
          prepare,
          (["left", "right"] as const).flatMap(
            (side: AutoMovieHumanSide): number[] => {
              const [from, to]: readonly [number, number] = timing[side];
              return [0, liftShare, 0.5, 1 - liftShare, 1].map(
                (phase: number): number =>
                  prepare * (from + (to - from) * phase),
              );
            },
          ),
        );

        // The transfer puts the crown near the header while the hips leave the bench.
        const crown: IAutoMovieVector3 = HumanTrunk.region(
          body,
          posture(prepare + seatOff),
          "crown",
        ).point;
        const excess: number = crown.y - (through.at.y + through.height);
        if (Math.abs(outward(crown)) <= body.measure.thighRadius && excess > 0)
          throw new HumanRefusal({
            kind: "reach",
            axis: "aperture",
            value: through.height,
            feasible: {
              kind: "range",
              unit: "m",
              minimum: through.height + excess,
              maximum: null,
            },
            reason: "the crown is above the header at seat-off",
            fix: "author more flexion or use a higher rear opening",
          });
        const end: IAutoMovieMotionHumanPosture = posture(duration);
        const exterior: number = Math.min(
          outward(end.root),
          outward(end.limbs.leftLeg!.point),
          outward(end.limbs.rightLeg!.point),
        );
        if (exterior <= 0)
          throw new HumanRefusal({
            kind: "base",
            axis: "aperture",
            value: exterior,
            reason: "the standing balance point remains inside the door",
            fix: "use a bench nearer the opening or an exit with a freer exterior stance",
          });

        const share = (p: number): number =>
          (prepare + p * up.duration) / duration;
        const contacts: IAutoMovieMotionHumanContactWindow[] = up.contacts.map(
          (
            c: IAutoMovieMotionHumanContactWindow,
          ): IAutoMovieMotionHumanContactWindow => ({
            ...c,
            from: c.part === "seat" ? 0 : share(c.from),
            to: share(c.to),
          }),
        );
        for (const side of ["left", "right"] as const) {
          const [from, to]: readonly [number, number] = timing[side];
          const part: GetOutPart = `${side}Foot`;
          if (from > 0 && entry.feet[side].planted)
            contacts.push({
              part,
              kind: "plant",
              from: 0,
              to: (from * prepare) / duration,
              support: HumanSupportFrame.contact(context, part),
            });
          const landing: IAutoMovieMotionHumanContactWindow | undefined =
            contacts.find(
              (c: IAutoMovieMotionHumanContactWindow): boolean =>
                c.part === part && c.from === share(0),
            );
          if (landing !== undefined) landing.from = (to * prepare) / duration;
        }
        const events: IAutoMovieMotionEvent[] = up.events.map(
          (e: IAutoMovieMotionEvent): IAutoMovieMotionEvent => ({
            ...e,
            share: share(e.share),
          }),
        );
        const cross = (side: AutoMovieHumanSide): number =>
          (((timing[side][0] + timing[side][1]) / 2) * prepare) / duration;
        events.unshift(
          { name: "leadSill", share: cross(lead) },
          {
            name: "trailSill",
            share: cross(lead === "left" ? "right" : "left"),
          },
          { name: "feetOutside", share: prepare / duration },
        );
        return { duration, events, contacts, base: up.base, posture };
      },
    };
}

/** A quiet placement of both feet. */
type Feet = IAutoMovieMotionHumanEntryState["feet"];

/** The two ankle goal points used by the shared standing stance. */
type Ankles = Record<AutoMovieHumanSide, IAutoMovieVector3>;
/** The alternatives of `GetOutPart`'s site. */
type GetOutPart = "leftFoot" | "rightFoot";

/** The alternatives of `GetOutPosturePart`'s site. */
type GetOutPosturePart = "leftLeg" | "rightLeg";

/** The record of `IGetOutFrame`'s site. */
type IGetOutFrame = { origin: IAutoMovieVector3; yaw: number };
