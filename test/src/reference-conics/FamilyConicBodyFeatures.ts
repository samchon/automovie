import { FamilyConicSource as R } from "./FamilyConicSource";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";
import {
  AutoMovieHumanF1Joints as J,
  AutoMovieHumanF1Landmarks as L,
} from "@automovie/human/capture";
import type { IAutoMovieMillimeterMesh } from "@automovie/interface";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Reads on the f1 reference, in one run, the surface landmarks the body's feature templates are placed by and each feature's footprint
 * and height over the skin round it, on the stored side (+Z) and the median plane only.
 *
 * Frame: millimetres, forward +X, up +Y, +Z the stored side (the reference rig's `_r` joints). The twin is the reflection in z = 0.
 *
 * One rule serves every landmark. A published definition names a bony point by palpation ("the most prominent point of", "the superior
 * point of", "the centre of"); on a skin a tool can apply it only where the bone shows, and what shows is a height over the skin round
 * it. So each landmark is a window and an extremum:
 *
 * - The window is fixed by joint centres and segment directions: an origin inside the body, an outward direction, a long direction
 *   and two half extents, mm. The skin's height over the window is the distance from the origin's plane (`plane` chart: parallel rays
 *   along the outward direction) or from the segment's axis (`axis` chart: rays square to the axis, fanned about it, the arc measured
 *   at the centre ray's radius) to the first skin a ray leaves the body through.
 * - The surrounding skin continued across the window is the baseline. For a point feature it is the cubic polynomial fitted by least
 *   squares to the window's rim (elliptical radius 0.8 to 1); for a line feature (a ridge or a groove that leaves the window at both
 *   ends) it is, at every station along the line, the quadratic through that station's two side bands (0.7 to 1 of the half width).
 * - The landmark is the residual's extremum inside the rim: the greatest for a prominence or a ridge, the least for a hollow or a
 *   groove. It is FOUND only when it stands inside 0.7 of the window and over the floor: 0.5 mm (the floor
 *   `FamilyConicLandmarks.ts` rejects its own readings under), three times the baseline's own residual on the rim, and three times the root mean square of the opposite-signed residual inside the rim: a baseline that misfits smooth skin leaves both signs alike, a feature leaves one. A line is
 *   found when six stations in ten find it. Anything else is recorded as not found; no landmark is placed by eye.
 *
 * The same reading is the feature's size: its height is the extremum's residual, its half widths are where the residual falls to half
 * along the window's two directions, and the template's half extent is that half width over 0.4542, the radius at which the template's
 * bump `(1 - r^2)^3` is at half height (`AutoMovieHumanFeatureTemplate.height`). A half width that reaches the rim before the residual
 * halves is recorded as open. Every size is also given over its window's scale (a bony breadth, a segment's length or the stature), so
 * a prior read here is a share, never f1's millimetres.
 *
 * The acromion alone is read by a chord rule, because a shoulder is a convex corner and has no rim: on the shoulder's top profile in
 * the coronal plane through the shoulder joint's centre, from four tenths of that centre's breadth to the deltoid's last skin at the
 * centre's height, it is the point farthest above the chord of the two ends (the rule the stored cervicale reading uses).
 *
 * Definitions follow the ANSUR II measurer's handbook (Hotzman et al. 2011, NATICK/TR-11/017, chapter 5: acromion, cervicale,
 * suprasternale, iliocristale, omphalion, olecranon, midpatella and suprapatella, lateral and medial malleolus), ISO 7250-1:2017
 * (`packages/human/docs/sources/iso-7250-1-2017.md`) and the ISB recommendations as the stored landmarks cite them (Wu et al. 2002,
 * 2005: SC, AA, TS, AI, EL, EM, RS, US, ASIS, PSIS, the malleoli). Each window's line in `landmarks.txt` quotes its definition.
 *
 * Usage, from `test/`: bundle this file with esbuild into `.shots/esbuild/FamilyConicBodyFeatures.cjs` (the options of `conic:build`),
 * then `node .shots/esbuild/FamilyConicBodyFeatures.cjs [--mode=landmarks|features] [--out=<dir>]`. Both modes read every window once;
 * the mode chooses the table printed. It writes `landmarks.txt`, `features.txt` and two stills per region under
 * `packages/human/.shots/body-one-shot/<out>/`. The run takes seconds.
 */
namespace FamilyConicBodyFeatures {
  type V = R.V;

  /** What a window looks for. */
  type Kind = "prominence" | "hollow" | "ridge" | "groove";

  /** One landmark's window. */
  interface IWindow {
    /** Identifier. */
    id: string;

    /** The region whose stills show it. */
    group: string;

    /** What it looks for. */
    kind: Kind;

    /** The published definition and how the window applies it. */
    definition: string;

    /** A point inside the body the rays start from, mm. */
    origin: V;

    /** The unit direction out of the skin. */
    out: V;

    /** The unit long direction, square to `out`. */
    along: V;

    /** Half extents along and across, mm. */
    half: [number, number];

    /** How the window is laid on the skin. */
    chart: "plane" | "axis";

    /** The length sizes are given over, mm, and what it is. */
    scale: [number, string];
  }

  /** A residual extremum. */
  interface IPeak {
    /** Place in the window, mm. */
    x: number;

    /** Place across the window, mm. */
    y: number;

    /** Residual, mm. */
    value: number;

    /** The skin point, mm. */
    point: V;
  }

  /** One window read. */
  interface IReading {
    /** The window. */
    window: IWindow;

    /** Whether the rule found its landmark, and the numbers that say so. */
    found: boolean;

    /** The numbers behind `found`. */
    check: string;

    /** The landmark: the extremum, or for a line its found stations' extrema in order. */
    points: V[];

    /** The feature's size line. */
    size: string;

    /** The window's edge on the skin. */
    border: V[];
  }

  /** The radius of the template's bump at half height: `(1 - r^2)^3 = 1/2`. */
  const HALF_RADIUS: number = Math.sqrt(1 - 0.5 ** (1 / 3));

  /** The least residual a landmark is read at, mm: the floor `FamilyConicLandmarks.ts` rejects its own readings under. */
  const FLOOR: number = 0.5;

