/**
 * The last trim decision, as `/health` reports it.
 *
 * @evidence contracts/common.md#principled-implementation A trim reading reports page and worker isolate bytes beside the shared limit, released resident count and domain-specific capture room.
 * @evidence contracts/common.md#clear-and-simple-design One health record carries the completed trim decision while the trim owner retains measurement and eviction policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Evicted counts and heap bytes are recorded observations, not a readiness or visual-quality verdict.
 * @evidence contracts/common.md#meaningful-documentation Documents byte units, ISO reading time and the face, body and person capture-room meanings.
 * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle A trim reading reports page and worker isolate bytes beside the shared limit, released resident count and domain-specific capture room.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation One health record carries the completed trim decision while the trim owner retains measurement and eviction policy.
 * @author Samchon
 */
export interface IHumanViewerResidentTrimReading {
  /**
   * ISO time of the reading.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle ISO time of the reading. A trim reading reports page and worker isolate bytes beside the shared limit, released resident count and domain-specific capture room.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation ISO time of the reading. One health record carries the completed trim decision while the trim owner retains measurement and eviction policy.
   */
  at: string;

  /**
   * Page isolate JS heap in bytes.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle Page isolate JS heap in bytes. A trim reading reports page and worker isolate bytes beside the shared limit, released resident count and domain-specific capture room.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Page isolate JS heap in bytes. One health record carries the completed trim decision while the trim owner retains measurement and eviction policy.
   */
  page: number;

  /**
   * All worker isolates' JS heap in bytes.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle All worker isolates' JS heap in bytes. A trim reading reports page and worker isolate bytes beside the shared limit, released resident count and domain-specific capture room.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation All worker isolates' JS heap in bytes. One health record carries the completed trim decision while the trim owner retains measurement and eviction policy.
   */
  workers: number;

  /**
   * The combined limit in bytes.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle The combined limit in bytes. A trim reading reports page and worker isolate bytes beside the shared limit, released resident count and domain-specific capture room.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation The combined limit in bytes. One health record carries the completed trim decision while the trim owner retains measurement and eviction policy.
   */
  limit: number;

  /**
   * Residents the page released in this trim.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle Residents the page released in this trim. A trim reading reports page and worker isolate bytes beside the shared limit, released resident count and domain-specific capture room.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Residents the page released in this trim. One health record carries the completed trim decision while the trim owner retains measurement and eviction policy.
   */
  evicted: number;

  /**
   * The page heap room each domain's capture is known to need, in bytes.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle The page heap room each domain's capture is known to need, in bytes. A trim reading reports page and worker isolate bytes beside the shared limit, released resident count and domain-specific capture room.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation The page heap room each domain's capture is known to need, in bytes. One health record carries the completed trim decision while the trim owner retains measurement and eviction policy.
   */
  room: Record<"face" | "body" | "person", number>;
}
