import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface SVGExporterProps {
    trigger: number;
    bgColor?: string;
    onGenerate?: (svg: string) => void;
}

export function generateSVG(
    scene: THREE.Scene,
    camera: THREE.Camera,
    width: number,
    height: number,
    bgColor?: string
): string {
    // 1. Traverse to find all Lines
    const linesToExport: { points?: THREE.Vector3[]; path?: any[]; color: string; lineWidth: number; matrixWorld: THREE.Matrix4 }[] = [];

    scene.traverse((obj) => {
        const userData = obj.userData;
        if (userData && (userData.originalPoints || userData.originalPath)) {
            // Get color
            // @ts-ignore
            const color = obj.material?.color ? '#' + obj.material.color.getHexString() : '#ffffff';
            // @ts-ignore
            const lineWidth = obj.material?.linewidth || 1;

            linesToExport.push({
                points: userData.originalPoints,
                path: userData.originalPath,
                color,
                lineWidth,
                matrixWorld: obj.matrixWorld
            });
        }
    });

    if (linesToExport.length === 0) {
        console.warn("No exportable lines found.");
        return "";
    }

    // 2. Project to 2D SVG Coordinates
    const paths: string[] = [];

    linesToExport.forEach(line => {
        let d = "";

        // Helper to project a single vector
        const project = (v: THREE.Vector3) => {
            const world = v.clone().applyMatrix4(line.matrixWorld);
            const ndc = world.project(camera);
            const x = (ndc.x + 1) / 2 * width;
            const y = (1 - ndc.y) / 2 * height;
            return { x, y };
        };

        const fmt = (val: number) => val.toFixed(2);

        if (line.path) {
            // Use the explicit path commands (Bezier)
            line.path.forEach((cmd: any) => {
                if (cmd.type === 'M') {
                    const p = project(cmd.to);
                    d += `M ${fmt(p.x)},${fmt(p.y)} `;
                }
                else if (cmd.type === 'L') {
                    const p = project(cmd.to);
                    d += `L ${fmt(p.x)},${fmt(p.y)} `;
                }
                else if (cmd.type === 'Q') {
                    const p = project(cmd.to);
                    const cp = project(cmd.cp);
                    d += `Q ${fmt(cp.x)},${fmt(cp.y)} ${fmt(p.x)},${fmt(p.y)} `;
                }
            });
        } else if (line.points) {
            // Fallback to point sampling
            const projectedPoints = line.points.map(p => {
                const world = p.clone().applyMatrix4(line.matrixWorld);
                const ndc = world.project(camera);
                const x = (ndc.x + 1) / 2 * width;
                const y = (1 - ndc.y) / 2 * height;
                return { x, y };
            });
            d = "M " + projectedPoints.map(pt => `${fmt(pt.x)},${fmt(pt.y)}`).join(" L ");
        }

        if (d) {
            paths.push(`<path d="${d.trim()}" stroke="${line.color}" stroke-width="${line.lineWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round" />`);
        }
    });

    // 3. Assemble SVG
    const background = bgColor || 'black';
    const svgString = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="background-color: ${background};">
  <!-- WCM Globe Logo - Exported SVG -->
  ${paths.join('\n  ')}
</svg>
    `.trim();

    return svgString;
}

export function SVGExporter({ trigger, bgColor, onGenerate }: SVGExporterProps) {
    const { scene, camera, size } = useThree();
    const lastTrigger = useRef(0);

    useEffect(() => {
        if (trigger === 0 || trigger === lastTrigger.current) return;
        lastTrigger.current = trigger;

        const svgString = generateSVG(scene, camera, size.width, size.height, bgColor);
        if (!svgString) return;

        // If there's a callback, use it instead of downloading
        if (onGenerate) {
            onGenerate(svgString);
            return;
        }

        // 4. Trigger Download
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `wcm-globe-${Date.now()}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log("SVG Exported!");

    }, [trigger, scene, camera, size, bgColor, onGenerate]);

    return null;
}
