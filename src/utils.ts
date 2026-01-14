import * as THREE from 'three';

export interface PathCommand {
    type: 'M' | 'L' | 'Q';
    to: THREE.Vector3;
    cp?: THREE.Vector3; // For 'Q'
}

export interface OctagonData {
    points: THREE.Vector3[];
    path: PathCommand[];
}

/**
 * Generates vertices for a 2D octagon centered at (0,0,0) in the XY plane.
 * @param radius distance from center to vertices
 * @returns Object containing high-res points for 3D rendering and path commands for SVG export
 */
export function createOctagonPoints(radius: number = 2, cornerRadius: number = 0): OctagonData {
    const points: THREE.Vector3[] = [];
    const path: PathCommand[] = [];
    const segments = 8;
    const angleStep = (Math.PI * 2) / segments;
    const startAngle = Math.PI / 8; // Rotate to have flat top/bottom/sides

    if (cornerRadius <= 0) {
        // Sharp corners
        for (let i = 0; i <= segments; i++) {
            const theta = startAngle + i * angleStep;
            const pt = new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, 0);
            points.push(pt);

            if (i < segments) {
                // For path, we just L to each vertex
                if (i === 0) path.push({ type: 'M', to: pt.clone() });
                else path.push({ type: 'L', to: pt.clone() });
            } else {
                // Close loop
                path.push({ type: 'L', to: points[0].clone() });
            }
        }
    } else {
        // Rounded corners
        for (let i = 0; i < segments; i++) {
            const theta = startAngle + i * angleStep;

            // Current vertex (Control Point for the bevel/round)
            const vx = Math.cos(theta) * radius;
            const vy = Math.sin(theta) * radius;
            const curr = new THREE.Vector3(vx, vy, 0);

            // Previous and Next angles
            const prevTheta = startAngle + (i - 1) * angleStep;
            const nextTheta = startAngle + (i + 1) * angleStep;

            const prev = new THREE.Vector3(Math.cos(prevTheta) * radius, Math.sin(prevTheta) * radius, 0);
            const next = new THREE.Vector3(Math.cos(nextTheta) * radius, Math.sin(nextTheta) * radius, 0);

            // Vectors from Current to Prev/Next
            const dirPrev = new THREE.Vector3().subVectors(prev, curr).normalize();
            const dirNext = new THREE.Vector3().subVectors(next, curr).normalize();

            // Start of arc (tangent on 'prev' side)
            const arcStart = curr.clone().add(dirPrev.multiplyScalar(cornerRadius));
            // End of arc (tangent on 'next' side)
            const arcEnd = curr.clone().add(dirNext.multiplyScalar(cornerRadius));

            // PATH COMMANDS
            if (i === 0) {
                path.push({ type: 'M', to: arcStart.clone() });
            } else {
                // Connect from previous arcEnd to this arcStart
                path.push({ type: 'L', to: arcStart.clone() });
            }
            // Curve the corner
            path.push({ type: 'Q', cp: curr.clone(), to: arcEnd.clone() });


            // POINTS GENERATION (High Res for visual smoothness)
            const divs = 32; // Increased resolution significantly
            for (let j = 0; j <= divs; j++) {
                const t = j / divs; // 0 to 1
                // Quadratic Bezier
                const p = new THREE.Vector3()
                    .addScaledVector(arcStart, (1 - t) * (1 - t))
                    .addScaledVector(curr, 2 * (1 - t) * t)
                    .addScaledVector(arcEnd, t * t);

                // Avoid pushing duplicate points if connected
                if (points.length === 0 || p.distanceToSquared(points[points.length - 1]) > 0.000001) {
                    points.push(p);
                }
            }
        }
        // Close the loop
        if (points.length > 0) {
            // Connect last point back to first
            points.push(points[0].clone());

            // Close path loop
            path.push({ type: 'L', to: path[0].to.clone() });
        }
    }

    return { points, path };
}