  /** Read every window, write the tables and the stills. */
  export async function main(): Promise<void> {
    const args: string[] = process.argv.slice(2);
    const option = (name: string, fallback: string): string => args.find((a: string): boolean => a.startsWith("--" + name + "="))?.slice(name.length + 3) ?? fallback;
    const mode: string = option("mode", "landmarks");
    const root: string = path.resolve(process.cwd(), "..");
    const source: R.ISource = await R.load(root);
    const tris: Float64Array = triangles(source.all);
    let stature: number = 0;
    for (let i: number = 1; i < source.all.positions.length; i += 3) stature = Math.max(stature, source.all.positions[i]!);

    const all: IWindow[] = windows(source, tris, stature);
    const readings: IReading[] = [shoulder(tris, stature), ...all.map((w: IWindow): IReading => read(w, tris))];

    const out: string = path.join(root, "packages/human/.shots/body-one-shot", option("out", "features-" + new Date().toISOString().replaceAll(":", "-")));
    await fs.mkdir(out, { recursive: true });
    NodeCanvasRaster.initialize();
    const pixels: Map<string, string[]> = new Map();
    for (const group of [...new Set(readings.map((r: IReading): string => r.window.group))]) {
      const members: IReading[] = readings.filter((r: IReading): boolean => r.window.group === group);
      const cloud: V[] = members.flatMap((r: IReading): V[] => [...r.border, ...r.points]);
      const centre: V = [0, 1, 2].map((c: number): number => cloud.reduce((s: number, p: V): number => s + p[c]!, 0) / cloud.length) as V;
      const radius: number = Math.max(...cloud.map((p: V): number => distance(p, centre))) + 60;
      const mesh: N.Mesh = crop(source.all, centre, radius);
      const bounds: N.Point[] = cloud.map((p: V): N.Point => [...p]);
      for (const view of VIEWS[group] ?? ["front", "left"]) {
        const camera: N.Camera = NodeCanvasCamera.fit(view, bounds, 1000, 1000);
        const curves: N.Curve[] = members.flatMap((r: IReading): N.Curve[] => [
          { id: r.window.id + ".border", points: r.border, closed: true, xray: true, colour: r.found ? "2f9d4f" : "2f6fd0" },
          ...(r.found && r.points.length > 1 ? [{ id: r.window.id + ".line", points: r.points, closed: false, xray: true, colour: "e0201c" }] : []),
          ...(r.found ? [r.points[0]!, r.points.at(-1)!].flatMap((p: V): N.Curve[] => mark(p, r.window.id)) : []),
        ]);
        await fs.writeFile(path.join(out, group + "." + view + ".png"), NodeCanvasRaster.render(camera, [mesh], curves, "depth", "f1 landmarks " + group + " | " + view + " | green window found, blue not found, red the landmark").png);
        for (const r of members) {
          const at = (p: V): string => NodeCanvasCamera.project(p, camera).slice(0, 2).map((x: number): string => x.toFixed(0)).join(",");
          const list: string[] = pixels.get(r.window.id) ?? [];
          list.push(group + "." + view + " px " + (r.found ? at(r.points[0]!) + (r.points.length > 1 ? " to " + at(r.points.at(-1)!) : "") : "window about " + at(r.border[0]!)));
          pixels.set(r.window.id, list);
        }
      }
    }

    const head: string = "f1, the stored side (+Z) and the median plane, mm (forward +X, up +Y); stature " + stature.toFixed(1) + " mm";
    const landmarks: string[] = [head, "found " + readings.filter((r: IReading): boolean => r.found).length + " of " + readings.length, ""];
    const features: string[] = [head, "height: the extremum's residual over the surrounding skin; half widths where it halves (open: the rim came first); template half extent = half width / " + HALF_RADIUS.toFixed(4), ""];
    for (const r of readings) {
      const place: string = r.points.length === 0 ? "" : "  [" + r.points[0]!.map((x: number): string => x.toFixed(1)).join(", ") + "]" + (r.points.length > 1 ? " to [" + r.points.at(-1)!.map((x: number): string => x.toFixed(1)).join(", ") + "], " + r.points.length + " stations" : "");
      landmarks.push(r.window.id + " (" + r.window.kind + "): " + (r.found ? "FOUND" + place : "NOT FOUND"), "  definition: " + r.window.definition, "  check: " + r.check, "  stills: " + (pixels.get(r.window.id) ?? []).join("; "), "");
      features.push(r.window.id + " (" + r.window.kind + (r.found ? "" : ", NOT FOUND") + "): " + r.size, "");
    }
    await fs.writeFile(path.join(out, "landmarks.txt"), landmarks.join("\n"));
    await fs.writeFile(path.join(out, "features.txt"), features.join("\n"));
    process.stdout.write((mode === "features" ? features : landmarks).join("\n") + "\nout " + out + "\n");
  }

  /** The two views each region's still is drawn from. */
  const VIEWS: Record<string, [string, string]> = {
    "neck-front": ["front", "high-oblique"],
    "shoulder": ["front", "top"],
    "back-upper": ["back", "left"],
    "back-lower": ["back", "left"],
    "pelvis-front": ["front", "left"],
    "neck-side": ["left", "front"],
    "elbow": ["back", "left"],
    "wrist": ["left", "front"],
    "hand-dorsum": ["top", "left"],
    "hand-palm": ["low-oblique", "front"],
    "knee": ["front", "left"],
    "ankle": ["left", "back"],
    "ankle-medial": ["right", "back"],
  };

