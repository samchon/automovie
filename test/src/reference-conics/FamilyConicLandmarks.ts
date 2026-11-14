import fs from "node:fs/promises";
import path from "node:path";
import type { AutoMovieLoftFrame, AutoMovieMeshExtract as M } from "@automovie/engine";
import { AutoMovieHumanF1Joints as J } from "@automovie/human";
import type { FamilyConicSection as C } from "./FamilyConicSection";
import { FamilyConicSource as R } from "./FamilyConicSource";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/**
 * Reads, once, the bony landmarks the segment frames need and the joint table lacks, from the reference skin at their palpation sites,
 * each by a written geometric definition, and marks every reading on the reference in two views.
 *
 * Frame: millimetres, forward +X, up +Y, and +Z the stored side, the side whose datums the joint table holds (the reference rig's `_r`
 * joints). The reference is mirror-symmetric in z = 0, so the stored side is read and its twin is the reflection in z = 0.
 *
 * A breadth between two skin readings is checked against the bony breadth's published range (Heinz et al. 2003, women, per side, mean and
 * SD; `packages/human/docs/sources/heinz-2003-body-dimensions.md`): skin over bone reads wider than the caliper's compressed bone, so a
 * skin breadth below the bony mean shows a section that missed the prominences.
 *
 * Usage, from `test/`: `pnpm conic:build` then `node .shots/esbuild/FamilyConicLandmarks.cjs`. It writes `landmarks.txt` and two frames
 * per landmark (`<id>.<view>.png`) under `test/.shots/family-conic-landmarks/<time>/`.
 */
namespace FamilyConicLandmarks {
  type V = R.V;

  /** One reading: the landmark, how it was read, and what to draw with it. */
  interface IReading {
    /** Identifier, also the frames' file stem. */
    id: string;

    /** The landmark's point, mm. */
    point: V;

    /** The written definition the reading follows. */
    definition: string;

    /** Whether the definition found its target inside its search window, and why not if it did not. */
    check: string;

    /** The section or profile the reading was taken on, drawn with the mark, mm. */
    trace: V[][];

    /** The two views the frames show, toward the side the landmark faces. */
    views: [string, string];

    /** Construction points the reading rests on, marked in blue beside the landmark's red cross, mm. */
    marks?: V[];
  }

  /** One section of the ankle's slab: its offset along the shank from the ankle centre, mm, and its two extremes. */
  interface IRow {
    /** Offset along the shank from the ankle centre, mm. */
    t: number;

    /** The section's lateral extreme. */
    lateral: V;

    /** The section's medial extreme. */
    medial: V;
  }

  /** Heinz et al. 2003, women, per side: the bony breadth's mean and SD, mm. */
  const BONY: Record<string, [number, number]> = { elbow: [61.9, 4.2], wrist: [49.4, 3.3], knee: [90.5, 6.0], ankle: [65.2, 4.4] };

  /** A skin breadth set against the published bony breadth, in SDs from its mean. */
  function versus(breadth: number, bone: string): string {
    const [mean, sd]: [number, number] = BONY[bone]!;
    return "skin breadth " + breadth.toFixed(1) + " mm against the bony " + bone + " breadth " + mean + " +- " + sd + " mm (Heinz 2003, women): " + ((breadth - mean) / sd).toFixed(1) + " SD" + (breadth < mean ? ", BELOW THE BONY MEAN" : "");
  }

