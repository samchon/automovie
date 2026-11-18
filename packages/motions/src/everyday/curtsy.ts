import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanCurtsy,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanSupportFrame } from "../carrier/HumanSupportFrame";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanRoot } from "../compose/AutoMovieMotionHumanRoot";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/** Positional tolerance for a solved ankle or sole, in metres. */
const FIT: number = 0.006;

/**
 * A small ceremonial curtsy. The Royal Household describes a small curtsy
 * as a traditional optional greeting (https://www.royal.uk/encyclopedia/greeting-the-king-and-queen).
 * Canadian Heritage describes placing the right foot behind the left heel
 * and bending the knees slightly (https://www.canada.ca/en/canadian-heritage/services/meeting-royal-family.html).
 * Melinda Coy's 2019 Practical Etiquette guide for Dickens Fair performers
 * teaches a rear step and a flat-footed dip
 * (https://static1.squarespace.com/static/5bae69697fdcb819deb44456/t/68e2f5d69da9b523c4d22f95/1759704534424/Practical%2BEtiquette.pdf).
 * The performer transfers onto one leg, sets the other foot across and
 * behind it, dips with both feet grounded, rises, then uncrosses and
 * restores the entry stance. The depth, phase durations and step margins
 * are provisional staging choices.
 *
 * This floor variant uses flat feet in the dip. The heel and toes stay on
 * the floor in each plant. The law refuses a body or stance whose solved
 * feet fail the plant, clearance or reach checks at the key poses and the
 * intervening witnesses. The arms, hands and head are available for layers.
 *
 * Register with HumanChain.extend({ curtsy }) and HumanPerformance's laws.
 * Enter from standing and cut into another action only after recovery.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the sequence, support, source, provisional parameters, fit and registration.
 * @evidence contracts/development/design.md#principled-representation Plans one reversible floor motion with a shared clock, root excursion and world foot placements.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes a single registered law with the crossing side, depth and time as inputs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Derives the landing and clearance from measured soles and audits resolved feet independently of the IK goals.
 */
export const curtsy: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanCurtsy> =
  {
    name: "curtsy",
    accepts: {
      stand: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
    },
    interrupts: {
      any: [{ window: ["returned", 1], kind: "inertialize", entry: 0 }],
    },
    yields: ["head", "leftArm", "rightArm", "leftHand", "rightHand"],
    plan,
  };

