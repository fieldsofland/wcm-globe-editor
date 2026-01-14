import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { createOctagonPoints } from './utils';

// Clipping plane to hide geometry behind the outer ring (Z < 0)
// Normal points toward camera (+Z), clips anything on the negative Z side
const clipBehindPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

export interface CarouselGlobeLogoProps {
    isPlaying: boolean;
    scale: number;
    strokeWidth: number;
    cornerRadius: number;
    color: string;
    bgColor: string;
    // Animation settings
    animationDuration?: number; // seconds for one 60° step
    pauseDuration?: number; // seconds to pause between steps
    easing?: string; // 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'custom'
    customBezier?: [number, number, number, number]; // [x1, y1, x2, y2] for custom cubic-bezier
    direction?: 'left' | 'right'; // rotation direction
}

// Easing functions
function easeLinear(t: number): number {
    return t;
}

function easeInQuad(t: number): number {
    return t * t;
}

function easeOutQuad(t: number): number {
    return 1 - (1 - t) * (1 - t);
}

function easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// Cubic bezier implementation for custom easing
function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
    // Attempt to find y for a given t using binary search approximation
    // This is a simplified implementation
    return (t: number): number => {
        if (t === 0 || t === 1) return t;

        // Binary search to find the t value that gives us the x coordinate
        let low = 0;
        let high = 1;
        let mid: number;

        for (let i = 0; i < 20; i++) {
            mid = (low + high) / 2;
            const x = 3 * (1 - mid) * (1 - mid) * mid * x1 +
                3 * (1 - mid) * mid * mid * x2 +
                mid * mid * mid;

            if (Math.abs(x - t) < 0.0001) break;

            if (x < t) {
                low = mid;
            } else {
                high = mid;
            }
        }

        mid = (low + high) / 2;
        // Calculate y using the found t approximation
        const y = 3 * (1 - mid!) * (1 - mid!) * mid! * y1 +
            3 * (1 - mid!) * mid! * mid! * y2 +
            mid! * mid! * mid!;

        return y;
    };
}

// Get easing function by name
function getEasingFunction(name: string, customBezier?: [number, number, number, number]): (t: number) => number {
    switch (name) {
        case 'linear': return easeLinear;
        case 'ease-in': return easeInQuad;
        case 'ease-out': return easeOutQuad;
        case 'ease-in-out': return easeInOutQuad;
        case 'custom':
            if (customBezier) {
                return cubicBezier(customBezier[0], customBezier[1], customBezier[2], customBezier[3]);
            }
            return easeInOutQuad;
        default: return easeInOutQuad;
    }
}

// Convert degrees to radians
const toRad = (deg: number) => deg * Math.PI / 180;

// The 3 arm positions in degrees (Y rotation)
// -90 (hidden), -30 (left visible), +30 (right visible), +90 (hidden)
const ARM_POSITIONS = {
    hiddenLeft: -90,
    visibleLeft: -30,
    visibleRight: 30,
    hiddenRight: 90,
};

