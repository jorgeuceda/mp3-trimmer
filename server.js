const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

// Endpoint to handle MP3 trimming
// Expects fields: start (seconds), end (seconds)
app.post('/trim', upload.single('audio'), (req, res) => {
  const { start, end } = req.body;
  const startSec = parseFloat(start);
  const endSec = parseFloat(end);
  if (isNaN(startSec) || isNaN(endSec) || endSec <= startSec) {
    return res.status(400).send('Invalid start/end times');
  }

  const inputPath = req.file.path;
  const outputName = `trimmed-${Date.now()}.mp3`;
  const outputPath = path.join('outputs', outputName);

  // Ensure output directory exists
  fs.mkdirSync('outputs', { recursive: true });

  ffmpeg(inputPath)
    .setStartTime(startSec)
    .setDuration(endSec - startSec)
    .output(outputPath)
    .on('end', () => {
      // Remove the uploaded original file
      fs.unlinkSync(inputPath);
      res.download(outputPath, outputName, err => {
        if (err) {
          console.error('Download error:', err);
        }
        // Cleanup the trimmed file after download
        fs.unlinkSync(outputPath);
      });
    })
    .on('error', err => {
      console.error('FFmpeg error:', err);
      res.status(500).send('Trimming failed');
    })
    .run();
});

app.listen(3000, () => {
  console.log('MP3 Trimmer listening on http://localhost:3000');
});
