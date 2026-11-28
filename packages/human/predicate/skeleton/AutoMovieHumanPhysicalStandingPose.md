# src/skeleton/AutoMovieHumanPhysicalStandingPose.ts#AutoMovieHumanPhysicalStandingPose.fit

## @evidence contracts/development/common.md#meaningful-documentation

The source identifies the metre floor and tolerance, finite profile and fit inputs, iteration cap, preserved pelvis frame and explicit unresolved result.

## @evidence contracts/development/implementation.md#principled-implementation

Fit both legs to actual heel and forefoot support hulls. Check anchors, joint limits, floor clearance and projected centre of mass after adjusting arm clearance. Return a refusal when support or the resulting pose fails admission.

## @evidence contracts/development/implementation.md#efficient-algorithms

The fit makes one scan of foot hull points and uses six fixed local goals in a bounded articulation solve. The subsequent clearance and balance checks read the candidate once each. Target and residual state remain local to the invocation.