  /** Every window, each fixed by joint centres and segment directions. */
  function windows(source: R.ISource, tris: Float64Array, stature: number): IWindow[] {
    const rig = (name: string): V => {
      const p: V | undefined = source.joints.get(name);
      if (p === undefined) throw new Error("The reference rig has no joint " + name);
      return p;
    };
    const X: V = [1, 0, 0];
    const Y: V = [0, 1, 0];
    const Z: V = [0, 0, 1];
    const tall: [number, string] = [stature, "stature"];
    const ij: V = L.suprasternale;
    const neck: V = rig("neck_01");
    const pelvis: V = rig("pelvis");
    const back: number = rig("spine_05")[0];
    const gh: V = J.upperarm;
    const hipHeight: number = (rig("spine_01")[1] + rig("spine_02")[1]) / 2;

    // The arm: the humerus and the forearm, the elbow's flexion axis as the stored epicondyles' reading takes it, and the outside of
    // the bend (the olecranon's side), opposite the bisector of the two bones.
    const humerus: V = unit(sub(J.lowerarm, J.upperarm));
    const forearm: V = unit(sub(J.hand, J.lowerarm));
    const flexion: V = toward(perpendicular(cross(humerus, forearm), humerus), Z);
    const bend: V = unit(sub(scale(humerus, 1), forearm));
    const elbow: [number, string] = [distance(L.epicondyleLateral, L.epicondyleMedial), "skin breadth over the humeral epicondyles"];
    const wrist: [number, string] = [distance(L.styloidRadial, L.styloidUlnar), "skin breadth over the styloids"];

    // The hand: its long direction is the wrist's centre to the third metacarpal's head, its dorsal direction the rig's knuckle point
    // less its palm point at that head, made square to the long direction.
    const ray3: V = unit(sub(J.middle1, J.hand));
    const dorsal: V = perpendicular(sub(rig("middle_01_mcp_r"), rig("middle_01_palm_r")), ray3);
    const palmar: V = scale(dorsal, -1);
    const hand: [number, string] = [distance(J.hand, J.middle1), "wrist's centre to the third metacarpal's head"];
    const tendon = (name: string, head: V): IWindow => {
      const line: V = sub(head, J.hand);
      const out: V = perpendicular(dorsal, unit(line));
      return { id: "extensor-tendon-" + name, group: "hand-dorsum", kind: "ridge", definition: "the extensor digitorum's tendon to the " + name + " finger: a ridge on the dorsum between the wrist's centre and that finger's metacarpal head, read over the middle seven tenths of that line, 8 mm to either side", origin: mid(J.hand, head), out, along: unit(line), half: [0.35 * norm(line), 8], chart: "plane", scale: hand };
    };
    const pad = (id: string, from: V, to: V, half: number, definition: string): IWindow => {
      const line: V = sub(to, from);
      const out: V = perpendicular(palmar, unit(line));
      return { id, group: "hand-palm", kind: "prominence", definition, origin: mid(from, to), out, along: unit(line), half: [0.6 * norm(line), half], chart: "plane", scale: hand };
    };

    // The leg: the femur and the shank; the knee stands extended, so the flexion axis is the hip centres' line (+Z) made square to
    // the bone, as the stored femoral epicondyles' reading takes it, and the front is +X made square to the bone.
    const femur: V = unit(sub(J.calf, J.thigh));
    const shank: V = unit(sub(J.foot, J.calf));
    const knee: [number, string] = [distance(L.femoralEpicondyleLateral, L.femoralEpicondyleMedial), "skin breadth over the femoral epicondyles"];
    const lateral: V = perpendicular(Z, shank);
    const ankleBreadth: number = cast(tris, J.foot, lateral) + cast(tris, J.foot, scale(lateral, -1));
    const ankle: [number, string] = [ankleBreadth, "skin breadth through the ankle's centre along the hip centres' line"];

    // The neck's side: the mastoid's window stands behind and below the concha's deepest point; the sternocleidomastoid runs from it to
    // the clavicle's medial head beside the jugular notch, and its window stands on the neck's axis under the line's middle.
    const mastoid: V = [J.conchaRoot[0] - 25, J.conchaRoot[1] - 15, 0.45 * J.conchaRoot[2]];
    const scmFrom: V = [J.conchaRoot[0] - 25, J.conchaRoot[1] - 25, J.conchaRoot[2] - 10];
    const scmTo: V = [ij[0], ij[1], 24];
    const scmLine: V = sub(scmTo, scmFrom);
    const axis: V = unit(sub(rig("head"), neck));
    const under: V = add(neck, scale(axis, dot(sub(mid(scmFrom, scmTo), neck), axis)));
    const scmOut: V = perpendicular(sub(mid(scmFrom, scmTo), under), unit(scmLine));

    return [
      { id: "suprasternal-notch", group: "neck-front", kind: "hollow", definition: "suprasternale, 'inferior point of the jugular notch of the sternum' (ANSUR II handbook p. 63): the hollow on the front median about the stored suprasternale, 28 mm each way", origin: [neck[0], ij[1], 0], out: X, along: Y, half: [28, 28], chart: "plane", scale: tall },
      { id: "sternoclavicular", group: "neck-front", kind: "prominence", definition: "SC, 'most ventral point on the sternoclavicular joint' (Wu et al. 2005, 2.3.1), the clavicle's medial head and the manubrium's corner the sternocleidomastoid starts from: the prominence at suprasternale's height from the median plane 52 mm out", origin: [neck[0], ij[1], 26], out: X, along: Y, half: [24, 26], chart: "plane", scale: tall },
      { id: "clavicle", group: "shoulder", kind: "ridge", definition: "the clavicle's line from the sternoclavicular joint to the 'clavicle point', the 'superior points of the lateral ends of the clavicles' (ANSUR II handbook p. 29): a ridge running out along +Z, seen from in front and above (+X +Y), read from a point at the shoulder joint's height and six tenths of its breadth", origin: [rig("clavicle_r")[0], gh[1], 0.6 * gh[2]], out: unit([1, 1, 0]), along: Z, half: [60, 32], chart: "plane", scale: tall },
      { id: "sternal-channel", group: "neck-front", kind: "groove", definition: "the sternum's channel on the front median, from suprasternale down 180 mm, 35 mm to either side", origin: [back, ij[1] - 100, 0], out: X, along: Y, half: [90, 35], chart: "plane", scale: tall },
      { id: "cervicale", group: "back-upper", kind: "prominence", definition: "cervicale, 'most prominent palpable point of the spine of the seventh cervical vertebra' (ANSUR II handbook p. 27): the prominence on the back median within three SDs of women's cervicale height, 0.8570 (0.0068) of stature (`packages/human/docs/sources/ansur-ii-trunk-ratios.md`)", origin: [neck[0], 0.857 * stature, 0], out: scale(X, -1), along: Y, half: [3 * 0.0068 * stature, 30], chart: "plane", scale: tall },
      { id: "scapular-spine", group: "back-upper", kind: "ridge", definition: "the scapula's spine from its root TS to the acromial angle AA (Wu et al. 2005, 2.3.3): a ridge running out along +Z, seen from behind and above, read from a point at the shoulder joint's height and three quarters of its breadth", origin: [back, gh[1], 0.75 * gh[2]], out: unit([-1, 0.7, 0]), along: Z, half: [50, 35], chart: "plane", scale: tall },
      { id: "scapula-medial-border", group: "back-upper", kind: "ridge", definition: "the scapula's medial border from the spine's root TS to the inferior angle AI (Wu et al. 2005, 2.3.3): a ridge running up the back at half the shoulder joint's breadth, between the latissimus joint's height and the shoulder joint's", origin: [back, (rig("spine_04_latissimus_r")[1] + gh[1]) / 2, 0.5 * gh[2]], out: scale(X, -1), along: Y, half: [55, 30], chart: "plane", scale: tall },
      { id: "scapula-inferior-angle", group: "back-upper", kind: "prominence", definition: "AI, 'angulus inferior, most caudal point of the scapula' (Wu et al. 2005, 2.3.3): the prominence on the back at the rig's latissimus joint's height and its scapula joint's breadth", origin: [back, rig("spine_04_latissimus_r")[1], rig("clavicle_scap_r")[2]], out: scale(X, -1), along: Y, half: [50, 45], chart: "plane", scale: tall },
      { id: "spinal-furrow", group: "back-lower", kind: "groove", definition: "the spinous processes' line, the 'midspine' line down the centre of the back (ANSUR II handbook p. 50): a groove on the back median between the rig's first and fifth spine joints, 45 mm to either side", origin: [back, (rig("spine_01")[1] + rig("spine_05")[1]) / 2, 0], out: scale(X, -1), along: Y, half: [(rig("spine_05")[1] - rig("spine_01")[1]) / 2, 45], chart: "plane", scale: tall },
      { id: "sacral-dimple", group: "back-lower", kind: "hollow", definition: "PSIS, the posterior superior iliac spine (Wu et al. 2002, 2.1), which the sacral dimple overlies: the hollow on the back between the rig's first and second spine joints' heights, from 9 to 79 mm off the median plane", origin: [pelvis[0], hipHeight, 0.45 * J.thigh[2]], out: scale(X, -1), along: Y, half: [45, 35], chart: "plane", scale: tall },
      { id: "anterior-superior-iliac-spine", group: "pelvis-front", kind: "prominence", definition: "ASIS, the anterior superior iliac spine (Wu et al. 2002, 2.1): the prominence on the front between the rig's first and second spine joints' heights, about 1.15 of the hip centre's breadth", origin: [pelvis[0], hipHeight, 1.15 * J.thigh[2]], out: unit([1, 0, 0.3]), along: Y, half: [40, 35], chart: "plane", scale: tall },
      { id: "iliocristale", group: "pelvis-front", kind: "prominence", definition: "iliocristale, 'highest palpable point of the iliac crests of the pelvis, one half the distance between the anterior superior iliac and posterior superior iliac spines' (ANSUR II handbook p. 39): the prominence on the flank within three SDs of women's iliocristale height, 0.6113 (0.0129) of stature (`packages/human/docs/sources/ansur-ii-trunk-ratios.md`)", origin: [pelvis[0], 0.6113 * stature, 0.6 * J.thigh[2]], out: Z, along: Y, half: [3 * 0.0129 * stature, 45], chart: "plane", scale: tall },
      { id: "omphalion", group: "pelvis-front", kind: "hollow", definition: "omphalion, 'center of the navel' (ANSUR II handbook p. 70): the hollow on the front median within three SDs of women's omphalion height, 0.6017 (0.0135) of stature (`packages/human/docs/sources/ansur-ii-trunk-ratios.md`)", origin: [pelvis[0], 0.6017 * stature, 0], out: X, along: Y, half: [3 * 0.0135 * stature, 30], chart: "plane", scale: tall },
      { id: "mastoid", group: "neck-side", kind: "prominence", definition: "the mastoid process, the sternocleidomastoid's insertion: the prominence behind and below the concha's deepest point (25 mm behind, 15 mm below)", origin: mastoid, out: unit([-0.3, 0, 1]), along: Y, half: [25, 22], chart: "plane", scale: tall },
      { id: "sternocleidomastoid", group: "neck-side", kind: "ridge", definition: "the sternocleidomastoid's line from the mastoid process to the manubrium beside the jugular notch: a ridge over the middle eight tenths of that line, 24 mm to either side, read from the neck's axis", origin: under, out: scmOut, along: unit(scmLine), half: [0.4 * norm(scmLine), 24], chart: "plane", scale: tall },
      { id: "olecranon", group: "elbow", kind: "prominence", definition: "olecranon, 'rearmost point of the elbow' and 'point on the center of the curvature of the olecranon process' (ANSUR II handbook pp. 22, 52): the prominence on the outside of the elbow's bend, opposite the bisector of the humerus and the forearm", origin: J.lowerarm, out: perpendicular(bend, flexion), along: unit(cross(flexion, perpendicular(bend, flexion))), half: [35, 26], chart: "plane", scale: elbow },
      { id: "epicondyle-lateral", group: "elbow", kind: "prominence", definition: "EL, 'most caudal point on lateral epicondyle' (Wu et al. 2005, 2.3.4): the prominence about the elbow's flexion axis on the lateral side, 30 mm up and down the humerus", origin: J.lowerarm, out: flexion, along: humerus, half: [30, 22], chart: "plane", scale: elbow },
      { id: "epicondyle-medial", group: "elbow", kind: "prominence", definition: "EM, 'most caudal point on medial epicondyle' (Wu et al. 2005, 2.3.4): the same on the medial side", origin: J.lowerarm, out: scale(flexion, -1), along: humerus, half: [30, 22], chart: "plane", scale: elbow },
      { id: "styloid-radial", group: "wrist", kind: "prominence", definition: "RS, 'most caudal-lateral point on the radial styloid' (Wu et al. 2005, 2.3.6); stylion, 'inferior point of the bottom of the radius' (ANSUR II handbook p. 60): the prominence about the stored radial styloid's direction from the wrist's centre", origin: J.hand, out: perpendicular(sub(L.styloidRadial, J.hand), forearm), along: forearm, half: [22, 12], chart: "plane", scale: wrist },
      { id: "styloid-ulnar", group: "wrist", kind: "prominence", definition: "US, 'most caudal-medial point on the ulnar styloid' (Wu et al. 2005, 2.3.6): the prominence about the stored ulnar styloid's direction from the wrist's centre", origin: J.hand, out: perpendicular(sub(L.styloidUlnar, J.hand), forearm), along: forearm, half: [22, 12], chart: "plane", scale: wrist },
      tendon("index", J.index1),
      tendon("middle", J.middle1),
      tendon("ring", J.ring1),
      tendon("little", J.pinky1),
      pad("thenar", J.thumb1, J.thumb2, 16, "the thenar eminence over the first metacarpal: the prominence on the palm's side between the thumb's carpometacarpal and metacarpophalangeal joints, 16 mm to either side"),
      pad("hypothenar", rig("pinky_metacarpal_r"), J.pinky1, 12, "the hypothenar eminence over the fifth metacarpal: the prominence on the palm's side between that metacarpal's base and head, 12 mm to either side"),
      { id: "patella", group: "knee", kind: "prominence", definition: "midpatella, 'anterior point halfway between the top and bottom of the patella', and suprapatella, 'superior point of the patella' (ANSUR II handbook pp. 48, 62): the prominence on the knee's front about the knee's centre, 50 mm up and down the femur", origin: J.calf, out: perpendicular(X, femur), along: scale(femur, -1), half: [50, 40], chart: "axis", scale: knee },
      { id: "parapatellar-hollow-lateral", group: "knee", kind: "hollow", definition: "the hollow beside the patella on the lateral side: the hollow about the knee's centre in the direction halfway between the knee's front and its lateral side, 30 mm up and down the femur", origin: J.calf, out: unit(add(perpendicular(X, femur), perpendicular(Z, femur))), along: scale(femur, -1), half: [30, 16], chart: "axis", scale: knee },
      { id: "parapatellar-hollow-medial", group: "knee", kind: "hollow", definition: "the hollow beside the patella on the medial side: the same, turned toward the medial side", origin: J.calf, out: unit(sub(perpendicular(X, femur), perpendicular(Z, femur))), along: scale(femur, -1), half: [30, 16], chart: "axis", scale: knee },
      { id: "tibial-tuberosity", group: "knee", kind: "prominence", definition: "the tibial tuberosity (Wu et al. 2002's TT): the prominence on the shank's front about a tenth of the shank below the knee's centre, 25 mm up and down", origin: add(J.calf, scale(sub(J.foot, J.calf), 0.11)), out: perpendicular(X, shank), along: scale(shank, -1), half: [25, 20], chart: "axis", scale: knee },
      { id: "malleolus-lateral", group: "ankle", kind: "prominence", definition: "lateral malleolus, 'most lateral point of the lateral malleolus' (ANSUR II handbook p. 44): the prominence about the ankle's centre on the lateral side, 30 mm up and down the shank", origin: J.foot, out: lateral, along: scale(shank, -1), half: [30, 22], chart: "axis", scale: ankle },
      { id: "malleolus-medial", group: "ankle-medial", kind: "prominence", definition: "medial malleolus, 'medial point of the medial malleolus' (ANSUR II handbook p. 22): the same on the medial side", origin: J.foot, out: scale(lateral, -1), along: scale(shank, -1), half: [30, 22], chart: "axis", scale: ankle },
      { id: "retromalleolar-hollow-lateral", group: "ankle", kind: "hollow", definition: "the hollow between the lateral malleolus and the Achilles tendon: the hollow about the ankle's centre in the direction halfway between the ankle's back and its lateral side, 30 mm up and down the shank", origin: J.foot, out: unit(add(perpendicular(scale(X, -1), shank), lateral)), along: scale(shank, -1), half: [30, 14], chart: "axis", scale: ankle },
      { id: "retromalleolar-hollow-medial", group: "ankle-medial", kind: "hollow", definition: "the hollow between the medial malleolus and the Achilles tendon: the same, turned toward the medial side", origin: J.foot, out: unit(sub(perpendicular(scale(X, -1), shank), lateral)), along: scale(shank, -1), half: [30, 14], chart: "axis", scale: ankle },
      { id: "achilles-tendon", group: "ankle", kind: "ridge", definition: "the Achilles tendon's line: a ridge up the back of the shank from the ankle's centre's height to 90 mm above it, 20 mm to either side", origin: add(J.foot, scale(shank, -45)), out: perpendicular(scale(X, -1), shank), along: scale(shank, -1), half: [45, 20], chart: "plane", scale: ankle },
    ];
  }

