import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import type { AutoMovieHumanArmF1Pose } from "../generation/arm/AutoMovieHumanArmF1Pose";
import { AutoMovieHumanArmInputs } from "../generation/arm/AutoMovieHumanArmInputs";
import { AutoMovieHumanArmLandmarks } from "../generation/arm/AutoMovieHumanArmLandmarks";
import { AutoMovieHumanArmSegmentFrames } from "../generation/arm/AutoMovieHumanArmSegmentFrames";
import { AutoMovieHumanArmViewCurves } from "../generation/arm/AutoMovieHumanArmViewCurves";
import { AutoMovieHumanArmViewLoft } from "../generation/arm/AutoMovieHumanArmViewLoft";
import { AutoMovieHumanFairOutline } from "../generation/arm/AutoMovieHumanFairOutline";
import { AutoMovieHumanHandDigits } from "../generation/hand/AutoMovieHumanHandDigits";
import type { CaptureModel } from "../inspection/CaptureModel";
import { CaptureSpecs } from "../inspection/CaptureSpecs";
import { NodeCaptureArmReference } from "./NodeCaptureArmReference";
import type { NodeCaptureSources } from "./NodeCaptureSources";

type V3 = CaptureModel.Vec3;
type Spec = AutoMovieHumanArmCurveSpec.ICurveSpec;

/**
 * The arm region's own `node:capture` provider for `arm.left` and `arm.right` with their digits: the arm built
 * from its single argument owner (`AutoMovieHumanArmInputs`: public inputs,
 * tapes and the trunk's shoulder port as the humerus root), its segment
 * frames, landmarks, view curves and engine view loft (order 32, 64 ring
 * samples, 6 mm widest layer gap), with each segment's axis, the exact
 * outline value of the whole-walk chain in its root parameter, the GH port,
 * elbow and wrist close-ups, and the reference registered into the humerus
 * chain then carried by the same root (diagnostic only, left arm). The right
 * side is the same construction through its own ISB frames, not a second
 * definition.
 */
export namespace NodeArmCaptureSource {
  /** The provider entry. */
  export const PROVIDER: NodeCaptureSources.IProvider = {
    names: (["left", "right"] as const).flatMap((side: "left" | "right"): string[] => [`arm.${side}`, `thumb.${side}`, `finger.${side}.1`, `finger.${side}.2`, `finger.${side}.3`, `finger.${side}.4`]),
    files: [
      "packages/human/src/generation/arm/AutoMovieHumanArmInputs.ts",
      "packages/human/src/generation/arm/AutoMovieHumanArmF1Pose.ts",
      "packages/human/src/generation/arm/AutoMovieHumanArmJet.ts",
      "packages/human/src/generation/arm/AutoMovieHumanArmF1Lines.ts",
      "packages/human/src/generation/trunk/AutoMovieHumanTrunkPorts.ts",
      "packages/human/src/generation/arm/AutoMovieHumanArmSegmentFrames.ts",
      "packages/human/src/generation/arm/AutoMovieHumanArmLandmarks.ts",
      "packages/human/src/generation/arm/AutoMovieHumanArmViewCurves.ts",
      "packages/human/src/generation/arm/AutoMovieHumanArmViewSpecs.ts",
      "packages/human/src/generation/arm/AutoMovieHumanArmViewLoft.ts",
      "packages/human/src/generation/arm/AutoMovieHumanFairOutline.ts",
      "packages/human/src/generation/arm/AutoMovieHumanArmCurveSpec.ts",
      "packages/human/src/generation/trunk/AutoMovieHumanTrunkJointDatums.ts",
    ],
    prepare,
  };

