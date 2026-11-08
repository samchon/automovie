import { CaptureCameras } from "../inspection/CaptureCameras";
import type { CaptureComparison } from "../inspection/CaptureComparison";
import { CaptureManifest } from "../inspection/CaptureManifest";
import type { CaptureModel } from "../inspection/CaptureModel";
import { CaptureOutliers } from "../inspection/CaptureOutliers";
import { CaptureSelection } from "../inspection/CaptureSelection";
import type { NodeCanvasTypes as N } from "../inspection/NodeCanvasTypes";
import { NodeCaptureRender } from "./NodeCaptureRender";

/**
 * The cells of one capture run: for each frame mode and selection, its
 * display frame and its resolved cameras; for each stage of the selection,
 * one cell per camera. A local frame draws a curve row in the curve's own
 * segment frame and a part or neighbour row in the owner's root frame; the
 * whole figure is drawn only in the world frame, as it stands. In a
 * comparison run the plan is the earlier packet's cells, with each recorded
 * resolved camera reused exactly.
 */
export namespace NodeCapturePlan {
  /** One planned cell. */
  export interface ICell extends CaptureManifest.IKey {
    /** The selection record. */
    row: CaptureSelection.ISelection;

    /** Display frame. */
    display: NodeCaptureRender.IDisplay;

    /** Resolved camera, or null with `cause`. */
    resolved: N.Camera | null;

    /** Why no camera could be resolved. */
    cause: string | null;

    /** Parts of a multi-part row left out of the camera fit as outliers, display metres. */
    outliers: CaptureOutliers.IOutlier[];

    /** Parts whose non-finite framing points were left out of the camera fit. */
    invalid: IInvalid[];
  }

  /** Text naming each part with non-finite framing points and their count. */
  export function describe(invalid: readonly IInvalid[]): string {
    return invalid.map((i: IInvalid): string => `${i.name} ${i.dropped} of ${i.total} points`).join(", ");
  }

  /** Inputs of the plan. */
  export interface IInput {
    /** Expanded selections. */
    selections: readonly CaptureSelection.ISelection[];

    /** Prepared parts by name. */
    parts: ReadonlyMap<string, CaptureModel.IPart>;

    /** Frame modes. */
    frames: readonly CaptureManifest.FrameMode[];

    /** Camera-name globs. */
    views: readonly string[];

    /** Frame edge, px. */
    size: number;

    /** Earlier cells to reproduce; null plans the full expansion. */
    earlier: readonly CaptureComparison.IEarlier[] | null;

    /** Outlier distance limit for multi-part rows, display metres ({@link CaptureOutliers.STATURES} statures). */
    limit: number;
  }

  /** Plan every cell. */
  export function cells(input: IInput): ICell[] {
    const views: RegExp[] = input.views.map(CaptureSelection.glob);
    const wanted: (name: string) => boolean = (name: string): boolean => views.some((v: RegExp): boolean => v.test(name));
    const earlier: Map<string, CaptureComparison.IEarlier> | null =
      input.earlier === null ? null : new Map(input.earlier.map((e: CaptureComparison.IEarlier): [string, CaptureComparison.IEarlier] => [CaptureManifest.key(e), e]));
    const out: ICell[] = [];
    for (const frame of input.frames)
      for (const row of input.selections) {
        if (frame === "local" && row.kind === "whole") continue;
        const display: NodeCaptureRender.IDisplay = displayOf(row, frame, input.parts);
        const { points, outliers, invalid }: { points: N.Point[]; outliers: CaptureOutliers.IOutlier[]; invalid: IInvalid[] } = fitted(row, input.parts, display, input.limit);
        const cameras: { name: string; resolve: () => N.Camera }[] = [];
        for (const d of CaptureCameras.STANDARD)
          cameras.push({ name: d.name, resolve: (): N.Camera => CaptureCameras.fit(d, points, input.size, input.size, 0.06) });
        for (const port of portsOf(row, input.parts))
          cameras.push({
            name: CaptureCameras.closeupName(port.name),
            resolve: (): N.Camera => CaptureCameras.closeup({ name: port.name, point: display.map(port.point), radius: port.radius / 1000 }, input.size, input.size),
          });
        for (const stage of row.stages)
          for (const camera of cameras) {
            const key: CaptureManifest.IKey = { frame, selection: row.id, stage, camera: camera.name };
            const prior: CaptureComparison.IEarlier | undefined = earlier?.get(CaptureManifest.key(key));
            if (earlier !== null ? prior === undefined : !wanted(camera.name)) continue;
            if (prior?.resolved !== null && prior?.resolved !== undefined) {
              out.push({ ...key, row, display, resolved: prior.resolved, cause: null, outliers, invalid });
              continue;
            }
            if (points.length === 0) {
              const why: string = invalid.length === 0 ? "the selection has no drawable point to frame in this display frame" : `every framing point is non-finite: ${describe(invalid)}`;
              out.push({ ...key, row, display, resolved: null, cause: why, outliers, invalid });
              continue;
            }

            // A camera that is still not finite (a NaN port or a degenerate fit) is refused rather than drawn empty.
            const resolved: N.Camera = camera.resolve();
            const bad: string[] = CaptureCameras.invalid(resolved);
            if (bad.length !== 0) out.push({ ...key, row, display, resolved: null, cause: `camera not finite in ${bad.join(", ")}${invalid.length === 0 ? "" : `; non-finite framing: ${describe(invalid)}`}`, outliers, invalid });
            else out.push({ ...key, row, display, resolved, cause: null, outliers, invalid });
          }
      }
    return out;
  }

