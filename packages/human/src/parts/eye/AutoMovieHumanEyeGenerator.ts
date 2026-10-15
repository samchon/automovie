import { IAutoMovieMaterial } from "@automovie/interface";

import { IAutoMovieHumanMeasurements } from "../../measure/IAutoMovieHumanMeasurements";
import { IAutoMovieHumanSkeleton } from "../../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanPartGenerator } from "../IAutoMovieHumanPartGenerator";
import { AUTOMOVIE_HUMAN_EYE } from "./AUTOMOVIE_HUMAN_EYE";
import { meshAutoMovieHumanEye } from "./meshAutoMovieHumanEye";
import { paintAutoMovieHumanEye } from "./paintAutoMovieHumanEye";
import { planAutoMovieHumanEye } from "./planAutoMovieHumanEye";

/**
 * Generates the eyeballs: per eye an opaque globe and a clear cornea, separate meshes riding the eye bone, so gaze turns them rigidly about the centre of rotation.
 *
 * The eye is not a skin part. The lids, the orbit and the skin around them belong to the head's face surface, which opens on the palpebral fissure and draws its lids on spheres about the same eye joint; the eye module reads only the skeleton's eye joints and the identity, so the two meet through the skeleton and neither imports the other. `planAutoMovieHumanEye` sizes and places each globe, `meshAutoMovieHumanEye` evaluates its surfaces, and `paintAutoMovieHumanEye` paints its images from the identity's iris colour.
 *
 * Materials read as a wet living eye:
 *
 * - The globe samples the colour image and the metallic-roughness image: a glossy sclera under the tear film, a matte stroma.
 * - The cornea transmits fully at the measured refractive index with a clear coat for the tear film, so the iris is seen refracted through it and the cornea's highlight rides its bulge as the eye turns. Its volume thickness is the adult anterior chamber depth, the aqueous the iris is seen through.
 *
 * Attachments, in order: `eye.left.globe`, `eye.left.cornea`, `eye.right.globe`, `eye.right.cornea`.
 *
 * @author Samchon
 */
export class AutoMovieHumanEyeGenerator {
  /**
   * @param resolution Resolution of the evaluated surfaces, an integer from 1 to 6 read like the skin's subdivision levels; two by default, as the skin's
   */
  public constructor(private readonly resolution: number = 2) {}

  /**
   * Generate both eyes.
   *
   * @param props Measurements and skeleton of the person
   * @returns The four attachments, in the order the class documents
   */
  public generate(props: {
    measurements: IAutoMovieHumanMeasurements;
    skeleton: IAutoMovieHumanSkeleton;
  }): IAutoMovieHumanPartGenerator.IAttachment[] {
    const iris = props.measurements.identity.pigmentation.iris;
    const images: paintAutoMovieHumanEye.IOutput = paintAutoMovieHumanEye(iris);
    const globe: IAutoMovieMaterial = {
      id: `eye.${iris}`,
      name: `eyeball, ${iris} iris`,
      baseColor: { r: 1, g: 1, b: 1, a: null, hex: null },
      metallic: 0,
      roughness: 1,
      emissive: null,
      opacity: 1,
      baseColorTexture: images.color.id,
      metallicRoughnessTexture: images.roughness.id,
    };
    return (["left", "right"] as const).flatMap(
      (side: "left" | "right"): IAutoMovieHumanPartGenerator.IAttachment[] => {
        const plan: planAutoMovieHumanEye.IPlan = planAutoMovieHumanEye({
          measurements: props.measurements,
          skeleton: props.skeleton,
          side,
        });
        const mesh: meshAutoMovieHumanEye.IOutput = meshAutoMovieHumanEye({
          plan,
          levels: this.resolution,
        });
        return [
          {
            name: `eye.${side}.globe`,
            bone: plan.bone,
            tissue: "eye",
            cage: null,
            mesh: mesh.globe,
            appearance: {
              material: globe,
              images: [images.color, images.roughness],
            },
          },
          {
            name: `eye.${side}.cornea`,
            bone: plan.bone,
            tissue: "cornea",
            cage: null,
            mesh: mesh.cornea,
            appearance: { material: CORNEA, images: [] },
          },
        ];
      },
    );
  }
}

/**
 * The cornea: a clear dielectric of the measured refractive index, transmitting fully, nearly mirror-smooth under the tear film with a clear coat for the film itself. Grade: conventional roughness, measured index.
 */
const CORNEA: IAutoMovieMaterial = {
  id: "eye.cornea",
  name: "cornea",
  baseColor: { r: 1, g: 1, b: 1, a: null, hex: null },
  metallic: 0,
  roughness: 0.02,
  emissive: null,
  opacity: 1,
  baseColorTexture: null,
  transmission: 1,
  ior: AUTOMOVIE_HUMAN_EYE.cornealIndex,
  thickness: AUTOMOVIE_HUMAN_EYE.anteriorChamber / 1000,
  clearcoat: 1,
};