  /** The acromion by the chord rule on the shoulder's top profile. */
  function shoulder(tris: Float64Array, stature: number): IReading {
    const gh: V = J.upperarm;
    const window: IWindow = { id: "acromion", group: "shoulder", kind: "prominence", definition: "acromion, 'point of intersection of the lateral border of the acromial process and a line running down the middle of the shoulder from the neck to the tip of the shoulder' (ANSUR II handbook p. 23), read as the shoulder point: on the shoulder's top profile in the coronal plane through the shoulder joint's centre, from four tenths of that centre's breadth to the deltoid's last skin at the centre's height, the point farthest above the chord of the two ends", origin: gh, out: [0, 1, 0], along: [0, 0, 1], half: [0, 0], chart: "plane", scale: [stature, "stature"] };
    const profile: V[] = [];
    for (let z: number = 0.4 * gh[2]; z < 3 * gh[2]; z += 0.5) {
      const t: number = cast(tris, [gh[0], gh[1], z], [0, 1, 0]);
      if (!Number.isFinite(t)) break;
      profile.push([gh[0], gh[1] + t, z]);
    }
    if (profile.length < 3) return { window, found: false, check: "the profile has " + profile.length + " points", points: [], size: "no profile", border: [gh, [gh[0], gh[1] + 60, gh[2]]] };
    const a: V = profile[0]!;
    const b: V = profile.at(-1)!;
    const chord: number = Math.hypot(b[1] - a[1], b[2] - a[2]);
    const above = (p: V): number => ((b[2] - a[2]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[2] - a[2])) / chord;
    const pick: V = profile.reduce((p: V, q: V): V => (above(q) > above(p) ? q : p));
    const share: number = (pick[2] - a[2]) / (b[2] - a[2]);
    const found: boolean = above(pick) >= 2 * FLOOR && share > 0.05 && share < 0.95;
    return {
      window,
      found,
      check: "profile of " + profile.length + " points from [" + a.map((x: number): string => x.toFixed(1)).join(", ") + "] to [" + b.map((x: number): string => x.toFixed(1)).join(", ") + "]; the pick stands " + above(pick).toFixed(1) + " mm above the chord at " + share.toFixed(2) + " of it; height " + (pick[1] / stature).toFixed(4) + " of stature, breadth off the median plane " + pick[2].toFixed(1) + " mm (" + (pick[2] / gh[2]).toFixed(2) + " of the shoulder joint centre's); it stands " + (pick[1] - gh[1]).toFixed(1) + " mm above that centre",
      points: [pick],
      size: "a corner of the wall, no template: " + above(pick).toFixed(1) + " mm above its chord of " + chord.toFixed(1) + " mm",
      border: profile,
    };
  }

