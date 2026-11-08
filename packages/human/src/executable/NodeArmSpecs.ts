import fs from "node:fs";
import path from "node:path";
import { AutoMovieLoftChain, AutoMovieViewSection, type IAutoMovieLoftChain } from "@automovie/engine";
import type { AutoMovieHumanBodyLaw } from "../generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanArmInputs } from "../generation/arm/AutoMovieHumanArmInputs";
import { AutoMovieHumanArmLandmarks } from "../generation/arm/AutoMovieHumanArmLandmarks";
import { AutoMovieHumanArmSegmentFrames } from "../generation/arm/AutoMovieHumanArmSegmentFrames";
import { AutoMovieHumanArmViewCurves } from "../generation/arm/AutoMovieHumanArmViewCurves";
import { AutoMovieHumanArmViewLoft } from "../generation/arm/AutoMovieHumanArmViewLoft";
import { HumanNodeInput } from "./HumanNodeInput";
import { HumanNodePaths } from "./HumanNodePaths";
import { AutoMovieHumanHandDigits } from "../generation/hand/AutoMovieHumanHandDigits";
import { NodeArmCoordinates } from "./NodeArmCoordinates";
import { NodeArmDeviation } from "./NodeArmDeviation";
import { NodeArmDigits } from "./NodeArmDigits";
import { NodeArmDraw } from "./NodeArmDraw";
import { NodeArmReference } from "./NodeArmReference";

type V3 = AutoMovieHumanArmCurveSpec.Vec3;
type Arms = ReturnType<typeof AutoMovieHumanBodyLaw.limbInputs>["arms"];

/**
 * Direct Node images of the arm experiment for f1's left arm, in four stages
 * at front, left side, top and the elbow and wrist obliques:
 * 1. the 2D view-curve specs of each segment in its own frame with their
 *    construction aids, over the reference arm registered into this arm's
 *    chain (diagnostic only);
 * 2. the actual loft curves of the engine view loft (layer rings, the four
 *    guide lines and the course);
 * 3. those curves over the default clay of the lofted surface;
 * 4. the clay alone.
 * The neutral pose is drawn in every stage; a flexed pose (elbow 1.2 rad,
 * wrist 0.3 rad) adds loft curves and clay at the side and elbow oblique to
 * show the bisection-plane sections. A manifest keeps the inputs, the site
 * boxes and fullness, the measured section perimeters at the girth sites,
 * the registration's measures and the constructor timings (cold, retained,
 * one-input edit).
 */
