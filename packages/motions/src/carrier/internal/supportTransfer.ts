import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSupportCarry,
  IAutoMovieMotionHumanSupportTransfer,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionInterval } from "../../compose/AutoMovieMotionInterval";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanFoot } from "../../posture/HumanFoot";
import { HumanFrame } from "../../posture/HumanFrame";
import { lowerHumanPosture } from "../../posture/internal/lowerHumanPosture";
import { poseBones } from "../../posture/internal/poseBones";
import { HumanSupportCarry } from "../HumanSupportCarry";
import { HumanSupportFrame } from "../HumanSupportFrame";
import { checkSupportTransferDock } from "./checkSupportTransferDock";

/**
 * Plan one staged, level boarding transfer. LA Metro asks passengers to wait
 * for a complete stop before boarding
 * (https://www.metro.net/riding/how-to-ride-metro-rail/). Stationary docking is
 * the default. The co-moving mode stages a scenic gangway whose platforms share
 * upright rigid motion through trailing touchdown. Both soles and the root ride
 * the deck after that touchdown. The dock check samples at intervals of at most
 * 1/120 s, with 1 mm and 0.1 degree tolerances on stationary prop frames or, in
 * co-moving mode, relative deck alignment at its centre and corners.
 *
 * The lead sole lands while the trail sole bears on the platform. The deck and
 * platform must be level within 2 mm. Provisional staging limits are a 0.13 m
 * projected gap, 0.45 hip heights of ankle travel and a 65 mm lift. Articulated
 * surfaces, unsampled track excursions and obstacles between the supports
 * require a broader law.
 *
 * @param context A standing entry and the declared prop readers on the film
 *   clock.
 * @returns One posture plan with four foot contact windows.
 * @throws {HumanRefusal} When the entry, surfaces, docking or short-step bounds
 *   do not admit a transfer.
 */