  /**
   * The points a row's cameras are fitted to. Non-finite framing points
   * (curve, aid, datum, clay or reference coordinates that are NaN or
   * infinite) are left out and counted per part ({@link CaptureOutliers.finite}),
   * since one of them makes every fitted camera NaN. A row of several parts
   * is then checked for outliers part by part ({@link CaptureOutliers.find});
   * its cameras fit only the inliers, unless every part is an outlier, in
   * which case all finite parts are framed and still reported.
   */
  export function fitted(row: CaptureSelection.ISelection, parts: ReadonlyMap<string, CaptureModel.IPart>, display: NodeCaptureRender.IDisplay, limit: number): { points: N.Point[]; outliers: CaptureOutliers.IOutlier[]; invalid: IInvalid[] } {
    const each: Map<string, N.Point[]> = new Map();
    const invalid: IInvalid[] = [];
    for (const name of row.parts) {
      const all: N.Point[] = NodeCaptureRender.framing({ ...row, parts: [name] }, parts, display);
      const split: { points: N.Point[]; dropped: number } = CaptureOutliers.finite(all);
      if (split.dropped !== 0) invalid.push({ name, dropped: split.dropped, total: all.length });
      each.set(name, split.points);
    }
    if (row.parts.length < 2) return { points: [...each.values()].flat(), outliers: [], invalid };
    const bounds: CaptureOutliers.IBounds[] = [...each].flatMap(([name, points]: [string, N.Point[]]): CaptureOutliers.IBounds[] => {
      const b: CaptureOutliers.IBounds | null = CaptureOutliers.bounds(name, points);
      return b === null ? [] : [b];
    });
    const found: CaptureOutliers.IOutput = CaptureOutliers.find(bounds, limit);
    const kept: string[] = found.inliers.length === 0 ? [...each.keys()] : found.inliers;
    return { points: kept.flatMap((n: string): N.Point[] => each.get(n)!), outliers: found.outliers, invalid };
  }

  /** A part whose framing points include non-finite coordinates. */
  export interface IInvalid {
    /** Part name. */
    name: string;

    /** Non-finite points left out of the fit. */
    dropped: number;

    /** All its framing points in this row. */
    total: number;
  }

  /** Display frame of a row in a frame mode. */
  export function displayOf(row: CaptureSelection.ISelection, frame: CaptureManifest.FrameMode, parts: ReadonlyMap<string, CaptureModel.IPart>): NodeCaptureRender.IDisplay {
    if (frame === "world" || row.owner === null) return NodeCaptureRender.display("world", null);
    const owner: CaptureModel.IPart = parts.get(row.owner)!;
    const name: string = row.curve === null ? owner.root : (owner.curves.find((c: CaptureModel.ICurve): boolean => c.id === row.curve)?.frame ?? owner.root);
    const f: CaptureModel.IFrame | undefined = owner.frames.find((x: CaptureModel.IFrame): boolean => x.name === name);
    return f === undefined ? NodeCaptureRender.display("world", null) : NodeCaptureRender.display(f.name, f.world);
  }

  /** Ports a row gets close-ups for: a curve row's nearby ports, a part or neighbour row's owner ports, none for the whole. */
  export function portsOf(row: CaptureSelection.ISelection, parts: ReadonlyMap<string, CaptureModel.IPart>): CaptureModel.IPort[] {
    if (row.owner === null) return [];
    const owner: CaptureModel.IPart = parts.get(row.owner)!;
    if (row.curve === null) return owner.ports;
    const c: CaptureModel.ICurve | undefined = owner.curves.find((x: CaptureModel.ICurve): boolean => x.id === row.curve);
    if (c === undefined) return [];
    return CaptureCameras.near(owner.ports, [...c.lines, ...c.aids].flatMap((l: CaptureModel.ILine): CaptureModel.Vec3[] => l.points));
  }
}
