import { validateModel } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";
import typia from "typia";

import { resolveHumanBodyAnatomy } from "../anatomy/resolveHumanBodyAnatomy";
import { admitHumanBodyBasisDocument } from "../document/admitHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisBuilderOptions } from "../structures/IAutoMovieHumanBodyBasisBuilderOptions";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBuild } from "../structures/IAutoMovieHumanBodyBuild";
import { createHumanBodyAppearance } from "./appearance/createHumanBodyAppearance";
import { assertHumanBodyBasis } from "./assertHumanBodyBasis";
import { createHumanBodySurfaceParts } from "./createHumanBodySurfaceParts";
import { createHumanBodyUnderwear } from "./createHumanBodyUnderwear";
import { evaluateHumanBodyShape } from "./evaluateHumanBodyShape";
import { humanBodyBasisWeights } from "./humanBodyBasisWeights";
import { humanBodyShoulderReaches } from "./humanBodyShoulderReaches";
import { resolveHumanBodyBuildPose } from "./resolveHumanBodyBuildPose";
import { resolveHumanBodyShapeShoulderRest } from "./resolveHumanBodyShapeShoulderRest";
import { resolveHumanBodyToeRays } from "./resolveHumanBodyToeRays";
import type { IAutoMovieHumanBodyBoneTransform } from "../structures/rig/IAutoMovieHumanBodyBoneTransform";
import type { IHumanBodyAnatomySolve } from "./IHumanBodyAnatomySolve";

/**
 * Compile a caller-owned connected body basis into a deterministic builder.
 *
 * The playground's body editor consumes this builder in a worker. Offline
 * modelling tools supply licensed geometry; replay needs this basis and one
 * admitted document, never a source image. The builder owns revision and
 * document admission, the order of the domain stages and final model
 * validation. A document carrying `anatomy` first has its bound measurements
 * solved into channel weights (`resolveHumanBodyAnatomy`), remembered for
 * the last authored weights and measurements, so the shape it evaluates
 * meets them. It evaluates channels and correctives first, checks authored
 * shoulder reach, and evaluates the shaped landmarks. The shaped landmarks
 * feed `resolveHumanBodyBuildPose`; the shared rest and lean evaluations feed
 * `createHumanBodyAppearance` and `createHumanBodySurfaceParts`; posed toe
 * ray phalanges (`resolveHumanBodyToeRays`) join those transforms for skinning. Underwear is
 * cut from the resulting unsplit posed skin after every material region.
 * The pose resolver owns clinical angles and pelvic rhythm, the appearance
 * stage owns material caches, and the surface stage owns skinning and sag.
 * Keeping their results in this order makes colour, relief, gravity and cloth
 * refer to the same body revision and document state.
 *
 * A new model owns its arrays and materials; neither basis nor document is
 * mutated. The returned model is static (no skeleton, no skin binding) so the
 * existing Float32 exporter admits it unchanged. The rest skeleton and
 * per-bone transforms travel beside it for rig inspection. The builder still
 * does not establish collision-free or physiological movement.
 * Recompiling for a different basis revision creates new appearance and sag
 * caches; no cached result is shared across independent basis builders.
 * The optional physicalSource constructor mode registers actual native
 * indexed incidence or declared canonical source samples before UV gathering.
 * Omission preserves the existing model and metadata absence. Registration
 * changes no coordinates and supplies no clinical tissue certification.
 */
