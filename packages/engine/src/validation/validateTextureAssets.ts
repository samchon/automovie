import {
  AutoMovieTextureBinding,
  IAutoMovieAssetProvenance,
  IAutoMovieAssetUse,
  IAutoMovieImage,
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieTextureReference,
  IAutoMovieValidation,
} from "@automovie/interface";

import { compareCodeUnits } from "../text/compareCodeUnits";
import { AutoMovieTextureMediaType } from "./AutoMovieTextureMediaType";
import type { IAutoMovieSceneEnvironmentUse } from "./IAutoMovieSceneEnvironmentUse";
import { IAutoMovieTextureClosureInput } from "./IAutoMovieTextureClosureInput";
import { IAutoMovieTextureImageFacts } from "./IAutoMovieTextureImageFacts";
import { ViolationCollector } from "./ViolationCollector";
import { AUTO_MOVIE_MAX_TEXTURE_EDGE } from "./constants/AUTO_MOVIE_MAX_TEXTURE_EDGE";
import { materialTextureSlots } from "./materialTextureSlots";

/** Media types a material's PBR slot may bind. */
const MATERIAL_MEDIA: ReadonlySet<AutoMovieTextureMediaType> = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

/** Media types a scene environment may bind. */
const ENVIRONMENT_MEDIA: ReadonlySet<AutoMovieTextureMediaType> = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/vnd.radiance",
]);

/**
 * Cross-check every sampled material/environment image with manifest registration, production consumer authorization, media/edge facts and consistent color intent. A binding that names an image its model carries skips the ledger, which holds project files only, and joins the colour-intent check under that model.
 *
 * @evidence contracts/common.md#principled-implementation Cross-check every sampled material/environment project image with manifest registration, production consumer authorization, media/edge facts and consistent color intent; model-carried images resolve first, skip the ledger and keep a model-scoped intent check.
 * @evidence contracts/common.md#clear-and-simple-design materialTextureSlots owns consumer slots and facts is the host-provided header-fact seam; byte digest ownership stays with the manifest gate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Facts do not prove full decoding, and this validator does not reread or redigest bytes.
 * @evidence contracts/common.md#meaningful-documentation Material versus environment media, positive pixel edges/portable limit, carried-image precedence and stale-use errors are stated.
 * @evidence contracts/performance.md#efficient-algorithms Assets/uses/slots drive maps and scans; repeated asset uses checks cost O(TU) worst-case and string keys/text also contribute.
 * @evidence contracts/performance.md#reuse-equivalent-work Asset records and intent/declared maps are shared within one call; the facts callback may own per-asset reuse outside it.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only report rows escape; assets/models are borrowed and no file, pixel buffer or texture handle is acquired.
 */