export namespace NodeArmSpecs {
  /** Draws every stage and camera and writes PNGs plus a manifest under `.shots/f1_arm/arm-<stamp>/`. */
  export async function run(): Promise<void> {
    const started: number = performance.now();
    const person: Awaited<ReturnType<typeof HumanNodeInput.of>> = await HumanNodeInput.of();
    const inputs: AutoMovieHumanArmInputs.IOutput = AutoMovieHumanArmInputs.of(person.parameters, "left");
    const { arms, tapes, root } = inputs;
    const loaded: number = performance.now();

    // Constructor timings: cold, retained (same inputs again), one-input edit.
    const cold: IBuild = build(arms, tapes, root, { elbow: 0, wrist: 0 }, inputs.calipers);
    const retained: IBuild = build(arms, tapes, root, { elbow: 0, wrist: 0 }, inputs.calipers);
    const edited: IBuild = build(arms, { ...tapes, bicep: tapes.bicep + 10 }, root, { elbow: 0, wrist: 0 }, inputs.calipers);
    const flexed: IBuild = build(arms, tapes, root, { elbow: 1.2, wrist: 0.3 }, inputs.calipers);
    const registered: NodeArmReference.IRegistered = NodeArmReference.register(NodeArmReference.load(arms.scale), cold.frames);
    const reference: NodeArmReference.IRegistered = { ...registered, points: registered.points.map((p: V3): V3 => AutoMovieHumanArmCurveSpec.apply(root, p)) };
    // The deviation frame: f1's reference placed by bone landmarks on its own skin (GH shared, epicondyles, styloids).
    const native: NodeArmReference.IMesh = NodeArmReference.mesh(arms.scale);
    const landmark = (name: string): V3 => {
      const l: AutoMovieHumanArmLandmarks.ILandmark = AutoMovieHumanArmLandmarks.get(cold.landmarks, name);
      return AutoMovieHumanArmCurveSpec.apply(cold.frames.chain(l.frame, root), l.point);
    };
    const placement: NodeArmReference.IPlaced = registered.axes === null ? { points: [], twist: 0, measures: { axes: 0 } } : NodeArmReference.placeByLandmarks(native.points, {
      gh: root.origin as V3,
      acromion: inputs.acromion,
      elbow: AutoMovieHumanArmCurveSpec.apply(root, cold.frames.points.elbow),
      wrist: AutoMovieHumanArmCurveSpec.apply(root, cold.frames.points.wrist),
      epicondyles: NodeArmDraw.sub(landmark("EL"), landmark("EM")),
      styloids: NodeArmDraw.sub(landmark("stylion"), landmark("ulnar styloid")),
    }, registered.axes);
    const deviation: { rows: NodeArmDeviation.IRow[]; centres: NodeArmDeviation.ICentre[]; pairs: NodeArmDeviation.IPair[] } = NodeArmDeviation.measure(cold, { points: placement.points, triangles: native.triangles });
    console.log(JSON.stringify({ frame: "reference placed by bone landmarks on its skin (GH shared, epicondyles, styloids); shape about each section's own box centre", placement: placement.measures }));
    // f1's sparse view-curve coordinates in each segment's own frame (NodeArmCoordinates), every 15 mm of walk from the axilla level to the knuckles.
    const coordinates: NodeArmCoordinates.IReading[] = placement.points.length === 0 ? [] : NodeArmCoordinates.read(cold, { points: placement.points, triangles: native.triangles }, 15, placement.twist);
    console.log(`forearm twist after placement ${((placement.twist * 180) / Math.PI).toFixed(1)} deg`);
    console.log(`coordinates ${JSON.stringify(coordinates.map((r: NodeArmCoordinates.IReading): unknown[] => [r.segment, Number(r.along.toFixed(2)), r.extents.map((e: number): number => Number(e.toFixed(2))), r.shoulders.map((s: number): number => Number(s.toFixed(4)))]))}`);

    const stamp: string = new Date().toISOString().replace(/[:.]/g, "-");
    const out: string = HumanNodePaths.resolve(`packages/human/.shots/f1_arm/arm-${stamp}`);
    fs.mkdirSync(out, { recursive: true });
    const files: string[] = [];
    const write: (name: string, view: NodeArmDraw.IView) => void = (name: string, view: NodeArmDraw.IView): void => {
      fs.writeFileSync(path.join(out, name), NodeArmDraw.png(view));
      files.push(name);
    };
    const drawStart: number = performance.now();
    const mesh: [V3, V3, V3][] = [...triangles(cold.chain), ...NodeArmDigits.triangles(cold.digits)];
    const flexedMesh: [V3, V3, V3][] = [...triangles(flexed.chain), ...NodeArmDigits.triangles(flexed.digits)];
    for (const [camera, forward, focus] of CAMERAS) {
      const bounds: V3[] = focusBounds(cold, reference.points, focus);
      for (const stage of [1, 2, 3, 4] as const) {
        const v: NodeArmDraw.IView = NodeArmDraw.open(forward, bounds);
        if (stage === 1 || stage === 2) NodeArmDraw.dots(v, every(reference.points, 3), "#cfcfcf", 1.6);
        if (stage >= 3) NodeArmDraw.clay(v, mesh);
        if (stage === 1) drawSpecs(v, cold);
        if (stage === 2 || stage === 3) drawLoft(v, cold);
        NodeArmDraw.caption(v, [`f1 left arm, neutral, ${camera}, stage ${stage}: ${STAGES[stage - 1]}`]);
        write(`neutral.${camera}.${stage}.png`, v);
      }
    }
    // Each individual view curve alone over the reference, with its aids.
    for (const [curve, cameras] of INDIVIDUAL) {
      for (const camera of cameras) {
        const [, forward]: [string, V3, string] = CAMERAS.find((c: [string, V3, string]): boolean => c[0] === camera)!;
        const v: NodeArmDraw.IView = NodeArmDraw.open(forward, focusBounds(cold, reference.points, "arm"));
        NodeArmDraw.dots(v, every(reference.points, 2), "#cfcfcf", 1.6);
        drawSpecs(v, cold, curve);
        NodeArmDraw.caption(v, [`f1 left arm, neutral, ${camera}, stage 1 alone: ${curve} view curve per segment + aids over registered reference`]);
        write(`neutral.1.${curve}.${camera}.png`, v);
      }
    }
    // The deviation overlay: each sampled curve point joined to the reference's
    // reach in the same direction, red beyond 3 mm, over the reference.
    for (const [camera, view] of [["front", "front"], ["left", "side"], ["top", "top"]] as const) {
      const [, forward]: [string, V3, string] = CAMERAS.find((c: [string, V3, string]): boolean => c[0] === camera)!;
      const v: NodeArmDraw.IView = NodeArmDraw.open(forward, focusBounds(cold, reference.points, "arm"));
      NodeArmDraw.dots(v, every(placement.points, 2), "#d8d8d8", 1.4);
      const shown: NodeArmDeviation.IPair[] = deviation.pairs.filter((p: NodeArmDeviation.IPair): boolean => p.view === view);
      for (const p of shown) NodeArmDraw.line(v, [p.ours, p.reference], Math.abs(p.deviation) > 3 ? "#e01010" : "#20a040", Math.abs(p.deviation) > 3 ? 1.6 : 0.8);
      NodeArmDraw.dots(v, shown.map((p: NodeArmDeviation.IPair): V3 => p.ours), "#202020", 1.4);
      const over: number = shown.filter((p: NodeArmDeviation.IPair): boolean => Math.abs(p.deviation) > 3).length;
      NodeArmDraw.caption(v, [`f1 left arm, neutral, ${camera}: every ${view} curve sample (black) to f1's section reach, each about its own box centre (red beyond 3 mm)`, `reference placed by bone landmarks (GH, epicondyles, styloids); ${shown.length} samples, ${over} beyond 3 mm`]);
      write(`deviation.${camera}.png`, v);
    }
    console.log(
      deviation.rows
        .map((r: NodeArmDeviation.IRow): string => `${r.curve.padEnd(40)} ${r.view.padEnd(5)} n ${String(r.samples).padStart(3)} miss ${String(r.uncovered).padStart(3)}  max ${r.max.toFixed(1).padStart(6)}  mean ${r.mean.toFixed(1).padStart(5)}  signed ${r.signed.toFixed(1).padStart(6)}  worst ${r.worst.deviation.toFixed(1)} at ${r.worst.at.toFixed(0)}`)
        .join("\n"),
    );
    for (const segment of ["humerus", "forearm", "hand"]) {
      const list: NodeArmDeviation.ICentre[] = deviation.centres.filter((c: NodeArmDeviation.ICentre): boolean => c.segment === segment);
      if (list.length === 0) continue;
      const offset: number[][] = list.map((c: NodeArmDeviation.ICentre): number[] => [c.model[0] - c.reference[0], c.model[1] - c.reference[1]]);
      const mean = (k: number): number => offset.reduce((s: number, o: number[]): number => s + o[k]!, 0) / offset.length;
      const most = (k: number): number => offset.reduce((m: number, o: number[]): number => (Math.abs(o[k]!) > Math.abs(m) ? o[k]! : m), 0);
      console.log(`centre ${segment}: model less reference, lateral mean ${mean(0).toFixed(1)} (largest ${most(0).toFixed(1)}), anterior mean ${mean(1).toFixed(1)} (largest ${most(1).toFixed(1)}) mm over ${list.length} sections`);
    }
    // Hand close-ups (front and oblique) of the left arm, and the right arm from the same lines in its mirrored frames.
    // The course's last centre: the palm pole.
    const handCentre: V3 = cold.loft.centres[cold.loft.centres.length - 1]!;
    const handBounds: V3[] = [NodeArmDraw.add(handCentre, [-90, -90, -90]), NodeArmDraw.add(handCentre, [90, 90, 90])];
    for (const [name, forward] of [["hand.front", [-1, 0, 0]], ["hand.oblique", NodeArmDraw.unit([-1, 0.4, 1])], ["hand.side", [0, 0, 1]]] as [string, V3][]) {
      const v: NodeArmDraw.IView = NodeArmDraw.open(forward, handBounds);
      NodeArmDraw.clay(v, mesh);
      NodeArmDraw.caption(v, [`f1 left hand, neutral, ${name}: clay (digits unjoined here; the finger tree joins them in the body)`]);
      write(`${name}.png`, v);
    }
    const rightInputs: AutoMovieHumanArmInputs.IOutput = AutoMovieHumanArmInputs.of(person.parameters, "right");
    const right: IBuild = build(rightInputs.arms, rightInputs.tapes, rightInputs.root, { elbow: 0, wrist: 0 }, rightInputs.calipers, "right");
    const rightMesh: [V3, V3, V3][] = [...triangles(right.chain), ...NodeArmDigits.triangles(right.digits)];
    const rightBounds: V3[] = right.chain === null ? right.loft.centres : right.chain.layers.flatMap((l: IAutoMovieLoftChain.ILayer): V3[] => AutoMovieLoftChain.ring(right.chain!, l.y, [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]));
    for (const [name, forward] of [["right.front", [-1, 0, 0]], ["right.side", [0, 0, -1]], ["right.oblique", NodeArmDraw.unit([-1, 0.4, -1])]] as [string, V3][]) {
      const v: NodeArmDraw.IView = NodeArmDraw.open(forward, rightBounds);
      NodeArmDraw.clay(v, rightMesh);
      NodeArmDraw.caption(v, [`f1 right arm, neutral, ${name}: clay from the same f1 lines in the mirrored frames`]);
      write(`${name}.png`, v);
    }
    for (const [camera, forward] of CAMERAS.filter((c: [string, V3, string]): boolean => c[0] === "left" || c[0] === "elbow-oblique")) {
      const bounds: V3[] = flexed.chain === null ? [] : flexed.chain.layers.map((l: IAutoMovieLoftChain.ILayer): V3 => AutoMovieLoftChain.axis(flexed.chain!, l.y)).concat(flexed.loft.centres);
      for (const stage of [2, 4] as const) {
        const v: NodeArmDraw.IView = NodeArmDraw.open(forward, bounds.length > 0 ? bounds : [[0, 0, 0]]);
        if (stage === 4) NodeArmDraw.clay(v, flexedMesh);
        else drawLoft(v, flexed);
        NodeArmDraw.caption(v, [`f1 left arm, elbow 1.2 rad, wrist 0.3 rad, ${camera}, stage ${stage}: ${STAGES[stage - 1]}`]);
        write(`flexed.${camera}.${stage}.png`, v);
      }
    }
    const drawn: number = performance.now();

    fs.writeFileSync(
      path.join(out, "manifest.json"),
      JSON.stringify(
        {
          person: "f1",
          side: "left",
          placement: inputs.placement,
          root,
          tapes,
          lengths: cold.frames.lengths,
          breadths: cold.frames.breadths,
          landmarks: cold.landmarks.list.map((l: AutoMovieHumanArmLandmarks.ILandmark): { name: string; frame: string; walk: number; point: V3 } => ({ name: l.name, frame: l.frame, walk: l.walk, point: l.point })),
          gaps: cold.landmarks.gaps,
          sites: cold.curves.sites,
          girths: girths(cold),
          outlines: cold.curves.outlines,
          loftDiagnostics: { neutral: cold.loft.loft?.diagnostics ?? [], flexed: flexed.loft.loft?.diagnostics ?? [], constructor: [...cold.loft.diagnostics, ...flexed.loft.diagnostics] },
          surface: { neutral: cold.loft.loft?.surface !== null && cold.loft.loft?.surface !== undefined, flexed: flexed.loft.loft?.surface !== null && flexed.loft.loft?.surface !== undefined },
          digits: cold.digits.map((d: AutoMovieHumanHandDigits.IDigit): Record<string, unknown> => ({ name: d.name, length: d.length, joints: d.joints, knots: d.knots, surface: d.loft.surface !== null, diagnostics: d.loft.diagnostics })),
          departures: departures(cold, reference.points),
          deviation: { frame: "reference placed by bone landmarks on its skin (GH shared, epicondyles, styloids); shape about each section's own box centre", placement: placement.measures, rows: deviation.rows, centres: deviation.centres },
          registration: reference.measures,
          registrationProfile: reference.profile,
          timings: {
            loadMs: loaded - started,
            cold: cold.ms,
            retained: retained.ms,
            edit: edited.ms,
            flexed: flexed.ms,
            drawMs: drawn - drawStart,
            totalMs: performance.now() - started,
          },
          files,
        },
        null,
        2,
      ),
    );
    console.log(out);
  }

