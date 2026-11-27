import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSurface,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { HumanBound } from "../../law/internal/HumanBound";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { lowerHumanPosture } from "../../posture/internal/lowerHumanPosture";
import { HumanSupportCarry } from "./HumanSupportCarry";
import { HumanSurfaceBoard } from "./HumanSurfaceBoard";

/** The four lower tyre sites in a level board frame. */
const WHEELS: readonly string[] = [
  "wheel-front-left",
  "wheel-front-right",
  "wheel-back-left",
  "wheel-back-right",
];

// The staging coefficients below are provisional. The cited studies time
// the launch, landing and foot separation but give no posture heights, so
// each value is an authored staging choice that the board-sport test
// bounds through its deck, street and clearance checks, not a measurement.

/** Push-foot clearance outside the deck's edge, in foot lengths (provisional). */
const PUSH_MARGIN: number = 1 / 4;

/**
 * Toe lift over the deck while a foot travels or the board rises, in foot
 * lengths (provisional).
 */
const TOE_CLEARANCE: number = 1 / 3;

/** Extra push-foot lift at take-off, in toe clearances (provisional). */
const TAKEOFF_TOE_LIFT: number = 1.5;

/** Pelvis drop loading the pop, in thigh lengths (provisional). */
const LOAD_DROP: number = 0.18;

/** Pelvis drop absorbing the landing, in thigh lengths (provisional). */
const ABSORB_DROP: number = 0.24;

/**
 * Pelvis drop toward a street push, in thigh lengths, before the push fit
 * lowers it to reach (provisional).
 */
const PUSH_DROP: number = 0.17;

/**
 * Transfer the entered stance between street and deck, then follow the authored
 * tail strike, flight and grounded landing. Frederick et al. measured the
 * separate launch and landing ground reactions. Nakashima et al. studied the
 * timing of separation between board and feet.
 * https://pubmed.ncbi.nlm.nih.gov/16760565/
 * https://www.jstage.jst.go.jp/article/mej/8/5/8_21-00230/_article
 *
 * @param context An acquired stance and a skateboard on the film clock.
 * @returns A carried pose with separate deck and world support windows.
 * @throws {HumanRefusal} When the entry, deck or authored floor contacts are
 *   infeasible.
 */
