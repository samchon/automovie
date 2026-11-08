/**
 * Anatomical order relations that hold for any adult, read on a finished
 * figure's measurements, profiles and sections, whatever parameters made it:
 * girths ordered along the limbs and trunk, landmark heights ordered up the
 * body, one maximum per muscle belly, a monotone taper between adjacent
 * landmarks, an extremum at its anatomical site, the axis inside its own
 * section, and left and right as mirror images.
 */
export namespace HumanInspectionAnatomyOrder {
  /** One relation: the first measure must be smaller than the second. */
  export interface IRelation {
    /** The smaller measure's name. */
    smaller: string;

    /** The larger measure's name. */
    larger: string;

    /** "definition" when the anatomy fixes the order; "population" when every surveyed adult keeps it by a wide margin. */
    strength: "definition" | "population";

    /** The source of the order. */
    basis: string;
  }

  /** One violated relation or profile rule. */
  export interface IFinding {
    /** The rule, e.g. "wristCircumference < forearmCircumference" or "one belly: calf". */
    rule: string;

    /** The reading that breaks it. */
    detail: string;
  }

  /**
   * Girths ordered along the limbs and trunk (ANSUR 1988 and ANSUR II per-sex
   * means and SDs, quoted in `IAutoMovieHumanBodyAnatomy`; each margin is
   * several SD in both sexes).
   */
  export const GIRTHS: readonly IRelation[] = [
    { smaller: "wristCircumference", larger: "forearmCircumference", strength: "population", basis: "ANSUR II wrist 154.8/175.9 mm against Heinz 2003 forearm 237.6/282.4 mm (women/men)" },
    { smaller: "ankleCircumference", larger: "calfCircumference", strength: "population", basis: "ANSUR II ankle 215.7/229.3 mm against calf 373.3/392.3 mm" },
    { smaller: "kneeCircumference", larger: "thighCircumference", strength: "population", basis: "ANSUR 1988 knee 365.2/386.4 mm against thigh 580.3/596.5 mm" },
    { smaller: "lowerThighCircumference", larger: "thighCircumference", strength: "population", basis: "ANSUR II lower thigh 400.7/409.3 mm against ANSUR 1988 thigh 580.3/596.5 mm" },
    { smaller: "neckCircumference", larger: "neckBaseCircumference", strength: "definition", basis: "ISO 8559-1: the neck girth is taken above the neck base, where the neck widens into the trunk" },
    { smaller: "underbustCircumference", larger: "chestCircumference", strength: "population", basis: "ANSUR 1988 underbust 769.7/926.1 mm against chest 907.1/991.4 mm" },
    { smaller: "wristBreadth", larger: "elbowBreadth", strength: "population", basis: "Heinz 2003 wrist 49.4/56.3 mm against elbow 61.9/72.3 mm bone breadths" },
    { smaller: "bimalleolarBreadth", larger: "kneeBreadth", strength: "population", basis: "ANSUR 1988 bimalleolar 64.4/72.8 mm against Heinz 2003 knee 90.5/97.8 mm" },
  ];

  /** Landmark heights ordered up the standing body (ISO 7250-1 definitions; ANSUR means quoted in `IAutoMovieHumanBodyAnatomy`). */
  export const HEIGHTS: readonly IRelation[] = [
    { smaller: "midpatellaHeight", larger: "glutealFurrowHeight", strength: "definition", basis: "the knee stands below the buttock fold" },
    { smaller: "glutealFurrowHeight", larger: "waistHeight", strength: "definition", basis: "the buttock fold stands below the natural waist" },
    { smaller: "waistHeight", larger: "axillaHeight", strength: "definition", basis: "the natural waist stands below the armpit" },
    { smaller: "axillaHeight", larger: "suprasternaleHeight", strength: "definition", basis: "the armpit stands below the jugular notch" },
    { smaller: "axillaHeight", larger: "acromialHeight", strength: "definition", basis: "the armpit stands below the shoulder's acromion" },
    { smaller: "suprasternaleHeight", larger: "cervicaleHeight", strength: "definition", basis: "the jugular notch stands below the vertebra prominens" },
    { smaller: "acromialHeight", larger: "cervicaleHeight", strength: "population", basis: "ANSUR II acromion 1335.1/1440.7 mm against cervicale 1395.7/1517.3 mm" },
    { smaller: "cervicaleHeight", larger: "stature", strength: "definition", basis: "the vertebra prominens stands below the vertex" },
  ];

  /**
   * Every relation the measurements break: the smaller measure not below the
   * larger. A relation whose measure is absent is skipped.
   *
   * @param measures The figure's measurements by name, read on its finished curves or skin.
   * @param relations The relations to hold.
   */
  export function order(measures: Readonly<Record<string, number>>, relations: readonly IRelation[]): IFinding[] {
    const out: IFinding[] = [];
    for (const r of relations) {
      const a: number | undefined = measures[r.smaller];
      const b: number | undefined = measures[r.larger];
      if (a === undefined || b === undefined) continue;
      if (!(a < b)) out.push({ rule: `${r.smaller} < ${r.larger}`, detail: `${a} is not below ${b} (${r.basis})` });
    }
    return out;
  }

