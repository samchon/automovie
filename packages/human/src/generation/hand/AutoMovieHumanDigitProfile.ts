import { AutoMovieHumanSeamCarve } from "../../lofting/AutoMovieHumanSeamCarve";
import { AutoMovieHumanSeamUnion } from "../../lofting/AutoMovieHumanSeamUnion";
import type { AutoMovieHumanDigitSection } from "../AutoMovieHumanDigitSection";
import { AutoMovieHumanDigitCrease } from "./AutoMovieHumanDigitCrease";
import { AutoMovieHumanDigitJointRelief } from "./AutoMovieHumanDigitJointRelief";
import { AutoMovieHumanDigitSpan } from "./AutoMovieHumanDigitSpan";
import { AutoMovieHumanHandWindow } from "./AutoMovieHumanHandWindow";
import { AutoMovieHumanNailFold } from "./AutoMovieHumanNailFold";
import { AutoMovieHumanNailPlate } from "./AutoMovieHumanNailPlate";

/**
 * A digit's section shape along its centre line, composed from the digit's
 * pieces, each on its own axis:
 *
 * 1. the base section: for a finger the phalanx span law
 *    ({@link AutoMovieHumanDigitSpan}) on each bone from the web to the PIP,
 *    the PIP to the DIP and the DIP to the cap's start, scaled to the digit's
 *    own root section; for the thumb its own sections on its bones (the span
 *    law is observed on the fingers);
 * 2. the joint swellings ({@link AutoMovieHumanDigitJointRelief}) at the two
 *    distal joints, all round the section;
 * 3. the palmar flexion creases ({@link AutoMovieHumanDigitCrease}), grooves of
 *    the palmar depth;
 * 4. the fingertip pulp ({@link AutoMovieHumanHandWindow.PULP}) on the palmar
 *    side of the distal phalanx;
 * 5. the nail plate ({@link AutoMovieHumanNailPlate}), whose transverse arch sets
 *    the dorsal midline's curvature over the plate, and the proximal nail fold
 *    ({@link AutoMovieHumanNailFold}) behind its root.
 *
 * Every relief vanishes with its slope and curvature at its window's edge, so
 * the profile is C2 along the line wherever the base is.
 */
export namespace AutoMovieHumanDigitProfile {
  /** The digit's base section and its loci along the line, mm. */
  export interface IInput {
    /** The digit's own section at an arc length along the line: half width, palmar and dorsal depths. */
    base: (s: number) => [number, number, number];

    /** Arc length of the digit's root, where its own sections start. */
    root: number;

    /** Arc lengths of the two distal joints (PIP and DIP, or the thumb's MCP and IP). */
    joints: readonly [number, number];

    /** Arc length of the apex. */
    length: number;

    /** Arc length where the tip's cap starts. */
    cap: number;

    /** Half length of a joint's turn, per joint radius (the elbow's softness). */
    softness: number;

    /** True for the thumb, whose base sections are its own and whose creases stand at its two joints. */
    thumb: boolean;
  }

  /**
   * A finger's base section from the span law, scaled to its root section.
   *
   * @param root The finger's own half width and half depth at its root, mm.
   * @param stations Arc lengths of the root, PIP, DIP and the cap's start, mm.
   */
  export function span(root: readonly [number, number], stations: readonly [number, number, number, number]): (s: number) => [number, number, number] {
    const first: AutoMovieHumanDigitSpan.IKnot = AutoMovieHumanDigitSpan.KNOTS[0]!;

    // The span law's shares are of the root half width; its depths keep the
    // root's own depth, so the hand's through scale still reaches the finger.
    const depth: number = (2 * root[1]) / (root[0] * (first.palmar + first.dorsal));

    return (s: number): [number, number, number] => {
      const [r, pip, dip, cap] = stations;
      const phalanx: AutoMovieHumanDigitSpan.Phalanx = s < pip ? "proximal" : s < dip ? "middle" : "distal";
      const sigma: number =
        phalanx === "proximal" ? (s - r) / (pip - r) : phalanx === "middle" ? (s - pip) / (dip - pip) : (s - dip) / Math.max(1e-6, cap - dip);
      const shape: AutoMovieHumanDigitSection.IShape = AutoMovieHumanDigitSpan.shape({ root: root[0], apex: 1 }, phalanx, sigma);

      return [shape.width, shape.palmar * depth, shape.dorsal * depth];
    };
  }

  /** A relief's window along the line. */
  export interface IWindow {
    /** Arc length of the window's centre, mm. */
    at: number;

    /** Half width of the window along the line, mm. */
    half: number;
  }

  /**
   * The windows of the profile's reliefs narrower than a joint's turn, which
   * the digit's stations must resolve (`AutoMovieHumanDigitStations`): the
   * palmar creases, the proximal nail fold's band behind the plate's root and
   * the plate's apex window over its length.
   *
   * @param input The digit's base and loci.
   */
  export function windows(input: IInput): IWindow[] {
    const plate: AutoMovieHumanNailPlate.ISize = plateOf(input);
    const plateRoot: number = input.cap - plate.length;

    return [
      ...creasesOf(input).map(
        (c: AutoMovieHumanDigitCrease.IInput): IWindow => ({ at: c.at, half: AutoMovieHumanDigitCrease.WIDTH_SHARE * c.radius }),
      ),
      { at: plateRoot - AutoMovieHumanNailFold.BAND / 2, half: AutoMovieHumanNailFold.BAND / 2 },
      { at: plateRoot + plate.length / 2, half: plate.length / 2 },
    ];
  }

