import type { IAutoMovieConstructionCurve } from "@automovie/engine";
import {
  type IAutoMovieInspectionRequest,
  type IAutoMovieSceneRaster,
  rasterizeAutoMovieScene,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * The stage the inspection tests draw on, and the readings they take of it.
 *
 * A picture is 64 pixels square, drawn through a 60° camera five metres in front of the origin, so one metre on the origin plane spans about 11 pixels and the origin is pixel (32, 32). Quads are flat-coloured and double-sided on a blue background, so a pixel is exactly a quad's colour, a mark's colour or the background.
 */
export namespace InspectionStage {
  /** The colour of a red quad's pixel. */
  export const RED: number[] = [255, 0, 0];

  /** The colour of a green quad's pixel. */
  export const GREEN: number[] = [0, 255, 0];

  /** The colour of a background pixel. */
  export const BLUE: number[] = [0, 0, 255];

  /** The fixed camera every picture is drawn through. */
  const camera: THREE.PerspectiveCamera = ((): THREE.PerspectiveCamera => {
    const fixed: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
      60,
      1,
      0.1,
      100,
    );
    fixed.position.set(0, 0, 5);
    fixed.lookAt(0, 0, 0);
    fixed.updateMatrixWorld();
    return fixed;
  })();

  /** Draw a scene as a 64 pixel square picture. */
  export function draw(stage: THREE.Scene): IAutoMovieSceneRaster {
    return rasterizeAutoMovieScene({
      scene: stage,
      camera,
      width: 64,
      height: 64,
    });
  }

  /** The red, green and blue of one pixel. */
  export function at(
    raster: IAutoMovieSceneRaster,
    x: number,
    y: number,
  ): number[] {
    return Array.from(
      raster.pixels.subarray(
        (y * raster.width + x) * 4,
        (y * raster.width + x) * 4 + 3,
      ),
    );
  }

  /**
   * A named square facing the camera.
   *
   * @param name Its object name, which is its inspection path at the scene's top.
   * @param color Its flat colour, sRGB hex.
   * @param x Its centre along X, metres.
   * @param size Its side, metres.
   */
  export function quad(
    name: string,
    color: number,
    x: number = 0,
    size: number = 2,
  ): THREE.Mesh {
    const mesh: THREE.Mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),
    );
    mesh.name = name;
    mesh.position.x = x;
    return mesh;
  }

  /** A scene of the given objects on the blue background. */
  export function scene(...objects: THREE.Object3D[]): THREE.Scene {
    const stage: THREE.Scene = new THREE.Scene();
    stage.background = new THREE.Color(0x0000ff);
    stage.add(...objects);
    return stage;
  }

  /** Two 1 m quads, a red `left` and a green `right`, whose centres are pixels (18, 32) and (45, 32). */
  export function pair(): [
    stage: THREE.Scene,
    left: THREE.Mesh,
    right: THREE.Mesh,
  ] {
    const left: THREE.Mesh = quad("left", 0xff0000, -1.2, 1);
    const right: THREE.Mesh = quad("right", 0x00ff00, 1.2, 1);
    return [scene(left, right), left, right];
  }

  /** The pixels at the centres of the two quads of {@link pair}, left then right. */
  export function sides(stage: THREE.Scene): number[][] {
    const raster: IAutoMovieSceneRaster = draw(stage);
    return [at(raster, 18, 32), at(raster, 45, 32)];
  }

  /** The pixels of the picture's middle column at the given rows. */
  export function column(stage: THREE.Scene, rows: number[]): number[][] {
    const raster: IAutoMovieSceneRaster = draw(stage);
    return rows.map((row: number): number[] => at(raster, 32, row));
  }

  /** Assert that every channel of a pixel is within a tolerance of the expected one. */
  export function near(
    title: string,
    actual: number[],
    expected: number[],
    tolerance: number = 1,
  ): void {
    TestValidator.predicate(
      `${title}: ${actual.join(",")} within ${tolerance} of ${expected.join(",")}`,
      actual.length === expected.length &&
        actual.every(
          (value: number, i: number): boolean =>
            Math.abs(value - expected[i]!) <= tolerance,
        ),
    );
  }

  /** The request that asks for nothing, with the given members replaced. */
  export function ask(
    changes: Partial<IAutoMovieInspectionRequest>,
  ): IAutoMovieInspectionRequest {
    return {
      parts: [],
      hide: [],
      shade: "beauty",
      surface: true,
      wire: false,
      curves: [],
      defects: [],
      sliver: null,
      section: null,
      xray: false,
      stroke: 3,
      ...changes,
    };
  }

  /** An unflagged construction curve whose id is its part's name. */
  export function curve(
    part: string,
    kind: IAutoMovieConstructionCurve.Kind,
    closed: boolean,
    points: number[],
  ): IAutoMovieConstructionCurve {
    return { id: part, kind, part, closed, points, flagged: false };
  }
}