  /**
   * One maximum per muscle belly: the profile (a girth or depth sampled at
   * increasing stations over the belly's span) rises to a single maximum and
   * falls; two local maxima are two bellies.
   *
   * @param name The belly's name.
   * @param values The profile's values in station order.
   * @param tolerance A dip smaller than this between two maxima is not counted.
   */
  export function belly(name: string, values: readonly number[], tolerance: number): IFinding[] {
    let rising: boolean = true;
    let peak: number = -Infinity;
    let peaks: number = 0;
    let trough: number = Infinity;
    for (const v of values) {
      if (rising) {
        if (v > peak) peak = v;
        else if (v < peak - tolerance) {
          peaks += 1;
          rising = false;
          trough = v;
        }
      } else if (v < trough) trough = v;
      else if (v > trough + tolerance) {
        rising = true;
        peak = v;
      }
    }
    if (rising && peak > -Infinity) peaks += 1;
    return peaks <= 1 ? [] : [{ rule: `one belly: ${name}`, detail: `${peaks} maxima` }];
  }

  /**
   * A monotone taper between adjacent landmarks: every step of the profile
   * goes the declared way.
   *
   * @param name The span's name.
   * @param values The profile's values in station order.
   * @param direction -1 when it must narrow along the stations, 1 when it must widen.
   */
  export function taper(name: string, values: readonly number[], direction: 1 | -1): IFinding[] {
    const out: IFinding[] = [];
    for (let i: number = 1; i < values.length; ++i)
      if (!(direction * (values[i]! - values[i - 1]!) >= 0)) out.push({ rule: `taper: ${name}`, detail: `step ${i} goes from ${values[i - 1]} to ${values[i]}` });
    return out;
  }

  /**
   * An extremum at its anatomical site: the profile's least (or greatest)
   * value stands within the tolerance of the site's station, such as the
   * narrowest wrist at stylion or the calf's greatest girth at its height.
   *
   * @param name The rule's name.
   * @param stations The profile's stations.
   * @param values The profile's values.
   * @param site The anatomical site's station.
   * @param tolerance The admitted distance, station units.
   * @param kind "min" or "max".
   */
  export function extremum(name: string, stations: readonly number[], values: readonly number[], site: number, tolerance: number, kind: "min" | "max"): IFinding[] {
    let best: number = 0;
    for (let i: number = 1; i < values.length; ++i) if (kind === "min" ? values[i]! < values[best]! : values[i]! > values[best]!) best = i;
    const at: number = stations[best]!;
    return Math.abs(at - site) <= tolerance ? [] : [{ rule: `${kind} at its site: ${name}`, detail: `the ${kind} stands at ${at}, the site at ${site}` }];
  }

  /**
   * The bone's axis inside its own skin section: the axis point lies inside
   * the closed section (nonzero winding number).
   *
   * @param name The section's name.
   * @param section The section's points in its plane, closed implicitly.
   * @param axis The axis point in the same plane.
   */
  export function inside(name: string, section: readonly (readonly [number, number])[], axis: readonly [number, number]): IFinding[] {
    let winding: number = 0;
    for (let i: number = 0; i < section.length; ++i) {
      const a: readonly [number, number] = section[i]!;
      const b: readonly [number, number] = section[(i + 1) % section.length]!;
      const side: number = (b[0] - a[0]) * (axis[1] - a[1]) - (axis[0] - a[0]) * (b[1] - a[1]);
      if (a[1] <= axis[1]) {
        if (b[1] > axis[1] && side > 0) winding += 1;
      } else if (b[1] <= axis[1] && side < 0) winding -= 1;
    }
    return winding !== 0 ? [] : [{ rule: `axis inside: ${name}`, detail: `the axis (${axis[0]}, ${axis[1]}) lies outside its section` }];
  }

  /**
   * Left and right as mirror images across the median plane `z = 0`: each
   * left point and its right partner reflected agree within the tolerance.
   *
   * @param pairs Named left and right points.
   * @param tolerance Admitted distance, the points' units.
   */
  export function mirror(pairs: readonly { name: string; left: readonly [number, number, number]; right: readonly [number, number, number] }[], tolerance: number): IFinding[] {
    const out: IFinding[] = [];
    for (const p of pairs) {
      const d: number = Math.hypot(p.left[0] - p.right[0], p.left[1] - p.right[1], p.left[2] + p.right[2]);
      if (!(d <= tolerance)) out.push({ rule: `mirror: ${p.name}`, detail: `left and reflected right differ by ${d}` });
    }
    return out;
  }
}
