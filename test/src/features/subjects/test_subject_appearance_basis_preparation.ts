import {
  type IAutoMovieHumanFaceBasis,
  decodePortraitPng,
  encodePortraitPng,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { faceLikenessSrgbToLab } from "../../../scripts/face-review/faceLikenessColour";
import { prepareAppearanceBasis } from "../../../scripts/face-review/prepareAppearanceBasis";
import { humanFaceContactFixture } from "../internal/humanFaceContactFixture";
import { humanFaceIrisGlobeFixture } from "../internal/humanFaceIrisGlobeFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * The analytic contact basis with the analytic textured globes as its eyes
 * (each turned by one gaze channel)
 * and a 64-texel grey (150, 146, 145) enamel texture on the dentition: the
 * upper crown's eight triangles map into the left half of the texture and
 * the lower crown's four, the one the contact seals, into the right half.
 */
const fixture = (): {
  basis: IAutoMovieHumanFaceBasis;
  document: ReturnType<typeof humanFaceContactFixture>["document"];
} => {
  const { basis, document } = humanFaceContactFixture();
  const globes = humanFaceIrisGlobeFixture();
  basis.surfaces.push(globes.surfaces[0]!);
  basis.materials.push(globes.materials.find((one) => one.id === "eye")!);
  // The builder turns each eye by at least one gaze channel.
  basis.articulation!.eyes = globes.articulation!.eyes.map((eye) => ({
    ...eye,
    gaze: [
      {
        channel: "look" + eye.id,
        axis: [1, 0, 0],
        degrees: 10,
        translation: [0, 0, 0],
      },
    ],
  }));
  for (const eye of ["leftEye", "rightEye"])
    basis.channels.push({
      id: "look" + eye,
      kind: "expression",
      minimum: 0,
      maximum: 1,
      positive: "look" + eye + "Target",
      negative: null,
    });
  basis.landmarks = {
    ids: [...basis.landmarks!.ids, "left-eye", "right-eye"],
    positions: [
      ...basis.landmarks!.positions,
      0.032,
      0.03,
      0.1,
      -0.032,
      0.03,
      0.1,
    ],
    targets: basis.landmarks!.targets,
  };
  const size = 64;
  const rgba = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; ++i) rgba.set([150, 146, 145, 255], 4 * i);
  basis.materials.push({
    ...basis.materials.find((one) => one.id === "skin")!,
    id: "enamel",
    name: "enamel",
    baseColor: { r: 1, g: 1, b: 1, a: 1, hex: null },
    baseColorTexture: encodePortraitPng({ width: size, height: size, rgba }),
  });
  const teeth = basis.surfaces.find((one) => one.id === "teeth")!;
  const region = teeth.regions[0]!;
  region.material = "enamel";
  region.uvs = [];
  for (let t = 0; t < region.indices.length / 3; ++t) {
    const lower = t >= 8;
    const u0 = lower ? 0.55 : 0.05;
    region.uvs.push(u0, 0.1, u0 + 0.4, 0.1, u0, 0.9);
  }
  return { basis, document };
};

/**
 * Ocular surface and enamel appearance as a basis revision.
 * Scenarios:
 * 1. With roughness 0.1 and an enamel target L* 73, a* 1, b* 13: the eye
 *    material takes the roughness and keeps its texture byte for byte; the
 *    sealed crown's texels move to the target median within a unit of
 *    rounding while the unsealed upper crown's texels keep their grey; the
 *    receipt names the eye material and its former roughness, one crown and
 *    the texels it touched; documents and controls name the new revision.
 * 2. A roughness outside [0, 1], a non-finite target, the same revision, a basis without contact, one
 *    without textured eyes, a dentition without a textured sealed crown,
 *    and documents or controls naming another basis refuse.
 */
export const test_subject_appearance_basis_preparation = (): void => {
  const { basis, document } = fixture();
  const controls = { basis: basis.id, groups: [] };
  const base = {
    basis,
    documents: [document],
    controls,
    revision: "analytic-appearance/2",
    ocular: { roughness: 0.1 },
    enamel: { lab: [73, 1, 13] as [number, number, number] },
  };
  const prepared = prepareAppearanceBasis(base);
  const material = (id: string) =>
    prepared.basis.materials.find((one) => one.id === id)!;
  TestValidator.equals("roughness", material("eye").roughness, 0.1);
  TestValidator.equals(
    "eye texture kept",
    material("eye").baseColorTexture,
    basis.materials.find((one) => one.id === "eye")!.baseColorTexture,
  );
  const texel = (
    image: ReturnType<typeof decodePortraitPng>,
    u: number,
    v: number,
  ) => {
    const at =
      4 *
      (Math.floor(v * image.height) * image.width +
        Math.floor(u * image.width));
    return Array.from(image.rgba.slice(at, at + 3));
  };
  const enamel = decodePortraitPng(
    material("enamel").baseColorTexture as string,
  );
  const lab = faceLikenessSrgbToLab(
    ...(texel(enamel, 0.6, 0.3) as [number, number, number]),
  );
  TestValidator.predicate(
    "sealed crown at the target",
    nclose(lab[0], 73, 0.5) && nclose(lab[1], 1, 1) && nclose(lab[2], 13, 1),
  );
  TestValidator.equals(
    "unsealed crown kept",
    texel(enamel, 0.1, 0.3),
    [150, 146, 145],
  );
  TestValidator.predicate(
    "receipt",
    prepared.receipt.ocular.materials.join() === "eye" &&
      prepared.receipt.ocular.roughness.before.join() ===
        String(basis.materials.find((one) => one.id === "eye")!.roughness) &&
      prepared.receipt.enamel.crowns === 1 &&
      prepared.receipt.enamel.texels > 0,
  );
  TestValidator.equals(
    "restamped",
    [prepared.basis.id, prepared.documents[0]!.basis, prepared.controls.basis],
    ["analytic-appearance/2", "analytic-appearance/2", "analytic-appearance/2"],
  );

  const refuse = (change: Partial<typeof base>, message: string): boolean =>
    throwsError(() => prepareAppearanceBasis({ ...base, ...change }), message);
  TestValidator.predicate(
    "parameters",
    refuse({ ocular: { roughness: 1.5 } }, "roughness in") &&
      refuse({ ocular: { roughness: -0.1 } }, "roughness in") &&
      refuse({ enamel: { lab: [NaN, 0, 0] } }, "finite CIELAB"),
  );
  TestValidator.predicate(
    "same revision",
    refuse({ revision: basis.id }, "distinct revision"),
  );
  TestValidator.predicate(
    "no contact",
    refuse({ basis: { ...basis, contact: undefined } }, "contact basis"),
  );
  TestValidator.predicate(
    "no eyes",
    refuse(
      {
        basis: humanFaceContactFixture().basis,
        controls: { basis: "analytic-contact/1", groups: [] },
      },
      "textured articulated eyes",
    ),
  );
  const bare = structuredClone(basis);
  bare.surfaces.find((one) => one.id === "teeth")!.regions[0]!.uvs = null;
  TestValidator.predicate(
    "no enamel texture",
    refuse({ basis: bare }, "textured sealed crowns"),
  );
  TestValidator.predicate(
    "other basis",
    refuse(
      { documents: [{ ...document, basis: "other" }] },
      "names another basis",
    ) && refuse({ controls: { basis: "other", groups: [] } }, "control map"),
  );
};
