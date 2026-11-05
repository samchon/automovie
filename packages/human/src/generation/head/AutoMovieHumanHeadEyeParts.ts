import { AutoMovieViewAxis, AutoMovieViewSection, type IAutoMovieViewPart } from "@automovie/engine";

import { AutoMovieHumanHeadMedianProfile } from "../AutoMovieHumanHeadMedianProfile";
import { AutoMovieHumanHeadPrior } from "../AutoMovieHumanHeadPrior";
import { AutoMovieHumanReferenceOutlines } from "../AutoMovieHumanReferenceOutlines";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import type { IAutoMovieHumanHeadEyeOpening } from "../IAutoMovieHumanHeadEyeOpening";
import { AutoMovieHumanHeadSourceAxis } from "./AutoMovieHumanHeadSourceAxis";

/**
 * Original globe and fissure views for the eye module's curve inspection. These are
 * independent parts, not an addition of volume to the head's skin tree.
 *
 * The outer sclera's lateral/vertical diameters and the emmetropic
 * cornea-to-sclera AP length are Bekerman 2014 Table 1. An ellipsoid through
 * those three diameters is a modelling approximation; a separate corneal
 * cap must not add its depth to the already cornea-inclusive AP length.
 * AP placement still uses the retained margin-seat convention, whose
 * 13.5 mm nasion recess and 6.26 mm forward offset are not established by
 * that diameter study. Vertical/lateral placement uses the same own-side
 * pupil datum as the fissure, rather than adding a separate globe rise.
 *
 * @evidence contracts/common.md#principled-implementation Uses three external globe dimensions and the published upper-lid cubic, with independent public canthus/separation constraints. The same affine map places the photographic pupil; ellipsoid, lower-margin and AP-placement conventions remain explicit.
 * @evidence contracts/common.md#clear-and-simple-design Publishes four independent view parts for source-curve inspection; it neither constructs lids nor joins globes into skin.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses no f1 fit, retina/keratometric substitution, fabricated lid thickness or realized-opening claim; emmetropia and lower/MRD transfer are declared conventions.
 * @evidence contracts/common.md#meaningful-documentation Gives external measurement sites, cornea-inclusive AP, exact cubic parameter/jet meaning, template pupil and the independent-study boundary.
 * @evidence contracts/performance.md#efficient-algorithms One bounded pupil inversion, two thirteen-site globes and two bounded fissure-site lists supply original views; the engine owns interpolation and lofting.
 * @evidence contracts/performance.md#reuse-equivalent-work Both margins and their source axis use linear combinations of the identical primary controls; the own-side pupil also places its globe.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns call-owned source records and retains fixed immutable diameter data, without a global person, source image or prepared callback.
 */
export namespace AutoMovieHumanHeadEyeParts {
  /**
   * External radii [AP, superior-inferior, lateral], world mm, from
   * Bekerman 2014 Table 1: axial Group II and sclera-to-sclera rows.
   * The small observed side difference is not a significant population rule.
   */
  const RADII: Readonly<Record<"left" | "right", readonly [number, number, number]>> = {
    left: [23.562 / 2, 23.752 / 2, 24.324 / 2],
    right: [23.422 / 2, 23.799 / 2, 24.156 / 2],
  };

  /** Angular intervals of each ellipse; the engine owns the C2 interpolation between these sites. */
  const INTERVALS: number = 12;

