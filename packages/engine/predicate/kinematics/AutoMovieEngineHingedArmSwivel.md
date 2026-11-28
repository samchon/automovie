# src/kinematics/AutoMovieEngineHingedArmSwivel.ts#AutoMovieEngineHingedArmSwivel.branches

## @evidence contracts/development/common.md#meaningful-documentation

The declaration tells the caller which pose, offsets and angular limits to supply, how branches are ordered and what happens outside the attainable span. It identifies bend angles in radians, shortfall in metres and the cases that produce no stop.

## @evidence contracts/development/implementation.md#principled-implementation

The span owner splits the far offset into its hinge-parallel and rotating components. The squared reach then has one constant and two sinusoidal coefficients. Converting the squared target distance into a cosine gives at most two roots. An out-of-span value selects an extremum and each authored limit clips the corresponding root. Recomputing the stopped reach gives the shortfall. The same admission rule serves a one-call solve and a prepared target. A distance or stop outside finite arithmetic fails that rule before candidate scoring.

## @evidence contracts/development/implementation.md#efficient-algorithms

The direct entry derives the fixed span and evaluates at most two stops by closed form with constant storage. A prepared source fixes the same span for reuse and binds a target once before pose reads. The branch owner checks the finite distance before computing the roots and checks the bounded set of stops once before returning it.
