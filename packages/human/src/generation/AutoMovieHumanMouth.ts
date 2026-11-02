import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import { AutoMovieHumanMouthPrior as Prior } from "./AutoMovieHumanMouthPrior";

/**
 * The mouth of one person: the oral fissure the skin is opened along, and the
 * frame the teeth, the tongue and the cavity's lining stand in, all placed
 * from the head's own lips in calibration millimetres (forward +X, up +Y,
 * left +Z).
 *
 * Centres first. The lips' contact line, which the head construction draws,
 * is the fissure: a slit along it, a stadium in the face's plane from one
 * cheilion to the other whose half-height is the 0.5 mm station spacing the
 * skin takes near an opening, so no skin edge steps over it and its rim is
 * one loop. The lips meet at rest:
 * across the slit the lining's two inner faces come together at the contact
 * line, so no gap and no tooth shows until the lips part.
 * The upper incisors stand behind the upper lip by the lip's published
 * thickness, their edges below the lip by the published rest display; the
 * occlusal plane runs back from them at Downs' cant. Teeth take their crown
 * sizes from the dental table and stand side by side on the beta arch, the
 * lower arch inside the upper by the overjet. The cavity's lining runs from
 * the slit round the outside of the gums to the pharynx above the angles of
 * the jaw, and the tongue fills its floor inside the lower arch.
 *
 * Everything here is data, so the calibration that carries it can be cloned
 * and compared.
 */
export namespace AutoMovieHumanMouth {
  /** What the head hands the mouth. */
  export interface IInputs {
    /** Height of the stomion. */
    stomion: number;

    /** Half the mouth's width, midline to cheilion. */
    width: number;

    /** Upper vermilion height. */
    upper: number;

    /** Lower vermilion height. */
    lower: number;

    /** Height of the subnasale. */
    subnasale: number;

    /** Height of the menton. */
    menton: number;

    /** Masculine (-1) to feminine (1). */
    sex: number;

    /** Forward place of the mandible's angles, the gonia. */
    gonion: number;

    /** Height of the lips' contact line at a share of the half width from the midline. */
    contact(u: number): number;

    /** Forward coordinate of the skin at a height and a lateral place. */
    front(y: number, z: number): number;
  }

  /** One placed tooth. */
  export interface ITooth {
    /** Part name: `upper|lower.left|right.<tooth>`. */
    name: string;

    /** Crown's dimensions. */
    crown: Prior.ITooth;

    /** Jaw that carries it. */
    jaw: "upper" | "lower";

    /** Crown's centre at its cervical line, mm. */
    neck: [number, number, number];

    /** Unit direction from the cervical line to the incisal edge or cusps. */
    axis: [number, number, number];

    /** Unit direction along the arch, away from the midline. */
    along: [number, number, number];

    /** Unit direction across the arch, outward (labial or buccal). */
    out: [number, number, number];
  }

  /** One coronal section of the cavity's lining, an ellipse about a centre. */
  export interface ISection {
    /** Forward place of the section at the midline. */
    x: number;

    /** Height of its centre. */
    y: number;

    /** Half width. */
    width: number;

    /** Rise of its top over the centre. */
    up: number;

    /** Fall of its bottom under the centre. */
    down: number;

    /** Recession of its sides behind the midline, mm per squared share of the half width. */
    sweep: number;
  }

  /** The tongue at rest. */
  export interface ITongue {
    /** Forward place of the tip, behind the lower incisors. */
    tip: number;

    /** Forward place of the back, inside the pharynx. */
    back: number;

    /** Height of the tip's upper face. */
    tipTop: number;

    /** Height of the dorsum's top, over the molars. */
    dorsum: number;

    /** Height of the floor it rests on. */
    floor: number;

    /** Half width over the molars, inside the lower arch. */
    width: number;

    /** Forward place of the molars, where the dorsum is highest. */
    molars: number;
  }

  /** One person's mouth. */
  export interface IMouth {
    /** Stomion's height. */
    stomion: number;

    /** Half width, midline to cheilion. */
    width: number;

    /** Upper vermilion height. */
    upper: number;

    /** Lower vermilion height. */
    lower: number;

    /** Subnasale's height. */
    subnasale: number;

    /** Menton's height. */
    menton: number;

    /** Contact line's height at shares 0, 1/16 .. 1 of the half width. */
    contact: number[];

    /** Half-height of the slit at the midline. */
    slit: number;

    /** Forward place of the lips at the stomion on the midline. */
    front: number;

    /** Teeth, upper then lower, left then right, from the midline back. */
    teeth: ITooth[];

