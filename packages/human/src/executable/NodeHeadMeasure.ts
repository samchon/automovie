import fs from "node:fs";
import path from "node:path";

import { AutoMovieHumanBodyAnatomy } from "../generation/AutoMovieHumanBodyAnatomy";
import { HumanNodeInput } from "./HumanNodeInput";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeHeadReference } from "./NodeHeadReference";
import { NodeArmDraw } from "./NodeArmDraw";

type V3 = [number, number, number];
type V2 = [number, number];

/**
 * Measures f1's own face inputs on the reference head by their published
 * definitions (`node:head-measure`), writing every landmark it reads into a
 * receipt so each value can be traced and re-read.
 *
 * Source: the MetaHuman head observations (`test/.shots/f1/head-
 * observations.json`): the canonical head mesh in mm and the named landmark
 * and curve positions on it.
 *
 * Frame (FH, as the head frame): Y the unit normal of the plane fitted
 * through the four Frankfort points (`pt_frankfurt_rl`, `_rr` behind,
 * `_fl`, `_fr` in front), pointing up; origin the tragia's midpoint; X the
 * direction from it toward the Frankfort points in front, in that plane; Z =
 * X x Y. Tragion (ANSUR: the notch just above the tragus): the highest point
 * of each `ear_tragus` curve in that frame.
 *
 * Midsagittal profile: the mesh cut by the plane Z = 0. On it:
 * - pronasale: the most forward point between 60 mm below FH and FH;
 * - glabella: the most forward point between 15 and 55 mm above FH;
 * - nasion: the most posterior point between 15 mm above the pronasale and
 *   the glabella;
 * - subnasale: the most posterior point from 20 to 3 mm below the
 *   pronasale (where the columella merges with the upper lip);
 * - soft pogonion: the most forward point 45 to 90 mm below the pronasale;
 * - menton: the lowest point within 20 mm behind the pogonion;
 * - submental inclination: the line from the menton tangent to the
 *   submental contour from below (the steepest descent to a profile point 5
 *   to 45 mm behind the menton), as an angle below FH.
 * Bitragion arcs (ANSUR 1988, menton and subnasale arcs): the mesh cut by
 * the plane through both tragia and the landmark; a taut tape bridges
 * hollows, so the arc is the convex hull of the cut on the landmark's side of
 * the tragion line, with both tragia, less that line's chord.
 */
