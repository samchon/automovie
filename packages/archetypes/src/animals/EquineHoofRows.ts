import {
  Vector3,
  AutoMovieEngineMotionSampling,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieArchetypeFrame } from "../core";
import type { AutoMovieArchetypeEquineComfortCue } from "./AutoMovieArchetypeEquineComfortCue";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import type { EquineBodyPose } from "./EquineBodyPose";
import type { EquineStanceRows } from "./EquineStanceRows";
import { EquineStanceSupport } from "./EquineStanceSupport";

/**
 * The share of a lifting row's entry spent moving the weight off the hoof
 * before it leaves the floor: authored, as the stance rows' own.
 */
const LOAD: number = 0.35;

/**
 * A pawing stroke's reach ahead of and drag behind the hoof's place and its
 * swing's height, metres; the trunk's settle while pawing: authored.
 */
const PAW: Readonly<IPawShape> = {
  reach: 0.12,
  drag: 0.08,
  lift: 0.12,
  settle: 0.02,
};

/** A stamp's lift, metres: authored. */
const STAMP: number = 0.12;

/**
 * A cow-kick's joint turns, degrees, hip first, negative swinging the hoof
 * forward: an authored pose.
 */
const COW_KICK: readonly [number, number, number, number] = [-45, 30, -60, 30];

/** The pawing stroke's authored shape. */
interface IPawShape {
  /** Metres ahead of the hoof's place a stroke reaches. */
  reach: number;

  /** Metres behind it a stroke scrapes to. */
  drag: number;

  /** Metres a stroke's swing rises. */
  lift: number;

  /** Metres the trunk settles while pawing. */
  settle: number;
}

/**
 * The comfort rows that move one hoof: pawing, stamping and the cow-kick.
 *
 * Each first moves the weight inside the other three hooves
 * (`EquineStanceSupport.transfer`) and only then moves its hoof; every row
 * returns to its start through its exit. Pawing scrapes the hoof back along the
 * floor once per stroke, so it meets the floor in each; a stamp strikes the
 * hoof back on its own place; a cow-kick swings the hind hoof forward toward
 * the belly at an insect (Przewalski's horse ethogram, BMC Zoology 2022, Table
 * 3). The amplitudes are authored.
 */
export namespace EquineHoofRows {
  /**
   * Pawing with a fore hoof.
   *
   * @param body The prepared solver.
   * @param start The state it starts from.
   * @param cue The paw.
   * @returns Its plan, returning to the start.
   * @throws {RangeError} For strokes that are not a positive whole number.
   */
  export function paw<Id extends string, D extends string>(
    body: EquineBodyPose.IPrepared<Id, D>,
    start: EquineStanceRows.IState,
    cue: AutoMovieArchetypeEquineComfortCue.IPaw,
  ): EquineStanceRows.IPlan {
    if (!(cue.strokes > 0))
      throw new RangeError("Pawing takes a positive whole number of strokes");
    const limb: AutoMovieArchetypeQuadrupedBody.Limb = `${cue.side}Fore`;
    const loaded: AutoMovieArchetypeFrame.IMotion = EquineStanceSupport.moved(
      start.trunk,
      Vector3.add(EquineStanceSupport.transfer(body, start, limb), {
        x: 0,
        y: -PAW.settle,
        z: 0,
      }),
    );
    const place: IAutoMovieVector3 = start.anchors[limb];
    const forward: IAutoMovieVector3 = EquineStanceSupport.along(start.trunk, {
      x: 0,
      y: 0,
      z: 1,
    });
    const front: IAutoMovieVector3 = Vector3.addScaled(
      place,
      forward,
      PAW.reach,
    );
    const back: IAutoMovieVector3 = Vector3.addScaled(
      place,
      forward,
      -PAW.drag,
    );
    const period: number = cue.hold / cue.strokes;
    const placed = (anchor: IAutoMovieVector3): EquineBodyPose.IGoal => ({
      trunk: loaded,
      limbs: {
        ...EquineStanceSupport.placed(start.anchors),
        [limb]: { kind: "placed", anchor, fold: 0 },
      },
    });
    const time: number = AutoMovieEngineMotionSampling.minimumJerkTime(LOAD);
    return {
      cue,
      start,
      end: start,
      keys: [LOAD, (1 + LOAD) / 2, 1],
      events: [
        { label: `${limb}Off`, entry: true, time },
        { label: `${limb}On`, entry: false, time },
      ],
      goal: (share: number): EquineBodyPose.IGoal =>
        share <= LOAD
          ? {
              trunk: EquineStanceSupport.blend(
                start.trunk,
                loaded,
                share / LOAD,
              ),
              limbs: EquineStanceSupport.placed(start.anchors),
            }
          : placed(
              EquineStanceSupport.arc(
                place,
                back,
                AutoMovieEngineMotionSampling.minimumJerkShare((share - LOAD) / (1 - LOAD)),
                PAW.lift / 2,
              ),
            ),
      hold: (seconds: number): EquineBodyPose.IGoal => {
        const k: number = Math.min(
          cue.strokes - 1,
          Math.floor(seconds / period),
        );
        const u: number = Math.min(1, seconds / period - k);
        return placed(
          u < 0.5
            ? EquineStanceSupport.arc(
                back,
                front,
                AutoMovieEngineMotionSampling.minimumJerkShare(u / 0.5),
                PAW.lift,
              )
            : Vector3.lerp(front, back, AutoMovieEngineMotionSampling.minimumJerkShare((u - 0.5) / 0.5)),
        );
      },
    };
  }

