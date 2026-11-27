import {
  Vector3,
  AutoMovieEngineMotionSampling,
} from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "../core";
import type { AutoMovieArchetypeEquineExpressionCue } from "./AutoMovieArchetypeEquineExpressionCue";
import type { AutoMovieArchetypeEquineStanceCue } from "./AutoMovieArchetypeEquineStanceCue";
import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { EquineAirs } from "./EquineAirs";
import { EquineBodyPose } from "./EquineBodyPose";
import { EquineStanceExtras } from "./EquineStanceExtras";
import { EquineStanceMoves } from "./EquineStanceMoves";
import { EquineStanceSupport } from "./EquineStanceSupport";

/**
 * The startle's drop and draw over the planted hooves, metres in the stance's
 * frame: authored.
 */
const STARTLE: IAutoMovieVector3 = { x: 0, y: -0.05, z: -0.06 };

/** The baulk's brace back, metres: authored. */
const BAULK: IAutoMovieVector3 = { x: 0, y: -0.02, z: -0.12 };

/**
 * The haunches' lowering before a rear, and the forehand's before a buck,
 * metres: authored.
 */
const GATHER: number = 0.06;

/**
 * The share of an entry spent moving the weight before a support is released:
 * authored.
 */
const LOAD: number = 0.35;

/** A stepping hoof's peak lift, metres: authored. */
const LIFT: number = 0.08;

/** A folded limb pose of the rows. */
type Fold = "foreLift" | "hindLift" | "rear" | "kick";

/** A limb end of the body. */
type End = "Fore" | "Hind";

/** A response that pitches the trunk. */
type Pitched =
  | AutoMovieArchetypeEquineStanceCue.IRear
  | AutoMovieArchetypeEquineStanceCue.IBuck;

/**
 * Folded limbs' joint turns, degrees, shoulder or hip first, positive swinging
 * the distal end back: authored poses.
 */
const FOLDS: Readonly<Record<Fold, readonly [number, number, number, number]>> =
  {
    foreLift: [25, 10, 95, 40],
    hindLift: [-20, 15, -50, 30],
    rear: [-40, -10, 100, 20],
    kick: [45, -10, 20, 10],
  };

/**
 * The rows of the stance: for each response, the whole-body pose at each share
 * of its performance.
 *
 * A row's share runs from 0 at its entry to 1 at its hold. A response that
 * returns plays the same shares back through its exit; a step aside goes on
 * from 1 to 2 through its exit, settling its weight over the hooves it stepped
 * to. Before a hoof leaves the floor the trunk first carries the proxy centre
 * of mass inside the triangle of the hooves that stay
 * (`EquineStanceSupport.transfer`), and a rear or a buck first lowers the
 * haunches or the forehand onto the supports that stay; the released limb then
 * folds from where it was released, so the pose is continuous there.
 */
export namespace EquineStanceRows {
  /** Where the stance stands: the trunk's motion and the four hoof anchors. */
  export interface IState {
    /** The trunk's motion. */
    trunk: AutoMovieArchetypeFrame.IMotion;

    /** Each hoof's terminal endpoint. */
    anchors: Readonly<
      Record<AutoMovieArchetypeQuadrupedBody.Limb, IAutoMovieVector3>
    >;
  }

  /** A support event: a hoof leaving or meeting the floor. */
  export interface IEvent {
    /** The instant's label. */
    label: string;

    /** Whether it falls in the entry; otherwise in the exit. */
    entry: boolean;

    /**
     * Its fraction of that phase's time, measured from the phase's start for an
     * entry or a forward exit and from its end for a played-back exit.
     */
    time: number;
  }

  /** One response planned from a state. */
  export interface IPlan {
    /** The response. */
    cue: AutoMovieArchetypeEquineStanceCue.Cue;

    /** The state it starts from. */
    start: IState;

    /** The state it ends in; the start itself for a response that returns. */
    end: IState;