export namespace NodeHeadMeasure {
  /** Measures and writes `.shots/f1_head/measure-<stamp>/head.json`. */
  export async function run(): Promise<void> {
    const source: string = HumanNodePaths.resolve("test/.shots/f1/head-observations.json");
    const data: IObservations = JSON.parse(fs.readFileSync(source, "utf8"));
    const vertices: V3[] = data.canonicalHeadVerticesMm;
    const triangles: V3[] = data.canonicalHeadTriangles;
    // A landmark: its installed sculpt position, else its feature definition's vertex on the canonical head mesh.
    const landmark: (name: string) => V3 = (name: string): V3 => {
      const l: { positionMm: V3; installedNames: string[] } | undefined = data.landmarkPopulation.actualLandmarks.find((x: { installedNames: string[] }): boolean => x.installedNames.includes(name));
      if (l !== undefined) return l.positionMm;
      const id: number | undefined = data.featureSource.definition[name]?.vID;
      if (id === undefined || vertices[id] === undefined) throw new Error(`head measure: no landmark ${name}`);
      return vertices[id]!;
    };
    const curve: (name: string) => V3[] = (name: string): V3[] => {
      const f: { name: string; positionsMm: V3[] } | undefined = data.features.find((x: { name: string }): boolean => x.name === name);
      if (f === undefined) throw new Error(`head measure: no curve ${name}`);
      return f.positionsMm;
    };

    // FH by the anatomical definitions read on the mesh, not the asset's
    // point names. Tragion (ANSUR, the notch just above the tragus): the top
    // of each tragus curve in the native vertical. Porion (the top of the
    // external acoustic meatus) is not modelled by the mesh, so the tragia
    // stand for it (DEBT: porion lies a few mm above the tragion). Orbitale
    // (the lowest point of the infraorbital margin): on the mesh's cut by the
    // sagittal plane through each eye's centre (the canthi's midpoint), the
    // deepest point of the front silhouette 5 to 25 mm below that centre, the
    // lid-cheek junction over the rim.
    const nativeUp: V3 = [0, 1, 0];
    const topOf: (points: V3[]) => V3 = (points: V3[]): V3 => points.reduce((a: V3, b: V3): V3 => (dot(b, nativeUp) > dot(a, nativeUp) ? b : a));
    const tl: V3 = topOf(curve("ear_tragus_l"));
    const tr: V3 = topOf(curve("ear_tragus_r"));
    const across: V3 = unit(sub(tr, tl));
    const orbitale: (inner: string, outer: string) => V3 = (inner: string, outer: string): V3 => {
      const c: V3 = scale(add(landmark(inner), landmark(outer)), 0.5);
      const rows: Map<number, V3> = new Map();
      for (const p of cut(vertices, triangles, c, across)) {
        if (!(p[1] < c[1] - 5 && p[1] > c[1] - 25 && p[0] > c[0] - 20)) continue;
        const k: number = Math.round(p[1] / 2);
        const known: V3 | undefined = rows.get(k);
        if (known === undefined || p[0] > known[0]) rows.set(k, p);
      }
      const front: V3[] = [...rows.values()];
      if (front.length === 0) throw new Error(`head measure: no lid-cheek silhouette under ${inner}`);
      return front.reduce((a: V3, b: V3): V3 => (b[0] < a[0] ? b : a));
    };
    const ol: V3 = orbitale("pt_eye_corner_inner_l", "pt_eye_corner_outer_l");
    const or: V3 = orbitale("pt_eye_corner_inner_r", "pt_eye_corner_outer_r");
    const front: V3 = scale(add(ol, or), 0.5);
    const rear: V3 = scale(add(tl, tr), 0.5);
    let up: V3 = unit(cross(sub(tr, tl), sub(front, rear)));
    if (up[1] < 0) up = scale(up, -1);
    const origin: V3 = rear;
    const toward: V3 = sub(front, origin);
    const X: V3 = unit(sub(toward, scale(up, dot(toward, up))));
    const asset: V3[] = ["pt_frankfurt_rl", "pt_frankfurt_rr", "pt_frankfurt_fl", "pt_frankfurt_fr"].map(landmark);
    const Z: V3 = cross(X, up);
    const local: (p: V3) => V3 = (p: V3): V3 => {
      const d: V3 = sub(p, origin);
      return [dot(d, X), dot(d, up), dot(d, Z)];
    };

    // Midsagittal profile.
    const profile: V2[] = cut(vertices.map(local), triangles, [0, 0, 0], [0, 0, 1]).map((p: V3): V2 => [p[0], p[1]]);
    const most: (pts: V2[], key: (p: V2) => number, what: string) => V2 = (pts: V2[], key: (p: V2) => number, what: string): V2 => {
      if (pts.length === 0) throw new Error(`head measure: no profile points for ${what}`);
      return pts.reduce((a: V2, b: V2): V2 => (key(b) > key(a) ? b : a));
    };
    // The face's silhouette: the most forward profile point in each 0.5 mm of
    // height (the cut also crosses the nostrils, the mouth and the eyes'
    // surroundings inside the face; a silhouette reads only the outer skin).
    const bins: Map<number, V2> = new Map();
    for (const p of profile) {
      if (!(p[0] > 20)) continue;
      const k: number = Math.round(p[1] / 2);
      const known: V2 | undefined = bins.get(k);
      if (known === undefined || p[0] > known[0]) bins.set(k, p);
    }
    const silhouette: V2[] = [...bins.values()].sort((a: V2, b: V2): number => a[1] - b[1]);
    const band: (lo: number, hi: number) => V2[] = (lo: number, hi: number): V2[] => silhouette.filter((p: V2): boolean => p[1] > lo && p[1] < hi);
    const prn: V2 = most(band(-60, 0), (p: V2): number => p[0], "pronasale");
    const n: V2 = most(band(prn[1] + 5, prn[1] + 70), (p: V2): number => -p[0], "nasion");
    const g: V2 = most(band(n[1], n[1] + 35), (p: V2): number => p[0], "glabella");
    const sn: V2 = most(band(prn[1] - 25, prn[1]), (p: V2): number => -p[0], "subnasale");
    const pg: V2 = most(band(sn[1] - 75, sn[1] - 35), (p: V2): number => p[0], "pogonion");
    // Menton: down the silhouette from the pogonion while it stays on the chin.
    let me: V2 = pg;
    for (const p of [...band(pg[1] - 60, pg[1])].reverse()) {
      if (p[0] < pg[0] - 25) break;
      me = p;
    }
    // The submental contour's lower envelope behind the menton, 1 mm columns.
    const columns: Map<number, V2> = new Map();
    for (const p of profile) {
      if (!(p[0] < me[0] - 5 && p[0] > me[0] - 45 && p[1] > me[1] - 40 && p[1] < me[1] + 20)) continue;
      const k: number = Math.round(p[0]);
      const known: V2 | undefined = columns.get(k);
      if (known === undefined || p[1] < known[1]) columns.set(k, p);
    }
    const tangent: V2 = most([...columns.values()], (p: V2): number => Math.atan2(me[1] - p[1], me[0] - p[0]), "submental contour");
    const submental: number = (Math.atan2(me[1] - tangent[1], me[0] - tangent[0]) * 180) / Math.PI;

    // The lips on the silhouette between the subnasale and the pogonion: the stomion the deepest point in the middle third between them, labrale superius and inferius the most forward points above and below it; their protrusion is the perpendicular distance ahead of the Sn-Pg' line (Legan and Burstone's definitions). Gnathion (FaceBase): midway along the chin between the pogonion and the menton, read on the silhouette at the middle height.
    const third: number = (sn[1] - pg[1]) / 3;
    const stoPt: V2 = most(band(pg[1] + third, sn[1] - third), (p: V2): number => -p[0], "stomion");
    const ls: V2 = most(band(stoPt[1], sn[1] - 3), (p: V2): number => p[0], "labrale superius");
    const li: V2 = most(band(pg[1] + 5, stoPt[1]), (p: V2): number => p[0], "labrale inferius");
    const ahead: (p: V2) => number = (p: V2): number => {
      const d: V2 = [pg[0] - sn[0], pg[1] - sn[1]];
      const len: number = Math.hypot(d[0], d[1]);
      return ((p[0] - sn[0]) * -d[1] + (p[1] - sn[1]) * d[0]) / len * Math.sign(-d[1]);
    };
    const gnPt: V2 = most(band((pg[1] + me[1]) / 2 - 3, (pg[1] + me[1]) / 2 + 3), (p: V2): number => p[0], "gnathion");
    const depth: (p: V2) => number = (p: V2): number => (Math.hypot(...sub([p[0], p[1], 0], local(tl))) + Math.hypot(...sub([p[0], p[1], 0], local(tr)))) / 2;

    // Craniovertebral angle (the line from C7 to the tragion above the horizontal, standing): C7 the most posterior whole-body reference vertex within 1.5 mm of the midsagittal plane and of the person's cervicale height (her public input), the tragion the tragia's midpoint; native +Y is up.
    const person: Awaited<ReturnType<typeof HumanNodeInput.of>> = await HumanNodeInput.of();
    const cervicale: number = AutoMovieHumanBodyAnatomy.resolve(person.parameters).cervicaleHeight;
    const midZ: number = (tl[2] + tr[2]) / 2;
    // The head observations' mesh stops above the nape at that height (its cut there is the throat, a 108 degree reading at 11:10), so C7 is read on the whole-body reference (`NodeHeadReference.load`: world mm, Z negated).
    // Behind the tragion only (the reference's midline is sparse: within 1.5 mm of the plane only the throat had vertices); the band is 3 mm in height and 10 mm about the plane (the whole-body mesh's vertex spacing there; the posterior extreme moves by about 1 mm over 10 mm on a neck of 50 mm half breadth).
    const tragusX: number = (tl[0] + tr[0]) / 2;
    const nape: V3[] = NodeHeadReference.load(cervicale - 5).filter((p: V3): boolean => Math.abs(p[1] - cervicale) < 3 && Math.abs(-p[2] - midZ) < 10 && p[0] < tragusX);
    if (nape.length === 0) throw new Error(`head measure: the head mesh has no midsagittal point at the cervicale height ${cervicale.toFixed(1)} mm`);
    const c7: V3 = nape.reduce((a: V3, b: V3): V3 => (b[0] < a[0] ? b : a));
    const tragus: V3 = scale(add(tl, tr), 0.5);
    const craniovertebral: number = (Math.atan2(tragus[1] - c7[1], tragus[0] - c7[0]) * 180) / Math.PI;
    // The whole-body points in this FH frame (they carry Z negated) and in her upright frame about the tragia (native axes).
    const fhOf: (p: V3) => V3 = (p: V3): V3 => local([p[0], p[1], -p[2]]);
    const uprightOf: (p: V3) => V3 = (p: V3): V3 => [p[0] - origin[0], p[1] - origin[1], p[2] + origin[2]];
    // Suprasternale (ISO 8559-1, the jugular notch's midpoint) at her suprasternale height (public input): the most forward whole-body point within 3 mm of that height and 10 mm of the midsagittal plane, the notch's skin.
    const suprasternale: number = AutoMovieHumanBodyAnatomy.resolve(person.parameters).suprasternaleHeight;
    const notch: V3[] = NodeHeadReference.load(suprasternale - 5).filter((p: V3): boolean => Math.abs(p[1] - suprasternale) < 3 && Math.abs(-p[2] - midZ) < 10);
    if (notch.length === 0) throw new Error(`head measure: no midsagittal point at the suprasternale height ${suprasternale.toFixed(1)} mm`);
    const ij: V3 = notch.reduce((a: V3, b: V3): V3 => (b[0] > a[0] ? b : a));
    // Stagnara's cervical arrow (fleche cervicale): the horizontal distance from the plumb line touching the thoracic kyphosis to the deepest point of the cervical lordosis on the back's skin. Its apex, read against a vertical line, is the most anterior point of the back's midline contour (the most posterior point per 2 mm of height within 10 mm of the midsagittal plane) between C7 and the tragia's height.
    const contour: Map<number, V3> = new Map();
    for (const p of NodeHeadReference.load(cervicale - 5)) {
      if (!(p[1] < tragus[1] && p[1] > c7[1] && Math.abs(-p[2] - midZ) < 10 && p[0] < tragusX)) continue;
      const k: number = Math.round(p[1] / 2);
      const known: V3 | undefined = contour.get(k);
      if (known === undefined || p[0] < known[0]) contour.set(k, p);
    }
    if (contour.size === 0) throw new Error("head measure: no back contour between C7 and the tragia");
    const apex: V3 = [...contour.values()].reduce((a: V3, b: V3): V3 => (b[0] > a[0] ? b : a));

    // Readings by the head identity's published definitions, all in this FH frame (2026-11-08 12:2x):
    // - vertex v (Farkas: the highest point of the head with the head in FH; ANSUR II tragion to top of head, head in FH): the highest head-mesh vertex;
    // - head height (Snyder 1977 no. 25 as the identity defines it: menton to vertex perpendicular to FH);
    // - Farkas and FaceBase gnathion gn (the lowest median point of the chin, FaceBase's sn-gn women's mean 66.4 mm fits her sn-me 62 mm and not her mid-chin point's 47 mm): the menton read above, so t-gn and n-gn are read to it;
    // - FaceBase 3D distances n-sn (nasal height), n-sto (upper facial height), sn-sto (upper lip height);
    // - the posture: her FH's inclination to her native horizontal (anterior end up, degrees), which the head-frame overlay reads as a rotation of her neck.
    const fhPoints: V3[] = vertices.map(local);
    const vertex: V3 = fhPoints.reduce((a: V3, b: V3): V3 => (b[1] > a[1] ? b : a));
    const d2: (a: V2, b: V2) => number = (a: V2, b: V2): number => Math.hypot(a[0] - b[0], a[1] - b[1]);
    const fhInclination: number = (Math.atan2(X[1], Math.hypot(X[0], X[2])) * 180) / Math.PI;
    // Euryon (Farkas: the most lateral point of the head's side), above the auricles: the widest |Z| above the ears' highest curve point.
    const earTop: number = Math.max(...["ear_helix_l", "ear_helix_r"].flatMap((name: string): number[] => (data.features.some((f: { name: string }): boolean => f.name === name) ? curve(name).map((p: V3): number => local(p)[1]) : [])), 0);
    const euryon: V3 = fhPoints.filter((p: V3): boolean => p[1] > earTop + 2).reduce((a: V3, b: V3): V3 => (Math.abs(b[2]) > Math.abs(a[2]) ? b : a));

    // The cervicomental contour and the cervical point C (Legan and Burstone 1980: the innermost point between the submental area and the neck). Its outer envelope: from O, a point inside the floor of the mouth 40 mm behind and above the menton, the farthest profile point in each half-degree direction from 40 to 100 degrees below the horizontal (the chin's underside to the throat; the farthest is the skin, the mouth's interior lying nearer O). C: the envelope point farthest on O's side of the chord from the menton to the envelope's lowest throat point. The submental tangent (the identity's definition, Ellenbogen and Karlin): the steepest line from the menton touching the envelope from below between the menton and C; the neck line: from C to the envelope's lowest throat point.
    const O: V2 = [me[0] - 40, me[1] + 40];
    const rays: Map<number, V2> = new Map();
    for (const p of profile) {
      const a: number = (Math.atan2(p[1] - O[1], p[0] - O[0]) * 180) / Math.PI;
      if (!(a < -40 && a > -100) || !(p[1] > me[1] - 45)) continue;
      const k: number = Math.round(a * 2);
      const known: V2 | undefined = rays.get(k);
      if (known === undefined || d2(p, O) > d2(known, O)) rays.set(k, p);
    }
    const envelope: V2[] = [...rays.entries()].sort((a: [number, V2], b: [number, V2]): number => b[0] - a[0]).map(([, p]: [number, V2]): V2 => p);
    if (envelope.length < 10) throw new Error(`head measure: the cervicomental envelope has ${envelope.length} points`);
    const low: V2 = envelope[envelope.length - 1]!;
    const chordNormal: V2 = [-(low[1] - me[1]) / d2(low, me), (low[0] - me[0]) / d2(low, me)];
    const inward: number = Math.sign((O[0] - me[0]) * chordNormal[0] + (O[1] - me[1]) * chordNormal[1]);
    const cervical: V2 = envelope.reduce((a: V2, b: V2): V2 => (inward * ((b[0] - me[0]) * chordNormal[0] + (b[1] - me[1]) * chordNormal[1]) > inward * ((a[0] - me[0]) * chordNormal[0] + (a[1] - me[1]) * chordNormal[1]) ? b : a));
    const submentalArc: V2[] = envelope.filter((p: V2): boolean => p[0] < me[0] - 1 && p[0] >= cervical[0]);
    const touch: V2 = most(submentalArc, (p: V2): number => Math.atan2(me[1] - p[1], me[0] - p[0]), "submental arc");
    const submentalTangent: number = (Math.atan2(me[1] - touch[1], me[0] - touch[0]) * 180) / Math.PI;
    const neckLean: number = (Math.atan2(cervical[0] - low[0], cervical[1] - low[1]) * 180) / Math.PI;

    // Bitragion arcs.
    const arc: (p: V2) => { arc: number; points: number } = (p: V2): { arc: number; points: number } => {
      const a: V3 = local(tl);
      const b: V3 = local(tr);
      const c: V3 = [p[0], p[1], 0];
      const normal: V3 = unit(cross(sub(b, a), sub(c, a)));
      const e1: V3 = unit(sub(b, a));
      const e2: V3 = cross(normal, e1);
      const flat: (q: V3) => V2 = (q: V3): V2 => [dot(sub(q, a), e1), dot(sub(q, a), e2)];
      const side: number = Math.sign(flat(c)[1]);
      const cutPoints: V2[] = cut(vertices.map(local), triangles, a, normal).map(flat).filter((q: V2): boolean => q[1] * side > 0);
      const hull: V2[] = convexHull([...cutPoints, flat(a), flat(b)]);
      return { arc: perimeter(hull) - Math.hypot(...flat(b)), points: cutPoints.length };
    };
    const menton: { arc: number; points: number } = arc(me);
    const subnasale: { arc: number; points: number } = arc(sn);
    // ANSUR 1988 bitragion coronal arc: tragion to tragion over the top of the head in the coronal plane, the plane through both tragia normal to FH.
    const coronal: { arc: number; points: number } = arc([0, 100]);

    const out: string = HumanNodePaths.resolve(`packages/human/.shots/f1_head/measure-${new Date().toISOString().replace(/[:.]/g, "-")}`);
    fs.mkdirSync(out, { recursive: true });
    const receipt: object = {
      person: "f1",
      source: { path: "test/.shots/f1/head-observations.json", vertices: vertices.length, triangles: triangles.length, frame: data.frame },
      frame: { origin, X, Y: up, Z, tragion: { left: tl, right: tr }, orbitale: { left: ol, right: or }, porion: "the tragia stand for porion (DEBT: the meatus is not modelled)" },
      checks: { pronasaleBelowFH: -prn[1], tragusTopToTragion: 0, tragusTopToTragionNote: "the tragion is read as the tragus curve's top (ANSUR: the notch just above the tragus), so the offset is zero by this definition", fhToSN: "not readable on the skin: sella is a skeletal landmark", assetFrankfortOffsets: asset.map((p: V3): V3 => local(p)) },
      profilePoints: profile.length,
      landmarks: { g, n, prn, sn, ls, sto: stoPt, li, pg, gn: gnPt, me, submentalTangentPoint: tangent, c7Native: c7, cervicaleHeight: cervicale },
      values: {
        bitragionMentonArc: menton.arc,
        bitragionSubnasaleArc: subnasale.arc,
        // The identity's definition: the line from the menton tangent to the submental contour, bounded at the cervical point (the earlier window reached past C onto the throat and read 16.3 at its edge).
        submentalInclination: submentalTangent,
        glabellaToSubnasaleHorizontal: sn[0] - g[0],
        glabellaAheadOfNasion: g[0] - n[0],
        glabellaAboveNasion: g[1] - n[1],
        tragionNasionDepth: depth(n),
        tragionSubnasaleDepth: depth(sn),
        // FaceBase's gnathion is Farkas's, the chin's lowest median point (the menton read here): her mid-chin point gives sn-gn 47 mm against FaceBase's women's 66.4.
        tragionGnathionDepth: depth(me),
        tragionMidChinDepth: depth(gnPt),
        upperLipProtrusion: ahead(ls),
        lowerLipProtrusion: ahead(li),
        craniovertebralAngle: craniovertebral,
        tragionTopOfHead: vertex[1],
        headHeightPerpendicularToFH: vertex[1] - me[1],
        tragionMentonDepth: depth(me),
        nasionMentonDistance: d2(n, me),
        nasionSubnasaleDistance: d2(n, sn),
        nasionStomionDistance: d2(n, stoPt),
        subnasaleStomionDistance: d2(sn, stoPt),
        bitragionCoronalArc: coronal.arc,
      },
      readings: {
        vertex,
        euryon,
        earTop,
        fhInclinationDegrees: fhInclination,
        cervical,
        submentalTouch: touch,
        submentalTangentDegrees: submentalTangent,
        submentalWindowEdgeDegrees: submental,
        neckLineLow: low,
        neckLeanDegrees: neckLean,
        envelope,
        c7: { native: c7, fh: fhOf(c7), upright: uprightOf(c7) },
        suprasternale: { height: suprasternale, native: ij, fh: fhOf(ij), upright: uprightOf(ij) },
        cervicalArrowApex: { native: apex, fh: fhOf(apex), upright: uprightOf(apex) },
        // The asset's own feature curves (lid margins, creases, vermilion borders, philtral columns, nostrils, auricle), in this FH frame: the comparison lines for the authored eye, mouth and ear curves.
        features: data.features.filter((f: { name: string }): boolean => /eyelid|eyecrease|eyefold|lip_|mouth|philtrum|nostril|ear_|helix|corner/.test(f.name)).map((f: { name: string; positionsMm: V3[] }): { name: string; fh: V3[] } => ({ name: f.name, fh: f.positionsMm.map(local) })),
      },
      cuts: { mentonArcPoints: menton.points, subnasaleArcPoints: subnasale.points, coronalArcPoints: coronal.points },
      definitions: "NodeHeadMeasure doc: ANSUR tragion, FH from the MetaHuman Frankfort points, midsagittal profile extrema, taut-tape arcs as convex hulls, submental tangent from below",
    };
    fs.writeFileSync(path.join(out, "head.json"), JSON.stringify(receipt, null, 2));

    // The receipt's picture: the midsagittal cut (grey), its silhouette (red) and the landmarks read on it, FH frame, seen from the left.
    const lift: (p: V2) => V3 = (p: V2): V3 => [p[0], p[1], 0];
    const view: NodeArmDraw.IView = NodeArmDraw.open([0, 0, 1], profile.filter((p: V2): boolean => p[0] > -120).map(lift));
    NodeArmDraw.dots(view, profile.map(lift), "#b0b0b0", 1.4);
    NodeArmDraw.dots(view, silhouette.map(lift), "#d03030", 2);
    NodeArmDraw.line(view, [[-120, 0, 0], [140, 0, 0]], "#ff8a00", 1, [5, 3]);
    NodeArmDraw.dots(view, envelope.map(lift), "#00a060", 2.4);
    for (const [name, p] of Object.entries({ g, n, prn, sn, pg, me, C: cervical, touch, v: [vertex[0], vertex[1]] as V2 })) {
      NodeArmDraw.dots(view, [lift(p)], "#000000", 5);
      NodeArmDraw.text(view, lift(p), name, "#202020");
    }
    const ray: number = (submentalTangent * Math.PI) / 180;
    NodeArmDraw.line(view, [lift(me), [me[0] - 60 * Math.cos(ray), me[1] - 60 * Math.sin(ray), 0]], "#0060ff", 1.4);
    NodeArmDraw.line(view, [lift(cervical), lift(low)], "#a000a0", 1.4);
    NodeArmDraw.caption(view, ["f1 reference head, midsagittal cut (grey), its silhouette (red), landmarks read on it; orange dashed FH; blue the submental tangent", `values: ${JSON.stringify((receipt as { values: object }).values)}`]);
    fs.writeFileSync(path.join(out, "profile.png"), NodeArmDraw.png(view));
    console.log(out);
    console.log(JSON.stringify((receipt as { values: object }).values, null, 2));
  }

