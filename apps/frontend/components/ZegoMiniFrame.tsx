"use client";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { useEffect, useRef, useState } from "react";
import { Minimize2, Maximize2, X } from "lucide-react";

export default function ZegoMiniFrame({ roomId }: { roomId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!roomId) return;

    const appID = 1696168716;
    const serverSecret = "09265992b6e4acb102aa221bd308fc31";
    const userID = Math.random().toString(36).slice(2);
    const userName = "User-" + userID;

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      serverSecret,
      roomId,
      userID,
      userName
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);

    if (containerRef.current) {
      zp.joinRoom({
        container: containerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.VideoConference,
          config: {
            role: ZegoUIKitPrebuilt.Host,
          },
        },
        layout: "Sidebar",
        showMyMicrophoneToggleButton: true,
        showMyCameraToggleButton: true,
        showAudioVideoSettingsButton: false,
        showScreenSharingButton: false,
        showLeavingView: false,
        showRoomTimer: false,
        showLayoutButton: false,
        showTextChat: false,
        showUserList: false,
        showPreJoinView: false,
        turnOnCameraWhenJoining: true,
        turnOnMicrophoneWhenJoining: true,
        videoResolutionDefault: ZegoUIKitPrebuilt.VideoResolution_480P,
        showUserName: true,
      });
    }

    return () => {
      zp?.destroy();
    };
  }, [roomId]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed z-[100] transition-all duration-300 ease-in-out"
      style={{
        top: isMinimized ? "20px" : "80px",
        left: "20px",
        width: isMinimized ? "200px" : "420px",
        height: isMinimized ? "150px" : "320px",
      }}
    >
      {/* Control Buttons */}
      <div className="absolute -top-10 left-0 flex gap-2 z-10">
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white p-2 rounded-lg transition-colors"
          title={isMinimized ? "Maximize" : "Minimize"}
        >
          {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
        </button>
        <button
          onClick={() => setIsVisible(false)}
          className="bg-[#ff6b35] hover:bg-[#e55a2b] text-white p-2 rounded-lg transition-colors"
          title="Close Video"
        >
          <X size={16} />
        </button>
      </div>

      {/* Video Container */}
      <div
        ref={containerRef}
        className="w-full h-full rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700 bg-[#1a1a1a]"
      />

      {/* Reopen Button (when closed) */}
      {!isVisible && (
        <button
          onClick={() => setIsVisible(true)}
          className="fixed top-20 left-5 bg-[#ff6b35] hover:bg-[#e55a2b] text-white px-4 py-2 rounded-lg transition-colors shadow-lg z-[100]"
        >
          Open Video Call
        </button>
      )}
    </div>
  );
}