  /**
   * The creases: Bridgman's four loci for a finger (the line starts at the
   * MCP), the two joints' for the thumb, each as wide as its nearest joint's
   * radius allows.
   *
   * @param input The digit's base and loci.
   */
  function creasesOf(input: IInput): AutoMovieHumanDigitCrease.IInput[] {
    const [j0, j1] = input.joints;
    const radiusAt = (s: number): number => {
      const [w, p, d] = input.base(s);

      return (w + (p + d) / 2) / 2;
    };
    const loci: readonly number[] = input.thumb ? [j1, j0] : AutoMovieHumanDigitCrease.loci([0, j0, j1]);
    const nearest = (at: number): number => radiusAt(Math.abs(at - j0) < Math.abs(at - j1) ? j0 : j1);

    return loci
      .filter((at: number): boolean => at > input.root)
      .map((at: number): AutoMovieHumanDigitCrease.IInput => ({ at, palmar: input.base(at)[1], radius: nearest(at) }));
  }

  /**
   * The nail plate: its free edge at the cap's start, its root a plate length
   * back. Its size reads only the distal phalanx's length and the section's
   * width; the frame vectors are the plate chart's own axes.
   *
   * @param input The digit's base and loci.
   */
  function plateOf(input: IInput): AutoMovieHumanNailPlate.ISize {
    const distal: number = input.length - input.joints[1];

    return AutoMovieHumanNailPlate.size({
      origin: [0, 0, 0],
      along: [1, 0, 0],
      normal: [0, 0, 1],
      phalanx: distal,
      width: 2 * input.base(input.cap - AutoMovieHumanNailPlate.LENGTH_SHARE * distal)[0],
    });
  }

  /**
   * The section shape at every arc length.
   *
   * @param input The digit's base and loci.
   */
  export function of(input: IInput): (s: number) => AutoMovieHumanDigitSection.IShape {
    const j1: number = input.joints[1];
    const radiusAt = (s: number): number => {
      const [w, p, d] = input.base(s);

      return (w + (p + d) / 2) / 2;
    };

    // Joint windows: centred on each joint, half a turn's length either side.
    const reliefs: AutoMovieHumanDigitJointRelief.IInput[] = input.joints.map(
      (at: number): AutoMovieHumanDigitJointRelief.IInput => ({ at, half: Math.max(1, input.softness * radiusAt(at)), radius: radiusAt(at) }),
    );

    const creases: AutoMovieHumanDigitCrease.IInput[] = creasesOf(input);

    // The pulp's middle halfway from the distal joint to the apex.
    const distal: number = input.length - j1;
    const middle: number = j1 + distal / 2;
    const pad: AutoMovieHumanHandWindow.IMassSize = { length: distal, width: input.base(middle)[0], depth: input.base(middle)[1] };

    const plate: AutoMovieHumanNailPlate.ISize = plateOf(input);
    const plateRoot: number = input.cap - plate.length;

    // The plate's transverse arch, a parabola of rise `sag` over half width
    // W / 2, curves by 8 sag / W^2 at its midline.
    const plateCurvature: number = (8 * plate.sag) / (plate.width * plate.width);

    return (s: number): AutoMovieHumanDigitSection.IShape => {
      const at: number = Math.min(s, input.cap);
      const [w0, p0, d0] = input.base(at);
      const swell: number = reliefs.reduce((sum: number, r: AutoMovieHumanDigitJointRelief.IInput): number => sum + AutoMovieHumanDigitJointRelief.height(r, at), 0);
      const groove: number = creases.reduce((sum: number, c: AutoMovieHumanDigitCrease.IInput): number => sum + AutoMovieHumanDigitCrease.depth(c, at), 0);
      const u: number = (at - plateRoot) / plate.length;

      // Volume only grows by the bumps (swelling, pulp, fold) and only the
      // declared recess (the creases) carves it (`AutoMovieHumanSeamUnion`,
      // `AutoMovieHumanSeamCarve`).
      const w: number = AutoMovieHumanSeamUnion.bump(w0, swell);
      const palmar: number = AutoMovieHumanSeamUnion.bump(
        AutoMovieHumanSeamCarve.dent(AutoMovieHumanSeamUnion.bump(p0, swell), -groove),
        AutoMovieHumanHandWindow.mass(AutoMovieHumanHandWindow.PULP, pad, at - middle, 0),
      );
      const dorsal: number = AutoMovieHumanSeamUnion.bump(AutoMovieHumanSeamUnion.bump(d0, swell), AutoMovieHumanNailFold.height(plate, u, 0));

      // Over the plate the dorsal midline takes the plate's arch: its apex
      // share is the plate's curvature over the half ellipse's, d / w^2,
      // weighed in by a window over the plate's length.
      const weight: number = Math.abs(u - 0.5) < 0.5 ? AutoMovieHumanHandWindow.bump((u - 0.5) / 0.5).value : 0;
      const plateApex: number = Math.min(APEX_MAX, Math.max(APEX_MIN, (plateCurvature * w * w) / dorsal));

      return {
        width: w,
        palmar,
        dorsal,
        side: (w * w) / (palmar * dorsal),
        palmarApex: 1,
        dorsalApex: 1 + (plateApex - 1) * weight,
      };
    };
  }
}

/** Least apex share a section half keeps convex with (`AutoMovieHumanDigitSection`'s domain is (0, 1.5]). */
const APEX_MIN: number = 0.3;

/** Greatest apex share, the section half's domain end. */
const APEX_MAX: number = 1.5;
