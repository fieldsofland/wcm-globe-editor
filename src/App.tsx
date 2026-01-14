import { Canvas, useThree } from '@react-three/fiber';
import { useState, useEffect, useRef, useCallback } from 'react';
import { OrbitControls } from '@react-three/drei';
import GlobeLogo from './GlobeLogo';
import CarouselGlobeLogo from './CarouselGlobeLogo';
import type { RingConfig } from './GlobeLogo';
import { SVGExporter, generateSVG } from './SVGExporter';
import './App.css';

// Animation modes
type AnimationMode = 'classic' | 'carousel';

// ============================================
// ICONS (inline SVG components)
// ============================================
const PlayIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
    </svg>
);

const PauseIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
);

const ResetIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
    </svg>
);

const DownloadIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
    </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
    >
        <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
    </svg>
);

const FolderIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
    </svg>
);

// ============================================
// CAMERA HELPER
// ============================================
const CameraHelper = ({ resetKey }: { resetKey: number }) => {
    const { camera, controls } = useThree();

    useEffect(() => {
        if (resetKey > 0) {
            camera.position.set(0, 0, 100);
            camera.lookAt(0, 0, 0);
            // @ts-ignore
            if (controls) controls.reset();
        }
    }, [resetKey, camera, controls]);

    return null;
};

// ============================================
// FRAME EXPORTER
// ============================================
const FrameExporter = ({
    isExporting,
    frameIndex,
    onCapture,
    bgColor
}: {
    isExporting: boolean;
    frameIndex: number;
    onCapture: (svg: string) => void;
    bgColor: string;
}) => {
    const { scene, camera, size } = useThree();
    const lastFrameIndex = useRef(-1);

    useEffect(() => {
        if (!isExporting) {
            lastFrameIndex.current = -1;
            return;
        }

        if (frameIndex === lastFrameIndex.current) return;

        const svgString = generateSVG(scene, camera, size.width, size.height, bgColor);
        lastFrameIndex.current = frameIndex;
        onCapture(svgString);

    }, [isExporting, frameIndex, scene, camera, size, onCapture, bgColor]);

    return null;
};

// ============================================
// PRESETS
// ============================================
interface Preset {
    name: string;
    settings: Partial<EditorSettings>;
}

const PRESETS: Preset[] = [
    {
        name: 'WCM Default',
        settings: {
            bgColor: '#111111',
            overrideColorEnabled: false,
            zColor: '#ff3333',
            yColor: '#33ff33',
            xColor: '#3333ff',
            globalSpeed: 0.5,
        }
    },
    {
        name: 'Monochrome',
        settings: {
            bgColor: '#000000',
            overrideColorEnabled: true,
            overrideColor: '#ffffff',
            globalSpeed: 0.3,
        }
    },
    {
        name: 'Gold Accent',
        settings: {
            bgColor: '#0a0a0f',
            overrideColorEnabled: true,
            overrideColor: '#d4af37',
            globalSpeed: 0.4,
        }
    },
    {
        name: 'Neon Cyber',
        settings: {
            bgColor: '#050510',
            overrideColorEnabled: false,
            zColor: '#ff00ff',
            yColor: '#00ffff',
            xColor: '#ffff00',
            globalSpeed: 0.6,
        }
    },
];

// ============================================
// TYPES
// ============================================
interface EditorSettings {
    scale: number;
    strokeWidth: number;
    cornerRadius: number;
    globalSpeed: number;
    globalSpinX: number;
    globalSpinY: number;
    globalSpinZ: number;
    overrideColorEnabled: boolean;
    overrideColor: string;
    bgColor: string;

    // Ring Z
    zColor: string;
    zOffsetX: number;
    zOffsetY: number;
    zOffsetZ: number;
    zSpinX: number;
    zSpinY: number;
    zSpinZ: number;

    // Ring Y
    yColor: string;
    yOffsetX: number;
    yOffsetY: number;
    yOffsetZ: number;
    ySpinX: number;
    ySpinY: number;
    ySpinZ: number;

    // Ring X
    xColor: string;
    xOffsetX: number;
    xOffsetY: number;
    xOffsetZ: number;
    xSpinX: number;
    xSpinY: number;
    xSpinZ: number;
}

