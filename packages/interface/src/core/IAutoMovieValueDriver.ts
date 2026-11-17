import type { IAutoMovieCopyDriver } from "./IAutoMovieCopyDriver";
import type { IAutoMovieDrivenDriver } from "./IAutoMovieDrivenDriver";
/**
 * A value-space dependency driver evaluated before world-space scene constraints.
 *
 * Copy drivers consume selected TRS channels from a source node and produce those channels on their owner. Driven drivers consume one named channel and produce one output channel. orderValueDrivers indexes every producer of each exact channel key, excludes only a driver's own self-input edge, preserves input-index DFS tie order and throws on a cycle. Its fresh output array borrows the original driver records without mutating them; no channel reference or numeric-value admission occurs during ordering, and recursive traversal can still exceed the host stack on a deep chain.
 *
 * @evidence contracts/development/design.md#principled-representation The copy/driven union is exactly the pair of authored driver kinds with value-channel dependencies, separate from world-space aim, parent, IK and spring constraints.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Existing copy and driven records retain their own fields and validation; the union adds no duplicated channel representation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Duplicate producers remain dependencies, and ordering failure is a cycle refusal rather than an arbitrary winning driver.
 * @evidence contracts/development/common.md#meaningful-documentation Defines consumed/produced channel ownership, self-input policy, deterministic order and borrowed output records.
 */
export type IAutoMovieValueDriver = IAutoMovieCopyDriver | IAutoMovieDrivenDriver;
