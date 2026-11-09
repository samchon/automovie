import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import { AutoMovieHumanTrunkComposedSection } from "./AutoMovieHumanTrunkComposedSection";
import type { AutoMovieHumanTrunkMound } from "./AutoMovieHumanTrunkMound";
import type { AutoMovieHumanTrunkSegmentFrames } from "./AutoMovieHumanTrunkSegmentFrames";
import { AutoMovieHumanTrunkViewScalar } from "./AutoMovieHumanTrunkViewScalar";

/**
 * The mounds S00 composes into its chain as reliefs, placed on the wall they
 * sit on (the draft source without reliefs):
 *
 * - Breasts: each apex at half the bust point width from the midline, at the
 *   bust height, standing the projection P out from the wall along the
 *   wall's radial (the phase is the fixed point of `(wall + P) sin(phase) =
 *   half width`); the footprint from the second rib (the sternal angle, a
 *   third of IJ-PX below IJ: debt) to the inframammary fold, whose drop below
 *   the apex makes the lower pole a quarter ellipse of P and that drop as
 *   long as the published nipple-to-fold skin length (6.8 cm, young
 *   nulliparous women, Springer Eur J Plast Surg 2023, s00238-023-02134-5),
 *   and transversely half the base width ({@link BREAST_BASE}) to either
 *   side of the apex, kept 10 mm off the midline, so the two mounds stand
 *   apart over the sternum; the upper extent is at most that half width, so
 *   the footprint's upper half is round (a taller upper extent drew a ridge
 *   from the clavicle down to the apex).
 * - Buttocks: each apex at the buttock level, the ANSUR buttock depth behind
 *   the body's most anterior point there (ANSUR's buttock depth ends at the
 *   buttocks' most posterior point, which is each buttock's apex, lateral of
 *   the midline), a quarter of the hip breadth from the midline (debt: no
 *   published gluteal apex offset read); the footprint from the iliac crest
 *   (gluteus maximus origin, Gray) to the gluteal fold (ANSUR gluteal furrow
 *   height), the midline to the lateral guide. The wall's back midline at the
 *   buttock level stands {@link CLEFT_DEPTH} ahead of the apices
 *   (`AutoMovieHumanTrunkViewCurves`), so the buttocks carry the projection
 *   and the intergluteal cleft is the valley between them.
 * - Thigh-root fronts: each apex at the crotch over the hip centre's Z, the
 *   thigh circumference's radius ahead of the hip centre (ANSUR 1988), its
 *   footprint up to the hip centres' height (declared).
 *
 * Tried 2026-11-08 and removed: supraclavicular hollows over the neck band's
 * whole front quarter (at their 30 mm bound the neck-base tape still read
 * 391.3 against 356.2, the SCM line was carved 27 mm deep, and the solve
 * made S00's curves take 22.8 s), and the cleft as a negative relief cut into
 * the flat seat (it read as a slot: the buttocks projected 3.8 mm).
 */
export namespace AutoMovieHumanTrunkViewMounds {
  /** What the mounds are placed from. */
  export interface IInputs {
    /** The trunk frames. */
    frames: AutoMovieHumanTrunkSegmentFrames.IOutput;

    /** Resolved measures. */
    measures: IAutoMovieHumanBodyMeasures;

    /** World X of the section course. */
    xs: number;

    /** World X of the hip centres. */
    hipX: number;

    /** S00's bottom (crotch) station, mm. */
    bottom: number;

    /** Bust (apex) height, mm. */
    apexY: number;

    /** The breasts' projection, mm. */
    breastP: number;

    /** Sternal angle height (the breasts' upper footprint), mm. */
    sternalAngle: number;

    /** Buttock level, mm. */
    buttockY: number;

    /** Iliocristale height, mm. */
    crestY: number;

    /** World X of the anterior midline at a height. */
    xf: (y: number) => number;

    /**
     * The spinal groove on the back midline (a hollow, the engine relief's
     * negative projection): its deepest height (world mm), its upper and lower
     * half extents (mm of height), its half width (mm of wall arc each side)
     * and its depth (mm). The posterior outline then stands at the paraspinal
     * muscles' and scapulae's extreme, and the groove carves the midline back
     * to the spinous line. Absent, no groove.
     */
    groove?: { station: number; up: number; down: number; half: number; depth: number } | readonly { station: number; up: number; down: number; half: number; depth: number }[];