const DEFAULT_SETTINGS: EditorSettings = {
    scale: 1,
    strokeWidth: 3,
    cornerRadius: 0.2,
    globalSpeed: 0.5,
    globalSpinX: 0.0,
    globalSpinY: 1.0,
    globalSpinZ: 1.0,
    overrideColorEnabled: true,
    overrideColor: '#ffffff',
    bgColor: '#111111',

    zColor: '#ff3333',
    zOffsetX: 0,
    zOffsetY: 0,
    zOffsetZ: 90,
    zSpinX: 0,
    zSpinY: 0,
    zSpinZ: 0,

    yColor: '#33ff33',
    yOffsetX: 0,
    yOffsetY: 0,
    yOffsetZ: 0,
    ySpinX: 0,
    ySpinY: 0,
    ySpinZ: 0,

    xColor: '#3333ff',
    xOffsetX: 0,
    xOffsetY: 30,
    xOffsetZ: 0,
    xSpinX: 0,
    xSpinY: 2.0,
    xSpinZ: 0,
};

// ============================================
// CONTROL COMPONENTS
// ============================================
interface SliderControlProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => void;
}

const SliderControl = ({ label, value, min, max, step, onChange }: SliderControlProps) => (
    <div className="control-row">
        <label>{label}</label>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
        />
        <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
    </div>
);

interface ColorControlProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
}

const ColorControl = ({ label, value, onChange }: ColorControlProps) => (
    <div className="control-row">
        <label>{label}</label>
        <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
                flex: 1,
                padding: '6px 8px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontFamily: 'monospace'
            }}
        />
    </div>
);

interface ToggleControlProps {
    label: string;
    value: boolean;
    onChange: (value: boolean) => void;
}

const ToggleControl = ({ label, value, onChange }: ToggleControlProps) => (
    <div className="control-row">
        <label>{label}</label>
        <div
            className={`toggle-switch ${value ? 'active' : ''}`}
            onClick={() => onChange(!value)}
        />
    </div>
);

// ============================================
// COLLAPSIBLE SECTION
// ============================================
interface SectionProps {
    title: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}

