"use client";

import { useState, useEffect } from "react";
import {
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  User,
  AlertCircle,
  ArrowLeft,
  Loader2,
  MessageSquare,
  UserPlus,
} from "lucide-react";

interface User {
  id: string;
  username: string;
  email: string;
  name?: string;
}

interface Invitation {
  id: string;
  senderId: string;
  receiverId: string;
  message?: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  sender?: User;
  receiver?: User;
  acceptedRoomId?: string;
}

export default function InvitationManager() {
  const [activeTab, setActiveTab] = useState<"send" | "sent" | "received">("send");
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  
  // Send invitation state
  const [receiverId, setReceiverId] = useState("");
  const [message, setMessage] = useState("");
  
  // Invitations state
  const [sentInvitations, setSentInvitations] = useState<Invitation[]>([]);
  const [receivedInvitations, setReceivedInvitations] = useState<Invitation[]>([]);
  const [loadingSent, setLoadingSent] = useState(false);
  const [loadingReceived, setLoadingReceived] = useState(false);

  useEffect(() => {
    const storedUserId = localStorage.getItem("user_id");
    if (storedUserId) {
      setUserId(storedUserId);
      fetchSentInvitations(storedUserId);
      fetchReceivedInvitations(storedUserId);
    }
  }, []);

  const fetchSentInvitations = async (uid: string) => {
    setLoadingSent(true);
    try {
      const response = await fetch(
        `http://localhost:5050/api/v1/invitation/getAllInvitationSendBytheUser/${uid}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setSentInvitations(data);
      }
    } catch (error) {
      console.error("Error fetching sent invitations:", error);
    } finally {
      setLoadingSent(false);
    }
  };

  const fetchReceivedInvitations = async (uid: string) => {
    setLoadingReceived(true);
    try {
      const response = await fetch(
        `http://localhost:5050/api/v1/invitation/getAllInvitationRecivedBytheUser/${uid}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setReceivedInvitations(data);
      }
    } catch (error) {
      console.error("Error fetching received invitations:", error);
    } finally {
      setLoadingReceived(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!receiverId.trim()) {
      alert("Please enter a receiver ID");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:5050/api/v1/invitation/createInvitation",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            senderId: userId,
            receiverId: receiverId.trim(),
            message: message.trim() || undefined,
          }),
        }
      );

      if (response.ok) {
        alert("Invitation sent successfully!");
        setReceiverId("");
        setMessage("");
        fetchSentInvitations(userId);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to send invitation");
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      alert("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5050/api/v1/invitation/acceptInvitation/${invitationId}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userId,
            title: "Collaboration Room",
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        alert(`Invitation accepted! Room created: ${data.room.title}`);
        fetchReceivedInvitations(userId);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to accept invitation");
      }
    } catch (error) {
      console.error("Error accepting invitation:", error);
      alert("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5050/api/v1/invitation/rejectInvitation/${invitationId}`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      if (response.ok) {
        alert("Invitation rejected");
        fetchReceivedInvitations(userId);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to reject invitation");
      }
    } catch (error) {
      console.error("Error rejecting invitation:", error);
      alert("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: "bg-orange-100 text-orange-700 border-orange-200",
      ACCEPTED: "bg-green-100 text-green-700 border-green-200",
      REJECTED: "bg-red-100 text-red-700 border-red-200",
    };
    return badges[status as keyof typeof badges] || badges.PENDING;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-4 h-4" />;
      case "ACCEPTED":
        return <CheckCircle className="w-4 h-4" />;
      case "REJECTED":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const pendingReceivedCount = receivedInvitations.filter(
    (inv) => inv.status === "PENDING"
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-orange-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Invitation Manager
                </h1>
                <p className="text-sm text-gray-500">
                  Send and manage collaboration invitations
                </p>
              </div>
            </div>
            {pendingReceivedCount > 0 && (
              <div className="px-4 py-2 bg-orange-500 text-white rounded-full font-semibold text-sm">
                {pendingReceivedCount} New
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-orange-200 mb-6">
          <div className="flex border-b border-orange-100">
            <button
              onClick={() => setActiveTab("send")}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === "send"
                  ? "text-orange-600 border-b-2 border-orange-600 bg-orange-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Send className="w-5 h-5" />
                <span>Send Invitation</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("sent")}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === "sent"
                  ? "text-orange-600 border-b-2 border-orange-600 bg-orange-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <ArrowLeft className="w-5 h-5 rotate-180" />
                <span>Sent ({sentInvitations.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("received")}
              className={`flex-1 px-6 py-4 font-semibold transition-colors relative ${
                activeTab === "received"
                  ? "text-orange-600 border-b-2 border-orange-600 bg-orange-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Mail className="w-5 h-5" />
                <span>Received ({receivedInvitations.length})</span>
                {pendingReceivedCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full"></span>
                )}
              </div>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "send" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Receiver User ID *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserPlus className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={receiverId}
                      onChange={(e) => setReceiverId(e.target.value)}
                      placeholder="Enter user ID to invite"
                      className="w-full pl-10 pr-4 py-3 border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Message (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-0 pl-3 pointer-events-none">
                      <MessageSquare className="w-5 h-5 text-gray-400" />
                    </div>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Add a personal message..."
                      className="w-full pl-10 pr-4 py-3 border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all resize-none text-gray-900"
                      rows={4}
                    />
                  </div>
                </div>

                <button
                  onClick={handleSendInvitation}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Send Invitation</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {activeTab === "sent" && (
              <div className="space-y-3">
                {loadingSent ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
                  </div>
                ) : sentInvitations.length === 0 ? (
                  <div className="text-center py-12">
                    <Send className="w-16 h-16 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">
                      No invitations sent yet
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Start collaborating by sending an invitation
                    </p>
                  </div>
                ) : (
                  sentInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="bg-orange-50 border-2 border-orange-100 rounded-xl p-4 hover:border-orange-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {invitation.receiver?.username || "User"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {invitation.receiver?.email}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border-2 ${getStatusBadge(invitation.status)}`}
                        >
                          {getStatusIcon(invitation.status)}
                          <span>{invitation.status}</span>
                        </div>
                      </div>

                      {invitation.message && (
                        <p className="text-sm text-gray-700 bg-white p-3 rounded-lg mb-2 border border-orange-200">
                          {invitation.message}
                        </p>
                      )}

                      <p className="text-xs text-gray-500">
                        Sent {formatDate(invitation.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "received" && (
              <div className="space-y-3">
                {loadingReceived ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
                  </div>
                ) : receivedInvitations.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="w-16 h-16 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">
                      No invitations received
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Your invitations will appear here
                    </p>
                  </div>
                ) : (
                  receivedInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className={`border-2 rounded-xl p-4 transition-all ${
                        invitation.status === "PENDING"
                          ? "bg-orange-50 border-orange-200 hover:border-orange-300"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {invitation.sender?.username || "User"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {invitation.sender?.email}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border-2 ${getStatusBadge(invitation.status)}`}
                        >
                          {getStatusIcon(invitation.status)}
                          <span>{invitation.status}</span>
                        </div>
                      </div>

                      {invitation.message && (
                        <p className="text-sm text-gray-700 bg-white p-3 rounded-lg mb-3 border border-orange-200">
                          {invitation.message}
                        </p>
                      )}

                      <p className="text-xs text-gray-500 mb-3">
                        Received {formatDate(invitation.createdAt)}
                      </p>

                      {invitation.status === "PENDING" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptInvitation(invitation.id)}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectInvitation(invitation.id)}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}