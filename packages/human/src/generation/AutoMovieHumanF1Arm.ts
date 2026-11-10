import { AutoMovieContourLoftCurves64, AutoMovieSolidChain, type AutoMovieCurveMath64, type IAutoMovieLoftChain, type IAutoMovieSolidSurface, type IAutoMovieViewPart } from "@automovie/engine";

import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import type { AutoMovieHumanF1Body } from "./AutoMovieHumanF1Body";
import { AutoMovieHumanArmContact } from "./arm/AutoMovieHumanArmContact";
import { AutoMovieHumanArmCurveSpec } from "./arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanArmF1LeftSections } from "./arm/AutoMovieHumanArmF1LeftSections";
import { AutoMovieHumanArmF1Lines } from "./arm/AutoMovieHumanArmF1Lines";
import type { AutoMovieHumanArmF1Pose } from "./arm/AutoMovieHumanArmF1Pose";
import { AutoMovieHumanArmF1RightSections } from "./arm/AutoMovieHumanArmF1RightSections";
import { AutoMovieHumanArmInputs } from "./arm/AutoMovieHumanArmInputs";
import { AutoMovieHumanArmLandmarks } from "./arm/AutoMovieHumanArmLandmarks";
import { AutoMovieHumanArmSegmentFrames } from "./arm/AutoMovieHumanArmSegmentFrames";
import type { AutoMovieHumanArmShoulderJoin } from "./arm/AutoMovieHumanArmShoulderJoin";
import { AutoMovieHumanArmViewCurves } from "./arm/AutoMovieHumanArmViewCurves";
import { AutoMovieHumanArmViewLoft } from "./arm/AutoMovieHumanArmViewLoft";
import { AutoMovieHumanHandDigits } from "./hand/AutoMovieHumanHandDigits";
import { AutoMovieHumanHandF1LeftSections } from "./hand/AutoMovieHumanHandF1LeftSections";
import { AutoMovieHumanHandF1RightSections } from "./hand/AutoMovieHumanHandF1RightSections";
import { AutoMovieHumanHandPalm } from "./hand/AutoMovieHumanHandPalm";
import { AutoMovieHumanHandPorts } from "./hand/AutoMovieHumanHandPorts";
import type { AutoMovieHumanTrunkS00 } from "./trunk/AutoMovieHumanTrunkS00";

/**
 * One arm for the whole-body tree (`AutoMovieHumanF1Body`), composed from
 * f1_arm's published constructors exactly as its shoulder renderer
 * (`NodeArmShoulder`) and its digit specimen (`NodeArmSpecs`) compose them:
 * the person's arm inputs and chest-wall contact (`AutoMovieHumanArmInputs`),
 * the ISB segment frames at the neutral pose (elbow and wrist 0), the
 * landmarks, the view curves and the view loft with its dome, the hand's
 * digits from the same frames and root (`AutoMovieHumanHandDigits`), then the
 * stations the tree reads: the humeral head's and the axilla level's on the
 * loft, the loft's first chain station (its dome pole end) and its length.
 *
 * The loft's order 32, 64 ring samples and 6 mm widest layer gap are the
 * shoulder renderer's (f1_arm's choice for its join).
 */
export namespace AutoMovieHumanF1Arm {
  /**
   * Realize the fixed F1 arm and all five sewn digits in absolute capture
   * world millimetres. The trunk supplies the exact oriented armscye and
   * both incident parts keep those original coordinates and edges.
   */
  export function trace(side: "left" | "right", armscye: readonly AutoMovieCurveMath64.V[]): AutoMovieHumanF1Body.IFixedPart {
    if (armscye.length !== (side === "left" ? 65 : 63)) throw new Error(`The fixed F1 ${side} arm requires its exact trunk-owned armscye`);
    const source: AutoMovieHumanArmF1Lines.IFixedSource = side === "left" ? AutoMovieHumanArmF1LeftSections : AutoMovieHumanArmF1RightSections;
    const hand: AutoMovieHumanHandPorts.IFixed = side === "left" ? AutoMovieHumanHandF1LeftSections : AutoMovieHumanHandF1RightSections;
    const arm: AutoMovieHumanArmF1Lines.IFixedMesh = AutoMovieHumanArmF1Lines.sleeve(
      { points: [...armscye], normal: source.rootNormal }, source.sleeve, source.wrist,
    );

    // The palm starts on the exact 72-vertex sleeve end. Its own measured
    // plane sequence turns through the wrist and ends before any digit split.
    const root: AutoMovieCurveMath64.V[] = AutoMovieContourLoftCurves64.tessellate(source.palm[0]!.loops[0]!.curve, 0.1)
      .map(({ p: [x, y, z] }): AutoMovieCurveMath64.V => [x, y, -z]);
    AutoMovieHumanHandPalm.attachFixed(arm, source.palm, root, source.wristFrame, undefined,
      AutoMovieHumanHandPalm.contourCoordinates(source.palm, side === "left"));
    const mesh: AutoMovieHumanArmF1Lines.IFixedMesh = AutoMovieHumanHandPorts.fixed(arm, armscye, hand);
    return { mesh, included: [`thumb.${side}`, ...[1, 2, 3, 4].map((digit: number): string => `finger.${side}.${digit}`)] };
  }