    /** Upper incisal edge at the midline, `[x, y]`. */
    edge: [number, number];

    /** Rise of the occlusal plane per millimetre backward. */
    cant: number;

    /** The lining's front wall, round the outside of the front teeth and gums. */
    vestibule: ISection;

    /** The lining's section over the first molars. */
    molars: ISection;

    /** The lining's section at the oropharynx, round the tongue's base. */
    oropharynx: ISection;

    /** The pharynx's back wall, where the lining closes behind the oropharynx, `[x, y]`. */
    pharynx: [number, number];

    /** Alveolar ridge behind the upper incisors, where a tip touches for /t/, `[x, y]`. */
    ridge: [number, number];

    /** Palate's vault over the molars, `[x, y]`. */
    palate: [number, number];

    /** Tongue at rest. */
    tongue: ITongue;
  }

  /** Mouth and the fissure cut into the skin. */
  export interface IOutput {
    /** The mouth. */
    mouth: IMouth;

    /** The slit along the contact line, cut by position like the nostrils. */
    aperture: IAutoMovieHumanLoftAperture;
  }

  /** Place the mouth from the head. */
  export function create(inputs: IInputs): IOutput {
    const contact: number[] = Array.from(
      { length: SAMPLES + 1 },
      (_: unknown, i: number): number => inputs.contact(i / SAMPLES),
    );
    // The lips meet at rest, so the slit carries no gap of its own; the
    // lining's inner faces close it. It is one 0.5 mm station tall on each
    // side of the contact line: half that, a vertex the cut snaps onto the
    // outline from above lay within reach of the lower rim too, and the rim
    // crossed itself.
    const slit: number = PITCH;
    const front: number = inputs.front(inputs.stomion, 0);
    const labrale: number = inputs.front(inputs.stomion + inputs.upper / 2, 0);

    // The upper incisors' labial faces stand the lip's thickness behind its
    // front, their edges the rest display below it.
    const share: number = (1 + Math.max(-1, Math.min(1, inputs.sex))) / 2;
    const display: number =
      Prior.DISPLAY_MASCULINE + share * (Prior.DISPLAY_FEMININE - Prior.DISPLAY_MASCULINE);
    const cant: number = Math.tan((Prior.OCCLUSAL_CANT * Math.PI) / 180);
    const labial: number = labrale - Prior.LIP_THICKNESS;
    const edge: [number, number] = [labial, inputs.stomion - display];

    // The cusp line runs a quarter of each crown's depth inside its labial or
    // buccal face; the upper's passes through the central incisors' edges.
    const upperArch: IArch = arch(Prior.UPPER);
    const start: number = labial - Prior.UPPER[0]!.depth / 4;
    const teeth: ITooth[] = [
      ...place(Prior.UPPER, upperArch, 0, start, edge, cant, "upper"),
      ...place(
        Prior.LOWER,
        upperArch,
        Prior.OVERJET,
        start,
        edge,
        cant,
        "lower",
      ),
    ];

    // The front wall wraps the canines' outer faces and the gums over the
    // incisors' necks; the molar section wraps the first molars and rises to
    // the palate's vault.
    const at = (jaw: string, side: string, tooth: string): ITooth =>
      teeth.find((t: ITooth): boolean => t.name === `${jaw}.${side}.${tooth}`)!;
    const canine: ITooth = at("upper", "left", "canine");
    const molar: ITooth = at("upper", "left", "firstMolar");
    const lowerMolar: ITooth = at("lower", "left", "firstMolar");
    const lowerIncisor: ITooth = at("lower", "left", "centralIncisor");
    const upperIncisor: ITooth = at("upper", "left", "centralIncisor");
    const outer = (t: ITooth): number => t.neck[2] + (t.out[2] * t.crown.depth) / 2;
    const upperReach: number = Prior.UPPER[0]!.height + Prior.GINGIVA + Prior.MUCOSA;
    const lowerReach: number =
      Prior.LOWER[0]!.height - Prior.OVERBITE + Prior.GINGIVA + Prior.MUCOSA;
    const centre: number = edge[1] + Prior.OVERBITE / 2;
    const vestibuleX: number = labial + Prior.MUCOSA;
    const vestibuleWidth: number = outer(canine) + Prior.MUCOSA;
    const vestibule: ISection = {
      x: vestibuleX,
      y: centre,
      width: vestibuleWidth,
      up: upperReach,
      down: lowerReach,
      sweep: vestibuleX - (canine.neck[0] + Prior.MUCOSA),
    };
    const molarY: number = centre + cant * (edge[0] - molar.neck[0]);
    const floor: number = (inputs.stomion - inputs.menton) / 2;
    const molars: ISection = {
      x: molar.neck[0],
      y: molarY,
      width: outer(molar) + Prior.MUCOSA,
      up: Prior.UPPER[5]!.height + Prior.PALATE + Prior.MUCOSA,
      down: floor,
      sweep: 0,
    };
    const pharynx: [number, number] = [
      inputs.gonion,
      molarY + cant * (molar.neck[0] - inputs.gonion) - floor / 2,
    ];

    // The tongue rests behind the lower incisors and fills the floor inside the
    // lower arch, its dorsum under the palate.
    const lingual: number =
      lowerMolar.neck[2] - (lowerMolar.out[2] * lowerMolar.crown.depth) / 2;
    const lowerEdge: number = lowerIncisor.neck[1] + lowerIncisor.crown.height;
    const tongue: ITongue = {
      tip:
        lowerIncisor.neck[0] -
        lowerIncisor.crown.depth / 2 -
        Prior.MUCOSA,
      back: pharynx[0] + Prior.MUCOSA,
      tipTop: lowerEdge - Prior.MUCOSA,
      // At rest the dorsum lies just under the palate, a lining's thickness
      // on each.
      dorsum: molarY + molars.up - 3 * Prior.MUCOSA,
      floor: molarY - floor + Prior.MUCOSA,
      width: lingual - Prior.MUCOSA / 2,
      molars: lowerMolar.neck[0],
    };
    // The oropharynx holds the tongue's base: its section is the tongue's at
    // the back with a lining's thickness all round, so the lining that closes
    // behind it never passes through the tongue. A lining drawn to one point
    // at the pharynx cut through a third of the resting tongue.
    const occlusalBack: number = molarY + cant * (molar.neck[0] - pharynx[0]);
    const oropharynx: ISection = {
      x: pharynx[0],
      y: occlusalBack,
      width: tongue.width + 2 * Prior.MUCOSA,
      up: (tongue.dorsum + tongue.floor) / 2 - occlusalBack + 2 * Prior.MUCOSA,
      down: occlusalBack - tongue.floor + 2 * Prior.MUCOSA,
      sweep: 0,
    };
    const mouth: IMouth = {
      stomion: inputs.stomion,
      width: inputs.width,
      upper: inputs.upper,
      lower: inputs.lower,
      subnasale: inputs.subnasale,
      menton: inputs.menton,
      contact,
      slit,
      front,
      teeth,
      edge,
      cant,
      vestibule,
      molars,
      oropharynx,
      pharynx: [pharynx[0] - 2 * Prior.MUCOSA, occlusalBack],
      ridge: [
        upperIncisor.neck[0] - upperIncisor.crown.depth,
        upperIncisor.neck[1] - Prior.MUCOSA,
      ],
      palate: [molar.neck[0], molars.y + molars.up - Prior.MUCOSA],
      tongue,
    };
    return { mouth, aperture: aperture(mouth, inputs) };
  }

