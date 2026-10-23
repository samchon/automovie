# Lewis et al. 2000, pose space deformation

Lewis JP, Cordner M, Fong N. "Pose Space Deformation: A Unified Approach to Shape Interpolation and Skeleton-Driven Deformation." SIGGRAPH 2000, pp. 165-172. Read from the author's copy at https://www.scribblethink.org/Work/PSD/PSD.pdf (abstract and sections 1 to 3).

## Licence

Paper copyright ACM.

## What it says

- Several deformation types are mappings "from a pose space, defined by either an underlying skeleton or a more abstract system of parameters, to displacements in the object local coordinate frames".
- Skeleton subspace deformation (LBS) shows the "collapsing elbow" and collapses the forearm as twist approaches 180 degrees, because the desired deformation does not lie in its subspace.
- Corrections are defined in the rest pose before skinning and interpolated over pose space, with Gaussian radial basis functions as one choice.