  /** The arm loft's section order, ring samples and widest layer gap, mm (f1_arm's `NodeArmShoulder`). */
  export const LOFT: { order: number; samples: number; gap: number } = { order: 32, samples: 64, gap: 6 };

  /** One arm as the tree reads it. */
  export interface IArm extends AutoMovieHumanArmShoulderJoin.IInput {
    /**
     * The arm chain's first station, mm: its dome pole end, the end the
     * shoulder port's band faces. The axilla rail's depth into the part is
     * `stations.axilla - start` (f1_arm, 13:5x: the rail is the posed
     * station of the axilla level, `loft.station(at("axilla level"))`).
     */
    start: number;

    /** The hand's digits (f1_arm's `AutoMovieHumanHandDigits`), empty when they refused. */
    digits: AutoMovieHumanHandDigits.IDigit[];

    /** Why the digits are absent, or null. */
    digitsRefused: string | null;

    /** The hand breadth, mm, the finger tree's web spacing input. */
    breadth: number;

    /** The loft's world course centres, mm: dome pole, elbow, wrist, palm pole. */
    centres: [number, number, number][];

    /** The arm's lofted chain, mm (the palm's digit ports lie on its chart, `AutoMovieHumanHandPorts`). */
    chain: IAutoMovieLoftChain;

    /** How the root was placed: f1_arm's contact, then its re-solve over the port's kept stations. */
    placement: string;
  }

