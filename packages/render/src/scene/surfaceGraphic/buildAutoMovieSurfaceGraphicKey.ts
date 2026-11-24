import type {
  IAutoMovieFont,
  IAutoMovieSurfaceGraphic,
  IAutoMovieSurfaceGraphicLayer,
} from "@automovie/interface";
import * as THREE from "three";

import { clipAutoMovieSurfaceGraphicGeometry } from "./clipAutoMovieSurfaceGraphicGeometry.js";
import { createAutoMovieSurfaceGraphicMaterial } from "./createAutoMovieSurfaceGraphicMaterial.js";
import { createAutoMovieSurfaceGraphicQuad } from "./createAutoMovieSurfaceGraphicQuad.js";
import { createAutoMovieSurfaceGraphicText } from "./createAutoMovieSurfaceGraphicText.js";

/**
 * Build one key's graphic as a group of flat meshes on the face.
 *
 * The first mesh covers the whole face: the background's colour, or, for a
 * `null` background, a material that writes no colour, so the face still exists
 * as the region the mask paints whatever the layers hold. Each layer follows as
 * its own mesh in order. Render order rises with draw order from
 * {@link GRAPHIC_ORDER}, the face at it and layer `i` at one more than `i` past
 * it, and no material writes depth, so the layers stack by order rather than by
 * depth offsets. That order lies below every other blended mesh, a flame's `-1`
 * and the default `0` included, because a graphic lies on an opaque face that
 * already hides whatever is behind it: drawn first, the graphic is covered by a
 * flame or a glass in front of it instead of being painted over them.
 *
 * Image layers take the texture `image` returns for their asset. A `contain`
 * fit shrinks the quad to the image's aspect inside its box, centred; a `cover`
 * fit keeps the box and narrows the texture window to crop, centred; `stretch`
 * maps the whole image onto the box. Aspects are taken in metres on the face,
 * from the image's pixel width and height. A text layer draws its triangulated
 * glyphs, set by `createAutoMovieSurfaceGraphicText` from the decoded font
 * `font` returns, in its colour. A feed layer shows the texture `feed` returns,
 * the camera's picture with its first row at the bottom, under the emission.
 *
 * With an `outline`, every mesh, the face included, is clipped to it by
 * `clipAutoMovieSurfaceGraphicGeometry`, so neither the face the mask paints
 * nor any layer reaches past the surface, whatever pass draws them.
 *
 * Every geometry and material made is pushed to `owned` as it is made, so the
 * caller releases them even when a later layer throws.
 */
export function buildAutoMovieSurfaceGraphicKey(props: {
  /** The key's graphic. */
  graphic: IAutoMovieSurfaceGraphic;

  /** Face width along the frame's `+X`, metres. */
  width: number;

  /** Face depth along the frame's `Z`, metres. */
  depth: number;

  /**
   * The surface's outline in the frame's XZ plane, metres; absent, the whole
   * face rectangle.
   */
  outline?: readonly { x: number; z: number }[];

  /** The decoded texture for an image layer's asset. */
  image: (asset: string) => THREE.Texture;

  /** The decoded font a text layer's font id names. */
  font: (id: string) => IAutoMovieFont;

  /** The colour texture of a feed layer's own render target. */
  feed: (layer: IAutoMovieSurfaceGraphicLayer.IFeed) => THREE.Texture;

  /** Receives each feed layer's mesh, in layer order. */
  feeds?: THREE.Mesh[];

  /** Receives every geometry and material made. */
  owned: { dispose(): void }[];
}): THREE.Group {
  const { graphic, width, depth, owned }: typeof props = props;
  const group: THREE.Group = new THREE.Group();

  const face: THREE.Mesh = mesh(
    createAutoMovieSurfaceGraphicQuad(width, depth, FULL),
    graphic.background === null
      ? new THREE.MeshBasicMaterial({
          colorWrite: false,
          depthWrite: false,
          transparent: true,
        })
      : createAutoMovieSurfaceGraphicMaterial(
          graphic.emission,
          graphic.background,
        ),
    owned,
  );
  face.renderOrder = GRAPHIC_ORDER;
  group.add(face);

  graphic.layers.forEach(
    (layer: IAutoMovieSurfaceGraphicLayer, index: number): void => {
      const drawn: THREE.Mesh =
        layer.kind === "rect"
          ? mesh(
              createAutoMovieSurfaceGraphicQuad(width, depth, layer),
              createAutoMovieSurfaceGraphicMaterial(
                graphic.emission,
                layer.color,
              ),
              owned,
            )
          : layer.kind === "text"
            ? mesh(
                createAutoMovieSurfaceGraphicText(
                  width,
                  depth,
                  layer,
                  props.font(layer.font),
                ),
                createAutoMovieSurfaceGraphicMaterial(
                  graphic.emission,
                  layer.color,
                ),
                owned,
              )
            : layer.kind === "feed"
              ? mesh(
                  // A render target's first row is the picture's bottom, so
                  // the window runs v from 1 at the top to 0 at the bottom.
                  createAutoMovieSurfaceGraphicQuad(width, depth, layer, {
                    u0: 0,
                    v0: 1,
                    u1: 1,
                    v1: 0,
                  }),
                  createAutoMovieSurfaceGraphicMaterial(
                    graphic.emission,
                    { r: 1, g: 1, b: 1, a: null },
                    props.feed(layer),
                  ),
                  owned,
                )
              : imageMesh(layer, props);
      if (layer.kind === "feed") props.feeds?.push(drawn);
      drawn.renderOrder = GRAPHIC_ORDER + 1 + index;
      group.add(drawn);
    },
  );

  // Nothing paints past the surface's outline, in any pass.
  if (props.outline !== undefined)
    for (const child of group.children as THREE.Mesh[]) {
      const clipped: THREE.BufferGeometry = clipAutoMovieSurfaceGraphicGeometry(
        child.geometry,
        props.outline,
      );
      owned.push(clipped);
      child.geometry = clipped;
    }
  return group;
}

