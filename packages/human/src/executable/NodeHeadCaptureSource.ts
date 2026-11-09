import type { IAutoMovieModel, IAutoMovieModelPart } from "@automovie/interface";

import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanHeadBuild } from "../generation/head/AutoMovieHumanHeadBuild";
import type { AutoMovieHumanHeadFrankfort } from "../generation/head/AutoMovieHumanHeadFrankfort";
import { AutoMovieHumanHeadMassCurves } from "../generation/head/AutoMovieHumanHeadMassCurves";
import { AutoMovieHumanHeadMassLoft } from "../generation/head/AutoMovieHumanHeadMassLoft";
import { AutoMovieHumanHeadMassSpecs } from "../generation/head/AutoMovieHumanHeadMassSpecs";
import type { CaptureModel } from "../inspection/CaptureModel";
import { CaptureSpecs } from "../inspection/CaptureSpecs";
import { HumanInspectionReferenceMesh } from "../inspection/HumanInspectionReferenceMesh";
import type { NodeCaptureSources } from "./NodeCaptureSources";
import { NodeHeadReference } from "./NodeHeadReference";

type V3 = CaptureModel.Vec3;
type Spec = AutoMovieHumanArmCurveSpec.ICurveSpec;

/**
 * Capture provider of the head/neck stream (`head`), through the generic spec
 * route ({@link CaptureSpecs}). It builds the head with the same entry as
 * `node:head-specs` (`AutoMovieHumanHeadBuild`: Frankfort frame and landmarks,
 * the trunk's joint datums, the head placed in the thorax frame, the
 * head/neck course and head.mass's view curves with their tape solves) and
 * lofts on the course placed in the world (order 32, 64 ring samples, 6 mm
 * widest layer gap). It supplies what the specs do not carry: the neck and
 * head segment axes, the exact outline values on the course, each fullness
 * law's own quarters, the pending neck-base and ear ports, and the reference
 * registered into the head frame (diagnostic only).
 */
export namespace NodeHeadCaptureSource {
  /** The provider entry. */
  export const PROVIDER: NodeCaptureSources.IProvider = {
    names: ["head"],
    files: [
      "packages/human/src/generation/head/AutoMovieHumanHeadBuild.ts",
      "packages/human/src/generation/head/AutoMovieHumanHeadFrankfort.ts",
      "packages/human/src/generation/head/AutoMovieHumanHeadPlacement.ts",
      "packages/human/src/generation/head/AutoMovieHumanHeadThroat.ts",
      "packages/human/src/generation/head/AutoMovieHumanHeadNeckCourse.ts",
      "packages/human/src/generation/head/AutoMovieHumanHeadMass.ts",
      "packages/human/src/generation/head/AutoMovieHumanHeadMassCurves.ts",
      "packages/human/src/generation/head/AutoMovieHumanHeadMassTapes.ts",
      "packages/human/src/generation/head/AutoMovieHumanHeadMassAids.ts",
      "packages/human/src/generation/head/AutoMovieHumanHeadMassSpecs.ts",
      "packages/human/src/generation/head/AutoMovieHumanHeadMassLoft.ts",
      "packages/human/src/generation/head/AutoMovieHumanHeadPlanArcs.ts",
      "packages/human/src/generation/AutoMovieHumanHeadArcs.ts",
      "packages/human/src/generation/AutoMovieHumanHeadAnatomy.ts",
      "packages/human/src/generation/arm/AutoMovieHumanFairOutline.ts",
      "packages/human/src/generation/trunk/AutoMovieHumanTrunkJointDatums.ts",
      "packages/human/src/generation/trunk/AutoMovieHumanTrunkNeckBase.ts",
      "packages/human/src/executable/NodeHeadReference.ts",
    ],
    prepare,
  };

