'use client'
import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [responseMessage, setResponseMessage] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const wavesurferRef = useRef(null);
  const waveformRef = useRef(null);

  useEffect(() => {
    if (audioBlob && waveformRef.current) {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
      wavesurferRef.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: 'violet',
        progressColor: 'purple',
        height: 200,

  renderFunction: (channels, ctx) => {
    const { width, height } = ctx.canvas
    const scale = channels[0].length / width
    const step = 6

    ctx.translate(0, height / 2)
    ctx.strokeStyle = ctx.fillStyle
    ctx.beginPath()

    for (let i = 0; i < width; i += step * 2) {
      const index = Math.floor(i * scale)
      const value = Math.abs(channels[0][index])
      let x = i
      let y = value * height

      ctx.moveTo(x, 0)
      ctx.lineTo(x, y)
      ctx.arc(x + step / 2, y, step / 2, Math.PI, 0, true)
      ctx.lineTo(x + step, 0)

      x = x + step
      y = -y
      ctx.moveTo(x, 0)
      ctx.lineTo(x, y)
      ctx.arc(x + step / 2, y, step / 2, Math.PI, 0, false)
      ctx.lineTo(x + step, 0)
    }

    ctx.stroke()
    ctx.closePath()
  },
      });
      wavesurferRef.current.loadBlob(audioBlob);
    }
  }, [audioBlob]);

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];
        mediaRecorderRef.current.start();
        setIsRecording(true);

        mediaRecorderRef.current.addEventListener('dataavailable', event => {
          audioChunksRef.current.push(event.data);
        });

        setTimeout(() => {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }, 15000);

        mediaRecorderRef.current.addEventListener('stop', handleRecordingStop);
      })
      .catch(error => console.error('Error accessing microphone', error));
  };

  const handleRecordingStop = () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(audioBlob);
    setAudioBlob(audioBlob);
    setAudioUrl(audioUrl);
  };

  const playAudio = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.play();
    }
  };

  const stopAudio = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.stop();
    }
  };

  const sendAudioToServer = async () => {
    if (!audioBlob) return;

    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.wav');

    try {
      const response = await fetch('https://72b0-95-174-113-231.ngrok-free.app/predict', {
        method: 'POST',
        body: formData
      });
      const data = await response.text();
      let obj = JSON.parse(data);
      setResponseMessage(obj['prediction']);
    } catch (error) {
      console.error('Error sending audio to server:', error);
      setResponseMessage('Failed to send audio to server');
    }
  };

  return (
    <div>
      <button className='record' onClick={startRecording} disabled={isRecording}>
        {isRecording ? 'Слушаю...' : 'Начать запись'}
      </button>
      <div ref={waveformRef} id="waveform"></div>
      {responseMessage && <p>Response: {responseMessage}</p>}

      {audioUrl && (
        <div>
          <button onClick={playAudio}>Воспроизведение дыхания</button>
          <button onClick={stopAudio}>Остановить дыхание</button>
          <button onClick={sendAudioToServer}>Узнать болезнь</button>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
