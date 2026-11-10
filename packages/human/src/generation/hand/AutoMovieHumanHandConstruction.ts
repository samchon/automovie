import type { IAutoMovieContourLoft64, IAutoMovieLoftChain } from "@automovie/engine";
import { AutoMovieHumanArmPrior } from "../AutoMovieHumanArmPrior";
import type { IAutoMovieHumanBodyCalibration } from "../IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanHandDigitChain } from "./AutoMovieHumanHandDigitChain";
import { AutoMovieHumanHandDigits } from "./AutoMovieHumanHandDigits";
import { AutoMovieHumanHandFingers } from "./AutoMovieHumanHandFingers";
import { AutoMovieHumanHandForm } from "./AutoMovieHumanHandForm";
import { AutoMovieHumanHandMap } from "./AutoMovieHumanHandMap";
import { AutoMovieHumanHandPalm } from "./AutoMovieHumanHandPalm";
import type { AutoMovieHumanHandPorts } from "./AutoMovieHumanHandPorts";
import { AutoMovieHumanHandSide } from "./AutoMovieHumanHandSide";
import { AutoMovieHumanHandSkinTargets } from "./AutoMovieHumanHandSkinTargets";
import { AutoMovieHumanHandSolve } from "./AutoMovieHumanHandSolve";
import type { AutoMovieHumanHandVector } from "./AutoMovieHumanHandVector";
import type { IAutoMovieHumanHandDigit } from "./IAutoMovieHumanHandDigit";
import type { IAutoMovieHumanHandFinger } from "./IAutoMovieHumanHandFinger";
import type { IAutoMovieHumanHandForm } from "./IAutoMovieHumanHandForm";
import type { IAutoMovieHumanHandJoints } from "./IAutoMovieHumanHandJoints";
import type { IAutoMovieHumanHandMeasures } from "./IAutoMovieHumanHandMeasures";
import type { IAutoMovieHumanHandScales } from "./IAutoMovieHumanHandScales";
import type { IAutoMovieHumanHandWrist } from "./IAutoMovieHumanHandWrist";

type Vec3 = AutoMovieHumanHandVector.Vec3;

/**
 * The hand, composed from its pieces and nothing more: the form shared by
 * every person, the scales and the wrist's circle solved at their sites, every
 * digit on its bones, and the palm's and digits' chains reflected to the side
 * asked for. Each piece lives in its own file; this one only calls them in
 * order and hands their results on.
 *
 * The hand is built once in the left frame and the right side is its
 * reflection (`AutoMovieHumanHandSide`); each side reads its own measures into
 * the same construction.
 */
export namespace AutoMovieHumanHandConstruction {
  /** Authored fixed contour topology before JSON tuple and literal restoration. */
  export interface IFixedContourInput {
    /** Physical original section coordinates and their closed coefficient loops. */
    sections: { coordinateMm: number; loops: { curve: AutoMovieHumanHandPalm.IFixedCurveInput; winding: number }[] }[];
    /** Original section-to-section component incidence. */
    intervals?: IAutoMovieContourLoft64["intervals"];
    /** Observed source events with their physical coordinate and incident loops. */
    events: {
      name: string; coordinateMm: number; beforeMm: number; afterMm: number; before: number[]; after: number[];
      kind: string; regular: boolean; terminal: number[] | null;
    }[];
    /** Original physical chord budget in millimetres. */
    chordToleranceMm: number;
  }

  /** Restore exactly the declared contour coefficients and event incidence. */
  export function fixedContour(value: IFixedContourInput): IAutoMovieContourLoft64 {
    const point: typeof AutoMovieHumanHandPalm.fixedPoint = AutoMovieHumanHandPalm.fixedPoint;
    return {
      ...value,
      sections: value.sections.map((section: IFixedContourInput["sections"][number]): IAutoMovieContourLoft64.ISection => ({
        ...section, loops: section.loops.map((loop: typeof section.loops[number]): IAutoMovieContourLoft64.ISection["loops"][number] => {
          if (loop.winding !== 1 && loop.winding !== -1) throw new Error("A fixed F1 loop has no declared winding");
          return { ...loop, winding: loop.winding, curve: AutoMovieHumanHandPalm.fixedCurve(loop.curve) };
        }),
      })),
      events: value.events.map((event: IFixedContourInput["events"][number]): IAutoMovieContourLoft64.IEvent => {
        if (event.kind !== "saddle" && event.kind !== "minimum" && event.kind !== "maximum")
          throw new Error("A fixed F1 contour event has an unknown incidence");
        return { ...event, kind: event.kind, terminal: event.terminal === null ? null : point(event.terminal) };
      }),
    };
  }

