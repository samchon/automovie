import { AutoMovieLoftViewFullSource } from "@automovie/engine";
import { AutoMovieHumanF1, AutoMovieHumanF1Placing, AutoMovieHumanSegmentFrame } from "@automovie/human";
import type {
  AutoMovieMatrix3Tuple,
  AutoMovieVector3Tuple,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanF1,
  IAutoMovieHumanSegmentFrame,
  IAutoMovieLoftViewFullSource,
  IAutoMovieViewPart,
} from "@automovie/interface";

/**
 * The named F1 digit's original source under two declared poses, read before the figure's admission.
 *
 * The figure check records here what the nail unit once asserted on whole F1 declarations: the index finger's original source, read at
 * an off-axis material point of its cap, follows a rotation of its ancestor `hand` about that joint, and a rotation of its own distal
 * segment keeps the distal pivot and carries the pole about it. Each expectation is the independent Rodrigues rotation of the nominal
 * source's point about the declared joint's world Z axis by the declared local turn; each actual value is the posed source's point at
 * the transported material address. The record is independent of the mesh, the owners and the cameras.
 */
export namespace FamilyConicNailSourcePose {
  type V = AutoMovieVector3Tuple;

  /** One addressed point: where it is expected, where the posed source puts it, and the bound it is held to. */
  export interface IPoint {
    /** What the point is: the off-axis witness, the distal pivot or the pole. */
    site: string;

    /** The posed source's station of the transported material address, mm; 0 for the pivot, which is a frame origin. */
    station: number;

    /** The nominal point turned by Rodrigues' formula about the declared joint, figure mm. */
    expected: V;

    /** The posed source's point at the transported address, or the posed frame's origin, figure mm. */
    actual: V;

    /** Distance between `actual` and `expected`, mm. */
    error: number;

    /** The bound `error` is held to: 64 machine epsilons times the larger of one and the expectation's magnitude, mm. */
    roundoff: number;
  }

  /** One pose: the rotated joint, its pivot and axis, and the points read. */
  export interface ICase {
    /** The `AutoMovieHumanF1Placing.CHAIN` entry turned by the declared local angle. */
    joint: string;

    /** The joint frame's origin at the nominal pose, figure mm. */
    pivot: V;

    /** The joint frame's world Z axis at the nominal pose, the axis of the turn. */
    axis: V;

    /** Every point read under this pose. */
    points: IPoint[];
  }

  /** The record written to `figure.json` as `sourcePose`. */
  export interface IRecord {
    /** The named digit family, `finger.index`. */
    digit: string;

    /** Its distal segment, `index.distal`. */
    segment: string;

    /** The declared local turn about each joint's Z axis, radians. */
    angleRad: number;

    /** The phase every point is read at, radians. */
    phaseRad: number;

    /** The nominal source's witness, midway along the cap, and its pole, with their stations, mm. */
    reference: { witnessStationMm: number; poleStationMm: number; witnessPointMm: V; polePointMm: V };

    /** The hand turned: the off-axis witness follows the ancestor. */
    handOnly: ICase;

    /** The distal segment turned: the pivot stays and the pole follows. */
    distalOnly: ICase;

    /** Every point past its bound, and a witness that is not off the course; empty when the transport holds. */
    findings: string[];
  }

  /** Read the named digit at its nominal pose, under a hand rotation and under a distal rotation. */
  export function read(): IRecord {
    const digit: string = "finger.index";
    const segment: string = "index.distal";
    const angle: number = Math.PI / 12;
    const phase: number = Math.PI / 4;
    const names: ReadonlySet<string> = new Set([digit]);
    const { about, add, cross, dot, multiply, scale, sub }: typeof AutoMovieHumanSegmentFrame = AutoMovieHumanSegmentFrame;
    const original = (assembly: IAutoMovieHumanF1.IAssembly): IAutoMovieViewPart => AutoMovieHumanF1.originalSources(assembly, names).get(digit)!;
    const posedBy = (joint: string): IAutoMovieHumanF1.IAssembly => {
      const stored: (typeof AutoMovieHumanF1Placing.CHAIN)[number] = AutoMovieHumanF1Placing.CHAIN.find((entry): boolean => entry.name === joint)!;
      const replacement: AutoMovieMatrix3Tuple = multiply(stored.rotation, about(2, angle));
      return AutoMovieHumanF1.assemble((name: string): AutoMovieMatrix3Tuple | undefined => (name === joint ? replacement : undefined));
    };

    // Rodrigues' rotation about the fixed frame's world Z axis through its origin.
    const carry = (point: V, fixed: IAutoMovieHumanSegmentFrame): V => {
      const d: V = sub(point, fixed.origin);
      const axis: V = fixed.axes[2];
      return add(fixed.origin, add(add(scale(d, Math.cos(angle)), scale(cross(axis, d), Math.sin(angle))),
        scale(axis, dot(axis, d) * (1 - Math.cos(angle)))));
    };
    const findings: string[] = [];
    const point = (site: string, station: number, expected: V, actual: V): IPoint => {
      const error: number = Math.hypot(...sub(actual, expected));
      const roundoff: number = 64 * Number.EPSILON * Math.max(1, Math.hypot(...expected));
      if (!(error <= roundoff)) findings.push(site + " stands " + error + " mm from its Rodrigues expectation, over " + roundoff);
      return { site, station, expected, actual, error, roundoff };
    };

    const basis: IAutoMovieHumanF1.IAssembly = AutoMovieHumanF1.assemble();
    const part: IAutoMovieViewPart = original(basis);
    const bare: IAutoMovieLoftViewFullSource.IReader = AutoMovieLoftViewFullSource.create(part);
    const cap: IAutoMovieHumanConicLoft.ITip = basis.reference(digit).tips![1]!;
    const witnessStation: number = (cap.from + cap.tip) / 2;
    const witness: V = bare.point(witnessStation, phase);
    if (!(Math.hypot(...sub(witness, part.axis.at(witnessStation).origin)) > 0)) findings.push("the named source witness is not off the course");
    const pole: V = bare.point(cap.tip, phase);

    const hand: IAutoMovieHumanF1.IAssembly = posedBy("hand");
    const handFrame: IAutoMovieHumanSegmentFrame = basis.frames.get("hand")!;
    const handStation: number = hand.station(digit, witnessStation);
    const handOnly: ICase = {
      joint: "hand", pivot: handFrame.origin, axis: handFrame.axes[2],
      points: [point("off-axis witness under the hand", handStation, carry(witness, handFrame),
        AutoMovieLoftViewFullSource.create(original(hand)).point(handStation, phase))],
    };

    const bent: IAutoMovieHumanF1.IAssembly = posedBy(segment);
    const distal: IAutoMovieHumanSegmentFrame = basis.frames.get(segment)!;
    const poleStation: number = bent.station(digit, cap.tip);
    const distalOnly: ICase = {
      joint: segment, pivot: distal.origin, axis: distal.axes[2],
      points: [
        point("distal pivot", 0, distal.origin, bent.frames.get(segment)!.origin),
        point("pole under the distal turn", poleStation, carry(pole, distal),
          AutoMovieLoftViewFullSource.create(original(bent)).point(poleStation, phase)),
      ],
    };
    return {
      digit, segment, angleRad: angle, phaseRad: phase,
      reference: { witnessStationMm: witnessStation, poleStationMm: cap.tip, witnessPointMm: witness, polePointMm: pole },
      handOnly, distalOnly, findings,
    };
  }
}
