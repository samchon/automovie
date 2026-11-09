import { AutoMovieSolidChain, type IAutoMovieSolidSurface } from "@automovie/engine";

import type { IAutoMovieHumanParameters } from "../../structures/IAutoMovieHumanParameters";
import type { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanTrunkS00 } from "./AutoMovieHumanTrunkS00";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * The pelvis branch as a split of S00's open bottom (the "pants" topology):
 * S00 ends at the crotch level, and each leg continues from the half of that
 * end on its side plus the medial seam, the chord from the bottom ring's
 * front midline point to its back midline point, along which the two thighs
 * meet at the crotch and below which they separate.
 *
 * The half on the right runs phase 0 (front midline) through pi/2 (right
 * lateral) to pi (back midline); the left half from pi through 3 pi/2 to 2
 * pi. Each half is S00's own bottom ring, so the leg's outer root is the
 * trunk's surface there: its point and its station derivatives (the
 * direction and curvature the leg continues with) are the S00 field's
 * total2 at `(crotch station, phase)`. The seam's crotch point is the
 * chord's point under the hip centres, where ANSUR's crotch length passes
 * from the front midline to the back midline (the seam's front and back
 * halves are the parts of the crotch length the view curves reserve).
 *
 * The seam is a declared crease only where the thighs meet: at the crotch
 * level. Below it each leg closes its medial side with its own C2 surface,
 * the leg region's construction.
 */
export namespace AutoMovieHumanTrunkPelvisSplit {
  /** One leg's half of S00's bottom end. */
  export interface IHalf {
    /** `left` or `right`. */
    side: "left" | "right";

    /** S00's bottom station (the crotch height), mm. */
    station: number;

    /** Phase interval on S00's chart, radians, increasing: right [0, pi], left [pi, 2 pi]. */
    interval: [number, number];

    /** World point on the bottom ring at a phase. */
    curve(phase: number): Vec3;

    /** The S00 field's total2 at the bottom station and a phase: `u` per mm of station (upward into the trunk), `v` per radian of phase. */
    jet(phase: number): IAutoMovieSolidSurface.IJet;
  }

  /** The split. */
  export interface IOutput {
    /** The left leg's half. */
    left: IHalf;

    /** The right leg's half. */
    right: IHalf;

    /** The medial seam: its front and back ends (the bottom ring's midline points) and the crotch point under the hip centres, world mm. */
    seam: { front: Vec3; back: Vec3; crotch: Vec3 };

    /** The S00 surface. */
    field: IAutoMovieSolidSurface;

    /** Basis. */
    basis: string[];
  }

  /** One build from the public input: the split, or null with the reason. */
  export interface IBuild {
    /** The split, or null when S00 published no chain or the chain no surface. */
    split: IOutput | null;

    /** The S00 build it came from. */
    s00: AutoMovieHumanTrunkS00.IOutput;

    /** Why the split is null, with the loft's own diagnostics; empty when it exists. */
    diagnostics: string[];
  }

  /**
   * The split from the public input alone: one full S00 build
   * (`AutoMovieHumanTrunkS00.of`, uncached, about two seconds) and its
   * engine surface (`AutoMovieSolidChain.surface`). Callers that need it more
   * than once hold the result.
   */
  export function build(params: IAutoMovieHumanParameters): IBuild {
    const s00: AutoMovieHumanTrunkS00.IOutput = AutoMovieHumanTrunkS00.of(params);
    const loft: string[] = (s00.loft.loft.diagnostics ?? []).map((d: { detail: string }): string => d.detail);
    if (s00.chain === null) return { split: null, s00, diagnostics: ["S00's loft published no chain", ...loft] };
    const field: IAutoMovieSolidSurface | null = AutoMovieSolidChain.surface(s00.chain);
    if (field === null) return { split: null, s00, diagnostics: ["S00's chain has no solid surface", ...loft] };
    return { split: of(s00, field), s00, diagnostics: [] };
  }

  /** The split from one S00 build and its surface. */
  export function of(s00: AutoMovieHumanTrunkS00.IOutput, field: IAutoMovieSolidSurface): IOutput {
    const station: number = s00.curves.bottom;
    const point: (phase: number) => Vec3 = (phase: number): Vec3 => {
      const p: readonly number[] = field.point !== undefined ? field.point(station, phase) : field.jet(station, phase).p;
      return [p[0]!, p[1]!, p[2]!];
    };
    const half: (side: "left" | "right") => IHalf = (side: "left" | "right"): IHalf => ({
      side,
      station,
      interval: side === "right" ? [0, Math.PI] : [Math.PI, 2 * Math.PI],
      curve: point,
      jet: (phase: number): IAutoMovieSolidSurface.IJet => field.jet(station, phase),
    });
    const front: Vec3 = point(0);
    const back: Vec3 = point(Math.PI);
    const hipX: number = s00.datums.frames.hips.right[0] + s00.datums.frames.pelvis.relative.origin[0];
    return {
      left: half("left"),
      right: half("right"),
      seam: { front, back, crotch: [hipX, station, 0] },
      field,
      basis: [
        "bottom station: the crotch height (inseam plus lateral malleolus height, ISO 8559-1 5.7.6)",
        "bottom ring: the trunk-thigh contour (hip breadth across; thigh roots' front and back at the hip centre's X plus and minus the thigh circumference's radius, ANSUR 1988)",
        "seam: the chord between the ring's midline points; crotch point on it under the hip centres (ANSUR II crotch length composition)",
      ],
    };
  }
}