  /** Read one window: the heights, the baseline, the extremum, the size. */
  function read(w: IWindow, tris: Float64Array): IReading {
    const along: V = perpendicular(w.along, w.out);
    const across: V = cross(w.out, along);
    const [a, b]: [number, number] = w.half;
    const r0: number = cast(tris, w.origin, w.out);
    const border: V[] = [];
    if (!Number.isFinite(r0)) return { window: w, found: false, check: "the centre ray leaves no skin", points: [], size: "no reading", border: [w.origin, add(w.origin, scale(w.out, 60))] };
    const near: Float64Array = within(tris, add(w.origin, scale(w.out, r0)), 1.5 * Math.hypot(a, b) + 20);
    const facets: string = "; the reference's facets here have a median edge of " + facet(near).toFixed(1) + " mm";
    const sample = (x: number, y: number): { h: number; point: V } => {
      const base: V = add(w.origin, scale(along, x));
      const [o, d]: [V, V] = w.chart === "plane" ? [add(base, scale(across, y)), w.out] : [base, add(scale(w.out, Math.cos(y / r0)), scale(across, Math.sin(y / r0)))];
      const t: number = cast(near, o, d);
      return { h: t, point: add(o, scale(d, t)) };
    };
    for (let k: number = 0; k < 48; ++k) {
      const s = sample(a * Math.cos((k * Math.PI) / 24), b * Math.sin((k * Math.PI) / 24));
      if (Number.isFinite(s.h)) border.push(s.point);
    }
    if (border.length < 3) border.push(w.origin, add(w.origin, scale(w.out, r0)), add(w.origin, scale(w.out, r0 + 10)));
    const [nx, ny]: [number, number] = [30, 20];
    const xs: number[] = Array.from({ length: 2 * nx + 1 }, (_: unknown, i: number): number => ((i - nx) * a) / nx);
    const ys: number[] = Array.from({ length: 2 * ny + 1 }, (_: unknown, j: number): number => ((j - ny) * b) / ny);
    const h: number[][] = xs.map((x: number): number[] => ys.map((y: number): number => sample(x, y).h));
    const sign: number = w.kind === "prominence" || w.kind === "ridge" ? 1 : -1;
    const sizes = (height: number, widths: (number | null)[]): string => {
      const show = (v: number | null): string => (v === null ? "open" : v.toFixed(1));
      const extent = (p: number | null, q: number | null): string => (p === null || q === null ? "open" : ((p + q) / 2 / HALF_RADIUS).toFixed(1) + " mm, " + ((p + q) / 2 / HALF_RADIUS / w.scale[0]).toFixed(4) + " of scale");
      return "height " + height.toFixed(2) + " mm (" + (height / w.scale[0]).toFixed(5) + " of scale); half widths along -/+ " + show(widths[0]!) + " / " + show(widths[1]!) + ", across -/+ " + show(widths[2]!) + " / " + show(widths[3]!) + " mm; template half extents along " + extent(widths[0]!, widths[1]!) + ", across " + extent(widths[2]!, widths[3]!) + "; scale " + w.scale[0].toFixed(1) + " mm, the " + w.scale[1];
    };

    if (w.kind === "ridge" || w.kind === "groove") {
      // A line: at every station the quadratic through the two side bands is the skin without the line.
      const points: V[] = [];
      const heights: number[] = [];
      const widths: number[] = [];
      const offsets: number[] = [];
      let stations: number = 0;
      for (let i: number = 0; i < xs.length; ++i) {
        const rim: [number, number][] = [];
        ys.forEach((y: number, j: number): void => {
          if (Math.abs(y) >= 0.7 * b && Number.isFinite(h[i]![j]!)) rim.push([y / b, h[i]![j]!]);
        });
        if (rim.filter((p: [number, number]): boolean => p[0] < 0).length < 3 || rim.filter((p: [number, number]): boolean => p[0] > 0).length < 3) continue;
        ++stations;
        const c: number[] = fit(rim.map((p: [number, number]): number[] => [1, p[0], p[0] * p[0]]), rim.map((p: [number, number]): number => p[1]));
        const res: number[] = ys.map((y: number, j: number): number => sign * (h[i]![j]! - (c[0]! + (c[1]! * y) / b + (c[2]! * y * y) / (b * b))));
        let best: number = -1;
        ys.forEach((y: number, j: number): void => {
          if (Math.abs(y) <= 0.6 * b && Number.isFinite(res[j]!) && (best < 0 || res[j]! > res[best]!)) best = j;
        });
        if (best < 0 || res[best]! < FLOOR || Math.abs(ys[best]!) >= 0.6 * b - 1e-9) continue;
        const lo: number | null = halfway(res, ys, best, -1);
        const hi: number | null = halfway(res, ys, best, 1);
        points.push(sample(xs[i]!, ys[best]!).point);
        heights.push(res[best]!);
        offsets.push(ys[best]!);
        if (lo !== null && hi !== null) widths.push((lo + hi) / 2);
      }
      const share: number = stations === 0 ? 0 : points.length / stations;
      const mean = (v: number[]): number => (v.length === 0 ? Number.NaN : v.reduce((s: number, x: number): number => s + x, 0) / v.length);
      const sd: number = Math.sqrt(mean(offsets.map((y: number): number => (y - mean(offsets)) ** 2)));
      const found: boolean = share >= 0.6;
      return {
        window: w,
        found,
        check: points.length + " of " + stations + " stations find it (" + share.toFixed(2) + ", needs 0.60) over the floor " + FLOOR + " mm inside 0.6 of the half width; heights " + (heights.length === 0 ? "none" : Math.min(...heights).toFixed(2) + " to " + Math.max(...heights).toFixed(2) + ", mean " + mean(heights).toFixed(2)) + " mm; the line stands " + mean(offsets).toFixed(1) + " mm off the window's middle, sd " + sd.toFixed(1) + " mm; centre ray " + r0.toFixed(1) + " mm",
        points,
        size: (heights.length === 0 ? "nothing over the floor" : "mean " + (w.kind === "groove" ? "depth " : "height ") + mean(heights).toFixed(2) + " mm (" + (mean(heights) / w.scale[0]).toFixed(5) + " of scale), greatest " + Math.max(...heights).toFixed(2) + " mm; half width at half height " + (widths.length === 0 ? "open at every station" : mean(widths).toFixed(1) + " mm over " + widths.length + " stations (" + (mean(widths) / w.scale[0]).toFixed(4) + " of scale), template half width " + (mean(widths) / HALF_RADIUS).toFixed(1) + " mm") + "; length found " + ((points.length * a) / nx).toFixed(0) + " of " + (2 * a).toFixed(0) + " mm") + "; scale " + w.scale[0].toFixed(1) + " mm, the " + w.scale[1] + facets,
        border,
      };
    }

    // A point: the cubic through the rim is the skin without the feature.
    const basis = (x: number, y: number): number[] => {
      const [p, q]: [number, number] = [x / a, y / b];
      return [1, p, q, p * p, p * q, q * q, p * p * p, p * p * q, p * q * q, q * q * q];
    };
    const rimRows: number[][] = [];
    const rimValues: number[] = [];
    xs.forEach((x: number, i: number): void =>
      ys.forEach((y: number, j: number): void => {
        const rho: number = Math.hypot(x / a, y / b);
        if (rho >= 0.8 && rho <= 1 && Number.isFinite(h[i]![j]!)) {
          rimRows.push(basis(x, y));
          rimValues.push(h[i]![j]!);
        }
      }),
    );
    const size0: string = "no reading";
    if (rimRows.length < 40) return { window: w, found: false, check: "only " + rimRows.length + " rim samples leave the skin; centre ray " + r0.toFixed(1) + " mm", points: [], size: size0, border };
    const c: number[] = fit(rimRows, rimValues);
    const base = (x: number, y: number): number => basis(x, y).reduce((s: number, v: number, k: number): number => s + v * c[k]!, 0);
    const noise: number = Math.sqrt(rimRows.reduce((s: number, row: number[], k: number): number => s + (row.reduce((t: number, v: number, m: number): number => t + v * c[m]!, 0) - rimValues[k]!) ** 2, 0) / rimRows.length);
    const res: number[][] = xs.map((x: number, i: number): number[] => ys.map((y: number, j: number): number => (Math.hypot(x / a, y / b) < 0.8 ? sign * (h[i]![j]! - base(x, y)) : Number.NaN)));
    let [bi, bj, li, lj]: [number, number, number, number] = [-1, -1, -1, -1];
    for (let i: number = 0; i < xs.length; ++i)
      for (let j: number = 0; j < ys.length; ++j) {
        const v: number = res[i]![j]!;
        if (!Number.isFinite(v)) continue;
        if (bi < 0 || v > res[bi]![bj]!) [bi, bj] = [i, j];
        if (li < 0 || v < res[li]![lj]!) [li, lj] = [i, j];
      }
    if (bi < 0) return { window: w, found: false, check: "no sample inside the rim leaves the skin", points: [], size: size0, border };
    const peak: IPeak = { x: xs[bi]!, y: ys[bj]!, value: res[bi]![bj]!, point: sample(xs[bi]!, ys[bj]!).point };
    const rho: number = Math.hypot(peak.x / a, peak.y / b);
    const against: number[] = res.flat().filter((v: number): boolean => Number.isFinite(v) && v < 0);
    const misfit: number = against.length === 0 ? 0 : Math.sqrt(against.reduce((s: number, v: number): number => s + v * v, 0) / against.length);
    const floor: number = Math.max(FLOOR, 3 * noise, 3 * misfit);
    const found: boolean = peak.value >= floor && rho <= 0.7;
    const widths: (number | null)[] = [halfway(res.map((row: number[]): number => row[bj]!), xs, bi, -1), halfway(res.map((row: number[]): number => row[bj]!), xs, bi, 1), halfway(res[bi]!, ys, bj, -1), halfway(res[bi]!, ys, bj, 1)];
    const opposite: string = "; the opposite extremum " + (-sign * res[li]![lj]!).toFixed(2) + " mm at along " + xs[li]!.toFixed(1) + ", across " + ys[lj]!.toFixed(1) + " mm";
    return {
      window: w,
      found,
      check: "residual " + (sign * peak.value).toFixed(2) + " mm at along " + peak.x.toFixed(1) + ", across " + peak.y.toFixed(1) + " mm (" + rho.toFixed(2) + " of the window, needs 0.70 or less) against the floor " + floor.toFixed(2) + " mm (the baseline's own residual on the rim " + noise.toFixed(2) + " mm over " + rimRows.length + " samples, the opposite-signed residual inside the rim " + misfit.toFixed(2) + " mm rms); centre ray " + r0.toFixed(1) + " mm" + opposite,
      points: [peak.point],
      size: sizes(sign * peak.value, widths) + opposite + facets,
      border,
    };
  }

