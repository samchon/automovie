import fs from "node:fs";
import path from "node:path";
import { AutoMovieLoftChain, AutoMovieLoftRelief, AutoMovieViewSection, type IAutoMovieLoftChain } from "@automovie/engine";
import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanLegLandmarks } from "../generation/leg/AutoMovieHumanLegLandmarks";
import { AutoMovieHumanLegViewCurves } from "../generation/leg/AutoMovieHumanLegViewCurves";
import { AutoMovieHumanLegViewSpecs } from "../generation/leg/AutoMovieHumanLegViewSpecs";
import { AutoMovieHumanFootToes } from "../generation/foot/AutoMovieHumanFootToes";
import { HumanNodeInput } from "./HumanNodeInput";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeArmDraw } from "./NodeArmDraw";
import { NodeLegBuild } from "./NodeLegBuild";
import { NodeLegReference } from "./NodeLegReference";
import { NodeLegWhole } from "./NodeLegWhole";

type V3 = AutoMovieHumanArmCurveSpec.Vec3;
type Spec = AutoMovieHumanArmCurveSpec.ICurveSpec;

/**
 * Direct Node images of the leg view-curve construction for f1's left leg
 * and foot (`node:leg-specs`), following the arm renderer's pattern, in four
 * stages at front, left, top, medial and the knee and ankle obliques:
 * 1. the 2D view-curve specs of each segment in its own frame with their
 *    construction aids, over the reference leg registered into this leg's
 *    chain (diagnostic only); each outline kind also alone;
 * 2. the actual loft curves of the engine view loft (layer rings, the four
 *    guide lines, the course and the open port);
 * 3. those curves over the default clay of the lofted surface;
 * 4. the clay alone.
 * A flexed pose (knee 0.6 rad, ankle 0.25 rad dorsiflexion) adds loft curves
 * and clay at the left side. The leg is drawn in its femur frame (the trunk
 * hip port's world transform is recorded, not applied). A manifest keeps the
 * inputs, the sites with their boxes and fullness, the measured ring
 * perimeters at the girth sites, the registration's measures and the
 * constructor timings (cold, retained, one-input edit).
 */