  /** Height of the contact line at a lateral place, flat beyond the cheilia. */
  export function contactAt(mouth: IMouth, z: number): number {
    const u: number = Math.min(1, Math.abs(z) / mouth.width) * SAMPLES;
    const i: number = Math.min(SAMPLES - 1, Math.floor(u));
    const f: number = u - i;
    return mouth.contact[i]! * (1 - f) + mouth.contact[i + 1]! * f;
  }

  /** Half-height of the slit at a lateral place: whole, then a half circle at each cheilion. */
  export function slitAt(mouth: IMouth, z: number): number {
    const over: number = Math.abs(z) - (mouth.width - mouth.slit);
    if (over <= 0) return mouth.slit;
    return over >= mouth.slit ? 0 : Math.sqrt(mouth.slit * mouth.slit - over * over);
  }

  /** Forward place of a section's wall at a lateral share. */
  export function sweepAt(section: ISection, share: number): number {
    return section.x - section.sweep * share * share;
  }

  /**
   * The slit as a Fourier margin facing forward: a stadium about the contact
   * line, as tall as the slit from end to end and closed by half circles at
   * the cheilia, walked by its length. An ellipse thinned toward the cheilia
   * below one station's height, and there the skin's edges stepped over it
   * whole: on f2 the skin bridged it 6 mm from each corner and the rim fell
   * into three loops. The stadium's curvature jumps only where its circles
   * meet its sides, so the series converges as the cube of its order.
   */
  function aperture(mouth: IMouth, inputs: IInputs): IAutoMovieHumanLoftAperture {
    const count: number = 4 * ORDER;
    const g: number = mouth.slit;
    const straight: number = mouth.width - g;
    const length: number = 4 * straight + 2 * Math.PI * g;
    const points: [number, number, number][] = Array.from(
      { length: count },
      (_: unknown, i: number): [number, number, number] => {
        // From the left cheilion up, along the upper side, round the right
        // cheilion and back along the lower side.
        let s: number = (length * i) / count;
        let z: number;
        let up: number;
        const arc = (centre: number, from: number): void => {
          const phi: number = from + s / g;
          z = centre + g * Math.cos(phi);
          up = g * Math.sin(phi);
        };
        if (s < (Math.PI / 2) * g) arc(straight, 0);
        else if ((s -= (Math.PI / 2) * g) < 2 * straight) {
          z = straight - s;
          up = g;
        } else if ((s -= 2 * straight) < Math.PI * g) arc(-straight, Math.PI / 2);
        else if ((s -= Math.PI * g) < 2 * straight) {
          z = -straight + s;
          up = -g;
        } else {
          s -= 2 * straight;
          arc(straight, (3 * Math.PI) / 2);
        }
        const y: number = contactAt(mouth, z!) + up!;
        return [inputs.front(y, z!), y, z!];
      },
    );
    const coefficients: number[] = [0, 1, 2].flatMap((c: number): number[] => {
      const out: number[] = [
        points.reduce((v: number, p: [number, number, number]): number => v + p[c]!, 0) /
          count,
      ];
      for (let k: number = 1; k <= ORDER; k++) {
        let a: number = 0;
        let b: number = 0;
        points.forEach((p: [number, number, number], i: number): void => {
          const t: number = (2 * Math.PI * k * i) / count;
          a += (2 * p[c]! * Math.cos(t)) / count;
          b += (2 * p[c]! * Math.sin(t)) / count;
        });
        out.push(a, b);
      }
      return out;
    });
    return {
      name: "mouth",
      order: ORDER,
      coefficients,
      forward: [1, 0, 0],
      depth: DEPTH,
    };
  }

