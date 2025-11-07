"use client";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { useEffect, useRef } from "react";

export default function ZegoMiniFrame({ roomId }: { roomId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

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

        // ✅ SMALL FRAME MODE
        scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },

        layout: "Grid", // Smaller layout automatically
        showScreenSharingButton: false,
        showPreJoinView: false,
      });
    }
  }, [roomId]);

  return (
    <div
      ref={containerRef}
      className="rounded-lg overflow-hidden shadow-lg border border-gray-700"
      // style={{
      //   width: "300px",
      //   height: "200px",
      //   position: "absolute",
      //   top: "10px",
      //   right: "10px",
      //   zIndex: 50,
      // }}
    />
  );
}