export function createHumanBodyBasisBuilder(
  input: IAutoMovieHumanBodyBasis,
  options?: IAutoMovieHumanBodyBasisBuilderOptions,
): (document: IAutoMovieHumanBodyBasisDocument) => IAutoMovieHumanBodyBuild {
  const basis = structuredClone(
    typia.assertEquals<IAutoMovieHumanBodyBasis>(input),
  );
  assertHumanBodyBasis(basis);
  const physicalSource = options === undefined ? undefined : typia.assertEquals<IAutoMovieHumanBodyBasisBuilderOptions>(options).physicalSource;
  const appearance = createHumanBodyAppearance(basis);
  // the underwear's per-vertex arm weights, on the first document wearing it
  let dress: ReturnType<typeof createHumanBodyUnderwear> | null = null;
  const surfaces = createHumanBodySurfaceParts(basis, physicalSource);
  // the last anatomy solve, keyed by the authored weights and measurements it
  // read, so pose, material and history edits do not repeat it
  let solved: IHumanBodyAnatomySolve | undefined;
  return (inputDocument) => {
    const admitted = admitHumanBodyBasisDocument(inputDocument);
    if (
      admitted.basis !== basis.id ||
      [admitted.id, admitted.name].some((id) => id.trim() === "")
    )
      throw new Error(
        "Body edits need nonempty identities and the exact compiled basis revision.",
      );
    let document = admitted;
    if (admitted.anatomy !== undefined) {
      const key = JSON.stringify([admitted.shape, admitted.anatomy]);
      if (solved?.key !== key)
        solved = { key, shape: resolveHumanBodyAnatomy(basis, admitted.shape, admitted.anatomy) };
      document = { ...admitted, shape: { ...solved.shape } };
    }
    // an omitted shoulder goal is the shaped body's own rest, which every
    // reader of the goal shares, so the arms are read before the pose weights
    const shoulderRestOf = (shape: Record<string, number>) =>
      resolveHumanBodyShapeShoulderRest(basis, shape);
    const state = humanBodyBasisWeights(
      basis,
      document,
      shoulderRestOf(document.shape),
    );
    for (const shoulder of document.shoulders ?? []) {
      const contract = basis.joints.find(
        (joint) => joint.bone === shoulder.bone,
      )?.shoulder;
      if (
        contract === undefined ||
        !humanBodyShoulderReaches(contract, shoulder)
      )
        throw new Error(
          "Body shoulder goal exceeds its thorax-tt clinical range: " +
            shoulder.bone,
        );
    }
    const shaped = evaluateHumanBodyShape(basis, state);
    // whether the document leaves the rest pose the basis was authored in,
    // and its shape at that rest pose
    const posed =
      (document.pose ?? []).length > 0 || (document.shoulders ?? []).length > 0;
    const atRest = (shape: Record<string, number>) =>
      evaluateHumanBodyShape(
        basis,
        humanBodyBasisWeights(
          basis,
          {
            ...document,
            shape,
            pose: undefined,
            shoulders: undefined,
          },
          shoulderRestOf(shape),
        ),
      );
    // each is evaluated once, on first use: the document at rest (the
    // shaped body itself when it is not posed) and each surface's lean self
    let restOnce: ReturnType<typeof atRest> | undefined;
    const restAll = () =>
      posed ? (restOnce ??= atRest(document.shape)) : shaped;
    const leans = new Map<number, number[]>();
    const leanOf = (index: number): number[] => {
      let lean = leans.get(index);
      if (lean === undefined) {
        lean = atRest({
          ...document.shape,
          ...basis.surfaces[index].sag!.lean,
        }).surfaces[index];
        leans.set(index, lean);
      }
      return lean;
    };
    const { skeleton, transforms } = resolveHumanBodyBuildPose({
      basis,
      document,
      poseRows: state.pose,
      landmarks: shaped.landmarks,
    });
    const { materials, coloured } = appearance({
      document,
      pose: state.pose,
      restAll,
      leanOf,
    });
    // toe ray phalanges join the humanoid transforms only when one is posed
    const rays = resolveHumanBodyToeRays({ basis, toes: document.toes, landmarks: shaped.landmarks, transforms });
    const { parts, posedSurfaces } = surfaces({
      document,
      shaped,
      posed: posed || rays.size > 0,
      transforms: rays.size === 0 ? transforms : new Map<string, IAutoMovieHumanBodyBoneTransform>([...transforms, ...rays]),
      restAll,
      leanOf,
      coloured,
    });
    // the underwear, cut from the posed skin after every skin region
    if (document.underwear !== undefined) {
      const dressed = (dress ??= createHumanBodyUnderwear(basis))({
        underwear: document.underwear,
        rest: restAll(),
        posed: posedSurfaces,
      });
      materials.push(dressed.material);
      parts.push(...dressed.parts);
    }
    const model: IAutoMovieModel = {
      id: document.id,
      name: document.name,
      origin: "imported",
      parts,
      materials,
      skeleton: null,
      body: null,
      asset: null,
    };
    const validation = validateModel({ model });
    if (!validation.success)
      throw new Error(
        "The evaluated body basis is not a valid resident model: " +
          JSON.stringify(validation),
      );
    return {
      model,
      posedSurfaces,
      skeleton,
      bones: basis.joints
        .map((joint) => transforms.get(joint.bone)!)
        .map((transform, index) => ({
          bone: basis.joints[index].bone,
          rest: transform.rest,
          posed: transform.posed,
        })),
      landmarks: shaped.landmarks,
    };
  };
}
