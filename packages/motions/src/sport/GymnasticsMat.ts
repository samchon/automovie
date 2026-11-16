import { carriedRate, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { lieDown } from "../floor/lieDown";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { GymnasticsFlight } from "./GymnasticsFlight";
import type { IPreparedGymnasticsFrame } from "./IPreparedGymnasticsFrame";
import { prepareGymnasticsFrame } from "./prepareGymnasticsFrame";

/**
 * Coming down lying on a landing surface after a jump over a bar (#3377):
 * the high jump's and the pole vault's landing on the mat.
 *
 * From the touchdown, the body turns on to lie over `SETTLE` seconds: its
 * tip goes to the lying tip nearest the one it landed at, on the back or on
 * the front, as its turn in the air brought it, its joints to `lieDown`'s
 * posture for that side, and it keeps resting on the
 * surface, the root's height putting the lowest of its collision shapes on
 * it at every instant. Its centre carries the touchdown's horizontal
 * velocity out over the same seconds and stops. It then lies still.
 *
 * First pass: the surface does not give, so the fall's vertical speed stops
 * at the touchdown (a mat's give over a few tenths of a second is not
 * shown); the body slides on the surface as its centre slows.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the landing does, how the body rests, how the velocity is carried and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation A posture by seconds since the touchdown, built from the touchdown posture, its velocity and the surface's height.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two durations and one function, read by the high jump and the pole vault.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The lying posture is `lieDown`'s; the rest height is the body's own shapes'.
 */
export namespace GymnasticsMat {
  /** Seconds from the touchdown to lying on the back (provisional). */
  export const SETTLE: number = 0.6;

  /** Seconds lying still after it (provisional). */
  export const HOLD: number = 0.6;

  /**
   * The posture after a touchdown on the back.
   *
   * @param props The body, its mass model, the touchdown posture written by joints with no roll, the centre's velocity at the touchdown, m/s, and the surface's height, world metres.
   * @returns The posture at seconds since the touchdown, in [0, SETTLE + HOLD]; the last one beyond. A query may borrow its synchronous parent's exact FK reader as its second argument, without retaining it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result's timebase.
   * @evidence contracts/development/implementation.md#principled-implementation Joint space blended on minimum-jerk progress, the tip to the nearest supine tip, the root height from the shapes' rest and the root's floor place from the centre carried by the engine's `carriedRate`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One blend, one centre, one rest per instant.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Prepare J joint start/difference triples once; each query interpolates them and resolves one canonical bone map for its actual COM and collider reduction, removing the second full FK. Shape bounds and phase timing remain unchanged; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The invariant joint union and differences belong to this landing. COM and floor rest consume the same query's canonical map through prepareGymnasticsFrame; changed joints/headings still prepare their own geometry. An optional explicit parent workspace shares only exactly unchanged FK prerequisites with downstream consumers.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains its original inputs and O(J) copied interpolation tracks. Each query's frame, bone map and floor reader release at return or throw; an optional borrowed reader stays with its synchronous parent and no frame/reader enters the returned posture or retained landing closure.
   */
  export function lie(props: {
    body: IHumanBody;
    model: GymnasticsFlight.Model;
    from: IHumanPosture;
    velocity: IAutoMovieVector3;
    height: number;
  }): (seconds: number, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]) => IHumanPosture {
    const body: IHumanBody = props.body;
    const model: GymnasticsFlight.Model = props.model;
    const prepareFrame: ReturnType<typeof prepareGymnasticsFrame> = prepareGymnasticsFrame(body, model);
    const from: IHumanPosture = props.from;
    // The lying tip nearest the landing tip, an odd multiple of 90 degrees:
    // on the back at -90 plus whole turns, on the front at +90.
    const tip: number = 180 * Math.round((from.pitch - 90) / 180) + 90;
    const back: boolean = Math.abs((((tip + 90) % 360) + 360) % 360) < 1;
    const lain: lieDown.IPose = back
      ? lieDown.POSES.supine
      : lieDown.POSES.prone;
    const centre: IAutoMovieVector3 = GymnasticsFlight.centre(
      body,
      model,
      from,
    );
    const tracks: JointTrack[] = [];
    for (const bone of new Set([
      ...Object.keys(from.joints),
      ...Object.keys(lain.joints),
    ]) as Set<AutoMovieHumanoidBone>) {
      const a: readonly [number, number, number] = from.joints[bone] ?? [0, 0, 0];
      const b: readonly [number, number, number] = lain.joints[bone] ?? [0, 0, 0];
      tracks.push({ bone, from: [a[0], a[1], a[2]], delta: [b[0] - a[0], b[1] - a[1], b[2] - a[2]] });
    }
    return (seconds: number, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]): IHumanPosture => {
      const t: number = Math.min(SETTLE, Math.max(0, seconds));
      const u: number = minimumJerk.share(t / SETTLE);
      const joints: IHumanPosture["joints"] = {};
      for (const track of tracks) {
        joints[track.bone] = [
          track.from[0] + track.delta[0] * u,
          track.from[1] + track.delta[1] * u,
          track.from[2] + track.delta[2] * u,
        ];
      }
      const posed: IHumanPosture = {
        ...from,
        pitch: from.pitch + (tip - from.pitch) * u,
        joints,
        root: { x: 0, y: 0, z: 0 },
      };

      // The centre's floor place, carried out from the touchdown.
      const carry: number = carriedRate(SETTLE, t);
      const frame: IPreparedGymnasticsFrame = prepareFrame(
        posed,
        { x: centre.x + props.velocity.x * carry, y: 0, z: centre.z + props.velocity.z * carry },
        resolution,
      );
      return {
        ...frame.posture,
        root: {
          ...frame.posture.root,
          y: props.height + frame.floor(),
        },
      };
    };
  }
}

/** A landing's copied clinical start and difference, both degree triples for one bone. */
interface JointTrack {
  /** The clinical joint being interpolated. */
  bone: AutoMovieHumanoidBone;

  /** The touchdown-side value, degrees. */
  from: readonly [number, number, number];

  /** The landing value minus the initial value, degrees. */
  delta: readonly [number, number, number];
}
