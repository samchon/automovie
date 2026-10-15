import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { shapeAutoMovieHumanRing } from "../../junction/shapeAutoMovieHumanRing";
import { IAutoMovieHumanMeasurements } from "../../measure/IAutoMovieHumanMeasurements";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanTrunkFrame } from "./IAutoMovieHumanTrunkFrame";
import { IAutoMovieHumanTrunkPoints } from "./IAutoMovieHumanTrunkPoints";
import { IAutoMovieHumanTrunkTune } from "./IAutoMovieHumanTrunkTune";
import { measureAutoMovieHumanTrunkFrame } from "./measureAutoMovieHumanTrunkFrame";
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
    shapeAutoMovieHumanRing({ skeleton, measurements, site, side, part: "trunk" });
  const layouts: IAutoMovieHumanTrunkPoints.ILayouts = {
    neck: shape("neckBase", null),
    arm: { left: shape("upperArm", "left"), right: shape("upperArm", "right") },
    thigh: { left: shape("thigh", "left"), right: shape("thigh", "right") },
  };
  const neck: IAutoMovieVector3[] = layouts.neck.positions;
  const loops: IAutoMovieVector3[][] = Array.from(
    { length: 13 },
    (): IAutoMovieVector3[] => new Array<IAutoMovieVector3>(24),
  );
  const ridge: IAutoMovieVector3[] = new Array<IAutoMovieVector3>(9);
  const perineum: IAutoMovieVector3[] = new Array<IAutoMovieVector3>(3);
  const arms: Record<AutoMovieHumanSide, IAutoMovieVector3[][]> = { left: [], right: [] };
  const legs: Record<AutoMovieHumanSide, IAutoMovieVector3[][]> = { left: [], right: [] };
  for (const side of ["left", "right"] as const) {
    const sign: number = side === "left" ? 1 : -1;
    const toModel = (p: IAutoMovieVector3): IAutoMovieVector3 => V.of(sign * p.x, p.y, p.z);
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
    const profile: profileAutoMovieHumanTrunk.IProfile = profileAutoMovieHumanTrunk(
      frame,
      tune,
    );
    const half: IAutoMovieVector3[][] = placeAutoMovieHumanTrunkTorso(frame, profile, tune);
    const shoulder: placeAutoMovieHumanTrunkShoulder.IOutput =
      placeAutoMovieHumanTrunkShoulder(
        frame,
        profile,
        half,
        neck,
        layouts.arm[side],
        sign,
      );
    const hip: placeAutoMovieHumanTrunkHip.IOutput = placeAutoMovieHumanTrunkHip(
      frame,
      profile,
      tune,
      half,
      layouts.thigh[side],
    );
    half.forEach((row: IAutoMovieVector3[], i: number): void =>
      row.forEach((q: IAutoMovieVector3, j: number): void => {
        if (i === 11 && j === 6) return;
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
        : V.of(0, (perineum[1].y + middle.y) / 2, (perineum[1].z + middle.z) / 2);
    arms[side] = [...shoulder.rings.map(order), shoulder.cut];
    legs[side] = [...hip.rings.map(order), hip.cut];
  }
  // the neck ring's slots are exact on both sides
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
    loops[12]![j] = neck[k]!;
  ridge[6] = neck[3]!;
  ridge[2] = neck[9]!;
  return { loops, ridge, perineum, arms, legs, layouts };
}
