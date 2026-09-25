import {
  HUMAN_PREVIEW_GREY_CARD,
  HUMAN_PREVIEW_MIDDLE_GREY,
  type HumanPreviewLight,
  balanceHumanPreviewRig,
  humanPreviewAcesExposure,
  humanPreviewGreyCard,
} from "@automovie/playground/src/human/previewExposure";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/** Three.js r186 ACES filmic on a grey, written out independently. */
const aces = (value: number, exposure: number): number => {
  const v = (value * exposure) / 0.6;
  return (
    (v * (v + 0.0245786) - 0.000090537) /
    (v * (0.983729 * v + 0.432951) + 0.238081)
  );
};

/**
 * The preview is exposed and white balanced on a key-lit grey card.
 *
 * Scenarios:
 * 1. A card facing a directional light takes its colour times intensity;
 *    turned 60 degrees away it takes half, and facing away none. The
 *    hemisphere light gives its sky colour to a card facing up, its ground
 *    colour facing down and their mean on edge.
 * 2. The exposure solve lands a grey on the target through the ACES curve
 *    written out here, a target near white included, and refuses a
 *    non-positive radiance or a target of white or more.
 * 3. A warm rig balanced on its key turns the key-lit grey card neutral at
 *    its own luminance, keeps each light's direction and intensity, and
 *    exposes the card's 18 percent radiance to CIE L* 50; a rig that leaves a
 *    channel dark, or a light without direction, refuses.
 */
export const test_subject_human_preview_exposure = (): void => {
  const white = [1, 1, 1] as const;
  const up: HumanPreviewLight = {
    kind: "directional",
    direction: [0, 2, 0],
    color: [0.5, 0.25, 1],
    intensity: 2,
  };
  const turned = [0, Math.cos(Math.PI / 3), Math.sin(Math.PI / 3)] as const;
  TestValidator.predicate(
    "directional card",
    humanPreviewGreyCard([up], [0, 1, 0]).every((value, c) =>
      nclose(value, [1, 0.5, 2][c]!, 1e-12),
    ) &&
      humanPreviewGreyCard([up], turned).every((value, c) =>
        nclose(value, [0.5, 0.25, 1][c]!, 1e-12),
      ) &&
      humanPreviewGreyCard([up], [0, -1, 0]).every((value) => value === 0),
  );
  const sky: HumanPreviewLight = {
    kind: "hemisphere",
    sky: white,
    ground: [0, 0.5, 0],
    intensity: 0.5,
  };
  TestValidator.predicate(
    "hemisphere card",
    humanPreviewGreyCard([sky], [0, 1, 0]).every((value) =>
      nclose(value, 0.5, 1e-12),
    ) &&
      humanPreviewGreyCard([sky], [0, -1, 0]).every((value, c) =>
        nclose(value, [0, 0.25, 0][c]!, 1e-12),
      ) &&
      humanPreviewGreyCard([sky], [1, 0, 0]).every((value, c) =>
        nclose(value, [0.25, 0.375, 0.25][c]!, 1e-12),
      ),
  );

  const exposure = humanPreviewAcesExposure(0.05, 0.3);
  TestValidator.predicate(
    "exposure solve",
    nclose(aces(0.05, exposure), 0.3, 1e-9) &&
      throwsError(() => humanPreviewAcesExposure(0, 0.3), "positive") &&
      throwsError(() => humanPreviewAcesExposure(0.05, 1), "positive") &&
      nclose(aces(1e-3, humanPreviewAcesExposure(1e-3, 0.99)), 0.99, 1e-9),
  );

  const key = [-0.3, 0.35, 0.45] as const;
  const rig: HumanPreviewLight[] = [
    { ...sky, sky: [1, 0.85, 0.75], ground: [0.08, 0.13, 0.19] },
    {
      kind: "directional",
      direction: key,
      color: [1, 0.8, 0.7],
      intensity: 2.3,
    },
    {
      kind: "directional",
      direction: [0.35, 0.1, 0.3],
      color: [0.7, 0.82, 1],
      intensity: 0.85,
    },
  ];
  const before = humanPreviewGreyCard(rig, key);
  const Y = (rgb: readonly number[]) =>
    0.2126 * rgb[0]! + 0.7152 * rgb[1]! + 0.0722 * rgb[2]!;
  const balanced = balanceHumanPreviewRig(rig, key);
  const after = humanPreviewGreyCard(balanced.lights, key);
  TestValidator.predicate(
    "neutral card",
    after.every((value) => nclose(value, Y(before), 1e-12)) &&
      balanced.lights.every(
        (light, k) =>
          light.kind === rig[k]!.kind &&
          light.intensity === rig[k]!.intensity &&
          (light.kind === "hemisphere" ||
            light.direction === (rig[k] as typeof light).direction),
      ),
  );
  const L =
    116 *
      Math.cbrt(
        aces((HUMAN_PREVIEW_GREY_CARD * Y(after)) / Math.PI, balanced.exposure),
      ) -
    16;
  TestValidator.predicate(
    "middle grey",
    nclose(L, 50, 1e-6) && nclose(HUMAN_PREVIEW_MIDDLE_GREY, 0.18418, 1e-5),
  );
  TestValidator.predicate(
    "refusals",
    throwsError(
      () => balanceHumanPreviewRig([{ ...up, color: [1, 0, 1] }], [0, 1, 0]),
      "every channel",
    ) &&
      throwsError(
        () =>
          humanPreviewGreyCard([{ ...up, direction: [0, 0, 0] }], [0, 1, 0]),
        "length",
      ),
  );
};
