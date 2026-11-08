import type { IAutoMovieHumanHeadIdentity } from "../../structures/head/IAutoMovieHumanHeadIdentity";
import { AutoMovieHumanSex } from "../../typings/AutoMovieHumanSex";
import { AutoMovieHumanHeadArcs } from "../AutoMovieHumanHeadArcs";
import type { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanHeadF1Lines } from "./AutoMovieHumanHeadF1Lines";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * L0 and L1 of the head by the view-curve method: the Frankfort head frame and
 * the published head landmarks written in it, from the public head inputs and
 * sourced relations only.
 *
 * Frame. Origin at the bitragion midpoint, the midpoint of the left and right
 * soft-tissue tragion. Y is normal to the Frankfort horizontal (FH), upward;
 * X lies in FH, square to the tragion line, toward the face; Z = X x Y points
 * to the subject's right, the ISB convention (Wu et al. 2002, 2005: X forward,
 * Y up, Z right). FH is the porion-orbitale plane (Farkas 1994, the standard
 * head orientation of every head measurement used here; Snyder 1977 and
 * ANSUR II take head heights "with the head in the Frankfort plane"). On the
 * skin the tragion stands for porion, so FH passes both tragia: a declared
 * convention of soft-tissue anthropometry, whose millimetre offset between
 * tragion and porion is an input gap. The frame's placement on the neck is
 * the neck port, pending `f1_trunk`'s neck-base spec; until then the root
 * places the frame in the world by stature only.
 *
 * Landmarks (female shares where the source separates the sexes):
 * - vertex height above FH: ANSUR II tragion to top of head, its women's line
 *   on the head circumference (`AutoMovieHumanHeadArcs.tragionDrop`, R2
 *   0.14; the stature line `TRAGION_TOP` has R2 0.05); an input gap (no
 *   personal tragion-vertex height);
 * - menton: the public head height v-gn below the vertex, perpendicular to FH
 *   (Snyder 1977 no. 25, the input's definition);
 * - nasion: the public n-gn above the gnathion, read along Y (the n-gn
 *   chord's tilt from the FH normal is an input gap; declared vertical);
 * - subnasale: the public n-sn below the nasion, read along Y likewise;
 * - stomion: a third of sn-me' below sn, Legan and Burstone 1980 Table 1
 *   (Sn-Stms / Stmi-Me' = 0.5, the interlabial gap 2 (2) mm taken as zero);
 * - labrale superius and inferius: the public vermilion heights from the
 *   stomion;
 * - glabella height: DEBT, 0.14 n-gn above the nasion (four-reference mean);
 *   Legan and Burstone's G-Sn = Sn-Me' (Table 1) puts f1's glabella below
 *   her nasion, so that norm is not used as a law;
 * - tragia: half the cranial base width t-t either side of the origin;
 *   t-t = 0.953 eu-eu, the FaceBase female ratio of means 139.0 / 145.8
 *   (rows `cranbasewidth`, `maxcranwidth`, sex code 2, primary read in
 *   `docs/work/prior-sourcing.md`); the person's t-t is an input gap;
 * - nasion, subnasale and gnathion forward places: each closes its FaceBase
 *   3D facial depth from the tragion (t-n, t-sn, t-gn) at its height, the
 *   depths read as female ratios of means to the maximum cranial length
 *   g-op (118.9, 123.5 and 139.2 over 187.3; FaceBase 20-40 pooled, note
 *   `weinberg-2016-3d-facial-norms.md`); the personal depths are input gaps;
 * - glabella forward place: the nasion's place plus the glabella-nasion
 *   setback, DEBT (the old `HeadPrior.profile.nasion` is a four-reference
 *   mean, `docs/work/prior-sourcing.md`);
 * - opisthocranion: the public g-op behind the glabella at its height
 *   (ANSUR II 6.4.48 fixes one tip at glabella and moves the other over the
 *   midsagittal back of the head for the maximum; the maximum's height is an
 *   input gap, declared at the glabella's height).
 * The euryon's height is not placed here: `AutoMovieHumanHeadMassCurves`
 * solves it from the bitragion coronal arc.
 */
export namespace AutoMovieHumanHeadFrankfort {
  /** The inputs the frame and landmarks read, world millimetres. */
  export interface IInput {
    /** The resolved public head identity. */
    head: IAutoMovieHumanHeadIdentity;

    /** Stature, mm. */
    stature: number;

    /** Female (true) or male shares where a source separates the sexes. */
    female: boolean;
  }

  /** One head landmark in the head frame. */
  export interface ILandmark {
    /** Landmark name and Farkas symbol, such as `n` or `t.right`. */
    name: string;

    /** Head-frame coordinates, mm. */
    point: Vec3;

    /** Published definition the landmark satisfies. */
    definition: string;

    /** Basis of the placement. */
    source: AutoMovieHumanArmCurveSpec.ISource;
  }

  /** A quantity whose published definition needs an input the person does not supply. */
  export interface IGap {
    /** Quantity. */
    name: string;

    /** Its published definition. */
    definition: string;

    /** What stands in for it meanwhile. */
    interim: string;
  }

  /** The frame, the landmarks and the gaps. */
  export interface IOutput {
    /** The Frankfort head frame relative to the world, placed by stature until the neck port exists. */
    frame: AutoMovieHumanArmCurveSpec.ISegmentFrame;

    /** Every landmark by name. */
    points: Record<Name, Vec3>;

    /** The landmark records with their definitions and bases. */
    list: ILandmark[];

    /** Head dimensions the curves read, mm: eu-eu, t-t, g-op, zy-zy, go-go, ft-ft, head circumference. */
    dims: IDims;

    /** ANSUR 1988 bitragion arcs for the person's head circumference and bizygomatic breadth, mm (population lines; the person's own arcs are input gaps). */
    arcs: AutoMovieHumanHeadArcs.IArcs;

    /** The person's own measured face inputs, when given: which bitragion arcs are measured, and the soft pogonion (head frame) or null. */
    measured: { menton: boolean; subnasale: boolean; pogonion: Vec3 | null; lips: { upper: number | null; lower: number | null }; nape: Vec3 | null };

    /** Input gaps. */
    gaps: IGap[];
  }

  /** Landmark names. */
  export type Name = "v" | "g" | "n" | "sn" | "prn" | "ac" | "ls" | "sto" | "li" | "gn" | "me" | "op" | "t";

  /** Head dimensions, mm. */
  export interface IDims {
    /** Maximum cranial breadth eu-eu. */
    breadth: number;

    /** Cranial base width t-t. */
    bitragion: number;

    /** Maximum cranial length g-op. */
    length: number;

    /** Bizygomatic breadth zy-zy. */
    bizygomatic: number;

    /** Mandibular width go-go. */
    bigonial: number;

    /** Minimum frontal width ft-ft. */
    frontal: number;

    /** Head circumference over glabella and opisthocranion. */
    circumference: number;

    /** Nasal width al-al. */
    nose: number;

    /** Labial fissure width ch-ch. */
    mouth: number;

    /** Intercanthal width en-en (public). */
    intercanthal: number;

    /** Palpebral fissure length en-ex by side (public); the head frame's +Z is the right. */
    fissure: { left: number; right: number };
  }

  /** FaceBase female and male ratio of means t-t / eu-eu: 139.0 / 145.8 and 147.9 / 152.3. */
  export const BITRAGION: { female: number; male: number } = { female: 139.0 / 145.8, male: 147.9 / 152.3 };

  /** FaceBase ratios of means of the 3D facial depths to g-op, women then men: t-n, t-sn, t-gn over 187.3 and 198.3. */
  export const DEPTH: { female: [number, number, number]; male: [number, number, number] } = {
    female: [118.9 / 187.3, 123.5 / 187.3, 139.2 / 187.3],
    male: [126.7 / 198.3, 132.8 / 198.3, 151.7 / 198.3],
  };

  /** ANSUR II tragion to top of head on stature, women then men (`docs/sources/ansur-ii.md`, head allometry). */
  export const TRAGION_TOP: { female: [number, number]; male: [number, number] } = { female: [90.2, 0.0223], male: [99.8, 0.0178] };

  /** Legan and Burstone 1980 Table 1 (Celebi et al. 2013 Table 1, secondary read): Sn-Stms / Stmi-Me' = 0.5, so the stomion stands a third of sn-me' below sn. */
  export const STOMION_SHARE: number = 1 / 3;

  /** DEBT: glabella ahead of the nasion, mm: the old four-reference mean (`HeadPrior.profile.nasion`), kept visibly until a published nasofrontal relation replaces it. */
  export const GLABELLA_SETBACK: number = 1.9;

  /** DEBT: glabella above the nasion per face height n-gn, the old four-reference mean `HeadPrior.profile.glabella` (0.17, 0.14, 0.17, 0.08 observed). */
  export const GLABELLA_RISE: number = 0.14;

  /** FaceBase nasal bridge length over nasal height n-prn / n-sn, ratio of means: women 47.4 / 54.7, men 49.9 / 56.6 (rows `nasalbdglength`, `nasalheight`, primary read in `docs/work/prior-sourcing.md`). */
  export const BRIDGE: { female: number; male: number } = { female: 47.4 / 54.7, male: 49.9 / 56.6 };

  /** FaceBase nasal ala length over nasal protrusion ac-prn / sn-prn, ratio of means: women 31.7 / 20.2, men 35.5 / 21.0 (note `weinberg-2016-3d-facial-norms.md`). */
  export const ALA: { female: number; male: number } = { female: 31.7 / 20.2, male: 35.5 / 21.0 };

  /** Build the frame and the landmarks from public inputs and published relations only. */
  export function create(input: IInput): IOutput {
    const h: IAutoMovieHumanHeadIdentity = input.head;
    const sex: "female" | "male" = input.female ? "female" : "male";
    const L: number = h.length;
    const B: number = (h.length * h.cephalicIndex) / 100;
    const tt: number = h.bitragionBreadth ?? BITRAGION[sex] * B;
    // The facial depths: the person's own (FaceBase 3D protocol) when given, else FaceBase's ratios of means on the head length.
    const [tn, tsn, tgn]: [number, number, number] = DEPTH[sex].map((r: number, i: number): number => [h.tragionNasionDepth, h.tragionSubnasaleDepth, h.tragionGnathionDepth][i] ?? r * L) as [number, number, number];

    // Vertical chain in the frame (Y normal to FH, tragion level zero). The
    // tragion-vertex height is ANSUR II's line on the head circumference
    // (R2 0.14 women), the better of its two predictors (stature R2 0.05).
    const vy: number = AutoMovieHumanHeadArcs.tragionDrop(h, input.female ? AutoMovieHumanSex.Female : AutoMovieHumanSex.Male);
    const arcs: AutoMovieHumanHeadArcs.IArcs = AutoMovieHumanHeadArcs.of(h, input.female ? AutoMovieHumanSex.Female : AutoMovieHumanSex.Male);
    // Head height is the menton-vertex separation perpendicular to FH (the
    // identity's definition, Snyder 1977 no. 25), so the menton stands that
    // far below the vertex. The gnathion is Farkas's and FaceBase's (the
    // lowest median point of the chin, the menton: FaceBase's women's sn-gn
    // 66.4 mm and n-gn 118.6 mm fit that point, not the mid-chin one), so gn
    // and me coincide and the t-gn depth closes at the menton's height.
    const me: number = vy - h.height;
    const close: (depth: number, y: number, what: string) => number = (depth: number, y: number, what: string): number => {
      const squared: number = depth * depth - (tt / 2) ** 2 - y * y;
      if (!(squared > 0)) throw new Error(`head ${what}: the facial depth ${depth.toFixed(2)} mm cannot reach its height ${y.toFixed(2)} mm at half t-t ${(tt / 2).toFixed(2)} mm`);
      return Math.sqrt(squared);
    };
    const xgn: number = close(tgn, me, "gnathion");
    // A midsagittal point at the 3D distance d from both tragia lies on the
    // circle x^2 + y^2 = d^2 - (t-t/2)^2 of the midsagittal plane. FaceBase's
    // n-gn, n-sn, n-sto and sn-sto are 3D distances too (not vertical drops,
    // which put f1's nasion 5 mm high, 2026-11-08), so each landmark is the
    // meeting of two such circles in the midsagittal plane.
    const radius: (depth: number, what: string) => number = (depth: number, what: string): number => {
      const squared: number = depth * depth - (tt / 2) ** 2;
      if (!(squared > 0)) throw new Error(`head ${what}: the facial depth ${depth.toFixed(2)} mm does not reach the midsagittal plane at half t-t ${(tt / 2).toFixed(2)} mm`);
      return Math.sqrt(squared);
    };
    // Nasion: t-n from the tragia and n-gn from the gnathion, the anterior meeting.
    const [xn, n]: [number, number] = meet([0, 0], radius(tn, "nasion"), [xgn, me], h.faceHeight, "anterior", "nasion");
    // The glabella from the person's own offsets when given.
    const g: number = n + (h.glabellaAboveNasion ?? GLABELLA_RISE * h.faceHeight);
    const xg: number = xn + (h.glabellaAheadOfNasion ?? GLABELLA_SETBACK);
    // Subnasale: n-sn from the nasion and t-sn from the tragia (the anterior meeting; the other lies above the nasion behind the brow), or her own G-Sn offset when only that is given.
    const [xsn, sn]: [number, number] =
      h.tragionSubnasaleDepth === undefined && h.subnasaleAheadOfGlabella !== undefined
        ? [xg + h.subnasaleAheadOfGlabella, n - Math.sqrt(Math.max(0, h.face.nose.height ** 2 - (xg + h.subnasaleAheadOfGlabella - xn) ** 2))]
        : meet([0, 0], radius(tsn, "subnasale"), [xn, n], h.face.nose.height, "anterior", "subnasale");
    // Stomion: FaceBase n-sto and sn-sto when given, the meeting behind the n-sn line (the lower face recedes behind it in a convex profile: Legan and Burstone's facial convexity G-Sn-Pg' 12 degrees); else Legan and Burstone's Sn-Stms / Stmi-Me' of one half on the sn-gn chord.
    const chordAt: (y: number) => number = (y: number): number => xsn + ((xgn - xsn) * (sn - y)) / (sn - me);
    const [xsto, sto]: [number, number] =
      h.upperFacialHeight !== undefined && h.upperLipHeight !== undefined
        ? meet([xn, n], h.upperFacialHeight, [xsn, sn], h.upperLipHeight, "posterior", "stomion")
        : [chordAt(sn - STOMION_SHARE * (sn - me)), sn - STOMION_SHARE * (sn - me)];
    const ls: number = sto + h.face.mouth.upperVermilionHeight;
    const li: number = sto - h.face.mouth.lowerVermilionHeight;
    const xop: number = xg - L;

    // Pronasale: the public sn-prn from the subnasale and the bridge n-prn
    // (FaceBase female ratio of means 47.4 / 54.7 of n-sn) from the nasion
    // close a triangle in the midsagittal plane, the tip forward of n-sn.
    const nsn: [number, number] = [xn - xsn, n - sn];
    const d: number = Math.hypot(nsn[0], nsn[1]);
    const np: number = h.face.nose.protrusion;
    const bridge: number = h.nasalBridgeLength ?? BRIDGE[sex] * h.face.nose.height;
    const along: number = (np * np - bridge * bridge + d * d) / (2 * d);
    const rise: number = Math.sqrt(Math.max(0, np * np - along * along));
    const e: [number, number] = [nsn[0] / d, nsn[1] / d];
    // f1 first (owner, 2026-11-08 13:1x): her pronasale is an authored landmark (`AutoMovieHumanHeadF1Lines.PRONASALE`, her reading by its definition); the triangle below placed it 1.9 mm behind and 0.8 mm below hers and waits for the later algorithmization.
    const triangle: [number, number] = [xsn + along * e[0] + rise * e[1], sn + along * e[1] - rise * e[0]];
    const prn: [number, number] = [AutoMovieHumanHeadF1Lines.PRONASALE[0], AutoMovieHumanHeadF1Lines.PRONASALE[1]];
    const prnDetail: string = `f1's authored pronasale; the n-sn-prn triangle gave (${triangle[0].toFixed(1)}, ${triangle[1].toFixed(1)})`;

    // Alar curvature point (right): the facial insertion of the ala, its
    // 3D distance to prn the FaceBase female ratio of means ac-prn / sn-prn
    // (31.7 / 20.2) times the public protrusion; laterally half the public
    // al-al and at the subnasale's height (both declared: ac stands slightly
    // medial of al and above sn, input gaps).
    const zac: number = h.face.nose.width / 2;
    const acprn: number = ALA[sex] * np;
    const xac: number = prn[0] - Math.sqrt(Math.max(0, acprn * acprn - zac * zac - (prn[1] - sn) ** 2));

    // Sagittal places of the lip points: on the sn-gn chord (scaffold until the midline profile owns them).
    const chord: (y: number) => number = (y: number): number => xsn + ((xgn - xsn) * (sn - y)) / (sn - me);
    const points: Record<Name, Vec3> = {
      v: [0, vy, 0],
      g: [xg, g, 0],
      n: [xn, n, 0],
      sn: [xsn, sn, 0],
      prn: [prn[0], prn[1], 0],
      ac: [xac, sn, zac],
      ls: [chord(ls), ls, 0],
      sto: [xsto, sto, 0],
      li: [chord(li), li, 0],
      gn: [xgn, me, 0],
      me: [xgn, me, 0],
      op: [xop, g, 0],
      t: [0, 0, tt / 2],
    };
    const fb: AutoMovieHumanArmCurveSpec.ISource = { kind: "published", citation: "FaceBase 3D Facial Norms (Weinberg et al. 2016), female ratios of means", detail: "facial depth from tragion closed at the landmark's height" };
    const list: ILandmark[] = [
      { name: "v", point: points.v, definition: "Vertex: highest point of the head in FH.", source: { kind: "published", citation: "ANSUR II tragion to top of head on stature", detail: `${vy.toFixed(2)} mm above FH; its forward place is declared over the origin (input gap)` } },
      { name: "g", point: points.g, definition: "Glabella: most prominent midline point between the brows.", source: { kind: "debt", reason: `height ${GLABELLA_RISE} n-gn above n and forward place ${GLABELLA_SETBACK} mm ahead of n are four-reference means; Legan-Burstone G-Sn = Sn-Me' fails for f1` } },
      { name: "n", point: points.n, definition: "Nasion: the nasofrontal suture's midline point at the upper lid creases (FaceBase).", source: fb },
      { name: "sn", point: points.sn, definition: "Subnasale: apex of the nasolabial angle.", source: fb },
      { name: "prn", point: points.prn, definition: "Pronasale: the most protruded point of the nasal tip.", source: { kind: "published", citation: "FaceBase n-prn / n-sn female ratio of means 47.4 / 54.7; public sn-prn", detail: prnDetail } },
      { name: "ac", point: points.ac, definition: "Alar curvature point (right): the facial insertion of the nasal wing base.", source: { kind: "published", citation: "FaceBase ac-prn / sn-prn female ratio of means 31.7 / 20.2; public al-al", detail: "lateral place half al-al and height at sn are declared (input gaps)" } },
      { name: "ls", point: points.ls, definition: "Labrale superius: upper vermilion's midline border.", source: { kind: "input", field: "face.mouth.upperVermilionHeight" } },
      { name: "sto", point: points.sto, definition: "Stomion: labial fissure's midline point.", source: { kind: "published", citation: "Legan and Burstone 1980 Table 1", detail: "Sn-Stms / Stmi-Me' = 0.5" } },
      { name: "li", point: points.li, definition: "Labrale inferius: lower vermilion's midline border.", source: { kind: "input", field: "face.mouth.lowerVermilionHeight" } },
      { name: "gn", point: points.gn, definition: "Gnathion: where the chin contour turns downward; taken at the menton's height (declared).", source: fb },
      { name: "me", point: points.me, definition: "Menton: lowest point of the chin, head height below the vertex.", source: { kind: "input", field: "head.height" } },
      { name: "op", point: points.op, definition: "Opisthocranion: the g-op maximum's posterior end.", source: { kind: "input", field: "head.length" } },
      { name: "t", point: points.t, definition: "Tragion (right): notch above the tragus; half t-t from the origin.", source: { kind: "published", citation: "FaceBase cranbasewidth / maxcranwidth, sex code 2", detail: "t-t = 0.953 eu-eu" } },
    ];
    const napeBehind: number | undefined = h.cervicalArrowApexBehindTragion;
    const napeBelow: number | undefined = h.cervicalArrowApexBelowTragion;
    const gaps: IGap[] = [
      { name: "tragion to top of head", definition: "ANSUR II: vertical distance from tragion to the top of the head, head in FH", interim: "ANSUR II stature line" },
      { name: "cranial base width t-t", definition: "FaceBase: 3D distance between the tragia", interim: "0.953 eu-eu (FaceBase female ratio of means)" },
      { name: "facial depths t-n, t-sn, t-gn", definition: "FaceBase 3D distances from tragion", interim: "female ratios of means to g-op" },
      { name: "glabella setback", definition: "forward distance of g from n in FH", interim: `${GLABELLA_SETBACK} mm (DEBT)` },
      { name: "euryon height", definition: "height above FH of the maximum cranial breadth", interim: "solved from the ANSUR 1988 bitragion coronal arc (population line)" },
      { name: "bitragion arcs", definition: "ANSUR 1988 tape from tragion to tragion over the vertex (coronal), the forehead above the brow ridges (minimum frontal), subnasale and menton", interim: "ANSUR 1988 women's lines on head circumference or zy-zy" },
      { name: "opisthocranion height", definition: "height of the g-op maximum's posterior end", interim: "the glabella's height" },
    ];
    return {
      frame: {
        name: "head",
        parent: null,
        basis: { kind: "published", citation: "Farkas 1994 head orientation in FH; Wu et al. 2005 axis convention", detail: "Origin at the bitragion midpoint; Y normal to FH upward; X forward in FH; Z right. Placed with FH at stature minus the tragion-vertex height until the neck port exists." },
        relative: { origin: [0, input.stature - vy, 0], axes: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] },
      },
      points,
      list,
      dims: { breadth: B, bitragion: tt, length: L, bizygomatic: h.faceWidth, bigonial: h.mandibularWidth, frontal: h.minimumFrontalWidth, circumference: h.circumference, nose: h.face.nose.width, mouth: h.face.mouth.width, intercanthal: h.face.intercanthalWidth, fissure: { left: h.face.eyePair.left.palpebralFissureLength, right: h.face.eyePair.right.palpebralFissureLength } },
      arcs,
      measured: {
        menton: h.bitragionMentonArc !== undefined,
        subnasale: h.bitragionSubnasaleArc !== undefined,
        pogonion: h.pogonionAheadOfGlabella !== undefined && h.pogonionAboveMenton !== undefined ? [xg + h.pogonionAheadOfGlabella, me + h.pogonionAboveMenton, 0] : null,
        lips: { upper: h.upperLipProtrusion ?? null, lower: h.lowerLipProtrusion ?? null },
        // Stagnara's cervical arrow apex, read standing against a plumb line: with FH level in the standard posture, behind and below the tragion in this frame.
        nape: napeBehind !== undefined && napeBelow !== undefined ? [0 - napeBehind, 0 - napeBelow, 0] : null,
      },
      gaps,
    };
  }

  /** The meeting of two circles in the midsagittal plane (+X anterior, +Y up): the more anterior or the more posterior of the two; throws when they do not meet. */
  function meet(a: [number, number], ra: number, b: [number, number], rb: number, side: "anterior" | "posterior", what: string): [number, number] {
    const dx: number = b[0] - a[0];
    const dy: number = b[1] - a[1];
    const d: number = Math.hypot(dx, dy);
    const along: number = (ra * ra - rb * rb + d * d) / (2 * d);
    const squared: number = ra * ra - along * along;
    if (!(d > 0) || !(squared >= 0)) throw new Error(`head ${what}: the distances ${ra.toFixed(2)} and ${rb.toFixed(2)} mm do not meet (centres ${d.toFixed(2)} mm apart)`);
    const h: number = Math.sqrt(squared);
    const base: [number, number] = [a[0] + (along * dx) / d, a[1] + (along * dy) / d];
    const p: [number, number] = [base[0] - (h * dy) / d, base[1] + (h * dx) / d];
    const q: [number, number] = [base[0] + (h * dy) / d, base[1] - (h * dx) / d];
    return (p[0] > q[0]) === (side === "anterior") ? p : q;
  }
}