  /** Build `arm.<side>` or one of its digits for the capture tool; the right side is the same construction through its own frames (ISB: only the medial sign of Z changes). */
  async function prepare(name: string, context: NodeCaptureSources.IContext): Promise<CaptureModel.IPart> {
    const side: "left" | "right" = name.endsWith(".right") || name.includes(".right.") ? "right" : "left";
    if (name !== `arm.${side}`) return digit(name, side, context);
    const ms: Record<string, number> = {};
    const t0: number = performance.now();
    const inputs: AutoMovieHumanArmInputs.IOutput = AutoMovieHumanArmInputs.of(context.person.parameters, side);
    ms.inputs = performance.now() - t0;
    const neutral: IBuild = build(inputs, side, { elbow: 0, wrist: 0 }, ms);

    // Reference: registered into the humerus chain, then carried by the arm's
    // root. The registration selects the reference's left arm only.
    const ref: NodeCaptureSources.IReference = await context.reference();
    const t1: number = performance.now();
    const registered: CaptureModel.IReference =
      side === "left"
        ? NodeCaptureArmReference.register(ref.model, inputs.arms.scale, neutral.frames)
        : { status: "unavailable", cause: "the arm reference registration selects the reference's left arm only" };
    // Posed (her own pose in world), the reference is not re-registered into the neutral humerus chain: the whole-figure reference in world is the comparison.
    const reference: CaptureModel.IReference =
      inputs.posed !== null
        ? { status: "unavailable", cause: "the posed arm stands in her own world pose; compare it with the whole-figure reference in world (--frame world)" }
        : registered.status === "available"
          ? { ...registered, mesh: { ...registered.mesh, positions: carry(registered.mesh.positions, inputs.root) } }
          : registered;
    ms.referenceRegistration = performance.now() - t1;

    const diagnostics: string[] = [...neutral.loft.diagnostics, ...(neutral.loft.loft?.diagnostics ?? []).map((d: { detail: string }): string => d.detail)];
    let b: IBuild = neutral;
    if (context.pose === "reference") {
      const bend: number | undefined = reference.status === "available" ? reference.measures.referenceBendAngle : undefined;
      if (bend === undefined) diagnostics.push("pose reference unavailable: no registered reference bend; drawn neutral");
      else {
        b = build(inputs, side, { elbow: bend, wrist: 0 }, ms);
        diagnostics.push(`pose reference: elbow ${bend.toFixed(4)} rad from the reference's centroid-axis bend, wrist 0 (display only)`);
      }
    }

    const t2: number = performance.now();
    const segmentOf: (frame: string) => AutoMovieHumanArmViewCurves.ISegment | undefined = (frame: string): AutoMovieHumanArmViewCurves.ISegment | undefined =>
      b.curves.segments.find((s: AutoMovieHumanArmViewCurves.ISegment): boolean => s.frame === frame);
    const P: AutoMovieHumanArmSegmentFrames.IPoints = b.frames.points;
    const part: CaptureModel.IPart = CaptureSpecs.part({
      part: name,
      frames: [b.frames.humerus, b.frames.forearm, b.frames.hand],
      root: inputs.root,
      placement: inputs.placement,
      // The per-segment view-curve specs stand in the neutral segment frames; the posed chain is drawn without them.
      specs: inputs.posed !== null ? [] : b.curves.specs,
      axis: (frame: string): { origin: V3; distal: V3 } | null => {
        const s: AutoMovieHumanArmViewCurves.ISegment | undefined = segmentOf(frame);
        return s === undefined ? null : { origin: s.origin, distal: s.distal };
      },
      outline: (spec: Spec, station: number): number | null => {
        const s: AutoMovieHumanArmViewCurves.ISegment | undefined = segmentOf(spec.frame);
        const label: AutoMovieHumanArmViewCurves.Label | undefined = AutoMovieHumanArmViewCurves.LABELS.find((l: AutoMovieHumanArmViewCurves.Label): boolean => spec.name.startsWith(`arm.${l}.`));
        if (s === undefined || label === undefined) return null;
        return AutoMovieHumanArmViewCurves.value(b.curves.outlines[label], s.walk + station, b.curves.end)[0];
      },
      chain: b.loft.loft?.chain ?? null,
      diagnostics,
      ports: [
        { name: "shoulder", frame: b.frames.humerus.name, point: P.gh, radius: 110 },
        { name: "elbow", frame: b.frames.humerus.name, point: P.elbow, radius: 110 },
        { name: "wrist", frame: b.frames.humerus.name, point: P.wrist, radius: 95 },
      ],
      relations: {
        parent: "trunk",
        children: [`thumb.${side}`, `finger.${side}.1`, `finger.${side}.2`, `finger.${side}.3`, `finger.${side}.4`],
        shares: [],
        basis: "frame chain: the humerus root is the trunk's shoulder port (open GH-level port, pending the junction band); the hand frame parents the metacarpal and phalanx frames",
      },
      reference,
      milliseconds: ms,
    });
    ms.display = performance.now() - t2;
    return part;
  }

