import type {
  IAutoMovieLight,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Build a white scene light at `position` whose local -Z travels along
 * `direction`, with unit scale.
 *
 * The rotation is the shortest arc from -Z to the normalized `direction`,
 * `normalize(1 + a·b, a × b)` with `a = -Z`; a direction exactly along +Z,
 * which has no unique shortest arc, takes a half turn about +Y. `kind` supplies
 * the type and its own fields.
 *
 * @param props Id, intensity, position, travel direction and the kind's fields.
 * @returns The light record.
 * @evidence contracts/development/common.md#meaningful-documentation States the rotation construction, its degenerate case, the white colour and unit scale.
 * @evidence contracts/development/implementation.md#principled-implementation The half-vector quaternion is the standard shortest rotation between two unit vectors; the antiparallel case picks a fixed perpendicular axis.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One builder shared by the meter tests so each scenario states only its geometry.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No expected value is computed here; the tests derive their expectations independently.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per light.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each light is a fresh record.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function aimedLight(props: {
  id: string;
  intensity: number;
  position: IAutoMovieVector3;
  direction: IAutoMovieVector3;
  color?: { r: number; g: number; b: number };
  kind:
    | { type: "directional" }
    | { type: "point"; range: number }
    | { type: "spot"; range: number; coneAngle: number }
    | { type: "area"; width: number; height: number };
}): IAutoMovieLight {
  const length: number = Math.hypot(
    props.direction.x,
    props.direction.y,
    props.direction.z,
  );
  const b: IAutoMovieVector3 = {
    x: props.direction.x / length,
    y: props.direction.y / length,
    z: props.direction.z / length,
  };

  // a = (0, 0, -1): a·b = -b.z and a × b = (b.y, -b.x, 0).
  const w: number = 1 - b.z;
  const raw: IAutoMovieQuaternion =
    w < 1e-12 ? { x: 0, y: 1, z: 0, w: 0 } : { x: b.y, y: -b.x, z: 0, w };
  const norm: number = Math.hypot(raw.x, raw.y, raw.z, raw.w);
  const rotation: IAutoMovieQuaternion = {
    x: raw.x / norm,
    y: raw.y / norm,
    z: raw.z / norm,
    w: raw.w / norm,
  };
  return {
    id: props.id,
    transform: {
      translation: props.position,
      rotation,
      scale: { x: 1, y: 1, z: 1 },
    },
    color: { ...(props.color ?? { r: 1, g: 1, b: 1 }), a: null },
    intensity: props.intensity,
    ...props.kind,
  } as IAutoMovieLight;
}