/** Plan a single curtsy and reject key poses that fail the displayed foot fit. */
function plan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCurtsy>,
): IAutoMovieMotionHumanActionPlan {
  const { body, entry, params } = context;
  const depth: number = HumanBound.within(
    "depth",
    params.depth ?? 0.045,
    0,
    0.08,
    "hip heights",
    "minimum",
  );
  const duration: number = HumanBound.above(
    "seconds",
    params.seconds ?? 1.8 * Math.sqrt(body.measure.hipHeight / 0.93),
    0,
    "s",
  );
  const rear: AutoMovieHumanSide = params.side ?? "right";
  if (rear !== "left" && rear !== "right")
    throw new HumanRefusal({
      kind: "parameter",
      axis: "side",
      value: rear,
      feasible: { kind: "alternatives", values: ["left", "right"] },
      reason: "the curtsy needs a left or right crossing foot",
      fix: "choose left or right",
    });
  const lead: AutoMovieHumanSide = rear === "right" ? "left" : "right";
  const front: IAutoMovieMotionHumanFoot.IPlacement = entry.feet[lead];
  const rearEntry: IAutoMovieMotionHumanFoot.IPlacement = entry.feet[rear];
  const frame: IAutoMovieMotionHumanFrame = {
    origin: entry.posture.root,
    yaw: entry.posture.yaw,
  };
  const frontLocal: IAutoMovieVector3 = HumanFrame.local(frame, front.ankle);
  const rearLocal: IAutoMovieVector3 = HumanFrame.local(frame, rearEntry.ankle);
  const frontSole: IAutoMovieVector3[] = HumanFoot.sole(body, lead, front);
  const rearSole: IAutoMovieVector3[] = HumanFoot.sole(body, rear, rearEntry);
  const entryBones: ReturnType<typeof poseBones> = poseBones(body, entry.pose);
  const sockets: IAutoMovieMotionHumanFoot.ISocket[] = [
    ...HumanFoot.sockets(body, entryBones, lead),
    ...HumanFoot.sockets(body, entryBones, rear),
  ];
  const floor: number = Math.min(
    ...sockets.map(
      (socket: IAutoMovieMotionHumanFoot.ISocket): number => socket.point.y,
    ),
  );
  const leadSign: number = lead === "left" ? 1 : -1;

  if (
    entry.base.kind !== "standing" ||
    (frontLocal.x - rearLocal.x) * leadSign <= 0 ||
    !([lead, rear] as const).every(
      (side: AutoMovieHumanSide): boolean =>
        entry.feet[side].planted &&
        HumanSupportFrame.contact(context, `${side}Foot`).kind === "ground",
    ) ||
    sockets.some(
      (socket: IAutoMovieMotionHumanFoot.ISocket): boolean =>
        socket.point.y - floor > FIT,
    )
  )
    throw new HumanRefusal({
      kind: "base",
      axis: "base",
      value: entry.base.kind,
      feasible: {
        kind: "alternatives",
        values: ["uncrossed flat-foot stance"],
      },
      reason: "a curtsy starts with uncrossed feet flat on the ground",
      fix: "establish a flat-foot standing stance before the curtsy",
    });

  // Put the rear toe behind the lead heel with room for the crossing arc.
  const frontZ: number[] = frontSole.map(
    (point: IAutoMovieVector3): number => HumanFrame.local(frame, point).z,
  );
  const rearZ: number[] = rearSole.map(
    (point: IAutoMovieVector3): number => HumanFrame.local(frame, point).z,
  );
  const rearToe: number = Math.max(...rearZ);
  const length: number = rearToe - Math.min(...rearZ);
  const crossed: IAutoMovieMotionHumanFoot.IPlacement = {
    ankle: HumanFrame.point(frame, {
      x: frontLocal.x + leadSign * 0.1 * length,
      y: rearLocal.y,
      z: rearLocal.z + Math.min(...frontZ) - rearToe - 0.15 * length,
    }),
    rotation: rearEntry.rotation,
  };

  // Shift the pelvis to the lead foot before lifting the other foot.
  const transfer: IAutoMovieVector3 = {
    x: frontLocal.x,
    y: 0,
    z: 0.75 * Math.min(...frontZ) + 0.25 * Math.max(...frontZ),
  };
  const approach: IAutoMovieVector3 = {
    ...transfer,
    z: transfer.z - 0.2 * length,
  };

  // Fit the shifted standing height separately from the landing height so
  // the pelvis lowers for the rear footprint only once the foot leaves.
  const reach = (
    offset: IAutoMovieVector3,
    trailing: IAutoMovieMotionHumanFoot.IPlacement,
  ): number => {
    const carried: IAutoMovieMotionHumanPosture =
      AutoMovieMotionHumanRoot.place(entry.posture, { point: offset, yaw: 0 });
    const ready: IAutoMovieMotionHumanPosture = resolveHumanPosture.lower(
      body,
      {
        ...carried,
        limbs: {
          ...carried.limbs,
          [`${lead}Leg`]: AutoMovieMotionHumanLeg.goal(
            body,
            carried,
            lead,
            front,
            true,
          ),
          [`${rear}Leg`]: AutoMovieMotionHumanLeg.goal(
            body,
            carried,
            rear,
            trailing,
            true,
          ),
        },
      },
    );
    return ready.root.y - carried.root.y;
  };
  const transferDrop: number = reach(transfer, rearEntry);
  const landingDrop: number = reach(approach, crossed);

  const clock: IAutoMovieMotionClock = AutoMovieMotionClock.of(duration, [
    { name: "stepOff", seconds: 0.18 * duration },
    { name: "crossed", seconds: 0.35 * duration },
    { name: "dip", seconds: 0.5 * duration },
    { name: "uncrossOff", seconds: 0.65 * duration },
    { name: "uncrossed", seconds: 0.82 * duration },
    { name: "returned", seconds: duration },
  ]);

  // The return retraces the outward swing. A rearward bow keeps the path
  // farther behind the supporting foot during the lateral crossover.
  const forward: IAutoMovieVector3 = HumanFrame.forward(frame.yaw);
  const stepping = (seconds: number): number =>
    clock.envelope(
      ["stepOff", "crossed"],
      ["uncrossOff", "uncrossed"],
      seconds,
    );
  const traveling = (seconds: number): boolean =>
    (seconds > clock.at("stepOff") && seconds < clock.at("crossed")) ||
    (seconds > clock.at("uncrossOff") && seconds < clock.at("uncrossed"));
  const rearAt = (seconds: number): IAutoMovieMotionHumanFoot.IPlacement => {
    const share: number = stepping(seconds);
    const arc: IAutoMovieMotionHumanFoot.IPlacement =
      AutoMovieMotionHumanLeg.arc(rearEntry, crossed, 0.2 * length, share);
    return {
      ...arc,
      ankle: Vector3.subtract(
        arc.ankle,
        Vector3.scale(forward, length * share * (1 - share)),
      ),
    };
  };
  const plant = (
    side: AutoMovieHumanSide,
    start: string,
    end: string,
  ): IAutoMovieMotionHumanContactWindow => ({
    part: `${side}Foot`,
    kind: "plant",
    from: clock.at(start) / duration,
    to: clock.at(end) / duration,
    support: { kind: "ground" },
  });
  const planned: IAutoMovieMotionHumanActionPlan =
    composeAutoMovieMotionHumanAction({
      clock,
      base: AutoMovieMotionHumanBase.still(duration, entry.posture, [
        plant(lead, "start", "end"),
        plant(rear, "start", "stepOff"),
        plant(rear, "crossed", "uncrossOff"),
        plant(rear, "uncrossed", "end"),
      ]),
      primitives: [
        AutoMovieMotionHumanRoot.travel({
          from: 0,
          to: duration,
          offset: (seconds: number): IAutoMovieMotionHumanRoot.IOffset => {
            const weight: number = clock.envelope(
              ["start", "stepOff"],
              ["uncrossed", "returned"],
              seconds,
            );
            const dip: number = clock.envelope(
              ["crossed", "dip"],
              ["dip", "uncrossOff"],
              seconds,
            );
            const crossing: number = stepping(seconds);
            return {
              yaw: 0,
              point: {
                x: transfer.x * weight,
                y:
                  transferDrop * weight +
                  (landingDrop - transferDrop) * crossing -
                  depth * body.measure.hipHeight * dip,
                z:
                  transfer.z * weight +
                  (approach.z - transfer.z) * crossing -
                  0.3 * length * dip,
              },
            };
          },
        }),
        AutoMovieMotionHumanLeg.plant(
          body,
          clock,
          lead,
          ["start", "end"],
          front,
        ),
        AutoMovieMotionHumanLeg.place({
          body,
          side: rear,
          from: 0,
          to: duration,
          placement: (
            _: IAutoMovieMotionHumanPosture,
            seconds: number,
          ): IAutoMovieMotionHumanFoot.IPlacement => rearAt(seconds),
          planted: (seconds: number): boolean => !traveling(seconds),
        }),
      ],
    });

  // The return retraces the first half. Check each stage boundary and the
  // middle of each stage, using the bones after the rig limits apply.
  const witnesses: number[] = ["start", "stepOff", "crossed", "dip"].map(
    (instant: string): number => clock.at(instant),
  );
  for (let i: number = witnesses.length - 1; i > 0; --i)
    witnesses.push((witnesses[i - 1]! + witnesses[i]!) / 2);
  for (const seconds of witnesses) {
    const sample: IAutoMovieMotionHumanPosture = planned.posture(seconds);
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      resolveHumanPosture(body, {
        ...sample,
        limbs: {
          leftLeg: sample.limbs.leftLeg,
          rightLeg: sample.limbs.rightLeg,
        },
        digits: undefined,
      }),
    );
    if (
      fitsFoot(body, bones, lead, front, floor, false) &&
      fitsFoot(body, bones, rear, rearAt(seconds), floor, traveling(seconds))
    )
      continue;
    throw new HumanRefusal({
      kind: "parameter",
      axis: "depth",
      value: depth,
      reason: `the curtsy does not fit the planted footprints and swing clearance at ${((100 * seconds) / duration).toFixed(1)}% of its duration`,
      fix: "use a shallower dip or start from a narrower flat-foot stance",
    });
  }
  return planned;
}

/** Check the displayed ankle against its target and the displayed sole against the floor. */
function fitsFoot(
  body: IAutoMovieMotionHumanBody,
  bones: ReturnType<typeof poseBones>,
  side: AutoMovieHumanSide,
  target: IAutoMovieMotionHumanFoot.IPlacement,
  floor: number,
  swinging: boolean,
): boolean {
  const ankle: IAutoMovieVector3 = bones.get(`${side}Foot`)!.worldPosition;
  return (
    Vector3.length(Vector3.subtract(ankle, target.ankle)) <= FIT &&
    HumanFoot.sockets(body, bones, side).every(
      (socket: IAutoMovieMotionHumanFoot.ISocket): boolean =>
        socket.point.y >= floor - FIT &&
        (swinging || socket.point.y <= floor + FIT),
    )
  );
}
