/**
 * Blender's interpolation of the two weight bindings through the subdivision,
 * one list of `[name, weight]` per skin vertex: `bones` from
 * `weights.game_engine.json`, `attachments` from the default-rig jaw and eye
 * subtrees.
 *
 * @author Samchon
 */
export interface IHumanSourceSampleWeights {
  bones: [string, number][][];
  attachments: [string, number][][];
}
