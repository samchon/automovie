/**
 * Where the body editor reads stature and mass: the whole person, with the
 * head view's standard face (`createConnectedBodyDefaultFace`). The body
 * alone does not determine either value, and the face is a convention rather
 * than a measured head, so the editor states it beside both readings.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Names the whole person the requested stature and mass are read on, so the simple tier's readings say what they measure.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape States beside the stature and volume inversions that the head is the standard face, a convention rather than a measured head.
 * @author Samchon
 */
export const CONNECTED_BODY_WHOLE_SOURCE = "whole person; head: standard face (convention)";
