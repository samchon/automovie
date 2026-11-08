import { AutoMovieLoftChain, AutoMovieViewAxis, AutoMovieViewLoft, type IAutoMovieViewPart } from "@automovie/engine";

import type { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanHeadF1Lines } from "./AutoMovieHumanHeadF1Lines";
import { AutoMovieHumanHeadF1Pose } from "./AutoMovieHumanHeadF1Pose";
import { AutoMovieHumanHeadMassCurves } from "./AutoMovieHumanHeadMassCurves";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * f1's auricles (owner's orders, 2026-11-08 13:1x: each part from its own
 * zero; the parts' connections first): each lofted in its own frame
 * (`AutoMovieHumanHeadF1Lines` EAR_AXES, EAR, EAR_RIM: origin the tragion,
 * +Y the auricle's long axis, +X across from the attachment line to the
 * rim, +Z the plate's normal) by the engine's view loft, swept across from
 * its root to its rim: the loft's station is the ear frame's X, its
 * sections are level in that sweep (the ear frame's Y-Z planes), the
 * section's long extents the plate's upper and lower edges about their
 * middle (the course) and its short extents the plate's half thickness,
 * each the exact quarter-ellipse conic; the rim closes at the loft's pole.
 * The first section is the root loop: the auricle's port (`root`), which
 * the head's band meets through the construction tree's known-port join
 * (f1_integration's node). `place` carries a loft point into the head frame;
 * the left ear mirrors the right across the midsagittal plane.
 */
export namespace AutoMovieHumanHeadEarLoft {
  /** One auricle. */
  export interface IEar {
    /** Side. */
    side: "right" | "left";

    /** The view part and the engine's loft, in the loft's frame (station = the ear frame's X). */
    part: IAutoMovieViewPart;

    /** The engine's loft. */
    loft: AutoMovieViewLoft.IResult;

    /** A loft point in the head frame. */
    place(p: readonly number[]): Vec3;

    /** The root loop, the auricle's port, head frame (96 points), or empty without a chain. */
    root: Vec3[];
  }

  /** Both auricles, the tragion half t-t from the midsagittal plane. */
  export function create(halfBitragion: number, order: number = 16, samples: number = 96): IEar[] {
    const F: typeof AutoMovieHumanHeadF1Lines = AutoMovieHumanHeadF1Lines;
    const knots: [number, number, number, number][] = F.EAR;
    const [rim, rimY]: [number, number] = F.EAR_RIM;
    // The course: the plate's middle between its edges, ending at the rim's pole.
    const middle: { station: number; value: number }[] = [...knots.map((k: [number, number, number, number]): { station: number; value: number } => ({ station: k[0], value: (k[1] + k[2]) / 2 })), { station: rim, value: rimY }];
    const outline: (value: (k: [number, number, number, number]) => number) => IAutoMovieViewPart.IOutline = (value: (k: [number, number, number, number]) => number): IAutoMovieViewPart.IOutline => ({
      knots: [...knots.map((k: [number, number, number, number]): IAutoMovieViewPart.IKnot => ({ site: `ear ${k[0]}`, station: k[0], value: value(k) })), { site: "ear rim", station: rim, value: 0 }],
    });
    // The shoulder: f1's authored rolled rim (`EAR_SHOULDER`) over the root-to-rim sweep, the exact quarter ellipse (`AutoMovieHumanHeadMassCurves.ELLIPSE`) at the rim's pole, where the loft's dome takes the conic ellipse value.
    const ellipse: IAutoMovieViewPart.IOutline = {
      knots: [
        { site: "ear root", station: knots[0]![0], value: F.EAR_SHOULDER },
        { site: "ear rim", station: rim, value: AutoMovieHumanHeadMassCurves.ELLIPSE },
      ],
    };
    const stations: number[] = [];
    for (let s: number = knots[0]![0]; s < rim - 0.25; s += 0.5) stations.push(s);
    // The pole's own station closes the list: the loft reads its pole at the last station.
    stations.push(rim);
    const part: IAutoMovieViewPart = {
      name: "head.ear",
      axis: AutoMovieViewAxis.level(
        middle,
        // The plate's cup off its plane (`EAR_CUP`): the concha's bowl, then the helix curling forward.
        F.EAR_CUP.map(([station, value]: [number, number]): { station: number; value: number } => ({ station, value })),
      ),
      stations,
      front: { positive: outline((k: [number, number, number, number]): number => (k[2] - k[1]) / 2), negative: outline((k: [number, number, number, number]): number => -(k[2] - k[1]) / 2) },
      side: { positive: outline((k: [number, number, number, number]): number => k[3]), negative: outline((k: [number, number, number, number]): number => -k[3]) },
      fullness: { kind: "top", shoulders: [ellipse, ellipse, ellipse, ellipse] },
      pole: "top",
      order,
      samples,
    };
    const loft: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part);
    const A: { y: Vec3; x: Vec3; z: Vec3 } = F.EAR_AXES;
    const phases: number[] = Array.from({ length: 96 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 96);
    return (["right", "left"] as const).map((side: "right" | "left"): IEar => {
      // The loft's frame to the ear frame: its +X (the section's long extent) is the ear's +Y, its station the ear's +X, its +Z the ear's +Z.
      const place: (p: readonly number[]) => Vec3 = (p: readonly number[]): Vec3 => {
        const q: Vec3 = [0, 0, halfBitragion];
        for (let i: number = 0; i < 3; ++i) q[i] = q[i]! + p[1]! * A.x[i]! + p[0]! * A.y[i]! + p[2]! * A.z[i]!;
        // The ear's zero-frame (Frankfort) place, mirrored for the left, carried into her upright frame (`AutoMovieHumanHeadF1Pose`).
        return AutoMovieHumanHeadF1Pose.upright(side === "right" ? q : [q[0], q[1], -q[2]]);
      };
      const chain: AutoMovieViewLoft.IResult["chain"] = loft.chain;
      // Each side's part under its own name (the construction tree keys parts by name); the loft is the same in the ear's frame.
      return { side, part: { ...part, name: `head.ear.${side}` }, loft, place, root: chain === null ? [] : AutoMovieLoftChain.ring(chain, chain.layers[0]!.y, phases).map((p: number[]): Vec3 => place(p)) };
    });
  }
}