export function supportTransfer(
  context: Pick<
    IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSupportTransfer>,
    SupportTransferContext
  >,
): IAutoMovieMotionHumanActionPlan {
  const { body, entry, params, start } = context;
  supportTransfer.admit(params);
  const { feet } = entry;
  const duration: number = params.seconds;
  const yaw: number = entry.posture.yaw;
  const forward: IAutoMovieVector3 = HumanFrame.forward(yaw);
  const lift: number = 0.065;
  const sides: readonly ["left", "right"] = ["left", "right"];
  const lead: AutoMovieHumanSide = params.lead;
  const trail: AutoMovieHumanSide = lead === "left" ? "right" : "left";
  const leadOff: number = 0.18;
  const leadOn: number = 0.44;
  const trailOff: number = 0.55;
  const trailOn: number = 0.82;

  const from: Surface = surface(
    context.prop(params.from.prop),
    params.from,
    "from",
    start,
  );
  const to: Surface = surface(
    context.prop(params.to.prop),
    params.to,
    "to",
    start,
  );
  const dockEnd: number = trailOn * duration;
  const coMoving: boolean = params.docking === "co-moving";
  checkSupportTransferDock(from, to, start, dockEnd, coMoving);
  if (Math.abs(from.origin.y - to.origin.y) > 0.002)
    refuse(
      "to",
      to.origin.y - from.origin.y,
      "The two surfaces are at different heights",
      "Dock the deck level with the platform",
    );
  const oldEdge: number = Math.max(...projection(from, forward));
  const newEdge: number = Math.min(...projection(to, forward));
  const gap: number = newEdge - oldEdge;
  if (gap < -0.002 || gap > 0.13)
    refuse(
      "to",
      gap,
      "The facing direction does not cross a clear short gap between the named surfaces",
      "Face the deck across a gap from 0 to 0.13 metres",
    );
  const at: IAutoMovieVector3 = point(to, {
    x: params.landing?.x ?? 0,
    y: 0,
    z: params.landing?.z ?? 0,
  });

  const entryBones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(body, entry.pose);
  const targets: Partial<
    Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>
  > = {};
  const anchors: Partial<
    Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.ISocket>
  > = {};
  const entryToes = (side: AutoMovieHumanSide): number =>
    entry.posture.joints[`${side}Toes`]?.[0] ?? 0;

  for (const side of sides) {
    const support: IAutoMovieMotionHumanContactWindow.Support =
      HumanSupportFrame.contact(context, `${side}Foot`);
    const sockets: IAutoMovieMotionHumanFoot.ISocket[] = HumanFoot.sockets(
      body,
      entryBones,
      side,
    );
    const sole: IAutoMovieMotionHumanFoot.ISocket = sockets.reduce(
      (
        low: IAutoMovieMotionHumanFoot.ISocket,
        socket: IAutoMovieMotionHumanFoot.ISocket,
      ): IAutoMovieMotionHumanFoot.ISocket =>
        socket.point.y < low.point.y ? socket : low,
    );
    if (
      entry.base.kind !== "standing" ||
      !feet[side].planted ||
      support.kind !== "prop" ||
      support.subject !== params.from.prop ||
      Math.abs(sole.point.y - from.origin.y) > 0.006 ||
      sockets.some(
        (socket: IAutoMovieMotionHumanFoot.ISocket): boolean =>
          !contains(from, socket.point),
      )
    )
      refuse(
        "from",
        side,
        "The entry sole does not stand on the named platform",
        "Start with both feet planted inside the platform surface",
      );
    anchors[side] = sole;

    // Translate the entry's stance to the landing station, keeping its width.
    const mean: IAutoMovieVector3 = Vector3.lerp(
      feet.left.ankle,
      feet.right.ankle,
      0.5,
    );
    const d: IAutoMovieVector3 = Vector3.subtract(feet[side].ankle, mean);
    const goal: IAutoMovieMotionHumanFoot.IPlacement = HumanFoot.pivot(
      body,
      side,
      "sole",
      Vector3.add(at, { ...d, y: 0 }),
      HumanFoot.heading(feet[side].rotation),
      0,
    );
    const distance: number = Vector3.length(
      Vector3.subtract(goal.ankle, feet[side].ankle),
    );
    if (distance > 0.45 * body.measure.hipHeight)
      refuse(
        "landing",
        distance,
        "A sole would need more than the draft's short-step reach",
        "Bring the landing station closer to the entry stance",
      );
    if (
      HumanFoot.SOCKETS.some(
        (socket): boolean =>
          !contains(to, HumanFoot.point(body, side, socket, goal)),
      )
    )
      refuse(
        "landing",
        side,
        "A landing sole extends past the named deck surface",
        "Move the station inward or use a wider deck surface",
      );
    targets[side] = goal;
  }
  const stanceShift: IAutoMovieVector3 = Vector3.scale(
    Vector3.subtract(feet[trail].ankle, feet[lead].ankle),
    0.3,
  );
  stanceShift.y = 0;
  const displacement: IAutoMovieVector3 = Vector3.scale(
    Vector3.add(
      Vector3.subtract(targets.left!.ankle, feet.left.ankle),
      Vector3.subtract(targets.right!.ankle, feet.right.ankle),
    ),
    0.5,
  );
  const motion = (share: number): IAutoMovieMotionHumanPosture => {
    // Move from the old stance into split support, then finish over the deck.
    const moved: number =
      0.5 * progress(share, leadOff, trailOff) +
      0.5 * progress(share, trailOff, trailOn);
    const lateral: number =
      progress(share, 0, leadOff) -
      2 * progress(share, leadOff, trailOff) +
      progress(share, trailOff, trailOn);
    const stagedRoot: IAutoMovieVector3 = Vector3.add(
      Vector3.add(entry.posture.root, Vector3.scale(displacement, moved)),
      Vector3.scale(stanceShift, lateral),
    );
    const time: number = start + share * duration;
    const sourceCarry: IAutoMovieMotionHumanSupportCarry.ICarry =
      HumanSupportCarry(from.frame, start, time);
    const deckCarry: IAutoMovieMotionHumanSupportCarry.ICarry =
      HumanSupportCarry(to.frame, start, time);
    const staged: IAutoMovieMotionHumanPosture = {
      ...entry.posture,
      root: stagedRoot,
    };
    const base: IAutoMovieMotionHumanPosture = coMoving
      ? HumanSupportCarry.posture(
          HumanSupportCarry.blend(
            sourceCarry,
            deckCarry,
            stagedRoot,
            progress(share, trailOff, trailOn),
          ),
          staged,
        )
      : staged;
    const root: IAutoMovieVector3 = base.root;
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
      ...base.limbs,
    };
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...entry.posture.joints,
    };
    for (const side of sides) {
      const off: number = side === lead ? leadOff : trailOff;
      const on: number = side === lead ? leadOn : trailOn;
      const s: number = progress(share, off, on);
      const target: IAutoMovieMotionHumanFoot.IPlacement = targets[side]!;
      const ankle: IAutoMovieVector3 = Vector3.lerp(
        sourceCarry.point(feet[side].ankle),
        deckCarry.point(target.ankle),
        s,
      );
      ankle.y += lift * 4 * s * (1 - s);
      const toes: number = entryToes(side) * (1 - s);
      const planted: boolean = share <= off || share >= on;
      const goal: IAutoMovieHumanLimbGoal = {
        point: ankle,
        bend: HumanFrame.point(
          { origin: root, yaw: base.yaw },
          {
            ...body.rest.get(`${side}LowerLeg`)!,
            z: body.rest.get(`${side}LowerLeg`)!.z + 1,
          },
        ),
        rotation: Quaternion.slerp(
          Quaternion.multiply(sourceCarry.turn, feet[side].rotation),
          Quaternion.multiply(deckCarry.turn, target.rotation),
          s,
        ),
        ...(planted
          ? {
              planted,
              contact: HumanFoot.offset(
                body,
                side,
                share <= off ? anchors[side]!.socket : "sole",
                toes,
              ),
            }
          : {}),
      };
      limbs[side === "left" ? "leftLeg" : "rightLeg"] = goal;
      joints[`${side}Toes`] = [toes, 0, 0];
    }
    // Keep both ankles in the reach envelope throughout the swing. A change
    // in bearing status must not change the pelvis height at that instant.
    const lowered: IAutoMovieMotionHumanPosture = lowerHumanPosture(body, {
      ...base,
      root,
      joints,
      limbs: {
        leftLeg: { ...limbs.leftLeg!, planted: true },
        rightLeg: { ...limbs.rightLeg!, planted: true },
      },
    });
    return { ...lowered, limbs };
  };
  const contacts: IAutoMovieMotionHumanContactWindow[] = sides.flatMap(
    (side: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow[] => [
      plant(side, 0, side === lead ? leadOff : trailOff, params.from.prop),
      plant(side, side === lead ? leadOn : trailOn, 1, params.to.prop),
    ],
  );
  return {
    duration,
    base: { kind: "standing" },
    events: [
      { name: "leadToeOff", share: leadOff },
      { name: "leadContact", share: leadOn },
      { name: "trailToeOff", share: trailOff },
      { name: "trailContact", share: trailOn },
    ],
    contacts,
    posture: (seconds: number): IAutoMovieMotionHumanPosture => {
      const time: number = Math.max(0, Math.min(duration, seconds));
      const posture: IAutoMovieMotionHumanPosture = motion(
        Math.min(trailOn, time / duration),
      );
      if (time <= dockEnd) return posture;
      return HumanSupportCarry.posture(
        HumanSupportCarry(to.frame, start + dockEnd, start + time),
        posture,
      );
    },
  };
}