  /** Stage names. */
  const STAGES: string[] = ["2D view specs + aids over registered reference", "loft curves", "loft curves over clay", "clay"];

  /** Cameras: name, viewing direction (world: +X anterior, +Y up, +Z subject's right) and the region framed. */
  const CAMERAS: [string, V3, string][] = [
    ["front", [-1, 0, 0], "arm"],
    ["left", [0, 0, 1], "arm"],
    ["top", [0, -1, 0], "arm"],
    ["elbow-oblique", [-1, -0.4, 1], "elbow"],
    ["wrist-oblique", [-1, 0.5, 1], "wrist"],
  ];

  /** The individual stage-1 frames: each view curve kind at the cameras that see it. */
  const INDIVIDUAL: [Curve, string[]][] = [
    ["lateral", ["front"]],
    ["medial", ["front"]],
    ["anterior", ["left"]],
    ["posterior", ["left"]],
    ["axis", ["front", "left"]],
    ["fullness", ["top", "front"]],
  ];

  /** One complete build at a pose, with its stage timings. */
  interface IBuild {
    frames: AutoMovieHumanArmSegmentFrames.IOutput;
    landmarks: AutoMovieHumanArmLandmarks.IOutput;
    curves: AutoMovieHumanArmViewCurves.IOutput;
    loft: AutoMovieHumanArmViewLoft.IOutput;
    chain: IAutoMovieLoftChain | null;
    digits: AutoMovieHumanHandDigits.IDigit[];
    root: AutoMovieHumanArmCurveSpec.ITransform;
    ms: { frames: number; landmarks: number; curves: number; loft: number; digits: number; total: number };
  }