export const validateTextureAssets: (
  props: IAutoMovieTextureClosureInput,
) => IAutoMovieValidation = (
  props: IAutoMovieTextureClosureInput,
): IAutoMovieValidation => {
  const out: ViolationCollector = new ViolationCollector();
  const records: Map<string, IAutoMovieAssetProvenance> = new Map(
    props.assets.map(
      (
        asset: IAutoMovieAssetProvenance,
      ): [string, IAutoMovieAssetProvenance] => [asset.path, asset],
    ),
  );

  // What the compiled production actually samples, per consumer.
  const declared: Map<string, Set<string>> = new Map<string, Set<string>>();
  const claim: (kind: string, id: string, asset: string) => void = (
    kind: string,
    id: string,
    asset: string,
  ): void => {
    const key: string = `${kind}\0${id}`;
    const existing: Set<string> | undefined = declared.get(key);
    if (existing === undefined) declared.set(key, new Set([asset]));
    else existing.add(asset);
  };

  const intents: Map<string, Map<string, string>> = new Map<
    string,
    Map<string, string>
  >();
  // Keyed by the subject the diagnostic names: a project asset, or one model's
  // carried image, whose id is scoped to that model.
  const intend: (subject: string, path: string, intent: string) => void = (
    subject: string,
    path: string,
    intent: string,
  ): void => {
    const seen: Map<string, string> =
      intents.get(subject) ?? new Map<string, string>();
    seen.set(path, intent);
    intents.set(subject, seen);
  };
  props.models.forEach((model: IAutoMovieModel, modelIndex: number): void => {
    const carried: Set<string> = new Set(
      (model.images ?? []).map((image: IAutoMovieImage): string => image.id),
    );
    model.materials.forEach(
      (material: IAutoMovieMaterial, materialIndex: number): void => {
        const path: string = `$input.models[${modelIndex}].materials[${materialIndex}]`;
        for (const slot of materialTextureSlots(material)) {
          const binding: AutoMovieTextureBinding = slot.binding;
          const asset: string = bindingAsset(binding);
          const intent: string =
            typeof binding === "string" ? slot.colorSpace : binding.colorSpace;
          // A carried image is resolved before project assets and has no
          // ledger row; its bytes still take one decoding.
          if (carried.has(asset)) {
            intend(
              `image "${asset}" of model "${model.id}"`,
              `${path}${slot.path}`,
              intent,
            );
            continue;
          }
          claim("material-texture", model.id, asset);
          intend(`texture asset "${asset}"`, `${path}${slot.path}`, intent);
          checkAsset({
            asset,
            path: `${path}${slot.path}`,
            consumer: { kind: "material-texture", id: model.id },
            media: MATERIAL_MEDIA,
            out,
            input: props,
            records,
          });
        }
      },
    );
  });

  props.scenes.forEach(
    (scene: IAutoMovieSceneEnvironmentUse, sceneIndex: number): void => {
      const image: string | null = scene.environment?.image ?? null;
      if (image === null) return;
      const path: string = `$input.scenes[${sceneIndex}].environment.image`;
      claim("scene-environment", scene.shot, image);
      checkAsset({
        asset: image,
        path,
        consumer: { kind: "scene-environment", id: scene.shot },
        media: ENVIRONMENT_MEDIA,
        out,
        input: props,
        records,
      });
      // An environment image declares no intent of its own, so the media its own
      // bytes prove decides one, and that intent joins the same contradiction
      // rule the material slots answer to. Bytes that read as no image at all are
      // already reported above; inventing a decoding for them would only add a
      // second complaint about the same file.
      const facts: IAutoMovieTextureImageFacts | undefined = props.facts(image);
      if (facts !== undefined)
        intend(`texture asset "${image}"`, path, environmentIntent(facts));
    },
  );

  // The same bytes cannot be both a colour and a measurement.
  for (const [subject, slots] of intents) {
    const distinct: Set<string> = new Set(slots.values());
    if (distinct.size < 2) continue;
    for (const [path, intent] of slots)
      out.push(
        "type",
        path,
        `${subject} is bound with contradictory color-space intent (${[...distinct].sort(compareCodeUnits).join(" and ")}); register one image per decoding`,
        intent,
      );
  }

  // A ledger entry for a consumer that no longer samples it.
  props.assets.forEach(
    (asset: IAutoMovieAssetProvenance, assetIndex: number): void => {
      asset.uses.forEach((use: IAutoMovieAssetUse, useIndex: number): void => {
        if (use.production !== props.production) return;
        if (
          use.consumer.kind !== "material-texture" &&
          use.consumer.kind !== "scene-environment"
        )
          return;
        const key: string = `${use.consumer.kind}\0${use.consumer.id}`;
        if (declared.get(key)?.has(asset.path) === true) return;
        out.push(
          "type",
          `$input.assets[${assetIndex}].uses[${useIndex}]`,
          `asset "${asset.path}" is authorized as a ${use.consumer.kind} of "${use.consumer.id}", which no longer binds it; drop the stale use`,
          use.consumer,
        );
      });
    },
  );

  return out.toValidation();
};

/**
 * Return the legacy string id or structured binding's asset field.
 *
 * One identity read serves ledger lookup and declared-use tracking.
 *
 * Structured shape admission is a caller/model gate premise.
 *
 * The returned string preserves authored identity without resolving bytes.
 *
 * One branch/property read costs constant work apart from borrowed text.
 *
 * Every texture slot uses the same identity extraction.
 *
 * No binding or byte buffer is retained after returning the id.
 */
const bindingAsset: (binding: string | IAutoMovieTextureReference) => string = (
  binding: string | IAutoMovieTextureReference,
): string => (typeof binding === "string" ? binding : binding.asset);

