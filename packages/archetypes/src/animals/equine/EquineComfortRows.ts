import {
  Quaternion,
  Vector3,
  AutoMovieEngineMath,
  AutoMovieEngineMotionSampling,
} from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "../../core";
import type { AutoMovieArchetypeEquineComfortCue } from "../AutoMovieArchetypeEquineComfortCue";
import type { AutoMovieArchetypeEquineStanceCue } from "../AutoMovieArchetypeEquineStanceCue";
import { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";
import { EquineBodyPose } from "./EquineBodyPose";
import { EquineCampOut } from "./EquineCampOut";
import { EquineHoofRows } from "./EquineHoofRows";
import type { EquineStanceRows } from "./EquineStanceRows";
import { EquineStanceSupport } from "./EquineStanceSupport";

/** The zero vector. */
const ZERO: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/**
 * The share of a lifting row's entry spent moving the weight off the hoof
 * before it leaves the floor: authored.
 */
const LOAD: number = 0.35;

/**
 * A resting hind hoof's tip onto its toe, its terminal bar's lower end turned
 * this many degrees behind vertical so the rim's front is lowest; its forward
 * set and lift, metres; the hips' tilt, degrees: authored.
 */
const REST: Readonly<IRestShape> = {
  tip: 20,
  forward: 0.05,
  tilt: 3,
  arc: 0.04,
};

/** A trunk shake's roll, degrees, and rate, Hz: authored. */
const SHAKE: Readonly<IShakeShape> = { roll: 6, hertz: 3 };

/** The comfort rows' kinds. */
const KINDS: ReadonlySet<string> = new Set<
  AutoMovieArchetypeEquineComfortCue.Row["kind"]
>(["rest", "paw", "stamp", "cowKick", "shake", "camp"]);

/** The standing rest's authored shape. */
interface IRestShape {
  /** Degrees behind vertical the resting hoof's terminal bar points down. */
  tip: number;

  /** Metres it is set forward. */
  forward: number;

  /** Degrees the hips tilt to the resting side. */
  tilt: number;

  /** Metres it is lifted on its way. */
  arc: number;
}

/** The trunk shake's authored shape. */
interface IShakeShape {
  /** Degrees of roll. */
  roll: number;

  /** Rolls per second. */
  hertz: number;
}

/**
 * The comfort rows of the stance: the standing rest on a tipped hind hoof,
 * pawing, stamping, the cow-kick, the trunk shake and the camped-out stance.
 *
 * Each row follows the stance's shares and support rules (`EquineStanceRows`):
 * before a hoof leaves the floor the weight moves inside the other three
 * (`EquineStanceSupport.transfer`); every authored shift and turn is in the
 * horse's own heading. The rest locks one hind and tilts the hips about its hip
 * joint toward the resting side, setting the other hoof down on its toe with
 * its terminal bar turned past vertical, its lower end behind its upper, so
 * only the rim's front touches the floor (Equine posture ethogram, Animals
 * 2021; the stay apparatus). A shake rolls the trunk over four planted hooves
 * in whole cycles through its hold. Pawing, stamping and the cow-kick are
 * `EquineHoofRows`' and camping out `EquineCampOut`'s. Every row returns to its
 * start through its exit. All amplitudes are authored.
 */
export namespace EquineComfortRows {
  /**
   * Whether a stance cue is a comfort row.
   *
   * @param cue The cue.
   * @returns Whether `plan` owns it.
   */
  export function owns(
    cue: AutoMovieArchetypeEquineStanceCue.Cue,
  ): cue is AutoMovieArchetypeEquineComfortCue.Row {
    return KINDS.has(cue.kind);
  }

  /**
   * Plan one comfort row from a state.
   *
   * @param body The prepared solver.
   * @param start The state it starts from.
   * @param cue The row.
   * @returns Its plan, returning to the start.
   * @throws {RangeError} For a paw whose strokes are not a positive whole
   *   number.
   */
  export function plan<Id extends string, D extends string>(
    body: EquineBodyPose.IPrepared<Id, D>,
    start: EquineStanceRows.IState,
    cue: AutoMovieArchetypeEquineComfortCue.Row,
  ): EquineStanceRows.IPlan {
    if (cue.kind === "rest") return rest(body, start, cue);
    if (cue.kind === "paw") return EquineHoofRows.paw(body, start, cue);
    if (cue.kind === "stamp") return EquineHoofRows.stamp(body, start, cue);
    if (cue.kind === "cowKick") return EquineHoofRows.cowKick(body, start, cue);
    if (cue.kind === "shake") return shake(body, start, cue);
    return EquineCampOut.plan(body, start, cue);
  }

  /**
   * The standing rest: load the locked hind, tilt the hips about its hip joint
   * and set the resting hoof down on its toe.
   */
  function rest<Id extends string, D extends string>(
    body: EquineBodyPose.IPrepared<Id, D>,
    start: EquineStanceRows.IState,
    cue: AutoMovieArchetypeEquineComfortCue.IRest,
  ): EquineStanceRows.IPlan {
    const resting: AutoMovieArchetypeQuadrupedBody.Limb = `${cue.side}Hind`;
    const locked: AutoMovieArchetypeQuadrupedBody.Limb =
      cue.side === "left" ? "rightHind" : "leftHind";
    const heading: IAutoMovieQuaternion = EquineStanceSupport.heading(
      start.trunk,
    );
    const loaded: AutoMovieArchetypeFrame.IMotion = EquineStanceSupport.moved(
      start.trunk,
      EquineStanceSupport.transfer(body, start, resting),
    );
    const pivot: IAutoMovieVector3 = EquineBodyPose.point(
      loaded,
      body.chains[locked][0]!,
    );
    const roll: number = cue.side === "left" ? -REST.tilt : REST.tilt;
    const flat: IAutoMovieVector3 = Vector3.subtract(
      body.chains[resting][4]!,
      body.chains[resting][3]!,
    );
    const lateral: IAutoMovieVector3 = Quaternion.rotateVector(heading, {
      x: 1,
      y: 0,
      z: 0,
    });
    const toe: IAutoMovieQuaternion = AutoMovieEngineMath.rotationBetween(
      flat,
      Quaternion.rotateVector(Quaternion.fromAxisAngle(lateral, REST.tip), {
        x: 0,
        y: -1,
        z: 0,
      }),
    );
    const tipped = (share: number): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        Quaternion.slerp({ x: 0, y: 0, z: 0, w: 1 }, toe, share),
        flat,
      );
    const from: IAutoMovieVector3 = start.anchors[resting];
    const to: IAutoMovieVector3 = Vector3.add(
      Vector3.add(
        from,
        EquineStanceSupport.along(start.trunk, {
          x: 0,
          y: 0,
          z: REST.forward,
        }),
      ),
      {
        x: 0,
        y: body.sole(resting, tipped(1)) - body.sole(resting, flat),
        z: 0,
      },
    );
    const time: number = AutoMovieEngineMotionSampling.minimumJerkTime(LOAD);
    return {
      cue,
      start,
      end: start,
      keys: [LOAD, (1 + LOAD) / 2, 1],
      events: [
        { label: `${resting}Off`, entry: true, time },
        { label: `${resting}Toe`, entry: true, time: 1 },
        { label: `${resting}On`, entry: false, time },
      ],
      goal: (share: number): EquineBodyPose.IGoal => {
        if (share <= LOAD)
          return {
            trunk: EquineStanceSupport.blend(start.trunk, loaded, share / LOAD),
            limbs: EquineStanceSupport.placed(start.anchors),
          };
        const s: number = AutoMovieEngineMotionSampling.minimumJerkShare((share - LOAD) / (1 - LOAD));
        return {
          trunk: AutoMovieArchetypeFrame.chain(
            EquineBodyPose.turn(0, roll * s, pivot, ZERO, heading),
            loaded,
          ),
          limbs: {
            ...EquineStanceSupport.placed(start.anchors),
            [resting]: {
              kind: "placed",
              anchor: EquineStanceSupport.arc(from, to, s, REST.arc),
              fold: 0,
              direction: tipped(s),
            },
          },
        };
      },
    };
  }

  /** A trunk shake: whole roll cycles over four planted hooves through the hold. */
  function shake<Id extends string, D extends string>(
    body: EquineBodyPose.IPrepared<Id, D>,
    start: EquineStanceRows.IState,
    cue: AutoMovieArchetypeEquineComfortCue.IShake,
  ): EquineStanceRows.IPlan {
    const heading: IAutoMovieQuaternion = EquineStanceSupport.heading(
      start.trunk,
    );
    const pivot: IAutoMovieVector3 = EquineBodyPose.point(
      start.trunk,
      Vector3.scale(
        AutoMovieArchetypeQuadrupedBody.LIMBS.reduce(
          (
            sum: IAutoMovieVector3,
            limb: AutoMovieArchetypeQuadrupedBody.Limb,
          ) => Vector3.add(sum, body.chains[limb][0]!),
          ZERO,
        ),
        1 / AutoMovieArchetypeQuadrupedBody.LIMBS.length,
      ),
    );
    const cycles: number = Math.max(1, Math.round(cue.hold * SHAKE.hertz));
    const still: EquineBodyPose.IGoal = {
      trunk: start.trunk,
      limbs: EquineStanceSupport.placed(start.anchors),
    };
    return {
      cue,
      start,
      end: start,
      keys: [1],
      events: [],
      goal: (): EquineBodyPose.IGoal => still,
      hold: (seconds: number): EquineBodyPose.IGoal => ({
        trunk: AutoMovieArchetypeFrame.chain(
          EquineBodyPose.turn(
            0,
            SHAKE.roll * Math.sin((2 * Math.PI * cycles * seconds) / cue.hold),
            pivot,
            ZERO,
            heading,
          ),
          start.trunk,
        ),
        limbs: still.limbs,
      }),
    };
  }
}