  function build(arms: Arms, tapes: AutoMovieHumanArmViewCurves.ITapes, root: AutoMovieHumanArmCurveSpec.ITransform, pose: { elbow: number; wrist: number }, calipers?: AutoMovieHumanArmViewCurves.ICalipers, side: "left" | "right" = "left"): IBuild {
    const t0: number = performance.now();
    const frames: AutoMovieHumanArmSegmentFrames.IOutput = AutoMovieHumanArmSegmentFrames.create({ side, arms, pose });
    const t1: number = performance.now();
    const landmarks: AutoMovieHumanArmLandmarks.IOutput = AutoMovieHumanArmLandmarks.create(frames, arms);
    const t2: number = performance.now();
    const curves: AutoMovieHumanArmViewCurves.IOutput = AutoMovieHumanArmViewCurves.create(frames, landmarks, tapes, calipers);
    const t3: number = performance.now();
    const loft: AutoMovieHumanArmViewLoft.IOutput = AutoMovieHumanArmViewLoft.create({ curves, frames, landmarks, root, order: 32, samples: 64, gap: 6 });
    const t4: number = performance.now();
    const digits: AutoMovieHumanHandDigits.IDigit[] = AutoMovieHumanHandDigits.create(frames, root, { sex: arms.sex, breadth: tapes.breadth });
    const t5: number = performance.now();
    return { frames, landmarks, curves, loft, chain: loft.loft?.chain ?? null, digits, root, ms: { frames: t1 - t0, landmarks: t2 - t1, curves: t3 - t2, loft: t4 - t3, digits: t5 - t4, total: t5 - t0 } };
  }

