import type { IAutoMovieHumanHandDigit } from "./IAutoMovieHumanHandDigit";
import type { IAutoMovieHumanHandFinger } from "./IAutoMovieHumanHandFinger";
import type { IAutoMovieHumanHandScales } from "./IAutoMovieHumanHandScales";
import { AutoMovieHumanArmPrior } from "../AutoMovieHumanArmPrior";
import { AutoMovieHumanDigitPalmarShare } from "./AutoMovieHumanDigitPalmarShare";
import { AutoMovieHumanDigitProfile } from "./AutoMovieHumanDigitProfile";
import { AutoMovieHumanDigitRing } from "./AutoMovieHumanDigitRing";
import { AutoMovieHumanDigitTipCap } from "./AutoMovieHumanDigitTipCap";
import { AutoMovieHumanHandWebCrest } from "./AutoMovieHumanHandWebCrest";
import { AutoMovieHumanSeamUnion } from "../../lofting/AutoMovieHumanSeamUnion";
import { AutoMovieHumanDigitLine } from "../AutoMovieHumanDigitLine";
import { AutoMovieHumanDigitSection } from "../AutoMovieHumanDigitSection";
import { AutoMovieHumanHandDigitLaw } from "./AutoMovieHumanHandDigitLaw";
import { AutoMovieHumanHandVector } from "./AutoMovieHumanHandVector";
import { AutoMovieHumanMonotoneCubic } from "../../lofting/AutoMovieHumanMonotoneCubic";

type Vec3 = AutoMovieHumanHandVector.Vec3;
const { sub, norm, across, cross }: typeof AutoMovieHumanHandVector = AutoMovieHumanHandVector;
const { linePoint }: typeof AutoMovieHumanHandDigitLaw = AutoMovieHumanHandDigitLaw;
const { at: palmarShare }: typeof AutoMovieHumanDigitPalmarShare = AutoMovieHumanDigitPalmarShare;

/**
 * A digit on its bones: its centre line from its legs, its sections as palmar
 * and dorsal halves on two side points, its tip and its first section clear of
 * the webs.
 */
export namespace AutoMovieHumanHandDigitBones {
  /** Spacing of a finger's centre line along its bones, mm. */
  const FINGER_STEP: number = 0.25;

