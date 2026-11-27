import {
  Quaternion,
  Vector3,
  AutoMovieEngineMotionSampling,
} from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "../../core";
import type { AutoMovieArchetypeEquineComfortCue } from "../AutoMovieArchetypeEquineComfortCue";
import type { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";
import { EquineBodyPose } from "./EquineBodyPose";
import type { EquineStanceRows } from "./EquineStanceRows";
import { EquineStanceSupport } from "./EquineStanceSupport";

/*
 * The share of a lifting step spent moving the weight off the hoof before it
 * leaves the floor: authored, as the stance rows' own.
 */
const LOAD: number = 0.35;

/*
 * The share of the entry spent lowering the hindquarters before the first hind
 * steps: authored.
 */
const LOWER: number = 0.2;

/*
 * How far each hind hoof steps back, metres: authored.
 */
const BACK: number = 0.2;

/*
 * Its swing's height, metres: authored.
 */
const LIFT: number = 0.06;

/*
 * How much nearer than at the halt each stepped hind's hip is kept to its
 * ankle, metres: authored room for the weight transfer.
 */
const ROOM: number = 0.03;

/*
 * The zero vector.
 */
const ZERO: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/*
 * The two hinds, in stepping order.
 */
const HINDS: readonly AutoMovieArchetypeQuadrupedBody.Limb[] = [
  "leftHind",
  "rightHind",
];

/*
 * The camped-out stance of urination: the hindquarters lowered, then each hind
 * hoof stepped back in turn.
 *
 * A hind limb standing square is nearly straight, so stepping its hoof back
 * with the hips where they were would take it out of its reach. The
 * hindquarters are first lowered by pitching the trunk up about the shoulders,
 * through the least angle that brings each hind's hip to within its halt
 * distance of its stepped-back ankle, less `ROOM`: a circle-to-point distance
 * on the sagittal plane, solved in closed form by the law of cosines. Each hind
 * then steps back like any lifted hoof, the weight first moved inside the other
 * three (`EquineStanceSupport.transfer`). The exit plays the entry back. The
 * step length, swing height and room are authored.
 */
export namespace EquineCampOut {
  /*
   * Plan the camped-out stance from a state.
   * Parameter body: The prepared solver.
   * Parameter start: The state it starts from.
   * Parameter cue: The camp row.
   * Returns: Its plan, returning to the start.
   */
  export function plan<Id extends string, D extends string>(
    body: EquineBodyPose.IPrepared<Id, D>,
    start: EquineStanceRows.IState,
    cue: AutoMovieArchetypeEquineComfortCue.ICamp,
  ): EquineStanceRows.IPlan {
    const heading: IAutoMovieQuaternion = EquineStanceSupport.heading(
      start.trunk,
    );
    const offset: IAutoMovieVector3 = EquineStanceSupport.along(start.trunk, {
      x: 0,
      y: 0,
      z: -BACK,
    });
    const shoulders: IAutoMovieVector3 = EquineBodyPose.point(
      start.trunk,
      Vector3.scale(
        Vector3.add(body.chains.leftFore[0]!, body.chains.rightFore[0]!),
        0.5,
      ),
    );
    const pitch: number = Math.max(
      ...HINDS.map((limb: AutoMovieArchetypeQuadrupedBody.Limb): number =>
        lowering(body, start, limb, offset, shoulders, heading),
      ),
    );
    const lowered: AutoMovieArchetypeFrame.IMotion =
      AutoMovieArchetypeFrame.chain(
        EquineBodyPose.turn(pitch, 0, shoulders, ZERO, heading),
        start.trunk,
      );
    const states: EquineStanceRows.IState[] = [
      { trunk: lowered, anchors: start.anchors },
    ];
    const loads: AutoMovieArchetypeFrame.IMotion[] = [];
    for (const limb of HINDS) {
      const before: EquineStanceRows.IState = states.at(-1)!;
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
    const half: number = (1 - LOWER) / HINDS.length;
    return {
      cue,
      start,
      end: start,
      keys: [
        LOWER,
        ...HINDS.flatMap(
          (_: AutoMovieArchetypeQuadrupedBody.Limb, k: number): number[] => [
            LOWER + (k + LOAD) * half,
            LOWER + (k + (1 + LOAD) / 2) * half,
            LOWER + (k + 1) * half,
          ],
        ),
      ],
      events: HINDS.flatMap(
        (
          limb: AutoMovieArchetypeQuadrupedBody.Limb,
          k: number,
        ): EquineStanceRows.IEvent[] => [
          {
            label: `${limb}Off`,
            entry: true,
            time: AutoMovieEngineMotionSampling.minimumJerkTime(LOWER + (k + LOAD) * half),
          },
          {
            label: `${limb}On`,
            entry: true,
            time: AutoMovieEngineMotionSampling.minimumJerkTime(LOWER + (k + 1) * half),
          },
        ],
      ),
      goal: (share: number): EquineBodyPose.IGoal => {
        if (share <= LOWER)
          return {
            trunk: AutoMovieArchetypeFrame.chain(
              EquineBodyPose.turn(
                (pitch * share) / LOWER,
                0,
                shoulders,
                ZERO,
                heading,
              ),
              start.trunk,
            ),
            limbs: EquineStanceSupport.placed(start.anchors),
          };
        const step: number = (share - LOWER) / half;
        const k: number = Math.min(HINDS.length - 1, Math.floor(step));
        const local: number = step - k;
        const before: EquineStanceRows.IState = states[k]!;
        const limb: AutoMovieArchetypeQuadrupedBody.Limb = HINDS[k]!;
        if (local <= LOAD)
          return {
            trunk: EquineStanceSupport.blend(
              before.trunk,
              loads[k]!,
              local / LOAD,
            ),
            limbs: EquineStanceSupport.placed(before.anchors),
          };
        return {
          trunk: loads[k]!,
          limbs: {
            ...EquineStanceSupport.placed(before.anchors),
            [limb]: {
              kind: "placed",
              anchor: EquineStanceSupport.arc(
                before.anchors[limb],
                states[k + 1]!.anchors[limb],
                AutoMovieEngineMotionSampling.minimumJerkShare((local - LOAD) / (1 - LOAD)),
                LIFT,
              ),
              fold: 0,
            },
          },
        };
      },
    };
  }

  /*
   * The least pitch about the shoulders, degrees, that keeps one hind's hip
   * within its halt distance of its stepped-back ankle, less `ROOM`; zero when
   * it already is.
   *
   * In the heading's sagittal plane the hip turns on a circle of radius ρ about
   * the shoulders, and the ankle lies at distance q from them; the in-plane
   * hip-to-ankle distance r follows the law of cosines, r² = ρ² + q² − 2ρq cos
   * φ, so the wanted r gives the wanted angle φ between them in closed form.
   */
  function lowering<Id extends string, D extends string>(
    body: EquineBodyPose.IPrepared<Id, D>,
    start: EquineStanceRows.IState,
    limb: AutoMovieArchetypeQuadrupedBody.Limb,
    offset: IAutoMovieVector3,
    shoulders: IAutoMovieVector3,
    heading: IAutoMovieQuaternion,
  ): number {
    const chain: readonly IAutoMovieVector3[] = body.chains[limb];
    const terminal: IAutoMovieVector3 = Vector3.subtract(chain[4]!, chain[3]!);
    const hip: IAutoMovieVector3 = EquineBodyPose.point(start.trunk, chain[0]!);
    const ankle: IAutoMovieVector3 = Vector3.subtract(
      start.anchors[limb],
      terminal,
    );
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(heading);
    const local = (point: IAutoMovieVector3): IAutoMovieVector3 =>
      Quaternion.rotateVector(inverse, Vector3.subtract(point, shoulders));
    const h: IAutoMovieVector3 = local(hip);
    const a: IAutoMovieVector3 = local(Vector3.add(ankle, offset));
    const wanted: number = Vector3.distance(hip, ankle) - ROOM;
    const across: number = h.x - a.x;
    const r: number = Math.sqrt(Math.max(0, wanted * wanted - across * across));
    const rho: number = Math.hypot(h.y, h.z);
    const q: number = Math.hypot(a.y, a.z);
    const angle = (y: number, z: number): number => {
      const raw: number = Math.atan2(y, z);
      return raw < 0 ? raw + 2 * Math.PI : raw;
    };
    const cosine: number = (rho * rho + q * q - r * r) / (2 * rho * q);
    const phi: number = Math.acos(Math.max(-1, Math.min(1, cosine)));
    const needed: number = angle(a.y, a.z) - angle(h.y, h.z) - phi;
    return Math.max(0, (needed * 180) / Math.PI);
  }
}
