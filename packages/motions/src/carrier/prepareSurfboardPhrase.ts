import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSurface,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { lieDown } from "../floor/lieDown";
import { HumanBound } from "../law/HumanBound";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanSurfaceBoard } from "./HumanSurfaceBoard";

/** The two sides are fitted independently. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/**
 * Mount a staged surfboard, paddle and transfer from the palms to the
 * feet. Borgonovo-Santos et al. identify overlapping and unsupported
 * hand-to-foot transfers as distinct patterns, and measure push and
 * reaching phases separately. https://pmc.ncbi.nlm.nih.gov/articles/PMC7961430/
 *
 * @param context The floating entry and the animated surfboard.
 * @returns A carried pose with the selected palm, free and foot phases.
 * @throws {HumanRefusal} For missing board geometry or an inadmissible water entry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the water entry, phases and owner of their support.
 * @evidence contracts/development/implementation.md#principled-implementation Measure pelvis and free-limb transition in the moving board frame, place flat palms and feet against the board's own sites, and express overlap or free time by the order of their windows.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the board and entry, bind named phase targets and read their pose on the same clock.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keep the board's external bank and mount height. The two transition patterns differ in when the same constraints become active.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed preparation plus one board sample and up to four end-effector targets per pose.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses canonical HumanHand and HumanFoot placement and the existing prone posture and standing leg geometry.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The action owns only the board reader, anatomical offsets and stage parameters.
 */