  /** From the extremum at `at`, the distance in the direction `step` at which the residual has fallen to half, or null where the samples end first. */
  function halfway(res: readonly number[], places: readonly number[], at: number, step: 1 | -1): number | null {
    const target: number = res[at]! / 2;
    for (let k: number = at + step; k >= 0 && k < res.length; k += step) {
      const [p, q]: [number, number] = [res[k - step]!, res[k]!];
      if (!Number.isFinite(q)) return null;
      if (q <= target) return Math.abs(places[k - step]! + ((places[k]! - places[k - step]!) * (p - target)) / (p - q) - places[at]!);
    }
    return null;
  }

  /** Least squares by the normal equations and Gaussian elimination with partial pivoting. */
  function fit(rows: readonly number[][], values: readonly number[]): number[] {
    const n: number = rows[0]!.length;
    const m: number[][] = Array.from({ length: n }, (): number[] => new Array<number>(n + 1).fill(0));
    rows.forEach((row: number[], k: number): void => {
      for (let i: number = 0; i < n; ++i) {
        for (let j: number = 0; j < n; ++j) m[i]![j] = m[i]![j]! + row[i]! * row[j]!;
        m[i]![n] = m[i]![n]! + row[i]! * values[k]!;
      }
    });
    for (let i: number = 0; i < n; ++i) {
      let pivot: number = i;
      for (let k: number = i + 1; k < n; ++k) if (Math.abs(m[k]![i]!) > Math.abs(m[pivot]![i]!)) pivot = k;
      [m[i], m[pivot]] = [m[pivot]!, m[i]!];
      if (Math.abs(m[i]![i]!) < 1e-12) throw new Error("The baseline's samples do not determine it");
      for (let k: number = 0; k < n; ++k) {
        if (k === i) continue;
        const f: number = m[k]![i]! / m[i]![i]!;
        for (let j: number = i; j <= n; ++j) m[k]![j] = m[k]![j]! - f * m[i]![j]!;
      }
    }
    return m.map((row: number[], i: number): number => row[n]! / row[i]!);
  }

