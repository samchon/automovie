import * as THREE from "three";

import type { AutoMovieHumanSkeleton as Skeleton } from "../../../human/src/skeleton/AutoMovieHumanSkeleton";
import { reportAutoMovieResourceRetirement } from "../../../viewer/src/reportAutoMovieResourceRetirement";

/**
 * Draw optional joint-location annotations at the generated rig's actual pivots.
 *
 * Each bone owns one local-zero point under its existing posed placement. The
 * visual sink can bind that same object without another FK calculation. The
 * ring is an xray annotation: it deliberately ignores depth and its diameter
 * is in CSS pixels through Three's non-attenuated PointsMaterial and renderer
 * pixel ratio. It represents neither a physical joint radius nor visibility
 * of that joint through the skin. A shared procedural glyph supplies a white
 * outer outline and a configurable inner stroke.
 *
 * Major pivots omit the head, eyes, jaw, fingers and toes. All bones are built
 * once so detail changes only visibility within the fixed binding hierarchy.
 *
 * @param output Generated rest identities and their actual posed placements.
 * @param options Display size, inner stroke and initial detail, independent of anatomy.
 * @returns Owned annotations, exact bone bindings, visibility control and cleanup.
 *
 * @evidence contracts/common.md#principled-implementation Local-zero points consume the existing world placements once; non-attenuated point sprites keep display size under the actual camera and renderer pixel ratio without moving pivots.
 * @evidence contracts/common.md#clear-and-simple-design One drawing per bone and one shared glyph/material serve the existing structural visual sink; detail changes visibility only.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Markers use no guessed joint coordinates, anatomical radius or FK; xray projection and the semantic major-pivot list are explicit display choices.
 * @evidence contracts/common.md#meaningful-documentation Documents pixel units, depth behavior, actual-pivot ownership, fixed bindings and the default exclusion of facial and small-joint diagnostics.
 * @evidence contracts/performance.md#efficient-algorithms Maps and drawings are O(B) in the supplied bones; the shared 32-square glyph has fixed construction cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Every marker shares one point buffer, texture and material; pose bindings and detail switches reuse all geometry.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The disposer independently attempts its buffer, texture, material and drawing cleanup once; a retirement failure stays sticky without resource retries, and no skeleton or request cache is retained.
 */
