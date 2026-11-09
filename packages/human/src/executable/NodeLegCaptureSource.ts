import { AutoMovieLoftChain, type IAutoMovieLoftChain } from "@automovie/engine";

import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanFootToes } from "../generation/foot/AutoMovieHumanFootToes";
import { AutoMovieHumanLegViewCurves } from "../generation/leg/AutoMovieHumanLegViewCurves";
import type { AutoMovieHumanLegHipRoot } from "../generation/leg/AutoMovieHumanLegHipRoot";
import type { CaptureModel } from "../inspection/CaptureModel";
import { CaptureSpecs } from "../inspection/CaptureSpecs";
import type { NodeCaptureSources } from "./NodeCaptureSources";
import { NodeLegBuild } from "./NodeLegBuild";
import { NodeLegReference } from "./NodeLegReference";
import { NodeLegWhole } from "./NodeLegWhole";

type V3 = CaptureModel.Vec3;
type Spec = AutoMovieHumanArmCurveSpec.ICurveSpec;

/**
 * Capture provider of the leg view-curve construction, both sides, through
 * the generic spec route ({@link CaptureSpecs}). It builds each leg with the
 * same constructors and arguments as `node:leg-specs` (`NodeLegBuild`: frames,
 * landmarks, view curves, specs, view loft at order 32, 64 ring samples and a
 * 6 mm widest layer gap, and the five toes), placed in the world by the
 * trunk's hip port (`AutoMovieHumanTrunkJointDatums.hips[side].world`). The
 * leg and its foot are one composed stream: `leg.<side>` carries the femur,
 * tibia and foot specs with the whole chain, `foot.<side>` the foot specs
 * alone over the same chain, and `toe.<side>.<k>` each toe's specs in its own
 * frame with its own chain (open root, pending its forefoot port band). It
 * supplies what the specs do not carry: each segment's axis, the exact
 * outline value from the whole-walk chain in its root parameter, the joints
 * and ports, the relations and the reference leg registered into this chain
 * (diagnostic only). One build per side serves every part of that side.
 */
export namespace NodeLegCaptureSource {
  /** The provider entry. */
  export const PROVIDER: NodeCaptureSources.IProvider = {
    names: ["leg.left", "leg.right", "foot.left", "foot.right", ...["left", "right"].flatMap((side: string): string[] => [1, 2, 3, 4, 5].map((k: number): string => `toe.${side}.${k}`))],
    files: [
      "packages/human/src/generation/leg/AutoMovieHumanLegSegmentFrames.ts",
      "packages/human/src/generation/leg/AutoMovieHumanLegLandmarks.ts",
      "packages/human/src/generation/leg/AutoMovieHumanLegCourse.ts",
      "packages/human/src/generation/leg/AutoMovieHumanLegViewCurves.ts",
      "packages/human/src/generation/leg/AutoMovieHumanLegViewSpecs.ts",
      "packages/human/src/generation/leg/AutoMovieHumanLegViewLoft.ts",
      "packages/human/src/generation/foot/AutoMovieHumanFootToes.ts",
      "packages/human/src/generation/arm/AutoMovieHumanFairOutline.ts",
      "packages/human/src/generation/arm/AutoMovieHumanArmCurveSpec.ts",
      "packages/human/src/generation/trunk/AutoMovieHumanTrunkJointDatums.ts",
      "packages/human/src/executable/NodeLegBuild.ts",
      "packages/human/src/executable/NodeLegReference.ts",
    ],
    prepare,
  };

  /** One side's build and registration, shared by its parts in a run. */
  interface ISide {
    inputs: NodeLegBuild.IInputs;
    build: NodeLegBuild.IBuild;
    reference: CaptureModel.IReference;
    diagnostics: string[];
    ms: Record<string, number>;
    root: AutoMovieHumanLegHipRoot.IOutput | null;
  }

  /** Builds per side and pose, once per process. */
  const sides: Map<string, Promise<ISide>> = new Map();

