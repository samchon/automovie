import type {
  IAutoMovieHumanDigitCrease,
  IAutoMovieHumanDigitJointRelief,
  IAutoMovieHumanDigitProfile,
  IAutoMovieHumanDigitSection,
  IAutoMovieHumanDigitSpan,
  IAutoMovieHumanHandWindow,
  IAutoMovieHumanNailPlate,
} from "@automovie/interface";

import { AutoMovieHumanSeamCarve } from "../lofting/AutoMovieHumanSeamCarve";
import { AutoMovieHumanSeamUnion } from "../lofting/AutoMovieHumanSeamUnion";
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
  /**
   * A finger's base section from the span law, scaled to its root section.
   *
   * @param root The finger's own half width and half depth at its root, mm.
   * @param stations Arc lengths of the root, PIP, DIP and the cap's start, mm.
   */
  export function span(
    root: IAutoMovieHumanDigitProfile.SpanRoot,
    stations: IAutoMovieHumanDigitProfile.SpanStations,
  ): IAutoMovieHumanDigitProfile.SpanResult {
    const first: IAutoMovieHumanDigitSpan.IKnot =
      AutoMovieHumanDigitSpan.KNOTS[0]!;

    // The span law's shares are of the root half width; its depths keep the
    // root's own depth, so the hand's through scale still reaches the finger.
    const depth: number =
      (2 * root[1]) / (root[0] * (first.palmar + first.dorsal));

    return (s: number): [number, number, number] => {
      const [r, pip, dip, cap] = stations;
      const phalanx: IAutoMovieHumanDigitSpan.Phalanx =
        s < pip ? "proximal" : s < dip ? "middle" : "distal";
      const sigma: number =
        phalanx === "proximal"
          ? (s - r) / (pip - r)
          : phalanx === "middle"
            ? (s - pip) / (dip - pip)
            : (s - dip) / Math.max(1e-6, cap - dip);
      const shape: IAutoMovieHumanDigitSection.IShape =
        AutoMovieHumanDigitSpan.shape(
          { root: root[0], apex: 1 },
          phalanx,
          sigma,
        );

      return [shape.width, shape.palmar * depth, shape.dorsal * depth];
    };
  }

  /**
   * The windows of the profile's reliefs narrower than a joint's turn, which
   * the digit's stations must resolve (`AutoMovieHumanDigitStations`): the
   * palmar creases, the proximal nail fold's band behind the plate's root and
   * the plate's apex window over its length.
   *
   * @param input The digit's base and loci.
   */
  export function windows(
    input: IAutoMovieHumanDigitProfile.IInput,
  ): IAutoMovieHumanDigitProfile.IWindow[] {
    const plate: IAutoMovieHumanNailPlate.ISize = plateOf(input);
    const plateRoot: number = input.cap - plate.length;

    return [
      ...creasesOf(input).map(
        (
          c: IAutoMovieHumanDigitCrease.IInput,
        ): IAutoMovieHumanDigitProfile.IWindow => ({
          at: c.at,
          half: AutoMovieHumanDigitCrease.WIDTH_SHARE * c.radius,
        }),
      ),
      {
        at: plateRoot - AutoMovieHumanNailFold.BAND / 2,
        half: AutoMovieHumanNailFold.BAND / 2,
      },
      { at: plateRoot + plate.length / 2, half: plate.length / 2 },
    ];
  }

  /**
   * The nail plate's window along the line: its root, its free edge at the
   * cap's start, and its width, the window the skin's nail part takes on the
   * digit's chain.
   *
   * @param input The digit's base and loci.
   */
  export function nail(
    input: IAutoMovieHumanDigitProfile.IInput,
  ): IAutoMovieHumanDigitProfile.INailResult {
    const plate: IAutoMovieHumanNailPlate.ISize = plateOf(input);

    return {
      root: input.cap - plate.length,
      edge: input.cap,
      width: plate.width,
    };
  }

  /**
   * The section shape at every arc length.
   *
   * @param input The digit's base and loci.
   */
  export function of(
    input: IAutoMovieHumanDigitProfile.IInput,
  ): IAutoMovieHumanDigitProfile.OfResult {
    const j1: number = input.joints[1];
    const radiusAt = (s: number): number => {
      const [w, p, d] = input.base(s);

      return (w + (p + d) / 2) / 2;
    };

    // Joint windows: centred on each joint, half a turn's length either side.
    const reliefs: IAutoMovieHumanDigitJointRelief.IInput[] = input.joints.map(
      (at: number): IAutoMovieHumanDigitJointRelief.IInput => ({
        at,
        half: Math.max(1, input.softness * radiusAt(at)),
        radius: radiusAt(at),
      }),
    );

    const creases: IAutoMovieHumanDigitCrease.IInput[] = creasesOf(input);

    // The pulp's middle halfway from the distal joint to the apex.
    const distal: number = input.length - j1;
    const middle: number = j1 + distal / 2;
    const pad: IAutoMovieHumanHandWindow.IMassSize = {
      length: distal,
      width: input.base(middle)[0],
      depth: input.base(middle)[1],
    };

    const plate: IAutoMovieHumanNailPlate.ISize = plateOf(input);
    const plateRoot: number = input.cap - plate.length;

    // The plate's transverse arch, a parabola of rise `sag` over half width
    // W / 2, curves by 8 sag / W^2 at its midline.
    const plateCurvature: number =
      (8 * plate.sag) / (plate.width * plate.width);

    return (s: number): IAutoMovieHumanDigitSection.IShape => {
      const at: number = Math.min(s, input.cap);
      const [w0, p0, d0] = input.base(at);
      const swell: number = reliefs.reduce(
        (sum: number, r: IAutoMovieHumanDigitJointRelief.IInput): number =>
          sum + AutoMovieHumanDigitJointRelief.height(r, at),
        0,
      );
      const groove: number = creases.reduce(
        (sum: number, c: IAutoMovieHumanDigitCrease.IInput): number =>
          sum + AutoMovieHumanDigitCrease.depth(c, at),
        0,
      );
      const u: number = (at - plateRoot) / plate.length;

      // Volume only grows by the bumps (swelling, pulp, fold) and only the
      // declared recess (the creases) carves it (`AutoMovieHumanSeamUnion`,
      // `AutoMovieHumanSeamCarve`).
      const w: number = AutoMovieHumanSeamUnion.bump(w0, swell);
      const palmar: number = AutoMovieHumanSeamUnion.bump(
        AutoMovieHumanSeamCarve.dent(
          AutoMovieHumanSeamUnion.bump(p0, swell),
          -groove,
        ),
        AutoMovieHumanHandWindow.mass(
          AutoMovieHumanHandWindow.PULP,
          pad,
          at - middle,
          0,
        ),
      );
      const dorsal: number = AutoMovieHumanSeamUnion.bump(
        AutoMovieHumanSeamUnion.bump(d0, swell),
        AutoMovieHumanNailFold.height(plate, u, 0),
      );

      // Over the plate the dorsal midline takes the plate's arch: its apex
      // share is the plate's curvature over the half ellipse's, d / w^2,
      // weighed in by a window over the plate's length.
      const weight: number =
        Math.abs(u - 0.5) < 0.5
          ? AutoMovieHumanHandWindow.bump((u - 0.5) / 0.5).value
          : 0;
      const plateApex: number = Math.min(
        APEX_MAX,
        Math.max(APEX_MIN, (plateCurvature * w * w) / dorsal),
      );

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

  /*
   * The creases: Bridgman's four loci for a finger (the line starts at the
   * MCP), the two joints' for the thumb, each as wide as its nearest joint's
   * radius allows.
   * Parameter input: The digit's base and loci.
   */
  function creasesOf(
    input: IAutoMovieHumanDigitProfile.IInput,
  ): IAutoMovieHumanDigitCrease.IInput[] {
    const [j0, j1] = input.joints;
    const radiusAt = (s: number): number => {
      const [w, p, d] = input.base(s);

      return (w + (p + d) / 2) / 2;
    };
    const loci: readonly number[] = input.thumb
      ? [j1, j0]
      : AutoMovieHumanDigitCrease.loci([0, j0, j1]);
    const nearest = (at: number): number =>
      radiusAt(Math.abs(at - j0) < Math.abs(at - j1) ? j0 : j1);

    return loci
      .filter((at: number): boolean => at > input.root)
      .map(
        (at: number): IAutoMovieHumanDigitCrease.IInput => ({
          at,
          palmar: input.base(at)[1],
          radius: nearest(at),
        }),
      );
  }

  /*
   * The nail plate: its free edge at the cap's start, its root a plate length
   * back. Its size reads only the distal phalanx's length and the section's
   * width; the frame vectors are the plate chart's own axes.
   * Parameter input: The digit's base and loci.
   */
  function plateOf(
    input: IAutoMovieHumanDigitProfile.IInput,
  ): IAutoMovieHumanNailPlate.ISize {
    return AutoMovieHumanNailPlate.size(plateInput(input));
  }

  /*
   * The plate's inputs in its own chart: only the distal phalanx's length and
   * the section's width at the root are read.
   * Parameter input: The digit's base and loci.
   */
  function plateInput(
    input: IAutoMovieHumanDigitProfile.IInput,
  ): IAutoMovieHumanNailPlate.IInput {
    const distal: number = input.length - input.joints[1];

    return {
      origin: [0, 0, 0],
      along: [1, 0, 0],
      normal: [0, 0, 1],
      phalanx: distal,
      width:
        2 *
        input.base(
          input.cap - AutoMovieHumanNailPlate.LENGTH_SHARE * distal,
        )[0],
    };
  }
}

/*
 * Least apex share a section half keeps convex with (`AutoMovieHumanDigitSection`'s domain is (0, 1.5]).
 */
const APEX_MIN: number = 0.3;

/*
 * Greatest apex share, the section half's domain end.
 */
const APEX_MAX: number = 1.5;
