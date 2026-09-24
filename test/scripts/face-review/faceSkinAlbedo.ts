import type { IFacePopulationFacts } from "./facePopulationFacts";

/** One group's cheek albedo over its subjects, from `derive-skin-albedo-norms.py`. */
export interface IFaceSkinAlbedoGroup {
  subjects: number;
  mean: [number, number, number];
  sd: [number, number, number];
}

/** The measured groups of the skin albedo norms, overall and by sex. */
export interface IFaceSkinAlbedoNorms {
  groups: Record<
    string,
    {
      all: IFaceSkinAlbedoGroup;
      F?: IFaceSkinAlbedoGroup;
      M?: IFaceSkinAlbedoGroup;
    }
  >;
}

/** Recorded ancestry -> the archive groups that measure it. */
export const FACE_SKIN_ALBEDO_GROUPS = {
  african: ["AF"],
  asian: ["CN", "JP"],
  european: ["CA"],
} as const;

/**
 * A subject's skin albedo from its recorded facts and measured norms.
 *
 * The document's `materials.skin.color` is the skin's linear albedo, which a
 * photograph cannot give: exposure scales the whole image, so a cheek's pixel
 * value is the albedo times an unknown gain, and every ratio rule of the
 * iris, brow and hair fits multiplies this albedo. The norms are cheek
 * spectra of the International Skin Spectra Archive integrated into linear
 * sRGB under D65 (`derive-skin-albedo-norms.py`); the subject takes the
 * subject-weighted mean of the groups measuring its recorded ancestry
 * (`FACE_SKIN_ALBEDO_GROUPS`: East Asian is the archive's Chinese and
 * Japanese groups together, there being no Korean one), of its recorded sex
 * where both groups record it, and of every subject otherwise. An
 * individual's deviation from its group is not recoverable from an
 * uncalibrated photograph, so the group mean is the estimate; an unrecorded
 * ancestry gives none. Pure.
 */
export function faceSkinAlbedo(
  facts: Pick<IFacePopulationFacts, "ancestry" | "sex">,
  norms: IFaceSkinAlbedoNorms,
): { albedo: [number, number, number]; subjects: number } | null {
  if (facts.ancestry === null) return null;
  const key = facts.sex === "female" ? "F" : facts.sex === "male" ? "M" : "all";
  const groups = FACE_SKIN_ALBEDO_GROUPS[facts.ancestry].map((name) => {
    const group = norms.groups[name];
    if (group === undefined)
      throw new Error(`The skin albedo norms lack the group ${name}.`);
    return group[key] ?? group.all;
  });
  const subjects = groups.reduce((sum, group) => sum + group.subjects, 0);
  return {
    albedo: [0, 1, 2].map(
      (c) =>
        groups.reduce(
          (sum, group) => sum + group.subjects * group.mean[c]!,
          0,
        ) / subjects,
    ) as [number, number, number],
    subjects,
  };
}