  /** The split and both rooted legs per pose, once per process. */
  const wholes: Map<string, Promise<NodeLegWhole.IOutput>> = new Map();

  async function prepare(name: string, context: NodeCaptureSources.IContext): Promise<CaptureModel.IPart> {
    const parts: string[] = name.split(".");
    const region: string = parts[0]!;
    const side: "left" | "right" = (region === "toe" ? parts[1] : parts[1]) as "left" | "right";
    if (!(region === "leg" || region === "foot" || region === "toe") || !(side === "left" || side === "right")) throw new Error(`The leg provider draws leg.*, foot.* and toe.*, not ${name}`);
    const key: string = `${side}.${context.pose}`;
    if (!sides.has(key)) sides.set(key, prepareSide(side, context));
    const s: ISide = await sides.get(key)!;
    const b: NodeLegBuild.IBuild = s.build;
    const t0: number = performance.now();
    const ms: Record<string, number> = { ...s.ms };
    const frames: AutoMovieHumanArmCurveSpec.ISegmentFrame[] = [b.frames.femur, b.frames.tibia, b.frames.foot];
    if (region === "toe") {
      const digit: number = Number(parts[2]);
      const toe: AutoMovieHumanFootToes.IToe | undefined = b.toes.find((t: AutoMovieHumanFootToes.IToe): boolean => t.digit === digit);
      if (toe === undefined) throw new Error(`no toe ${digit} on the ${side} foot`);
      const part: CaptureModel.IPart = CaptureSpecs.part({
        part: name,
        frames: [...frames, toe.frame],
        root: s.inputs.root,
        placement: `femur root at the trunk's hip port (AutoMovieHumanTrunkJointDatums.hips.${side}.world); toe frame on the calcaneus frame`,
        specs: AutoMovieHumanFootToes.specs(toe, b.frames.medial),
        axis: (frame: string): { origin: V3; distal: V3 } | null => (frame === toe.frame.name ? { origin: [0, 0, 0], distal: [0, -1, 0] } : null),
        outline: (spec: Spec, station: number): number | null => AutoMovieHumanFootToes.value(toe, spec, station),
        chain: toe.loft.chain,
        diagnostics: [...s.diagnostics, ...toe.loft.diagnostics.map((d: { detail: string }): string => d.detail)],
        ports: [
          { name: "toe root port (pending forefoot band)", frame: toe.frame.name, point: [0, 0, 0], radius: 40 },
          { name: "toe pad", frame: toe.frame.name, point: [0, -toe.length, 0], radius: 30 },
        ],
        relations: { parent: `foot.${side}`, children: [], shares: [], basis: "toe frame on the calcaneus frame at its metatarsal head; its root joins the forefoot through a known-port band (pending)" },
        reference: s.reference,
        milliseconds: ms,
      });
      ms.display = performance.now() - t0;
      return part;
    }
    const segmentOf: (frame: string) => AutoMovieHumanLegViewCurves.ISegment | undefined = (frame: string): AutoMovieHumanLegViewCurves.ISegment | undefined =>
      b.curves.segments.find((x: AutoMovieHumanLegViewCurves.ISegment): boolean => x.frame === frame);
    const specs: Spec[] = region === "leg" ? b.specs : b.specs.filter((x: Spec): boolean => x.frame === b.frames.foot.name);
    const P: typeof b.frames.points = b.frames.points;
    const part: CaptureModel.IPart = CaptureSpecs.part({
      part: name,
      frames,
      root: s.inputs.root,
      placement: `femur root at the trunk's hip port (AutoMovieHumanTrunkJointDatums.hips.${side}.world), femur axes at the pelvis axes (neutral)`,
      specs,
      axis: (frame: string): { origin: V3; distal: V3 } | null => {
        const x: AutoMovieHumanLegViewCurves.ISegment | undefined = segmentOf(frame);
        return x === undefined ? null : { origin: x.origin, distal: x.distal };
      },
      outline: (spec: Spec, station: number): number | null => {
        const x: AutoMovieHumanLegViewCurves.ISegment | undefined = segmentOf(spec.frame);
        const label: AutoMovieHumanLegViewCurves.Label | undefined = AutoMovieHumanLegViewCurves.LABELS.find((l: AutoMovieHumanLegViewCurves.Label): boolean => spec.name.startsWith(`leg.${l}.`));
        if (x === undefined || label === undefined) return null;
        return AutoMovieHumanLegViewCurves.value(b.curves.outlines[label], x.walk + station, b.curves.end)[0];
      },
      chain: b.chain,
      diagnostics: s.diagnostics,
      ports: [
        { name: "hip port", frame: b.frames.femur.name, point: b.landmarks.points.port, radius: 150 },
        { name: "knee", frame: b.frames.femur.name, point: P.knee, radius: 130 },
        { name: "ankle", frame: b.frames.femur.name, point: P.im, radius: 130 },
        { name: "toe ports", frame: b.frames.femur.name, point: b.landmarks.points.web, radius: 90 },
      ],
      relations:
        region === "leg"
          ? { parent: "trunk", children: [`foot.${side}`], shares: [], basis: "frame chain: the femur root receives the trunk's hip port; the leg and the foot are one composed walk" }
          : { parent: `leg.${side}`, children: [1, 2, 3, 4, 5].map((k: number): string => `toe.${side}.${k}`), shares: [], basis: "the foot is the distal interval of the composed leg walk (calcaneus frame on the tibia); the toes join it through forefoot ports (pending bands)" },
      reference: s.reference,
      milliseconds: ms,
    });
    ms.display = performance.now() - t0;
    // The foot alone: the chain from 70 mm above IM (the malleoli's tops and the heel's back, the foot's own interval begins at IM) to its pole, so its cameras frame the foot.
    if (region === "foot" && b.chain !== null) return { ...part, loft: footLoft(b.chain, b.loft.station(b.landmarks.course.im - 70), s.diagnostics) };
    // Above the rail the hip-root band is the surface: the loft is the chain from the rail down plus the band.
    if (s.root !== null && b.chain !== null) return { ...part, loft: NodeLegWhole.captureLoft(b.chain, s.root, s.diagnostics) };
    return part;
  }