/**
 * The render order of a graphic's face; its layers follow it one by one. Far
 * below a flame's `-1` and the default `0`, so every graphic draws before any
 * other blended mesh.
 */
const GRAPHIC_ORDER: number = -1_000_000;

/** The whole face in face fractions. */
const FULL: IAutoMovieSurfaceGraphicLayer.IBox = {
  x: 0,
  y: 0,
  width: 1,
  height: 1,
};

/** A graphic mesh that casts no shadow, registered with its owner. */
function mesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  owned: { dispose(): void }[],
): THREE.Mesh {
  owned.push(geometry, material);
  const result: THREE.Mesh = new THREE.Mesh(geometry, material);
  result.castShadow = false;
  result.receiveShadow = material instanceof THREE.MeshLambertMaterial;
  return result;
}

/** One image layer's quad, fitted into its box by metric aspect. */
function imageMesh(
  layer: IAutoMovieSurfaceGraphicLayer.IImage,
  props: Parameters<typeof buildAutoMovieSurfaceGraphicKey>[0],
): THREE.Mesh {
  const texture: THREE.Texture = props.image(layer.asset);
  const pixels: { width: number; height: number } = texture.image as {
    width: number;
    height: number;
  };
  const boxWidth: number = layer.width * props.width;
  const boxHeight: number = layer.height * props.depth;
  const ratio: number = pixels.width / pixels.height / (boxWidth / boxHeight);
  let box: IAutoMovieSurfaceGraphicLayer.IBox = layer;
  let uv: { u0: number; v0: number; u1: number; v1: number } = {
    u0: 0,
    v0: 0,
    u1: 1,
    v1: 1,
  };

  // A ratio above one means the image is wider than its box.
  if (layer.fit === "contain")
    box =
      ratio > 1
        ? {
            x: layer.x,
            width: layer.width,
            y: layer.y + (layer.height * (1 - 1 / ratio)) / 2,
            height: layer.height / ratio,
          }
        : {
            x: layer.x + (layer.width * (1 - ratio)) / 2,
            width: layer.width * ratio,
            y: layer.y,
            height: layer.height,
          };
  else if (layer.fit === "cover")
    uv =
      ratio > 1
        ? { u0: (1 - 1 / ratio) / 2, u1: (1 + 1 / ratio) / 2, v0: 0, v1: 1 }
        : { u0: 0, u1: 1, v0: (1 - ratio) / 2, v1: (1 + ratio) / 2 };
  return mesh(
    createAutoMovieSurfaceGraphicQuad(props.width, props.depth, box, uv),
    createAutoMovieSurfaceGraphicMaterial(
      props.graphic.emission,
      { r: 1, g: 1, b: 1, a: null },
      texture,
    ),
    props.owned,
  );
}
