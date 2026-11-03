import type { AutoMovieHumanLoftContract } from "../../lofting/AutoMovieHumanLoftContract";
import { AutoMovieHumanPolarSection } from "../../lofting/AutoMovieHumanPolarSection";
import type { AutoMovieHumanLegConstruction } from "../AutoMovieHumanLegConstruction";
import type { IAutoMovieHumanBodyCalibration } from "../IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLegAnkleSeam } from "./AutoMovieHumanLegAnkleSeam";
import type { AutoMovieHumanLegAxis } from "./AutoMovieHumanLegAxis";
import { AutoMovieHumanLegCrotchRoot } from "./AutoMovieHumanLegCrotchRoot";
import { AutoMovieHumanLegGirth } from "./AutoMovieHumanLegGirth";
import { AutoMovieHumanLegSectionRows } from "./AutoMovieHumanLegSectionRows";
import { AutoMovieHumanLegProfile } from "./AutoMovieHumanLegProfile";
import { AutoMovieHumanLegReliefs } from "./AutoMovieHumanLegReliefs";
import { AutoMovieHumanLegRingRow } from "./AutoMovieHumanLegRingRow";
import { AutoMovieHumanLegSampling } from "./AutoMovieHumanLegSampling";
import type { AutoMovieHumanLegStations } from "./AutoMovieHumanLegStations";
import { AutoMovieHumanLegTube } from "./AutoMovieHumanLegTube";
import { AutoMovieHumanLegVector } from "./AutoMovieHumanLegVector";

type Vec3 = AutoMovieHumanLegVector.Vec3;
const { fifth } = AutoMovieHumanLegVector;

/**
 * The leg's section law: at every station the tube of
 * {@link AutoMovieHumanLegTube} (eight guides, eight compartment sectors and
 * the reliefs, scaled on its own hull to the girth law), with the two
 * neighbours' rings as the first and last rows of every channel.
 *
 * The foot's ankle ring and the trunk's crotch ring are read as rows
 * ({@link AutoMovieHumanLegRingRow}): each guide's jet, each sector's fullness
 * and the ring's taut girth stand at the ring's station, so the shape and the
 * girth leave each ring with the ring's own values and the natural splines
 * carry them to the first landmark rows. What eight guides cannot hold of the
 * ankle ring (the residual of its radius and its height off its plane) is
 * carried from the ring to the first landmark row by the smootherstep, which
 * is flat to the second derivative at both ends; at the crotch the trunk's
 * rounded loop takes the same span ({@link AutoMovieHumanLegCrotchRoot.join}).
 * Both spans are the distance from the ring to the first landmark row kept
 * beside it, so no share of the leg's length enters.
 */
export namespace AutoMovieHumanLegSectionLaw {
  /** One leg's law. */
  export interface ILaw {
    /** Station of the ankle ring, mm. */
    bottom: number;

    /** Station of the crotch ring, mm. */
    top: number;

    /** The ankle ring, canonical world. */
    ankleWorld: Vec3[];

    /** The ankle ring's centroid, `[x, z]`. */
    ankleCentre: [number, number];

    /** The crotch arc's centroid, `[x, z]`, the centre its phases are read about. */
    crotchCentre: [number, number];

    /** Span over which the ankle ring's residual is carried, mm. */
    ankleReach: number;

    /** Span over which the crotch loop is carried, mm. */
    crotchReach: number;

    /** The ankle ring's radius less the tube's at each leg phase, mm. */
    ankleResidual: number[];

    /** The ankle ring's height off its plane at each leg phase, mm. */
    ankleLift: number[];

    /** The girth law, mm. */
    girth: (s: number) => number;

    /** The tube. */
    tube: (s: number) => AutoMovieHumanLegTube.ISection;

    /** The crotch ring the leg takes. */
    root: AutoMovieHumanLegCrotchRoot.IRoot;
  }