export namespace NodeLegSpecs {
  /** Draws every stage and camera and writes PNGs plus a manifest under `.shots/f1_leg2/leg-<stamp>/`. */
  export async function run(): Promise<void> {
    const started: number = performance.now();
    const person: Awaited<ReturnType<typeof HumanNodeInput.of>> = await HumanNodeInput.of();
    // The rooted body first: its left leg's inputs carry the trunk's contours, so every view draws the leg the body realizes.
    const wholeBody: NodeLegWhole.IOutput = NodeLegWhole.build(person.parameters);
    const inputs: NodeLegBuild.IInputs = wholeBody.sides.left.inputs ?? NodeLegBuild.inputs(person.parameters);
    const loaded: number = performance.now();

    const cold: NodeLegBuild.IBuild = NodeLegBuild.build(inputs, { knee: 0, ankle: 0 }, AutoMovieHumanArmCurveSpec.IDENTITY, true);
    const retained: NodeLegBuild.IBuild = NodeLegBuild.build(inputs, { knee: 0, ankle: 0 });
    const edited: NodeLegBuild.IBuild = NodeLegBuild.build({ ...inputs, tapes: { ...inputs.tapes, calf: inputs.tapes.calf + 10 } }, { knee: 0, ankle: 0 });
    const flexed: NodeLegBuild.IBuild = NodeLegBuild.build(inputs, { knee: 0.6, ankle: 0.25 });
    const referenceMesh: { points: V3[]; indices: number[] } = NodeLegReference.loadMesh(inputs.scale, inputs.landmarks.crotch - 5);
    const reference: NodeLegReference.IRegistered = NodeLegReference.register(referenceMesh.points, cold.frames, inputs.landmarks.crotch, inputs.root);

    const stamp: string = new Date().toISOString().replace(/[:.]/g, "-");
    const out: string = HumanNodePaths.resolve(`packages/human/.shots/f1_leg2/leg-${stamp}`);
    fs.mkdirSync(out, { recursive: true });
    const files: string[] = [];
    const write: (name: string, view: NodeArmDraw.IView) => void = (name: string, view: NodeArmDraw.IView): void => {
      fs.writeFileSync(path.join(out, name), NodeArmDraw.png(view));
      files.push(name);
    };
    const drawStart: number = performance.now();
    const mesh: [V3, V3, V3][] = [...triangles(cold.chain), ...cold.toes.flatMap((t: AutoMovieHumanFootToes.IToe): [V3, V3, V3][] => triangles(t.loft.chain)), ...(cold.toeTree?.blends ?? []).flatMap((c: IAutoMovieLoftChain): [V3, V3, V3][] => triangles(c))];
    const flexedMesh: [V3, V3, V3][] = [...triangles(flexed.chain), ...flexed.toes.flatMap((t: AutoMovieHumanFootToes.IToe): [V3, V3, V3][] => triangles(t.loft.chain))];
    for (const [camera, forward, focus] of CAMERAS) {
      const bounds: V3[] = focusBounds(cold, reference.points, focus);
      for (const stage of [1, 2, 3, 4] as const) {
        const v: NodeArmDraw.IView = NodeArmDraw.open(forward, bounds);
        if (stage === 1 || stage === 2) NodeArmDraw.dots(v, every(reference.points, 2), "#cfcfcf", 1.6);
        if (stage >= 3) NodeArmDraw.clay(v, mesh);
        if (stage === 1) {
          drawSpecs(v, cold);
          drawToes(v, cold);
        }
        if (stage === 2 || stage === 3) drawLoft(v, cold);
        NodeArmDraw.caption(v, [`f1 left leg, neutral, ${camera}, stage ${stage}: ${STAGES[stage - 1]}`]);
        write(`neutral.${camera}.${stage}.png`, v);
      }
    }
    for (const [curve, cameras] of INDIVIDUAL)
      for (const camera of cameras) {
        const [, forward]: [string, V3, string] = CAMERAS.find((c: [string, V3, string]): boolean => c[0] === camera)!;
        const v: NodeArmDraw.IView = NodeArmDraw.open(forward, focusBounds(cold, reference.points, "leg"));
        NodeArmDraw.dots(v, every(reference.points, 2), "#cfcfcf", 1.6);
        drawSpecs(v, cold, curve);
        if (curve !== "axis" && curve !== "fullness") drawToes(v, cold);
        NodeArmDraw.caption(v, [`f1 left leg, neutral, ${camera}, stage 1 alone: ${curve} view curve per segment + aids over registered reference`]);
        write(`neutral.1.${curve}.${camera}.png`, v);
      }
    for (const stage of [2, 4] as const) {
      const v: NodeArmDraw.IView = NodeArmDraw.open([0, 0, 1], flexed.loft.centres.length > 0 ? [...flexed.loft.centres, ...flexedMesh.map((t: [V3, V3, V3]): V3 => t[0])] : [[0, 0, 0]]);
      if (stage === 4) NodeArmDraw.clay(v, flexedMesh);
      else drawLoft(v, flexed);
      NodeArmDraw.caption(v, [`f1 left leg, knee 0.6 rad, ankle 0.25 rad, left, stage ${stage}: ${STAGES[stage - 1]}`]);
      write(`flexed.left.${stage}.png`, v);
    }
    // The trunk with both legs rooted on its pants split, world coordinates.
    const wholeStart: number = performance.now();
    const whole: NodeLegWhole.IOutput = wholeBody;
    const wholeMesh: [V3, V3, V3][] = NodeLegWhole.triangles(whole);
    // Every 40th vertex frames the views (the canvas reads its bounds by spread arguments).
    const all: V3[] = wholeMesh.filter((_: [V3, V3, V3], i: number): boolean => i % 40 === 0).map((t: [V3, V3, V3]): V3 => t[0]);
    const crotch: V3 = whole.sides.left.root?.loop(Math.PI) ?? [0, 800, 0];
    const near: V3[] = [NodeArmDraw.add(crotch, [-160, -200, -160]), NodeArmDraw.add(crotch, [160, 120, 160])];
    for (const [camera, forward, bounds] of [
      ["front", [-1, 0, 0], all],
      ["left", [0, 0, 1], all],
      ["back", [1, 0, 0], all],
      ["below", [0, 1, 0], all],
      ["crotch-front", [-1, 0, 0], near],
      ["crotch-below", [0, 1, 0], near],
    ] as [string, V3, V3[]][]) {
      const v: NodeArmDraw.IView = NodeLegWhole.draw(whole, forward, bounds, [`f1 trunk S00 with both legs on the pants split (hip-root bands, dashed: the port loops), ${camera}, clay`], wholeMesh);
      write(`whole.${camera}.png`, v);
    }
    // S00 alone under the crotch with the port loops: whose surface the strip between the loops is.
    write("whole.crotch-below-trunk.png", NodeLegWhole.draw(whole, [0, 1, 0], near, ["f1 trunk S00 alone (no bands, no legs), port loops dashed, crotch-below, clay"], NodeLegWhole.trunkTriangles(whole)));
    // The gluteal sulcus under raking light from both sides and from above, around the left fold.
    const fold: V3 = whole.sides.left.root?.loop(0) ?? crotch;
    const sulcus: V3[] = [NodeArmDraw.add(fold, [-140, -90, -150]), NodeArmDraw.add(fold, [60, 90, 150])];
    // Each light points toward its source, from the side and a little toward the camera, so the faces the camera sees are lit at a grazing angle.
    for (const [camera, forward, light] of [
      ["sulcus-back-rake-left", [1, 0, 0], [-0.25, 0.15, -1]],
      ["sulcus-back-rake-right", [1, 0, 0], [-0.25, 0.15, 1]],
      ["sulcus-side-rake-above", [0, 0, 1], [-0.3, 1, -0.3]],
    ] as [string, V3, V3][]) {
      write(`whole.${camera}.png`, NodeLegWhole.raked(forward, sulcus, [`f1 gluteal sulcus (declared crease at the rail), ${camera}, raking light ${light.map((x: number): string => x.toFixed(2)).join(", ")}`], wholeMesh, light));
    }
    const wholeMs: number = performance.now() - wholeStart;
    const drawn: number = performance.now();

    fs.writeFileSync(
      path.join(out, "manifest.json"),
      JSON.stringify(
        {
          person: "f1",
          side: "left",
          inputs,
          root: inputs.root,
          heights: cold.frames.heights,
          lengths: cold.frames.lengths,
          landmarks: cold.landmarks.list.map((l: AutoMovieHumanLegLandmarks.ILandmark): { name: string; frame: string; walk: number; point: V3; source: string } => ({ name: l.name, frame: l.frame, walk: l.walk, point: l.point, source: l.source.kind })),
          gaps: cold.landmarks.gaps,
          sites: cold.curves.sites,
          bisection: cold.curves.bisection,
          course: { angles: cold.loft.course.angles, halves: cold.loft.course.halves, length: cold.loft.course.length },
          girths: girths(cold),
          footBounds: footBounds(cold),
          toeTree: cold.toeTree === null ? null : { diagnostics: cold.toeTree.diagnostics, blends: cold.toeTree.blends.map((c: IAutoMovieLoftChain): { name: string; layers: number } => ({ name: c.name, layers: c.layers.length })), faces: cold.toeTree.tree?.body.faces.map((f: { chain: string; cycles: unknown[] }): { chain: string; cycles: number } => ({ chain: f.chain, cycles: f.cycles.length })) ?? [], ms: cold.ms.toeTree },
          pole: poleInToes(cold),
          seeds: seedLines(cold),
          // The patella relief's rendered height over the knee's conic surface: its height field at the window's centre on the anterior guide.
          patella: (cold.chain?.reliefs ?? []).filter((r: { name: string }): boolean => r.name === "patella").map((r: Parameters<typeof AutoMovieLoftRelief.jet>[0]): { stations: [number, number]; phases: [number, number]; peak: number } => ({ stations: r.stations, phases: r.phases, peak: AutoMovieLoftRelief.jet(r, (r.stations[0] + r.stations[1]) / 2, (r.phases[0] + r.phases[1]) / 2)[0]! })),
          whole: { diagnostics: whole.diagnostics, ms: { ...whole.ms, total: wholeMs }, extents: whole.extents, density: whole.density, clearance: { minimum: Math.min(...whole.clearance.map((c: { clearance: number }): number => c.clearance)), contact: whole.clearance.filter((c: { clearance: number }): boolean => c.clearance < 0.5), samples: whole.clearance } },
          outlines: cold.curves.outlines,
          diagnostics: { curves: cold.curves.diagnostics, loft: cold.loft.diagnostics, engine: (cold.loft.loft?.diagnostics ?? []).map((d: { detail: string }): string => d.detail), flexed: [...flexed.loft.diagnostics, ...(flexed.loft.loft?.diagnostics ?? []).map((d: { detail: string }): string => d.detail)] },
          registration: reference.measures,
          // Every leg and foot curve against the registered reference: guides (outlines) and quarter diagonals (fullness), mm.
          deviation: NodeLegReference.deviation(cold, reference.points, referenceMesh.indices),
          centres: NodeLegReference.centres(cold, reference.points, referenceMesh.indices),
          referenceSites: NodeLegReference.sites(cold, reference.points, referenceMesh.indices),
          // f1's own readings by their definitions (horizontal planes in world), the person inputs' receipts.
          readings: NodeLegReference.readings(referenceMesh.points, referenceMesh.indices, { knee: cold.frames.heights.knee, lateralMalleolus: cold.frames.heights.lateralMalleolus }),
          heelAnkle: cold.heelAnkle,
          // f1's own landmarks and girths by their definitions, world (the causes' investigation).
          investigation: NodeLegReference.investigate(referenceMesh.points, referenceMesh.indices, { stature: inputs.landmarks.stature, tibiale: cold.frames.heights.tibiale, knee: AutoMovieHumanArmCurveSpec.apply(inputs.root, cold.frames.points.knee), im: AutoMovieHumanArmCurveSpec.apply(inputs.root, cold.frames.points.im) }),
          ourHeel: AutoMovieHumanArmCurveSpec.apply(AutoMovieHumanArmCurveSpec.compose(inputs.root, cold.frames.chain(cold.frames.foot.name, AutoMovieHumanArmCurveSpec.IDENTITY)), cold.landmarks.foot.heel),
          ourIm: AutoMovieHumanArmCurveSpec.apply(inputs.root, cold.frames.points.im),
          // f1 in each segment frame by her own joints, beside the model: [+u lateral, +v posterior, -u medial, -v anterior, four diagonals], mm.
          segmentTable: NodeLegReference.segmentTable(cold, referenceMesh.points, referenceMesh.indices, inputs.root),
          timings: { loadMs: loaded - started, cold: cold.ms, retained: retained.ms, edit: edited.ms, flexed: flexed.ms, drawMs: drawn - drawStart, totalMs: performance.now() - started },
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
    ["front", [-1, 0, 0], "leg"],
    ["left", [0, 0, 1], "leg"],
    ["medial", [0, 0, -1], "leg"],
    ["top", [0, -1, 0], "foot"],
    ["knee-oblique", [-1, -0.4, 1], "knee"],
    ["knee-front", [-1, 0, 0], "knee"],
    ["knee-side", [0, 0, 1], "knee"],
    ["ankle-oblique", [-1, -0.5, 1], "ankle"],
    ["foot-left", [0, 0, 1], "ankle"],
  ];

  /** The individual stage-1 frames: each view curve kind at the cameras that see it. */
  const INDIVIDUAL: [Curve, string[]][] = [
    ["lateral", ["front"]],
    ["medial", ["front"]],
    ["anterior", ["left"]],
    ["posterior", ["left"]],
    ["axis", ["front", "left"]],
    ["fullness", ["front", "left"]],
  ];

  /** One kind of view curve shown alone. */
  type Curve = AutoMovieHumanLegViewCurves.Label | "axis" | "fullness";

  /** Points framing a camera: the whole leg with the reference, or a joint region. */
  function focusBounds(b: NodeLegBuild.IBuild, reference: V3[], focus: string): V3[] {
    const course: V3[] = b.loft.centres;
    const rings: V3[] = b.chain === null ? course : b.chain.layers.flatMap((l: IAutoMovieLoftChain.ILayer): V3[] => AutoMovieLoftChain.ring(b.chain!, l.y, [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]));
    if (focus === "leg") return [...rings, ...reference];
    if (focus === "foot") return [...rings.filter((p: V3): boolean => p[1] < course[2]![1] + 120), ...reference.filter((p: V3): boolean => p[1] < course[2]![1] + 120)];
    const centre: V3 = focus === "knee" ? course[1]! : course[2]!;
    const r: number = focus === "knee" ? 130 : 150;
    return [NodeArmDraw.add(centre, [-r, -r, -r]), NodeArmDraw.add(centre, [r, r, r])];
  }

  /** Stage 1: the view curves of every segment in its own frame (all, or one kind alone), with their aids and datums. */
  function drawSpecs(v: NodeArmDraw.IView, b: NodeLegBuild.IBuild, only: Curve | null = null): void {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const world: (frame: string) => AutoMovieHumanArmCurveSpec.ITransform = (frame: string): AutoMovieHumanArmCurveSpec.ITransform => b.frames.chain(frame, S.IDENTITY);
    const chosen: Spec[] = b.specs.filter((spec: Spec): boolean => only === null || spec.name.split(".")[1] === only);
    if (only === "fullness") drawRings(v, b);
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
        NodeArmDraw.line(v, [t.origin, NodeArmDraw.add(t.origin, NodeArmDraw.scale(t.axes[k]!, 40))], colour, 2);
      });
      for (const label of AutoMovieHumanLegViewCurves.LABELS) {
        if (only !== null && only !== label) continue;
        const dir: V3 = AutoMovieHumanLegViewSpecs.direction(seg, label);
        const pts: V3[] = [];
        const [w0, w1]: [number, number] = seg.interval;
        const n: number = Math.ceil((w1 - w0) / 1.5);
        for (let k: number = 0; k <= n; ++k) {
          const w: number = w0 + ((w1 - w0) * k) / n;
          const y: number = AutoMovieHumanLegViewCurves.value(b.curves.outlines[label], w, b.curves.end)[0];
          pts.push(S.apply(t, NodeArmDraw.add(NodeArmDraw.add(seg.origin, NodeArmDraw.scale(seg.distal, w - seg.walk)), NodeArmDraw.scale(dir, y))));
        }
        NodeArmDraw.line(v, pts, LABEL_COLOUR[label], 2.2);
      }
    }
    for (const spec of chosen) {
      const t: AutoMovieHumanArmCurveSpec.ITransform = world(spec.frame);
      NodeArmDraw.dots(v, spec.datums.map((d: AutoMovieHumanArmCurveSpec.IDatum): V3 => S.apply(t, d.point)), "#000000", 4);
      if (only !== null) for (const d of spec.datums) NodeArmDraw.text(v, S.apply(t, d.point), d.name.split(".").slice(-1)[0]!, "#303030");
    }
    // Floor line under the foot.
    const floor: number = -b.frames.heights.hip;
    NodeArmDraw.line(v, [[-120, floor, 0], [260, floor, 0]], "#9fa8ff", 1, [3, 3]);
    // The heel's back line through the pternion, a bounding datum of the heel.
    const heel: V3 = S.apply(world(b.frames.foot.name), b.landmarks.foot.heel);
    NodeArmDraw.line(v, [heel, NodeArmDraw.add(heel, [0, b.frames.heights.im, 0])], "#9fa8ff", 1, [3, 3]);
  }

