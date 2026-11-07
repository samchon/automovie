import type * as THREE from "three";

import type { IFilmProduction } from "../IFilmProduction";

/** Preserve the existing review-only camera API while drawing the same completed source time. This never evaluates motion or alters a delivered camera plan. */
export function createFilmInspectionView(
  production: () => IFilmProduction,
  draw: (seconds: number) => void,
  seconds: () => number,
): (value: string) => void {
  return (value: string): void => {
    const camera: THREE.PerspectiveCamera = production().camera;
    const [position, target] = value
      .split(":")
      .map((part: string): number[] => part.split(",").map(Number));
    if (position?.length !== 3 || target?.length !== 3)
      throw new Error("View is x,y,z:tx,ty,tz");
    camera.position.set(position[0]!, position[1]!, position[2]!);
    camera.fov = 40;
    camera.lookAt(target[0]!, target[1]!, target[2]!);
    camera.updateProjectionMatrix();
    draw(seconds());
  };
}
