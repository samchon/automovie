import { frameHumanViewerCamera } from "./frameHumanViewerCamera";
import { lightHumanViewer } from "./lightHumanViewer";

/**
 * Admit one view a capture is asked for: a preset name, or angles with an optional framing margin, focus bone or focus point, and key light.
 *
 * Angles are finite degrees, the elevation within -90 to 90; a margin is a finite number of at least 1, where 1 touches the frame edge; a focus is one of the displayed skeleton's bones. A focus point is `{ bone, along }`, a point `along` (0 to 1, omitted 0) of the way from the bone's joint to its first child's, framed with `radius` metres around it; `radius` needs a point and a point needs a positive `radius`. A light is a preset name (`raking`) or `{ azimuth, elevation, relative }` with `relative` `world` or `camera` (see `lightHumanViewer`). Unknown properties are refused so a misspelt key is not silently ignored. The input is never mutated; on success the result is a fresh object.
 *
 * @param input Candidate view, of any shape
 * @param bones Bone names of the displayed skeleton
 * @returns The admitted view, or every finding
 *
 * @evidence contracts/common.md#principled-implementation Checks each property against its stated domain and the closed preset and bone sets, collecting every finding rather than stopping at the first.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the capture view's admission; the page frames only admitted views.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is clamped or defaulted silently: an out-of-range or unknown value is refused with its cause.
 * @evidence contracts/common.md#meaningful-documentation States the accepted shapes, each property's domain, the refusal of unknown keys and that the input is not mutated.
 * @evidence contracts/performance.md#efficient-algorithms Constant work per view plus one lookup in the bone list.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call admits its argument; there is no shared work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates the result and its findings only.
 */
export function admitHumanViewerCaptureView(
  input: unknown,
  bones: readonly string[],
): admitHumanViewerCaptureView.IResult {
  if (typeof input === "string")
    return (frameHumanViewerCamera.VIEWS as readonly string[]).includes(input)
      ? { success: true, view: input as frameHumanViewerCamera.View }
      : {
          success: false,
          errors: [
            `unknown preset "${input}"; presets are ${frameHumanViewerCamera.VIEWS.join(", ")}`,
          ],
        };
  if (typeof input !== "object" || input === null || Array.isArray(input))
    return {
      success: false,
      errors: ["a view is a preset name or an object of angles"],
    };
  const record: Record<string, unknown> = input as Record<string, unknown>;
  const errors: string[] = [];
  for (const key of Object.keys(record))
    if (!KEYS.includes(key)) errors.push(`unknown property "${key}"`);
  const finite = (key: string): number | null => {
    const value: unknown = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    errors.push(`${key} must be a finite number of degrees`);
    return null;
  };
  const azimuth: number | null = finite("azimuth");
  const elevation: number | null = finite("elevation");
  if (elevation !== null && Math.abs(elevation) > 90)
    errors.push("elevation must lie within -90 to 90");
  const margin: unknown = record.margin;
  if (
    margin !== undefined &&
    !(typeof margin === "number" && Number.isFinite(margin) && margin >= 1)
  )
    errors.push("margin must be a finite number of at least 1");
  const focus: unknown = record.focus;
  if (
    focus !== undefined &&
    !(typeof focus === "string" && bones.includes(focus))
  )
    errors.push(`focus must be a bone of the skeleton, not ${String(focus)}`);
  const point: admitHumanViewerCaptureView.IPoint | undefined = admitPoint(
    record.point,
    bones,
    errors,
  );
  const radius: unknown = record.radius;
  if (
    radius !== undefined &&
    !(typeof radius === "number" && Number.isFinite(radius) && radius > 0)
  )
    errors.push("radius must be a positive number of metres");
  if ((point === undefined) !== (radius === undefined))
    errors.push("point and radius go together");
  if (point !== undefined && focus !== undefined)
    errors.push("a view frames either a focus bone or a focus point");
  const light: lightHumanViewer.ILight | undefined = admitLight(
    record.light,
    errors,
  );
  if (errors.length !== 0 || azimuth === null || elevation === null)
    return { success: false, errors };
  return {
    success: true,
    view: {
      azimuth,
      elevation,
      ...(margin !== undefined ? { margin: margin as number } : {}),
      ...(focus !== undefined ? { focus: focus as string } : {}),
      ...(point !== undefined ? { point, radius: radius as number } : {}),
      ...(light !== undefined ? { light } : {}),
    },
  };
}
/**
 * Types of {@link admitHumanViewerCaptureView}.
 *
 * @evidence contracts/common.md#principled-implementation The angle view extends the camera's angles with the two framing choices a capture adds, and the result is a discriminated union on success.
 * @evidence contracts/common.md#clear-and-simple-design The namespace keeps the admitted shapes beside the function that produces them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every optional property's omission has a stated meaning.
 * @evidence contracts/common.md#meaningful-documentation Documents each property's meaning and what its omission means.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Types perform no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Types coordinate no work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Types own no resource.
 */
