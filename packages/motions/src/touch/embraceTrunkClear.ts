import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleMargin as Margin } from "../audit/AutoMovieMotionHumanAuditTangleMargin";
import { AutoMovieMotionHumanAuditTangleModel as M } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import { HumanColliders } from "../posture/HumanColliders";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * How deep an embracing body's trunk, head and legs lie in the partner at the
 * instants an embrace holds them: the partner audit's own reading
 * (`AutoMovieMotionHumanAuditPartner`), the probes of each body in the other's
 * colliders both ways, of the embracer posed in a candidate posture against the
 * partner as the partner stands at each instant. The arms are left out, since
 * the embrace lays them by its own course afterwards.
 *
 * A lean that lays the chest's region on the partner's back and a chin brought
 * to the shoulder's region meet the partner's surface, but the colliders the
 * audit reads lie on or outside those surfaces, so the regions alone pressed
 * the chest 14 mm and the neck 13 mm into the partner; the solve reads this
 * depth to keep both within the skin.
 *
 * @param body The embracer's body.
 * @param partner The partner's reader.
 * @param times The film seconds the partner is read at: the instants the
 *   embrace holds.
 * @returns For a posture of the embracer, and whether its head and neck are
 *   read too, the deepest probe of either body in the other's segments over the
 *   instants, metres; zero when apart. A lean is bounded without the head,
 *   which the solve turns to the shoulder afterwards.
 */
export function embraceTrunkClear(
  body: IAutoMovieMotionHumanBody,
  partner: IAutoMovieMotionHumanPerformerReader,
  times: readonly number[],
): (posture: IAutoMovieMotionHumanPosture, head: boolean) => number {
  const mine: M.IModel = M.model(body);
  const theirs: M.IModel = M.model(partner.body);
  const requested: ReadonlySet<AutoMovieHumanoidBone> = HumanColliders.bones(
    partner.body,
  );
  const placed: IAutoMovieMotionHumanColliders.IPlaced[][] = times.map(
    (t: number): IAutoMovieMotionHumanColliders.IPlaced[] =>
      HumanColliders.placed(partner.body, partner.bones(t, requested)),
  );
  return (posture: IAutoMovieMotionHumanPosture, head: boolean): number => {
    const read = (bone: AutoMovieHumanoidBone): boolean =>
      !ARMS.test(M.group(bone)) && (head || !HEAD.test(bone));
    const own: IAutoMovieMotionHumanColliders.IPlaced[] = HumanColliders.placed(
      body,
      poseBones(body, resolveHumanPosture(body, posture)),
    );
    let deepest: number = 0;
    for (const other of placed) {
      for (const pair of Margin.entering(mine, own, theirs, other))
        if (read(pair.a)) deepest = Math.max(deepest, pair.depth);
      for (const pair of Margin.entering(theirs, other, mine, own))
        if (read(pair.b)) deepest = Math.max(deepest, pair.depth);
    }
    return deepest;
  };
}

/**
 * The embracer's arm segments, by their group: the upper arm, the forearm and
 * the hand with its fingers.
 */
const ARMS: RegExp = /^(left|right)(UpperArm|LowerArm|Hand)$/;

/** The embracer's head and neck. */
const HEAD: RegExp = /^(neck|head)$/;