export function buildHumanPolygonHints(
  output: Skeleton.IOutput,
  options: {
    /** Positive annotation diameter in CSS pixels; default 12, not physical size. */
    diameterPixels?: number;

    /** Inner ring's RGB hex colour; the white outer outline remains independent. */
    color?: number;

    /** Major pivots initially; all explicitly includes facial and small-joint diagnostics. */
    detail?: "major" | "all";
  } = {},
): {
  /** Add once beneath the same drawings root as the polygon. */
  object: THREE.Group;

  /** Exact original targets, to merge with the visual sink's existing bone slots. */
  bindings: { bone: string; objects: THREE.Object3D[] }[];

  /** Change visibility without replacing targets, bindings or geometry. */
  setDetail: (detail: "major" | "all") => void;

  /** Release the owned GPU resources and detach this annotation drawing. */
  dispose: () => void;
} {
  const diameterPixels: number = options.diameterPixels ?? 12;
  const color: number = options.color ?? 0x111111;
  const detail: "major" | "all" = options.detail ?? "major";
  if (
    !(Number.isFinite(diameterPixels) && diameterPixels > 0) ||
    !Number.isInteger(color) ||
    color < 0 ||
    color > 0xffffff ||
    (detail !== "major" && detail !== "all")
  )
    throw new Error(
      "Joint hints require a positive pixel diameter, RGB colour and supported detail",
    );

  const placements: Map<string, Skeleton.IPlacement> = new Map(
    output.posed.map(
      (placement: Skeleton.IPlacement): [string, Skeleton.IPlacement] => [
        placement.bone,
        placement,
      ],
    ),
  );
  const identities: Set<string> = new Set(
    output.bones.map((bone: Skeleton.IBone): string => bone.bone),
  );
  if (
    placements.size !== output.posed.length ||
    identities.size !== output.bones.length
  )
    throw new Error("Joint hints require unique bone and placement identities");
  for (const bone of output.bones) {
    const placement: Skeleton.IPlacement | undefined = placements.get(
      bone.bone,
    );
    if (
      placement === undefined ||
      !placement.position.every(Number.isFinite) ||
      !placement.rotation.every(Number.isFinite)
    )
      throw new Error(
        `Joint hints require the actual placement of ${bone.bone}`,
      );
  }

  const major: Set<string> = new Set([
    "hips",
    "neck",
    ...["left", "right"].flatMap((side: string): string[] =>
      ["UpperArm", "LowerArm", "Hand", "UpperLeg", "LowerLeg", "Foot"].map(
        (joint: string): string => side + joint,
      ),
    ),
  ]);
  const object: THREE.Group = new THREE.Group();
  object.name = "human.polygon.hints";
  object.userData.humanHint = { diameterPixels, color, detail, xray: true };
  const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([0, 0, 0], 3),
  );
  const texture: THREE.DataTexture = ringTexture(color);
  const material: THREE.PointsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    map: texture,
    size: diameterPixels,
    sizeAttenuation: false,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const bindings: { bone: string; objects: THREE.Object3D[] }[] = [];
  const targets: { object: THREE.Group; major: boolean }[] = [];
  let disposed: boolean = false;
  let retirementFailure: { error: unknown } | undefined;
  for (const bone of output.bones) {
    const placement: Skeleton.IPlacement = placements.get(bone.bone)!;
    const target: THREE.Group = new THREE.Group();
    target.name = `human.polygon.hints.${bone.bone}`;
    target.position.set(...placement.position);
    target.quaternion.set(...placement.rotation);
    const glyph: THREE.Points = new THREE.Points(geometry, material);
    glyph.name = `${target.name}.glyph`;

    // User annotations remain above the existing stickman diagnostic layer 3.
    glyph.renderOrder = 4;
    glyph.userData = {
      humanHintBone: bone.bone,
      humanHintKind: "joint",
      humanHintDetail: major.has(bone.bone) ? "major" : "detail",
    };
    target.add(glyph);
    object.add(target);
    bindings.push({ bone: bone.bone, objects: [target] });
    targets.push({ object: target, major: major.has(bone.bone) });
  }

  const setDetail: (selected: "major" | "all") => void = (
    selected: "major" | "all",
  ): void => {
    if (disposed) throw new Error("Joint hints are disposed");
    if (selected !== "major" && selected !== "all")
      throw new Error("Unsupported joint hint detail");
    for (const target of targets)
      target.object.visible = selected === "all" || target.major;
    object.userData.humanHint.detail = selected;
  };
  setDetail(detail);
  return {
    object,
    bindings,
    setDetail,
    dispose: (): void => {
      if (retirementFailure !== undefined) throw retirementFailure.error;
      if (disposed) return;
      disposed = true;
      try {
        reportAutoMovieResourceRetirement([
          (): void => geometry.dispose(),
          (): void => material.dispose(),
          (): void => texture.dispose(),
          (): void => object.removeFromParent(),
          (): void => object.clear(),
          (): void => {
            bindings.length = 0;
          },
          (): void => {
            targets.length = 0;
          },
        ]);
      } catch (error: unknown) {
        retirementFailure = { error };
        throw error;
      }
    },
  };
}

/** A fixed-resolution display glyph; stroke fractions describe its icon, not anatomy. */
function ringTexture(color: number): THREE.DataTexture {
  const size: number = 32;
  const pixels: Uint8Array = new Uint8Array(size * size * 4);
  for (let y: number = 0; y < size; y++)
    for (let x: number = 0; x < size; x++) {
      const radius: number =
        Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2) / (size / 2);
      const offset: number = 4 * (y * size + x);
      const stroke: number = radius > 0.75 ? 0xffffff : color;
      pixels[offset] = (stroke >> 16) & 0xff;
      pixels[offset + 1] = (stroke >> 8) & 0xff;
      pixels[offset + 2] = stroke & 0xff;
      pixels[offset + 3] = radius >= 0.45 && radius <= 0.95 ? 255 : 0;
    }
  const texture: THREE.DataTexture = new THREE.DataTexture(
    pixels,
    size,
    size,
    THREE.RGBAFormat,
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}