  /** Each girth site's box and tape beside the registered reference's own cut at the same plane (diagnostic only). */
  function departures(b: IBuild, reference: readonly V3[]): Record<string, unknown>[] {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const planes: { site: string; origin: V3; distal: V3; lateral: V3; anterior: V3 }[] = b.curves.sites.map((site: AutoMovieHumanArmViewCurves.ISite): { site: string; origin: V3; distal: V3; lateral: V3; anterior: V3 } => {
      const seg: AutoMovieHumanArmViewCurves.ISegment = b.curves.segments.find((x: AutoMovieHumanArmViewCurves.ISegment): boolean => site.walk >= x.interval[0] && site.walk <= x.interval[1])!;
      const t: AutoMovieHumanArmCurveSpec.ITransform = b.frames.chain(seg.frame, b.root);
      return {
        site: site.name,
        origin: S.apply(t, NodeArmDraw.add(seg.origin, NodeArmDraw.scale(seg.distal, site.walk - seg.walk))),
        distal: S.rotate(t, seg.distal),
        lateral: S.rotate(t, seg.lateral),
        anterior: S.rotate(t, seg.anterior),
      };
    });
    const cuts: NodeArmReference.ISection[] = NodeArmReference.sections(reference, planes);
    return b.curves.sites.map((site: AutoMovieHumanArmViewCurves.ISite, k: number): Record<string, unknown> => ({
      site: site.name,
      box: site.box,
      tape: site.girth,
      reference: cuts[k],
      difference: cuts[k]!.extents.map((e: number, j: number): number => e - site.box[j]!),
    }));
  }

