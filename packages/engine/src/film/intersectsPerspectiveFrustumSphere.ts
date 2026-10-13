import {
  IAutoMovieDeliveryCrop,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieResolvedCamera } from "./IAutoMovieResolvedCamera";
import { resolveAutoMovieDeliveryCrop } from "./resolveAutoMovieDeliveryCrop";

interface IAutoMovieDeliveryCropNdc {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
  whole: boolean;
}

const deliveryCropNdc = (
  crop: IAutoMovieDeliveryCrop | undefined,
): IAutoMovieDeliveryCropNdc => {
  const resolved = resolveAutoMovieDeliveryCrop(crop);
  return {
    left: 2 * resolved.left - 1,
    right: 2 * resolved.right - 1,
    top: 1 - 2 * resolved.top,
    bottom: 1 - 2 * resolved.bottom,
    width: resolved.right - resolved.left,
    height: resolved.bottom - resolved.top,
    whole:
      resolved.left === 0 &&
      resolved.top === 0 &&
      resolved.right === 1 &&
      resolved.bottom === 1,
  };
};

/**
 * Whether a world-space sphere intersects an exact perspective-camera frustum.
 * Side-plane distances include plane normalization, so callers must not
 * approximate the radius by padding projected NDC coordinates.
 */
export const intersectsPerspectiveFrustumSphere = (props: {
  camera: IAutoMovieResolvedCamera;
  center: IAutoMovieVector3;
  radius: number;
  near: number;
  far: number;
  halfY: number;
  aspect: number;
  crop?: IAutoMovieDeliveryCrop;
}): boolean => {
  const local = Quaternion.rotateVector(
    Quaternion.inverse(props.camera.rotation),
    Vector3.subtract(props.center, props.camera.position),
  );
  const depth = -local.z;
  if (
    Number.isFinite(props.radius) === false ||
    props.radius < 0 ||
    depth + props.radius < props.near ||
    depth - props.radius > props.far
  )
    return false;
  const halfX = props.halfY * props.aspect;
  const crop = deliveryCropNdc(props.crop);
  const rightDistance = local.x - depth * halfX * crop.right;
  const leftDistance = -local.x + depth * halfX * crop.left;
  const topDistance = local.y - depth * props.halfY * crop.top;
  const bottomDistance = -local.y + depth * props.halfY * crop.bottom;
  return (
    rightDistance <= props.radius * Math.hypot(1, halfX * crop.right) &&
    leftDistance <= props.radius * Math.hypot(1, halfX * crop.left) &&
    topDistance <= props.radius * Math.hypot(1, props.halfY * crop.top) &&
    bottomDistance <= props.radius * Math.hypot(1, props.halfY * crop.bottom)
  );
};
