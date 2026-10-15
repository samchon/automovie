import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { shapeAutoMovieHumanRing } from "../../junction/shapeAutoMovieHumanRing";
import { IAutoMovieHumanMeasurements } from "../../measure/IAutoMovieHumanMeasurements";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../../skeleton/IAutoMovieHumanSkeleton";
import { AUTOMOVIE_HUMAN_TRUNK_FORM } from "./AUTOMOVIE_HUMAN_TRUNK_FORM";
import { AUTOMOVIE_HUMAN_TRUNK_LOOPS } from "./AUTOMOVIE_HUMAN_TRUNK_LOOPS";
import { IAutoMovieHumanTrunkFrame } from "./IAutoMovieHumanTrunkFrame";
import { IAutoMovieHumanTrunkPoints } from "./IAutoMovieHumanTrunkPoints";
import { IAutoMovieHumanTrunkTune } from "./IAutoMovieHumanTrunkTune";
import { measureAutoMovieHumanTrunkFrame } from "./measureAutoMovieHumanTrunkFrame";
import { placeAutoMovieHumanTrunkGluteal } from "./placeAutoMovieHumanTrunkGluteal";
import { placeAutoMovieHumanTrunkHip } from "./placeAutoMovieHumanTrunkHip";
import { placeAutoMovieHumanTrunkShoulder } from "./placeAutoMovieHumanTrunkShoulder";
import { placeAutoMovieHumanTrunkTorso } from "./placeAutoMovieHumanTrunkTorso";
import { profileAutoMovieHumanTrunk } from "./profileAutoMovieHumanTrunk";

/**
 * Place every point of the trunk's cage for one person.
 *
 * Each side is placed from its own measurements and skeleton side in the left side's frame, then written back with its sign, so an asymmetric identity gives an asymmetric trunk; the midline slots take the mean of both sides. Every ring vertex lies exactly on the site's shared shape (`shapeAutoMovieHumanRing`), which the junction requires of both parts.
 *
 * @param measurements Resolved measurements
 * @param skeleton The person's skeleton at rest
 * @param tune Corrections from the girth fit
 * @returns The points by slot, with the ring layouts
 */