export function prepareSurfboardPhrase(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSurface.ISurfboardPhraseParams>,
): IAutoMovieMotionHumanActionPlan {
  const { body, entry, params }: typeof context = context;
  const duration: number = HumanBound.above("seconds", params.seconds, 0, "s");
  const lead: AutoMovieHumanSide = params.lead;
  const trail: AutoMovieHumanSide = lead === "left" ? "right" : "left";
  const water: number = params.water ?? 0;
  if (
    !Number.isFinite(water) ||
    (lead !== "left" && lead !== "right") ||
    (params.transfer !== "overlap" && params.transfer !== "flight")
  )
    HumanSurfaceBoard.refuseBoard(
      params.on,
      "a finite water elevation and a valid stance transfer are required",
    );
  const board: HumanSurfaceBoard.IDeck = HumanSurfaceBoard.deck(
    context,
    params.on,
  );
  const phases: typeof prepareSurfboardPhrase.SHARES =
    prepareSurfboardPhrase.SHARES;
  const at = (share: number): IAutoMovieRigidTransform =>
    board.at(share * duration);
  const prone: IAutoMovieVector3 = board.site("prone", "surface");
  const front: IAutoMovieVector3 = board.site("frontStance", "surface");
  const rear: IAutoMovieVector3 = board.site("rearStance", "surface");
  const palms: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
    left: board.site("leftPalm", "surface"),
    right: board.site("rightPalm", "surface"),
  };
  board.plant(prone, "prone");
  board.plant(front, "frontStance");
  board.plant(rear, "rearStance");
  for (const side of SIDES) board.plant(palms[side], side + "Palm");

  const hips: IAutoMovieVector3 = body.rest.get("hips")!;
  const leg: number = body.measure.thigh + body.measure.shank;
  const start: IAutoMovieMotionHumanPosture = entry.posture;
  const origin: IAutoMovieRigidTransform = at(0);
  const entryHip: IAutoMovieVector3 = poseBones(body, entry.pose).get(
    "hips",
  )!.worldPosition;
  const localHip: IAutoMovieVector3 = HumanSurfaceBoard.local(origin, entryHip);
  if (
    start.pitch < 50 ||
    Math.abs(entryHip.y - water) > 0.4 * leg ||
    Vector3.distance(localHip, prone) > leg
  )
    HumanSurfaceBoard.refuseBoard(
      params.on,
      "start prone in the water within one leg length of the board",
    );
  const deckAtMount: number = HumanSurfaceBoard.world(
    at(phases.mount),
    prone,
  ).y;
  if (
    deckAtMount < water - HumanSurfaceBoard.GAP ||
    deckAtMount > water + leg / 3
  )
    HumanSurfaceBoard.refuseBoard(
      params.on,
      "the deck at mount is outside the water-entry reach",
    );

  const firstFoot: number =
    params.transfer === "overlap" ? phases.overlap : phases.flight;
  const sternum: typeof body.surfaces.regions.sternum =
    body.surfaces.regions.sternum;
  const pronePose: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 180,
    pitch: 86,
    roll: 0,
    joints: lieDown.POSES.prone.joints,
    limbs: {},
  };
  const proneBones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(body, resolveHumanPosture(body, pronePose));
  const proneTurn: IAutoMovieQuaternion =
    resolveHumanPosture.heading(pronePose);
  const inverseProne: IAutoMovieQuaternion = Quaternion.inverse(proneTurn);
  const proneHeight: number =
    Quaternion.rotateVector(proneTurn, hips).y -
    resolveAutoMovieHumanoidSurfaces.place(
      sternum,
      proneBones.get(sternum.bone)!,
    ).point.y;
  const stanceMid: IAutoMovieVector3 = Vector3.lerp(front, rear, 0.5);
  const entryJoints: readonly AutoMovieHumanoidBone[] = Object.keys({
    ...start.joints,
    ...pronePose.joints,
  }) as AutoMovieHumanoidBone[];
  const leadFoot: "leftFoot" | "rightFoot" =
    lead === "left" ? "leftFoot" : "rightFoot";
  const trailFoot: "leftFoot" | "rightFoot" =
    trail === "left" ? "leftFoot" : "rightFoot";
  const support: IAutoMovieMotionHumanContactWindow.Support = {
    kind: "prop",
    subject: params.on,
  };
  const contacts: IAutoMovieMotionHumanContactWindow[] = [
    {
      ...HumanSurfaceBoard.plant(
        "back",
        phases.mount,
        phases.paddleEnd,
        support,
        "lie",
      ),
      region: "sternum",
    },
    {
      ...HumanSurfaceBoard.plant(
        "leftHand",
        phases.palms,
        phases.release,
        support,
        "bear",
      ),
      region: "palmLeft",
    },
    {
      ...HumanSurfaceBoard.plant(
        "rightHand",
        phases.palms,
        phases.release,
        support,
        "bear",
      ),
      region: "palmRight",
    },
    HumanSurfaceBoard.plant(leadFoot, firstFoot, 1, support),
    HumanSurfaceBoard.plant(trailFoot, phases.feet, 1, support),
  ];

  const posture = (seconds: number): IAutoMovieMotionHumanPosture => {
    const share: number = Math.max(0, Math.min(1, seconds / duration));
    if (share === 0) return start;
    const frame: IAutoMovieRigidTransform = at(share);
    const world = (point: IAutoMovieVector3): IAutoMovieVector3 =>
      HumanSurfaceBoard.world(frame, point);
    const fade = (from: number, to: number): number =>
      HumanSurfaceBoard.ease(share, from, to);
    const mount: number = fade(0, phases.mount);
    const brace: number = fade(phases.paddleEnd, phases.palms);
    const press: number = fade(phases.palms, phases.release);
    const standUp: number = fade(phases.release, phases.settle);
    const pitchUp: number = fade(phases.release, phases.feet);
    const frontFacing: number = HumanSurfaceBoard.heading(frame.rotation) + 180;
    const stanceSide: number = lead === "left" ? -1 : 1;
    const stanceTurn: number = stanceSide * 52;
    const yaw: number =
      start.yaw + mount * wrap(frontFacing - start.yaw) + standUp * stanceTurn;
    // Turn the pelvis under the braced chest so the lead knee can fold
    // without driving the sole through the deck. Unfold both after release.
    const tuck: number = press * (1 - pitchUp);
    const pitch: number =
      start.pitch +
      (pronePose.pitch - start.pitch) * mount -
      38 * press -
      38 * pitchUp -
      48 * tuck;
    const torso: Pick<IAutoMovieMotionHumanPosture, "yaw" | "pitch" | "roll"> =
      { yaw, pitch, roll: 0 };
    const bodyRotation: IAutoMovieQuaternion =
      resolveHumanPosture.heading(torso);
    // Keep the shoulders in reach while the palms bear. Centre between the
    // new foot targets before rising over both soles.
    const balance: number = fade(phases.palms, firstFoot);
    const supportCentre: IAutoMovieVector3 = Vector3.lerp(
      prone,
      stanceMid,
      balance,
    );
    const bodyHeight: number =
      proneHeight +
      (0.07 * brace + 0.16 * press + 0.08 * tuck + 0.45 * standUp) * leg;
    const hip: IAutoMovieVector3 = Vector3.lerp(
      entryHip,
      world({ ...supportCentre, y: supportCentre.y + bodyHeight }),
      mount,
    );
    const root: IAutoMovieVector3 = Vector3.subtract(
      hip,
      Quaternion.rotateVector(bodyRotation, hips),
    );
    const carry: IAutoMovieQuaternion = Quaternion.multiply(
      bodyRotation,
      inverseProne,
    );
    const fromProne = (point: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.add(root, Quaternion.rotateVector(carry, point));
    const joints: IAutoMovieMotionHumanPosture["joints"] = {};
    for (const bone of entryJoints) {
      const from: readonly [number, number, number] = start.joints[bone] ?? [
        0, 0, 0,
      ];
      const to: readonly [number, number, number] = pronePose.joints[bone] ?? [
        0, 0, 0,
      ];
      joints[bone] = [
        from[0] + mount * (to[0] - from[0]),
        from[1] + mount * (to[1] - from[1]),
        from[2] + mount * (to[2] - from[2]),
      ];
    }
    // Bend the trunk toward the boardside grip while freeing the hips to
    // swing the lead leg under the body.
    const spine: readonly [number, number, number] = joints.spine ?? [0, 0, 0];
    joints.spine = [spine[0] + 75 * tuck, spine[1], spine[2]];
    const rest: IAutoMovieMotionHumanPosture = {
      root,
      ...torso,
      joints,
      limbs: {},
    };
    const goals: Partial<
      Record<AutoMovieHumanSide, Omit<IAutoMovieHumanLimbGoal, "bend">>
    > = {};
    const swing: Record<AutoMovieHumanSide, number> = { left: 0, right: 0 };
    for (const side of SIDES) {
      const site: IAutoMovieVector3 = side === lead ? front : rear;
      const acquired: number = side === lead ? firstFoot : phases.feet;
      const raise: number = fade(phases.palms, acquired);
      swing[side] = raise;
      if (raise === 0) continue;
      const heading: number = 180 + stanceSide * (side === lead ? 25 : 45);
      const settledRotation: IAutoMovieQuaternion = Quaternion.multiply(
        frame.rotation,
        HumanFoot.rotation(heading, 0),
      );
      const ankle: IAutoMovieResolvedBone = proneBones.get(`${side}Foot`)!;
      const free: IAutoMovieVector3 = fromProne(
        HumanFoot.point(body, side, "sole", {
          ankle: ankle.worldPosition,
          rotation: ankle.worldRotation,
        }),
      );
      const reach: IAutoMovieVector3 = Vector3.lerp(free, world(site), raise);
      goals[side] = HumanSurfaceBoard.ankle(
        body,
        side,
        reach,
        Quaternion.slerp(
          Quaternion.multiply(carry, ankle.worldRotation),
          settledRotation,
          raise,
        ),
        share >= acquired,
      );
    }
    const ankles: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
      left: goals.left?.point ?? hip,
      right: goals.right?.point ?? hip,
    };
    const legs: IAutoMovieMotionHumanPosture["limbs"] = stand.legs(
      body,
      root,
      yaw,
      ankles,
    );
    for (const side of SIDES) {
      const limb: "leftLeg" | "rightLeg" =
        side === "left" ? "leftLeg" : "rightLeg";
      const goal: Omit<IAutoMovieHumanLimbGoal, "bend"> | undefined =
        goals[side];
      if (goal !== undefined)
        rest.limbs[limb] = {
          ...goal,
          bend: Vector3.lerp(
            fromProne(proneBones.get(`${side}LowerLeg`)!.worldPosition),
            legs[limb]!.bend,
            swing[side],
          ),
        };

      // A paddle lies outside the rail in the water. Palms then transfer
      // onto material sites and recover away from them after their release.
      if (share <= phases.mount) continue;
      const palm: IAutoMovieVector3 = palms[side];
      const outward: number = side === "left" ? -1 : 1;
      const phase: number =
        2 * Math.PI * ((share - phases.mount) / (phases.palms - phases.mount)) +
        (side === "left" ? 0 : Math.PI);
      const paddle: number = Math.sin(
        Math.PI * fade(phases.mount, phases.palms),
      );
      const lift: number = fade(phases.release, phases.settle);
      const p: IAutoMovieVector3 = world({
        x:
          palm.x +
          outward *
            (paddle * board.width * 0.45 + lift * body.measure.upperArm * 0.7),
        y: palm.y + 0.06 * paddle * Math.cos(phase) + lift * 0.55 * leg,
        z: palm.z + 0.23 * leg * paddle * Math.sin(phase) + (lift * leg) / 4,
      });
      const palmNormal: IAutoMovieVector3 = Quaternion.rotateVector(
        frame.rotation,
        { x: 0, y: -1, z: 0 },
      );
      const palmForward: IAutoMovieVector3 = Quaternion.rotateVector(
        frame.rotation,
        { x: 0, y: 0, z: -1 },
      );
      const wrist: ReturnType<typeof HumanHand.reach> = HumanHand.reach(
        body,
        side,
        "palm",
        { point: p, normal: palmNormal, forward: palmForward },
        "flat",
      );
      const arm: "leftArm" | "rightArm" =
        side === "left" ? "leftArm" : "rightArm";
      const proneWrist: IAutoMovieResolvedBone = proneBones.get(`${side}Hand`)!;
      const paddleStart: number = fade(
        phases.mount,
        (phases.mount + phases.palms) / 2,
      );
      rest.limbs[arm] = {
        point: Vector3.lerp(
          fromProne(proneWrist.worldPosition),
          wrist.point,
          paddleStart,
        ),
        rotation: Quaternion.slerp(
          Quaternion.multiply(carry, proneWrist.worldRotation),
          wrist.rotation,
          paddleStart,
        ),
        bend: Vector3.lerp(
          fromProne(proneBones.get(`${side}LowerArm`)!.worldPosition),
          world({
            ...palm,
            x: palm.x + outward * body.measure.upperArm,
            y: palm.y + body.measure.upperArm,
            z: palm.z + body.measure.upperArm,
          }),
          paddleStart,
        ),
        contact: HumanHand.offset(body, side, "palm", "flat").point,
        planted: share >= phases.palms && share <= phases.release,
      };
    }
    return rest;
  };
  return {
    duration,
    events: [
      { name: "mount", share: phases.mount },
      { name: "paddleEnd", share: phases.paddleEnd },
      { name: "palms", share: phases.palms },
      { name: "release", share: phases.release },
      { name: "firstFoot", share: firstFoot },
      { name: "feet", share: phases.feet },
      { name: "settle", share: phases.settle },
    ].sort((a, b): number => a.share - b.share),
    contacts,
    physicalWindow: null,
    posture,
  };
}

/** The staged water mount, paddle and hand-to-foot cue intervals. */
export namespace prepareSurfboardPhrase {
  /** The lab describes the order. These shares leave room for a paddle and a bank. */
  export const SHARES = {
    mount: 0.18,
    paddleEnd: 0.32,
    palms: 0.38,
    overlap: 0.62,
    release: 0.66,
    flight: 0.71,
    feet: 0.77,
    settle: 0.91,
  } as const;
}

/** Express one angular displacement on the closest arc. */
function wrap(degrees: number): number {
  return degrees - 360 * Math.round(degrees / 360);
}