  /** The fullness read as its conic sections at the girth sites (the bisection's in its stretched box). */
  function drawRings(v: NodeArmDraw.IView, b: NodeLegBuild.IBuild): void {
    if (b.chain === null || b.loft.course.axis === null) return;
    for (const site of b.curves.sites) {
      const station: number = b.loft.station(site.walk);
      const plane: { origin: V3; u: V3; v: V3 } = b.loft.course.axis.at(station);
      const [lat, med, ant, post]: [number, number, number, number] = site.name === "ankle bisection" ? b.curves.bisection : site.box;
      const section: AutoMovieViewSection.ISection = AutoMovieViewSection.of({ extents: [lat, post, med, ant] }, [site.shoulder, site.shoulder, site.shoulder, site.shoulder]);
      const pts: V3[] = Array.from({ length: 129 }, (_: unknown, k: number): V3 => {
        const phi: number = (2 * Math.PI * k) / 128;
        const r: number = AutoMovieViewSection.radius(section, phi)[0];
        return NodeArmDraw.add(plane.origin, NodeArmDraw.add(NodeArmDraw.scale(plane.u, r * Math.cos(phi)), NodeArmDraw.scale(plane.v, r * Math.sin(phi))));
      });
      NodeArmDraw.line(v, pts, "#000000", 1.6);
      NodeArmDraw.text(v, pts[16]!, `${site.name} rho ${site.shoulder.toFixed(3)} tape ${site.girth.toFixed(1)}`, "#202020");
    }
  }