  /**
   * Draw both external globes and fissures in their shared pupil frames, calibration mm.
   *
   * @evidence contracts/common.md#principled-implementation Fixes en-ex as a 3D chord and en-en between shared-height nasal endpoints, maps the source photo's pupil by the same affine function as the upper cubic, and closes supplied pupil-aligned margin separation with the stated MRD split. Each outside globe uses its three external dimensions in that own-side pupil frame.
   * @evidence contracts/common.md#clear-and-simple-design Publishes two globe and two fissure views only. Common cubic controls define each fissure's parallel origin and signed guides; realization and lid/tree connection remain separate.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Imports published controls directly; there is no private FISSURE completion, reference fit, fake lid thickness or substitution of globe diameters for supplied fissure dimensions.
   * @evidence contracts/common.md#meaningful-documentation States endpoint mapping, exact normalized cubic jets, template pupil, lower-curve convention, outside diameters, AP allowance and unconnected-study scope.
   * @evidence contracts/performance.md#efficient-algorithms One bounded sixty-step source-pupil inversion and two thirteen-site globes precede at most thirty-four fissure evaluation sites per side. Three value/first/second-jet knots declare each cubic without a sampled refit.
   * @evidence contracts/performance.md#reuse-equivalent-work Linear combinations of the same four controls supply upper/lower guides and origin; the resulting own-side pupil places its globe. No cross-input cache changes identity or invalidation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources All source arrays and frame functions belong to the returned four parts; no person, source image or asynchronous handle is retained globally.
   */
  export function of(plan: IAutoMovieHumanHeadLayout): IAutoMovieViewPart[] {
    const k: number = plan.scale;
    const face: AutoMovieHumanHeadPrior.IFace = AutoMovieHumanHeadPrior.PRIOR.face;
    const seat: number = AutoMovieHumanHeadMedianProfile.profileAt(plan, plan.nasion) - face.eyeRecess * k;
    const fissures: { part: IAutoMovieViewPart; pupil: [number, number, number] }[] = openings(plan, seat);
    const globes: IAutoMovieViewPart[] = (["left", "right"] as const).map((side: "left" | "right", index: number): IAutoMovieViewPart => {
      const r: readonly [number, number, number] = RADII[side];
      const pupil: [number, number, number] = fissures[index]!.pupil;
      const centre: [number, number, number] = [pupil[0] - face.marginForward * k, pupil[1], pupil[2]];
      const stations: number[] = Array.from({ length: INTERVALS + 1 }, (_: unknown, i: number): number => -r[0] * k * Math.cos((Math.PI * i) / INTERVALS));
      /** One exact ellipse at its sites, interpolated by the engine in its declared pole parameter. */
      const outline: (radius: number, sign: 1 | -1) => IAutoMovieViewPart.IOutline = (radius: number, sign: 1 | -1): IAutoMovieViewPart.IOutline => ({
        knots: stations.map((station: number, i: number): IAutoMovieViewPart.IKnot => ({
          site: `globe.${side}.${i}`,
          station,
          value: i === 0 || i === INTERVALS ? 0 : sign * radius * k * Math.sin((Math.PI * i) / INTERVALS),
        })),
      });
      return {
        name: `globe.${side}`,
        axis: AutoMovieViewAxis.straight(centre, [0, 0, 1], [0, 1, 0]),
        stations,
        front: { positive: outline(r[2], 1), negative: outline(r[2], -1) },
        side: { positive: outline(r[1], 1), negative: outline(r[1], -1) },
        fullness: { kind: "shoulder", shoulder: { knots: [stations[0]!, stations[stations.length - 1]!].map((station: number): IAutoMovieViewPart.IKnot => ({ site: `globe.${side}.ellipse`, station, value: AutoMovieViewSection.ELLIPSE })) } },
        pole: "both",
        order: 32,
        samples: 128,
      };
    });
    return [...globes, ...fissures.map((fissure: { part: IAutoMovieViewPart; pupil: [number, number, number] }): IAutoMovieViewPart => fissure.part)];
  }

