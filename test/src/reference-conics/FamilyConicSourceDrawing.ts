import { FamilyConicCaptureFrame as Frame } from "./FamilyConicCaptureFrame";
import { FamilyConicCaptureFraming as Framing } from "./FamilyConicCaptureFraming";
import { FamilyConicCaptureInput as Input } from "./FamilyConicCaptureInput";
import type {
  FamilyConicCaptureTransportFiles as TransportFiles,
} from "./FamilyConicCaptureTransportFiles";
import type {
  FamilyConicOriginalCatalog as Original,
} from "./FamilyConicOriginalCatalog";
import { FamilyConicSource as R } from "./FamilyConicSource";
import type { FamilyConicSourceCapture as Source } from "./FamilyConicSourceCapture";
import type {
  FamilyConicSourceSelection as Selection,
} from "./FamilyConicSourceSelection";
import { NodeCanvasCamera as Camera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";
import { AutoMovieHumanSegmentFrame as F } from "@automovie/human";
import type {
  IAutoMovieHumanSegmentFrame,
  IAutoMovieViewOutline,
} from "@automovie/interface";
import fs from "node:fs/promises";
import path from "node:path";

/** Existing source/reference drawing through fixed cameras, without another source or renderer law. */
export namespace FamilyConicSourceDrawing {
  /**
   * Borrowed coordinator locals; mutable arrays remain owned by its existing catch/receipt scope.
   *
   * @evidence contracts/development/design.md#principled-representation Existing admitted input, prepared state, fixed baseline and PNG selection retain their owner types; mutable evidence arrays record partial progress.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The drawing phase borrows exactly the coordinator values its former inline statements read or append.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No replacement assembly, camera law, geometry status or independent case state is represented.
   * @evidence contracts/development/common.md#meaningful-documentation Members identify the borrowed case lifetime, fixed framing and partial-evidence ownership.
   */
  export interface IContext {
    /** Exact admitted input. */
    input: Input.IInput;

    /** Same prepared source and frame lifetime. */
    state: Source.IState;

    /** Historical fixed comparison bounds. */
    frameBaseline: Framing.IBaseline;

    /** Checked submitted input observations. */
    recorded: TransportFiles.ILayer;

    /** Existing absolute output directory. */
    out: string;

    /** Already admitted PNG selection. */
    selection: Selection.IPlan;

    /** Existing exact source identity set. */
    sourceIds: Set<string>;

    /** Same unavailable rows, retained on partial draw failure. */
    unavailable: { id: string; cause: string }[];

    /** Same checked reference file identities. */
    referenceHashes: Input.IFile[];

    /** Same fixed frame plans, retained on partial failure. */
    framingPlans: Framing.IPlan[];
  }

  /** Convert only display coordinates; kernel source/control values stay in their declared units. */
  function metres(point: readonly number[]): N.Point {
    return [point[0]! / 1000, point[1]! / 1000, point[2]! / 1000];
  }

  /** Fit the fixed authored/reference points in the source's own frame using existing camera/frame owners. */
  function camera(
    view: string,
    points: readonly N.Point[],
    width: number,
    height: number,
    frame?: IAutoMovieHumanSegmentFrame,
  ): N.Camera {
    if (frame === undefined) return Camera.fit(view, points, width, height);
    const local: N.Point[] = points.map(
      (point: N.Point): N.Point =>
        metres(
          F.toLocal(frame, [1000 * point[0], 1000 * point[1], 1000 * point[2]]),
        ),
    );
    const fitted: N.Camera = Camera.fit(view, local, width, height);
    return {
      ...fitted,
      target: metres(
        F.toWorld(frame, [
          1000 * fitted.target[0],
          1000 * fitted.target[1],
          1000 * fitted.target[2],
        ]),
      ),
      right: F.toWorldDirection(frame, fitted.right),
      up: F.toWorldDirection(frame, fitted.up),
      back: F.toWorldDirection(frame, fitted.back),
    };
  }

  /**
   * Draw existing physical/scalar passes; errors propagate to the unchanged coordinator catch.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Existing fixed F1 frame compatibility, camera fitting and raster owners display world-metre original/submitted samples and intrinsic scalar charts; comparison has no current-admission role.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reference loading precedes fixed scope plans, physical passes and exact-owner scalar charts; the coordinator retains its catch and final receipt.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No generated-case fit, source reconstruction, nearest association or unavailable original replacement is introduced.
   * @evidence contracts/development/implementation.md#efficient-algorithms Selected scope/view passes redraw the full retained scene and selected scalar owners add one chart each; reference meshes and sampled curves dominate retained data.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One prepared state, checked baseline and reference scene serve sequential passes through the existing Frame and raster implementations.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Reference meshes remain local to one awaited draw call; each PNG is written sequentially and only borrowed scalar evidence arrays survive failure.
   * @evidence contracts/development/common.md#meaningful-documentation States display scope, propagated failures and coordinator ownership of partial evidence.
   */
  export async function draw(context: IContext): Promise<void> {
    const {
      input,
      state,
      frameBaseline,
      recorded,
      out,
      selection,
      sourceIds,
      unavailable,
      referenceHashes,
      framingPlans,
    }: IContext = context;
    Framing.compatible(frameBaseline, state.assembly.frames.get("pelvis"));
    const reference: R.ISource = await R.load(input.root);
    const meshes: N.Mesh[] = [reference.body, reference.head].map(
      (part: R.ISource["body"], i: number): N.Mesh => ({
        id: "reference." + i,
        positions: Array.from(part.positions, (x: number): number => x / 1000),
        indices: Array.from(part.indices),
        colour: [0.64, 0.65, 0.67],
      }),
    );
    const bounds: N.Point[] = [];
    for (const mesh of meshes)
      for (let i: number = 0; i < mesh.positions.length; i += 3)
        bounds.push([
          mesh.positions[i]!,
          mesh.positions[i + 1]!,
          mesh.positions[i + 2]!,
        ]);
    for (const name of ["body-observations.json", "reference-model.json"]) {
      const file: string = path.join(input.root, "test/.shots/f1", name);
      referenceHashes.push({
        file,
        sha256: Input.hash(await fs.readFile(file)),
      });
    }
    NodeCanvasRaster.initialize();
    const figurePlan: Framing.IPlan = Framing.plan("figure", frameBaseline);
    framingPlans.push(figurePlan);
    const scopes: { id: string; fixed: N.Point[]; frame?: IAutoMovieHumanSegmentFrame }[] = [
      { id: "figure", fixed: [...bounds, ...figurePlan.points] },
    ];
    for (const part of state.authored.parts) {
      const plan: Framing.IPlan = Framing.plan(part.id, frameBaseline);
      framingPlans.push(plan);
      if (plan.points.length < 2) {
        unavailable.push({
          id: part.id + "/camera",
          cause:
            "No fixed original F1 source/declared operator bounds; no generated-case fitting",
        });
        continue;
      }
      if (!plan.operatorAssociationRegistered)
        unavailable.push({
          id: part.id + "/camera/operator-association",
          cause:
            "No prepared-band framing association is registered for this source; source-only bounds are not a complete shared-connection frame",
        });
      for (const owner of plan.missingOperatorOwners)
        unavailable.push({
          id: part.id + "/camera/" + owner,
          cause:
            "Declared fixed F1 operator input bounds are unavailable; no nearest-source association is inferred",
        });
      const plane: ReturnType<typeof part.definition.axis.at> =
        part.definition.axis.at(part.definition.stations[0]!);
      scopes.push({
        id: part.id,
        fixed: plan.points,
        frame: F.fromXY(plane.origin, plane.u, F.cross(plane.v, plane.u)),
      });
    }
    const actualOriginals: Set<string> = new Set(
      state.originals.parts.map((part: Original.IPart): string => part.id),
    );
    for (const id of selection.sources) {
      if (!scopes.some((scope: { id: string }): boolean => scope.id === id))
        unavailable.push({
          id: id + "/selected-png",
          cause:
            "Independent fixed counterpart/frame is unavailable; selected PNG scope remains expected without a fabricated camera",
        });
      if (id !== "figure" && !actualOriginals.has(id))
        unavailable.push({
          id: id + "/original-layer",
          cause:
            "Actual original source is unavailable; its original PNG layer is omitted independently of recorded submitted-input evidence",
        });
    }
    for (const scope of scopes.filter((scope: { id: string }): boolean =>
      sourceIds.has(scope.id),
    ))
      for (const view of selection.views) {
        const fitted: N.Camera = camera(
          view,
          scope.fixed,
          900,
          scope.id === "figure" ? 1500 : 900,
          scope.frame,
        );
        for (const overlay of [false, true]) {
          const stage: string = overlay
            ? "originals-over-reference"
            : "originals";
          if (scope.id === "figure" || actualOriginals.has(scope.id))
            await Frame.write(
              state,
              out,
              encodeURIComponent(scope.id) + "." + view + "." + stage + ".png",
              fitted,
              overlay ? meshes : [],
              state.originals.curves,
              overlay ? "depth" : "xray",
              input.selected.id +
                " | " +
                stage +
                " | " +
                scope.id +
                " | " +
                view,
              stage,
              scope.id,
              { stage, realization: "not-requested", diagnosticCount: null },
            );
          if (
            recorded.submitted !== null &&
            recorded.submitted.curves.length > 0
          ) {
            const submittedStage: string = overlay
              ? "actual-submitted-operator-input-over-reference"
              : "actual-submitted-operator-input";
            await Frame.write(
              state,
              out,
              scope.id + "." + view + "." + submittedStage + ".png",
              fitted,
              overlay ? meshes : [],
              recorded.submitted.curves,
              overlay ? "depth" : "xray",
              input.selected.id +
                " | " +
                submittedStage +
                " | " +
                scope.id +
                " | " +
                view +
                " | sampled recorded inputs; no continuous world-loop claim",
              submittedStage,
              scope.id,
              { stage: submittedStage, realization: "not-requested", diagnosticCount: null },
            );
          }
        }
      }
    const fixedScalars: Map<string, Original.IScalar> = new Map(
      state.authored.scalars.map(
        (scalar: Original.IScalar): [string, Original.IScalar] => [
          scalar.id,
          scalar,
        ],
      ),
    );
    for (const scalar of state.originals.scalars.filter(
      (scalar: Original.IScalar): boolean => sourceIds.has(scalar.owner),
    )) {
      const fixed: Original.IScalar | undefined = fixedScalars.get(scalar.id);
      if (fixed === undefined || fixed.readings.length < 2) {
        unavailable.push({
          id: scalar.id + "/chart-camera",
          cause: "No fixed authored scalar frame; no generated-case auto-fit",
        });
        continue;
      }
      const scale: number = scalar.unit === "mm" ? 0.001 : 0.1;
      const points: N.Point[] = scalar.readings.map(
        (reading: IAutoMovieViewOutline.IReading): N.Point => [
          reading.station / 1000,
          0,
          -reading.value * scale,
        ],
      );
      const base: N.Point[] = fixed.readings.map(
        (reading: IAutoMovieViewOutline.IReading): N.Point => [
          reading.station / 1000,
          0,
          -reading.value * scale,
        ],
      );
      const amplitude: number = Math.max(
        0.001,
        ...base.map((p: N.Point): number => Math.abs(p[2])),
      );
      const fixedBounds: N.Point[] = [
        ...base,
        [base[0]![0], 0, 2 * amplitude],
        [base.at(-1)![0], 0, -2 * amplitude],
      ];
      const fitted: N.Camera = Camera.fit("top", fixedBounds, 900, 650);
      const lines: N.Curve[] = [
        {
          id: scalar.id + "/authored-counterpart",
          points: base,
          closed: false,
          colour: "888888",
        },
        {
          id: scalar.id + "/evaluated-original",
          points,
          closed: false,
          colour: "2656a0",
        },
      ];
      for (const knot of scalar.definition.knots)
        if (Number.isFinite(knot.station) && Number.isFinite(knot.value))
          lines.push({
            id: scalar.id + "/interpolation-knot/" + knot.site,
            points: [
              [knot.station / 1000 - 0.0003, 0, -knot.value * scale],
              [knot.station / 1000 + 0.0003, 0, -knot.value * scale],
            ],
            closed: false,
            colour: "a33562",
          });
      await Frame.write(
        state,
        out,
        "scalar." + encodeURIComponent(scalar.id) + ".png",
        fitted,
        [],
        lines,
        "xray",
        input.selected.id +
          " | " +
          scalar.id +
          " | station mm / " +
          scalar.unit +
          " | display chart; normalized jets in metadata" +
          (scalar.cause === null ? "" : " | UNAVAILABLE: " + scalar.cause),
        "original-scalar-chart",
        scalar.id,
        { stage: "original-scalar-chart", realization: "not-requested", diagnosticCount: null },
      );
    }
  }
}