  /** Stage 1 for the toes: each toe's four outlines and its axis in its own frame, written through the foot frame. */
  function drawToes(v: NodeArmDraw.IView, b: NodeLegBuild.IBuild): void {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const foot: AutoMovieHumanArmCurveSpec.ITransform = b.frames.chain(b.frames.foot.name, S.IDENTITY);
    for (const toe of b.toes) {
      const t: AutoMovieHumanArmCurveSpec.ITransform = S.compose(foot, toe.frame.relative);
      for (const spec of AutoMovieHumanFootToes.specs(toe, b.frames.medial)) {
        if (spec.representation.kind !== "outline" || spec.representation.direction === null) continue;
        const dir: V3 = spec.representation.direction;
        const pts: V3[] = [];
        for (let s: number = 0; s <= toe.length + 1e-9; s += 0.5) pts.push(S.apply(t, [dir[0] * AutoMovieHumanFootToes.value(toe, spec, s)!, -s + dir[1] * AutoMovieHumanFootToes.value(toe, spec, s)!, dir[2] * AutoMovieHumanFootToes.value(toe, spec, s)!]));
        const label: string = spec.name.split(".")[1]!;
        NodeArmDraw.line(v, pts, label === "lateral" ? LABEL_COLOUR.lateral : label === "medial" ? LABEL_COLOUR.medial : label === "dorsal" ? LABEL_COLOUR.anterior : LABEL_COLOUR.posterior, 1.6);
        for (const aid of spec.aids) NodeArmDraw.line(v, aid.points.map((p: V3): V3 => S.apply(t, p)), (AID_STYLE[aid.kind] ?? ["#999999", 1, []])[0], 0.8, (AID_STYLE[aid.kind] ?? ["#999999", 1, []])[2]);
      }
      NodeArmDraw.line(v, [S.apply(t, [0, 0, 0]), S.apply(t, [0, -toe.length, 0])], "#7a7a7a", 1, [6, 3]);
    }
  }

