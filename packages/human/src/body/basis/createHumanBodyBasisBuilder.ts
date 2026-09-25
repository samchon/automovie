import {
  Quaternion,
  Vector3,
  resolvePose,
  validateModel,
  validatePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieModel,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import typia from "typia";

import { createHumanFaceBasisRegion } from "../../face/basis/createHumanFaceBasisRegion";
import { humanFaceBasisRegion } from "../../face/basis/humanFaceBasisRegion";
import { portraitNormals } from "../../face/mesh/portraitNormals";
import { HUMAN_BODY_SKIN_DETAIL } from "../constants/HUMAN_BODY_SKIN_DETAIL";
import { HUMAN_BODY_SKIN_SITES } from "../constants/HUMAN_BODY_SKIN_SITES";
import { admitHumanBodyBasisDocument } from "../document/admitHumanBodyBasisDocument";
import { humanBodySimpleShapeMath } from "../simple/humanBodySimpleShapeMath";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBuild } from "../structures/IAutoMovieHumanBodyBuild";
import { assertHumanBodyBasis } from "./assertHumanBodyBasis";
import { createHumanBodySkinColour } from "./createHumanBodySkinColour";
import { createHumanBodySkinDetailTexture } from "./createHumanBodySkinDetailTexture";
import { evaluateHumanBodyShape } from "./evaluateHumanBodyShape";
import { humanBodyBasisWeights } from "./humanBodyBasisWeights";
import { humanBodyShoulderReaches } from "./humanBodyShoulderReaches";
import { humanBodySkinMetresPerUv } from "./humanBodySkinMetresPerUv";
import { resolveHumanBodyPelvifemoralRhythm } from "./resolveHumanBodyPelvifemoralRhythm";
import { resolveHumanBodyShoulders } from "./resolveHumanBodyShoulders";
import { resolveHumanBodySkeleton } from "./resolveHumanBodySkeleton";
import { skinHumanBodySurface } from "./skinHumanBodySurface";

/**
 * Compile a caller-owned connected body basis into a deterministic builder.
 *
 * The playground's body editor consumes this builder in a worker and exports
 * the resident model through the static exporter. Offline modelling tools
 * supply the licensed geometry; none run here and no photograph is needed for
 * replay. The order per document is fixed and is what the specification
 * states: channels, correctives (`evaluateHumanBodyShape`), then
 * landmarks to a rest skeleton (`resolveHumanBodySkeleton`), then the pose.
 * The document's non-humeral clinical angles gain the declared couplings
 * (`resolveHumanBodyCouplings`, called inside `humanBodyBasisWeights` so the
 * corrective ramps read the same coupled angles) and are validated by the
 * engine, together with the pelvic-relative reading a declared pelvifemoral
 * rhythm gives them (`resolveHumanBodyPelvifemoralRhythm`). The separately
 * authored TT humerothoracic goals are checked against the basis's clinical
 * reach (`humanBodyShoulderReaches`: the plane's joint-sinus maximum and the
 * axial range) and resolved from the thorax after the engine's forward
 * kinematics and the girdle's movement; the rhythm then turns the pelvis
 * about the hip centres, then dual
 * quaternion skinning (`skinHumanBodySurface`), then common normals and material
 * regions. The couplings are added before validation so a girdle angle the
 * document wrote plus the rhythm an elevated arm adds is refused past the
 * girdle's range rather than clamped, and the document keeps only what the
 * author wrote. The face basis builder is the template; what differs is
 * everything after the shape.
 *
 * A new model owns its arrays and materials; neither basis nor document is
 * mutated. The returned model is static (no skeleton, no skin binding) so the
 * existing Float32 exporter admits it unchanged, and the rest skeleton and
 * per-bone transforms travel beside it for the tools that verify the rig.
 * Skinning does not establish collision-free or physiological movement.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-connected-basis Evaluates named shape edits on one reusable body prior without source images, refusing a document that names another basis revision.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-joints Bends non-humeral joints by clinical angles and each humerus by its total thorax-relative TT goal, range checks both and skins the resulting transforms.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis Runs the named channel, corrective, landmark, skeleton, pose and skin order once per document over an admitted basis.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-joints Validates the coupled sparse pose, resolves TT shoulder goals after the girdle and recomputes normals after skinning.
 * @evidenceExclude requirements/actors/body-authoring/README.md#body-requirements This domain index also covers the editing screen, export and census review; the builder owns evaluation, not the complete authoring workflow.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/README.md#body-specifications This index joins evaluation, measurement, document and later editor boundaries; the builder does not own the browser adapter or the review process.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor The builder owns no transaction history or worker; the face editor's state owner and the playground worker do.
 */