  /**
   * One digit as its own part: a root frame at the digit's root (X lateral,
   * Y distal, Z = X x Y, the loft chart's v), its four outlines and axis as
   * specs in that frame with their joint ticks, and its engine loft.
   */
  async function digit(name: string, side: "left" | "right", context: NodeCaptureSources.IContext): Promise<CaptureModel.IPart> {
    const index: number = name === `thumb.${side}` ? 0 : Number(name.split(".")[2]);
    if (!(index >= 0 && index <= 4)) throw new Error(`The arm provider draws arm.<side> and its digits, not ${name}`);
    const ms: Record<string, number> = {};
    const t0: number = performance.now();
    const inputs: AutoMovieHumanArmInputs.IOutput = AutoMovieHumanArmInputs.of(context.person.parameters, side);
    const frames: AutoMovieHumanArmSegmentFrames.IOutput = AutoMovieHumanArmSegmentFrames.create({ side, arms: inputs.arms, pose: { elbow: 0, wrist: 0 } });
    const d: AutoMovieHumanHandDigits.IDigit = AutoMovieHumanHandDigits.create(frames, inputs.posed?.hand ?? inputs.root, { sex: inputs.arms.sex, breadth: inputs.tapes.breadth })[index]!;
    ms.digit = performance.now() - t0;
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const frame: string = `${d.name}.root`;
    const root: AutoMovieHumanArmCurveSpec.ITransform = { origin: d.root, axes: [d.axes.lateral, d.axes.distal, S.cross(d.axes.lateral, d.axes.distal)] };
    const sides: [string, V3, AutoMovieHumanHandDigits.IKnot[]][] = [
      ["lateral", [1, 0, 0], d.knots],
      ["medial", [-1, 0, 0], d.knots],
      ["volar side +v", [0, 0, 1], d.depth],
      ["dorsal side -v", [0, 0, -1], d.depth],
    ];
    const evaluate: (knots: readonly AutoMovieHumanHandDigits.IKnot[], s: number) => number = (knots: readonly AutoMovieHumanHandDigits.IKnot[], s: number): number =>
      AutoMovieHumanFairOutline.evaluate(
        knots.map((k: AutoMovieHumanHandDigits.IKnot): number => k.q),
        knots.map((k: AutoMovieHumanHandDigits.IKnot): AutoMovieHumanFairOutline.IJet => ({ value: k.value, first: k.first, second: k.second })),
        -Math.sqrt(Math.max(0, d.length - s)),
      )[0];
    const specs: Spec[] = sides.map(([label, dir, knots]: [string, V3, AutoMovieHumanHandDigits.IKnot[]]): Spec => {
      const at: (s: number, y: number) => V3 = (s: number, y: number): V3 => [dir[0] * y, s, dir[2] * y];
      return {
        name: `${d.name}.${label}`,
        frame,
        datums: knots.map((k: AutoMovieHumanHandDigits.IKnot): AutoMovieHumanArmCurveSpec.IDatum => ({ name: `${d.name}.${label}.${k.site}`, frame, point: at(k.station, k.value), source: { kind: "published", citation: "Greiner 1991; Boike 2025; Buryanov and Kotiuk 2010", detail: k.site } })),
        constraints: knots.map((k: AutoMovieHumanHandDigits.IKnot): AutoMovieHumanArmCurveSpec.IConstraint => ({ kind: "pass", datum: `${d.name}.${label}.${k.site}` })),
        representation: { kind: "outline", parameter: `root q = -sqrt(L - s), L = ${d.length.toFixed(3)} mm`, direction: dir, walk: 0, domain: [0, d.length], knots: knots.map((k: AutoMovieHumanHandDigits.IKnot): AutoMovieHumanArmCurveSpec.IOutlineKnot => ({ ...k })), handleRule: "C2 quintic Hermite in q through the Greiner joint boxes with zero slopes, root parallel, hemispherical pad at the apex" },
        aids: [
          { kind: "axis", name: `${d.name} axis`, frame, points: [[0, 0, 0], [0, d.length, 0]] },
          ...d.joints.map((s: number): AutoMovieHumanArmCurveSpec.IAid => ({ kind: "tick", name: `joint at ${s.toFixed(1)}`, frame, points: [at(s, -4), at(s, 4)] })),
        ],
        consumers: [`${d.name} view loft`],
      };
    });
    const segment: AutoMovieHumanArmCurveSpec.ISegmentFrame = { name: frame, parent: null, basis: { kind: "derived", rule: "digit root at its MCP head (thumb: CMC), straight along its bones" }, relative: S.IDENTITY };
    return CaptureSpecs.part({
      part: name,
      frames: [segment],
      root,
      placement: `${d.name} root through the arm's frames under the trunk shoulder port`,
      specs,
      axis: (f: string): { origin: V3; distal: V3 } | null => (f === frame ? { origin: [0, 0, 0], distal: [0, 1, 0] } : null),
      outline: (spec: Spec, station: number): number | null => {
        const found: [string, V3, AutoMovieHumanHandDigits.IKnot[]] | undefined = sides.find((x: [string, V3, AutoMovieHumanHandDigits.IKnot[]]): boolean => spec.name === `${d.name}.${x[0]}`);
        return found === undefined ? null : evaluate(found[2], station);
      },
      chain: d.loft.chain,
      diagnostics: d.loft.diagnostics.map((x: { detail: string }): string => x.detail),
      ports: [{ name: "root (pending palm-port band)", frame, point: [0, 0, 0], radius: 40 }],
      relations: { parent: `arm.${side}`, children: [], shares: [], basis: "the digit's root is a pending palm-port band; the palm closes at its own pole" },
      reference: { status: "unavailable", cause: "the reference hand is not registered per digit (its relaxed curl differs from the anatomical position)" },
      milliseconds: ms,
    });
  }

