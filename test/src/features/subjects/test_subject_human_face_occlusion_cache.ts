import { createHumanFaceOcclusionCache } from "@automovie/human";
import type { IAutoMovieModel } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** A fixed pose reuses its visibility images; a new pose rebakes them. */
export const test_subject_human_face_occlusion_cache = (): void => {
  let bakes = 0;
  const cached = createHumanFaceOcclusionCache(
    () => new Map([["skin", `ao-${++bakes}`]]),
  );
  // The cache does not inspect model fields; the real bake owns admission.
  const model = { id: "face" } as IAutoMovieModel;
  const pose = {};
  const first = cached(pose, model);
  TestValidator.equals("first pose bakes", first.get("skin"), "ao-1");
  first.set("skin", "caller mutation");
  const appearance = cached(pose, { ...model, id: "different-document" });
  TestValidator.equals("appearance does not rebake", bakes, 1);
  TestValidator.equals("returned map is owned", appearance.get("skin"), "ao-1");
  TestValidator.predicate("maps are distinct", first !== appearance);
  const next = cached({}, model);
  TestValidator.equals("new pose rebakes", next.get("skin"), "ao-2");
};
