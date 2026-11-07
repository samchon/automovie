# Physical control and contact fitting

This research addresses three decisions exposed by the current failed physical integration: transferring actuator effort through support joints, preserving a connected target skeleton, and escaping a self-collision without replacing actual dynamics with fitted poses. The [kick guard](kick-guard.md) is a separate production choice. None of these references establishes acceptance of this film.

## Support and balance

Yin, Loken and van de Panne, [SIMBICON: Simple Biped Locomotion Control](https://www.cs.ubc.ca/~van/papers/2007-siggraph-simbicon.pdf), SIGGRAPH 2007, Section 3 and Figure 3, separates local joint pose tracking, world-relative torso/swing-leg control and COM feedback for the next support placement. Section 3.2 realizes the desired torso torque through internal stance/swing hip torques. Section 3.3 uses both COM displacement from support and COM velocity, including lateral feedback in 3D. The retained [full page 3](../../references/private/physical-control/simbicon-03.png) shows the equations and their supporting diagrams; it was opened at 1400 px. Its gait controller is evidence about that method and model, not a measured kickboxing controller or a universal set of gains.

The implementation implication is to keep actual support, internal actuator budgets and geometric intent distinct. Root translation/orientation demands must be realizable through the declared support paths. Adding an external root force can conceal inadequate floor support; matching joint poses alone does not establish balance. The current generic virtual-work mapping is a candidate implementation of this requirement. Its independent free-flight momentum and supported floor-load tests establish their narrow scopes; the observed three-actor collapse disproves integrated fight acceptance.

The current root-feedback defect is independent of controller tuning: moving only the target root by 0.2 m leaves a 0.2 m joint-anchor discrepancy after fitting. Root-force intent must therefore be stored separately from a coherent articulated target tree. The tree must reconstruct coincident anchors before any contact solve. These are geometric invariants derived from the model, rather than coefficients taken from a paper.

## Contact derivatives

Drake's [signed-distance result contract](https://drake.mit.edu/doxygen_cxx/structdrake_1_1geometry_1_1_signed_distance_pair.html) distinguishes signed separation, the two surface witnesses and the separating normal. Its [distance derivative implementation at commit bdcd5ff](https://github.com/RobotLocomotion/drake/blob/bdcd5ff96a1dfed77791302fb499ec2aa831a03e/multibody/inverse_kinematics/distance_constraint_utilities.cc), `CalcDistanceDerivatives`, derives the distance gradient as the contact normal dotted with the relative witness-point Jacobian. Normal orientation must follow the chosen query library's convention; Drake and Rapier names are not interchangeable.

This suggests freezing the current bone-local witnesses and world normal while differentiating one local step. Reconstruct those witnesses through each candidate joint tree, and use their relative displacement for the local distance derivative. Refresh the witnesses after an accepted step. Continue to evaluate native signed distances for the actual line search, so a local approximation cannot invent clearance or a successful physical contact. This is an implementation inference from the cited derivative, and must be verified on the failing primitive branch and the actual film geometry.

The current folded primitive has 100 mm branch-to-branch and 50 mm branch-to-trunk penetration. Repeated narrow-phase finite differences return no accepted correction. The proposed witness derivative targets this measured failure and removes repeated pair queries from Jacobian probes. Exact-zero Jacobian rows and columns may be omitted from the linear system without changing its solution; all residuals remain in nonlinear acceptance. Stagnation should be judged against the declared geometric tolerance, while retaining the actual unresolved residual.

## Scope and outstanding checks

The generic geometry, Jacobian solve and actuator mapping belong in Engine, with provider geometry and anatomical recovery policy in Human. The film owns guard, choreography, actual collider bindings and acceptance of its actions. Shared packages must not import Human or encode named fighting techniques.

The next inspection must cover coherent anchors, enabled self-collision pairs, floor clearance including admitted contact slop, native momentum, floor load and actual recovery. It must also inspect the original polygon actors with rig points and sticks at preparation, contact and recovery. A cold-start interval at 149 s has zero initial native velocities and is not a continuation from the beginning of the film. Complete playback, audio and decoded export remain separate requirements.
