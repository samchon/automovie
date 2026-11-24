import { buildHumanUpperArmStudy } from "./buildHumanUpperArmStudy";

/** Named, independently admitted subjects offered by both Human capture hosts. */
export const HUMAN_CAPTURE_SUBJECTS: Readonly<
  Record<
    string,
    {
      readonly create: (
        subject: string,
        pose: string,
      ) => ReturnType<typeof buildHumanUpperArmStudy>;
      readonly poses: readonly [string, ...string[]];
    }
  >
> = {
  "ansur-upper-arm-envelope": {
    create: buildHumanUpperArmStudy,
    poses: ["study"],
  },
};