  /** Points framing a camera: the whole arm with the reference, or a joint region. */
  function focusBounds(b: IBuild, reference: V3[], focus: string): V3[] {
    const course: V3[] = b.loft.centres;
    const rings: V3[] = b.chain === null ? course : b.chain.layers.flatMap((l: IAutoMovieLoftChain.ILayer): V3[] => AutoMovieLoftChain.ring(b.chain!, l.y, [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]));
    if (focus === "arm") return [...rings, ...reference, ...b.digits.map((d: AutoMovieHumanHandDigits.IDigit): V3 => d.tip)];
    const centre: V3 = focus === "elbow" ? course[1]! : course[2]!;
    const r: number = focus === "elbow" ? 110 : 95;
    return [NodeArmDraw.add(centre, [-r, -r, -r]), NodeArmDraw.add(centre, [r, r, r])];
  }

  /** Stage 1: the view curves of every segment in its own frame (all, or one kind alone), with their aids and datums. */
  function drawSpecs(v: NodeArmDraw.IView, b: IBuild, only: Curve | null = null): void {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const world: (frame: string) => AutoMovieHumanArmCurveSpec.ITransform = (frame: string): AutoMovieHumanArmCurveSpec.ITransform => b.frames.chain(frame, b.root);
    const chosen: AutoMovieHumanArmCurveSpec.ICurveSpec[] = b.curves.specs.filter((spec: AutoMovieHumanArmCurveSpec.ICurveSpec): boolean => only === null || spec.name.split(".")[1] === only);
    if (only === "fullness") {
      drawRings(v, b);
    }
    for (const spec of chosen) {
      const t: AutoMovieHumanArmCurveSpec.ITransform = world(spec.frame);
      for (const aid of spec.aids) {
        const style: [string, number, number[]] = AID_STYLE[aid.kind] ?? ["#999999", 1, []];
        NodeArmDraw.line(v, aid.points.map((p: V3): V3 => S.apply(t, p)), style[0], style[1], style[2]);
      }
    }
    for (const seg of b.curves.segments) {
      const t: AutoMovieHumanArmCurveSpec.ITransform = world(seg.frame);
      (["#d03030", "#30a030", "#3050d0"] as const).forEach((colour: string, k: number): void => {
        NodeArmDraw.line(v, [t.origin, NodeArmDraw.add(t.origin, NodeArmDraw.scale(t.axes[k]!, 30))], colour, 2);
      });
      for (const label of AutoMovieHumanArmViewCurves.LABELS) {
        if (only !== null && only !== label) continue;
        const dir: V3 = label === "lateral" ? seg.lateral : label === "medial" ? NodeArmDraw.scale(seg.lateral, -1) : label === "anterior" ? seg.anterior : NodeArmDraw.scale(seg.anterior, -1);
        const pts: V3[] = [];
        const [w0, w1]: [number, number] = seg.interval;
        const n: number = Math.ceil((w1 - w0) / 1.5);
        for (let k: number = 0; k <= n; ++k) {
          const w: number = w0 + ((w1 - w0) * k) / n;
          const y: number = AutoMovieHumanArmViewCurves.value(b.curves.outlines[label], w, b.curves.end)[0];
          pts.push(S.apply(t, NodeArmDraw.add(NodeArmDraw.add(seg.origin, NodeArmDraw.scale(seg.distal, w - seg.walk)), NodeArmDraw.scale(dir, y))));
        }
        NodeArmDraw.line(v, pts, LABEL_COLOUR[label], 2.2);
      }
    }
    for (const spec of chosen) {
      const t: AutoMovieHumanArmCurveSpec.ITransform = world(spec.frame);
      NodeArmDraw.dots(v, spec.datums.map((d: AutoMovieHumanArmCurveSpec.IDatum): V3 => S.apply(t, d.point)), "#000000", 4);
      for (const d of spec.datums) if (only !== null) NodeArmDraw.text(v, S.apply(t, d.point), d.name.split(".").slice(-1)[0]!, "#303030");
    }
    const side: Record<string, number[]> = { lateral: [0], medial: [1], anterior: [b.frames.medial > 0 ? 3 : 2], posterior: [b.frames.medial > 0 ? 2 : 3] };
    if (only === null || only in side) NodeArmDigits.specs(v, b.digits, only === null ? [0, 1, 2, 3] : side[only]!);
  }