  /** A mesh's triangles as nine numbers each. */
  function triangles(mesh: IAutoMovieMillimeterMesh): Float64Array {
    const out: Float64Array = new Float64Array(mesh.indices.length * 3);
    for (let t: number = 0; t < mesh.indices.length; ++t) for (let c: number = 0; c < 3; ++c) out[3 * t + c] = mesh.positions[3 * mesh.indices[t]! + c]!;
    return out;
  }

  /** The median edge length of a set of triangles, mm. */
  function facet(tris: Float64Array): number {
    const edges: number[] = [];
    for (let t: number = 0; t < tris.length; t += 9) for (let k: number = 0; k < 9; k += 3) edges.push(Math.hypot(tris[t + k]! - tris[t + ((k + 3) % 9)]!, tris[t + k + 1]! - tris[t + ((k + 3) % 9) + 1]!, tris[t + k + 2]! - tris[t + ((k + 3) % 9) + 2]!));
    edges.sort((a: number, b: number): number => a - b);
    return edges[edges.length >> 1] ?? Number.NaN;
  }

  /** The triangles with a vertex within `radius` of `centre`. */
  function within(tris: Float64Array, centre: V, radius: number): Float64Array {
    const keep: number[] = [];
    for (let t: number = 0; t < tris.length; t += 9) {
      let near: boolean = false;
      for (let k: number = 0; k < 9; k += 3) near ||= Math.hypot(tris[t + k]! - centre[0], tris[t + k + 1]! - centre[1], tris[t + k + 2]! - centre[2]) <= radius;
      if (near) for (let k: number = 0; k < 9; ++k) keep.push(tris[t + k]!);
    }
    return Float64Array.from(keep);
  }