  /**
   * One leg's law.
   *
   * @param calibration Calibration holding `trunk` and the feet.
   * @param side The leg's side.
   * @param sign 1 for the left leg, -1 for the right's reflection.
   * @param inputs Tape measures in calibration millimetres.
   * @param bones The joints' heights, mm.
   * @param diagnostics The list a relief that breaks its contract is recorded in; the relief is then left out.
   */
  export function of(
    calibration: IAutoMovieHumanBodyCalibration,
    side: "left" | "right",
    sign: 1 | -1,
    inputs: AutoMovieHumanLegConstruction.IInputs,
    bones: AutoMovieHumanLegStations.IBones,
    diagnostics: AutoMovieHumanLoftContract.IDiagnostic[] = [],
  ): ILaw {
    const planar: (ring: readonly Vec3[]) => [number, number][] = (ring: readonly Vec3[]): [number, number][] =>
      ring.map((p: Vec3): [number, number] => [p[0], p[2]]);
    const level: (ring: readonly Vec3[]) => number = (ring: readonly Vec3[]): number => ring.reduce((sum: number, p: Vec3): number => sum + p[1], 0) / ring.length;

    // The two rings, canonical, and their centroids.
    const ankleWorld: Vec3[] = AutoMovieHumanLegAnkleSeam.ring(calibration, side).map((p: Vec3): Vec3 => [p[0], p[1], sign * p[2]]);
    const crotchWorld: Vec3[] = AutoMovieHumanLegCrotchRoot.ring(calibration, side).map((p: Vec3): Vec3 => [p[0], p[1], sign * p[2]]);
    const bottom: number = level(ankleWorld);
    const top: number = level(crotchWorld);
    if (!(top > bottom) || !(inputs.calf > 0) || !(inputs.knee > 0) || !(inputs.thigh > 0)) throw new Error("A leg needs a positive length and positive tapes");
    const ankle: [number, number][] = planar(ankleWorld);
    const ankleCentre: [number, number] = AutoMovieHumanPolarSection.measure(ankle).centre;
    const crotchCentre: [number, number] = AutoMovieHumanPolarSection.measure(planar(crotchWorld)).centre;

    // The spans from each ring to its first kept landmark row.
    const rows: readonly AutoMovieHumanLegProfile.IRow[] = AutoMovieHumanLegSectionRows.GUIDES[0]!.rows;
    const ankleReach: number = AutoMovieHumanLegProfile.reach(rows, bones, bottom, "bottom");
    const crotchReach: number = AutoMovieHumanLegProfile.reach(rows, bones, top, "top");

    // The rings as rows: the ankle ring about its centroid, and the trunk's
    // rounded loop at depth 0 (the arc closed by the slit) about the arc's.
    const root: AutoMovieHumanLegCrotchRoot.IRoot = AutoMovieHumanLegCrotchRoot.of(calibration, side, sign, crotchCentre, crotchReach);
    const about: (ring: readonly [number, number][], c: readonly [number, number]) => [number, number][] = (
      ring: readonly [number, number][],
      c: readonly [number, number],
    ): [number, number][] =>
      ring.map((p: [number, number]): [number, number] => [p[0] - c[0], p[1] - c[1]]);
    const low: AutoMovieHumanLegRingRow.IRow = AutoMovieHumanLegRingRow.of(about(ankle, ankleCentre));
    const high: AutoMovieHumanLegRingRow.IRow = AutoMovieHumanLegRingRow.of(about(planar(root.ring.points), crotchCentre));

    // The girth law and the tube, both ending on the rings.
    const girth: (s: number) => number = AutoMovieHumanLegGirth.of({
      tapes: { thigh: inputs.thigh, knee: inputs.knee, calf: inputs.calf },
      bones,
      scale: inputs.scale,
      ends: { bottom: { at: bottom, values: [low.girth] }, top: { at: top, values: [high.girth] } },
      site: inputs.furrow,
    });
    const tube: (s: number) => AutoMovieHumanLegTube.ISection = AutoMovieHumanLegTube.of({
      bones,
      girth,
      reliefs: AutoMovieHumanLegReliefs.of(bones, girth, [bottom, top], crotchReach, diagnostics, inputs.furrow),
      ends: { bottom: { at: bottom, shape: low.shape }, top: { at: top, shape: high.shape } },
    });

    // The ankle ring against the tube at the ring: radius and height off the plane.
    const start: number[] = radii(tube(bottom));
    const ankleResidual: number[] = AutoMovieHumanLegAnkleSeam.residual(ankle, ankleCentre, start);
    const ankleLift: number[] = AutoMovieHumanLegAnkleSeam.lift(ankle, ankleCentre, ankleWorld, bottom);
    return { bottom, top, ankleWorld, ankleCentre, crotchCentre, ankleReach, crotchReach, ankleResidual, ankleLift, girth, tube, root };
  }

  /**
   * The tube's radius about its chart origin at every leg phase.
   *
   * @param section The tube's section at a station.
   */
  export function radii(section: AutoMovieHumanLegTube.ISection): number[] {
    return AutoMovieHumanLegSampling.PHASES.map((t: number): number => AutoMovieHumanPolarSection.radius(section.points, [0, 0], t));
  }

  /**
   * World points of the law's section at a station, canonical, at the leg's phases.
   *
   * @param law The law.
   * @param s The station.
   * @param frame The section plane at the station.
   * @param centre The chart origin's offset from the frame origin, `[along u, along v]` mm.
   */
  export function points(law: ILaw, s: number, frame: AutoMovieHumanLegAxis.IFrame, centre: readonly [number, number]): Vec3[] {
    const r: number[] = radii(law.tube(s));
    const w: number = 1 - fifth((s - law.bottom) / law.ankleReach);
    return AutoMovieHumanLegSampling.PHASES.map((t: number, m: number): Vec3 => {
      const radius: number = r[m]! + w * law.ankleResidual[m]!;
      const x: number = centre[0] + radius * Math.cos(t);
      const z: number = centre[1] + radius * Math.sin(t);
      const h: number = w * law.ankleLift[m]!;
      return [0, 1, 2].map((c: number): number => frame.origin[c]! + x * frame.u[c]! + z * frame.v[c]! + h * frame.n[c]!) as Vec3;
    });
  }
}
