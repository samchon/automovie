import { IAutoMovieShotContract } from "../production/IAutoMovieShotContract";

/**
 * Contract fields embedded in a shot registration rather than its source
 * pointer.
 *
 * `id` and `source` are removed because the registration owns identity and the
 * compiler owns the pointer: `compileDefinedShot` restores them as the
 * registration id and a synthetic `<defineShot:id>` module before measuring.
 *
 * @evidence contracts/common.md#principled-implementation Derived with `Omit` from `IAutoMovieShotContract`, so a registration and a design contract cannot drift field by field; only the two keys the registration and the compiler own are removed.
 * @evidence contracts/common.md#clear-and-simple-design A type alias rather than a new interface; production's `contractOfRegistration` produces it by destructuring the two keys away, and `compileDefinedShot` adds them back before `realizeShotContract`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The restored `source` is `{ module: "<defineShot:id>", export: id }`, a synthetic pointer for direct compilation rather than a real module path; no other contract field is rewritten.
 * @evidence contracts/common.md#meaningful-documentation Names the two removed keys, which side restores them, and what the restored source pointer contains.
 * @author Samchon
 */
export type IAutoMovieDefinedShotContract = Omit<
  IAutoMovieShotContract,
  "id" | "source"
>;