    /**
     * Paired surface reliefs over a bone (the scapulae on the back, the
     * clavicles on the front): the apex height (world mm), its distance from
     * the midline (mm), the footprint's half extents (up and down in mm of
     * height, medial and lateral in mm of wall arc) and the projection (mm).
     * The apex phase is where that distance meets the posterior (back) or
     * anterior (front) outline's side of the section. Absent, none.
     */
    bones?: { name: string; side: "front" | "back"; station: number; z: number; up: number; down: number; medial: number; lateral: number; projection: number }[];

    /**
     * The inframammary fold's height (world mm): the breasts' lower extent
     * ends there and their lower half keeps the upper half's profile. Absent,
     * the published nipple-to-fold skin length sets the lower extent with the
     * fuller lower pole.
     */
    fold?: number;

    /**
     * The lower intergluteal cleft (a hollow on the back midline, deepest at
     * its station and fading upward): its station (world mm, at the open
     * bottom), its upper and lower half extents (mm of height), its half
     * width (mm of wall arc each side) and its depth (mm). Absent, none.
     */
    cleft?: { station: number; up: number; down: number; half: number; depth: number };

    /**
     * The buttocks' medial footprint stops this far (mm of wall arc) short of
     * the back midline, so their reliefs leave the intergluteal cleft's floor
     * on the wall's midline. Absent, they reach the midline.
     */
    buttockGap?: number;

    /** The breasts' authored footprint half extents from the apex (up in mm of height, medial and lateral in mm of wall arc). Absent, half the published base width, capped by the sternal angle and the arc. */
    breastBase?: { up: number; medial: number; lateral: number; lower?: number };

    /** The breast apex's distance from the midline, mm. Absent, half the bust point width. */
    apexHalf?: number;

    /**
     * Height tables read from the person's own sections over this wall
     * (`AutoMovieHumanTrunkF1Traced`), traced as the mounds' heights in place
     * of their profile laws: the breasts (with the upper chest and the
     * shoulder bar's front), the thigh roots' fronts and the buttocks at their
     * placed apices, and the spinal groove on the back midline at its own
     * station. Absent, the laws.
     */
    tables?: ITables;

    /** The tilted open bottom's tilt, radians (`AutoMovieHumanTrunkNeckTurn.IFloor.theta`): the traced thigh-root and buttock tables, which reach the open end, move in that plane. Absent, horizontally. */
    tilt?: number;
  }

  /** The traced height tables by mound. */
  export interface ITables {
    /** Each breast, at its placed apex. */
    breast?: ITable;

    /** Each thigh root's front, at its placed apex on the open bottom. */
    thigh?: ITable;

    /** Each buttock, at its placed apex. */
    buttock?: ITable;

    /** The spinal groove on the back midline, at its own station (world mm). */
    groove?: ITable & { station: number };
  }

  /** A height table over the wall. */
  export interface ITable {
    /** Row offsets, mm of height from the apex, increasing. */
    v: number[];

    /** Column offsets, mm of wall arc from the apex phase, positive lateral, increasing. */
    a: number[];

    /** Heights along the mound's axis, mm, `h[row][column]`. */
    h: number[][];
  }

  /** A traced mound's spec: its footprint is the table's extent and its projection records the table at the apex. */
  function traced(name: string, station: number, phase: number, radius: number, lateral: 1 | -1, table: ITable, axis?: [number, number, number]): AutoMovieHumanTrunkMound.ISpec {
    const nearest = (axis: number[]): number => axis.reduce((best: number, x: number, i: number): number => (Math.abs(x) < Math.abs(axis[best]!) ? i : best), 0);
    return {
      name,
      station,
      phase,
      radius,
      projection: table.h[nearest(table.v)]![nearest(table.a)]!,
      extents: { up: table.v[table.v.length - 1]!, down: -table.v[0]!, medial: -table.a[0]!, lateral: table.a[table.a.length - 1]! },
      lateral,
      table,
      ...(axis === undefined ? {} : { axis }),
    };
  }

  /** The direction at a phase in a plane tilted front down by `tilt` about the lateral axis: `cos(phase) u + sin(phase) v`, `u = (cos tilt, -sin tilt, 0)`, `v = +Z`. */
  function inPlane(phase: number, tilt: number): [number, number, number] {
    return [Math.cos(phase) * Math.cos(tilt), -Math.cos(phase) * Math.sin(tilt), Math.sin(phase)];
  }

  /** The mounds, the inframammary fold height they imply, and placement notes. */
  export interface IOutput {
    /** Left and right breast, left and right buttock, left and right thigh root. */
    mounds: AutoMovieHumanTrunkMound.ISpec[];

    /** The inframammary fold height (the underbust tape's site), mm. */
    foldY: number;