  /** Stages 2 and 3: the actual loft's layer rings, its four guides, its course and the open port. */
  function drawLoft(v: NodeArmDraw.IView, b: NodeLegBuild.IBuild): void {
    if (b.chain === null) {
      NodeArmDraw.caption(v, ["", `NO CHAIN: ${[...b.loft.diagnostics, ...(b.loft.loft?.diagnostics ?? []).map((d: { detail: string }): string => d.detail)].join(" | ").slice(0, 200)}`]);
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
    const port: V3[] = AutoMovieLoftChain.ring(chain, chain.layers[0]!.y, ring);
    NodeArmDraw.line(v, port, "#ff7a00", 3, [8, 4]);
    NodeArmDraw.text(v, port[0]!, "pending hip-port band (crotch level)", "#c05a00");
    for (const toe of b.toes) {
      const chainT: IAutoMovieLoftChain | null = toe.loft.chain;
      if (chainT === null) {
        NodeArmDraw.text(v, AutoMovieHumanArmCurveSpec.apply(b.frames.chain(b.frames.foot.name, AutoMovieHumanArmCurveSpec.IDENTITY), toe.root), `toe ${toe.digit}: no chain`, "#c00000");
        continue;
      }
      for (const layer of chainT.layers) NodeArmDraw.line(v, AutoMovieLoftChain.ring(chainT, layer.y, ring), "#505050", 0.5);
      const ts: number[] = sampleStations(chainT, 1);
      [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach((phase: number, k: number): void => {
        NodeArmDraw.line(v, ts.map((y: number): V3 => AutoMovieLoftChain.point(chainT, y, phase)), guideColour[k]!, 1.4);
      });
      const rootRing: V3[] = AutoMovieLoftChain.ring(chainT, chainT.layers[0]!.y, ring);
      NodeArmDraw.line(v, rootRing, "#ff7a00", 1.6, [4, 3]);
    }
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
    // Each pole closes the end row nearest to it (the leg's pole is its distal toe-web end; its port end is open).
    const ends: V3[][] = [rows[0]!, rows[rows.length - 1]!];
    const gap: (pole: V3, row: V3[]) => number = (pole: V3, row: V3[]): number => Math.min(...row.map((p: V3): number => Math.hypot(...NodeArmDraw.sub(p, pole))));
    for (const pole of [chain.pole?.point, chain.opposite?.point]) {
      if (pole === undefined) continue;
      const row: V3[] = gap(pole as V3, ends[0]!) < gap(pole as V3, ends[1]!) ? ends[0]! : ends[1]!;
      for (let k: number = 0; k < phases.length; ++k) out.push([pole as V3, row[k]!, row[(k + 1) % phases.length]!]);
    }
    return out;
  }

  /**
   * The foot's actual extent against its bounding datums, femur frame: how far
   * the chain reaches behind the heel's back line (pternion) and below the
   * floor, sampled every 0.5 mm of station over the ankle turn and the foot
   * run on 256 phases. Positive values are overshoots.
   */
  function footBounds(b: NodeLegBuild.IBuild): { heelOvershoot: number; heelAt: V3 | null; floorDip: number; floorAt: V3 | null } {
    if (b.chain === null) return { heelOvershoot: NaN, heelAt: null, floorDip: NaN, floorAt: null };
    const foot: AutoMovieHumanArmCurveSpec.ITransform = b.frames.chain(b.frames.foot.name, AutoMovieHumanArmCurveSpec.IDENTITY);
    const heel: V3 = AutoMovieHumanArmCurveSpec.apply(foot, b.landmarks.foot.heel);
    const phases: number[] = Array.from({ length: 256 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 256);
    const last: number = b.chain.layers[b.chain.layers.length - 1]!.y;
    let heelOvershoot: number = -Infinity;
    let floorDip: number = -Infinity;
    let heelAt: V3 | null = null;
    let floorAt: V3 | null = null;
    for (let s: number = b.loft.station(b.landmarks.course.im) - 120; s < last; s += 0.5)
      for (const p of AutoMovieLoftChain.ring(b.chain, s, phases)) {
        if (heel[0] - p[0] > heelOvershoot) [heelOvershoot, heelAt] = [heel[0] - p[0], p];
        if (heel[1] - p[1] > floorDip) [floorDip, floorAt] = [heel[1] - p[1], p];
      }
    return { heelOvershoot, heelAt, floorDip, floorAt };
  }

  /** Perimeter of the actual chain ring at each girth site, 1440-gon, against its tape. */
  function girths(b: NodeLegBuild.IBuild): { site: string; station: number; tape: number; ring: number }[] {
    if (b.chain === null) return [];
    const phases: number[] = Array.from({ length: 1440 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 1440);
    return b.curves.sites.map((s: AutoMovieHumanLegViewCurves.ISite): { site: string; station: number; tape: number; ring: number } => {
      const station: number = b.loft.station(s.walk);
      const p: V3[] = AutoMovieLoftChain.ring(b.chain!, station, phases);
      let ring: number = 0;
      for (let k: number = 0; k < p.length; ++k) ring += Math.hypot(...NodeArmDraw.sub(p[(k + 1) % p.length]!, p[k]!));
      return { site: s.name, station, tape: s.girth, ring };
    });
  }

  /** The forefoot's closing pole against each toe: its station along the toe, its distance from the toe's axis and the toe's half-breadth there (inside when smaller). */
  function poleInToes(b: NodeLegBuild.IBuild): { toe: number; station: number; distance: number; radius: number | null; inside: boolean }[] {
    const pole: V3 = AutoMovieHumanLegLandmarks.get(b.landmarks, "web").point;
    return b.toes.map((toe: AutoMovieHumanFootToes.IToe): { toe: number; station: number; distance: number; radius: number | null; inside: boolean } => {
      const local: V3 = AutoMovieHumanArmCurveSpec.apply(AutoMovieHumanArmCurveSpec.inverse(toe.frame.relative), pole);
      const station: number = -local[1];
      const radius: number | null = station >= 0 && station <= toe.length ? AutoMovieHumanFootToes.value(toe, AutoMovieHumanFootToes.specs(toe, b.frames.medial)[0]!, station) : null;
      const distance: number = Math.hypot(local[0], local[2]);
      return { toe: toe.digit, station, distance, radius, inside: radius !== null && distance < radius };
    });
  }

  /**
   * Each toe's seed line (its plantar line, as the toe tree seeds it)
   * against the leg-foot host, sampled every 0.5 mm over the
   * whole toe: the first toe station where the line leaves the host's section
   * ring (winding number in the foot run's section plane), the host walk
   * there, the distance from there to the closing pole, and the toe's length
   * (the tree searches its seed over `AutoMovieHumanFootToeTree.SEARCH` of
   * it); exit null when the line never leaves. A missing host or toe chain is
   * a diagnostic, not a line.
   */
  function seedLines(b: NodeLegBuild.IBuild): { diagnostics: string[]; lines: ISeedLine[] } {
    const diagnostics: string[] = [];
    const lines: ISeedLine[] = [];
    const host: IAutoMovieLoftChain | null = b.chain;
    if (host === null) {
      diagnostics.push("the leg-foot host has no chain: no seed line is measured");
      return { diagnostics, lines };
    }
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const im: V3 = b.frames.points.im;
    const t: V3 = S.unit(NodeArmDraw.sub(b.landmarks.points.web, im));
    const e1: V3 = S.unit(S.cross(t, [0, 1, 0]));
    const e2: V3 = S.cross(e1, t);
    const phases: number[] = Array.from({ length: 256 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 256);
    const inside: (p: V3) => { inside: boolean; walk: number } = (p: V3): { inside: boolean; walk: number } => {
      const walk: number = b.landmarks.course.im + S.dot(NodeArmDraw.sub(p, im), t);
      if (walk >= b.landmarks.course.web) return { inside: false, walk };
      const ring: [number, number][] = AutoMovieLoftChain.ring(host, b.loft.station(walk), phases).map((q: V3): [number, number] => [S.dot(NodeArmDraw.sub(q, p), e1), S.dot(NodeArmDraw.sub(q, p), e2)]);
      let winding: number = 0;
      ring.forEach((a: [number, number], k: number): void => {
        const c: [number, number] | undefined = ring[(k + 1) % ring.length];
        if (c !== undefined) winding += Math.atan2(a[0] * c[1] - a[1] * c[0], a[0] * c[0] + a[1] * c[1]);
      });
      return { inside: Math.abs(winding) > Math.PI, walk };
    };
    for (const toe of b.toes) {
      const phase: number = toe.plantar;
      const chain: IAutoMovieLoftChain | null = toe.loft.chain;
      if (chain === null) {
        diagnostics.push(`${toe.name}: the toe's loft has no chain; its seed line is not measured`);
        continue;
      }
      let exit: { s: number; walk: number; p: V3 } | null = null;
      for (let s: number = 0; s <= toe.length && exit === null; s += 0.5) {
        const p: V3 | undefined = AutoMovieLoftChain.ring(chain, s, [phase])[0];
        if (p === undefined) {
          diagnostics.push(`${toe.name}: no point on the seed line at station ${s}`);
          break;
        }
        const here: { inside: boolean; walk: number } = inside(p);
        if (!here.inside) exit = { s, walk: here.walk, p };
      }
      // The root ring just past the open root end (station 0.5, 32 phases): every point must lie inside the host, or the toe's footprint runs into its open end.
      const rootOutside: number = AutoMovieLoftChain.ring(chain, 0.5, Array.from({ length: 32 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 32)).filter((p: V3): boolean => !inside(p).inside).length;
      lines.push({ toe: toe.digit, phase, exit: exit === null ? null : exit.s, walk: exit === null ? null : exit.walk, pole: exit === null ? null : Math.hypot(...NodeArmDraw.sub(exit.p, b.landmarks.points.web)), length: toe.length, rootOutside });
    }
    return { diagnostics, lines };
  }

  /** One toe's seed line against the host: where it leaves (toe station), the host walk there, its distance to the pole and the toe's length, mm. */
  interface ISeedLine {
    /** Digit. */
    toe: number;

    /** The seed's phase on the toe. */
    phase: number;

    /** First toe station outside the host, or null. */
    exit: number | null;

    /** Host walk at the exit, or null. */
    walk: number | null;

    /** Distance from the exit to the closing pole, or null. */
    pole: number | null;

    /** The toe's root-to-apex length. */
    length: number;

    /** Points of the toe's root ring (station 0.5, 32 phases) outside the host. */
    rootOutside: number;
  }

  function every(points: V3[], k: number): V3[] {
    return points.filter((_: V3, i: number): boolean => i % k === 0);
  }

  /** Outline colours. */
  const LABEL_COLOUR: Record<AutoMovieHumanLegViewCurves.Label, string> = { lateral: "#008080", medial: "#c00060", anterior: "#e07000", posterior: "#8040c0" };

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


void NodeLegSpecs.run().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
