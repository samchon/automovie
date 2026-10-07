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

  /**
   * Toe phalanx weights of the MPFB default rig per sample (`ray:<bone>` groups),
   * which split the game-engine toe weight vertex for vertex; absent in a sample
   * taken before the toe rays were bound.
   */
  rays?: [string, number][][];
}
