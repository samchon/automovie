import { NodeCanvasCamera as Camera } from "./NodeCanvasCamera";
import type { NodeCanvasTypes as N } from "./NodeCanvasTypes";
import type { HumanTorsoObservation } from "./HumanTorsoObservation";

/** Pure optional camera arguments for the existing torso observation renderer; source buffers remain borrowed and unchanged. */
export namespace HumanTorsoCamera {
  /** Existing seven diagnostic directions fitted once to unchanged whole-source buffers, then reused by all three realized passes. */
  export function overview(selection: HumanTorsoObservation.ISelection): HumanTorsoObservation.ISelection {
    const points: readonly N.Point[] = selection.curves.flatMap((curve: N.Curve): readonly N.Point[] => curve.points);
    return { ...selection, cameras: Camera.names().map((name: string): N.Camera => ({
      ...Camera.fit(name, points), annotations: false,
    })) };
  }

  /** Original inventory cardinalities remain explicit before optional custom-camera selection. */
  export function expected(scope: IArguments["scope"], selection: string): number {
    if (selection.startsWith("S00.available-")) return 4;
    if (scope === "stages" && selection === "S00.all-originals") return 7;
    if (scope === "stages" && selection.endsWith(".neighbours")) return 4;
    if (scope === "stages" && selection.startsWith("human.construction.profile.S00/")) return 4;
    if (scope === "angles" || scope === "stages")
      return selection === "S00.thorax.wall-and-composed" ? 8 : 12;
    return 4;
  }

  /** Display choices; degrees are yaw from +X toward +Z and elevation toward +Y. */
  export interface IOverride {
    /** Finite azimuth degrees; omission keeps the selection's first camera yaw. */
    yaw?: number;

    /** Finite elevation degrees; omission keeps the first camera elevation. */
    pitch?: number;

    /** Explicit world target in metres, independent of the original fit. */
    target?: N.Point;

    /** Positive multiplier of the original or newly oriented pixels-per-metre fit. */
    zoom?: number;
  }

  /** Parsed thin CLI inputs; no geometry or file access occurs here. */
  export interface IArguments {
    /** Requested output path; the existing CLI owns its directory admission. */
    out: string;

    /** Existing original selection inventory. */
    scope:
      | "overview"
      | "all"
      | "datums"
      | "stages"
      | "angles";

    /** Only explicitly authored display overrides. */
    camera: IOverride;
  }

  /** Parse each option exactly once, allowing negative numeric arguments without treating them as options. */
  export function read(argv: readonly string[]): IArguments {
    let out: string | undefined;
    let scope: IArguments["scope"] | undefined;
    const camera: IOverride = {};
    const seen: Set<string> = new Set();
    for (let index: number = 0; index < argv.length; index++) {
      const option: string = argv[index]!;
      const value: string | undefined = argv[++index];
      if (seen.has(option))
        throw new Error("Duplicate S00 observation option: " + option);
      seen.add(option);
      if (
        value === undefined ||
        value.trim().length === 0 ||
        value.startsWith("--")
      )
        throw new Error(option + " requires one value");
      if (option === "--out" && !value.startsWith("-")) out = value;
      else if (
        option === "--scope" &&
        (value === "overview" ||
          value === "all" ||
          value === "datums" ||
          value === "stages" ||
          value === "angles")
      )
        scope = value;
      else if (option === "--yaw") camera.yaw = numeric(value, option);
      else if (option === "--pitch") camera.pitch = numeric(value, option);
      else if (option === "--zoom") {
        camera.zoom = numeric(value, option);
        if (!(camera.zoom > 0)) throw new Error("--zoom must be positive");
      } else if (option === "--target") {
        const parts: string[] = value.split(",");
        if (parts.length !== 3)
          throw new Error("--target requires x,y,z in metres");
        camera.target = parts.map((part: string): number =>
          numeric(part, option),
        ) as N.Point;
      } else
        throw new Error("Unknown or invalid S00 observation option: " + option);
    }
    if (out === undefined)
      throw new Error(
        "S00 observation requires --out under packages/human/.shots/human_sections_xhigh",
      );
    return { out, scope: scope ?? "all", camera };
  }