  /**
   * A digit's line, sections, tip and first section on its legs. A finger's
   * sections follow the phalanx span law from its own root section (the
   * form's, scaled by the hand's across and through scales), the thumb's are
   * the form's read at the same share of the way from the root to the tip;
   * both carry the joint swellings, creases, pulp and nail of
   * `AutoMovieHumanDigitProfile`, each drawn as the four-guide ring
   * (`AutoMovieHumanDigitRing`); the line turns at each joint over the
   * elbow's rule, half a length of `softness` times the joint's radius; the
   * tip closes where its radius equals the length left to the apex
   * (`AutoMovieHumanDigitTipCap`).
   *
   * @param rootAt Length along the line of the digit's root, where the form's sections start; 0 for the thumb, whose line starts at its root.
   * @param joints Lengths of its joints along the line, proximal first.
   */
  export function onBones(
    d: IAutoMovieHumanHandDigit,
    start: Vec3,
    legs: readonly { direction: Vec3; length: number }[],
    rootAt: number,
    joints: readonly number[],
    hand: IAutoMovieHumanHandScales,
  ): IAutoMovieHumanHandFinger {
    const length: number = legs.reduce((s: number, l: { length: number }): number => s + l.length, 0);
    const formEnd: number = d.cap + norm(sub(d.pole, linePoint(d, d.cap)));
    const size = (s: number): [number, number] => {
      const f: number = Math.min(d.cap, Math.min(1, Math.max(0, (s - rootAt) / (length - rootAt))) * formEnd);
      return [
        AutoMovieHumanMonotoneCubic.interpolate(d.width, f) * hand.across,
        AutoMovieHumanMonotoneCubic.interpolate(d.depth, f) * hand.through,
      ];
    };
    const radius = (s: number): number => {
      const [w, h] = size(s);
      return Math.sqrt(w * h);
    };
    const softness: number = AutoMovieHumanArmPrior.PRIOR.arm.softness;
    const line: AutoMovieHumanDigitLine.ILine = AutoMovieHumanDigitLine.build(
      start,
      legs.map((l: { direction: Vec3; length: number }, i: number): AutoMovieHumanDigitLine.ILeg => ({
        direction: l.direction,
        length: l.length,
        turn: i + 1 < legs.length ? softness * radius(joints[i]!) : 0,
      })),
      FINGER_STEP,
    );

    // The form's own section, its palmar half's share of the depth by phalanx:
    // the thumb's base, and the root every finger's span law scales to.
    const formBase = (s: number): [number, number, number] => {
      const [w, h] = size(s);
      const r: number = palmarShare(s, joints, length);

      return [w, (2 * h * r) / (1 + r), (2 * h) / (1 + r)];
    };

    // The form's cap, the end of the distal span: where its radius reaches
    // the length left to the apex.
    const formCap: number = AutoMovieHumanDigitTipCap.start({ radius, length, from: rootAt });
    const thumb: boolean = rootAt === 0;
    const base: (s: number) => [number, number, number] = thumb
      ? formBase
      : AutoMovieHumanDigitProfile.span(size(rootAt), [rootAt, joints[0]!, joints[1]!, formCap]);
    const profile: AutoMovieHumanDigitProfile.IInput = {
      base,
      root: rootAt,
      joints: [joints[0]!, joints[1]!],
      length,
      cap: formCap,
      softness,
      thumb,
    };
    const shape: (s: number) => AutoMovieHumanDigitSection.IShape = AutoMovieHumanDigitProfile.of(profile);

    // The tip closes where the composed section's radius reaches the length
    // left to the apex (`AutoMovieHumanDigitTipCap`).
    const cap: number = AutoMovieHumanDigitTipCap.start({
      radius: (s: number): number => {
        const q: AutoMovieHumanDigitSection.IShape = shape(s);

        return Math.sqrt(q.width * ((q.palmar + q.dorsal) / 2));
      },
      length,
      from: rootAt,
    });
    const pole: Vec3 = AutoMovieHumanDigitTipCap.apex(line.at(cap), line.tangent(cap), cap, length);
    const across_: Vec3 = [...AutoMovieHumanArmPrior.PRIOR.hand.across];
    const sense: number = d.angles.length > 1 && d.angles[1]! < 0 ? -1 : 1;
    const ring = (s: number): Vec3[] => {
      const c: Vec3 = line.at(s);
      const t: Vec3 = line.tangent(Math.min(cap, s));
      const b: Vec3 = across(across_, t);
      const n: Vec3 = cross(b, t);
      const count: number = d.angles.length;
      const knots: [number, number][] = sectionKnots(shape(Math.min(cap, s)), count);
      return knots.map((_: [number, number], m: number): Vec3 => {
        const [x, y] = knots[sense === 1 ? m : (count - m) % count]!;
        return [c[0] + x * b[0] + y * n[0], c[1] + x * b[1] + y * n[1], c[2] + x * b[2] + y * n[2]];
      });
    };

    // Its first own section from its own bones: where it parts from its
    // neighbours on the palm, the palmar web halfway along its proximal
    // phalanx (`AutoMovieHumanHandWebCrest.PALMAR_SHARE`, Gray 1918), past it
    // by the blend width of its own size; the web surface from the palm's ring
    // adapts to it. The proximal phalanx runs from the line's start (a
    // finger's MCP) or from the thumb's MCP (its first joint) to the next
    // joint.
    const p1From: number = thumb ? joints[0]! : 0;
    const p1To: number = thumb ? joints[1]! : joints[0]!;
    const web: number = p1From + AutoMovieHumanHandWebCrest.PALMAR_SHARE * (p1To - p1From);
    const webShape: AutoMovieHumanDigitSection.IShape = shape(web);
    const first: number = Math.min(
      cap - 3,
      Math.max(rootAt, web + AutoMovieHumanSeamUnion.width((webShape.palmar + webShape.dorsal) / 2, webShape.width)),
    );
    // The nail plate's window; its dorsal side is the section's -y
    // (`AutoMovieHumanDigitSection`), the ring's -n.
    const plate: { root: number; edge: number; width: number } = AutoMovieHumanDigitProfile.nail(profile);
    const plateTangent: Vec3 = line.tangent(plate.root);
    const plateNormal: Vec3 = cross(across(across_, plateTangent), plateTangent);
    const plateLength: number = norm(plateNormal) || 1;
    const dorsal: Vec3 = [-plateNormal[0] / plateLength, -plateNormal[1] / plateLength, -plateNormal[2] / plateLength];
    return {
      joints: joints.map((s: number): Vec3 => line.at(s)),
      points: line.points,
      step: line.step,
      line,
      shape,
      ring,
      first,
      cap,
      pole,
      external: length,
      windows: AutoMovieHumanDigitProfile.windows(profile),
      nail: { ...plate, dorsal },
    };
  }

  /**
   * A section's points at its knots: the four-guide ring
   * (`AutoMovieHumanDigitRing`, radial side, palmar, ulnar side and dorsal
   * guides) when the count allows four sectors of at least four spans, else
   * the two-half section; the uniform cubic B-spline of the controls read
   * where an interpolating consumer reads it, so the guides' jets survive.
   *
   * @param shape The section's shape, mm.
   * @param count Control points.
   */
  function sectionKnots(shape: AutoMovieHumanDigitSection.IShape, count: number): [number, number][] {
    if (count % 4 !== 0 || count < 16) return AutoMovieHumanDigitSection.knots(shape, count);

    const p: [number, number][] = AutoMovieHumanDigitRing.controls(shape, count);

    return p.map((q: [number, number], m: number): [number, number] => {
      const a: [number, number] = p[(m - 1 + count) % count]!;
      const b: [number, number] = p[(m + 1) % count]!;

      return [(a[0] + 4 * q[0] + b[0]) / 6, (a[1] + 4 * q[1] + b[1]) / 6];
    });
  }
}