  /** The distance along the unit `d` from `o` to the first triangle the ray meets (Moller and Trumbore 1997), or NaN. */
  function cast(tris: Float64Array, o: V, d: V): number {
    let best: number = Number.NaN;
    for (let t: number = 0; t < tris.length; t += 9) {
      const e1: V = [tris[t + 3]! - tris[t]!, tris[t + 4]! - tris[t + 1]!, tris[t + 5]! - tris[t + 2]!];
      const e2: V = [tris[t + 6]! - tris[t]!, tris[t + 7]! - tris[t + 1]!, tris[t + 8]! - tris[t + 2]!];
      const p: V = cross(d, e2);
      const det: number = dot(e1, p);
      if (Math.abs(det) < 1e-12) continue;
      const s: V = [o[0] - tris[t]!, o[1] - tris[t + 1]!, o[2] - tris[t + 2]!];
      const u: number = dot(s, p) / det;
      if (u < 0 || u > 1) continue;
      const q: V = cross(s, e1);
      const v: number = dot(d, q) / det;
      if (v < 0 || u + v > 1) continue;
      const hit: number = dot(e2, q) / det;
      if (hit > 1e-6 && !(hit >= best)) best = hit;
    }
    return best;
  }

  /** The skin's triangles whose vertices all lie within `radius` of `centre`, so no other part hides the landmarks. */
  function crop(mesh: IAutoMovieMillimeterMesh, centre: V, radius: number): N.Mesh {
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

  /** A cross of 6 mm arms along the three axes, red, drawn through the skin. */
  function mark(p: V, id: string): N.Curve[] {
    return [0, 1, 2].map((c: number): N.Curve => {
      const a: V = [...p];
      const b: V = [...p];
      a[c] = a[c]! - 6;
      b[c] = b[c]! + 6;
      return { id: id + ".mark" + c, points: [a, b], closed: false, xray: true, colour: "e0201c" };
    });
  }

  function sub(a: V, b: V): V {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  function add(a: V, b: V): V {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  function scale(a: V, s: number): V {
    return [a[0] * s, a[1] * s, a[2] * s];
  }

  function mid(a: V, b: V): V {
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  }

  function dot(a: V, b: V): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  function cross(a: V, b: V): V {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  function norm(a: V): number {
    return Math.hypot(a[0], a[1], a[2]);
  }

  function distance(a: V, b: V): number {
    return norm(sub(a, b));
  }

  function unit(a: V): V {
    return scale(a, 1 / norm(a));
  }

  /** `a` made square to the unit `n`, unit. */
  function perpendicular(a: V, n: V): V {
    return unit(sub(a, scale(n, dot(a, n))));
  }

  /** `a` or its opposite, whichever points along `hint`. */
  function toward(a: V, hint: V): V {
    return dot(a, hint) >= 0 ? a : scale(a, -1);
  }
}
void FamilyConicBodyFeatures.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
  process.exitCode = 1;
});