    /** Placement notes. */
    diagnostics: string[];
  }

  /** The published nipple-to-inframammary-fold skin length, mm (6.8 cm). */
  export const NIPPLE_FOLD: number = 68;

  /**
   * The breast's projection from the chest wall, mm: about 4 +- 1.3 cm in
   * 100 healthy nulliparous women aged 17 to 30 with BMI 17 to 24.9
   * (anthropometric breast measurements in Malay women, Universiti Sains
   * Malaysia; read through its abstract: debt, one population). It
   * regularises the bust: the chest girth then closes on the wall's
   * shoulder and the chest depth on the sternal midline.
   */
  export const BREAST_PROJECTION: number = 40;

  /** The breast's base width across, mm: 10 to 12 cm (aesthetic reference summarised in 3D studies; debt: not a measured norm), centred on the apex. */
  export const BREAST_BASE: number = 110;

  /**
   * The intergluteal cleft's depth at the buttock level, mm: the wall's back
   * midline stands this far ahead of the buttock apices. 21.07 in 51
   * volunteers without pilonidal disease, measured with a purpose-built
   * device (Akinci et al. 2009, "Natal cleft deeper in patients with
   * pilonidal sinus: implications for choice of surgical procedure"; read
   * through its abstract and a review: debt, mixed sex, one method). Maak et
   * al. 2025 (Turk J Surg, doi:10.47717/turkjsurg.2025.6665) read 9.1 +- 3.4
   * mm at the cleft's sacral opening, deepening toward the anus, by another
   * protocol.
   */
  export const CLEFT_DEPTH: number = 21;

