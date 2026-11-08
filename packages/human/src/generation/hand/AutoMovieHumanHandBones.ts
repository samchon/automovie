import type { AutoMovieLoftContract } from "@automovie/engine";

import { AutoMovieHumanSex } from "../../typings/AutoMovieHumanSex";
import { AutoMovieHumanArmPrior } from "../AutoMovieHumanArmPrior";
import { AutoMovieHumanDigitJoints } from "../AutoMovieHumanDigitJoints";
import { AutoMovieHumanHandJoints } from "./AutoMovieHumanHandJoints";
import { AutoMovieHumanHandPosture } from "./AutoMovieHumanHandPosture";
import { AutoMovieHumanHandVector as V } from "./AutoMovieHumanHandVector";
import type { IAutoMovieHumanHandFrame } from "./IAutoMovieHumanHandFrame";
import type { IAutoMovieHumanHandMeasures } from "./IAutoMovieHumanHandMeasures";

/**
 * Pure hand joint definitions, before skin: measured metacarpal and phalanx
 * ratios on the person's lengths, with a conventional packing of PIP breadth
 * proxies inside the hand breadth (`docs/anatomy/hand.md`, Finger widths and
 * webs). PIP breadth is not an observed MCP breadth. Metacarpal bases are
 * level. The thumb uses the retained thenar branch direction, transferred
 * from the form's nominal axial crease into this hand's material frame;
 * its CMC is that ray's intersection with the metacarpal-base plane.
 * This is a placement convention, not a measured CMC or an old skin solve.
 * The common forearm WJC keeps its retained 1.5 mm stylion offset; de Leva's
 * hand-specific Table 2 offsets of 2.2/2.4 mm are different datums. Applying
 * the hand ratios here is an explicit transfer to that shared WJC, not a
 * claim that the paper measured this identical hand origin. MET3-to-MCP,
 * interarticular-to-joint-centre and thumb-crease-to-MCP transfers remain
 * placement proxies. Public palm length owns the proximal digit-III crease,
 * independently of these joint and web definitions.
 *
 * @evidence contracts/common.md#principled-implementation Combines the named published segment ratios with explicit WJC, joint-centre and breadth-packing transfers before any skin exists.
 * @evidence contracts/common.md#clear-and-simple-design One source record carries actual joints, the material frame, packing centre and independent crease to skeleton and view consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts States each retained proxy and bind convention instead of fitting an individual source or reading constructed skin.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes stylion/WJC, MET3/MCP, interarticular/joint-centre, crease/web and PIP/MCP breadth definitions with calibration units.
 * @evidence contracts/performance.md#efficient-algorithms Places a fixed five-digit manifest with constant-size vector arithmetic.
 * @evidence contracts/performance.md#reuse-equivalent-work Each sided hand record supplies both bind joints and original digit/palm inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns fixed module ratios and call-owned records without a person cache or source-skin reference.
 */
export namespace AutoMovieHumanHandBones {
  /**
   * Anatomical name used by the skeleton.
   *
   * @evidence contracts/common.md#principled-implementation Enumerates the four non-thumb digits in the existing skeletal vocabulary.
   * @evidence contracts/common.md#clear-and-simple-design One closed union keys the four source records.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no person-dependent alias or fallback digit.
   * @evidence contracts/common.md#meaningful-documentation States that the names belong to the skeleton and excludes the separately represented thumb.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A name union has no runtime algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type retains no runtime resource.
   */
  export type Finger = "Index" | "Middle" | "Ring" | "Little";

  /**
   * One digit's actual generating joint centres and terminal soft-tissue
   * point, mm, with the same hand's material dorsal direction.
   *
   * @evidence contracts/common.md#principled-implementation Separates a terminal skin apex from the three generating joints and retains the original material direction.
   * @evidence contracts/common.md#clear-and-simple-design A four-point list and one direction serve both skeleton and source curves.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not recover a direction from flexed bones or label the terminal skin point as another bony joint.
   * @evidence contracts/common.md#meaningful-documentation Gives finger/thumb point ordering, calibration units and the material-direction owner.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The record declares no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The generating owner shares the record by reference.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The hand definition caller owns its finite point list and direction.
   */
  export interface IDigit {
    /** MCP, PIP, DIP and tip for a finger; CMC, MCP, IP and tip for the thumb. */
    centres: Vec3[];

    /** Shared bind dorsal direction, projected by the digit's own generating frame. */
    dorsal: Vec3;
  }