  /** A beta arch fitted to one quadrant's teeth. */
  interface IArch {
    /** Full width between the arch's ends. */
    width: number;

    /** Depth from the ends' line to the front. */
    depth: number;
  }

  /** Point of the beta arch in plan at a lateral place: `[lateral, depth]`. */
  function beta(a: IArch, lateral: number): number {
    const s: number = lateral / a.width;
    const q: number = Math.max(0, (0.5 + s) * (0.5 - s));
    return BETA * a.depth * q ** Prior.ARCH_POWER;
  }

  /** A place on an arch in plan: lateral, depth forward of the ends' line, unit tangent and outward normal. */
  interface IStep {
    lateral: number;
    depth: number;
    along: [number, number];
    out: [number, number];
  }

  /**
   * The place an arc length from the midline along the curve parallel to an
   * arch, inset toward its inside; the arch's own curve for no inset. Walked
   * in fine chords, since the beta arch has no closed arc length.
   */
  function walk(a: IArch, length: number, inset: number = 0): IStep {
    const steps: number = 2000;
    const half: number = a.width / 2;
    const at = (lateral: number): IStep => {
      const h: number = half / steps;
      const l0: number = Math.max(0, lateral - h);
      const l1: number = Math.min(half, lateral + h);
      const dl: number = l1 - l0;
      const dd: number = beta(a, l1) - beta(a, l0);
      const n: number = Math.hypot(dl, dd) || 1;
      const along: [number, number] = [dl / n, dd / n];
      // The arch is convex toward the front, so outward is the tangent turned
      // toward the front and the side.
      const out: [number, number] = [-along[1], along[0]];
      return {
        lateral: lateral - inset * out[0],
        depth: beta(a, lateral) - inset * out[1],
        along,
        out,
      };
    };
    let travelled: number = 0;
    let previous: IStep = at(0);
    for (let i: number = 1; i <= steps; i++) {
      const point: IStep = at((half * i) / steps);
      const d: number = Math.hypot(
        point.lateral - previous.lateral,
        point.depth - previous.depth,
      );
      if (travelled + d >= length || i === steps) {
        const f: number = d > 0 ? Math.min(1, (length - travelled) / d) : 0;
        return {
          lateral: previous.lateral + f * (point.lateral - previous.lateral),
          depth: previous.depth + f * (point.depth - previous.depth),
          along: point.along,
          out: point.out,
        };
      }
      travelled += d;
      previous = point;
    }
    throw new Error("Unreachable arch walk");
  }

