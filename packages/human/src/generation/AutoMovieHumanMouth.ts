import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import { AutoMovieHumanMouthArch } from "./AutoMovieHumanMouthArch";
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

    /** Rest gap of the lips. */
    gap: number;

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
    const upperArch: AutoMovieHumanMouthArch.IArch = AutoMovieHumanMouthArch.arch(Prior.UPPER);
    const start: number = labial - Prior.UPPER[0]!.depth / 4;
    const teeth: ITooth[] = [
      ...AutoMovieHumanMouthArch.place(Prior.UPPER, upperArch, 0, start, edge, cant, "upper"),
      ...AutoMovieHumanMouthArch.place(
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
      // The lips meet at rest: the rim the slit leaves closes on the contact
      // line, its two sides a hair apart by place for the jaw's binding.
      seam: { contact: mouth.contact, width: mouth.width, closed: CLOSED },
    };
  }

  /** Samples of the contact line across the half width. */
  const SAMPLES: number = 16;

  /**
   * Station spacing the skin takes near an opening, mm: the finest station
   * pitch any head chain takes (`AutoMovieHumanHeadStationDensity`).
   */
  export const PITCH: number = 0.5;

  /** Highest harmonic of the slit's margin. */
  const ORDER: number = 128;

  /**
   * Distance each side of the closed rim keeps from the contact line, mm:
   * far under any skin edge, and over the float32 resolution of a head's
   * coordinates, so the two sides stay apart in every consumer.
   */
  export const CLOSED: number = 0.02;

  /** Depth tolerance of the slit's inside test, mm. */
  const DEPTH: number = 3;
}