  /**
   * Build one arm on the given trunk part.
   *
   * @param params The public input.
   * @param side Which arm.
   * @param trunk The trunk's S00 view part.
   * @param gap Widest spacing between a blend's rows, mm.
   * @param s00 The same person's one S00 build, so the arm's chest-wall contact reads it instead of building S00 again.
   * @returns The arm, or why it has none.
   */
  export function of(params: IAutoMovieHumanParameters, side: "left" | "right", trunk: IAutoMovieViewPart, gap: number, s00?: AutoMovieHumanTrunkS00.IOutput): IArm | string {
    let inputs: AutoMovieHumanArmInputs.IOutput;
    try {
      inputs = AutoMovieHumanArmInputs.of(params, side, s00);
    } catch (error: unknown) {
      return `f1_arm's inputs refused: ${error instanceof Error ? error.message : String(error)}`;
    }
    const frames: AutoMovieHumanArmSegmentFrames.IOutput = AutoMovieHumanArmSegmentFrames.create({ side, arms: inputs.arms, pose: { elbow: 0, wrist: 0 } });
    const landmarks: AutoMovieHumanArmLandmarks.IOutput = AutoMovieHumanArmLandmarks.create(frames, inputs.arms);
    // Step 1: f1's own pose on S00's armscye port when the port exists (f1_arm's `AutoMovieHumanArmF1Pose`).
    const posed: AutoMovieHumanArmF1Pose.IOutput | undefined = inputs.posed ?? undefined;
    const curves: AutoMovieHumanArmViewCurves.IOutput = AutoMovieHumanArmViewCurves.create(frames, landmarks, inputs.tapes, inputs.calipers, posed);
    const axilla: number = AutoMovieHumanArmLandmarks.get(landmarks, "axilla level").walk;

    // The root: f1_arm's chest-wall contact (`AutoMovieHumanArmContact`)
    // solved again over the stations the shoulder port keeps. f1_arm's own
    // solve (`AutoMovieHumanArmInputs`) samples the medial skin from the
    // axilla level plus half the acromion-axilla height, the skin its fold
    // join's blend owned; the port keeps every station from the axilla rail,
    // so that span crossed S00 (run 15: 282 trunk crossing pairs at the
    // shoulders, f1_arm 16:0x). Same law, same samples (every 8 mm to 8 mm
    // short of the palm pole, the medial phases 12..36 of 48, on the
    // unabducted loft), from the rail: the arm turns about the humerus X at
    // GH until its nearest kept point rests on S00's skin (gap 0), so no
    // kept station enters S00.
    let root: AutoMovieHumanArmCurveSpec.ITransform = inputs.root;
    let placement: string = inputs.placement;
    const field: IAutoMovieSolidSurface | null = s00?.chain === null || s00?.chain === undefined ? null : AutoMovieSolidChain.surface(s00.chain);
    if (inputs.contact !== null && s00 !== undefined && field !== null) {
      const neutral: AutoMovieHumanArmViewLoft.IOutput = AutoMovieHumanArmViewLoft.create({ curves, frames, landmarks, root: inputs.port, order: LOFT.order, samples: LOFT.samples, gap: LOFT.gap });
      const surface: IAutoMovieSolidSurface | null = neutral.loft?.chain === null || neutral.loft?.chain === undefined ? null : AutoMovieSolidChain.surface(neutral.loft.chain);
      if (surface !== null) {
        const points: [number, number, number][] = [];
        for (let u: number = neutral.station(axilla); u <= neutral.length - 8; u += 8)
          for (let k: number = 12; k <= 36; ++k) {
            const p: readonly number[] = surface.point !== undefined ? surface.point(u, (2 * Math.PI * k) / 48) : surface.jet(u, (2 * Math.PI * k) / 48).p;
            points.push([p[0]!, p[1]!, p[2]!]);
          }
        const m: 1 | -1 = side === "left" ? 1 : -1;
        const x: [number, number, number] = inputs.port.axes[0] as [number, number, number];
        // f1_arm's solver refuses when no turn within its bracket brings the
        // least gap to zero (run 17: -69 mm at zero abduction, no sign change
        // over +-0.5 rad): the arm then keeps f1_arm's own contact root and
        // the refusal is reported in `placement`, never patched here.
        try {
          const solved: AutoMovieHumanArmContact.IOutput = AutoMovieHumanArmContact.solve({
            points,
            centre: inputs.port.origin as [number, number, number],
            axis: AutoMovieHumanArmCurveSpec.unit([x[0] * m, x[1] * m, x[2] * m]),
            gap: AutoMovieHumanArmContact.trunk(field, s00.curves.axis.turn, inputs.arms.scale),
            limit: 0.5,
          });
          root = AutoMovieHumanArmInputs.abducted(inputs.port, m * solved.angle);
          placement = `${inputs.placement}; re-solved from the axilla rail for the port: abducted ${((solved.angle * 180) / Math.PI).toFixed(3)} deg (least gap ${solved.gap.toFixed(4)} mm, ${solved.samples} samples)`;
        } catch (error: unknown) {
          placement = `${inputs.placement}; the re-solve from the axilla rail refused, f1_arm's contact root kept: ${error instanceof Error ? error.message : String(error)}`;
        }
      }
    }
    const loft: AutoMovieHumanArmViewLoft.IOutput = AutoMovieHumanArmViewLoft.create({ curves, frames, landmarks, root, order: LOFT.order, samples: LOFT.samples, gap: LOFT.gap, ...(posed === undefined ? {} : { posed }) });
    if (loft.part === null) return `f1_arm's loft published no part: ${loft.diagnostics.join("; ")}`;
    const chain: IAutoMovieLoftChain | null | undefined = loft.loft?.chain;
    const start: number | undefined = chain?.layers[0]?.y;
    if (chain === null || chain === undefined || start === undefined) return "f1_arm's loft published no chain";
    let digits: AutoMovieHumanHandDigits.IDigit[] = [];
    let digitsRefused: string | null = null;
    try {
      digits = AutoMovieHumanHandDigits.create(frames, posed?.hand ?? root, { sex: inputs.arms.sex, breadth: inputs.tapes.breadth });
    } catch (error: unknown) {
      digitsRefused = `f1_arm's digits refused: ${error instanceof Error ? error.message : String(error)}`;
    }
    return {
      trunk,
      arm: loft.part,
      stations: { head: loft.station(landmarks.course.port), axilla: loft.station(axilla), length: loft.length },
      shoulder: axilla - landmarks.course.acromion,
      female: landmarks.female,
      gap,
      start,
      digits,
      digitsRefused,
      breadth: inputs.tapes.breadth,
      centres: loft.centres,
      chain,
      placement,
    };
  }
}