/** Authoring admission before reading the two displayed support trajectories. */
export namespace supportTransfer {
  /** Time and named endpoints of an authored two-step transfer. */
  export type IAdmission = Pick<
    IAutoMovieMotionHumanSupportTransfer,
    "seconds" | "docking" | "from" | "to"
  >;

  /** Require a bounded two-step interval between distinct props. */
  export function admit(params: IAdmission): void {
    if (!(params.seconds >= 1.2 && params.seconds <= 3))
      refuse(
        "seconds",
        params.seconds,
        "Boarding needs one bounded two-step interval",
        "Use a duration from 1.2 to 3 seconds",
      );
    if (
      params.docking !== undefined &&
      params.docking !== "stationary" &&
      params.docking !== "co-moving"
    )
      refuse(
        "docking",
        params.docking,
        "Unknown docking mode",
        "Use stationary or co-moving docking",
      );
    if (params.from.prop === params.to.prop)
      refuse(
        "to",
        params.to,
        "Both surfaces are on the same prop",
        "Name a distinct deck prop",
      );
  }
}

/** The alternatives of `SupportTransferContext`'s site. */
type SupportTransferContext = "body" | "entry" | "params" | "prop" | "start";
/** The alternatives of `SurfaceAxis`'s site. */
type SurfaceAxis = "from" | "to";