  /** A chain's rings, four guides and clay from station `from` to its last layer, closed by its pole, world mm. */
  function footLoft(chain: IAutoMovieLoftChain, from: number, diagnostics: readonly string[]): CaptureModel.ILoft {
    const last: number = chain.layers[chain.layers.length - 1]!.y;
    const ys: number[] = Array.from({ length: Math.ceil((last - from) / 1.5) + 1 }, (_: unknown, k: number): number => Math.min(last, from + 1.5 * k));
    const ring64: number[] = Array.from({ length: 65 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 64);
    const lines: CaptureModel.ILine[] = chain.layers
      .filter((l: IAutoMovieLoftChain.ILayer): boolean => l.y >= from - 1e-9)
      .map((l: IAutoMovieLoftChain.ILayer, k: number): CaptureModel.ILine => ({ id: `loft:ring:${k}`, closed: true, colour: "505050", points: AutoMovieLoftChain.ring(chain, l.y, ring64) as V3[] }));
    (["008080", "8040c0", "c00060", "e07000"] as const).forEach((colour: string, k: number): void => {
      lines.push({ id: `loft:guide:${k}`, closed: false, colour, points: ys.map((y: number): V3 => AutoMovieLoftChain.point(chain, y, (k * Math.PI) / 2) as V3) });
    });
    const around: number[] = Array.from({ length: 72 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 72);
    const rows: V3[][] = ys.map((y: number): V3[] => AutoMovieLoftChain.ring(chain, y, around) as V3[]);
    const positions: number[] = rows.flatMap((row: V3[]): number[] => row.flatMap((p: V3): number[] => [p[0], p[1], p[2]]));
    const indices: number[] = [];
    for (let i: number = 0; i + 1 < rows.length; ++i)
      for (let k: number = 0; k < 72; ++k) {
        const a: number = i * 72 + k;
        const c: number = i * 72 + ((k + 1) % 72);
        indices.push(a, a + 72, c + 72, a, c + 72, c);
      }
    const tip: V3 | undefined = (chain.opposite?.point ?? chain.pole?.point) as V3 | undefined;
    if (tip !== undefined) {
      const index: number = positions.length / 3;
      positions.push(tip[0], tip[1], tip[2]);
      for (let k: number = 0; k < 72; ++k) indices.push(index, (rows.length - 1) * 72 + k, (rows.length - 1) * 72 + ((k + 1) % 72));
    }
    return { status: "available", lines, clay: { positions, indices }, diagnostics: [...diagnostics] };
  }

  /** Build one side and register the reference leg into it. */
  async function prepareSide(side: "left" | "right", context: NodeCaptureSources.IContext): Promise<ISide> {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const ms: Record<string, number> = {};
    const t0: number = performance.now();
    const inputs: NodeLegBuild.IInputs = NodeLegBuild.inputs(context.person.parameters, side);
    ms.inputs = performance.now() - t0;
    const diagnostics: string[] = [];
    if (context.pose === "reference") diagnostics.push("pose reference: not built for the leg (no posed bind is defined); drawn neutral");
    // One split and both rooted legs per run (NodeLegWhole: AutoMovieHumanTrunkPelvisSplit.build once, each leg rooted by its hip band).
    const key: string = context.pose;
    if (!wholes.has(key)) wholes.set(key, Promise.resolve().then((): NodeLegWhole.IOutput => NodeLegWhole.build(context.person.parameters)));
    const whole: NodeLegWhole.IOutput = await wholes.get(key)!;
    const build: NodeLegBuild.IBuild = whole.sides[side].build;
    const root: AutoMovieHumanLegHipRoot.IOutput | null = whole.sides[side].root;
    diagnostics.push(...whole.diagnostics);
    Object.assign(ms, whole.ms);
    Object.assign(ms, Object.fromEntries(Object.entries(build.ms).map(([k, v]: [string, number]): [string, number] => [`build.${k}`, v])));
    diagnostics.push(...build.curves.diagnostics, ...build.loft.diagnostics, ...(build.loft.loft?.diagnostics ?? []).map((d: { detail: string }): string => d.detail));
    const ref: NodeCaptureSources.IReference = await context.reference();
    const t1: number = performance.now();
    let reference: CaptureModel.IReference;
    try {
      const selected: { points: V3[]; indices: number[] } = NodeLegReference.mesh(ref.model, inputs.scale, inputs.landmarks.crotch - 5, side);
      // Her leg stands in this leg's own world (one floor, calibration mm; the leg's frames are built on her joint centres): carried into the femur frame by the root with no fitting, never turned by section-centroid lines.
      const registered: NodeLegReference.IRegistered = NodeLegReference.register(selected.points, build.frames, inputs.landmarks.crotch, inputs.root);
      reference =
        registered.points.length !== selected.points.length || selected.indices.length === 0
          ? { status: "unavailable", cause: `reference leg registration returned ${registered.points.length} of ${selected.points.length} points and ${selected.indices.length / 3} triangles` }
          : {
              status: "available",
              mesh: { positions: registered.points.flatMap((p: V3): V3 => S.apply(inputs.root, p)), indices: selected.indices },
              measures: registered.measures,
              method: "NodeLegReference: leg vertices by display box, in her own world (the femur frame by this leg's root, no fitting); the measures check her epicondyles' and malleoli's skin midpoints against this leg's knee centre and IM; diagnostic only",
            };
    } catch (error: unknown) {
      reference = { status: "unavailable", cause: `reference refused: ${error instanceof Error ? error.message : String(error)}` };
    }
    ms.referenceRegistration = performance.now() - t1;
    return { inputs, build, reference, diagnostics, ms, root };
  }
}