  /** Keep the exact original camera array without overrides; an explicit override selects one custom camera per original selection. */
  export function select(
    original: readonly N.Camera[],
    curves: readonly N.Curve[],
    request: IOverride,
  ): readonly N.Camera[] {
    if (Object.keys(request).length === 0) return original;
    if (original.length === 0)
      throw new Error("Cannot override an unavailable source camera");
    return [
      apply(
        original[0]!,
        curves.flatMap((curve: N.Curve): readonly N.Point[] => curve.points),
        request,
      ),
    ];
  }

  /** Reuse the existing display basis and 12-percent fit convention; target pans and zoom scales pixels without changing any source point. */
  export function apply(
    base: N.Camera,
    points: readonly N.Point[],
    request: IOverride,
  ): N.Camera {
    if (Object.keys(request).length === 0) return base;
    if (
      [request.yaw, request.pitch].some(
        (value: number | undefined): boolean =>
          value !== undefined && !Number.isFinite(value),
      ) ||
      (request.zoom !== undefined &&
        !(Number.isFinite(request.zoom) && request.zoom > 0)) ||
      (request.target !== undefined &&
        (request.target.length !== 3 || !request.target.every(Number.isFinite)))
    )
      throw new Error("Invalid explicit torso camera override");
    let back: N.Point = base.back;
    let right: N.Point = base.right;
    let up: N.Point = base.up;
    let scale: number = base.scale;
    if (request.yaw !== undefined || request.pitch !== undefined) {
      if (
        points.length === 0 ||
        points.some((p: N.Point): boolean => !p.every(Number.isFinite))
      )
        throw new Error("Cannot fit an empty or nonfinite original selection");
      const yaw: number =
        ((request.yaw ??
          (Math.atan2(base.back[2], base.back[0]) * 180) / Math.PI) *
          Math.PI) /
        180;
      const elevation: number =
        request.pitch ??
        (Math.asin(Math.max(-1, Math.min(1, base.back[1]))) * 180) / Math.PI;
      const pitch: number = (elevation * Math.PI) / 180;
      const pole: boolean = Math.abs(elevation % 180) === 90;
      back = Camera.unit(
        pole
          ? [0, Math.sin(pitch) > 0 ? 1 : -1, 0]
          : [
              Math.cos(pitch) * Math.cos(yaw),
              Math.sin(pitch),
              Math.cos(pitch) * Math.sin(yaw),
            ],
      );
      right = Camera.unit(Camera.cross(pole ? [-1, 0, 0] : [0, 1, 0], back));
      up = Camera.cross(back, right);
      let extentX: number = 0;
      let extentY: number = 0;
      for (const point of points) {
        const delta: N.Point = [
          point[0] - base.target[0],
          point[1] - base.target[1],
          point[2] - base.target[2],
        ];
        extentX = Math.max(extentX, Math.abs(Camera.dot(delta, right)));
        extentY = Math.max(extentY, Math.abs(Camera.dot(delta, up)));
      }
      scale =
        0.88 *
        Math.min(
          (base.width - 40) / Math.max(2 * extentX, 0.001),
          (base.height - 110) / Math.max(2 * extentY, 0.001),
        );
    }
    scale *= request.zoom ?? 1;
    if (!(Number.isFinite(scale) && scale > 0))
      throw new Error("Explicit camera scale is not representable");
    return {
      ...base,
      name: "custom",
      back,
      right,
      up,
      scale,
      target: request.target === undefined ? base.target : [...request.target],
    };
  }
}

/** Reject missing/nonfinite scalar components rather than coercing empty strings to zero. */
function numeric(value: string, option: string): number {
  const number: number = Number(value);
  if (value.trim().length === 0 || !Number.isFinite(number))
    throw new Error(option + " requires finite numeric components");
  return number;
}
