# Subdivision and cage design

Catmull-Clark gives a uniform bicubic B-spline in regular regions. [Stam](../sources/stam-1998.md) explains limit evaluation and why extraordinary vertices generally lose curvature continuity. [OpenSubdiv](../sources/opensubdiv-documentation.md) recommends mostly regular faces and few extraordinary vertices because poor pole placement creates waviness.

For Human, pole placement is a shape decision. Finger roots, facial openings and branch saddles need topology changes; broad cheeks, abdomen and thighs expose their curvature artifacts under specular light. [Bommes et al.](../sources/bommes-2013-quad-mesh-survey.md) connect useful quad alignment with curvature and intended deformation. More subdivisions approximate the same underlying cage rather than repairing an unsuitable course.

Semi-sharp creases support tight turns without infinite sharpness. [The hybrid subdivision patent](../sources/us6222553-hybrid-subdivision.md) describes finite sharpness for skin; infinitely sharp normal discontinuities can tear a displaced surface. Crease sharpness is an algorithmic parameter, not an anatomical length or a measured tissue property.

Refined control points differ from limit points. Positions, normals, landmarks and measurements need a declared common surface meaning; a measurement of cage controls does not establish the displayed dimension. Regular bicubic evaluation and extraordinary-region evaluation have different requirements. Boundary interpolation also affects intentional openings, so a smooth interior premise cannot be applied unchanged at a lid or mouth boundary.

Subdivision smoothness alone does not establish anatomical form or deformation quality.
