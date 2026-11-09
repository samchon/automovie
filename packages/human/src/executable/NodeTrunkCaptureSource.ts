import { type AutoMovieMeshExtract, AutoMovieViewAxis } from "@automovie/engine";

import { AutoMovieHumanF1Trace } from "../generation/AutoMovieHumanF1Trace";
import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanTrunkNeckBase } from "../generation/trunk/AutoMovieHumanTrunkNeckBase";
import { AutoMovieHumanTrunkS00 } from "../generation/trunk/AutoMovieHumanTrunkS00";
import { AutoMovieHumanTrunkSpecLandmarks } from "../generation/trunk/AutoMovieHumanTrunkSpecLandmarks";
import { AutoMovieHumanTrunkViewSpecs } from "../generation/trunk/AutoMovieHumanTrunkViewSpecs";
import type { CaptureModel } from "../inspection/CaptureModel";
import { CaptureSpecs } from "../inspection/CaptureSpecs";
import type { NodeCaptureSources } from "./NodeCaptureSources";
import { NodeTrunkReference } from "./NodeTrunkReference";

type V3 = CaptureModel.Vec3;

/**
 * The trunk region's own `node:capture` provider for `trunk` (S00): one
 * composed stream from the crotch pole to the open neck-base end, with the
 * breasts and buttocks composed into its chain as reliefs, built by
 * `AutoMovieHumanTrunkS00` from the public input. Its frames are the ISB
 * pelvis (root, placed in the world) and thorax; its specs the S00 view
 * curves in the pelvis frame (`AutoMovieHumanTrunkViewSpecs`); its ports the
 * neck-base end, both shoulder ports (GH) and both hip ports; the reference
 * is registered by its own jugular notch (X) and median plane (Z), heights
 * kept (diagnostic only). The neutral is the only trunk pose.
 */
export namespace NodeTrunkCaptureSource {
  /** The provider entry. */
  export const PROVIDER: NodeCaptureSources.IProvider = {
    names: ["trunk"],
    files: [
      "packages/human/src/generation/trunk/AutoMovieHumanTrunkS00.ts",
      "packages/human/src/generation/trunk/AutoMovieHumanTrunkSegmentFrames.ts",
      "packages/human/src/generation/trunk/AutoMovieHumanTrunkSpecLandmarks.ts",
      "packages/human/src/generation/trunk/AutoMovieHumanTrunkJointDatums.ts",
      "packages/human/src/generation/trunk/AutoMovieHumanTrunkBackProfile.ts",
      "packages/human/src/generation/trunk/AutoMovieHumanTrunkViewCurves.ts",
      "packages/human/src/generation/trunk/AutoMovieHumanTrunkMidlineLength.ts",
      "packages/human/src/generation/trunk/AutoMovieHumanTrunkComposedSection.ts",
      "packages/human/src/generation/trunk/AutoMovieHumanTrunkMound.ts",
      "packages/human/src/generation/trunk/AutoMovieHumanTrunkViewLoft.ts",
      "packages/human/src/generation/trunk/AutoMovieHumanTrunkViewSpecs.ts",
      "packages/human/src/generation/trunk/AutoMovieHumanTrunkNeckBase.ts",
      "packages/human/src/generation/arm/AutoMovieHumanFairOutline.ts",
      "packages/human/src/generation/AutoMovieHumanF1Trace.ts",
    ],
    prepare,
  };