  /** The fullness spec read as its conic sections at the girth sites: box from the outlines, shoulder from the fullness. */
  function drawRings(v: NodeArmDraw.IView, b: IBuild): void {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    for (const site of b.curves.sites) {
      const seg: AutoMovieHumanArmViewCurves.ISegment = b.curves.segments.find((x: AutoMovieHumanArmViewCurves.ISegment): boolean => site.walk >= x.interval[0] && site.walk <= x.interval[1])!;
      const t: AutoMovieHumanArmCurveSpec.ITransform = b.frames.chain(seg.frame, b.root);
      const m: number = b.frames.medial;
      const vDir: V3 = NodeArmDraw.scale(seg.anterior, -m);
      const [lat, med, ant, post]: [number, number, number, number] = site.box;
      const section: AutoMovieViewSection.ISection = AutoMovieViewSection.of({ extents: m > 0 ? [lat, post, med, ant] : [lat, ant, med, post] }, [site.shoulder, site.shoulder, site.shoulder, site.shoulder]);
      const centre: V3 = NodeArmDraw.add(seg.origin, NodeArmDraw.scale(seg.distal, site.walk - seg.walk));
      const pts: V3[] = Array.from({ length: 129 }, (_: unknown, k: number): V3 => {
        const phi: number = (2 * Math.PI * k) / 128;
        const r: number = AutoMovieViewSection.radius(section, phi)[0];
        return S.apply(t, NodeArmDraw.add(centre, NodeArmDraw.add(NodeArmDraw.scale(seg.lateral, r * Math.cos(phi)), NodeArmDraw.scale(vDir, r * Math.sin(phi)))));
      });
      NodeArmDraw.line(v, pts, "#000000", 1.6);
      const corners: V3[] = [[lat, post], [-med, post], [-med, -ant], [lat, -ant], [lat, post]].map(
        ([x, y]: number[]): V3 => S.apply(t, NodeArmDraw.add(centre, NodeArmDraw.add(NodeArmDraw.scale(seg.lateral, x!), NodeArmDraw.scale(vDir, m > 0 ? y! : -y!)))),
      );
      NodeArmDraw.line(v, corners, AID_STYLE.rectangle![0], 1, [3, 3]);
      NodeArmDraw.text(v, pts[16]!, `${site.name} rho ${site.shoulder.toFixed(3)} tape ${site.girth.toFixed(1)}`, "#202020");
    }
  }

  /** One kind of view curve shown alone. */
  type Curve = AutoMovieHumanArmViewCurves.Label | "axis" | "fullness";