  /** Restore both hands' typed inputs while the original numbers and ordering stay authoritative. */
  export function fixedInput(
    value: typeof import("./AutoMovieHumanHandF1LeftInputs.json") | typeof import("./AutoMovieHumanHandF1RightInputs.json"),
    branch: IAutoMovieContourLoft64,
  ): AutoMovieHumanHandPorts.IFixed {
    const point: typeof AutoMovieHumanHandPalm.fixedPoint = AutoMovieHumanHandPalm.fixedPoint;

    /** Restore tuple widths while preserving source order and every coefficient. */
    const rings: (rows: { points: number[][]; normal: number[] }[]) => { points: Vec3[]; normal: Vec3 }[] = (rows: { points: number[][]; normal: number[] }[]): { points: Vec3[]; normal: Vec3 }[] =>
      rows.map((row: typeof rows[number]): { points: Vec3[]; normal: Vec3 } =>
        ({ ...row, points: row.points.map(point), normal: point(row.normal) }));
    const joins: AutoMovieHumanHandPorts.IFixed["joins"] = {
      thumb: { ...value.joins.thumb, normal: point(value.joins.thumb.normal), between: rings(value.joins.thumb.between) },
      index: { ...value.joins.index, normal: point(value.joins.index.normal), between: rings(value.joins.index.between) },
      ring: { ...value.joins.ring, normal: point(value.joins.ring.normal), between: rings(value.joins.ring.between) },
      pinky: { ...value.joins.pinky, normal: point(value.joins.pinky.normal), between: rings(value.joins.pinky.between) },
    };
    return {
      ...value,
      branch: { model: branch, thumb: value.branch.thumb, origin: point(value.branch.origin), axis: point(value.branch.axis) },
      fan: { ...value.fan, model: fixedContour(value.fan.model),
        normalFirst: point(value.fan.normalFirst), normalLast: point(value.fan.normalLast), normalMiddle: point(value.fan.normalMiddle) },
      hostRims: rings(value.hostRims), joins,
      digits: {
        thumb: AutoMovieHumanHandDigits.fixedInput(value.digits.thumb), index: AutoMovieHumanHandDigits.fixedInput(value.digits.index),
        middle: AutoMovieHumanHandDigits.fixedInput(value.digits.middle), ring: AutoMovieHumanHandDigits.fixedInput(value.digits.ring),
        pinky: AutoMovieHumanHandDigits.fixedInput(value.digits.pinky),
      },
    };
  }

  /** Points of a digit's centre line per point handed to the skeleton. */
  const LINE_EVERY: number = 8;

  /** What one side's hand reads. */
  export interface IInput<A extends IAutoMovieHumanHandWrist> {
    /** Calibration the body's surface is built on, for the knuckle section's skin. */
    calibration: IAutoMovieHumanBodyCalibration;

    /** Which side; the hand is built in the left frame either way. */
    side: "left" | "right";

    /** The person's hand measures for this side. */
    given: IAutoMovieHumanHandMeasures;

    /** Hand tape over knuckles II to V, mm. */
    circumference: number;

    /** Wrist tape at stylion, mm. */
    wristTape: number;

    /** The arm the hand grows out of, built for a set of scales. */
    makeArm: (measures: IAutoMovieHumanHandScales) => A;

    /** Identity of the arm and the hand's inputs, for the skin targets' cache. */
    key: string;

    /** Whether to build the chains; the skeleton needs only the landmarks. */
    lofted: boolean;
  }

  /** One side's hand: the solve, the landmarks the skeleton stands on, and the chains. */
  export interface IBuilt<A extends IAutoMovieHumanHandWrist> {
    /** The hand's scales as solved. */
    measures: IAutoMovieHumanHandScales;

    /** The arm built with those scales. */
    law: A;

    /** The knuckles and the thumb's base, left frame. */
    joints: IAutoMovieHumanHandJoints;

    /** Each digit's centre line, joints and tip in world millimetres on this side, thumb first. */
    lines: ILine[];

    /** The thumb's carpometacarpal and metacarpophalangeal joints, this side. */
    thumb: { cmc: Vec3; mcp: Vec3 };

    /** The palm's chain, absent when not lofted. */
    palm: IAutoMovieLoftChain | null;

    /** The digits' chains, thumb first; empty when not lofted. */
    digits: IAutoMovieLoftChain[];

    /** The digits' poles, thumb first; empty when not lofted. */
    poles: IAutoMovieHumanBodyCalibration.IPole[];

    /** The digits' nail plates on their chains, thumb first; empty when not lofted. */
    nails: IAutoMovieHumanBodyCalibration.INail[];
  }

  /** A digit's published centre line. */
  export interface ILine {
    /** Chain name. */
    name: string;

    /** Points of the digit's centre line from its root at the web to its tip. */
    line: Vec3[];