const Section = ({ title, defaultOpen = true, children }: SectionProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="section">
            <div
                className={`section-header ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <h3>{title}</h3>
                <ChevronIcon open={isOpen} />
            </div>
            {isOpen && <div className="section-content">{children}</div>}
        </div>
    );
};

// ============================================
// RING CARD
// ============================================
interface RingCardProps {
    title: string;
    color: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

const RingCard = ({ title, color, isOpen, onToggle, children }: RingCardProps) => (
    <div className={`ring-card ${isOpen ? 'open' : ''}`}>
        <div className="ring-card-header" onClick={onToggle}>
            <div className="ring-indicator" style={{ backgroundColor: color }} />
            <span>{title}</span>
            <ChevronIcon open={isOpen} />
        </div>
        <div className="ring-card-body">
            {children}
        </div>
    </div>
);

// ============================================
// SVG PREVIEW MODAL
// ============================================
interface PreviewModalProps {
    svgString: string;
    onClose: () => void;
    onDownload: () => void;
}

const PreviewModal = ({ svgString, onClose, onDownload }: PreviewModalProps) => (
    <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
                <h2>SVG Preview</h2>
                <button className="modal-close" onClick={onClose}>✕</button>
            </div>
            <div className="modal-body">
                <div
                    className="svg-preview-container"
                    dangerouslySetInnerHTML={{ __html: svgString }}
                />
            </div>
            <div className="modal-footer">
                <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button className="btn btn-primary" onClick={onDownload}>
                    <DownloadIcon /> Download SVG
                </button>
            </div>
        </div>
    </div>
);

// ============================================
// BEZIER CURVE EDITOR
// ============================================
interface BezierCurveEditorProps {
    values: [number, number, number, number]; // [x1, y1, x2, y2]
    onChange: (values: [number, number, number, number]) => void;
}

const BezierCurveEditor = ({ values, onChange }: BezierCurveEditorProps) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [dragging, setDragging] = useState<1 | 2 | null>(null);

    const size = 160; // SVG viewBox size
    const padding = 16;
    const innerSize = size - padding * 2;

    // Convert bezier values (0-1) to SVG coordinates
    const toSvg = (x: number, y: number) => ({
        x: padding + x * innerSize,
        y: padding + (1 - y) * innerSize // Flip Y axis
    });

    // Convert SVG coordinates to bezier values (0-1)
    const fromSvg = (svgX: number, svgY: number) => ({
        x: Math.max(0, Math.min(1, (svgX - padding) / innerSize)),
        y: Math.max(0, Math.min(1, 1 - (svgY - padding) / innerSize))
    });

    const p0 = toSvg(0, 0); // Start point
    const p3 = toSvg(1, 1); // End point
    const p1 = toSvg(values[0], values[1]); // Control point 1
    const p2 = toSvg(values[2], values[3]); // Control point 2

    const handleMouseDown = (e: React.MouseEvent, handle: 1 | 2) => {
        e.preventDefault();
        setDragging(handle);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragging || !svgRef.current) return;

        const rect = svgRef.current.getBoundingClientRect();
        const scaleX = size / rect.width;
        const scaleY = size / rect.height;
        const svgX = (e.clientX - rect.left) * scaleX;
        const svgY = (e.clientY - rect.top) * scaleY;

        const { x, y } = fromSvg(svgX, svgY);

        if (dragging === 1) {
            onChange([x, y, values[2], values[3]]);
        } else {
            onChange([values[0], values[1], x, y]);
        }
    };

    const handleMouseUp = () => {
        setDragging(null);
    };

    // Generate cubic bezier path
    const curvePath = `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;

    return (
        <div className="bezier-editor">
            <svg
                ref={svgRef}
                viewBox={`0 0 ${size} ${size}`}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Grid lines */}
                <line className="bezier-grid" x1={padding} y1={padding + innerSize / 2} x2={padding + innerSize} y2={padding + innerSize / 2} />
                <line className="bezier-grid" x1={padding + innerSize / 2} y1={padding} x2={padding + innerSize / 2} y2={padding + innerSize} />

                {/* Diagonal guide (linear) */}
                <line className="bezier-diagonal" x1={p0.x} y1={p0.y} x2={p3.x} y2={p3.y} />

                {/* Control handle lines */}
                <line className="bezier-handle-line" x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} />
                <line className="bezier-handle-line" x1={p3.x} y1={p3.y} x2={p2.x} y2={p2.y} />

                {/* Bezier curve */}
                <path className="bezier-curve" d={curvePath} />

                {/* Endpoints */}
                <circle className="bezier-endpoint" cx={p0.x} cy={p0.y} r={4} />
                <circle className="bezier-endpoint" cx={p3.x} cy={p3.y} r={4} />

                {/* Draggable handles */}
                <circle
                    className="bezier-handle"
                    cx={p1.x}
                    cy={p1.y}
                    r={6}
                    onMouseDown={(e) => handleMouseDown(e, 1)}
                />
                <circle
                    className="bezier-handle"
                    cx={p2.x}
                    cy={p2.y}
                    r={6}
                    onMouseDown={(e) => handleMouseDown(e, 2)}
                />
            </svg>
        </div>
    );
};

