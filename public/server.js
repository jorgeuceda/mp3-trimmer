const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
// Set ffmpeg/ffprobe binary paths for environments where they are not in $PATH
const ffmpegPath = '/opt/homebrew/bin/ffmpeg'; // Homebrew default on Apple Silicon
const ffprobePath = '/opt/homebrew/bin/ffprobe';
if (require('fs').existsSync(ffmpegPath)) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}
if (require('fs').existsSync(ffprobePath)) {
  ffmpeg.setFfprobePath(ffprobePath);
}
const path = require('path');
const os = require('os');
const fs = require('fs');

const app = express();
const upload = multer({ dest: os.tmpdir() }); // store uploaded files in temp directory

// Serve static files (index.html, etc.)
app.use(express.static(__dirname));

app.post('/trim', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No audio file uploaded');
  }
  function parseTime(value) {
    if (typeof value === 'string' && value.includes(':')) {
      const [minPart, secPart] = value.split(':');
      const minutes = parseFloat(minPart);
      const seconds = parseFloat(secPart);
      if (isNaN(minutes) || isNaN(seconds)) return NaN;
      return minutes * 60 + seconds;
    }
    return parseFloat(value);
  }
  // Combine minutes and seconds fields into total seconds
  // Combine minutes and seconds fields into total seconds, handling comma as decimal separator
  const startMin = parseFloat(req.body.start_min) || 0;
  const startSec = parseFloat((req.body.start_sec || '0').replace(',', '.')) || 0;
  const endMin = parseFloat(req.body.end_min) || 0;
  const endSec = parseFloat((req.body.end_sec || '0').replace(',', '.')) || 0;
  const start = startMin * 60 + startSec;
  const end = endMin * 60 + endSec;
  if (isNaN(start) || isNaN(end) || end <= start) {
    return res.status(400).send('Invalid start/end times');
  }
  const duration = end - start;
  const inputPath = req.file.path;
  const outputPath = path.join(os.tmpdir(), `trimmed-${Date.now()}.mp3`);

  ffmpeg(inputPath)
    .setStartTime(start)
    .setDuration(duration)
    .output(outputPath)
    .on('end', () => {
      // Stream the trimmed file back to the client
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', 'attachment; filename=trimmed.mp3');
      const readStream = fs.createReadStream(outputPath);
      readStream.pipe(res);
      // Cleanup temp files after response finishes
      readStream.on('close', () => {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
      });
    })
    .on('error', (err) => {
      console.error('FFmpeg error:', err);
      // Cleanup uploaded file on error
      fs.unlinkSync(inputPath);
      res.status(500).send('Error processing audio file');
    })
    .run();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