  /**
   * Source fissure volumes, for curve inspection before any lid trim is wired.
   * Shin's upper cubic is mapped by its chord residual; the lower parabola
   * is an explicit construction convention. Rana 2023's MRD1:MRD2 3.5:5.2
   * sets the split about the affine-mapped photographic pupil, not a
   * lower-lid observation in Shin's study. That photo's pupil is (0,0):
   * its image under the identical chord/residual map is shared with the
   * globe. It is a template-derived place, not an individual 3D pupil
   * measurement; the endpoint chord itself is not the pupil's Y datum.
   * Both margins share forward place, so their pupil separation is also the
   * 3D Ps-Pi distance. The outside globe's AP radius sizes the retained
   * regular-site cutter allowance, not lid tissue thickness. The visible
   * upper margin and origin share the affine-mapped cubic's parameter;
   * the lower residual is a parabola in that parameter, not a photographed
   * lower-lid course.
   */
  function openings(plan: IAutoMovieHumanHeadLayout, seat: number): { part: IAutoMovieViewPart; pupil: [number, number, number] }[] {
    const controls: readonly (readonly [number, number])[] = AutoMovieHumanReferenceOutlines.SHIN_UPPER_LID[plan.sex === 1 ? "female" : "male"];
    const first: readonly [number, number] = controls[0]!;
    const last: readonly [number, number] = controls[3]!;
    const tilt: number = Math.atan2(first[1] - last[1], last[0] - first[0]);
    const map: (read: (i: 0 | 1 | 2 | 3) => number) => ICubic = (read: (i: 0 | 1 | 2 | 3) => number): ICubic => [read(0), read(1), read(2), read(3)];
    const horizontal: ICubic = map((i: 0 | 1 | 2 | 3): number => controls[i]![0]);
    const share: ICubic = map((i: 0 | 1 | 2 | 3): number => (horizontal[i] - first[0]) / (last[0] - first[0]));
    const residual: ICubic = [0, controls[1]![1] - ((1 - share[1]) * first[1] + share[1] * last[1]), controls[2]![1] - ((1 - share[2]) * first[1] + share[2] * last[1]), 0];

    // Invert the source's strictly increasing horizontal cubic once. The
    // photo pupil is (u,v)=(0,0), whose full affine image is shared below.
    let lo: number = 0;
    let hi: number = 1;
    for (let i: number = 0; i < 60; i++) { const mid: number = (lo + hi) / 2; if (bernstein(horizontal, mid) < 0) lo = mid; else hi = mid; }
    const pupil: number = (lo + hi) / 2;
    const pupilShare: number = -first[0] / (last[0] - first[0]);
    const photoUpper: number = bernstein(map((i: 0 | 1 | 2 | 3): number => controls[i]![1]), pupil);
    const chordPupil: number = (1 - pupilShare) * first[1] + pupilShare * last[1];
    const ratio: number = 5.2 / 3.5;
    const lowerControl: number = (chordPupil + photoUpper * ratio) / (3 * pupil * (1 - pupil));
    const lower: ICubic = [0, lowerControl, lowerControl, 0];
    const knots: readonly number[] = [0, pupil, 1];
    const commonNasalY: number = plan.eye - ((plan.left.length + plan.right.length) / 4) * Math.sin(tilt);
    return (["left", "right"] as const).map((side: "left" | "right"): { part: IAutoMovieViewPart; pupil: [number, number, number] } => {
      const eye: IAutoMovieHumanHeadEyeOpening = plan[side];
      const sign: 1 | -1 = side === "left" ? 1 : -1;
      const span: number = eye.length * Math.cos(tilt);
      const rise: number = eye.length * Math.sin(tilt);
      const scale: number = eye.height / (photoUpper * (1 + ratio));
      const chord: ICubic = map((i: 0 | 1 | 2 | 3): number => commonNasalY + (1 - share[i]) * rise);
      const upper: ICubic = map((i: 0 | 1 | 2 | 3): number => chord[i] + scale * residual[i]);
      const below: ICubic = map((i: 0 | 1 | 2 | 3): number => chord[i] - scale * lower[i]);
      const half: ICubic = [0, (upper[1] - below[1]) / 2, (upper[2] - below[2]) / 2, 0];
      const origin: IOrigin = {
        x: curve([seat, seat, seat, seat], knots, side, eye.length),
        y: curve(map((i: 0 | 1 | 2 | 3): number => (upper[i] + below[i]) / 2), knots, side, eye.length),
        z: curve(map((i: 0 | 1 | 2 | 3): number => sign * (eye.inner + (1 - share[i]) * span)), knots, side, eye.length),
      };
      const depth: number = RADII[side][0] * plan.scale;
      const fractions: number[] = [...Array.from({ length: 33 }, (_: unknown, i: number): number => i / 32), pupil].sort((a: number, b: number): number => a - b);
      const stations: number[] = fractions.map((t: number): number => station(t, eye.length));

      // Keep the regular-site AP cutter allowance and exact pole zeros;
      // narrowing that allowance would conceal the separate conic defect.
      const allowance: (direction: 1 | -1) => IAutoMovieViewPart.IOutline = (direction: 1 | -1): IAutoMovieViewPart.IOutline => ({
        parameter: { type: "angle", bottom: 0, top: eye.length },
        knots: stations.map((s: number, i: number): IAutoMovieViewPart.IKnot => ({ site: `fissure.${side}.cutter.${i}`, station: s, value: i === 0 || i === stations.length - 1 ? 0 : direction * depth })),
      });
      const part: IAutoMovieViewPart = {
        name: `fissure.${side}`,
        axis: AutoMovieHumanHeadSourceAxis.of(origin, [0, 1, 0], [-sign, 0, 0]),
        stations,
        front: { positive: curve(half, knots, side, eye.length), negative: curve(map((i: 0 | 1 | 2 | 3): number => -half[i]), knots, side, eye.length) },
        side: { positive: allowance(1), negative: allowance(-1) },
        fullness: { kind: "shoulder", shoulder: { knots: [0, eye.length].map((station: number): IAutoMovieViewPart.IKnot => ({ site: "fissure.cutter", station, value: AutoMovieViewSection.ELLIPSE })) } },
        pole: "both", order: 32, samples: 128,
      };
      return { part, pupil: [seat, commonNasalY + (1 - pupilShare) * rise - scale * chordPupil, sign * (eye.inner + (1 - pupilShare) * span)] };
    });
  }

