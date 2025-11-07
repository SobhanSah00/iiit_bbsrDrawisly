"use client";

import RecordRTC from "recordrtc";
import { useRef, useState } from "react";

export default function SessionRecorder({ roomId }: { roomId: string }) {
  const recorderRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const startRecording = async () => {
    try {
      setError("");

      // ✅ Already recording?
      if (isRecording) return;

      // ✅ Capture screen
      const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: true,
        audio: true,
      });

      // ✅ Capture microphone (optional)
      let micStream: MediaStream | null = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
      } catch (micErr) {
        console.warn("No microphone permissions:", micErr);
      }

      // ✅ Setup audio merging only if mic is available
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      const audioTracks: MediaStreamTrack[] = [];

      // screen audio
      if (screenStream.getAudioTracks().length > 0) {
        const screenAudio = audioContext.createMediaStreamSource(screenStream);
        screenAudio.connect(destination);
      }

      // mic audio
      if (micStream && micStream.getAudioTracks().length > 0) {
        const micAudio = audioContext.createMediaStreamSource(micStream);
        micAudio.connect(destination);
      }

      const finalStream = new MediaStream([
        ...screenStream.getVideoTracks(),
        ...destination.stream.getAudioTracks(),
      ]);

      streamRef.current = finalStream;

      // ✅ Start RecordRTC
      const recorder = new RecordRTC(finalStream, {
        type: "video",
        mimeType: "video/webm",
        disableLogs: true,
      });

      recorder.startRecording();
      recorderRef.current = recorder;

      setIsRecording(true);
    } catch (error: any) {
      console.error("Recording error:", error);
      setError("Failed to start recording. Please check permissions.");
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);

    const recorder = recorderRef.current;
    const stream = streamRef.current;

    if (!recorder) return;

    await recorder.stopRecording(async () => {
      const blob = recorder.getBlob();

      // ✅ Stop tracks (VERY important)
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }

      recorderRef.current = null;
      streamRef.current = null;

      // ✅ Upload to backend
      setUploading(true);
      await uploadRecording(blob);
      setUploading(false);
    });
  };

  const uploadRecording = async (blob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("video", blob, `session-${roomId}.webm`);
      formData.append("roomId", roomId);

      const res = await fetch(
        "http://localhost:5050/api/v1/session/upload-recording",
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      const data = await res.json();

      if (!data.success) {
        setError("Failed to upload session.");
      }

      console.log("Upload result:", data);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError("Upload failed. Please try again.");
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[999] p-4 bg-black/60 text-white rounded-xl shadow-lg min-w-[180px]">
      {/* ✅ Errors */}
      {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

      {/* ✅ Start */}
      {!isRecording && !uploading && (
        <button
          onClick={startRecording}
          className="bg-green-600 w-full px-4 py-2 rounded-lg hover:bg-green-700"
        >
          ▶ Start Recording
        </button>
      )}

      {/* ✅ Stop */}
      {isRecording && (
        <button
          onClick={stopRecording}
          className="bg-red-600 w-full px-4 py-2 rounded-lg hover:bg-red-700"
        >
          ⏹ Stop & Upload
        </button>
      )}

      {/* ✅ Uploading */}
      {uploading && <p className="text-sm">⬆ Uploading...</p>}
    </div>
  );
}