  /**
   * Actual joints and material frame: of creates the canonical left side,
   * and sided reflects the complete source for the right.
   *
   * @evidence contracts/common.md#principled-implementation Preserves the same joint/frame definition with an independent public crease and the packing-derived breadth centre.
   * @evidence contracts/common.md#clear-and-simple-design All hand consumers read one explicit source record.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A shared knuckle is the actual middle-MCP tuple, not a second estimate from a skin or bent segment.
   * @evidence contracts/common.md#meaningful-documentation States side/reflection ownership, material units and the independent crease/packing definitions.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The output type owns no runtime algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The source factory determines record identity and sharing.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The synchronous definition owns the returned bounded joint manifest.
   */
  export interface IOutput {
    /** The actual generating material frame, carried with these same joints. */
    frame: IAutoMovieHumanHandFrame;

    /** Palm breadth-centre offset from MCP3 along this hand's radial/across direction, mm; derived from the same conventional MCP packing. */
    radialCenter: number;

    /** Four fingers. */
    fingers: Record<Finger, IDigit>;

    /** The opposed thumb. */
    thumb: IDigit;

    /** Third MCP, the distal centre of the arm-owned palm. */
    knuckle: Vec3;

    /** Public palm-length crease locus on the middle proximal phalanx's measuring course. */
    crease: Vec3;
  }

