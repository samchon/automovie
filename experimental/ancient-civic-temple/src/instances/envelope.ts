/** Retains the complete authored space envelope before independent members. */
import { createTempleEnvironment } from "../spaces/environment";

/**
 * @evidence instances/envelope.md The room, shell and ground populations retain their original producer and transforms without a duplicate graph.
 * @evidence instances/envelope.md#room-membership All original room cells, boundaries, openings, supports and connectors remain in the returned envelope.
 * @evidence instances/envelope.md#shell-membership Every original wall, floor and roof model and element retains its identity and transform.
 * @evidence instances/envelope.md#ground-membership Site, curb, approach and distant terrain continue to use their original models and supports.
 * @evidence principles/core/source-units.md#source-scope-preservation This owner retains the existing complete environment without generating replacement faces or adjusting its graph.
 * @evidence principles/core/source-units.md#source-substantive-completion The returned environment and roof datums are the complete original producer result, ready for independent building members.
 * @evidenceExclude upstream/design/instance-sources.md#design-revision-from-instance-source-work The three envelope H2s explicitly select unchanged membership from the original space producer.
 * @evidence obligations/design/instance-sources.md#instance-source-design-ownership This membership owner retains only the room, shell and ground sets declared in the envelope design.
 * @evidence obligations/design/instance-sources.md#instance-source-stable-membership A direct producer call retains its ordered deterministic model and element populations.
 * @evidence obligations/design/instance-sources.md#instance-source-invalid-placement No separate placements are invented; the environment producer's own validation remains authoritative.
 */
export const createTempleBuildingEnvelope = () => createTempleEnvironment();