    /** The shares the stance solves at admission. */
    keys: readonly number[];

    /** Its support events. */
    events: readonly IEvent[];

    /** The pose at a share. */
    goal(share: number): EquineBodyPose.IGoal;

    /**
     * The pose at a second into the hold, for a response that moves while held,
     * such as an air's leaps; absent, the hold keeps the pose at share 1.
     */
    hold?(seconds: number): EquineBodyPose.IGoal;
  }

  /**
   * The stance standing still in a state.
   *
   * @param state The state.
   * @returns Every hoof on its anchor under the state's trunk.
   */
  export function still(state: IState): EquineBodyPose.IGoal {
    return {
      trunk: state.trunk,
      limbs: EquineStanceSupport.placed(state.anchors),
    };
  }

  /**
   * Plan one response from a state.
   *
   * @param body The prepared solver.
   * @param start The state it starts from.
   * @param cue The response.
   * @returns Its plan.
   */
  export function plan<Id extends string, D extends string>(
    body: EquineBodyPose.IPrepared<Id, D>,
    start: IState,
    cue: AutoMovieArchetypeEquineStanceCue.Cue,
  ): IPlan {
    const base: Pick<IPlan, "cue" | "start" | "end"> = {
      cue,
      start,
      end: start,
    };
    if (
      cue.kind === "shift" ||
      cue.kind === "startle" ||
      cue.kind === "baulk"
    ) {
      const shift: IAutoMovieVector3 =
        cue.kind === "shift"
          ? { x: cue.x, y: cue.y, z: cue.z }
          : cue.kind === "startle"
            ? STARTLE
            : BAULK;
      return {
        ...base,
        keys: [1],
        events: [],
        goal: (share: number): EquineBodyPose.IGoal => ({
          trunk: EquineStanceSupport.moved(
            start.trunk,
            EquineStanceSupport.along(start.trunk, Vector3.scale(shift, share)),
          ),
          limbs: EquineStanceSupport.placed(start.anchors),
        }),
      };
    }
    if (cue.kind === "hoof") {
      const loaded: AutoMovieArchetypeFrame.IMotion = EquineStanceSupport.moved(
        start.trunk,
        EquineStanceSupport.transfer(body, start, cue.limb),
      );
      const chain: readonly IAutoMovieVector3[] = body.chain(cue.limb, loaded, {
        kind: "placed",
        anchor: start.anchors[cue.limb],
        fold: 0,
      });
      const turns: readonly [number, number, number, number] =
        cue.limb.endsWith("Fore") ? FOLDS.foreLift : FOLDS.hindLift;
      const time: number = AutoMovieEngineMotionSampling.minimumJerkTime(LOAD);
      return {
        ...base,
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
                  [cue.limb]: EquineStanceSupport.folded(
                    chain,
                    turns,
                    (share - LOAD) / (1 - LOAD),
                  ),
                },
              },
      };
    }
    if (cue.kind === "stepAside") return step(body, start, cue);
    if (cue.kind === "spin") return EquineStanceMoves.spin(body, start, cue);
    if (cue.kind === "crowHops")
      return EquineStanceMoves.crowHops(body, start, cue);
    if (cue.kind === "setBack")
      return EquineStanceMoves.setBack(body, start, cue);
    if (cue.kind === "capriole") return EquineAirs.capriole(body, start, cue);
    if (cue.kind === "air" || cue.kind === "courbette")
      return EquineAirs.held(
        body,
        cue,
        (rear: AutoMovieArchetypeEquineStanceCue.IRear) =>
          pitch(body, start, rear),
      );
    if (EquineStanceExtras.owns(cue))
      return EquineStanceExtras.plan(body, start, cue);
    return pitch(body, start, cue);
  }

  /**
   * A step aside: each hoof in turn, the weight moved off it first, then swung
   * on a lifted path; the exit settles over the new anchors.
   */
  function step<Id extends string, D extends string>(
    body: EquineBodyPose.IPrepared<Id, D>,
    start: IState,
    cue: AutoMovieArchetypeEquineStanceCue.IStepAside,
  ): IPlan {
    const sign: number = cue.side === "left" ? 1 : -1;
    const offset: IAutoMovieVector3 = EquineStanceSupport.along(start.trunk, {
      x: sign * cue.width,
      y: 0,
      z: 0,
    });
    const near: AutoMovieArchetypeEquineExpressionCue.Side = cue.side;
    const far: AutoMovieArchetypeEquineExpressionCue.Side =
      cue.side === "left" ? "right" : "left";
    const order: readonly AutoMovieArchetypeQuadrupedBody.Limb[] = [
      `${near}Fore`,
      `${near}Hind`,
      `${far}Fore`,
      `${far}Hind`,
    ];
    const states: IState[] = [start];
    const loads: AutoMovieArchetypeFrame.IMotion[] = [];
    for (const limb of order) {
      const before: IState = states.at(-1)!;
      const loaded: AutoMovieArchetypeFrame.IMotion = EquineStanceSupport.moved(
        before.trunk,
        EquineStanceSupport.transfer(body, before, limb),
      );
      loads.push(loaded);
      states.push({
        trunk: loaded,
        anchors: {
          ...before.anchors,
          [limb]: Vector3.add(before.anchors[limb], offset),
        },
      });
    }
    const end: IState = {
      trunk: EquineStanceSupport.moved(start.trunk, offset),
      anchors: states.at(-1)!.anchors,
    };
    const quarter: number = 1 / order.length;
    const events: IEvent[] = order.flatMap(
      (limb: AutoMovieArchetypeQuadrupedBody.Limb, k: number): IEvent[] => [
        {
          label: `${limb}Off`,
          entry: true,
          time: AutoMovieEngineMotionSampling.minimumJerkTime((k + LOAD) * quarter),
        },
        {
          label: `${limb}On`,
          entry: true,
          time: AutoMovieEngineMotionSampling.minimumJerkTime((k + 1) * quarter),
        },
      ],
    );
    return {
      cue,
      start,
      end,
      keys: order
        .flatMap(
          (_: AutoMovieArchetypeQuadrupedBody.Limb, k: number): number[] => [
            (k + LOAD) * quarter,
            (k + (1 + LOAD) / 2) * quarter,
          ],
        )
        .concat([1, 2]),
      events,
      goal: (share: number): EquineBodyPose.IGoal => {
        if (share >= 1)
          return {
            trunk: EquineStanceSupport.blend(
              states.at(-1)!.trunk,
              end.trunk,
              share - 1,
            ),
            limbs: EquineStanceSupport.placed(end.anchors),
          };
        const k: number = Math.min(
          order.length - 1,
          Math.floor(share / quarter),
        );
        const local: number = share / quarter - k;
        const before: IState = states[k]!;
        const limb: AutoMovieArchetypeQuadrupedBody.Limb = order[k]!;
        if (local <= LOAD)
          return {
            trunk: EquineStanceSupport.blend(
              before.trunk,
              loads[k]!,
              local / LOAD,
            ),
            limbs: EquineStanceSupport.placed(before.anchors),
          };
        const swing: number = AutoMovieEngineMotionSampling.minimumJerkShare((local - LOAD) / (1 - LOAD));
        const anchor: IAutoMovieVector3 = Vector3.add(
          Vector3.lerp(
            before.anchors[limb],
            states[k + 1]!.anchors[limb],
            swing,
          ),
          { x: 0, y: LIFT * Math.sin(Math.PI * swing), z: 0 },
        );
        return {
          trunk: loads[k]!,
          limbs: {
            ...EquineStanceSupport.placed(before.anchors),
            [limb]: { kind: "placed", anchor, fold: 0 },
          },
        };
      },
    };
  }

  /**
   * A rear or a buck: gather onto the supports that stay, then pitch about them
   * with the released pair folded.
   */
  function pitch<Id extends string, D extends string>(
    body: EquineBodyPose.IPrepared<Id, D>,
    start: IState,
    cue: Pitched,
  ): IPlan {
    const rear: boolean = cue.kind === "rear";
    const heading: IAutoMovieQuaternion = EquineStanceSupport.heading(
      start.trunk,
    );
    const joint = (end: End): IAutoMovieVector3 =>
      Vector3.scale(
        Vector3.add(
          body.chains[`left${end}`][0]!,
          body.chains[`right${end}`][0]!,
        ),
        0.5,
      );
    const shoulders: IAutoMovieVector3 = joint("Fore");
    const hips: IAutoMovieVector3 = joint("Hind");
    const span: number = Math.abs(shoulders.z - hips.z);

    // The gather pitches about the pair that stays at rest, lowering the other end by GATHER.
    const gather: number = (Math.asin(GATHER / span) * 180) / Math.PI;
    const signed: number = rear ? gather : -gather;
    const gathered: AutoMovieArchetypeFrame.IMotion =
      AutoMovieArchetypeFrame.chain(
        EquineBodyPose.turn(
          signed,
          0,
          EquineBodyPose.point(start.trunk, rear ? shoulders : hips),
          { x: 0, y: 0, z: 0 },
          heading,
        ),
        start.trunk,
      );
    const released: readonly AutoMovieArchetypeQuadrupedBody.Limb[] = rear
      ? ["leftFore", "rightFore"]
      : ["leftHind", "rightHind"];
    const chains: Map<
      AutoMovieArchetypeQuadrupedBody.Limb,
      readonly IAutoMovieVector3[]
    > = new Map(
      released.map(
        (
          limb: AutoMovieArchetypeQuadrupedBody.Limb,
        ): [
          AutoMovieArchetypeQuadrupedBody.Limb,
          readonly IAutoMovieVector3[],
        ] => [
          limb,
          body.chain(limb, gathered, {
            kind: "placed",
            anchor: start.anchors[limb],
            fold: 0,
          }),
        ],
      ),
    );
    const pivot: IAutoMovieVector3 = EquineBodyPose.point(
      gathered,
      rear ? hips : shoulders,
    );
    const target: number = rear ? cue.pitch : -cue.pitch;
    const time: number = AutoMovieEngineMotionSampling.minimumJerkTime(LOAD);
    return {
      cue,
      start,
      end: start,
      keys: [LOAD, 1],
      events: released.flatMap(
        (limb: AutoMovieArchetypeQuadrupedBody.Limb): IEvent[] => [
          { label: `${limb}Off`, entry: true, time },
          { label: `${limb}On`, entry: false, time },
        ],
      ),
      goal: (share: number): EquineBodyPose.IGoal => {
        if (share <= LOAD)
          return {
            trunk: AutoMovieArchetypeFrame.chain(
              EquineBodyPose.turn(
                (signed * share) / LOAD,
                0,
                EquineBodyPose.point(start.trunk, rear ? shoulders : hips),
                { x: 0, y: 0, z: 0 },
                heading,
              ),
              start.trunk,
            ),
            limbs: EquineStanceSupport.placed(start.anchors),
          };
        const lift: number = (share - LOAD) / (1 - LOAD);
        const limbs: Record<
          AutoMovieArchetypeQuadrupedBody.Limb,
          EquineBodyPose.Limb
        > = EquineStanceSupport.placed(start.anchors);
        for (const limb of released)
          limbs[limb] = EquineStanceSupport.folded(
            chains.get(limb)!,
            rear ? FOLDS.rear : FOLDS.kick,
            lift,
          );
        return {
          trunk: AutoMovieArchetypeFrame.chain(
            EquineBodyPose.turn(
              (target - signed) * lift,
              0,
              pivot,
              { x: 0, y: 0, z: 0 },
              heading,
            ),
            gathered,
          ),
          limbs,
        };
      },
    };
  }
}