export function prepareSkateboardPhrase(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSurface.ISkateboardPhraseParams>,
): IAutoMovieMotionHumanActionPlan {
  const { body, entry, params }: typeof context = context;
  const duration: number = HumanBound.above(
    "duration",
    params.duration,
    0,
    "s",
  );
  const lead: AutoMovieHumanSide = params.lead;
  const other: AutoMovieHumanSide = lead === "left" ? "right" : "left";
  const leadFoot: IAutoMovieMotionHumanContactWindow["part"] =
    lead === "left" ? "leftFoot" : "rightFoot";
  const pushFoot: IAutoMovieMotionHumanContactWindow["part"] =
    other === "left" ? "leftFoot" : "rightFoot";
  const ground: number = params.ground ?? 0;
  const board: HumanSurfaceBoard.IDeck = HumanSurfaceBoard.deck(
    context,
    params.on,
  );
  if (lead !== "left" && lead !== "right")
    HumanSurfaceBoard.refuseBoard(
      params.on,
      "a finite floor elevation and a leading foot are required",
    );
  const phases: typeof prepareSkateboardPhrase.SHARES =
    prepareSkateboardPhrase.SHARES;
  const frame = (share: number): IAutoMovieRigidTransform =>
    board.at(duration * share);
  const initial: IAutoMovieRigidTransform = frame(0);
  const start: IAutoMovieMotionHumanPosture = entry.posture;
  const entryFoot = (side: AutoMovieHumanSide): IAutoMovieVector3 => {
    if (
      !entry.supports.some(
        ({ part, support }: (typeof entry.supports)[number]): boolean =>
          part === side + "Foot" &&
          support.kind === "prop" &&
          support.subject === params.on,
      )
    )
      return HumanSurfaceBoard.refuseBoard(
        params.on,
        "each foot must start on the skateboard",
      );
    const foot: (typeof entry.feet)[AutoMovieHumanSide] = entry.feet[side];
    const contact: IAutoMovieVector3 = Vector3.add(
      foot.ankle,
      Quaternion.rotateVector(
        foot.rotation,
        HumanFoot.offset(body, side, "sole"),
      ),
    );
    const local: IAutoMovieVector3 = HumanSurfaceBoard.local(initial, contact);
    // A preceding prop support can bear at the ball or heel. Start from
    // the displayed sole, then settle the whole sole onto the deck.
    const footDepth: number = Math.abs(HumanFoot.offset(body, side, "sole").y);
    if (Math.abs(local.y - board.centre.y) > footDepth)
      HumanSurfaceBoard.refuseBoard(
        side,
        "the entered foot is too far from the deck to settle",
      );
    return local;
  };
  const enteredFront: IAutoMovieVector3 = entryFoot(lead);
  const enteredRear: IAutoMovieVector3 = entryFoot(other);
  const front: IAutoMovieVector3 = { ...enteredFront, y: board.centre.y };
  const behind: IAutoMovieVector3 = { ...enteredRear, y: board.centre.y };
  board.plant(front, leadFoot);
  board.plant(behind, pushFoot);
  const rear: IAutoMovieVector3 = board.site("rearStance", "surface");
  const tail: IAutoMovieVector3 = board.site("tailStance", "surface");
  const strike: IAutoMovieVector3 = board.site("tailStrike", "ledge");
  const wheels: readonly IAutoMovieVector3[] = WHEELS.map(
    (wheel: string): IAutoMovieVector3 => board.site(wheel, "ledge"),
  );
  board.plant(rear, "rearStance");
  board.plant(tail, "tailStance");

  const checkGround = (
    share: number,
    sites: readonly IAutoMovieVector3[],
    name: string,
  ): void => {
    const placement: IAutoMovieRigidTransform = frame(share);
    if (
      sites.some(
        (site: IAutoMovieVector3): boolean =>
          Math.abs(HumanSurfaceBoard.world(placement, site).y - ground) >
          HumanSurfaceBoard.GAP,
      )
    )
      HumanSurfaceBoard.refuseBoard(
        name,
        "the authored board misses the named street plane",
      );
  };
  for (const share of [0, phases.push, phases.recover, phases.stance])
    checkGround(share, wheels, "wheels");
  checkGround(phases.tail, [strike], "tailStrike");
  checkGround(phases.land, wheels, "landing wheels");
  const top: IAutoMovieRigidTransform = frame(phases.apex);
  if (
    [...wheels, strike].some(
      (site: IAutoMovieVector3): boolean =>
        HumanSurfaceBoard.world(top, site).y <= ground + HumanSurfaceBoard.GAP,
    )
  )
    HumanSurfaceBoard.refuseBoard(
      params.on,
      "the board has no unsupported aerial phase",
    );

  // A push plants beside the deck while the other foot travels with it.
  const outside: number = other === "left" ? 1 : -1;
  const footLength: number = Vector3.distance(
    HumanFoot.offset(body, other, "heel"),
    HumanFoot.offset(body, other, "toe"),
  );
  const pushDeck: IAutoMovieVector3 = {
    x: board.centre.x + outside * (board.width / 2 + PUSH_MARGIN * footLength),
    y: rear.y,
    z: rear.z,
  };
  const pushFrame: IAutoMovieRigidTransform = frame(phases.push);
  const pushPoint: IAutoMovieVector3 = {
    ...HumanSurfaceBoard.world(pushFrame, pushDeck),
    y: ground,
  };
  const boardRotation = (
    placement: IAutoMovieRigidTransform,
    side: AutoMovieHumanSide,
  ): IAutoMovieQuaternion =>
    Quaternion.multiply(
      Quaternion.multiply(
        placement.rotation,
        Quaternion.inverse(initial.rotation),
      ),
      entry.feet[side].rotation,
    );
  const pushRotation: IAutoMovieQuaternion = HumanFoot.rotation(
    HumanSurfaceBoard.heading(boardRotation(pushFrame, other)),
    0,
  );
  const support: IAutoMovieMotionHumanContactWindow.Support = {
    kind: "prop",
    subject: params.on,
  };
  const contacts: IAutoMovieMotionHumanContactWindow[] = [
    HumanSurfaceBoard.plant(leadFoot, phases.settle, phases.lift, support),
    HumanSurfaceBoard.plant(pushFoot, phases.settle, phases.step, support),
    HumanSurfaceBoard.plant(pushFoot, phases.push, phases.recover, {
      kind: "ground",
      height: ground,
    }),
    HumanSurfaceBoard.plant(pushFoot, phases.stance, phases.load, support),
    HumanSurfaceBoard.plant(pushFoot, phases.pop, phases.lift, support),
    HumanSurfaceBoard.plant(leadFoot, phases.land, 1, support),
    HumanSurfaceBoard.plant(pushFoot, phases.land, 1, support),
  ];
  const lowerForPush: ReturnType<typeof lowerHumanPosture.prepare> =
    lowerHumanPosture.prepare(body);

  const posture = (seconds: number): IAutoMovieMotionHumanPosture => {
    const share: number = Math.max(0, Math.min(1, seconds / duration));
    const placed: IAutoMovieRigidTransform = frame(share);
    const at = (point: IAutoMovieVector3): IAutoMovieVector3 =>
      HumanSurfaceBoard.world(placed, point);
    const fade = (from: number, to: number): number =>
      HumanSurfaceBoard.ease(share, from, to);
    const moving: IAutoMovieMotionHumanPosture = HumanSupportCarry.posture(
      HumanSupportCarry(
        (time: number): IAutoMovieRigidTransform =>
          time === 0 ? initial : placed,
        0,
        1,
      ),
      start,
    );

    const takeoff: number =
      fade(phases.lift, phases.apex) - fade(phases.apex, phases.land);
    const settled: number = fade(0, phases.settle);
    const toeClearance: number = TOE_CLEARANCE * footLength;
    const tailFoot: IAutoMovieVector3 = Vector3.lerp(
      rear,
      tail,
      fade(phases.load, phases.pop),
    );
    const feet: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
      left: at(front),
      right: at(front),
    };
    feet[lead] = at({
      ...front,
      y:
        enteredFront.y +
        settled * (front.y - enteredFront.y) +
        toeClearance * takeoff,
    });

    const departure: number = fade(phases.step, phases.push);
    const recovery: number = fade(phases.recover, phases.stance);
    const inStreet: number = departure - recovery;
    const shiftBack: number = fade(phases.lift, phases.land);
    feet[other] = Vector3.lerp(
      at(Vector3.lerp(tailFoot, rear, shiftBack)),
      pushPoint,
      inStreet,
    );
    if (share < phases.push)
      feet[other] = Vector3.lerp(
        at(Vector3.lerp(enteredRear, behind, settled)),
        pushPoint,
        departure,
      );
    feet[other] = {
      ...feet[other],
      y:
        feet[other].y +
        toeClearance *
          (Math.sin(Math.PI * departure) +
            Math.sin(Math.PI * recovery) +
            TAKEOFF_TOE_LIFT * takeoff),
    };
    const footRotations: Record<AutoMovieHumanSide, IAutoMovieQuaternion> = {
      left: boardRotation(placed, "left"),
      right: boardRotation(placed, "right"),
    };
    footRotations[other] = Quaternion.slerp(
      footRotations[other],
      pushRotation,
      inStreet,
    );

    // Compression prepares the pop and absorbs the landing. Let the
    // authored board carry the travel and keep the weight shift in the knees.
    const compression: number =
      fade(phases.stance, phases.pop) - fade(phases.lift, phases.apex);
    const absorption: number =
      fade(phases.land, phases.absorb) - fade(phases.absorb, 1);
    const balance: IAutoMovieVector3 = Vector3.lerp(
      moving.root,
      Vector3.lerp(feet[lead], pushPoint, 0.5),
      inStreet,
    );
    const root: IAutoMovieVector3 = {
      ...balance,
      y:
        moving.root.y -
        body.measure.thigh *
          (LOAD_DROP * compression +
            ABSORB_DROP * absorption +
            PUSH_DROP * inStreet) +
        toeClearance * takeoff,
    };
    const goals: Record<
      AutoMovieHumanSide,
      Omit<IAutoMovieHumanLimbGoal, "bend">
    > = {
      left: HumanSurfaceBoard.ankle(
        body,
        "left",
        feet.left,
        footRotations.left,
        false,
      ),
      right: HumanSurfaceBoard.ankle(
        body,
        "right",
        feet.right,
        footRotations.right,
        false,
      ),
    };
    // Fit the stance before solving its knees. At the ground plant the
    // full drop follows the body's measured two-leg reach. Ease it through
    // the unplanted approach and return so the pelvis can follow both feet.
    if (inStreet > 0) {
      const lowered: IAutoMovieMotionHumanPosture = lowerForPush({
        ...moving,
        root,
        limbs: {
          leftLeg: { ...goals.left, bend: root, planted: true },
          rightLeg: { ...goals.right, bend: root, planted: true },
        },
      });
      root.y += inStreet * (lowered.root.y - root.y);
    }
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = stand.legs(
      body,
      root,
      moving.yaw,
      {
        left: goals.left.point,
        right: goals.right.point,
      },
    );
    for (const side of ["left", "right"] as const) {
      const leg: AutoMovieHumanLimb = side === "left" ? "leftLeg" : "rightLeg";
      limbs[leg] = {
        ...limbs[leg]!,
        ...goals[side],
        planted: contacts.some(
          ({ part, from, to }: IAutoMovieMotionHumanContactWindow): boolean =>
            part === side + "Foot" && share >= from && share <= to,
        ),
      };
    }
    return { ...moving, root, limbs: { ...moving.limbs, ...limbs } };
  };
  return {
    duration,
    events: Object.entries(phases).map(
      ([name, share]: [string, number]): IAutoMovieMotionEvent => ({
        name,
        share,
      }),
    ),
    contacts,
    physicalWindow: null,
    posture,
  };
}

/** The staged skateboard cue shares, in story order. */
export namespace prepareSkateboardPhrase {
  /** Film-phase shares. Individual athletes retain the same contact order. */
  export const SHARES = {
    settle: 0.04,
    step: 0.06,
    push: 0.14,
    recover: 0.24,
    stance: 0.37,
    load: 0.44,
    pop: 0.5,
    tail: 0.54,
    lift: 0.54,
    apex: 0.65,
    land: 0.79,
    absorb: 0.87,
  } as const;
}
