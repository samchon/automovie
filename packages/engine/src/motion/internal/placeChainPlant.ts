import type {
  IAutoMoviePrepareChainConstants,
  IAutoMoviePreparedChainPlant,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";

/*
 * A chain's articulation-free frames under a pose, from the rig's constants
 * (`prepareChainConstants`) and the world frame of the chain root's parent in
 * that pose: what `prepareChainPlant` reads by forward kinematics of the whole
 * pose with the chain's two joints left out, composed here from the one frame
 * that depends on the pose. The placed chain carries the constants' rig-only
 * fit readers (`IPreparedChainPlant.rig`).
 * Parameter constants: The chain's rig constants.
 * Parameter parent: The world frame of the chain root's parent in the pose (the
 * pose's root transform for a chain hung from the root), model metres.
 * Returns: The prepared chain, as `prepareChainPlant` returns it.
 */
export function placeChainPlant(
  constants: IAutoMoviePrepareChainConstants.IConstants,
  parent: {
    worldPosition: IAutoMovieVector3;
    worldRotation: IAutoMovieQuaternion;
  },
): IAutoMoviePreparedChainPlant {
  const upperRotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
    parent.worldRotation,
    constants.upperRotation,
  );
  const upperPosition: IAutoMovieVector3 = AutoMovieEngineVector3.add(
    parent.worldPosition,
    AutoMovieEngineQuaternion.rotateVector(parent.worldRotation, constants.upperTranslation),
  );
  const lowerRotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
    upperRotation,
    constants.lowerRotation,
  );
  const lowerPosition: IAutoMovieVector3 = AutoMovieEngineVector3.add(
    upperPosition,
    AutoMovieEngineQuaternion.rotateVector(upperRotation, constants.lowerOffset),
  );
  return {
    chain: constants.chain,
    upper: {
      bone: constants.chain.upper,
      localRotation: constants.upperRotation,
      worldPosition: upperPosition,
      worldRotation: upperRotation,
    },
    lower: {
      bone: constants.chain.lower,
      localRotation: constants.lowerRotation,
      worldPosition: lowerPosition,
      worldRotation: lowerRotation,
    },
    upperDomain: constants.upperDomain,
    lowerDomain: constants.lowerDomain,
    end: AutoMovieEngineVector3.add(
      lowerPosition,
      AutoMovieEngineQuaternion.rotateVector(lowerRotation, constants.effectorOffset),
    ),
    hinge: AutoMovieEngineQuaternion.rotateVector(lowerRotation, constants.hinge),
    lowerOffset: constants.lowerOffset,
    lowerRotation: constants.lowerRotation,
    effectorOffset: constants.effectorOffset,
    effectorBaseRotation: constants.effectorBaseRotation,
    rig: constants.rig,
  };
}
