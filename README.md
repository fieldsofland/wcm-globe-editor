# WCM Globe Editor

A visual editor and SVG creator for the WCM Globe Animation. This tool allows you to customize and export the globe logo in various styles.

## Features

- **Real-time Preview**: See changes instantly as you adjust parameters
- **Visual Controls**: User-friendly sliders and color pickers
- **Presets**: Quick-apply pre-configured styles (WCM Default, Monochrome, Gold Accent, Neon Cyber)
- **SVG Export**: Export the current frame as a high-quality SVG file
- **Animation Export**: Export multiple frames as SVG files for creating animations
- **Full Customization**:
  - Scale and stroke width
  - Corner radius (sharp to rounded)
  - Animation speed
  - Global rotation settings
  - Individual ring colors
  - Ring offset and spin values
  - Background color

## Quick Start

```bash
cd "/Users/matt/AntiGravity/WCM Website Test/WCM Globe Editor"
npm install    # First time only
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage Guide

### Adjusting Settings
1. Use the left panel to adjust globe parameters
2. Click on section headers to expand/collapse them
3. Changes are applied in real-time to the canvas

### Exporting an SVG
1. Position the globe as desired (you can pause the animation)
2. Click "Export Current Frame" at the bottom of the left panel
3. The SVG file will download automatically

### Exporting an Animation
1. Expand the "Export Animation" section
2. Set the desired frame count (default: 60)
3. Click "Export Frames"
4. Select a destination folder
5. Wait for all frames to export

### Using Presets
1. Expand the "Presets" section
2. Click on any preset to apply it instantly
3. Further customize from there if needed

## Controls

### Canvas Controls
- **Play/Pause**: Toggle animation playback
- **Reset**: Reset the globe rotation
- **Scroll**: Zoom in/out
- **Drag**: Rotate the view

### Keyboard Shortcuts
- None currently implemented

## Technical Details

- Built with React + TypeScript + Vite
- 3D rendering with Three.js via React Three Fiber
- SVG export preserves vector quality at any resolution