  /** The observation file's fields this tool reads. */
  interface IObservations {
    frame: string;
    canonicalHeadVerticesMm: V3[];
    canonicalHeadTriangles: V3[];
    features: { name: string; positionsMm: V3[] }[];
    landmarkPopulation: { actualLandmarks: { positionMm: V3; installedNames: string[] }[] };
    featureSource: { definition: Record<string, { vID?: number } | undefined> };
  }

  /** The points where the triangles' edges cross the plane through `o` with normal `nrm`. */
  function cut(points: V3[], triangles: V3[], o: V3, nrm: V3): V3[] {
    const side: number[] = points.map((p: V3): number => dot(sub(p, o), nrm));
    const out: V3[] = [];
    for (const t of triangles)
      for (const [i, j] of [
        [t[0], t[1]],
        [t[1], t[2]],
        [t[2], t[0]],
      ] as [number, number][]) {
        const a: number = side[i]!;
        const b: number = side[j]!;
        if (a * b < 0) out.push(add(points[i]!, scale(sub(points[j]!, points[i]!), a / (a - b))));
      }
    return out;
  }

  /** Convex hull, counterclockwise (Andrew's monotone chain). */
  function convexHull(points: V2[]): V2[] {
    const p: V2[] = [...points].sort((a: V2, b: V2): number => a[0] - b[0] || a[1] - b[1]);
    const turn: (o: V2, a: V2, b: V2) => number = (o: V2, a: V2, b: V2): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const half: (list: V2[]) => V2[] = (list: V2[]): V2[] => {
      const h: V2[] = [];
      for (const q of list) {
        while (h.length >= 2 && turn(h[h.length - 2]!, h[h.length - 1]!, q) <= 0) h.pop();
        h.push(q);
      }
      h.pop();
      return h;
    };
    return [...half(p), ...half([...p].reverse())];
  }

  /** Closed polygon perimeter. */
  function perimeter(h: V2[]): number {
    let sum: number = 0;
    for (let k: number = 0; k < h.length; ++k) sum += Math.hypot(h[(k + 1) % h.length]![0] - h[k]![0], h[(k + 1) % h.length]![1] - h[k]![1]);
    return sum;
  }

  function add(a: V3, b: V3): V3 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  function sub(a: V3, b: V3): V3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  function scale(a: V3, s: number): V3 {
    return [a[0] * s, a[1] * s, a[2] * s];
  }

  function dot(a: V3, b: V3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  function cross(a: V3, b: V3): V3 {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  function unit(a: V3): V3 {
    const n: number = Math.hypot(a[0], a[1], a[2]);
    return [a[0] / n, a[1] / n, a[2] / n];
  }
}

void NodeHeadMeasure.run().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