  /**
   * A stamp of one hoof.
   *
   * @param body The prepared solver.
   * @param start The state it starts from.
   * @param cue The stamp.
   * @returns Its plan, returning to the start.
   */
  export function stamp<Id extends string, D extends string>(
    body: EquineBodyPose.IPrepared<Id, D>,
    start: EquineStanceRows.IState,
    cue: AutoMovieArchetypeEquineComfortCue.IStamp,
  ): EquineStanceRows.IPlan {
    const loaded: AutoMovieArchetypeFrame.IMotion = EquineStanceSupport.moved(
      start.trunk,
      EquineStanceSupport.transfer(body, start, cue.limb),
    );
    const place: IAutoMovieVector3 = start.anchors[cue.limb];
    const raised: IAutoMovieVector3 = Vector3.add(place, {
      x: 0,
      y: STAMP,
      z: 0,
    });
    const time: number = AutoMovieEngineMotionSampling.minimumJerkTime(LOAD);
    return {
      cue,
      start,
      end: start,
      keys: [LOAD, 1],
      events: [
        { label: `${cue.limb}Off`, entry: true, time },
        { label: `${cue.limb}On`, entry: false, time },
      ],
      goal: (share: number): EquineBodyPose.IGoal =>
        share <= LOAD
          ? {
              trunk: EquineStanceSupport.blend(
                start.trunk,
                loaded,
                share / LOAD,
              ),
              limbs: EquineStanceSupport.placed(start.anchors),
            }
          : {
              trunk: loaded,
              limbs: {
                ...EquineStanceSupport.placed(start.anchors),
                [cue.limb]: {
                  kind: "placed",
                  anchor: Vector3.lerp(
                    place,
                    raised,
                    (share - LOAD) / (1 - LOAD),
                  ),
                  fold: 0,
                },
              },
            },
    };
  }

  /**
   * A cow-kick of one hind hoof at an insect.
   *
   * @param body The prepared solver.
   * @param start The state it starts from.
   * @param cue The cow-kick.
   * @returns Its plan, returning to the start.
   */
  export function cowKick<Id extends string, D extends string>(
    body: EquineBodyPose.IPrepared<Id, D>,
    start: EquineStanceRows.IState,
    cue: AutoMovieArchetypeEquineComfortCue.ICowKick,
  ): EquineStanceRows.IPlan {
    const limb: AutoMovieArchetypeQuadrupedBody.Limb = `${cue.side}Hind`;
    const loaded: AutoMovieArchetypeFrame.IMotion = EquineStanceSupport.moved(
      start.trunk,
      EquineStanceSupport.transfer(body, start, limb),
    );
    const chain: readonly IAutoMovieVector3[] = body.chain(limb, loaded, {
      kind: "placed",
      anchor: start.anchors[limb],
      fold: 0,
    });
    const time: number = AutoMovieEngineMotionSampling.minimumJerkTime(LOAD);
    return {
      cue,
      start,
      end: start,
      keys: [LOAD, 1],
      events: [
        { label: `${limb}Off`, entry: true, time },
        { label: `${limb}On`, entry: false, time },
      ],
      goal: (share: number): EquineBodyPose.IGoal =>
        share <= LOAD
          ? {
              trunk: EquineStanceSupport.blend(
                start.trunk,
                loaded,
                share / LOAD,
              ),
              limbs: EquineStanceSupport.placed(start.anchors),
            }
          : {
              trunk: loaded,
              limbs: {
                ...EquineStanceSupport.placed(start.anchors),
                [limb]: EquineStanceSupport.folded(
                  chain,
                  COW_KICK,
                  (share - LOAD) / (1 - LOAD),
                ),
              },
            },
    };
  }
}