  /** Place the mounds on the draft wall. */
  export function create(draft: AutoMovieHumanTrunkComposedSection.ISource, inputs: IInputs): IOutput {
    const { frames, measures, xs, hipX, bottom, apexY, breastP, sternalAngle, buttockY, crestY, xf } = inputs;
    const out: AutoMovieHumanTrunkMound.ISpec[] = [];
    const diagnostics: string[] = [];
    const wallAt: (y: number, phi: number) => number = (y: number, phi: number): number => AutoMovieHumanTrunkComposedSection.radius(draft, y, phi);
    // The section axis at a height: the course, which leaves the hip vertical over the thorax.
    const axisAt: (y: number) => number = (y: number): number => draft.axis?.(y) ?? xs;

    // Breasts.
    const half: number = inputs.apexHalf ?? measures.bustPointWidth / 2;
    let breastPhase: number = Math.atan2(half, Math.max(10, xf(apexY) - axisAt(apexY)));
    for (let k: number = 0; k < 30; ++k) breastPhase = Math.asin(Math.min(0.999, half / (wallAt(apexY, breastPhase) + breastP)));
    const rb: number = wallAt(apexY, breastPhase);
    // The lower extent: to the authored fold (with the upper half's profile), else the published
    // nipple-to-fold skin length on the fuller lower pole.
    const down: number = inputs.fold !== undefined && inputs.fold < apexY ? apexY - inputs.fold : AutoMovieHumanTrunkViewScalar.lowerPole(Math.max(breastP, 1), NIPPLE_FOLD);
    const lower: number | undefined = inputs.fold !== undefined ? (inputs.breastBase?.lower ?? 2) : undefined;
    const tables: ITables = inputs.tables ?? {};
    for (const [name, sign] of [["breast.left", -1], ["breast.right", 1]] as const)
      if (tables.breast !== undefined) out.push(traced(name, apexY, sign * breastPhase, rb, sign, tables.breast));
      else out.push({ name, station: apexY, phase: sign * breastPhase, radius: rb, projection: breastP, extents: inputs.breastBase !== undefined ? { up: inputs.breastBase.up, down, medial: Math.min(inputs.breastBase.medial, rb * breastPhase - 2), lateral: inputs.breastBase.lateral } : { up: Math.min(sternalAngle - apexY, BREAST_BASE / 2), down, medial: Math.min(BREAST_BASE / 2, rb * breastPhase - 10), lateral: Math.min(BREAST_BASE / 2, rb * (Math.PI / 2 - breastPhase)) }, lateral: sign, ...(lower === undefined ? {} : { lower }) });

    // Buttocks: the apex at ANSUR's buttock depth behind the most anterior point at the buttock level.
    const gz: number = measures.hipBreadth / 4;
    // From the body's most anterior point at the buttock level (the midline or the thigh roots' fronts).
    const gx: number = Math.max(xf(buttockY), hipX + measures.thighCircumference / (2 * Math.PI)) - measures.buttockDepth - axisAt(buttockY);
    const glutealPhase: number = Math.atan2(gz, gx);
    const rg: number = wallAt(buttockY, glutealPhase);
    const lift: number = Math.hypot(gx, gz) - rg;
    if (!(lift > 0)) diagnostics.push(`buttock apex lies inside the wall by ${(-lift).toFixed(2)} mm`);
    for (const [name, sign] of [["buttock.left", -1], ["buttock.right", 1]] as const)
      if (tables.buttock !== undefined) out.push(traced(name, buttockY, sign * glutealPhase, rg, (-sign) as 1 | -1, tables.buttock, inputs.tilt === undefined ? undefined : inPlane(sign * glutealPhase, inputs.tilt)));
      else out.push({ name, station: buttockY, phase: sign * glutealPhase, radius: rg, projection: Math.max(lift, 0), extents: { up: crestY - buttockY, down: buttockY - measures.glutealFurrowHeight, medial: Math.max(10, rg * (Math.PI - glutealPhase) - (inputs.buttockGap ?? 0)), lateral: rg * (glutealPhase - Math.PI / 2) }, lateral: (-sign) as 1 | -1 });

    // Thigh-root fronts.
    const tz: number = Math.abs(frames.hips.right[2]);
    const tx: number = hipX + measures.thighCircumference / (2 * Math.PI) - axisAt(bottom);
    const thighPhase: number = Math.atan2(tz, tx);
    const rt: number = wallAt(bottom, thighPhase);
    const rise: number = Math.hypot(tx, tz) - rt;
    for (const [name, sign] of [["thigh.left", -1], ["thigh.right", 1]] as const)
      if (tables.thigh !== undefined) out.push(traced(name, bottom, sign * thighPhase, rt, sign, tables.thigh, inputs.tilt === undefined ? undefined : inPlane(sign * thighPhase, inputs.tilt)));
      else out.push({ name, station: bottom, phase: sign * thighPhase, radius: rt, projection: Math.max(rise, 0), extents: { up: frames.heights.hip - bottom, down: frames.heights.hip - bottom, medial: rt * thighPhase, lateral: rt * (Math.PI / 2 - thighPhase) }, lateral: sign });

    // The spinal groove, a hollow centred on the back midline (phase pi), after the paired mounds so the
    // breasts keep their indices.
    if (tables.groove !== undefined) out.push(traced("spine.groove", tables.groove.station, Math.PI, wallAt(tables.groove.station, Math.PI), 1, tables.groove));
    const grooves: readonly { station: number; up: number; down: number; half: number; depth: number }[] = inputs.groove === undefined || tables.groove !== undefined ? [] : "station" in inputs.groove ? [inputs.groove] : inputs.groove;
    grooves.forEach((g: { station: number; up: number; down: number; half: number; depth: number }, k: number): void => {
      out.push({ name: k === 0 ? "spine.groove" : `spine.groove.${k}`, station: g.station, phase: Math.PI, radius: wallAt(g.station, Math.PI), projection: -g.depth, extents: { up: g.up, down: g.down, medial: g.half, lateral: g.half }, lateral: 1 });
    });
    const c: IInputs["cleft"] = inputs.cleft;
    if (c !== undefined) out.push({ name: "cleft", station: c.station, phase: Math.PI, radius: wallAt(c.station, Math.PI), projection: -c.depth, extents: { up: c.up, down: c.down, medial: c.half, lateral: c.half }, lateral: 1 });

    // Bone reliefs, paired: the apex phase from the outline's forward place relative to the axis at the
    // apex height (back: the posterior outline, a phase past pi/2; front: the anterior one, below pi/2).
    // The lateral side lies at increasing phase on the right front and the left back, as for the
    // breasts and the buttocks.
    for (const b of inputs.bones ?? []) {
      const outline: AutoMovieHumanTrunkComposedSection.IScalar = b.side === "back" ? draft.posterior : draft.anterior;
      const phase: number = Math.atan2(b.z, AutoMovieHumanTrunkComposedSection.read(outline, b.station));
      for (const [suffix, sign] of [["left", -1], ["right", 1]] as const) {
        const radius: number = wallAt(b.station, sign * phase);
        out.push({ name: `${b.name}.${suffix}`, station: b.station, phase: sign * phase, radius, projection: b.projection, extents: { up: b.up, down: b.down, medial: b.medial, lateral: b.lateral }, lateral: (b.side === "front" ? sign : -sign) as 1 | -1 });
      }
    }
    return { mounds: out, foldY: apexY - down, diagnostics };
  }
}