  async function prepare(name: string, context: NodeCaptureSources.IContext): Promise<CaptureModel.IPart> {
    if (name !== "head") throw new Error(`The head provider draws head, not ${name}`);
    const b: AutoMovieHumanHeadBuild.IOutput = AutoMovieHumanHeadBuild.create(context.person.parameters);
    const ms: Record<string, number> = { ...b.ms };
    const t0: number = performance.now();
    const loft: AutoMovieHumanHeadMassLoft.IOutput = AutoMovieHumanHeadMassLoft.create({ curves: b.curves, axis: b.worldCourse.axis, shift: b.worldCourse.shift, order: 32, samples: 128, gap: 6 });
    ms.loft = performance.now() - t0;
    const specs: AutoMovieHumanHeadMassSpecs.IOutput = AutoMovieHumanHeadMassSpecs.create(b.frame, b.course, b.curves);

    // Reference: read once per run, registered into the head frame, then carried into the world.
    const ref: NodeCaptureSources.IReference = await context.reference();
    const t1: number = performance.now();
    const reference: CaptureModel.IReference = register(ref.model, b.measures.stature - 300, b.frame, b.world);
    ms.referenceRegistration = performance.now() - t1;

    const diagnostics: string[] = [
      ...b.curves.diagnostics,
      ...loft.loft.diagnostics.map((d: { detail: string }): string => d.detail),
      "segments: below FH the neck segment is drawn along its vertical line while the course origin drifts from the port centre to the head axis (display approximation; the loft reads the real course)",
      "bottom: the level port is the trunk's S00 end (AutoMovieHumanTrunkNeckBase): its extents and shoulder continue by their height jets (C2); the front reads the head-owned throat contour (AutoMovieHumanHeadThroat), which S00 reads too",
    ];
    const t2: number = performance.now();
    const fullness: Record<string, readonly (readonly [string, string])[]> = {};
    for (const segment of ["neck", "head"]) {
      fullness[`${segment}.fullness.anterior`] = [[`${segment}.lateral.right`, `${segment}.anterior`], [`${segment}.anterior`, `${segment}.lateral.left`]];
      fullness[`${segment}.fullness.posterior`] = [[`${segment}.lateral.right`, `${segment}.posterior`], [`${segment}.posterior`, `${segment}.lateral.left`]];
    }
    const part: CaptureModel.IPart = CaptureSpecs.part({
      part: name,
      frames: [{ name: "thorax", parent: null, basis: { kind: "derived", rule: "f1_trunk's ISB thorax frame (AutoMovieHumanTrunkJointDatums), carried into the world by the root" }, relative: AutoMovieHumanArmCurveSpec.IDENTITY }, b.placement.frame, specs.neck],
      root: b.trunk.frames.world("thorax"),
      placement: `thorax frame world from AutoMovieHumanTrunkJointDatums; head frame ${b.placement.forward.toFixed(1)} mm ahead of C7 at tragion height ${b.placement.tragion.toFixed(1)} mm (craniovertebral angle), FH level; neck from the trunk's S00 end (AutoMovieHumanTrunkNeckBase, read at build time)`,
      specs: specs.specs,
      axis: (f: string): { origin: V3; distal: V3 } | null => (f === "neck" || f === "head" ? specs.axes[f] : null),
      outline: (spec: Spec, station: number): number | null => {
        if (spec.representation.kind !== "outline") return null;
        if (spec.name.includes(".fullness.")) return AutoMovieHumanHeadMassCurves.fullness(spec.name.endsWith("anterior") ? b.curves.fullness.anterior : b.curves.fullness.posterior, station);
        const label: AutoMovieHumanHeadMassCurves.Label | undefined = AutoMovieHumanHeadMassCurves.LABELS.find((l: AutoMovieHumanHeadMassCurves.Label): boolean => spec.name.split(".")[1] === l);
        return label === undefined ? null : AutoMovieHumanHeadMassCurves.value(b.curves.outlines[label], station, b.curves.length)[0];
      },
      // Each fullness law bounds only its own quarters.
      quarters: (spec: Spec): readonly (readonly [string, string])[] | null => fullness[spec.name] ?? null,
      chain: loft.loft.chain,
      diagnostics,
      ports: [
        { name: "neck-base", frame: "head", point: b.course.base.centre, radius: 120 },
        { name: "ear.right", frame: "head", point: b.frame.points.t, radius: 55 },
        { name: "ear.left", frame: "head", point: [b.frame.points.t[0], b.frame.points.t[1], -b.frame.points.t[2]], radius: 55 },
        { name: "face", frame: "head", point: b.frame.points.sn, radius: 75 },
        { name: "submental", frame: "head", point: [b.frame.points.me[0] / 2, b.frame.points.me[1] - 15, 0], radius: 80 },
      ],
      relations: {
        parent: "trunk",
        children: [],
        shares: [],
        basis: "head frame placed in the thorax frame (craniovertebral angle); the neck continues the trunk's S00 end (its spec's plane, extents and shoulder jets); the throat contour is head-owned and read by S00; ear, lip and nose inputs are pending ports on head.mass",
      },
      reference,
      milliseconds: ms,
    });
    ms.display = performance.now() - t2;
    return part;
  }

  /** The reference's head and neck as triangles registered into the head frame (`NodeHeadReference`) and carried into the world by `world`. */
  function register(model: IAutoMovieModel, floor: number, frame: AutoMovieHumanHeadFrankfort.IOutput, world: AutoMovieHumanArmCurveSpec.ITransform): CaptureModel.IReference {
    let parts: IAutoMovieModelPart[];
    try {
      parts = HumanInspectionReferenceMesh(model).parts;
    } catch (error: unknown) {
      return { status: "unavailable", cause: `reference artifact refused: ${error instanceof Error ? error.message : String(error)}` };
    }
    const points: V3[] = [];
    const indices: number[] = [];
    for (const part of parts) {
      if (part.geometry.type !== "mesh") continue;
      const p: ArrayLike<number> = part.geometry.mesh.positions;
      const tri: ArrayLike<number> | null = part.geometry.mesh.indices;
      if (tri === null) continue;
      const slot: Int32Array = new Int32Array(p.length / 3).fill(-1);
      for (let i: number = 0; i + 2 < p.length; i += 3) {
        const y: number = p[i + 1]! * 1000;
        if (y > floor && Math.abs(p[i + 2]! * 1000) < 140) {
          slot[i / 3] = points.length;
          points.push([p[i]! * 1000, y, -p[i + 2]! * 1000]);
        }
      }
      for (let i: number = 0; i + 2 < tri.length; i += 3) {
        const a: number = slot[tri[i]!]!;
        const b: number = slot[tri[i + 1]!]!;
        const c: number = slot[tri[i + 2]!]!;
        if (a >= 0 && b >= 0 && c >= 0) indices.push(a, b, c);
      }
    }
    const registered: NodeHeadReference.IRegistered = NodeHeadReference.register(points, frame);
    if (registered.points.length !== points.length || indices.length === 0)
      return { status: "unavailable", cause: `reference head registration returned ${registered.points.length} of ${points.length} points and ${indices.length / 3} triangles` };
    return {
      status: "available",
      mesh: { positions: registered.points.flatMap((q: V3): V3 => AutoMovieHumanArmCurveSpec.apply(world, q)), indices },
      measures: registered.measures,
      method: "NodeHeadReference: head and neck vertices (above stature - 300 mm, |Z| < 140 mm), translated so the vertex height, the lateral centre clear of the ears and the g-op midpoint match this head frame; FH tilt unresolved; diagnostic only",
    };
  }
}