  /** Half arc length of an arch. */
  function halfLength(a: IArch): number {
    let travelled: number = 0;
    let previous: [number, number] = [0, beta(a, 0)];
    const steps: number = 2000;
    for (let i: number = 1; i <= steps; i++) {
      const lateral: number = (a.width / 2) * (i / steps);
      const point: [number, number] = [lateral, beta(a, lateral)];
      travelled += Math.hypot(point[0] - previous[0], point[1] - previous[1]);
      previous = point;
    }
    return travelled;
  }

  /**
   * The upper arch: its half length is the quadrant's crown widths, and its
   * first molars' mesiobuccal cusps, a quarter of the molar past its mesial
   * face, stand the adult intermolar width apart. Two conditions fix width
   * and depth; both are monotone in the depth over width, so nested
   * bisection finds them.
   */
  function arch(teeth: readonly Prior.ITooth[]): IArch {
    const total: number = teeth.reduce((s: number, t: Prior.ITooth): number => s + t.width, 0);
    const cusp: number =
      teeth.slice(0, 5).reduce((s: number, t: Prior.ITooth): number => s + t.width, 0) +
      teeth[5]!.width / 4;
    const sized = (ratio: number): IArch => {
      let lo: number = 1;
      let hi: number = 4 * total;
      for (let k: number = 0; k < 60; k++) {
        const w: number = (lo + hi) / 2;
        if (halfLength({ width: w, depth: ratio * w }) < total) lo = w;
        else hi = w;
      }
      const w: number = (lo + hi) / 2;
      return { width: w, depth: ratio * w };
    };
    let lo: number = 0.1;
    let hi: number = 2;
    for (let k: number = 0; k < 60; k++) {
      const r: number = (lo + hi) / 2;
      // A deeper arch for the same length is narrower at the molars.
      if (walk(sized(r), cusp).lateral * 2 > Prior.INTERMOLAR) lo = r;
      else hi = r;
    }
    return sized((lo + hi) / 2);
  }

  /** Teeth of one jaw, both sides, on the upper arch inset by an offset. */
  function place(
    crowns: readonly Prior.ITooth[],
    upper: IArch,
    inset: number,
    start: number,
    edge: [number, number],
    cant: number,
    jaw: "upper" | "lower",
  ): ITooth[] {
    const out: ITooth[] = [];
    const front: number = beta(upper, 0);
    for (const side of [1, -1] as const) {
      let length: number = 0;
      crowns.forEach((crown: Prior.ITooth): void => {
        // The lower cusp line is the upper's moved inward by the overjet, and
        // its teeth stand side by side along it from the midline. A crown's
        // centre lies a quarter of its depth inside the cusp line.
        const centre: IStep = walk(upper, length + crown.width / 2, inset);
        length += crown.width;
        const inside: number = crown.depth / 4;
        const lateral: number = centre.lateral - centre.out[0] * inside;
        const depth: number = centre.depth - centre.out[1] * inside;
        const x: number = start - (front - depth);
        // Upper tips sit on the occlusal plane through the incisal edge; lower
        // incisors overlap them by the overbite, fading to cusps meeting at
        // the premolars and molars.
        const overlap: number =
          crown.kind === "incisor" ? 1 : crown.kind === "canine" ? 0.5 : 0;
        const tip: number = edge[1] + cant * (edge[0] - x) + (jaw === "lower" ? Prior.OVERBITE * overlap : 0);
        const neck: number = jaw === "upper" ? tip + crown.height : tip - crown.height;
        out.push({
          name: `${jaw}.${side > 0 ? "left" : "right"}.${crown.name}`,
          crown,
          jaw,
          neck: [x, neck, side * lateral],
          axis: jaw === "upper" ? [0, -1, 0] : [0, 1, 0],
          along: unit([centre.along[1], 0, side * centre.along[0]]),
          out: unit([centre.out[1], 0, side * centre.out[0]]),
        });
      });
    }
    return out;
  }

  function unit(v: [number, number, number]): [number, number, number] {
    const l: number = Math.hypot(...v) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  }

  /** Samples of the contact line across the half width. */
  const SAMPLES: number = 16;

  /** Station spacing the skin takes near an opening, mm. */
  const PITCH: number = 0.5;

  /** Highest harmonic of the slit's margin. */
  const ORDER: number = 128;

  /** Depth tolerance of the slit's inside test, mm. */
  const DEPTH: number = 3;

  /** Normalisation of the beta arch, so its front lies at its depth (Braun et al. 1998). */
  const BETA: number = 3.0314;
}
