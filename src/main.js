import spaceHelmet from "./../public/img/space_helmet_1.png";
import frame from "./../public/img/frame.webp";
import { FaceMesh } from "@mediapipe/face_mesh";
import "@tensorflow/tfjs";

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
canvas.style.width = "100%";
canvas.style.height = "100%";
const video = document.createElement("video");

async function detect() {
  const mediaStream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "user",
      width: { ideal: 3840 }, // 4K si es compatible
      height: { ideal: 2160 }, // 4K si es compatible
    },
  });

  video.srcObject = mediaStream;
  video.autoplay = true;
  video.onloadedmetadata = () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  };

  const faceMesh = new FaceMesh({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
  faceMesh.setOptions({
    maxNumFaces: 5,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  faceMesh.onResults(onResults);

  const context = canvas.getContext("2d");
  function onResults(results) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    drawHelmetsOn(results.multiFaceLandmarks);
    context.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
  }

  function drawHelmetsOn(faces) {
    if (!faces) return;
    faces.forEach((landmarks) => {
      const faceBox = getBoundingBox(landmarks);
      drawHelmetOn(faceBox, landmarks);
    });
  }

  function getBoundingBox(landmarks) {
    const xs = landmarks.map((pt) => pt.x * canvas.width);
    const ys = landmarks.map((pt) => pt.y * canvas.height);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    const width = Math.max(...xs) - x;
    const height = Math.max(...ys) - y;
    return { x, y, width, height };
  }

  function drawHelmetOn(face, landmarks) {
    const { x, y, width, height } = face;
    const helmetScale = 4.6;
    
    const leftEye = landmarks[33]; // Índice aproximado del ojo izquierdo
    const rightEye = landmarks[263]; // Índice aproximado del ojo derecho
    const eyeDistance = Math.sqrt(
      Math.pow((rightEye.x - leftEye.x) * canvas.width, 2) +
      Math.pow((rightEye.y - leftEye.y) * canvas.height, 2)
    );
    const helmetWidth = eyeDistance * helmetScale;
    const aspectRatio = spaceHelmetImg.width / spaceHelmetImg.height;
    const helmetHeight = helmetWidth / aspectRatio;

    context.drawImage(
      spaceHelmetImg,
      x + width / 2 - helmetWidth / 2,
      y + height / 2 - helmetHeight / 2,
      helmetWidth,
      helmetHeight
    );
  }

  async function processFrame() {
    await faceMesh.send({ image: video });
    requestAnimationFrame(processFrame);
  }

  processFrame();
}

function initializeTriggerPhotoButton() {
  document.querySelector("#trigger").addEventListener("click", () => {
    const audio = document.querySelector("audio");
    audio.play();
    const output = canvas.toDataURL("image/png"); // Exportar en PNG para mayor calidad
    const link = document.createElement("a");
    link.href = output;
    link.download = "photo.png";
    link.click();
  });
}
