# MP3 Trimmer

A tiny web application that lets you upload an MP3 file, specify start and end times, and download a trimmed version of the audio. It consists of a static front‑end (HTML + JavaScript) and a lightweight Express server that uses **ffmpeg** to perform the actual trimming.

## How it works

1. **Front‑end** (`index.html`)
   - Presents a simple form with file picker and start/end fields (minutes + seconds).
   - On submit the file and timestamps are sent via `POST /trim` as `multipart/form-data`.
   - When the server responds with the trimmed file, the browser automatically triggers a download.

2. **Back‑end** (`server.js`)
   - Built with **Express** and **multer** for handling file uploads.
   - Uses **fluent‑ffmpeg** (wrapping `ffmpeg`) to cut the audio between the supplied start and end times.
   - Streams the resulting MP3 back to the client and cleans up temporary files.

## Prerequisites

- **Node.js** (v14+ recommended)
- **npm** (comes with Node)
- **ffmpeg** and **ffprobe** installed and available in your `PATH` (or adjust the static paths in `server.js`). On macOS with Homebrew you can install them with:

```bash
brew install ffmpeg
```

## Installation

```bash
# Clone the repository
git clone https://github.com/your-org/splice.git
cd splice/public

# Install JavaScript dependencies
npm install
```

## Development / Running the app

```bash
# Start the server (default port 3000)
npm start   # or: node server.js
```

Open your browser and navigate to `http://localhost:3000`. You should see the **MP3 Trimmer** UI.

## API endpoint

- `POST /trim`
  - **Headers**: `Content-Type: multipart/form-data`
  - **Form fields**:
    - `audio` – the MP3 file to trim (required)
    - `start_min` / `start_sec` – start time (required)
    - `end_min`   / `end_sec`   – end time (required)
  - **Response**: the trimmed MP3 file streamed back with `Content‑Disposition: attachment; filename=trimmed.mp3`.

## Building for production

If you want to serve the app behind a reverse proxy or as a Docker container, simply copy the files and run `node server.js` on the target host. The server statically serves `index.html` and related assets, so no additional build step is required.

## License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

---