  /** Read every landmark, write the table and the frames. */
  export async function main(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const source: R.ISource = await R.load(root);
    const readings: IReading[] = [...limbs(source), ...median(source), ...ear(source)];

    const out: string = path.join(root, "test/.shots/family-conic-landmarks", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    NodeCanvasRaster.initialize();
    const lines: string[] = ["f1 landmarks, the stored side (+Z), mm (forward +X, up +Y); the twin is the reflection in z = 0", ""];
    for (const reading of readings) {
      const radius: number = Math.max(110, ...(reading.marks ?? []).map((q: V): number => distance(q, reading.point) + 30));
      const mesh: N.Mesh = crop(source.all, reading.point, radius);
      if (mesh.indices.length === 0) throw new Error("No skin within " + radius + " mm of " + reading.id + " [" + reading.point.join(", ") + "]");
      const bounds: N.Point[] = [];
      for (let i: number = 0; i < mesh.positions.length; i += 3) bounds.push([mesh.positions[i]!, mesh.positions[i + 1]!, mesh.positions[i + 2]!]);
      const pixels: string[] = [];
      for (const view of reading.views) {
        const camera: N.Camera = NodeCanvasCamera.fit(view, bounds, 900, 900);
        const curves: N.Curve[] = [...reading.trace.map((points: V[], k: number): N.Curve => ({ id: "trace" + k, points, closed: false, xray: true, colour: "2f6fd0" })), ...(reading.marks ?? []).flatMap((p: V): N.Curve[] => mark(p, "2f6fd0")), ...mark(reading.point, "e0201c")];
        await fs.writeFile(path.join(out, reading.id + "." + view + ".png"), NodeCanvasRaster.render(camera, [mesh], curves, "depth", "f1 landmark " + reading.id + " | " + view).png);
        const p: N.Point = NodeCanvasCamera.project(reading.point, camera);
        pixels.push(view + " px " + p[0].toFixed(0) + "," + p[1].toFixed(0) + (reading.marks ?? []).map((q: V): string => " (blue " + NodeCanvasCamera.project(q, camera).slice(0, 2).map((x: number): string => x.toFixed(0)).join(",") + ")").join(""));
      }
      lines.push(reading.id + "  [" + reading.point.map((x: number): string => x.toFixed(2)).join(", ") + "]", "  definition: " + reading.definition, "  check: " + reading.check, "  marked: " + pixels.join("; ") + " (red cross, 8 mm arms; blue crosses the construction points)", "");
    }
    await fs.writeFile(path.join(out, "landmarks.txt"), lines.join("\n"));
    process.stdout.write(lines.join("\n") + "\nout " + out + "\n");
  }

  /** The epicondyles, the styloids and the femoral epicondyles on the skin's section square to the bone at its joint, the malleoli over a slab of such sections, and the heel's back. */
  function limbs(source: R.ISource): IReading[] {
    const humerus: V = unit(sub(J.lowerarm, J.upperarm));
    const forearm: V = unit(sub(J.hand, J.lowerarm));

    // The elbow's flexion axis: the normal of the plane the humerus and the forearm span (the reference's elbow stands flexed, so the plane is
    // defined), turned lateral (+Z) and square to the humerus. The epicondyles are the section's two extremes along it.
    const flexion: V = toward(perpendicular(cross(humerus, forearm), humerus), [0, 0, 1]);
    const elbow: V[] = section(source.all, J.lowerarm, humerus, flexion);
    const [el, em]: [V, V] = extremes(elbow, J.lowerarm, flexion);

    // The wrist's section square to the forearm at the wrist centre: the styloids are its diameter's ends (the bistyloid breadth is the
    // wrist's greatest breadth), the radial one the end nearer the thumb's carpometacarpal joint.
    const wrist: V[] = section(source.all, J.hand, forearm, perpendicular([0, 0, 1], forearm));
    const [a, b]: [V, V] = diameter(wrist);
    const [rs, us]: [V, V] = distance(a, J.thumb1) < distance(b, J.thumb1) ? [a, b] : [b, a];

    // Knee and ankle: the reference's knee stands extended, so the flexion axis is taken as the pelvis's Z (the hip centres' line) square to
    // the bone; the extremes along it are the femoral epicondyles and the malleoli, lateral at +Z.
    const femur: V = unit(sub(J.calf, J.thigh));
    const shank: V = unit(sub(J.foot, J.calf));
    const kneeAxis: V = perpendicular([0, 0, 1], femur);
    const ankleAxis: V = perpendicular([0, 0, 1], shank);
    const knee: V[] = section(source.all, J.calf, femur, kneeAxis);
    const [fel, fem]: [V, V] = extremes(knee, J.calf, kneeAxis);

    // The malleoli stand at different heights, the lateral one lower, and one section through the ankle centre read a skin breadth of
    // 60.4 mm, below the bony mean (65.2 mm): it passed beside the prominences. Each malleolus is therefore the extreme along that axis over
    // the sections square to the shank from 25 mm below to 25 mm above the ankle centre, every 1 mm, among the points within 25 mm of the
    // ankle centre fore and aft (the forefoot excluded); each must be an interior maximum of its side's extreme along the shank.
    const fore: V = perpendicular([1, 0, 0], shank);
    const slab: IRow[] = [];
    const ankle: V[][] = [];
    for (let t: number = -25; t <= 25; t += 1) {
      const centre: V = [J.foot[0] + t * shank[0], J.foot[1] + t * shank[1], J.foot[2] + t * shank[2]];
      const loop: V[] = section(source.all, centre, shank, ankleAxis);
      const near: V[] = loop.filter((p: V): boolean => Math.abs(dot(sub(p, centre), fore)) <= 25);
      const [lateral, medial]: [V, V] = extremes(near, J.foot, ankleAxis);
      slab.push({ t, lateral, medial });
      if (t % 5 === 0) ankle.push(loop);
    }
    const along = (p: V): number => dot(sub(p, J.foot), ankleAxis);
    const lmRow: IRow = slab.reduce((a: IRow, b: IRow): IRow => (along(b.lateral) > along(a.lateral) ? b : a));
    const mmRow: IRow = slab.reduce((a: IRow, b: IRow): IRow => (along(b.medial) < along(a.medial) ? b : a));
    const ends = (pick: number, side: (row: IRow) => number): string => {
      const drop: number = Math.min(Math.abs(side(slab[0]!) - pick), Math.abs(side(slab.at(-1)!) - pick));
      return drop >= 0.5 ? "interior, " + drop.toFixed(2) + " mm beyond the nearer slab end" : "REJECTED, AT THE SLAB'S END (" + drop.toFixed(2) + " mm)";
    };
    const lm: V = lmRow.lateral;
    const mm: V = mmRow.medial;
    const lmCheck: string = "at " + lmRow.t + " mm along the shank from the ankle centre, " + ends(along(lm), (row: IRow): number => along(row.lateral));
    const mmCheck: string = "at " + mmRow.t + " mm along the shank from the ankle centre, " + ends(along(mm), (row: IRow): number => along(row.medial));

    // The heel's back: the skin's farthest point behind the ankle centre along the foot's long axis (the ankle centre to the second toe's
    // metatarsophalangeal joint, level), within 30 mm of the sagittal plane through the ankle centre.
    const long: V = unit([J.indextoe1[0] - J.foot[0], 0, J.indextoe1[2] - J.foot[2]]);
    let pternion: V = J.foot;
    for (let i: number = 0; i < source.body.positions.length; i += 3) {
      const p: V = [source.body.positions[i]!, source.body.positions[i + 1]!, source.body.positions[i + 2]!];
      if (p[1] > J.foot[1] || Math.abs(dot(sub(p, J.foot), cross(long, [0, 1, 0]))) > 30 || distance(p, J.foot) > 150) continue;
      if (dot(sub(p, J.foot), long) < dot(sub(pternion, J.foot), long)) pternion = p;
    }

    const square: string = "the skin's section through the joint centre square to the bone's long axis";
    return [
      { id: "epicondyle-lateral", point: el, definition: "EL: on " + square + " (shoulder to elbow centre), the extreme along the elbow's flexion axis (normal of the humerus-forearm plane), lateral side", check: span(elbow) + "; " + versus(distance(el, em), "elbow"), trace: [elbow], views: ["front", "left"] },
      { id: "epicondyle-medial", point: em, definition: "EM: the same section's extreme on the medial side", check: versus(distance(el, em), "elbow"), trace: [elbow], views: ["front", "right"] },
      { id: "styloid-radial", point: rs, definition: "RS: on " + square + " (elbow to wrist centre), the end of the section's diameter nearer the thumb's carpometacarpal joint", check: span(wrist) + "; " + versus(distance(rs, us), "wrist"), trace: [wrist], views: ["front", "left"] },
      { id: "styloid-ulnar", point: us, definition: "US: the other end of that diameter", check: versus(distance(rs, us), "wrist"), trace: [wrist], views: ["front", "right"] },
      { id: "femoral-epicondyle-lateral", point: fel, definition: "FE lateral: on " + square + " (hip to knee centre), the extreme along the pelvis's Z made square to the femur, lateral side", check: span(knee) + "; " + versus(distance(fel, fem), "knee"), trace: [knee], views: ["front", "left"] },
      { id: "femoral-epicondyle-medial", point: fem, definition: "FE medial: the same section's medial extreme", check: versus(distance(fel, fem), "knee"), trace: [knee], views: ["front", "right"] },
      { id: "malleolus-lateral", point: lm, definition: "LM: over the skin's sections square to the shank (knee to ankle centre) from 25 mm below to 25 mm above the ankle centre, every 1 mm, among points within 25 mm of the ankle centre fore and aft, the extreme along the pelvis's Z made square to the shank, lateral side", check: lmCheck + "; " + versus(distance(lm, mm), "ankle"), trace: ankle, views: ["front", "left"] },
      { id: "malleolus-medial", point: mm, definition: "MM: the same slab's medial extreme", check: mmCheck + "; " + versus(distance(lm, mm), "ankle"), trace: ankle, views: ["front", "right"] },
      { id: "pternion", point: pternion, definition: "the skin vertex farthest behind the ankle centre along the foot's level long axis (ankle centre to the second toe's MTP joint), below the ankle centre, within 30 mm of the foot's sagittal plane and 150 mm of the ankle centre", check: (Math.abs(dot(sub(pternion, J.foot), cross(long, [0, 1, 0]))) < 29 && distance(pternion, J.foot) < 149 ? "interior: " : "REJECTED, ON A WINDOW'S BOUND: ") + "behind the ankle centre by " + (-dot(sub(pternion, J.foot), long)).toFixed(1) + " mm, " + Math.abs(dot(sub(pternion, J.foot), cross(long, [0, 1, 0]))).toFixed(1) + " mm off the foot's sagittal plane (bound 30), " + distance(pternion, J.foot).toFixed(1) + " mm from the ankle centre (bound 150)", trace: [], views: ["left", "back"] },
    ];
  }

  /** The suprasternal notch, the vertebra prominens, and the nose's nasion, pronasale and subnasale on the median section. */
  function median(source: R.ISource): IReading[] {
    // The median section's outer loop round a point inside the neck (the body and head skins meet at the neck, so the cut bridges their
    // rims), and the head's outer loop round a point inside the head: the chart is (x, y) about each point.
    const outer = (mesh: M.IMesh, inside: V): C.P[] => {
      const loop: C.P[] | null = R.cut(mesh, { origin: inside, u: [1, 0, 0], v: [0, 1, 0] } as AutoMovieLoftFrame.IFrame).loop;
      if (loop === null) throw new Error("No median loop round " + inside.join(","));
      return loop.map((p: C.P): C.P => [p[0] + inside[0], p[1] + inside[1]]);
    };
    const body: C.P[] = outer(source.all, [0, 1400, 0]);
    const head: C.P[][] = [outer(source.all, [40, 1560, 0])];
    const profile = (loops: C.P[][], y: number, sense: 1 | -1): number => {
      const crossings: number[] = loops.flatMap((loop: C.P[]): number[] => level(loop, y).map((x: number): number => sense * x));
      return crossings.length === 0 ? Number.NaN : Math.max(...crossings) * sense;
    };
    const search = (loops: C.P[][], y0: number, y1: number, sense: 1 | -1, goal: "max" | "min"): { y: number; x: number; check: string; trace: V[] } => {
      const rows: [number, number][] = [];
      for (let y: number = y0; y <= y1 + 1e-9; y += 0.25) rows.push([y, profile(loops, y, sense)]);
      const pick: [number, number] = rows.reduce((a: [number, number], b: [number, number]): [number, number] => ((goal === "min" ? b[1] < a[1] : b[1] > a[1]) ? b : a));
      const rise: number = Math.min(Math.abs(rows[0]![1] - pick[1]), Math.abs(rows.at(-1)![1] - pick[1]));
      const interior: boolean = pick[0] > y0 + 2 && pick[0] < y1 - 2 && rise >= 0.5;
      return { y: pick[0], x: pick[1], check: (interior ? "interior " : "REJECTED, AT THE WINDOW'S END: ") + goal + " of the profile over y " + y0.toFixed(2) + ".." + y1.toFixed(2) + ", depth to the nearer window end " + rise.toFixed(2) + " mm", trace: rows.map(([y, x]: [number, number]): V => [x, y, 0]) };
    };

    // IJ: the front median profile's pit between the larynx and the sternum.
    const ij = search([body], 1330, 1430, 1, "min");

    // C7 (cervicale as body-scan landmarking reads it): between the cervical lordosis's apex (the back profile's most anterior point on the
    // neck) and the thoracic kyphosis's apex (its most posterior point on the upper back), the profile point farthest behind the chord
    // joining the two apexes: the convex shoulder where the neck's hollow turns into the back. Under 1 mm behind the chord the skin does
    // not show it.
    const lordosis = search([body], 1420, 1520, -1, "max");
    const kyphosis = search([body], 1200, 1400, -1, "min");
    let c7: { y: number; x: number; behind: number } = { y: kyphosis.y, x: kyphosis.x, behind: 0 };
    const back: V[] = [];
    for (let y: number = kyphosis.y; y <= lordosis.y + 1e-9; y += 0.25) {
      const x: number = profile([body], y, -1);
      back.push([x, y, 0]);
      const chord: number = kyphosis.x + ((lordosis.x - kyphosis.x) * (y - kyphosis.y)) / (lordosis.y - kyphosis.y);
      const behind: number = ((chord - x) * (lordosis.y - kyphosis.y)) / Math.hypot(lordosis.x - kyphosis.x, lordosis.y - kyphosis.y);
      if (behind > c7.behind) c7 = { y, x, behind };
    }
    // Heights against stature (the skin's highest point): ANSUR II women, suprasternale 0.8164 (0.0071), cervicale 0.8570 (0.0068), their
    // difference 0.0405 (0.0071) of stature (`packages/human/docs/sources/ansur-ii-trunk-ratios.md`).
    let stature: number = 0;
    for (let i: number = 1; i < source.all.positions.length; i += 3) stature = Math.max(stature, source.all.positions[i]!);
    const ratio = (y: number, mean: number, sd: number): string => (y / stature).toFixed(4) + " of stature " + stature.toFixed(1) + " mm against " + mean + " +- " + sd + " (ANSUR II women): " + ((y / stature - mean) / sd).toFixed(1) + " SD";
    ij.check += "; height " + ratio(ij.y, 0.8164, 0.0071);
    const c7check: string = "height " + ratio(c7.y, 0.857, 0.0068) + "; cervicale less suprasternale " + ratio(c7.y - ij.y, 0.0405, 0.0071) + "; " +(c7.behind >= 1 ? "read: " : "REJECTED, THE SKIN DOES NOT SHOW C7: ") + c7.behind.toFixed(2) + " mm behind the chord; lordosis apex [" + lordosis.x.toFixed(2) + ", " + lordosis.y.toFixed(2) + "] (" + lordosis.check + "); kyphosis apex [" + kyphosis.x.toFixed(2) + ", " + kyphosis.y.toFixed(2) + "] (" + kyphosis.check + ")";
    const prn = search(head, 1535, 1575, 1, "max");
    const n = search(head, prn.y + 15, prn.y + 50, 1, "min");
    const sn = search(head, prn.y - 22, prn.y - 4, 1, "min");
    return [
      { id: "suprasternale", point: [ij.x, ij.y, 0], definition: "IJ: on the median section (z = 0), the front profile's most posterior point between 1,330 and 1,430 mm high (the pit between the larynx and the manubrium)", check: ij.check, trace: [ij.trace], views: ["front", "left"] },
      { id: "vertebra-prominens", point: [c7.x, c7.y, 0], definition: "C7: on the median section's back profile, between the cervical lordosis's apex (most anterior point, 1,420 to 1,520 mm) and the thoracic kyphosis's apex (most posterior point, 1,200 to 1,400 mm), the point farthest behind the chord joining them", check: c7check, trace: [back, [[lordosis.x, lordosis.y, 0], [kyphosis.x, kyphosis.y, 0]]], views: ["back", "left"], marks: [[lordosis.x, lordosis.y, 0], [kyphosis.x, kyphosis.y, 0]] },
      { id: "pronasale", point: [prn.x, prn.y, 0], definition: "prn: on the head's median section, the most anterior point of the front profile between 1,535 and 1,575 mm high", check: prn.check, trace: [prn.trace], views: ["front", "left"] },
      { id: "nasion", point: [n.x, n.y, 0], definition: "n: the front profile's most posterior point from 15 to 50 mm above pronasale (the root of the nose)", check: n.check, trace: [n.trace], views: ["front", "left"] },
      { id: "subnasale", point: [sn.x, sn.y, 0], definition: "sn: the front profile's most posterior point from 22 to 4 mm below pronasale (where the columella meets the upper lip)", check: sn.check, trace: [sn.trace], views: ["front", "left"] },
    ];
  }

  /** The tragus's crest, at the concha's deepest point's height in front of the concha. */
  function ear(source: R.ISource): IReading[] {
    // The horizontal section of the head at the concha's floor height; in front of the concha's deepest point (up to 20 mm forward), the
    // outline point standing farthest out (+Z) is the tragus's crest. Farkas's tragion is the notch at the tragus's upper margin, a few
    // millimetres above the crest; the head frame uses this reading only for its origin, the bitragion midpoint.
    const y: number = J.conchaRoot[1];
    const loops: C.P[][] = R.loops(source.head, { origin: [0, y, 0], u: [1, 0, 0], v: [0, 0, 1] });
    let best: V | null = null;
    const trace: V[] = [];
    for (const loop of loops)
      for (const p of loop) {
        const w: V = [p[0], y, p[1]];
        if (w[2] < 50 || w[0] < J.conchaRoot[0] - 30 || w[0] > J.conchaRoot[0] + 40) continue;
        trace.push(w);
        if (w[0] >= J.conchaRoot[0] && w[0] <= J.conchaRoot[0] + 20 && (best === null || w[2] > best[2])) best = w;
      }
    if (best === null) throw new Error("No outline in front of the concha");
    trace.sort((a: V, b: V): number => a[0] - b[0]);
    return [{ id: "tragion", point: best, definition: "t: on the head's level section through the concha's deepest point (" + y + " mm), the outline point farthest out (+Z) from 0 to 20 mm in front of that point (the tragus's crest)", check: (best[0] - J.conchaRoot[0] > 1 && best[0] - J.conchaRoot[0] < 19 ? "interior: " : "REJECTED, AT THE WINDOW'S END: ") + "forward of the concha's deepest point by " + (best[0] - J.conchaRoot[0]).toFixed(1) + " mm (window 0 to 20 mm)", trace: [trace], views: ["left", "top"] }];
  }

  /** The skin's section through `origin` square to `normal`, as world points of the loop round the origin. */
  function section(mesh: M.IMesh, origin: V, normal: V, u: V): V[] {
    const v: V = cross(normal, u);
    const loop: C.P[] | null = R.cut(mesh, { origin, u, v }).loop;
    if (loop === null) throw new Error("No skin round " + origin.join(","));
    const out: V[] = loop.map((p: C.P): V => [origin[0] + p[0] * u[0] + p[1] * v[0], origin[1] + p[0] * u[1] + p[1] * v[1], origin[2] + p[0] * u[2] + p[1] * v[2]]);
    return [...out, out[0]!];
  }

  /** A section's two extremes along `axis`: the one farthest along it first. */
  function extremes(loop: V[], origin: V, axis: V): [V, V] {
    const along = (p: V): number => dot(sub(p, origin), axis);
    return [loop.reduce((a: V, b: V): V => (along(b) > along(a) ? b : a)), loop.reduce((a: V, b: V): V => (along(b) < along(a) ? b : a))];
  }

  /** The farthest pair of a section's points. */
  function diameter(loop: V[]): [V, V] {
    let best: [V, V] = [loop[0]!, loop[0]!];
    for (const a of loop) for (const b of loop) if (distance(a, b) > distance(best[0], best[1])) best = [a, b];
    return best;
  }

  /** A section's extent, for the check line. */
  function span(loop: V[]): string {
    return "section of " + (loop.length - 1) + " points, perimeter " + loop.slice(1).reduce((s: number, p: V, i: number): number => s + distance(p, loop[i]!), 0).toFixed(1) + " mm";
  }

  /** Where a closed chart polygon crosses the level `v = y`: the `u` of each crossing. */
  function level(loop: readonly C.P[], y: number): number[] {
    const out: number[] = [];
    for (let i: number = 0; i < loop.length; ++i) {
      const a: C.P = loop[i]!;
      const b: C.P = loop[(i + 1) % loop.length]!;
      if (a[1] > y !== b[1] > y) out.push(a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]));
    }
    return out;
  }

  /** The skin's triangles whose vertices all lie within `radius` of `centre`, so no other part hides the landmark. */
  function crop(mesh: M.IMesh, centre: V, radius: number): N.Mesh {
    const positions: number[] = [];
    const indices: number[] = [];
    const remap: Map<number, number> = new Map();
    const near = (i: number): boolean => distance([mesh.positions[3 * i]!, mesh.positions[3 * i + 1]!, mesh.positions[3 * i + 2]!], centre) <= radius;
    for (let t: number = 0; t + 2 < mesh.indices.length; t += 3) {
      const tri: number[] = [mesh.indices[t]!, mesh.indices[t + 1]!, mesh.indices[t + 2]!];
      if (!tri.every(near)) continue;
      for (const i of tri) {
        let j: number | undefined = remap.get(i);
        if (j === undefined) {
          j = positions.length / 3;
          remap.set(i, j);
          positions.push(mesh.positions[3 * i]!, mesh.positions[3 * i + 1]!, mesh.positions[3 * i + 2]!);
        }
        indices.push(j);
      }
    }
    return { id: "reference", positions, indices, colour: [0.64, 0.65, 0.67] };
  }

  /** A cross of 8 mm arms along the three axes in the given colour, drawn through the skin. */
  function mark(p: V, colour: string): N.Curve[] {
    return [0, 1, 2].map((c: number): N.Curve => {
      const a: V = [...p];
      const b: V = [...p];
      a[c] = a[c]! - 8;
      b[c] = b[c]! + 8;
      return { id: "mark" + c, points: [a, b], closed: false, xray: true, colour };
    });
  }

  function sub(a: V, b: V): V {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  function dot(a: V, b: V): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  function cross(a: V, b: V): V {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  function distance(a: V, b: V): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }

  function unit(a: V): V {
    const l: number = Math.hypot(a[0], a[1], a[2]);
    return [a[0] / l, a[1] / l, a[2] / l];
  }

  /** `a` made square to the unit `n`, unit. */
  function perpendicular(a: V, n: V): V {
    const d: number = dot(a, n);
    return unit([a[0] - d * n[0], a[1] - d * n[1], a[2] - d * n[2]]);
  }

  /** `a` or its opposite, whichever points along `hint`. */
  function toward(a: V, hint: V): V {
    return dot(a, hint) >= 0 ? a : [-a[0], -a[1], -a[2]];
  }
}
void FamilyConicLandmarks.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
  process.exitCode = 1;
});