export function CarouselGlobeLogo({
    isPlaying,
    scale,
    strokeWidth,
    cornerRadius,
    color,
    animationDuration = 1.0,
    pauseDuration = 0.5,
    easing = 'ease-in-out',
    customBezier,
    direction = 'right',
}: CarouselGlobeLogoProps) {
    const groupRef = useRef<THREE.Group>(null);
    const arm1Ref = useRef<THREE.Group>(null);
    const arm2Ref = useRef<THREE.Group>(null);
    const arm3Ref = useRef<THREE.Group>(null);

    // Enable clipping on the renderer
    const { gl } = useThree();
    useEffect(() => {
        gl.localClippingEnabled = true;
        return () => {
            gl.localClippingEnabled = false;
        };
    }, [gl]);

    // Animation state
    const [animationProgress, setAnimationProgress] = useState(0); // 0 to 1
    const [isPaused, setIsPaused] = useState(false);
    const pauseTimerRef = useRef(0);

    // Arm angles (in degrees)
    const [armAngles, setArmAngles] = useState<[number, number, number]>([
        ARM_POSITIONS.hiddenLeft,   // Arm 1: -90° (hidden)
        ARM_POSITIONS.visibleLeft,   // Arm 2: -30° (left)
        ARM_POSITIONS.visibleRight,  // Arm 3: +30° (right)
    ]);

    const radius = 2;

    // Use FULL octagon for the arms (same as X-Axis Ring in classic mode)
    const { points: armRingPoints, path: armRingPath } = useMemo(
        () => createOctagonPoints(radius, cornerRadius),
        [cornerRadius]
    );

    // Outer ring (Z-axis ring / the frame octagon)
    const { points: outerRingPoints, path: outerRingPath } = useMemo(
        () => createOctagonPoints(radius, cornerRadius),
        [cornerRadius]
    );

    // Axis line for each ring
    const apothem = radius * Math.cos(Math.PI / 8);
    const axisPoints = useMemo(() => [
        new THREE.Vector3(0, -apothem, 0),
        new THREE.Vector3(0, apothem, 0)
    ], [apothem]);
    const axisPath = useMemo(() => [
        { type: 'M' as const, to: axisPoints[0].clone() },
        { type: 'L' as const, to: axisPoints[1].clone() }
    ], [axisPoints]);

    // Animation loop
    useFrame((_, delta) => {
        if (!isPlaying) return;

        if (isPaused) {
            // Count pause time
            pauseTimerRef.current += delta;
            if (pauseTimerRef.current >= pauseDuration) {
                setIsPaused(false);
                pauseTimerRef.current = 0;
            }
            return;
        }

        // Advance animation progress
        const progressDelta = delta / animationDuration;
        const newProgress = Math.min(animationProgress + progressDelta, 1);
        setAnimationProgress(newProgress);

        // Apply eased rotation to each arm
        const easingFn = getEasingFunction(easing, customBezier);
        const easedProgress = easingFn(newProgress);

        // Direction multiplier: right = +60°, left = -60°
        const stepAngle = direction === 'right' ? 60 : -60;

        if (arm1Ref.current) {
            const startAngle = armAngles[0];
            const angle = startAngle + (stepAngle * easedProgress);
            arm1Ref.current.rotation.y = toRad(angle);
        }
        if (arm2Ref.current) {
            const startAngle = armAngles[1];
            const angle = startAngle + (stepAngle * easedProgress);
            arm2Ref.current.rotation.y = toRad(angle);
        }
        if (arm3Ref.current) {
            const startAngle = armAngles[2];
            const angle = startAngle + (stepAngle * easedProgress);
            arm3Ref.current.rotation.y = toRad(angle);
        }

        // Check if animation cycle complete
        if (newProgress >= 1) {
            // Update base angles with proper wraparound for -90 to +90 range
            setArmAngles(prev => {
                const newAngles: [number, number, number] = [
                    prev[0] + stepAngle,
                    prev[1] + stepAngle,
                    prev[2] + stepAngle,
                ];

                // Wrap angles to stay in -90 to +90 range
                for (let i = 0; i < 3; i++) {
                    if (newAngles[i] >= 90) {
                        newAngles[i] = -90;
                    } else if (newAngles[i] <= -90) {
                        newAngles[i] = 90;
                    }
                }

                return newAngles;
            });
            setAnimationProgress(0);
            setIsPaused(true);
        }
    });

    // Reset animation when isPlaying changes
    useEffect(() => {
        if (!isPlaying) {
            setAnimationProgress(0);
            setIsPaused(false);
            pauseTimerRef.current = 0;
        }
    }, [isPlaying]);

    // Reset arm positions when direction changes
    useEffect(() => {
        // For right rotation: arms come from left (-90) and exit right (+90)
        // For left rotation: arms come from right (+90) and exit left (-90)
        if (direction === 'right') {
            setArmAngles([
                ARM_POSITIONS.hiddenLeft,   // -90° (hidden left)
                ARM_POSITIONS.visibleLeft,   // -30° (left visible)
                ARM_POSITIONS.visibleRight,  // +30° (right visible)
            ]);
        } else {
            setArmAngles([
                ARM_POSITIONS.hiddenRight,   // +90° (hidden right)
                ARM_POSITIONS.visibleRight,  // +30° (right visible)
                ARM_POSITIONS.visibleLeft,   // -30° (left visible)
            ]);
        }
        setAnimationProgress(0);
        setIsPaused(false);
        pauseTimerRef.current = 0;
    }, [direction]);

    return (
        <group ref={groupRef} scale={[scale, scale, scale]}>
            {/* Outer Ring (Z-axis ring, like the red one) */}
            <group rotation={[0, 0, toRad(90)]}>
                <Line
                    points={outerRingPoints}
                    color={color}
                    lineWidth={strokeWidth}
                    userData={{ originalPoints: outerRingPoints, originalPath: outerRingPath }}
                />
                <Line
                    points={axisPoints}
                    color={color}
                    lineWidth={strokeWidth}
                    userData={{ originalPoints: axisPoints, originalPath: axisPath }}
                />
            </group>

            {/* Horizontal Ring (Y-axis ring, like the green one) */}
            <group rotation={[Math.PI / 2, 0, 0]}>
                <Line
                    points={outerRingPoints}
                    color={color}
                    lineWidth={strokeWidth}
                    userData={{ originalPoints: outerRingPoints, originalPath: outerRingPath }}
                />
                <Line
                    points={axisPoints}
                    color={color}
                    lineWidth={strokeWidth}
                    userData={{ originalPoints: axisPoints, originalPath: axisPath }}
                />
            </group>

            {/* Carousel Arms (3 full rings that rotate) - clipped behind outer ring */}
            {/* Arm 1: starts at -90° (hidden) */}
            <group ref={arm1Ref} rotation={[0, toRad(armAngles[0]), 0]}>
                <group rotation={[0, Math.PI / 2, 0]}>
                    <Line
                        points={armRingPoints}
                        color={color}
                        lineWidth={strokeWidth}
                        userData={{ originalPoints: armRingPoints, originalPath: armRingPath }}
                        clippingPlanes={[clipBehindPlane]}
                    />
                    {/* Axis line - no clipping so it's always visible */}
                    <Line
                        points={axisPoints}
                        color={color}
                        lineWidth={strokeWidth}
                        userData={{ originalPoints: axisPoints, originalPath: axisPath }}
                    />
                </group>
            </group>

            {/* Arm 2: starts at -30° (left visible) */}
            <group ref={arm2Ref} rotation={[0, toRad(armAngles[1]), 0]}>
                <group rotation={[0, Math.PI / 2, 0]}>
                    <Line
                        points={armRingPoints}
                        color={color}
                        lineWidth={strokeWidth}
                        userData={{ originalPoints: armRingPoints, originalPath: armRingPath }}
                        clippingPlanes={[clipBehindPlane]}
                    />
                    {/* Axis line - no clipping so it's always visible */}
                    <Line
                        points={axisPoints}
                        color={color}
                        lineWidth={strokeWidth}
                        userData={{ originalPoints: axisPoints, originalPath: axisPath }}
                    />
                </group>
            </group>

            {/* Arm 3: starts at +30° (right visible) */}
            <group ref={arm3Ref} rotation={[0, toRad(armAngles[2]), 0]}>
                <group rotation={[0, Math.PI / 2, 0]}>
                    <Line
                        points={armRingPoints}
                        color={color}
                        lineWidth={strokeWidth}
                        userData={{ originalPoints: armRingPoints, originalPath: armRingPath }}
                        clippingPlanes={[clipBehindPlane]}
                    />
                    {/* Axis line - no clipping so it's always visible */}
                    <Line
                        points={axisPoints}
                        color={color}
                        lineWidth={strokeWidth}
                        userData={{ originalPoints: axisPoints, originalPath: axisPath }}
                    />
                </group>
            </group>
        </group>
    );
}

export default CarouselGlobeLogo;
