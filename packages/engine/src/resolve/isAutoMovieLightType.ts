import { IAutoMovieLight } from "@automovie/interface";
import { AUTO_MOVIE_LIGHT_TYPES } from "./AUTO_MOVIE_LIGHT_TYPES";

/**
 * Whether an untyped artifact names one of the supported light kinds.
 *
 * @evidence requirements/lighting/scope-and-identity.md#lighting-authored-input Refuses an unrecognized kind before treating raw input as an authored light.
 * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-light-authority-branches Validates that an input belongs to one declared light-authority branch.
 */
export const isAutoMovieLightType = (
  value: unknown,
): value is IAutoMovieLight["type"] =>
  typeof value === "string" &&
  AUTO_MOVIE_LIGHT_TYPES.has(value as IAutoMovieLight["type"]);

/**
 * Light channels: which light properties a shot may animate, how a track
 * addresses one, and how a sampled value is written onto a light.
 *
 * A light is NOT a scene node. `IAutoMovieScene` keeps `lights` beside `nodes`,
 * and `IAutoMovieNodeChannel` addresses only a node's TRS or morph weights, so
 * no node channel can reach a light's intensity, colour, range, or cone even in
 * principle. That is the same split glTF has: `KHR_lights_punctual` hangs a
 * light on a node so a node animation moves its PLACEMENT, while animating the
 * light itself needs `KHR_animation_pointer`. Hence the pointer form
 * (`/lights/<id>/intensity`), which is also exactly what a benchmark agent
 * reached for unprompted (#1348).
 *
 * That same split is why the light's PLACEMENT is in this table too. glTF gets
 * a moving light by hanging it on a node and animating the node; automovie
 * stages lights outside `nodes`, so there is no node to animate and a light
 * that could not carry `position`/`rotation` channels could not move or turn AT
 * ALL. Its direction would be fixed for the whole film, which is not a
 * limitation any particular subject feels: a shift change, a night watch, a
 * day's work, a procession are all productions whose LENGTH is part of what
 * they are about, and each of them needs the light to travel across it. Rather
 * than a second animation path for placement, placement is two more entries in
 * the one table, so a light's direction is keyed, sampled, gated and applied by
 * exactly the machinery its intensity already was.
 *
 * {@link LIGHT_CHANNEL_PROPERTIES} is the single table both halves read. The
 * artifact gate admits a pointer only when this table has an entry for it AND
 * that entry's `carries` accepts the staged light; the applier
 * ({@link resolveShotLighting}) writes through the same entry's `write`. The
 * admitted set and the applied set are therefore one set by construction, not
 * two lists documented as matching: a validated axis with no applier is #1339's
 * false green, and an applier that silently drops part of its input is #1349.
 *
 * @author Samchon
 */