/**
 * Map Radiance header media to linear and supported8-bit image media to srgb environment intent.
 *
 * The existing viewer decoding policy determines the environment's single color interpretation.
 *
 * Header facts are metadata; this does not inspect transfer-function chunks or decoded pixels.
 *
 * The returned closed intent feeds cross-slot contradiction checks.
 *
 * One media comparison takes constant work.
 *
 * Environment and material consumers share the same request-local intent ledger.
 *
 * Only a string literal escapes and no image/decoder is retained.
 */
const environmentIntent: (
  facts: IAutoMovieTextureImageFacts,
) => "srgb" | "linear" = (
  facts: IAutoMovieTextureImageFacts,
): "srgb" | "linear" =>
  facts.mediaType === "image/vnd.radiance" ? "linear" : "srgb";

/**
 * Check registration, exact production/consumer authorization, allowed header media and positive bounded pixel edges.
 *
 * The ledger owns identity and this helper owns the cited slot's closure policy.
 *
 * It does not redigest bytes or certify complete image decoding.
 *
 * Unregistered/unreadable/disallowed assets report at the citing slot with field-specific dimensions.
 *
 * One map lookup plus record-use scan and facts callback dominate; fixed media/dimension checks follow.
 *
 * The coordinator shares its records map and the host may cache facts by current byte identity.
 *
 * Only caller-owned diagnostics remain; asset/facts references are borrowed without an image load.
 */
const checkAsset: (props: {
  asset: string;
  path: string;
  consumer: { kind: "material-texture" | "scene-environment"; id: string };
  media: ReadonlySet<AutoMovieTextureMediaType>;
  out: ViolationCollector;
  input: IAutoMovieTextureClosureInput;
  records: ReadonlyMap<string, IAutoMovieAssetProvenance>;
}) => void = (props: {
  asset: string;
  path: string;
  consumer: { kind: "material-texture" | "scene-environment"; id: string };
  media: ReadonlySet<AutoMovieTextureMediaType>;
  out: ViolationCollector;
  input: IAutoMovieTextureClosureInput;
  records: ReadonlyMap<string, IAutoMovieAssetProvenance>;
}): void => {
  const record: IAutoMovieAssetProvenance | undefined = props.records.get(
    props.asset,
  );
  if (record === undefined) {
    props.out.push(
      "type",
      props.path,
      `texture asset "${props.asset}" is not registered in the project asset manifest; register its path, current digest and consumer binding before compiling`,
      props.asset,
    );
    return;
  }
  if (
    !record.uses.some(
      (use: IAutoMovieAssetUse): boolean =>
        use.production === props.input.production &&
        use.consumer.kind === props.consumer.kind &&
        use.consumer.id === props.consumer.id,
    )
  )
    props.out.push(
      "type",
      props.path,
      `asset "${props.asset}" carries no ${props.consumer.kind} use for "${props.consumer.id}" in production "${props.input.production}"; add the exact typed ledger entry`,
      props.consumer.id,
    );
  const facts: IAutoMovieTextureImageFacts | undefined = props.input.facts(
    props.asset,
  );
  if (facts === undefined) {
    props.out.push(
      "type",
      props.path,
      `asset "${props.asset}" is bound as an image but its bytes are not a readable PNG, JPEG, WebP or Radiance image`,
      props.asset,
    );
    return;
  }
  if (!props.media.has(facts.mediaType)) {
    props.out.push(
      "type",
      props.path,
      `asset "${props.asset}" is ${facts.mediaType}, which this slot cannot sample; expected one of ${[...props.media].sort(compareCodeUnits).join(", ")}`,
      facts.mediaType,
    );
    return;
  }
  for (const axis of ["width", "height"] as const) {
    const value: number = facts[axis];
    if (!Number.isSafeInteger(value) || value <= 0)
      props.out.push(
        "range",
        `${props.path}.${axis}`,
        `asset "${props.asset}" reports a ${axis} of ${value}; an image must measure a positive whole number of pixels`,
        value,
      );
    else if (value > AUTO_MOVIE_MAX_TEXTURE_EDGE)
      props.out.push(
        "range",
        `${props.path}.${axis}`,
        `asset "${props.asset}" is ${value} pixels wide on its ${axis}, past the ${AUTO_MOVIE_MAX_TEXTURE_EDGE} portable limit; downscale it in a recorded processing step`,
        value,
      );
  }
};