  /**
   * Place a hand without constructing or measuring a palm, digit or mesh.
   * Public lengths are measured in the straightened measuring pose; shared
   * bind flexions turn the phalanges while keeping each segment's length.
   *
   * @evidence contracts/common.md#principled-implementation Uses Reddy's MC ratios, de Leva's third-MC reach, Buryanov's web/joint ratios and the existing shared bind posture; no generated skin is queried.
   * @evidence contracts/common.md#clear-and-simple-design Publishes four-centre digit records that both skeleton and body construction can consume.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Each hand reads its own public dimensions; PIP packing proxies and the unmeasured CMC convention are explicit, without person-specific corrections.
   * @evidence contracts/common.md#meaningful-documentation Separates web-to-tip, wrist-to-web, MC total length and breadth-proxy datums and states calibration units.
   * @evidence contracts/performance.md#efficient-algorithms Places five fixed-size joint records with linear vector arithmetic rather than running an old skin solver.
   * @evidence contracts/performance.md#reuse-equivalent-work A single hand frame and packing supplies all digits and the palm's distal centre.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns owned tuples only and keeps no identity cache or calibration reference.
   */
  export function of(
    wrist: Vec3,
    given: IAutoMovieHumanHandMeasures,
    sex: AutoMovieHumanSex,
    scale: number,
    diagnostics: AutoMovieLoftContract.IDiagnostic[],
  ): IOutput {
    if (
      !(
        scale > 0 &&
        given.length > given.palm &&
        given.palm > AutoMovieHumanHandJoints.STYLION * scale &&
        given.breadth > 0 &&
        given.thumb > 0
      )
    )
      throw new Error(
        "A hand needs positive dimensions with hand length beyond its palm",
      );
    const prior: AutoMovieHumanArmPrior.IHandPrior =
      AutoMovieHumanArmPrior.PRIOR.hand;
    const along: Vec3 = V.unit([...prior.along]);
    const across: Vec3 = V.across([...prior.across], along);
    const palmar: Vec3 = V.cross(across, along);
    const frame: IAutoMovieHumanHandFrame = {
      along,
      across,
      palmar:
        V.dot(palmar, [...prior.through]) >= 0 ? palmar : V.scale(palmar, -1),
    };
    const dorsal: Vec3 = V.scale(frame.palmar, -1);
    const terminal: number =
      given.length - AutoMovieHumanHandJoints.STYLION * scale;
    const reach: number =
      MET3[sex === AutoMovieHumanSex.Female ? 0 : 1]! * terminal;
    const external: number = (terminal - reach) / (1 + WEB[1]!);
    const third: number = THIRD * reach;

    // Packing is a location convention, not a claim that PIP equals MCP.
    // Contradictory dimensions report the compression of these proxies only;
    // the actual digit breadth laws retain their measured values.
    const widths: number[] = [2, 3, 4, 5].map(
      (digit: number): number =>
        AutoMovieHumanDigitJoints.at(
          sex,
          given.length / scale,
          digit as 2 | 3 | 4 | 5,
          2,
        ).breadth * scale,
    );
    const sum: number = widths.reduce(
      (total: number, width: number): number => total + width,
      0,
    );
    const packing: number = Math.min(1, given.breadth / sum);
    if (packing < 1)
      diagnostics.push({
        producer: "definition.hand",
        level: 1,
        contract: "PIP breadth proxies fit the hand breadth",
        detail: `proxy sum ${sum} mm exceeds hand breadth ${given.breadth} mm; location proxies scaled by ${packing}, digit breadths unchanged`,
      });
    const gap: number = (given.breadth - packing * sum) / 3;
    const centres: number[] = [];
    let edge: number = given.breadth / 2;
    for (const width of widths) {
      centres.push(edge - (packing * width) / 2);
      edge -= packing * width + gap;
    }
    const point: (a: number, b: number, c?: number) => Vec3 = (
      a: number,
      b: number,
      c: number = 0,
    ): Vec3 =>
      V.plus(
        wrist,
        V.plus(
          V.scale(along, a),
          V.plus(V.scale(across, b), V.scale(frame.palmar, c)),
        ),
      );
    const mcps: Vec3[] = centres.map(
      (b: number, index: number): Vec3 =>
        point(reach - third + METACARPALS[index + 1]! * third, b - centres[1]!),
    );
    const fingers: Record<Finger, IDigit> = {} as Record<Finger, IDigit>;
    for (let index: number = 0; index < NAMES.length; index++) {
      const length: number = external * prior.external[index]!;
      const web: number = WEB[index]! * length;
      const first: number = web + prior.joints[index]![0]! * length;
      const second: number = web + prior.joints[index]![1]! * length;
      const proximal: Vec3 = AutoMovieHumanHandJoints.proximal(
        index + 1,
        frame,
      );
      const middle: Vec3 = bend(
        proximal,
        frame.palmar,
        prior.posture.pip[index]!,
      );
      const distal: Vec3 = bend(
        middle,
        frame.palmar,
        prior.posture.dip[index]!,
      );
      const mcp: Vec3 = mcps[index]!;
      const pip: Vec3 = V.plus(mcp, V.scale(proximal, first));
      const dip: Vec3 = V.plus(pip, V.scale(middle, second - first));
      const tip: Vec3 = V.plus(dip, V.scale(distal, web + length - second));
      fingers[NAMES[index]!] = {
        centres: [mcp, pip, dip, tip],
        dorsal: [...dorsal],
      };
    }

    // Transfer only the prior's direction from [crease, 0, 0] to the thenar
    // branch centre. That nominal axial crease is not the old skin loop's
    // mean or an observed WJC. Similarity transfer keeps this dimensionless
    // direction: no independent hand-depth measurement exists here. The CMC
    // meets the same base-level plane as the other metacarpals, radial and
    // palmar of the wrist; the measured MC length continues along that ray.
    const ray: Vec3 = [
      prior.branch - prior.crease,
      prior.thenar.b,
      prior.thenar.c,
    ];
    const base: number = reach - third;
    const cmc: Vec3 = point(
      base,
      (base * ray[1]) / ray[0],
      (base * ray[2]) / ray[0],
    );
    const metacarpal: Vec3 = V.unit(
      V.plus(
        V.scale(along, ray[0]),
        V.plus(V.scale(across, ray[1]), V.scale(frame.palmar, ray[2])),
      ),
    );
    const mcp: Vec3 = V.plus(cmc, V.scale(metacarpal, METACARPALS[0]! * third));
    const rest: { mcp: number; ip: number } =
      AutoMovieHumanHandPosture.thumbRest();
    const proximal: Vec3 = bend(metacarpal, frame.palmar, rest.mcp);
    const distal: Vec3 = bend(proximal, frame.palmar, rest.ip);
    const ip: Vec3 = V.plus(
      mcp,
      V.scale(proximal, prior.thumbProximal * given.thumb),
    );
    const tip: Vec3 = V.plus(
      ip,
      V.scale(distal, (1 - prior.thumbProximal) * given.thumb),
    );
    return {
      frame,
      radialCenter: -centres[1]!,
      fingers,
      thumb: { centres: [cmc, mcp, ip, tip], dorsal: [...dorsal] },
      knuckle: mcps[1]!,
      crease: crease(
        wrist,
        mcps[1]!,
        fingers.Middle.centres[1]!,
        given.palm,
        scale,
      ),
    };
  }

