import spaceHelmet from "./../public/img/space_helmet_1.png";
import frame from "./../public/img/frame.webp";

// App initialization
window.onload = () => {
  detect().then(initializeTriggerPhotoButton);
};

// Image sources
const spaceHelmetImg = new Image();
spaceHelmetImg.src = spaceHelmet;

const frameImg = new Image();
frameImg.src = frame;

// DOM elements
const canvas = document.querySelector("canvas");
const video = document.createElement("video");

async function detect() {
  const mediaStream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "user",
      width: { ideal: 4096 },
      height: { ideal: 2160 },
    },
  });

  video.srcObject = mediaStream;
  video.autoplay = true;
  video.onloadedmetadata = () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  };

  const smoothedFaces = new Map();
  const newSmoothedFaces = new Map();

  const faceDetector = new FaceDetector({ fastMode: false });
  const context = canvas.getContext("2d");
  function render() {
    faceDetector
      .detect(video)
      .then((faces) => {
        const { width, height } = canvas;
        context.drawImage(video, 0, 0, width, height);
        drawHelmetsOn(faces);
        context.drawImage(frameImg, 0, 0, width, height);
      })
      .catch(console.error);
  }

  function drawHelmetsOn(faces) {
    faces.forEach((face) => {
      const smoothed = smoothMovement(face, smoothedFaces, newSmoothedFaces);
      drawHelmetOn(smoothed);
    });
    smoothedFaces.clear();
    newSmoothedFaces.forEach((value, key) => smoothedFaces.set(key, value));

    function smoothMovement(face, prevFaces, nextFaces) {
      const smoothingFactor = 0.2;
      const { width, height, x, y } = face.boundingBox;
      const matchKey = matchFaceToPrevious(face);
      const prev = matchKey ? prevFaces.get(matchKey) : { x, y, width, height };

      const smoothed = {
        x: smooth(x, prev.x),
        y: smooth(y, prev.y),
        width: smooth(width, prev.width),
        height: smooth(height, prev.height),
      };

      nextFaces.set(matchKey || Symbol(), smoothed);
      return smoothed;

      function smooth(value, previousValue) {
        return previousValue === undefined
          ? value
          : previousValue * (1 - smoothingFactor) + value * smoothingFactor;
      }

      function matchFaceToPrevious(face) {
        let bestMatchKey = null;
        let bestMatchDistance = Infinity;

        prevFaces.forEach((prevFace, key) => {
          const dx = prevFace.x - face.boundingBox.x;
          const dy = prevFace.y - face.boundingBox.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < bestMatchDistance && distance < 50) {
            bestMatchDistance = distance;
            bestMatchKey = key;
          }
        });

        return bestMatchKey;
      }
    }

    function drawHelmetOn(face) {
      const { x, y, width, height } = face;
      const helmetScale = 2.8;
      const helmetWidth = width * helmetScale;
      const helmetHeight = height * helmetScale;

      context.drawImage(
        spaceHelmetImg,
        x + width / 2 - helmetWidth / 2,
        y + height / 2 - helmetHeight / 2,
        helmetWidth,
        helmetHeight
      );
    }
  }

  (function renderLoop() {
    requestAnimationFrame(renderLoop);
    render();
  })();
}

function initializeTriggerPhotoButton() {
  document.querySelector("#trigger").addEventListener("click", () => {
    const audio = document.querySelector("audio");
    audio.play();
    const output = canvas.toDataURL("image/jpeg");
    const link = document.createElement("a");
    link.href = output;
    link.download = "photo.jpeg";
    link.click();
  });
}
