import type { HUMAN_DEBUG_CAMERAS } from "./HUMAN_DEBUG_CAMERAS";

/**
 * Every option of one viewer frame: what is shown, how it is coloured and from where it is seen.
 *
 * The page, the image route, the batch route and the capture CLI all read this one record through
 * `HumanDebugOptions`, so a URL alone reproduces any frame. Lengths are millimetres and angles
 * degrees in the body frame (forward +X, up +Y, left +Z). Patterns are globs over part ids
 * (`human.skin.<chain>/<k>`) or curve ids (`human.construction.<chain>/<k|axis|g<j>|name>`), with
 * the namespace prefix optional.
 */
export interface IHumanDebugOptions {
  /** Typed example by its export name, such as `f1`; null picks the first exported person. */
  person: string | null;

  /** Registered piece `<name>` or `<name>:<argument>`; null shows the whole generated figure. */
  piece: string | null;

  /**
   * Pose of the whole figure: `neutral`, the anatomical neutral the rig defines and the default,
   * another key of `HUMAN_DEBUG_POSES`, or `bind` for the skin as generated. A piece has no pose.
   */
  pose: string;

  /** Parts shown; empty shows none. */
  parts: string[];

  /** Parts hidden after {@link parts}. */
  hide: string[];

  /** Part colours; the last matching entry wins. */
  partColor: IHumanDebugOptions.IColour[];

  /** Curves shown; empty shows none. */
  curves: string[];

  /** Curves hidden after {@link curves}. */
  curveHide: string[];

  /** Curve kinds shown. */
  kinds: IHumanDebugOptions.CurveKind[];

  /** Tube radius of every curve without its own {@link thick} entry, mm. */
  curveWidth: number;

  /** Per-curve tube radii in mm; the last matching entry wins. */
  thick: IHumanDebugOptions.IRadius[];

  /** Per-curve colours over the kind colours; the last matching entry wins. */
  curveColor: IHumanDebugOptions.IColour[];

  /** Draw every curve through the surface; otherwise only chain axes, which lie inside the body, are. */
  xray: boolean;

  /** Curve labels: none (`0`), every shown curve (`1`), or the curves named by `thick` or `curveColor`. */
  labels: "0" | "1" | "marked";

  /** Named direction; {@link az} and {@link el} override its angles. */
  camera: keyof typeof HUMAN_DEBUG_CAMERAS;

  /** Azimuth in degrees from +X toward +Z; null keeps the camera's. */
  az: number | null;

  /** Elevation in degrees toward +Y; null keeps the camera's. */
  el: number | null;

  /** Camera distance from the target in mm; null fits the focus box. */
  dist: number | null;

  /** Look-at point in mm; null uses the focus box centre. */
  target: [number, number, number] | null;

  /** Vertical field of view of the perspective camera, degrees. */
  fov: number;

  /** Orthographic projection. */
  ortho: boolean;

  /** Parts the camera frames for a close-up; empty frames every shown part. */
  focus: string[];

  /** Surface shading: the generated appearance, plain clay, normal directions or mean curvature. */
  shade: "appearance" | "clay" | "normals" | "curvature";

  /** Reference illumination or one grazing key light. */
  light: "reference" | "raking";

  /** Screen side the raking light comes from. */
  lightSide: "left" | "right" | "top" | "bottom";

  /** Raking light elevation above the screen plane, degrees. */
  lightEl: number;

  /** Surface opacity in (0, 1]; below 1 the curves inside read through it. */
  opacity: number;

  /** Draw triangle edges. */
  wire: boolean;

  /** Draw vertex normals. */
  normals: boolean;

  /** Length of a drawn normal, mm. */
  normalLength: number;

  /** Axis the section plane is perpendicular to, or none. */
  section: "none" | "x" | "y" | "z";

  /** Section plane position along its axis in mm; null uses the focus box centre. */
  sectionAt: number | null;

  /** False removes the + side of the section axis, true the - side. */
  sectionFlip: boolean;

  /** Background colour `rrggbb`. */
  bg: string;

  /** Canvas width in pixels; 0 fills the viewport. */
  w: number;

  /** Canvas height in pixels; 0 fills the viewport. */
  h: number;

  /** Show the sidebar and compile panel; frames for capture use 0. */
  ui: boolean;

  /** Draw the body axes at the focus box corner. */
  axes: boolean;
}

export namespace IHumanDebugOptions {
  /** What a curve is in the loft, read from the last segment of its id. */
  export type CurveKind = "section" | "axis" | "guide" | "path";

  /** One pattern and the colour it assigns. */
  export interface IColour {
    /** Glob over ids. */
    pattern: string;

    /** Six lower-case hexadecimal digits without `#`. */
    colour: string;
  }

  /** One pattern and the tube radius it assigns. */
  export interface IRadius {
    /** Glob over curve ids. */
    pattern: string;

    /** Tube radius, mm. */
    radius: number;
  }
}