  /**
   * Reflect the generating points and directions together, retaining the
   * digit's material dorsal rather than reconstructing it from bent bones.
   *
   * @evidence contracts/common.md#principled-implementation Applies the body's declared bilateral reflection to every source point and material direction together.
   * @evidence contracts/common.md#clear-and-simple-design One sided record supplies both skeleton and original digit construction.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No frame is re-estimated from bent joints and no new posture or person coefficient is introduced.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes generating material directions from a reconstructed phalanx normal.
   * @evidence contracts/performance.md#efficient-algorithms Reflects five fixed-size digit records with constant-size vector arithmetic.
   * @evidence contracts/performance.md#reuse-equivalent-work The canonical side reuses its actual source; the reflected record is shared by bind and curve consumers.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns source-owned records without a global cache or calibration reference.
   */
  export function sided(hand: IOutput, sign: 1 | -1): IOutput {
    if (sign === 1) return hand;
    const point: (value: Vec3) => Vec3 = (value: Vec3): Vec3 => [
      value[0],
      value[1],
      -value[2],
    ];
    const digit: (value: IDigit) => IDigit = (value: IDigit): IDigit => ({
      centres: value.centres.map(point),
      dorsal: point(value.dorsal),
    });
    const fingers: Record<Finger, IDigit> = {
      Index: digit(hand.fingers.Index),
      Middle: digit(hand.fingers.Middle),
      Ring: digit(hand.fingers.Ring),
      Little: digit(hand.fingers.Little),
    };
    return {
      frame: {
        along: point(hand.frame.along),
        across: point(hand.frame.across),
        palmar: point(hand.frame.palmar),
      },
      radialCenter: hand.radialCenter,
      fingers,
      thumb: digit(hand.thumb),
      knuckle: fingers.Middle.centres[0]!,
      crease: point(hand.crease),
    };
  }

  /**
   * Public stylion-to-crease length on the straightened measuring course,
   * carried onto the proximal phalanx in the bind. The shared WJC offset
   * and MCP reach are removed once before that transport.
   *
   * @evidence contracts/common.md#principled-implementation Subtracts the shared stylion/WJC offset and actual wrist-to-MCP3 reach, then carries the remainder along the generated proximal direction.
   * @evidence contracts/common.md#clear-and-simple-design One point calculation keeps the independent public crease outside the bone/web ratio definitions.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses no skin path or flexed wrist-to-crease Euclidean distance as the straight measuring input.
   * @evidence contracts/common.md#meaningful-documentation States the measuring-to-bind transfer and the offset removed exactly once.
   * @evidence contracts/performance.md#efficient-algorithms Uses fixed-size vector differences, two norms and a scaled addition.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work One local point query coordinates no cross-request or effectful work.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a new tuple and retains no hand or skin reference.
   */
  export function crease(
    wrist: Vec3,
    mcp: Vec3,
    pip: Vec3,
    palm: number,
    scale: number,
  ): Vec3 {
    const after: number =
      palm -
      AutoMovieHumanHandJoints.STYLION * scale -
      V.norm(V.sub(mcp, wrist));
    return V.plus(mcp, V.scale(V.unit(V.sub(pip, mcp)), after));
  }
}

/** A point or unit direction in calibration coordinates. */
type Vec3 = V.Vec3;
/** The four fingers, in radial-to-ulnar packing order. */
const NAMES: readonly AutoMovieHumanHandBones.Finger[] = [
  "Index",
  "Middle",
  "Ring",
  "Little",
];
/** Reddy 2024 total metacarpal lengths over the third, thumb first. */
const METACARPALS: readonly number[] = [0.711, 1.039, 1, 0.883, 0.797];
/** Retained third-MC/reach convention across de Leva/Reddy datums; exact aggregation unrecovered. */
const THIRD: number = 0.774;
/** de Leva Table 4 WJC-to-MET3 / WJC-to-DAC3, a bony-landmark proxy for MCP3, women and men. */
const MET3: readonly number[] = [78 / 170.1, 86.2 / 187.9];
/** Buryanov 2010 Table III, each web's height above its MCP over web-to-tip length. */
const WEB: readonly number[] = [0.1552, 0.1533, 0.1849, 0.2472];

/** Turn a phalanx toward the palm by its shared bind angle, retaining unit length. */
function bend(direction: Vec3, palmar: Vec3, degrees: number): Vec3 {
  const normal: Vec3 = V.unit(
    V.sub(palmar, V.scale(direction, V.dot(palmar, direction))),
  );
  const angle: number = (degrees * Math.PI) / 180;
  return V.unit(
    V.plus(
      V.scale(direction, Math.cos(angle)),
      V.scale(normal, Math.sin(angle)),
    ),
  );
}