  /** Four source Bernstein controls, scalar values in calibration mm. */
  type ICubic = readonly [number, number, number, number];

  /** Fixed chart-coordinate records accepted by the engine source-axis owner. */
  type IOrigin = Parameters<typeof AutoMovieHumanHeadSourceAxis.of>[0];

  /** Evaluate authored controls only to publish source values; the engine owns every actual interpolated curve. */
  function bernstein(p: ICubic, t: number): number {
    return (1 - t) ** 3 * p[0] + 3 * (1 - t) ** 2 * t * p[1] + 3 * (1 - t) * t * t * p[2] + t ** 3 * p[3];
  }

  /**
   * The common angle parameter normalizes to the original Bezier t. Its
   * millimetre domain spans the public 3D chord length; it is neither world
   * Z nor arc length. Changing that domain never changes a world control.
   */
  function station(t: number, length: number): number {
    return t === 0 ? 0 : t === 1 ? length : length * Math.sin(Math.PI * t / 2) ** 2;
  }

  /**
   * Declare the cubic exactly with values and normalized first/second jets.
   * A common explicit angle parameter prevents radial pole admission from
   * changing the polynomial's parameter. The pupil knot is a named site,
   * not a refit; extra evaluation stations do not change any source span.
   */
  function curve(p: ICubic, sites: readonly number[], side: string, length: number): IAutoMovieViewPart.IOutline {
    return {
      parameter: { type: "angle", bottom: 0, top: length },
      knots: sites.map((t: number, i: number): IAutoMovieViewPart.IKnot => ({
        site: `fissure.${side}.${i === 0 ? "temporal" : i === sites.length - 1 ? "nasal" : "pupil"}`,
        station: station(t, length),
        value: bernstein(p, t),
        jet: {
          first: 3 * ((1 - t) ** 2 * (p[1] - p[0]) + 2 * (1 - t) * t * (p[2] - p[1]) + t * t * (p[3] - p[2])),
          second: 6 * ((1 - t) * (p[2] - 2 * p[1] + p[0]) + t * (p[3] - 2 * p[2] + p[1])),
        },
      })),
    };
  }
}
