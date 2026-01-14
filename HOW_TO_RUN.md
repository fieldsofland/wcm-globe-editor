# Beginner's Guide: How to Run the WCM Globe Editor

This guide is written for someone with no prior experience using the Terminal. Follow these steps exactly to discover and run the editor on your Mac.

---

### Step 1: Open the "Terminal" App
1. Look at the very top-right corner of your screen and click the **Magnifying Glass icon** (Spotlight Search).
2. Type the word `Terminal` into the search bar.
3. Press the **Return** (or Enter) key on your keyboard.
4. A window will pop up with a command prompt (usually white text on a black background, or black text on white). This is the Terminal.

### Step 2: Go to the Project Folder
We need to tell the Terminal where the project files are located.

1. In Terminal, navigate to the folder where you downloaded/cloned this project:
   ```bash
   cd path/to/wcm-globe-editor
   ```
   (Replace `path/to/wcm-globe-editor` with the actual folder location)
2. Press the **Return** key.

### Step 3: Install Requirements (First Time Only)
*If you have already run this project before, you can skip this step and go to Step 4.*

1. Copy this command:
   ```bash
   npm install
   ```
2. Paste it into the Terminal and press **Return**.
3. You might see a lot of text scrolling on the screen. This is normal.
4. Wait for the text to stop moving and for the command prompt to appear again.

### Step 4: Turn on the App
Now we will start the editor server.

1. Copy this command:
   ```bash
   npm run dev
   ```
2. Paste it into the Terminal and press **Return**.
3. You will see a message saying something like "VITE ... ready in ... ms". This means it is working!

### Step 5: View the Editor
1. Open your web browser (like **Safari**, **Chrome**, or **Firefox**).
2. In the address bar at the top (where you usually type google.com), type exactly this:
   `http://localhost:5173`
3. Press **Return**.
4. You should now see the WCM Globe Editor running on your screen.

---

## Using the Editor

### The Interface
- **Left Panel**: Contains all the controls for customizing the globe
- **Right Side**: Shows the live 3D preview of your globe

### Customizing Your Globe
1. **Presets**: Click on a preset to quickly apply a pre-made style
2. **Global Settings**: Adjust the size, stroke width, corner roundness, and speed
3. **Ring Colors & Spin**: Click on each ring card to expand it and customize individual ring settings
4. **Color Override**: Enable this to make all rings the same color

### Exporting Your Work

#### Export a Single Frame (SVG)
1. Position the globe the way you want it
2. Click the **Play/Pause button** at the bottom of the canvas to freeze the animation
3. Click **"Export Current Frame"** at the bottom of the left panel
4. The SVG file will be saved to your Downloads folder

#### Export Animation Frames
1. Expand the **"Export Animation"** section
2. Choose how many frames you want (more frames = smoother animation)
3. Click **"Export [X] Frames"**
4. A folder picker will appear - choose where to save the files
5. Wait for all frames to export (a progress bar will show)

---

### How to Stop It
When you are finished using the editor:

1. Click on the **Terminal** window again to bring it to the front.
2. Press **Control + C** on your keyboard (hold the **Control** key and tap **C**).
3. The process will stop. You can now close the Terminal window.

---

## TL;DR for Developers
**Commands:**
```bash
cd path/to/wcm-globe-editor
npm install    # First time only
npm run dev
```

**Local Host:**
[http://localhost:5173](http://localhost:5173)

**Stop Server:**
`Ctrl + C`