export function createHumanBodyBasisBuilder(
  input: IAutoMovieHumanBodyBasis,
): (document: IAutoMovieHumanBodyBasisDocument) => IAutoMovieHumanBodyBuild {
  const basis = structuredClone(
    typia.assertEquals<IAutoMovieHumanBodyBasis>(input),
  );
  assertHumanBodyBasis(basis);
  // read off the rig on the first document that asks for it
  let siteColour: ReturnType<typeof createHumanBodySkinColour> | null = null;
  // the micro-relief tile and its scale over the skin's UVs, on first use
  let relief: { texture: string; turns: number } | null = null;
  return (inputDocument) => {
    const document = admitHumanBodyBasisDocument(inputDocument);
    if (
      document.basis !== basis.id ||
      [document.id, document.name].some((id) => id.trim() === "")
    )
      throw new Error(
        "Body edits need nonempty identities and the exact compiled basis revision.",
      );
    const state = humanBodyBasisWeights(basis, document);
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
    const { skeleton, rest, frames } = resolveHumanBodySkeleton(
      basis,
      shaped.landmarks,
    );
    // The coupled document pose is what forward kinematics turns, and its
    // angles are judged against the clinical ranges. With a pelvifemoral
    // rhythm the legs' document flexion is trunk-relative, so the rig's
    // pelvic-relative hips and lumbar joint (the rhythm's additions applied)
    // are judged too: a request must hold under both readings.
    const pose: IAutoMoviePose = {
      skeleton: skeleton.id,
      root: null,
      joints: state.pose,
    };
    const rhythm = resolveHumanBodyPelvifemoralRhythm(basis, state.pose);
    const violations = [
      ...validatePose({ pose, skeleton }).items,
      ...(rhythm.contributions.length === 0
        ? []
        : validatePose({ pose: { ...pose, joints: rhythm.joints }, skeleton })
            .items),
    ];
    if (violations.length > 0)
      throw new Error(
        "Body pose violates the skeleton or its clinical ranges: " +
          JSON.stringify(violations),
      );
    const transforms = new Map<
      AutoMovieHumanoidBone,
      {
        rest: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion };
        posed: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion };
      }
    >();
    // The rhythm leaves the trunk and both thighs where the document put
    // them relative to the trunk and turns only the pelvis, posteriorly by
    // the tilt about the line through both hip centres, which leaves the hip
    // centres, the lifted thigh's authored direction and the other foot in
    // place while the pelvis-to-thigh and pelvis-to-lumbar angles change.
    const tilt = -(
      rhythm.contributions.find((one) => one.bone === "hips")?.degrees ?? 0
    );
    const resolvedBones = resolveHumanBodyShoulders(
      basis,
      document.shoulders ?? [],
      rest,
      resolvePose(pose, skeleton, undefined, frames),
    );
    if (tilt !== 0) {
      const at = (bone: AutoMovieHumanoidBone) =>
        resolvedBones.find((one) => one.bone === bone)!;
      const left = at("leftUpperLeg").worldPosition;
      const axis = Vector3.normalize(
        Vector3.subtract(left, at("rightUpperLeg").worldPosition),
      );
      // about +X (the subject's left) a positive angle carries the top of
      // the pelvis forward; a posterior tilt is the negative one
      const turn = Quaternion.fromAxisAngle(axis, -tilt);
      const pelvis = at("hips");
      pelvis.worldPosition = Vector3.add(
        left,
        Quaternion.rotateVector(
          turn,
          Vector3.subtract(pelvis.worldPosition, left),
        ),
      );
      pelvis.worldRotation = Quaternion.normalize(
        Quaternion.multiply(turn, pelvis.worldRotation),
      );
    }
    for (const resolved of resolvedBones)
      transforms.set(resolved.bone, {
        rest: rest.get(resolved.bone)!,
        posed: {
          position: resolved.worldPosition,
          rotation: resolved.worldRotation,
        },
      });
    const materials = structuredClone(basis.materials);
    const materialMap = new Map(
      materials.map((material) => [material.id, material]),
    );
    for (const [id, override] of Object.entries(document.materials ?? {})) {
      const material = materialMap.get(id);
      const values = [
        ...Object.values(override.color ?? {}),
        ...(override.roughness === undefined ? [] : [override.roughness]),
      ];
      if (
        material === undefined ||
        values.some(
          (value) => !Number.isFinite(value) || value < 0 || value > 1,
        )
      )
        throw new Error(
          "Body material overrides need existing IDs and finite [0,1] values.",
        );
      if (override.color !== undefined)
        material.baseColor = {
          ...material.baseColor,
          ...override.color,
          hex: null,
        };
      if (override.roughness !== undefined)
        material.roughness = override.roughness;
    }
    // the skin's colour by site, from the cheek the face wears: the material
    // takes the largest albedo and its regions the multipliers of it
    const skin = HUMAN_BODY_SKIN_SITES.material;
    const cheek = document.skinColour?.cheek;
    if (
      cheek !== undefined &&
      (!materialMap.has(skin) ||
        document.materials?.[skin]?.color !== undefined ||
        [cheek.r, cheek.g, cheek.b].some((value) => value <= 0 || value > 1))
    )
      throw new Error(
        "Body skin colour needs a skin material without a colour override and a cheek albedo in (0,1].",
      );
    const coloured =
      cheek === undefined
        ? null
        : (siteColour ??= createHumanBodySkinColour(basis))([
            cheek.r,
            cheek.g,
            cheek.b,
          ]);
    if (coloured !== null) {
      const [r, g, b] = coloured.base;
      materialMap.get(skin)!.baseColor = {
        ...materialMap.get(skin)!.baseColor,
        r,
        g,
        b,
        hex: null,
      };
    }
    // the skin's micro-relief as a tiled normal map, deepening with age
    const detail = document.skinDetail;
    if (detail !== undefined) {
      if (
        !materialMap.has(skin) ||
        !(detail.strength >= 0 && detail.strength <= 1) ||
        basis.surfaces.some((surface) =>
          surface.regions.some(
            (region) => region.material === skin && region.uvs === null,
          ),
        )
      )
        throw new Error(
          "Body skin detail needs a skin material on textured regions and a strength in [0,1].",
        );
      relief ??= {
        texture: createHumanBodySkinDetailTexture(HUMAN_BODY_SKIN_DETAIL),
        turns:
          humanBodySkinMetresPerUv(basis, skin) /
          (HUMAN_BODY_SKIN_DETAIL.tileMillimetres / 1000),
      };
      const material = materialMap.get(skin)!;
      material.normalTexture = {
        asset: relief.texture,
        texCoord: 0,
        coordinateSource: "source-uv",
        colorSpace: "linear",
        transform: {
          offset: { x: 0, y: 0 },
          scale: { x: relief.turns, y: relief.turns },
          rotationDeg: 0,
        },
        sampler: {
          wrapS: "repeat",
          wrapT: "repeat",
          minFilter: "linearMipmapLinear",
          magFilter: "linear",
        },
      };
      material.normalScale =
        detail.strength *
        humanBodySimpleShapeMath.curve(
          HUMAN_BODY_SKIN_DETAIL.age,
          document.shape.macroAge ?? 0,
        );
    }
    const parts = basis.surfaces.flatMap((surface, index) => {
      const positions = skinHumanBodySurface(
        shaped.surfaces[index],
        surface.skin,
        basis.joints,
        transforms,
      );
      const normals = portraitNormals(positions, surface.indices);
      return surface.regions.map((region) => ({
        id: region.id,
        name: region.id,
        material: region.material,
        geometry: {
          type: "mesh" as const,
          mesh:
            coloured === null || region.material !== skin
              ? humanFaceBasisRegion(positions, normals, region)
              : createHumanFaceBasisRegion(region)(
                  positions,
                  normals,
                  coloured.colors[index],
                ),
        },
        attachedBone: null,
        transform: null,
      }));
    });
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