    /** The tip's apex. */
    tip: Vec3;

    /** The metacarpophalangeal joint, where the metacarpal ends. */
    joint: Vec3;

    /** The digit's joints from its MCP to its tip: MCP, PIP, DIP and tip for a finger, MCP, IP and tip for the thumb. */
    joints: Vec3[];
  }

  /**
   * Build one side's hand.
   *
   * The order is the dependency order: the skin targets steer the solve (the
   * knuckle section read on the meshed skin), the solve gives the scales and
   * the joints, the joints give the digits' bones, and the bones give the
   * chains.
   */
  export function build<A extends IAutoMovieHumanHandWrist>(input: IInput<A>): IBuilt<A> {
    const prior: AutoMovieHumanArmPrior.IHandPrior = AutoMovieHumanArmPrior.PRIOR.hand;
    const sign: 1 | -1 = input.side === "left" ? 1 : -1;
    const hand: IAutoMovieHumanHandForm = AutoMovieHumanHandForm.form();

    // The knuckle section the solve meets is read on the meshed skin, not on
    // the chains, because the webs' columns carry the hand's border out to the
    // index and little fingers' roots (see the skin targets).
    const targets: { breadth: number; girth: number } = AutoMovieHumanHandSkinTargets.skinTargets(
      input.calibration,
      hand,
      input.given,
      input.circumference,
      input.wristTape,
      input.makeArm,
      input.key,
    );
    const { measures, law, joints } = AutoMovieHumanHandSolve.solve(
      hand,
      input.given,
      input.circumference,
      input.wristTape,
      input.makeArm,
      targets,
      input.calibration.diagnostics,
    );

    // Every digit stands on its bones: the thumb from its root through its MCP,
    // each finger from its knuckle, the middle one reaching the hand length.
    const fingers: IAutoMovieHumanHandFinger[] = AutoMovieHumanHandFingers.digitsOf(hand, measures, law, joints);
    const lines: ILine[] = hand.digits.map((_: IAutoMovieHumanHandDigit, i: number): ILine => {
      const own: IAutoMovieHumanHandFinger = fingers[i]!;
      return {
        name: prior.digits[i]!.name.replace("{side}", input.side),
        line: own.points
          .filter((_p: Vec3, k: number): boolean => k % LINE_EVERY === 0)
          .map((p: Vec3): Vec3 => AutoMovieHumanHandSide.sided(p, sign)),
        tip: AutoMovieHumanHandSide.sided(own.pole, sign),
        joint: AutoMovieHumanHandSide.sided(joints.mcps[i]!, sign),
        joints: [...own.joints, own.pole].map((p: Vec3): Vec3 => AutoMovieHumanHandSide.sided(p, sign)),
      };
    });
    const thumb: { cmc: Vec3; mcp: Vec3 } = {
      cmc: AutoMovieHumanHandSide.sided(joints.cmc, sign),
      mcp: AutoMovieHumanHandSide.sided(joints.mcps[0]!, sign),
    };
    if (!input.lofted) return { measures, law, joints, lines, thumb, palm: null, digits: [], poles: [], nails: [] };

    // The chains, from the same bones, in the left frame reflected to the side.
    const map = (q: readonly [number, number, number]): Vec3 => AutoMovieHumanHandMap.handPoint(q, measures, law.wrist);
    return {
      measures,
      law,
      joints,
      lines,
      thumb,
      palm: AutoMovieHumanHandPalm.palmOf(hand, map, input.side, sign),
      digits: hand.digits.map(
        (d: IAutoMovieHumanHandDigit, i: number): IAutoMovieLoftChain =>
          AutoMovieHumanHandDigitChain.fingerOf(d, i, fingers[i]!, input.side, sign),
      ),
      poles: hand.digits.map(
        (_: IAutoMovieHumanHandDigit, i: number): IAutoMovieHumanBodyCalibration.IPole => ({
          chain: prior.digits[i]!.name.replace("{side}", input.side),
          end: "bottom",
          critical: true,
          point: AutoMovieHumanHandSide.sided(fingers[i]!.pole, sign),
        }),
      ),
      // A digit chain's station is the length back from its cap
      // (`AutoMovieHumanHandDigitChain`), along the straight distal line.
      nails: hand.digits.map((_: IAutoMovieHumanHandDigit, i: number): IAutoMovieHumanBodyCalibration.INail => {
        const own: IAutoMovieHumanHandFinger = fingers[i]!;
        return {
          chain: prior.digits[i]!.name.replace("{side}", input.side),
          root: own.cap - own.nail.root,
          edge: Math.max(0, own.cap - own.nail.edge),
          width: own.nail.width,
          dorsal: AutoMovieHumanHandSide.sided(own.nail.dorsal, sign),
        };
      }),
    };
  }

}
