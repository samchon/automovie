import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";

import { everydayTake } from "../../../../features/internal/everydayTake";
import { motionComplaints } from "../../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { carriageScene } from "../../../internal/carriageScene";
import { motionActionUnit } from "../../../internal/motionActionUnit";

/**
 * Carriage through real affordances (#3992), read as whole takes: the
 * integration spec of the carriages whose actions are each their own unit
 * (`test_motion_mechanism_carriage_don_backpack`, `_draw_handle`,
 * `_pull_suitcase`, `_doff_backpack`, `_tray_pick_up`, `_tray_raise` and
 * `_head_load_place`; the shoulders, the change of hands and the refusal are
 * whole units of their own).
 *
 * Scenarios, on m-average and f-small:
 *
 * 1. Airport arrival, stand > pickUp > putDown on the chest > operate > pickUp
 *
 * > Walk > walk > pickUp > workHeld: the take passes the shipped verdicts, which
 *    > include prop and body penetration (no backpack strap passes through an arm or
 *    > the trunk), and the backpack stays on its worn mount, within 5 mm, through
 *    > the walk and the turn while the suitcase is pulled.
 * 2. A waiter's tray, stand > pickUp > workHeld > walk > walk: the take passes the
 *    shipped verdicts, the tray stays within 10 degrees of level through the
 *    walk and the turn, read every film frame, and the bowl stays on it, its
 *    distance from the tray's origin within 5 mm from the walk's start to the
 *    film's end.
 * 3. A porter's head load, stand > pickUp > putDown on the head > walk: the take
 *    passes the shipped verdicts, the basket's base stays on the crown within 5
 *    mm through the walk, no hand on it, and still rests on the head at the
 *    walk's end.
 *
 * The checks of one action (the straps over the shoulders, the drawn handle,
 * the wheels and tracking, the doffing, the palm under the tray, the placings)
 * are its unit's.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each chain, the cross-action checks it keeps and where each action's own checks went.
 * @evidence contracts/development/testing.md#behavioral-verification Composes pickUp, putDown on a bone, operate, workHeld and walk, and reads the shipped verdicts and the displayed props on their carriers across the actions that carry them.
 * @evidence contracts/development/testing.md#independent-expectations The worn offsets and places are authored here; tolerances are named (`carriageScene`).
 * @evidence contracts/development/testing.md#distinguishing-cases Worn against held, palm against head, two bodies of opposite stature; each action's goal is its unit's.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_mechanism_carriage(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    for (const scene of SCENES)
      try {
        scene.run(body, `${name} ${scene.label}`, checks);
      } catch (error: unknown) {
        checks.check(
          `${name} ${scene.label} refused: ${everydayTake.describe(error)}`,
          false,
        );
      }
  }
  checks.assert("carriage");
}

/** The take of a scene with the shipped verdicts asserted. */
function play(
  label: string,
  body: IAutoMovieMotionHumanBody,
  props: readonly IAutoMovieMotionHumanProp[],
  chain: IAutoMovieMotionHumanChain,
): HumanPerformance {
  const take: HumanPerformance = carriageScene.perform(
    label,
    body,
    props,
    chain,
  );
  everydayTake.clean(label, take);
  return take;
}

/**
 * The airport arrival: backpack on, suitcase pulled through a turn, backpack
 * off.
 */
function arrival(
  body: IAutoMovieMotionHumanBody,
  label: string,
  checks: motionComplaints.IGatherer,
): void {
  const a: carriageScene.IArrival = carriageScene.arrival(body);
  const take: HumanPerformance = play(
    `${label} arrival`,
    body,
    a.props,
    carriageScene.doff(
      carriageScene.walks(
        carriageScene.pull(
          carriageScene.draw(
            carriageScene.don(HumanChain.subject("actor").stand(), a),
            a,
          ),
        ),
      ),
      body,
    ),
  );
  const walks: IAutoMovieMotionHumanSegment[] = carriageScene.named(
    take,
    "walk",
  );
  checks.check(
    `${label}: the backpack stays on its worn mount through the walk`,
    carriageScene.onBone(
      take,
      "chest",
      "pack",
      walks[0]!.start,
      walks[1]!.end,
    ) <= carriageScene.HOLD,
  );
}

/** A waiter's tray on the palm, level through a walk and a turn. */
function tray(
  body: IAutoMovieMotionHumanBody,
  label: string,
  checks: motionComplaints.IGatherer,
): void {
  const take: HumanPerformance = play(
    `${label} tray`,
    body,
    carriageScene.trayProps(),
    carriageScene
      .raise(carriageScene.lift(HumanChain.subject("actor").stand()), body)
      .walk({ to: { x: 0, y: 0, z: 1.5 } })
      .walk({ to: { x: -1.2, y: 0, z: 2.2 } }),
  );
  const walks: IAutoMovieMotionHumanSegment[] = carriageScene.named(
    take,
    "walk",
  );
  let tilt: number = 0;
  for (
    let t: number = walks[0]!.start;
    t <= walks[1]!.end;
    t += 1 / motionActionUnit.RATE
  )
    tilt = Math.max(tilt, carriageScene.tilt(take, "tray", t));
  checks.check(
    `${label}: the tray stays level (${tilt.toFixed(1)} degrees, ${carriageScene.tilt(take, "tray", walks[0]!.start).toFixed(1)} as the walk starts)`,
    tilt <= carriageScene.LEVEL,
  );
  checks.check(
    `${label}: the bowl stays on the tray`,
    Math.abs(
      carriageScene.bowl(take, take.duration) -
        carriageScene.bowl(take, walks[0]!.start),
    ) <= carriageScene.HOLD,
  );
}

/** A basket carried on the head through a walk. */
function headLoad(
  body: IAutoMovieMotionHumanBody,
  label: string,
  checks: motionComplaints.IGatherer,
): void {
  const h: carriageScene.IHeadLoad = carriageScene.headLoad(body);
  const take: HumanPerformance = play(
    `${label} head load`,
    body,
    h.props,
    carriageScene
      .place(HumanChain.subject("actor").stand(), h)
      .walk({ to: { x: 0, y: 0, z: 2 } }),
  );
  const walk: IAutoMovieMotionHumanSegment = carriageScene.named(
    take,
    "walk",
  )[0]!;
  checks.check(
    `${label}: the basket's base stays on the crown through the walk`,
    carriageScene.onBone(take, "head", "basket", walk.start, walk.end) <=
      carriageScene.HOLD,
  );
  checks.check(
    `${label}: the basket rests on the head`,
    take.prop("basket", walk.end).position.y >
      take.bones("actor", walk.end).get("head")!.worldPosition.y,
  );
}

/** One scenario of the spec. */
interface IScene {
  /** Its name. */
  label: string;

  /** Its run on one body. */
  run: (
    body: IAutoMovieMotionHumanBody,
    label: string,
    checks: motionComplaints.IGatherer,
  ) => void;
}

/** The scenarios. */
const SCENES: readonly IScene[] = [
  { label: "arrival", run: arrival },
  { label: "tray", run: tray },
  { label: "head load", run: headLoad },
];