// ============================================
// MAIN APP
// ============================================
function App() {
    const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);
    const [isPlaying, setIsPlaying] = useState(true);
    const [resetKey, setResetKey] = useState(0);
    const [cameraResetKey, setCameraResetKey] = useState(0);
    const [exportTrigger, setExportTrigger] = useState(0);

    // Ring accordion state
    const [openRing, setOpenRing] = useState<'z' | 'y' | 'x' | null>('z');

    // Animation mode
    const [animationMode, setAnimationMode] = useState<AnimationMode>('classic');

    // Preview modal
    const [previewSvg, setPreviewSvg] = useState<string | null>(null);

    // Export frames state
    const [manualTime, setManualTime] = useState<number | undefined>(undefined);
    const [isExporting, setIsExporting] = useState(false);
    const [exportCurrentFrame, setExportCurrentFrame] = useState(0);
    const [exportTotalFrames, setExportTotalFrames] = useState(60);
    const [exportDirHandle, setExportDirHandle] = useState<any>(null);
    const [frameCount, setFrameCount] = useState(60);

    // Carousel animation settings
    const [carouselDuration, setCarouselDuration] = useState(1.0); // seconds per 60° step
    const [carouselPause, setCarouselPause] = useState(0.5); // pause between steps
    const [carouselEasing, setCarouselEasing] = useState('ease-in-out'); // preset or custom
    const [customBezier, setCustomBezier] = useState<[number, number, number, number]>([0.42, 0, 0.58, 1]); // cubic-bezier values
    const [carouselDirection, setCarouselDirection] = useState<'left' | 'right'>('right'); // rotation direction

    const updateSetting = <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const applyPreset = (preset: Preset) => {
        setSettings(prev => ({ ...prev, ...preset.settings }));
    };

    const toRad = (deg: number) => deg * Math.PI / 180;

    const zRing: RingConfig = {
        color: settings.zColor,
        offset: [toRad(settings.zOffsetX), toRad(settings.zOffsetY), toRad(settings.zOffsetZ)],
        spin: [settings.zSpinX, settings.zSpinY, settings.zSpinZ]
    };

    const yRing: RingConfig = {
        color: settings.yColor,
        offset: [toRad(settings.yOffsetX), toRad(settings.yOffsetY), toRad(settings.yOffsetZ)],
        spin: [settings.ySpinX, settings.ySpinY, settings.ySpinZ]
    };

    const xRing: RingConfig = {
        color: settings.xColor,
        offset: [toRad(settings.xOffsetX), toRad(settings.xOffsetY), toRad(settings.xOffsetZ)],
        spin: [settings.xSpinX, settings.xSpinY, settings.xSpinZ]
    };

    const handleExportSVG = () => {
        setExportTrigger(prev => prev + 1);
    };

    const handleExportFrames = async () => {
        if (isExporting) return;

        try {
            // @ts-ignore - File System Access API
            const dirHandle = await window.showDirectoryPicker();
            setExportDirHandle(dirHandle);
            setExportTotalFrames(frameCount);
            setExportCurrentFrame(0);
            setIsExporting(true);
            setIsPlaying(false);
            setManualTime(0);
        } catch (err) {
            console.error("Export cancelled or failed:", err);
        }
    };

    const handleFrameCapture = useCallback(async (svgString: string) => {
        if (!isExporting || !exportDirHandle) return;

        try {
            const fileName = `frame_${exportCurrentFrame.toString().padStart(4, '0')}.svg`;
            const fileHandle = await exportDirHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(svgString);
            await writable.close();

            console.log(`Saved ${fileName}`);

            const nextFrame = exportCurrentFrame + 1;
            if (nextFrame >= exportTotalFrames) {
                setIsExporting(false);
                setManualTime(undefined);
                setExportDirHandle(null);
                setIsPlaying(true);
                alert('Export Complete!');
            } else {
                setExportCurrentFrame(nextFrame);
                const speed = (0.5 * settings.globalSpeed) || 0.001;
                const cycleDuration = (2 * Math.PI) / speed;
                const dt = cycleDuration / exportTotalFrames;
                setManualTime(nextFrame * dt);
            }
        } catch (err) {
            console.error("Error writing file:", err);
            setIsExporting(false);
            setManualTime(undefined);
        }
    }, [isExporting, exportDirHandle, exportCurrentFrame, exportTotalFrames, settings.globalSpeed]);

    const handleDownloadPreview = () => {
        if (!previewSvg) return;

        const blob = new Blob([previewSvg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `wcm-globe-${Date.now()}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setPreviewSvg(null);
    };

    return (
        <div className="app-container">
            {/* EDITOR PANEL */}
            <div className="editor-panel">
                <div className="editor-header">
                    <h1>WCM Globe Editor</h1>
                    <p>Create and export custom globe animations</p>
                </div>

                <div className="editor-content">
                    {/* ANIMATION MODE TOGGLE */}
                    <div className="mode-toggle">
                        <button
                            className={`mode-btn ${animationMode === 'classic' ? 'active' : ''}`}
                            onClick={() => setAnimationMode('classic')}
                        >
                            Classic
                        </button>
                        <button
                            className={`mode-btn ${animationMode === 'carousel' ? 'active' : ''}`}
                            onClick={() => setAnimationMode('carousel')}
                        >
                            Carousel
                        </button>
                    </div>

                    {/* PRESETS */}
                    <Section title="Presets" defaultOpen={false}>
                        <div className="presets-grid">
                            {PRESETS.map((preset) => (
                                <button
                                    key={preset.name}
                                    className="preset-btn"
                                    onClick={() => applyPreset(preset)}
                                >
                                    {preset.name}
                                </button>
                            ))}
                        </div>
                    </Section>

                    {/* GLOBAL SETTINGS */}
                    <Section title="Global Settings">
                        <SliderControl
                            label="Scale"
                            value={settings.scale}
                            min={0.1}
                            max={5}
                            step={0.1}
                            onChange={(v) => updateSetting('scale', v)}
                        />
                        <SliderControl
                            label="Stroke Width"
                            value={settings.strokeWidth}
                            min={1}
                            max={64}
                            step={0.5}
                            onChange={(v) => updateSetting('strokeWidth', v)}
                        />
                        <SliderControl
                            label="Corner Radius"
                            value={settings.cornerRadius}
                            min={0}
                            max={2}
                            step={0.05}
                            onChange={(v) => updateSetting('cornerRadius', v)}
                        />
                        {animationMode === 'classic' && (
                            <SliderControl
                                label="Speed"
                                value={settings.globalSpeed}
                                min={0}
                                max={5}
                                step={0.1}
                                onChange={(v) => updateSetting('globalSpeed', v)}
                            />
                        )}
                    </Section>

                    {/* GLOBAL SPIN */}
                    <Section title="Global Rotation" defaultOpen={false}>
                        <SliderControl
                            label="Spin X"
                            value={settings.globalSpinX}
                            min={-2}
                            max={2}
                            step={0.1}
                            onChange={(v) => updateSetting('globalSpinX', v)}
                        />
                        <SliderControl
                            label="Spin Y"
                            value={settings.globalSpinY}
                            min={-2}
                            max={2}
                            step={0.1}
                            onChange={(v) => updateSetting('globalSpinY', v)}
                        />
                        <SliderControl
                            label="Spin Z"
                            value={settings.globalSpinZ}
                            min={-2}
                            max={2}
                            step={0.1}
                            onChange={(v) => updateSetting('globalSpinZ', v)}
                        />
                    </Section>

                    {/* COLORS */}
                    <Section title="Colors">
                        <ColorControl
                            label="Background"
                            value={settings.bgColor}
                            onChange={(v) => updateSetting('bgColor', v)}
                        />
                        <ToggleControl
                            label="Single Color"
                            value={settings.overrideColorEnabled}
                            onChange={(v) => updateSetting('overrideColorEnabled', v)}
                        />
                        {settings.overrideColorEnabled && (
                            <ColorControl
                                label="Globe Color"
                                value={settings.overrideColor}
                                onChange={(v) => updateSetting('overrideColor', v)}
                            />
                        )}
                    </Section>

                    {/* RING CONTROLS - Only show in classic mode */}
                    {animationMode === 'classic' && (
                        <Section title="Ring Colors & Spin">
                            <div className="ring-controls">
                                {/* Z-Axis Ring */}
                                <RingCard
                                    title="Z-Axis Ring (XY)"
                                    color={settings.zColor}
                                    isOpen={openRing === 'z'}
                                    onToggle={() => setOpenRing(openRing === 'z' ? null : 'z')}
                                >
                                    <ColorControl
                                        label="Color"
                                        value={settings.zColor}
                                        onChange={(v) => updateSetting('zColor', v)}
                                    />
                                    <SliderControl
                                        label="Offset X°"
                                        value={settings.zOffsetX}
                                        min={0}
                                        max={360}
                                        step={1}
                                        onChange={(v) => updateSetting('zOffsetX', v)}
                                    />
                                    <SliderControl
                                        label="Offset Y°"
                                        value={settings.zOffsetY}
                                        min={0}
                                        max={360}
                                        step={1}
                                        onChange={(v) => updateSetting('zOffsetY', v)}
                                    />
                                    <SliderControl
                                        label="Offset Z°"
                                        value={settings.zOffsetZ}
                                        min={0}
                                        max={360}
                                        step={1}
                                        onChange={(v) => updateSetting('zOffsetZ', v)}
                                    />
                                    <SliderControl
                                        label="Spin X"
                                        value={settings.zSpinX}
                                        min={0}
                                        max={5}
                                        step={0.1}
                                        onChange={(v) => updateSetting('zSpinX', v)}
                                    />
                                    <SliderControl
                                        label="Spin Y"
                                        value={settings.zSpinY}
                                        min={0}
                                        max={5}
                                        step={0.1}
                                        onChange={(v) => updateSetting('zSpinY', v)}
                                    />
                                    <SliderControl
                                        label="Spin Z"
                                        value={settings.zSpinZ}
                                        min={0}
                                        max={5}
                                        step={0.1}
                                        onChange={(v) => updateSetting('zSpinZ', v)}
                                    />
                                </RingCard>

                                {/* Y-Axis Ring */}
                                <RingCard
                                    title="Y-Axis Ring (XZ)"
                                    color={settings.yColor}
                                    isOpen={openRing === 'y'}
                                    onToggle={() => setOpenRing(openRing === 'y' ? null : 'y')}
                                >
                                    <ColorControl
                                        label="Color"
                                        value={settings.yColor}
                                        onChange={(v) => updateSetting('yColor', v)}
                                    />
                                    <SliderControl
                                        label="Offset X°"
                                        value={settings.yOffsetX}
                                        min={0}
                                        max={360}
                                        step={1}
                                        onChange={(v) => updateSetting('yOffsetX', v)}
                                    />
                                    <SliderControl
                                        label="Offset Y°"
                                        value={settings.yOffsetY}
                                        min={0}
                                        max={360}
                                        step={1}
                                        onChange={(v) => updateSetting('yOffsetY', v)}
                                    />
                                    <SliderControl
                                        label="Offset Z°"
                                        value={settings.yOffsetZ}
                                        min={0}
                                        max={360}
                                        step={1}
                                        onChange={(v) => updateSetting('yOffsetZ', v)}
                                    />
                                    <SliderControl
                                        label="Spin X"
                                        value={settings.ySpinX}
                                        min={0}
                                        max={5}
                                        step={0.1}
                                        onChange={(v) => updateSetting('ySpinX', v)}
                                    />
                                    <SliderControl
                                        label="Spin Y"
                                        value={settings.ySpinY}
                                        min={0}
                                        max={5}
                                        step={0.1}
                                        onChange={(v) => updateSetting('ySpinY', v)}
                                    />
                                    <SliderControl
                                        label="Spin Z"
                                        value={settings.ySpinZ}
                                        min={0}
                                        max={5}
                                        step={0.1}
                                        onChange={(v) => updateSetting('ySpinZ', v)}
                                    />
                                </RingCard>

                                {/* X-Axis Ring */}
                                <RingCard
                                    title="X-Axis Ring (YZ)"
                                    color={settings.xColor}
                                    isOpen={openRing === 'x'}
                                    onToggle={() => setOpenRing(openRing === 'x' ? null : 'x')}
                                >
                                    <ColorControl
                                        label="Color"
                                        value={settings.xColor}
                                        onChange={(v) => updateSetting('xColor', v)}
                                    />
                                    <SliderControl
                                        label="Offset X°"
                                        value={settings.xOffsetX}
                                        min={0}
                                        max={360}
                                        step={1}
                                        onChange={(v) => updateSetting('xOffsetX', v)}
                                    />
                                    <SliderControl
                                        label="Offset Y°"
                                        value={settings.xOffsetY}
                                        min={0}
                                        max={360}
                                        step={1}
                                        onChange={(v) => updateSetting('xOffsetY', v)}
                                    />
                                    <SliderControl
                                        label="Offset Z°"
                                        value={settings.xOffsetZ}
                                        min={0}
                                        max={360}
                                        step={1}
                                        onChange={(v) => updateSetting('xOffsetZ', v)}
                                    />
                                    <SliderControl
                                        label="Spin X"
                                        value={settings.xSpinX}
                                        min={0}
                                        max={5}
                                        step={0.1}
                                        onChange={(v) => updateSetting('xSpinX', v)}
                                    />
                                    <SliderControl
                                        label="Spin Y"
                                        value={settings.xSpinY}
                                        min={0}
                                        max={5}
                                        step={0.1}
                                        onChange={(v) => updateSetting('xSpinY', v)}
                                    />
                                    <SliderControl
                                        label="Spin Z"
                                        value={settings.xSpinZ}
                                        min={0}
                                        max={5}
                                        step={0.1}
                                        onChange={(v) => updateSetting('xSpinZ', v)}
                                    />
                                </RingCard>
                            </div>
                        </Section>
                    )}

                    {/* CAROUSEL SETTINGS - Only show in carousel mode */}
                    {animationMode === 'carousel' && (
                        <Section title="Carousel Animation">
                            <SliderControl
                                label="Animation Speed (s)"
                                value={carouselDuration}
                                min={0.2}
                                max={3.0}
                                step={0.1}
                                onChange={(v) => setCarouselDuration(v)}
                            />
                            <SliderControl
                                label="Pause Duration (s)"
                                value={carouselPause}
                                min={0}
                                max={2.0}
                                step={0.1}
                                onChange={(v) => setCarouselPause(v)}
                            />
                            <div className="control-group">
                                <label className="control-label">Direction</label>
                                <div className="mode-toggle" style={{ marginBottom: 0 }}>
                                    <button
                                        className={`mode-btn ${carouselDirection === 'left' ? 'active' : ''}`}
                                        onClick={() => setCarouselDirection('left')}
                                    >
                                        ← Left
                                    </button>
                                    <button
                                        className={`mode-btn ${carouselDirection === 'right' ? 'active' : ''}`}
                                        onClick={() => setCarouselDirection('right')}
                                    >
                                        Right →
                                    </button>
                                </div>
                            </div>
                            <div className="control-group">
                                <label className="control-label">Easing</label>
                                <select
                                    className="easing-select"
                                    value={carouselEasing}
                                    onChange={(e) => setCarouselEasing(e.target.value)}
                                >
                                    <option value="linear">Linear</option>
                                    <option value="ease-in">Ease In</option>
                                    <option value="ease-out">Ease Out</option>
                                    <option value="ease-in-out">Ease In-Out</option>
                                    <option value="custom">Custom</option>
                                </select>
                            </div>
                            {carouselEasing === 'custom' && (
                                <div className="control-group">
                                    <label className="control-label">Custom Curve</label>
                                    <BezierCurveEditor
                                        values={customBezier}
                                        onChange={setCustomBezier}
                                    />
                                    <div className="bezier-values">
                                        <input
                                            type="number"
                                            className="bezier-value-input"
                                            value={customBezier[0].toFixed(2)}
                                            step={0.01}
                                            min={0}
                                            max={1}
                                            onChange={(e) => setCustomBezier([parseFloat(e.target.value) || 0, customBezier[1], customBezier[2], customBezier[3]])}
                                        />
                                        <input
                                            type="number"
                                            className="bezier-value-input"
                                            value={customBezier[1].toFixed(2)}
                                            step={0.01}
                                            min={0}
                                            max={1}
                                            onChange={(e) => setCustomBezier([customBezier[0], parseFloat(e.target.value) || 0, customBezier[2], customBezier[3]])}
                                        />
                                        <input
                                            type="number"
                                            className="bezier-value-input"
                                            value={customBezier[2].toFixed(2)}
                                            step={0.01}
                                            min={0}
                                            max={1}
                                            onChange={(e) => setCustomBezier([customBezier[0], customBezier[1], parseFloat(e.target.value) || 0, customBezier[3]])}
                                        />
                                        <input
                                            type="number"
                                            className="bezier-value-input"
                                            value={customBezier[3].toFixed(2)}
                                            step={0.01}
                                            min={0}
                                            max={1}
                                            onChange={(e) => setCustomBezier([customBezier[0], customBezier[1], customBezier[2], parseFloat(e.target.value) || 0])}
                                        />
                                    </div>
                                    <small style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '4px', display: 'block', textAlign: 'center' }}>
                                        Drag the handles or edit values (x1, y1, x2, y2)
                                    </small>
                                </div>
                            )}
                        </Section>
                    )}

                    {/* ANIMATION EXPORT */}
                    <Section title="Export Animation" defaultOpen={false}>
                        <SliderControl
                            label="Frame Count"
                            value={frameCount}
                            min={10}
                            max={360}
                            step={10}
                            onChange={(v) => setFrameCount(v)}
                        />
                        <button
                            className="btn btn-secondary btn-full"
                            onClick={handleExportFrames}
                            disabled={isExporting}
                            style={{ marginTop: '8px' }}
                        >
                            <FolderIcon /> Export {frameCount} Frames
                        </button>

                        {isExporting && (
                            <div className="export-progress">
                                <div className="progress-label">
                                    <span>Exporting...</span>
                                    <span>{exportCurrentFrame + 1} / {exportTotalFrames}</span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${((exportCurrentFrame + 1) / exportTotalFrames) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </Section>
                </div>

                {/* ACTION BAR */}
                <div className="action-bar">
                    <div className="button-group">
                        <button className="btn btn-secondary" onClick={() => setResetKey(k => k + 1)}>
                            <ResetIcon /> Reset
                        </button>
                        <button className="btn btn-secondary" onClick={() => setCameraResetKey(k => k + 1)}>
                            Reset Camera
                        </button>
                    </div>
                    <button className="btn btn-primary btn-full" onClick={handleExportSVG}>
                        <DownloadIcon /> Export SVG
                    </button>
                </div>
            </div>

            {/* CANVAS AREA */}
            <div className="canvas-area">
                <div className="canvas-wrapper">
                    <Canvas
                        orthographic
                        camera={{ position: [0, 0, 100], zoom: 50, near: 0.1, far: 1000 }}
                        dpr={[1, 2]}
                    >
                        <color attach="background" args={[settings.bgColor]} />
                        <ambientLight intensity={0.5} />
                        <OrbitControls makeDefault enableZoom={true} enablePan={false} />
                        <CameraHelper resetKey={cameraResetKey} />

                        <FrameExporter
                            isExporting={isExporting}
                            frameIndex={exportCurrentFrame}
                            onCapture={handleFrameCapture}
                            bgColor={settings.bgColor}
                        />

                        {animationMode === 'classic' ? (
                            <GlobeLogo
                                key={resetKey}
                                isPlaying={isPlaying}
                                scale={settings.scale}
                                strokeWidth={settings.strokeWidth}
                                cornerRadius={settings.cornerRadius}
                                globalSpeed={settings.globalSpeed}
                                globalSpin={[settings.globalSpinX, settings.globalSpinY, settings.globalSpinZ]}
                                overrideColor={settings.overrideColorEnabled ? settings.overrideColor : null}
                                manualTime={manualTime}
                                zRing={zRing}
                                yRing={yRing}
                                xRing={xRing}
                            />
                        ) : (
                            <CarouselGlobeLogo
                                key={resetKey}
                                isPlaying={isPlaying}
                                scale={settings.scale}
                                strokeWidth={settings.strokeWidth}
                                cornerRadius={settings.cornerRadius}
                                color={settings.overrideColorEnabled ? settings.overrideColor : '#ffffff'}
                                bgColor={settings.bgColor}
                                animationDuration={carouselDuration}
                                pauseDuration={carouselPause}
                                easing={carouselEasing}
                                customBezier={customBezier}
                                direction={carouselDirection}
                            />
                        )}
                        <SVGExporter trigger={exportTrigger} bgColor={settings.bgColor} />
                    </Canvas>
                </div>

                {/* CANVAS CONTROLS */}
                <div className="canvas-controls">
                    <button className="btn btn-icon" onClick={() => setIsPlaying(!isPlaying)}>
                        {isPlaying ? <PauseIcon /> : <PlayIcon />}
                    </button>
                    <button className="btn btn-icon" onClick={() => setResetKey(k => k + 1)}>
                        <ResetIcon />
                    </button>
                </div>

                <div className="status-bar">
                    {isPlaying ? 'Playing' : 'Paused'} • Zoom with scroll
                </div>
            </div>

            {/* PREVIEW MODAL */}
            {previewSvg && (
                <PreviewModal
                    svgString={previewSvg}
                    onClose={() => setPreviewSvg(null)}
                    onDownload={handleDownloadPreview}
                />
            )}
        </div>
    );
}

export default App;
