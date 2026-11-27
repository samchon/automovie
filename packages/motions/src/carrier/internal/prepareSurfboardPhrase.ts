import { Quaternion, Vector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanSide, AutoMovieHumanoidBone, IAutoMovieMotionEvent, IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanActionPlan, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanSurface, IAutoMovieQuaternion, IAutoMovieResolvedBone, IAutoMovieRigidTransform, IAutoMovieVector3 } from "@automovie/interface";

import { lieDown } from "../../floor/internal/lieDown";
import { HumanBound } from "../../law/internal/HumanBound";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { HumanSurfaceBoard } from "./HumanSurfaceBoard";
import { prepareSurfboardPosture } from "./prepareSurfboardPosture";

/*
 * The two sides are fitted independently.
 */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

// The staging coefficients below are provisional. The cited study orders
// the palm and foot supports but measures no posture angles or heights, so
// each value is an authored staging choice that the board-sport test
// bounds through its support and clearance checks, not a measurement.

/*
 * Least entry pitch, degrees, that reads as lying prone in the water
 * (provisional).
 */
const PRONE_ENTRY_PITCH: number = 50;

/*
 * Greatest entry hip distance from the waterline, in leg lengths (provisional).
 */
const PRONE_ENTRY_DEPTH: number = 0.4;

/*
 * Highest deck above the water at the mount, in leg lengths, that a prone
 * paddler climbs onto (provisional).
 */
const MOUNT_REACH: number = 1 / 3;

/*
 * Pitch of the prone paddling posture, degrees from upright (provisional).
 */
const PRONE_PITCH: number = 86;

/*
 * Mount a staged surfboard, paddle and transfer from the palms to the feet.
 * Borgonovo-Santos et al. identify overlapping and unsupported hand-to-foot
 * transfers as distinct patterns, and measure push and reaching phases
 * separately. https://pmc.ncbi.nlm.nih.gov/articles/PMC7961430/
 * Parameter context: The floating entry and the animated surfboard.
 * Returns: A carried pose with the selected palm, free and foot phases.
 * For missing board geometry or an inadmissible water
 * entry.
 */
export function prepareSurfboardPhrase(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSurface.ISurfboardPhraseParams>,
): IAutoMovieMotionHumanActionPlan {
  const { body, entry, params }: typeof context = context;
  const duration: number = HumanBound.above(
    "duration",
    params.duration,
    0,
    "s",
  );
  const lead: AutoMovieHumanSide = params.lead;
  const trail: AutoMovieHumanSide = lead === "left" ? "right" : "left";
  const water: number = params.water ?? 0;
  if (
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
    start.pitch < PRONE_ENTRY_PITCH ||
    Math.abs(entryHip.y - water) > PRONE_ENTRY_DEPTH * leg ||
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
    deckAtMount > water + MOUNT_REACH * leg
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
    pitch: PRONE_PITCH,
    roll: 0,
    joints: lieDown.POSES.prone.joints,
    limbs: {},
  };
  const proneBones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(body, resolveHumanPosture(body, pronePose));
  const proneTurn: IAutoMovieQuaternion = humanPostureHeading(pronePose);
  const inverseProne: IAutoMovieQuaternion = Quaternion.inverse(proneTurn);
  const proneHeight: number =
    Quaternion.rotateVector(proneTurn, hips).y -
    AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(
      sternum,
      proneBones.get(sternum.bone)!,
    ).point.y;
  const stanceMid: IAutoMovieVector3 = Vector3.lerp(front, rear, 0.5);
  const entryJoints: readonly AutoMovieHumanoidBone[] = Object.keys({
    ...start.joints,
    ...pronePose.joints,
  }) as AutoMovieHumanoidBone[];
  const leadFoot: IAutoMovieMotionHumanContactWindow["part"] =
    lead === "left" ? "leftFoot" : "rightFoot";
  const trailFoot: IAutoMovieMotionHumanContactWindow["part"] =
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

  const posture: (seconds: number) => IAutoMovieMotionHumanPosture =
    prepareSurfboardPosture({
      body,
      board,
      duration,
      at,
      phases,
      lead,
      firstFoot,
      start,
      pronePose,
      proneBones,
      proneHeight,
      inverseProne,
      entryHip,
      entryJoints,
      hips,
      leg,
      prone,
      front,
      rear,
      stanceMid,
      palms,
      SIDES,
    });
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
    ].sort(
      (a: IAutoMovieMotionEvent, b: IAutoMovieMotionEvent): number =>
        a.share - b.share,
    ),
    contacts,
    physicalWindow: null,
    posture,
  };
}

/*
 * The staged water mount, paddle and hand-to-foot cue intervals.
 */
export namespace prepareSurfboardPhrase {
  /*
   * The lab describes the order. These shares leave room for a paddle and a
   * bank.
   */
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