/**
 * Generates vertices for a HALF octagon (right side) with axis line for carousel animation.
 * Creates a closed shape: top of axis → right arc → bottom of axis → back to top.
 * This creates the "arm" shape visible in the WCM logo at 30° offset.
 * @param radius distance from center to vertices
 * @param cornerRadius radius of rounded corners
 * @returns Object containing points for 3D rendering and path commands for SVG export
 */
export function createHalfOctagonPoints(radius: number = 2, cornerRadius: number = 0): OctagonData {
    const points: THREE.Vector3[] = [];
    const path: PathCommand[] = [];
    const segments = 8;
    const angleStep = (Math.PI * 2) / segments;
    const startAngle = Math.PI / 8;

    // Calculate the apothem (distance from center to edge midpoint)
    // This is where the vertical axis meets the top/bottom of the octagon
    const apothem = radius * Math.cos(Math.PI / segments);

    // Axis points (top and bottom of the vertical line at x=0)
    const topAxisPoint = new THREE.Vector3(0, apothem, 0);
    const bottomAxisPoint = new THREE.Vector3(0, -apothem, 0);

    // Right side vertices ordered from top to bottom
    // i=1: 67.5° (top-right, Y ~ 0.92)
    // i=0: 22.5° (upper-right, Y ~ 0.38)  
    // i=7: 337.5° (lower-right, Y ~ -0.38)
    // i=6: 292.5° (bottom-right, Y ~ -0.92)
    const rightIndices = [1, 0, 7, 6];

    if (cornerRadius <= 0) {
        // Sharp corners - create closed path: top → arc → bottom → back to top

        // Start at top axis point
        points.push(topAxisPoint.clone());
        path.push({ type: 'M', to: topAxisPoint.clone() });

        // Add right-side vertices
        for (const i of rightIndices) {
            const theta = startAngle + i * angleStep;
            const pt = new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, 0);
            points.push(pt);
            path.push({ type: 'L', to: pt.clone() });
        }

        // Go to bottom axis point
        points.push(bottomAxisPoint.clone());
        path.push({ type: 'L', to: bottomAxisPoint.clone() });

        // Close path back to top axis point
        points.push(topAxisPoint.clone());
        path.push({ type: 'L', to: topAxisPoint.clone() });

    } else {
        // Rounded corners
        // Get the full octagon to extract the curved right side
        const fullOctagon = createOctagonPoints(radius, cornerRadius);

        // Start at top axis point
        points.push(topAxisPoint.clone());
        path.push({ type: 'M', to: topAxisPoint.clone() });

        // Find and add all points on the right side (positive X) from top to bottom
        // The full octagon points are ordered, so we need to find the right range

        // Find the topmost point with positive X
        let topIdx = 0;
        let maxY = -Infinity;
        for (let i = 0; i < fullOctagon.points.length; i++) {
            const pt = fullOctagon.points[i];
            if (pt.x > 0.01 && pt.y > maxY) {
                maxY = pt.y;
                topIdx = i;
            }
        }

        // Collect points going from top to bottom on the right side
        let idx = topIdx;
        let lastY = maxY;
        let collected = 0;

        while (collected < fullOctagon.points.length) {
            const pt = fullOctagon.points[idx];

            if (pt.x > -0.01) { // Allow slight negative X at the ends
                points.push(pt.clone());
                path.push({ type: 'L', to: pt.clone() });

                // Stop when we've passed the bottom and Y starts increasing
                if (points.length > 3 && pt.y > lastY + 0.01) {
                    break;
                }
                lastY = pt.y;
            } else if (points.length > 1) {
                break;
            }

            idx = (idx + 1) % fullOctagon.points.length;
            collected++;
        }

        // Go to bottom axis point
        points.push(bottomAxisPoint.clone());
        path.push({ type: 'L', to: bottomAxisPoint.clone() });

        // Close path back to top axis point
        points.push(topAxisPoint.clone());
        path.push({ type: 'L', to: topAxisPoint.clone() });
    }

    return { points, path };
}
