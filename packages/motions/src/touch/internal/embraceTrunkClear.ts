import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditTangleModel,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleMargin as Margin } from "../../audit/AutoMovieMotionHumanAuditTangleMargin";
import { AutoMovieMotionHumanAuditTangleModel as M } from "../../audit/AutoMovieMotionHumanAuditTangleModel";
import { HumanColliders } from "../../posture/HumanColliders";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

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
 * depth to keep both within the skin. The depth is read per pair of segments,
 * one row for each of the embracer's segments against each of the partner's, as
 * trajopt's collision term gives each link pair its own row against the safety
 * margin (`trajopt/src/collision_terms.cpp`), so the solve linearises every
 * pair on its own gradient rather than the deepest pair's alone.
 *
 * @param body The embracer's body.
 * @param partner The partner's reader.
 * @param times The film seconds the partner is read at: the instants the
 *   embrace holds.
 * @returns For a posture of the embracer, and whether its head and neck are
 *   read too, each pair's deepest probe of either segment in the other over the
 *   instants, metres, at the embracer's segment's index times the partner's
 *   segment count plus the partner's; zero when apart. A lean is bounded
 *   without the head, which the solve turns to the shoulder afterwards.
 */
export function embraceTrunkClear(
  body: IAutoMovieMotionHumanBody,
  partner: IAutoMovieMotionHumanPerformerReader,
  times: readonly number[],
): (posture: IAutoMovieMotionHumanPosture, head: boolean) => number[] {
  const mine: IAutoMovieMotionHumanAuditTangleModel.IModel = body.tangle;
  const theirs: IAutoMovieMotionHumanAuditTangleModel.IModel =
    partner.body.tangle;
  const own: ReadonlyMap<AutoMovieHumanoidBone, number> = new Map(
    mine.parts.map(
      (
        part: IAutoMovieMotionHumanAuditTangleModel.IPart,
        i: number,
      ): [AutoMovieHumanoidBone, number] => [part.bone, i],
    ),
  );
  const other: ReadonlyMap<AutoMovieHumanoidBone, number> = new Map(
    theirs.parts.map(
      (
        part: IAutoMovieMotionHumanAuditTangleModel.IPart,
        i: number,
      ): [AutoMovieHumanoidBone, number] => [part.bone, i],
    ),
  );
  const count: number = theirs.parts.length;
  const requested: ReadonlySet<AutoMovieHumanoidBone> = HumanColliders.bones(
    partner.body,
  );
  const placed: IAutoMovieMotionHumanColliders.IPlaced[][] = times.map(
    (t: number): IAutoMovieMotionHumanColliders.IPlaced[] =>
      HumanColliders.placed(partner.body, partner.bones(t, requested)),
  );
  return (posture: IAutoMovieMotionHumanPosture, head: boolean): number[] => {
    const read = (bone: AutoMovieHumanoidBone): boolean =>
      !ARMS.test(M.group(bone)) && (head || !HEAD.test(bone));
    const segments: IAutoMovieMotionHumanColliders.IPlaced[] =
      HumanColliders.placed(
        body,
        poseBones(body, resolveHumanPosture(body, posture)),
      );
    const deepest: number[] = new Array<number>(mine.parts.length * count).fill(
      0,
    );
    const record: (
      a: AutoMovieHumanoidBone,
      b: AutoMovieHumanoidBone,
      depth: number,
    ) => void = (
      a: AutoMovieHumanoidBone,
      b: AutoMovieHumanoidBone,
      depth: number,
    ): void => {
      const k: number = own.get(a)! * count + other.get(b)!;
      deepest[k] = Math.max(deepest[k]!, depth);
    };
    for (const frame of placed) {
      for (const pair of Margin.entering(mine, segments, theirs, frame))
        if (read(pair.a)) record(pair.a, pair.b, pair.depth);
      for (const pair of Margin.entering(theirs, frame, mine, segments))
        if (read(pair.b)) record(pair.b, pair.a, pair.depth);
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
