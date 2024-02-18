import { useRef, useEffect, useState } from 'react'
import './App.css'
import * as faceapi from 'face-api.js'

function App() {
  const videoRef = useRef()
  const canvasRef = useRef()
  const [message, setMessage] = useState('')
  const [mouthMessage, setMouthMessage] = useState('')

  useEffect(() => {
    startVideo()
    loadModels()
  }, [])

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((currentStream) => {
        videoRef.current.srcObject = currentStream
      })
      .catch((err) => {
        console.log(err)
      })
  }

  const loadModels = () => {
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models")
    ]).then(() => {
      faceMyDetect()
    })
  }

  const faceMyDetect = () => {
    setInterval(async () => {
      const detections = await faceapi.detectAllFaces(videoRef.current,
        new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()

      canvasRef.current.innerHTML = faceapi.createCanvasFromMedia(videoRef.current)
      faceapi.matchDimensions(canvasRef.current, {
        width: 940,
        height: 650
      })

      const resizedDetections = faceapi.resizeResults(detections, {
        width: 940,
        height: 650
      })

      // console.log(resizedDetections)

      if (resizedDetections.length === 0) {
        setMessage("Face not visible!")
      }
      if(resizedDetections.length > 1){
        setMessage("More than one face detected")
        return;
      }
  

      faceapi.draw.drawDetections(canvasRef.current, resizedDetections)
      faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections)
      faceapi.draw.drawFaceExpressions(canvasRef.current, resizedDetections)

      // Check if face is turned left or right
      const faceLandmarks = resizedDetections?.[0]?.landmarks
      if (faceLandmarks) {
        // console.log("Mouth :", faceLandmarks.getMouth());
        const leftEye = faceLandmarks.getLeftEye()
        const rightEye = faceLandmarks.getRightEye()

        if (leftEye && rightEye) {
          const eyeDistance = rightEye[0].x - leftEye[leftEye.length - 1].x
          // console.log("Eye desitance : ", eyeDistance)
          if (eyeDistance < 60) {
            setMessage("Face Turned")
          } else if (eyeDistance > 20) {
            setMessage("Face Straight")
          } else {
            setMessage('')
          }
        }
         // Check for surprised expression
      const expressions = resizedDetections?.[0]?.expressions
      if (expressions) {
        const surprisedProbability = expressions.surprised
        if (surprisedProbability > 0.1) {
          setMouthMessage("Mouth Open")
        }
        else{
          setMouthMessage("Mouth Closed")
        }
      }
      }

    }, 1000)
  }

  return (
    <div>
      <h1>Face Detection</h1>
      <div className="appvide">
        <video crossOrigin="anonymous" ref={videoRef} autoPlay></video>
      </div>
      <canvas ref={canvasRef} width="940" height="650" className="appcanvas" />
      {message && <p>{message}</p>}
      {mouthMessage && <p>{mouthMessage}</p>}
    </div>
  )
}

export default App;