export namespace admitHumanViewerCaptureView {
  /**
   * A view given by angles, with optional framing.
   *
   * @author Samchon
   */
  export interface IAngleView extends frameHumanViewerCamera.IAngle {
    /** Framing margin, 1 touching the frame edge; omitted, the capture scale's own. */
    margin?: number;

    /** Bone whose subtree a close view frames; given, the view is captured once, close on this bone, whatever scales the capture lists. */
    focus?: string;

    /** Point a close view frames instead of a bone's subtree; given, the view is captured once, whatever scales the capture lists. */
    point?: IPoint;

    /** Half the width the point is framed with, metres; given with `point`. */
    radius?: number;

    /** Key light of the view; omitted, the page's default light. */
    light?: lightHumanViewer.ILight;
  }

  /**
   * A point on the skeleton: a joint, or a share of the way along a bone.
   *
   * @author Samchon
   */
  export interface IPoint {
    /** The bone. */
    bone: string;

    /** Share of the way from the bone's joint to its first child's joint, 0 to 1. */
    along: number;
  }

  /** An admitted view, or every finding about a refused one. */
  export type IResult =
    | {
        success: true;
        view: frameHumanViewerCamera.View | IAngleView;
      }
    | { success: false; errors: string[] };
}

/** Properties an angle view may carry. */
const KEYS: readonly string[] = [
  "azimuth",
  "elevation",
  "margin",
  "focus",
  "point",
  "radius",
  "light",
];

/** Admit a focus point, or record why not. */
function admitPoint(
  input: unknown,
  bones: readonly string[],
  errors: string[],
): admitHumanViewerCaptureView.IPoint | undefined {
  if (input === undefined) return undefined;
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    errors.push("point must be { bone, along }");
    return undefined;
  }
  const record: Record<string, unknown> = input as Record<string, unknown>;
  for (const key of Object.keys(record))
    if (key !== "bone" && key !== "along")
      errors.push(`unknown point property "${key}"`);
  const bone: unknown = record.bone;
  const along: unknown = record.along ?? 0;
  const valid: boolean =
    typeof bone === "string" &&
    bones.includes(bone) &&
    typeof along === "number" &&
    along >= 0 &&
    along <= 1;
  if (!valid)
    errors.push(
      "point needs a bone of the skeleton and an along between 0 and 1",
    );
  return valid ? { bone: bone as string, along: along as number } : undefined;
}

/** Admit a key light, or record why not. */
function admitLight(
  input: unknown,
  errors: string[],
): lightHumanViewer.ILight | undefined {
  if (input === undefined) return undefined;
  if (typeof input === "string") {
    if (Object.hasOwn(lightHumanViewer.PRESETS, input))
      return {
        ...lightHumanViewer.PRESETS[
          input as keyof typeof lightHumanViewer.PRESETS
        ],
      };
    errors.push(
      `unknown light "${input}"; presets are ${Object.keys(lightHumanViewer.PRESETS).join(", ")}`,
    );
    return undefined;
  }
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    errors.push("light must be a preset name or { azimuth, elevation, relative }");
    return undefined;
  }
  const record: Record<string, unknown> = input as Record<string, unknown>;
  for (const key of Object.keys(record))
    if (key !== "azimuth" && key !== "elevation" && key !== "relative")
      errors.push(`unknown light property "${key}"`);
  const { azimuth, elevation, relative } = record;
  const valid: boolean =
    typeof azimuth === "number" &&
    Number.isFinite(azimuth) &&
    typeof elevation === "number" &&
    Number.isFinite(elevation) &&
    Math.abs(elevation) <= 90 &&
    (relative === "world" || relative === "camera");
  if (!valid)
    errors.push(
      "light needs finite azimuth, elevation within -90 to 90 and relative world or camera",
    );
  return valid
    ? {
        azimuth: azimuth as number,
        elevation: elevation as number,
        relative: relative as "world" | "camera",
      }
    : undefined;
}