  /** Stages 2 and 3: the actual loft's layer rings, its four guides and its course. */
  function drawLoft(v: NodeArmDraw.IView, b: IBuild): void {
    if (b.chain === null) {
      NodeArmDraw.caption(v, ["", `NO CHAIN: ${(b.loft.loft?.diagnostics ?? []).map((d: { detail: string }): string => d.detail).join(" | ").slice(0, 160)}`]);
      return;
    }
    const chain: IAutoMovieLoftChain = b.chain;
    const ring: number[] = Array.from({ length: 65 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 64);
    for (const layer of chain.layers) NodeArmDraw.line(v, AutoMovieLoftChain.ring(chain, layer.y, ring), "#505050", 0.7);
    const ys: number[] = sampleStations(chain, 1.5);
    const guideColour: string[] = [LABEL_COLOUR.lateral, LABEL_COLOUR.posterior, LABEL_COLOUR.medial, LABEL_COLOUR.anterior];
    [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach((phase: number, k: number): void => {
      NodeArmDraw.line(v, ys.map((y: number): V3 => AutoMovieLoftChain.point(chain, y, phase)), guideColour[k]!, 2);
    });
    NodeArmDraw.line(v, chain.layers.map((l: IAutoMovieLoftChain.ILayer): V3 => AutoMovieLoftChain.axis(chain, l.y)), "#888888", 1, [4, 3]);
    // The open proximal end is the pending trunk-junction port, drawn as such.
    const port: V3[] = AutoMovieLoftChain.ring(chain, chain.layers[0]!.y, ring);
    NodeArmDraw.line(v, port, "#ff7a00", 3, [8, 4]);
    NodeArmDraw.text(v, port[0]!, "pending trunk-junction port (GH level)", "#c05a00");
    NodeArmDigits.loft(v, b.digits);
  }

  /** Stations from the first to the last layer at about the given step. */
  function sampleStations(chain: IAutoMovieLoftChain, step: number): number[] {
    const a: number = chain.layers[0]!.y;
    const z: number = chain.layers[chain.layers.length - 1]!.y;
    const n: number = Math.max(2, Math.ceil((z - a) / step));
    return Array.from({ length: n + 1 }, (_: unknown, k: number): number => a + ((z - a) * k) / n);
  }

  /** Clay triangles: a station-phase grid of the actual chain, fanned to its poles. */
  function triangles(chain: IAutoMovieLoftChain | null): [V3, V3, V3][] {
    if (chain === null) return [];
    const phases: number[] = Array.from({ length: 72 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 72);
    const rows: V3[][] = sampleStations(chain, 1.5).map((y: number): V3[] => AutoMovieLoftChain.ring(chain, y, phases));
    const out: [V3, V3, V3][] = [];
    for (let i: number = 0; i + 1 < rows.length; ++i)
      for (let k: number = 0; k < phases.length; ++k) {
        const k1: number = (k + 1) % phases.length;
        out.push([rows[i]![k]!, rows[i + 1]![k]!, rows[i + 1]![k1]!], [rows[i]![k]!, rows[i + 1]![k1]!, rows[i]![k1]!]);
      }
    // Each pole closes the end its own `end` names (the first or the last row).
    for (const pole of [chain.pole, chain.opposite]) {
      if (pole === undefined) continue;
      const row: V3[] = pole.end === "bottom" ? rows[0]! : rows[rows.length - 1]!;
      for (let k: number = 0; k < phases.length; ++k) out.push([pole.point as V3, row[k]!, row[(k + 1) % phases.length]!]);
    }
    return out;
  }

  /** Perimeter of the actual chain ring at each girth site, 1440-gon, against its tape. */
  function girths(b: IBuild): { site: string; station: number; tape: number; ring: number; section: number | null }[] {
    if (b.chain === null) return [];
    const phases: number[] = Array.from({ length: 1440 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 1440);
    return b.curves.sites.map((s: AutoMovieHumanArmViewCurves.ISite): { site: string; station: number; tape: number; ring: number; section: number | null } => {
      const station: number = b.loft.station(s.walk);
      const p: V3[] = AutoMovieLoftChain.ring(b.chain!, station, phases);
      let ring: number = 0;
      for (let k: number = 0; k < p.length; ++k) ring += Math.hypot(...NodeArmDraw.sub(p[(k + 1) % p.length]!, p[k]!));
      const found: { station: number; section: { girth: number } } | undefined = b.loft.loft?.sections.find((x: { station: number }): boolean => Math.abs(x.station - station) < 1e-6);
      return { site: s.name, station, tape: s.girth, ring, section: found?.section.girth ?? null };
    });
  }

  function every(points: V3[], k: number): V3[] {
    return points.filter((_: V3, i: number): boolean => i % k === 0);
  }

  /** Outline colours. */
  const LABEL_COLOUR: Record<AutoMovieHumanArmViewCurves.Label, string> = { lateral: "#008080", medial: "#c00060", anterior: "#e07000", posterior: "#8040c0" };

  /** Aid styles: colour, width, dash. */
  const AID_STYLE: Record<string, [string, number, number[]]> = {
    axis: ["#7a7a7a", 1, [6, 3]],
    rectangle: ["#9fa8ff", 0.8, [3, 3]],
    chord: ["#b4b4b4", 0.8, [2, 2]],
    tick: ["#202020", 1.2, []],
    division: ["#8a8a8a", 1, []],
    tangent: ["#1a9fff", 1, []],
    extremum: ["#ff2bd6", 1, [2, 2]],
    plane: ["#ff8a00", 1.4, [5, 2]],
    polygon: ["#3cba3c", 0.8, [1, 2]],
  };
}

void NodeArmSpecs.run().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