  /** One build at a pose. */
  interface IBuild {
    /** Segment frames at the pose. */
    frames: AutoMovieHumanArmSegmentFrames.IOutput;

    /** View curves. */
    curves: AutoMovieHumanArmViewCurves.IOutput;

    /** The engine loft, in world under the arm's root. */
    loft: AutoMovieHumanArmViewLoft.IOutput;
  }

  /** Build one side at a pose, adding each constructor's time to `ms`. */
  function build(inputs: AutoMovieHumanArmInputs.IOutput, side: "left" | "right", pose: { elbow: number; wrist: number }, ms: Record<string, number>): IBuild {
    const t0: number = performance.now();
    const frames: AutoMovieHumanArmSegmentFrames.IOutput = AutoMovieHumanArmSegmentFrames.create({ side, arms: inputs.arms, pose });
    const t1: number = performance.now();
    const landmarks: AutoMovieHumanArmLandmarks.IOutput = AutoMovieHumanArmLandmarks.create(frames, inputs.arms);
    const t2: number = performance.now();
    // Step 1: f1's own pose on S00's armscye port (`AutoMovieHumanArmF1Pose`), the arm the joined body builds.
    const posed: AutoMovieHumanArmF1Pose.IOutput | undefined = inputs.posed ?? undefined;
    const curves: AutoMovieHumanArmViewCurves.IOutput = AutoMovieHumanArmViewCurves.create(frames, landmarks, inputs.tapes, inputs.calipers, posed);
    const t3: number = performance.now();
    const loft: AutoMovieHumanArmViewLoft.IOutput = AutoMovieHumanArmViewLoft.create({ curves, frames, landmarks, root: inputs.root, order: 32, samples: 64, gap: 6, ...(posed === undefined ? {} : { posed }) });
    const t4: number = performance.now();
    ms.frames = (ms.frames ?? 0) + (t1 - t0);
    ms.landmarks = (ms.landmarks ?? 0) + (t2 - t1);
    ms.curves = (ms.curves ?? 0) + (t3 - t2);
    ms.loft = (ms.loft ?? 0) + (t4 - t3);
    return { frames, curves, loft };
  }

  /** Flat XYZ positions carried by a rigid transform. */
  function carry(positions: readonly number[], t: AutoMovieHumanArmCurveSpec.ITransform): number[] {
    const out: number[] = new Array<number>(positions.length);
    for (let i: number = 0; i + 2 < positions.length; i += 3) {
      const p: V3 = AutoMovieHumanArmCurveSpec.apply(t, [positions[i]!, positions[i + 1]!, positions[i + 2]!]);
      out[i] = p[0];
      out[i + 1] = p[1];
      out[i + 2] = p[2];
    }
    return out;
  }
}
