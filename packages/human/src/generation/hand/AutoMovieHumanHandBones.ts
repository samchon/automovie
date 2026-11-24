import type {
  AutoMovieHumanSex as AutoMovieHumanSexType,
  AutoMovieVector3Tuple,
  IAutoMovieHumanHandBones,
  IAutoMovieHumanHandFrame,
  IAutoMovieHumanHandMeasures,
  IAutoMovieLoftContract,
} from "@automovie/interface";

import { AutoMovieHumanSex } from "../../typings/AutoMovieHumanSex";
import { AutoMovieHumanDigitJoints } from "../AutoMovieHumanDigitJoints";
import { AutoMovieHumanHandJoints } from "./AutoMovieHumanHandJoints";
import { AutoMovieHumanHandPosture } from "./AutoMovieHumanHandPosture";
import { AutoMovieHumanHandVector as V } from "./AutoMovieHumanHandVector";

/**
 * Pure hand joint definitions, before skin: measured metacarpal and phalanx
 * ratios on the person's lengths, with a conventional packing of PIP breadth
 * proxies inside the hand breadth (`docs/anatomy/hand.md`, Finger widths and
 * webs). PIP breadth is not an observed MCP breadth. Metacarpal bases are
 * level. The thumb uses the retained thenar branch direction, transferred from
 * the form's nominal axial crease into this hand's material frame; its CMC is
 * that ray's intersection with the metacarpal-base plane. This is a placement
 * convention, not a measured CMC or an old skin solve. The common forearm WJC
 * keeps its retained 1.5 mm stylion offset; de Leva's hand-specific Table 2
 * offsets of 2.2/2.4 mm are different datums. Applying the hand ratios here is
 * an explicit transfer to that shared WJC, not a claim that the paper measured
 * this identical hand origin. MET3-to-MCP, interarticular-to-joint-centre and
 * thumb-crease-to-MCP transfers remain placement proxies. Public palm length
 * owns the proximal digit-III crease, independently of these joint and web
 * definitions.
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
   * A left hand's straight-wrist material frame. The canonical bind places the
   * radial side toward anatomical anterior, projected off the forearm.
   */
  export function frame(
    forearm: AutoMovieVector3Tuple,
  ): IAutoMovieHumanHandFrame {
    const length: number = V.norm(forearm);
    if (!Number.isFinite(length) || !(length > 0))
      throw new Error("A hand frame needs a finite forearm direction");
    const along: AutoMovieVector3Tuple = [
      forearm[0] / length,
      forearm[1] / length,
      forearm[2] / length,
    ];
    const radial: AutoMovieVector3Tuple =
      along[1] === 0 && along[2] === 0 ? [0, 0, 1] : [1, 0, 0];
    const across: AutoMovieVector3Tuple = V.across(radial, along);
    return { along, across, palmar: V.cross(across, along) };
  }

  /**
   * Place a hand without constructing or measuring a palm, digit or mesh.
   * Public lengths are measured in the straightened measuring pose; shared bind
   * flexions turn the phalanges while keeping each segment's length.
   *
   * @param material A left-hand orthonormal frame supplied by the person's
   *   forearm. A standalone hand uses the straight downward chart.
   * @evidence contracts/common.md#principled-implementation Uses Reddy's MC ratios, de Leva's third-MC reach, Buryanov's web/joint ratios and the existing shared bind posture; no generated skin is queried.
   * @evidence contracts/common.md#clear-and-simple-design Publishes four-centre digit records that both skeleton and body construction can consume.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Each hand reads its own public dimensions; PIP packing proxies and the unmeasured CMC convention are explicit, without person-specific corrections.
   * @evidence contracts/common.md#meaningful-documentation Separates web-to-tip, wrist-to-web, MC total length and breadth-proxy datums and states calibration units.
   * @evidence contracts/performance.md#efficient-algorithms Places five fixed-size joint records with linear vector arithmetic rather than running an old skin solver.
   * @evidence contracts/performance.md#reuse-equivalent-work A single hand frame and packing supplies all digits and the palm's distal centre.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns owned tuples only and keeps no identity cache or calibration reference.
   */
  export function of(
    wrist: AutoMovieVector3Tuple,
    given: IAutoMovieHumanHandMeasures,
    sex: AutoMovieHumanSexType,
    scale: number,
    diagnostics: IAutoMovieLoftContract.IDiagnostic[],
    material: IAutoMovieHumanHandFrame = frame([0, -1, 0]),
  ): IAutoMovieHumanHandBones.IOutput {
    const phalangealScale: number = given.phalangealLengthScale ?? 1;
    if (
      !(
        scale > 0 &&
        given.length > given.palm &&
        given.palm > AutoMovieHumanHandJoints.STYLION * scale &&
        given.breadth > 0 &&
        given.thumb > 0 &&
        Number.isFinite(phalangealScale) &&
        phalangealScale > 0
      )
    )
      throw new Error(
        "A hand needs positive dimensions with hand length beyond its palm",
      );
    const { along, across, palmar } = material;
    const dorsal: AutoMovieVector3Tuple = V.scale(palmar, -1);
    const terminal: number =
      given.length - AutoMovieHumanHandJoints.STYLION * scale;
    const population: 0 | 1 = sex === AutoMovieHumanSex.Female ? 0 : 1;
    const reach: number = MET3[population] * terminal;
    const external: number = (terminal - reach) / (1 + PHALANGES[1]!.web);
    const third: number = THIRD[population] * reach;

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
    const point: (a: number, b: number, c?: number) => AutoMovieVector3Tuple = (
      a: number,
      b: number,
      c: number = 0,
    ): AutoMovieVector3Tuple =>
      V.plus(
        wrist,
        V.plus(
          V.scale(along, a),
          V.plus(V.scale(across, b), V.scale(palmar, c)),
        ),
      );
    const mcps: AutoMovieVector3Tuple[] = centres.map(
      (b: number, index: number): AutoMovieVector3Tuple =>
        point(reach - third + METACARPALS[index + 1]! * third, b - centres[1]!),
    );
    const fingers: Record<
      IAutoMovieHumanHandBones.Finger,
      IAutoMovieHumanHandBones.IDigit
    > = {} as Record<
      IAutoMovieHumanHandBones.Finger,
      IAutoMovieHumanHandBones.IDigit
    >;
    for (let index: number = 0; index < NAMES.length; index++) {
      const {
        web,
        middle: middleShare,
        distal: distalShare,
        external: own,
      } = PHALANGES[index]!;
      const length: number =
        ((external * own) / PHALANGES[1]!.external) * phalangealScale;
      const first: number = (web + 1 - distalShare - middleShare) * length;
      const second: number = (web + 1 - distalShare) * length;
      const proximal: AutoMovieVector3Tuple = AutoMovieHumanHandJoints.proximal(
        index + 1,
        material,
      );
      const middle: AutoMovieVector3Tuple = bend(
        proximal,
        palmar,
        AutoMovieHumanHandPosture.FINGERS.pip[index]!,
      );
      const distal: AutoMovieVector3Tuple = bend(
        middle,
        palmar,
        AutoMovieHumanHandPosture.FINGERS.dip[index]!,
      );
      const mcp: AutoMovieVector3Tuple = mcps[index]!;
      const pip: AutoMovieVector3Tuple = V.plus(mcp, V.scale(proximal, first));
      const dip: AutoMovieVector3Tuple = V.plus(
        pip,
        V.scale(middle, second - first),
      );
      const tip: AutoMovieVector3Tuple = V.plus(
        dip,
        V.scale(distal, distalShare * length),
      );
      fingers[NAMES[index]!] = {
        centres: [mcp, pip, dip, tip],
        dorsal: [...dorsal],
      };
    }

    // The thumb base and axis use the public rig's landmark ratios, with
    // longitudinal placement scaled by MCP3 and cross directions by II–V.
    const chord: number = V.dot(V.sub(mcps[0]!, mcps[3]!), across);
    const cmc: AutoMovieVector3Tuple = point(
      THUMB_BASE[0] * reach,
      THUMB_BASE[1] * chord,
      THUMB_BASE[2] * chord,
    );
    const metacarpal: AutoMovieVector3Tuple = V.unit(
      V.plus(
        V.scale(along, THUMB_AXIS[0]),
        V.plus(V.scale(across, THUMB_AXIS[1]), V.scale(palmar, THUMB_AXIS[2])),
      ),
    );
    const mcp: AutoMovieVector3Tuple = V.plus(
      cmc,
      V.scale(metacarpal, METACARPALS[0]! * third),
    );
    const rest: { mcp: number; ip: number } =
      AutoMovieHumanHandPosture.thumbRest();
    const proximal: AutoMovieVector3Tuple = bend(metacarpal, palmar, rest.mcp);
    const distal: AutoMovieVector3Tuple = bend(proximal, palmar, rest.ip);
    const ip: AutoMovieVector3Tuple = V.plus(
      mcp,
      V.scale(proximal, THUMB_PROXIMAL * given.thumb * phalangealScale),
    );
    const tip: AutoMovieVector3Tuple = V.plus(
      ip,
      V.scale(distal, (1 - THUMB_PROXIMAL) * given.thumb * phalangealScale),
    );
    return {
      frame: { along: [...along], across: [...across], palmar: [...palmar] },
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
  export function sided(
    hand: IAutoMovieHumanHandBones.IOutput,
    sign: 1 | -1,
  ): IAutoMovieHumanHandBones.IOutput {
    if (sign === 1) return hand;
    const point: (value: AutoMovieVector3Tuple) => AutoMovieVector3Tuple = (
      value: AutoMovieVector3Tuple,
    ): AutoMovieVector3Tuple => [value[0], value[1], -value[2]];
    const digit: (
      value: IAutoMovieHumanHandBones.IDigit,
    ) => IAutoMovieHumanHandBones.IDigit = (
      value: IAutoMovieHumanHandBones.IDigit,
    ): IAutoMovieHumanHandBones.IDigit => ({
      centres: value.centres.map(point),
      dorsal: point(value.dorsal),
    });
    const fingers: Record<
      IAutoMovieHumanHandBones.Finger,
      IAutoMovieHumanHandBones.IDigit
    > = {
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
   * carried onto the proximal phalanx in the bind. The shared WJC offset and
   * MCP reach are removed once before that transport.
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
    wrist: AutoMovieVector3Tuple,
    mcp: AutoMovieVector3Tuple,
    pip: AutoMovieVector3Tuple,
    palm: number,
    scale: number,
  ): AutoMovieVector3Tuple {
    const after: number =
      palm -
      AutoMovieHumanHandJoints.STYLION * scale -
      V.norm(V.sub(mcp, wrist));
    return V.plus(mcp, V.scale(V.unit(V.sub(pip, mcp)), after));
  }
}

/** The four fingers, in radial-to-ulnar packing order. */
const NAMES: readonly IAutoMovieHumanHandBones.Finger[] = [
  "Index",
  "Middle",
  "Ring",
  "Little",
];
/** Reddy 2024 total metacarpal lengths over the third, thumb first. */
const METACARPALS: readonly number[] = [0.711, 1.039, 1, 0.883, 0.797];
/**
 * Reddy Table 4 MC3 total length divided by de Leva Table 4 WJC-to-MET3 reach,
 * women and men.
 */
const THIRD: readonly [number, number] = [60.4 / 78, 66.6 / 86.2];
/**
 * De Leva Table 4 WJC-to-MET3 / WJC-to-DAC3, a bony-landmark proxy for MCP3,
 * women and men.
 */
const MET3: readonly [number, number] = [78 / 170.1, 86.2 / 187.9];

/**
 * Buryanov Tables I and III, in index-to-little order. The distal share
 * includes tip soft tissue.
 */
const PHALANGES: ReadonlyArray<{
  web: number;
  middle: number;
  distal: number;
  external: number;
}> = [
  {
    web: 0.1552,
    middle: 0.3097,
    distal: 0.278,
    external: (15.82 + 3.84) / 0.278,
  },
  {
    web: 0.1533,
    middle: 0.3311,
    distal: 0.2632,
    external: (17.4 + 3.95) / 0.2632,
  },
  {
    web: 0.1849,
    middle: 0.3361,
    distal: 0.2825,
    external: (17.3 + 3.95) / 0.2825,
  },
  {
    web: 0.2472,
    middle: 0.3199,
    distal: 0.3392,
    external: (15.96 + 3.73) / 0.3392,
  },
];

/** Buryanov Table I, proximal share of the thumb's MCP-to-skin-tip length. */
const THUMB_PROXIMAL: number = 31.57 / (31.57 + 21.67 + 5.67);

/**
 * HM08 thumb CMC relative to wrist, normalized longitudinally by MCP3 reach and
 * transversely by II–V.
 */
const THUMB_BASE: AutoMovieVector3Tuple = [0.345, 0.355, 0.224];

/** HM08 thumb CMC-to-MCP direction in its wrist-and-knuckle frame. */
const THUMB_AXIS: AutoMovieVector3Tuple = [0.673, 0.665, 0.323];

/**
 * Turn a phalanx toward the palm by its shared bind angle, retaining unit
 * length.
 */
function bend(
  direction: AutoMovieVector3Tuple,
  palmar: AutoMovieVector3Tuple,
  degrees: number,
): AutoMovieVector3Tuple {
  const normal: AutoMovieVector3Tuple = V.unit(
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
