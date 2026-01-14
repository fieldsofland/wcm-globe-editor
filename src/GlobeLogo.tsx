import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { createOctagonPoints } from './utils';

export interface RingConfig {
    color: string;
    offset: [number, number, number];
    spin: [number, number, number]; // [X, Y, Z] spin multipliers
}

export interface GlobeLogoProps {
    isPlaying: boolean;
    scale: number;
    strokeWidth: number;
    cornerRadius: number;
    globalSpeed: number;
    globalSpin: [number, number, number];
    overrideColor: string | null;
    zRing: RingConfig;
    yRing: RingConfig;
    xRing: RingConfig;
    manualTime?: number;
}

// Sub-component for a single Ring to handle its own refs and state cleanly
const Ring = ({
    config,
    orientation,
    points,
    axisPoints,
    strokeWidth,
    isPlaying,
    globalSpeed,
    path,
    manualTime
}: {
    config: RingConfig;
    orientation?: [number, number, number];
    points: THREE.Vector3[];
    axisPoints: THREE.Vector3[];
    strokeWidth: number;
    isPlaying: boolean;
    globalSpeed: number;
    path: { ring: any[], axis: any[] };
    manualTime?: number;
}) => {
    const spinRef = useRef<THREE.Group>(null);

    useFrame((_, delta) => {
        if (spinRef.current) {
            const speed = 0.5 * globalSpeed;

            if (manualTime !== undefined) {
                // Deterministic mode
                spinRef.current.rotation.x = -speed * config.spin[0] * manualTime;
                spinRef.current.rotation.y = -speed * config.spin[1] * manualTime;
                spinRef.current.rotation.z = -speed * config.spin[2] * manualTime;
            } else if (isPlaying) {
                // Animation mode
                spinRef.current.rotation.x -= speed * config.spin[0] * delta;
                spinRef.current.rotation.y -= speed * config.spin[1] * delta;
                spinRef.current.rotation.z -= speed * config.spin[2] * delta;
            }
        }
    });

    return (
        <group rotation={config.offset}>
            <group rotation={orientation || [0, 0, 0]}>
                <group ref={spinRef}>
                    <Line points={points} color={config.color} lineWidth={strokeWidth} userData={{ originalPoints: points, originalPath: path.ring }} />
                    <Line points={axisPoints} color={config.color} lineWidth={strokeWidth} userData={{ originalPoints: axisPoints, originalPath: path.axis }} />
                </group>
            </group>
        </group>
    );
};

export function GlobeLogo({
    isPlaying,
    scale,
    strokeWidth,
    cornerRadius,
    globalSpeed,
    globalSpin,
    overrideColor,
    zRing,
    yRing,
    xRing,
    manualTime,
}: GlobeLogoProps) {
    const globalRef = useRef<THREE.Group>(null);

    const radius = 2;
    const { points, path } = useMemo(() => createOctagonPoints(radius, cornerRadius), [radius, cornerRadius]);

    // Axis Alignment Fix:
    // ...
    const apothem = radius * Math.cos(Math.PI / 8);
    const axisPoints = useMemo(() => [
        new THREE.Vector3(0, -apothem, 0),
        new THREE.Vector3(0, apothem, 0)
    ], [apothem]);
    // Simple path for axis (straight line)
    const axisPath: any[] = useMemo(() => [
        { type: 'M', to: axisPoints[0].clone() },
        { type: 'L', to: axisPoints[1].clone() }
    ], [axisPoints]);

    useFrame((_, delta) => {
        // ... (unchanged)

        if (globalRef.current) {
            const speed = 0.5 * globalSpeed;
            if (manualTime !== undefined) {
                globalRef.current.rotation.x = -speed * globalSpin[0] * manualTime;
                globalRef.current.rotation.y = -speed * globalSpin[1] * manualTime;
                globalRef.current.rotation.z = -speed * globalSpin[2] * manualTime;
            } else if (isPlaying) {
                globalRef.current.rotation.x -= speed * globalSpin[0] * delta;
                globalRef.current.rotation.y -= speed * globalSpin[1] * delta;
                globalRef.current.rotation.z -= speed * globalSpin[2] * delta;
            }
        }
    });

    return (
        <group ref={globalRef} scale={[scale, scale, scale]}>
            {/* Z-Axis Ring (XY Plane) */}
            <Ring
                config={{ ...zRing, color: overrideColor || zRing.color }}
                points={points}
                axisPoints={axisPoints}
                strokeWidth={strokeWidth}
                isPlaying={isPlaying}
                globalSpeed={globalSpeed}
                path={{ ring: path, axis: axisPath }}
                manualTime={manualTime}
            />

            {/* Y-Axis Ring (XZ Plane) - Orientation X=90 */}
            <Ring
                config={{ ...yRing, color: overrideColor || yRing.color }}
                orientation={[Math.PI / 2, 0, 0]}
                points={points}
                axisPoints={axisPoints}
                strokeWidth={strokeWidth}
                isPlaying={isPlaying}
                globalSpeed={globalSpeed}
                path={{ ring: path, axis: axisPath }}
                manualTime={manualTime}
            />

            {/* X-Axis Ring (YZ Plane) - Orientation Y=90 */}
            <Ring
                config={{ ...xRing, color: overrideColor || xRing.color }}
                orientation={[0, Math.PI / 2, 0]}
                points={points}
                axisPoints={axisPoints}
                strokeWidth={strokeWidth}
                isPlaying={isPlaying}
                globalSpeed={globalSpeed}
                path={{ ring: path, axis: axisPath }}
                manualTime={manualTime}
            />
        </group>
    );
}

export default GlobeLogo;