export function placeAutoMovieHumanTrunkPoints(
  measurements: IAutoMovieHumanMeasurements,
  skeleton: IAutoMovieHumanSkeleton,
  tune: IAutoMovieHumanTrunkTune,
): IAutoMovieHumanTrunkPoints {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const shape = (
    site: "neckBase" | "upperArm" | "thigh",
    side: AutoMovieHumanSide | null,
  ): IAutoMovieHumanTrunkPoints.ILayouts["neck"] =>
    shapeAutoMovieHumanRing({
      skeleton,
      measurements,
      site,
      side,
      part: "trunk",
    });
  const layouts: IAutoMovieHumanTrunkPoints.ILayouts = {
    neck: shape("neckBase", null),
    arm: { left: shape("upperArm", "left"), right: shape("upperArm", "right") },
    thigh: { left: shape("thigh", "left"), right: shape("thigh", "right") },
  };
  // the collar: the ring's own section a little down the neck's axis, where the shoulder grid opens
  const neck: IAutoMovieVector3[] = layouts.neck.positions.map(
    (p: IAutoMovieVector3): IAutoMovieVector3 =>
      V.offset(p, [
        layouts.neck.frame.normal,
        -AUTOMOVIE_HUMAN_TRUNK_FORM.collar * measurements.identity.body.stature,
      ]),
  );
  const loops: IAutoMovieVector3[][] = Array.from(
    { length: AUTOMOVIE_HUMAN_TRUNK_LOOPS },
    (): IAutoMovieVector3[] => new Array<IAutoMovieVector3>(24),
  );
  const ridge: IAutoMovieVector3[] = new Array<IAutoMovieVector3>(9);
  const perineum: IAutoMovieVector3[] = new Array<IAutoMovieVector3>(3);
  const arms: Record<AutoMovieHumanSide, IAutoMovieVector3[][]> = {
    left: [],
    right: [],
  };
  const legs: Record<AutoMovieHumanSide, IAutoMovieVector3[][]> = {
    left: [],
    right: [],
  };
  for (const side of ["left", "right"] as const) {
    const sign: number = side === "left" ? 1 : -1;
    const toModel = (p: IAutoMovieVector3): IAutoMovieVector3 =>
      V.of(sign * p.x, p.y, p.z);
    // a ring built in the left ring order runs the other way round on the right
    const order = (ring: IAutoMovieVector3[]): IAutoMovieVector3[] => {
      const model: IAutoMovieVector3[] = ring.map(toModel);
      return side === "left" ? model : [model[0]!, ...model.slice(1).reverse()];
    };
    const frame: IAutoMovieHumanTrunkFrame = measureAutoMovieHumanTrunkFrame(
      measurements,
      skeleton,
      side,
    );
    const profile: profileAutoMovieHumanTrunk.IProfile =
      profileAutoMovieHumanTrunk(frame, tune);
    const half: IAutoMovieVector3[][] = placeAutoMovieHumanTrunkTorso(
      frame,
      profile,
      tune,
    );
    const shoulder: placeAutoMovieHumanTrunkShoulder.IOutput =
      placeAutoMovieHumanTrunkShoulder(
        frame,
        profile,
        half,
        neck,
        layouts.arm[side],
        sign,
      );
    const hip: placeAutoMovieHumanTrunkHip.IOutput =
      placeAutoMovieHumanTrunkHip(
        frame,
        profile,
        tune,
        half,
        layouts.thigh[side],
      );
    placeAutoMovieHumanTrunkGluteal(frame, profile, half);
    half.forEach((row: IAutoMovieVector3[], i: number): void =>
      row.forEach((q: IAutoMovieVector3, j: number): void => {
        if (i === AUTOMOVIE_HUMAN_TRUNK_LOOPS - 2 && j === 6) return;
        const index: number = sign > 0 ? j : (24 - j) % 24;
        if (j === 0 || j === 12) {
          const other: IAutoMovieVector3 | undefined = loops[i]![index];
          loops[i]![index] =
            other === undefined
              ? V.of(0, q.y, q.z)
              : V.of(0, (other.y + q.y) / 2, (other.z + q.z) / 2);
        } else loops[i]![index] = toModel(q);
      }),
    );
    shoulder.crest.forEach((q: IAutoMovieVector3, c: number): void => {
      ridge[4 + sign * (c + 2)] = toModel(q);
    });
    perineum[1 + sign] = toModel(hip.perineum[1]);
    const middle: IAutoMovieVector3 = hip.perineum[0];
    perineum[1] =
      perineum[1] === undefined
        ? middle
        : V.of(
            0,
            (perineum[1].y + middle.y) / 2,
            (perineum[1].z + middle.z) / 2,
          );
    arms[side] = beside(
      [...shoulder.rings.map(order), shoulder.cut],
      layouts.arm[side],
    );
    legs[side] = beside(
      [...hip.rings.map(order), hip.cut],
      layouts.thigh[side],
    );
  }
  // the collar's slots are exact on both sides
  for (const [j, k] of [
    [0, 0],
    [1, 1],
    [2, 2],
    [10, 4],
    [11, 5],
    [12, 6],
    [13, 7],
    [14, 8],
    [22, 10],
    [23, 11],
  ] as const)
    loops[AUTOMOVIE_HUMAN_TRUNK_LOOPS - 1]![j] = neck[k]!;
  ridge[6] = neck[3]!;
  ridge[2] = neck[9]!;
  return {
    loops,
    ridge,
    perineum,
    neck: layouts.neck.positions,
    arms,
    legs,
    layouts,
  };
}

/**
 * Replace the stub ring next to a junction ring by the ring's own shape, moved back along the site's axis to that ring's centre, so the tube meets the junction as a straight run of the shared section and the limb's girth curve starts from it without a bulge or a pinch.
 *
 * @param rings Stub rings from the opening outward, the last the junction ring
 * @param shape The site's shared ring shape
 * @returns The rings with the one before the last on the shape
 */
const beside = (
  rings: IAutoMovieVector3[][],
  shape: IAutoMovieHumanTrunkPoints.ILayouts["neck"],
): IAutoMovieVector3[][] => {
  const k: number = rings.length - 2;
  const n: number = rings[k]!.length;
  const centre: IAutoMovieVector3 = AutoMovieHumanVector.of(
    rings[k]!.reduce((s: number, p: IAutoMovieVector3): number => s + p.x, 0) /
      n,
    rings[k]!.reduce((s: number, p: IAutoMovieVector3): number => s + p.y, 0) /
      n,
    rings[k]!.reduce((s: number, p: IAutoMovieVector3): number => s + p.z, 0) /
      n,
  );
  const back: number = AutoMovieHumanVector.dot(
    AutoMovieHumanVector.offset(shape.frame.origin, [centre, -1]),
    shape.frame.normal,
  );
  return rings.map(
    (ring: IAutoMovieVector3[], r: number): IAutoMovieVector3[] =>
      r === k
        ? shape.positions.map(
            (p: IAutoMovieVector3): IAutoMovieVector3 =>
              AutoMovieHumanVector.offset(p, [shape.frame.normal, -back]),
          )
        : ring,
  );
};