/** A rigid, unarticulated rectangle and its evaluated dock frame. */
interface Surface {
  /** The parameter naming this rectangle. */
  axis: SurfaceAxis;
  /** The live prop reader. */
  frame(seconds: number): IAutoMovieRigidTransform;
  /** The prop's baseline frame at the start. */
  propFrame: IAutoMovieRigidTransform;
  /** The surface's start origin in world metres. */
  origin: IAutoMovieVector3;
  /** The surface's start orientation. */
  rotation: IAutoMovieRigidTransform["rotation"];
  /** Half-width along the surface's X axis, metres. */
  x: number;
  /** Half-depth along the surface's Z axis, metres. */
  z: number;
}
/** The alternatives of `SurfaceAxis2`'s site. */
type SurfaceAxis2 = "from" | "to";

/** Read a named level rectangle rigidly attached to its prop. */
function surface(
  reader: IAutoMovieMotionHumanPropReader,
  target: IAutoMovieMotionHumanSupportTransfer.ISurface,
  axis: SurfaceAxis2,
  start: number,
): Surface {
  const found: IAutoMovieAffordance | undefined = reader.prop.affordances?.find(
    (item: IAutoMovieAffordance): boolean => item.id === target.surface,
  );
  if (
    found === undefined ||
    found.kind !== "surface" ||
    found.rides !== undefined ||
    found.frame.scale.x !== 1 ||
    found.frame.scale.y !== 1 ||
    found.frame.scale.z !== 1 ||
    found.width === undefined ||
    found.depth === undefined ||
    !(found.width > 0) ||
    !(found.depth > 0)
  )
    refuse(
      axis,
      target,
      "The named affordance is not a rigid rectangular surface",
      "Declare an unarticulated surface with positive width and depth",
    );
  const propFrame: IAutoMovieRigidTransform = reader.frame(start);
  const rotation: IAutoMovieRigidTransform["rotation"] = Quaternion.multiply(
    propFrame.rotation,
    found.frame.rotation,
  );
  return {
    axis,
    frame: (seconds: number): IAutoMovieRigidTransform => reader.frame(seconds),
    propFrame,
    origin: Vector3.add(
      propFrame.position,
      Quaternion.rotateVector(propFrame.rotation, found.frame.translation),
    ),
    rotation,
    x: found.width / 2,
    z: found.depth / 2,
  };
}

/** Place a surface-local metre point in the dock's world frame. */
function point(s: Surface, local: IAutoMovieVector3): IAutoMovieVector3 {
  return Vector3.add(s.origin, Quaternion.rotateVector(s.rotation, local));
}

/** Project the rectangle's four corners onto the direction of crossing. */
function projection(s: Surface, direction: IAutoMovieVector3): number[] {
  return [-s.x, s.x].flatMap((x: number): number[] =>
    [-s.z, s.z].map((z: number): number =>
      Vector3.dot(point(s, { x, y: 0, z }), direction),
    ),
  );
}
/** Check a sole point's horizontal membership in the rectangle. */
function contains(s: Surface, position: IAutoMovieVector3): boolean {
  const local: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(s.rotation),
    Vector3.subtract(position, s.origin),
  );
  return Math.abs(local.x) <= s.x + 1e-6 && Math.abs(local.z) <= s.z + 1e-6;
}

/** Declare a fixed foot contact in its bearing prop's frame. */
function plant(
  side: AutoMovieHumanSide,
  from: number,
  to: number,
  subject: string,
): IAutoMovieMotionHumanContactWindow {
  return {
    part: `${side}Foot`,
    kind: "plant",
    from,
    to,
    support: { kind: "prop", subject },
  };
}

/** Progress within an individual swing or load transfer. */
function progress(share: number, from: number, to: number): number {
  return AutoMovieMotionInterval.progress(from, to, share);
}

/** Report the failed boarding premise in the action's existing refusal form. */
function refuse(
  axis: string,
  value: unknown,
  reason: string,
  fix: string,
): never {
  throw new HumanRefusal({
    kind: "base",
    axis,
    value,
    feasible: null,
    reason,
    fix,
  });
}
