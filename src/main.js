// App initialization
window.onload = () => {
  // Precarga de imágenes para evitar problemas de visualización
  Promise.all([
    loadImage("/los-planetas/public/img/space_helmet_1.png"),
    loadImage("/los-planetas/public/img/frame.webp")
  ]).then(([helmetImage, frameImage]) => {
    // Almacenar imágenes precargadas
    window.spaceHelmetImg = helmetImage;
    window.frameImg = frameImage;
    detect().then(initializeTriggerPhotoButton);
  }).catch(error => {
    console.error("Error al cargar las imágenes:", error);
  });
};

// Función para cargar imágenes de forma asíncrona
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src}`));
    img.src = src;
  });
}

// Cache de elementos DOM
const elements = {
  canvas: document.querySelector("canvas"),
  video: document.createElement("video"),
  container: document.querySelector(".container"),
  trigger: document.querySelector("#trigger"),
  audio: document.querySelector("audio")
};

// Constantes para landmarks faciales
const LANDMARKS = {
  LEFT_EYE: 33,
  RIGHT_EYE: 263
};

// Configuración para FaceMesh
const FACE_MESH_CONFIG = {
  maxNumFaces: 5,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
};

async function detect() {
  try {
    // Obtener acceso a la cámara con la resolución óptima
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 3840 }, // 4K si es compatible
        height: { ideal: 2160 }, // 4K si es compatible
      },
    });

    // Configurar el video
    elements.video.srcObject = mediaStream;
    elements.video.autoplay = true;
    
    // Esperar a que el video esté listo
    await new Promise(resolve => {
      elements.video.onloadedmetadata = () => {
        elements.canvas.width = elements.video.videoWidth;
        elements.canvas.height = elements.video.videoHeight;
        elements.container.style["max-width"] = `${elements.video.videoWidth}px`;
        resolve();
      };
    });

    // Inicializar FaceMesh
    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions(FACE_MESH_CONFIG);

    // Obtener contexto del canvas una sola vez para mejorar rendimiento
    const context = elements.canvas.getContext("2d");
    
    // Función para dibujar la escena
    faceMesh.onResults((results) => {
      // Limpiar canvas y dibujar video
      context.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
      context.drawImage(elements.video, 0, 0, elements.canvas.width, elements.canvas.height);
      
      // Dibujar cascos si hay rostros detectados
      if (results.multiFaceLandmarks) {
        drawHelmetsOn(context, results.multiFaceLandmarks);
      }
      
      // Dibujar el marco por encima de todo
      context.drawImage(window.frameImg, 0, 0, elements.canvas.width, elements.canvas.height);
    });

    // Optimizar el procesamiento de frames con throttling para mejorar rendimiento
    let lastTimestamp = 0;
    const frameInterval = 1000 / 30; // Limitar a 30 FPS
    
    async function processFrame(timestamp) {
      // Controlar la tasa de frames
      if (!lastTimestamp || timestamp - lastTimestamp >= frameInterval) {
        await faceMesh.send({ image: elements.video });
        lastTimestamp = timestamp;
      }
      requestAnimationFrame(processFrame);
    }

    requestAnimationFrame(processFrame);
  } catch (error) {
    console.error("Error en la detección facial:", error);
  }
}

// Función optimizada para dibujar los cascos
function drawHelmetsOn(context, faces) {
  if (!faces || !faces.length) return;
  
  faces.forEach(landmarks => {
    // Obtener el cuadro delimitador de la cara
    const faceBox = getBoundingBox(landmarks);
    // Dibujar el casco
    drawHelmetOn(context, faceBox, landmarks);
  });
}

// Calcular el cuadro delimitador de la cara
function getBoundingBox(landmarks) {
  const xs = landmarks.map(pt => pt.x * elements.canvas.width);
  const ys = landmarks.map(pt => pt.y * elements.canvas.height);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  const width = Math.max(...xs) - x;
  const height = Math.max(...ys) - y;
  return { x, y, width, height };
}

// Dibujar el casco en una cara
function drawHelmetOn(context, face, landmarks) {
  const { x, y, width, height } = face;
  const helmetScale = 4.6;

  // Calcular distancia entre ojos
  const leftEye = landmarks[LANDMARKS.LEFT_EYE];
  const rightEye = landmarks[LANDMARKS.RIGHT_EYE];
  
  const eyeDistanceX = (rightEye.x - leftEye.x) * elements.canvas.width;
  const eyeDistanceY = (rightEye.y - leftEye.y) * elements.canvas.height;
  const eyeDistance = Math.sqrt(eyeDistanceX * eyeDistanceX + eyeDistanceY * eyeDistanceY);
  
  // Calcular dimensiones del casco
  const helmetWidth = eyeDistance * helmetScale;
  const aspectRatio = window.spaceHelmetImg.width / window.spaceHelmetImg.height;
  const helmetHeight = helmetWidth / aspectRatio;

  // Dibujar el casco
  context.drawImage(
    window.spaceHelmetImg,
    x + width / 2 - helmetWidth / 2,
    y + height / 2 - helmetHeight / 2,
    helmetWidth,
    helmetHeight
  );
}

// Inicializar el botón de captura de foto
function initializeTriggerPhotoButton() {
  elements.trigger.addEventListener("click", () => {
    // Reproducir sonido de obturador
    elements.audio.play();
    
    // Capturar y descargar la imagen
    const output = elements.canvas.toDataURL("image/png", 1.0);
    const link = document.createElement("a");
    link.href = output;
    link.download = "photo.png";
    link.click();
  });
}