import { AutoMovieLightProperty } from "./AutoMovieLightProperty";
import { IAutoMovieLightChannelProperty } from "./IAutoMovieLightChannelProperty";

/**
 * Every animatable light property, keyed by the pointer's last segment.
 *
 * Total over {@link AutoMovieLightProperty}: adding a member to that union
 * without giving it a `carries`/`write` pair does not compile, which is how a
 * widened contract cannot outrun its applier.
 *
 * @evidence requirements/lighting/scope-and-identity.md#lighting-authored-input Registers each animatable light property in the exhaustive channel table.
 * @evidence requirements/lighting/color-exposure-and-display-boundary.md#lighting-color-refusal Declares finite scene-linear color channel components valid only inside the inclusive unit interval consumed by the artifact gate.
 * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-light-authority-branches Makes property support exhaustive across the declared light branches.
 * @evidence specifications/camera-light-and-visibility/light-transport-color-and-budget.md#clv-color-comparison-refusal Supplies the explicit scene-linear color domain that rejects non-finite and out-of-range animated source values before application.
 */
export const LIGHT_CHANNEL_PROPERTIES: Readonly<
  Record<AutoMovieLightProperty, IAutoMovieLightChannelProperty>
> = {
  intensity: {
    valueType: "scalar",
    bounds: { min: 0, max: Infinity, inclusiveMin: true },
    carries: () => true,
    write: (override, value) => {
      override.intensity = value[0]!;
    },
  },
  color: {
    valueType: "vec3",
    bounds: { min: 0, max: 1, inclusiveMin: true },
    carries: () => true,
    write: (override, value) => {
      override.color = {
        r: value[0]!,
        g: value[1]!,
        b: value[2]!,
        a: null,
        // `hex` is documented as a derived sRGB label for the linear triple. An
        // animated colour outruns it every frame, so carrying the staged label
        // forward would state a value that is no longer the light's.
        hex: null,
      };
    },
  },
  range: {
    valueType: "scalar",
    bounds: { min: 0, max: Infinity, inclusiveMin: true },
    // The two punctual kinds that fall off with distance, named positively.
    // "Not directional" used to say the same thing and stopped being true when
    // the area panel arrived: its falloff follows from its own area, so a
    // `range` track on one would state a second, contradictory falloff.
    carries: (kind) => kind === "point" || kind === "spot",
    write: (override, value) => {
      override.range = value[0]!;
    },
  },
  coneAngle: {
    valueType: "scalar",
    bounds: { min: 0, max: 90, inclusiveMin: false },
    carries: (kind) => kind === "spot",
    write: (override, value) => {
      override.coneAngle = value[0]!;
    },
  },
  position: {
    valueType: "vec3",
    // A place in the world has no documented range: the scene gate holds a
    // light's translation to finiteness and nothing more, and the shared
    // track-shape contract already refuses a non-finite keyframe. Stating the
    // unbounded interval keeps this column honest rather than inventing a
    // ceiling no artifact is held to.
    bounds: { min: -Infinity, max: Infinity, inclusiveMin: true },
    carries: (kind) => kind !== "directional",
    write: (override, value) => {
      override.position = { x: value[0]!, y: value[1]!, z: value[2]! };
    },
  },
  rotation: {
    valueType: "quaternion",
    // `quaternion` rather than `vec4` so `sampleClip` SLERPs it: a light
    // swinging through a wide arc under component-wise lerp would slow in the
    // middle and dip off the unit sphere, and the same declaration would then
    // aim differently depending on how far apart its keys sat.
    bounds: { min: -1, max: 1, inclusiveMin: true },
    valueFault: unitQuaternionFault,
    carries: (kind) => kind !== "point",
    write: (override, value) => {
      override.rotation = {
        x: value[0]!,
        y: value[1]!,
        z: value[2]!,
        w: value[3]!,
      };
    },
  },
};
