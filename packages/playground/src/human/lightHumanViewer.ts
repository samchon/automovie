import * as THREE from "three";

/**
 * Place the Human page's key light for a view, so form can be read by its shading from any side.
 *
 * `null` keeps the page's default: the sun fixed at world (2, 4, 3), up and to the front left of the person, over a strong hemisphere fill. A given light turns the sun to the direction its angles name and lowers the fill, so the key light alone shapes the surface:
 *
 * - `world`: azimuth and elevation as a view's, degrees from the subject's front toward its left and above the horizontal, the light shining from there toward the framed point.
 * - `camera`: azimuth turns from the eye toward the image's right and elevation toward its top, so `{ azimuth: 0, elevation: 0 }` is a headlight and an azimuth near 90 a grazing light that rakes across the surface the camera sees.
 *
 * The sun keeps its distance from the framed point, so only its direction changes.
 *
 * @param props The light, the page's sun and hemisphere fill, the camera and the framed point
 *
 * @evidence contracts/common.md#principled-implementation A directional light shades by the angle between its direction and the surface normal, so naming the direction by two angles in the world or the camera's frame is all a grazing light needs.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the key light's placement and the fill it pairs with; the page decides when a view asks for it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The default light and the given-light intensities are stated constants for every person, never tuned per capture.
 * @evidence contracts/common.md#meaningful-documentation States both frames' angle conventions, the default and what a given light changes.
 * @evidence contracts/performance.md#efficient-algorithms Constant work: one direction from two angles in a fixed basis.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call places the light for its view; there is nothing to reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Moves the page's existing lights and allocates a few vectors.
 */
export function lightHumanViewer(props: {
  light: lightHumanViewer.ILight | null;
  sun: THREE.DirectionalLight;
  hemisphere: THREE.HemisphereLight;
  camera: THREE.Camera;
  target: THREE.Vector3;
}): void {
  const { sun, hemisphere, target } = props;
  sun.target.position.copy(target);
  sun.target.updateMatrixWorld();
  if (props.light === null) {
    sun.position.copy(lightHumanViewer.DEFAULT_POSITION);
    sun.intensity = lightHumanViewer.INTENSITY.default.sun;
    hemisphere.intensity = lightHumanViewer.INTENSITY.default.hemisphere;
    sun.target.position.set(0, 0, 0);
    sun.target.updateMatrixWorld();
    return;
  }
  const azimuth: number = THREE.MathUtils.degToRad(props.light.azimuth);
  const elevation: number = THREE.MathUtils.degToRad(props.light.elevation);
  const direction: THREE.Vector3 = new THREE.Vector3();
  if (props.light.relative === "world")
    direction.set(
      Math.sin(azimuth) * Math.cos(elevation),
      Math.sin(elevation),
      Math.cos(azimuth) * Math.cos(elevation),
    );
  else {
    const back: THREE.Vector3 = new THREE.Vector3();
    const right: THREE.Vector3 = new THREE.Vector3();
    const up: THREE.Vector3 = new THREE.Vector3();
    props.camera.updateMatrixWorld();
    props.camera.matrixWorld.extractBasis(right, up, back);
    direction
      .addScaledVector(back, Math.cos(azimuth) * Math.cos(elevation))
      .addScaledVector(right, Math.sin(azimuth) * Math.cos(elevation))
      .addScaledVector(up, Math.sin(elevation));
  }
  const distance: number = lightHumanViewer.DEFAULT_POSITION.length();
  sun.position.copy(target).addScaledVector(direction.normalize(), distance);
  sun.intensity = lightHumanViewer.INTENSITY.given.sun;
  hemisphere.intensity = lightHumanViewer.INTENSITY.given.hemisphere;
}
/**
 * Lights of {@link lightHumanViewer}.
 *
 * @evidence contracts/common.md#principled-implementation The light record names a direction by the same two angles a view uses, in a declared frame; the presets are records of that shape.
 * @evidence contracts/common.md#clear-and-simple-design The namespace keeps the light's shape, presets and constants beside the function that places it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Presets are named directions for every person, not per-capture adjustments.
 * @evidence contracts/common.md#meaningful-documentation Documents each property, each preset and each constant.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Types and constants perform no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Types and constants coordinate no work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Constants own no resource.
 */
export namespace lightHumanViewer {
  /**
   * A key light's direction.
   *
   * @author Samchon
   */
  export interface ILight {
    /** Degrees: in the world, from the subject's front toward its left; in the camera, from the eye toward the image's right. */
    azimuth: number;

    /** Degrees above the horizontal or the image's middle, -90 to 90. */
    elevation: number;

    /** The frame the angles are read in. */
    relative: "world" | "camera";
  }

  /** Named lights: `raking` grazes the visible surface from the image's right, 80 degrees off the eye and 20 above, so relief casts long shading. */
  export const PRESETS: Record<"raking", ILight> = {
    raking: { azimuth: 80, elevation: 20, relative: "camera" },
  };

  /** The page's default sun position, world metres. */
  export const DEFAULT_POSITION: THREE.Vector3 = new THREE.Vector3(2, 4, 3);

  /** Key and fill intensities for the default light and for a given one, whose weak fill leaves the key light to shape the surface. */
  export const INTENSITY: Record<
    "default" | "given",
    { sun: number; hemisphere: number }
  > = {
    default: { sun: 1.4, hemisphere: 1.6 },
    given: { sun: 2.4, hemisphere: 0.45 },
  };
}