  /** Build `trunk` for the capture tool. */
  async function prepare(name: string, context: NodeCaptureSources.IContext): Promise<CaptureModel.IPart> {
    if (name !== "trunk") throw new Error(`The trunk provider draws trunk, not ${name}`);
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const b: AutoMovieHumanTrunkS00.IOutput = AutoMovieHumanTrunkS00.of(context.person.parameters);
    const ms: Record<string, number> = { ...b.ms };
    const frames: AutoMovieHumanArmCurveSpec.ISegmentFrame[] = [b.datums.frames.pelvis, b.datums.frames.thorax];
    const at: (n: string) => V3 = (n: string): V3 => {
      const l: AutoMovieHumanTrunkSpecLandmarks.ILandmark = AutoMovieHumanTrunkSpecLandmarks.get(b.datums.landmarks, n);
      return S.apply(b.datums.frames.world(l.frame), l.point);
    };

    // Reference: registered by its own notch and median plane, diagnostic only.
    const ref: NodeCaptureSources.IReference = await context.reference();
    const t0: number = performance.now();
    const registered: NodeTrunkReference.IRegistered = NodeTrunkReference.register(NodeTrunkReference.fromModel(ref.model, 1), { ij: at("IJ"), c7: at("C7") });
    const reference: CaptureModel.IReference = {
      status: "available",
      mesh: { positions: registered.mesh.points.flat(), indices: registered.mesh.triangles.flat() },
      measures: registered.measures,
      method: "translated along X so the reference's jugular notch (least-X point of its mid-sagittal front cut near our suprasternale height) lies on IJ, and along Z so its median plane is Z = 0; heights keep their own floor",
    };
    ms.referenceRegistration = performance.now() - t0;

    // The direct path (modeler brief 00:18): the trunk built by the shared
    // builder from her own cuts on this very registered mesh, so the clay
    // and reference stages share one frame. Course: straight and level on
    // her midline (u = +X forward, v = +Z lateral, stations world height
    // along v x u = +Y), from 831.32 (the fork-plane loop's height,
    // band-loops.txt) to 1458 (the neck-base end the head continues). Her
    // midline X is the middle of her front/back extents at 1100 mm (mid
    // trunk); cuts every 2 mm, layers every 6 mm (S00's gap).
    const t1: number = performance.now();
    const flat: AutoMovieMeshExtract.IMesh = { positions: registered.mesh.points.flat(), indices: registered.mesh.triangles.flat() };
    const probe: AutoMovieHumanF1Trace.ICut | null = AutoMovieHumanF1Trace.read(flat, AutoMovieViewAxis.straight([0, 0, 0], [1, 0, 0], [0, 0, 1]).at(1100), 1100);
    const midX: number = probe === null ? 0 : (probe.extents[0] + probe.extents[1]) / 2;
    const span = (a: number, b: number, step: number): number[] => {
      const out: number[] = [];
      for (let s: number = a; s < b; s += step) out.push(s);
      out.push(b);
      return out;
    };
    const direct: AutoMovieHumanF1Trace.IOutput = AutoMovieHumanF1Trace.create({
      name: b.loft.part.name,
      mesh: flat,
      axis: AutoMovieViewAxis.straight([midX, 0, 0], [1, 0, 0], [0, 0, 1]),
      cuts: span(831.32, 1458, 2),
      stations: span(831.32, 1458, 6),
      order: b.loft.part.order,
      samples: b.loft.part.samples,
    });
    ms.direct = performance.now() - t1;
    console.log(`direct trunk: midX ${midX.toFixed(1)} mm, ${direct.cuts.length} cuts, dropped [${direct.dropped.join(", ")}], chain ${direct.loft.chain === null ? "null" : "ok"}`);
    for (const [k, rows] of Object.entries(direct.table) as [string, [number, number, number][]][]) console.log(`  ${k}: ${rows.length} knots ${rows.map((r: [number, number, number]): string => `(${r[0].toFixed(1)}, ${r[1].toFixed(3)}, ${r[2].toFixed(3)})`).join(" ")}`);
    for (const d of direct.loft.diagnostics.slice(0, 12)) console.log(`  diag ${d.contract}: ${d.detail.slice(0, 300)}`);
    for (const c of direct.cuts.filter((c: AutoMovieHumanF1Trace.ICut): boolean => c.flags.length !== 0).slice(0, 20)) console.log(`  flags ${c.station.toFixed(1)}: ${c.flags.join("; ").slice(0, 200)}`);

    const neck: AutoMovieHumanTrunkNeckBase.IOutput = AutoMovieHumanTrunkNeckBase.of(b.datums.frames, b.curves, b.measures.neckBaseCircumference, at("IJ"));
    const diagnostics: string[] = [
      ...b.curves.diagnostics,
      ...direct.loft.diagnostics.map((d: { detail: string }): string => d.detail),
      `direct trunk (AutoMovieHumanF1Trace): ${direct.cuts.length} cuts of her registered mesh, dropped [${direct.dropped.join(", ")}]; specs drawn are still S00's view curves`,
      "mounds (breasts, buttocks) are engine reliefs of the chain; their footprints are not specs yet",
      ...(context.pose === "reference" ? ["pose reference: the trunk has no posed state; drawn neutral"] : []),
    ];
    return CaptureSpecs.part({
      part: name,
      frames,
      root: S.IDENTITY,
      placement: "pelvis frame placed in the world at the hip-centre midpoint (the figure's root)",
      specs: AutoMovieHumanTrunkViewSpecs.create(b.datums.frames, b.curves),
      axis: (frame: string): { origin: V3; distal: V3 } | null => (frame === "pelvis" ? AutoMovieHumanTrunkViewSpecs.axis(b.datums.frames, b.curves) : null),
      outline: (spec: AutoMovieHumanArmCurveSpec.ICurveSpec, station: number): number | null => AutoMovieHumanTrunkViewSpecs.value(spec, station),
      chain: direct.loft.chain,
      diagnostics,
      ports: [
        { name: "neck base", frame: "thorax", point: neck.origin, radius: 110 },
        { name: "shoulder.left", frame: "thorax", point: b.datums.shoulders.left.relative.origin, radius: 130 },
        { name: "shoulder.right", frame: "thorax", point: b.datums.shoulders.right.relative.origin, radius: 130 },
        { name: "hip.left", frame: "pelvis", point: b.datums.hips.left.relative.origin, radius: 140 },
        { name: "hip.right", frame: "pelvis", point: b.datums.hips.right.relative.origin, radius: 140 },
      ],
      relations: {
        parent: null,
        children: ["head", "arm.left", "arm.right", "leg.left", "leg.right"],
        shares: ["head", "arm.left", "arm.right", "leg.left", "leg.right"],
        basis: "trunk joint datums (AutoMovieHumanTrunkJointDatums): shoulder ports at GH in the thorax frame, hip ports at the hip centres in the pelvis frame; the neck-base spec at the open top end",
      },
      reference,
      milliseconds: ms,
    });
  }
}
