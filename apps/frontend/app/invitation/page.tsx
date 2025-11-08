"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  User,
  AlertCircle,
  Loader2,
  RefreshCw,
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
  const [activeTab, setActiveTab] = useState<"sent" | "received">("received");
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  
  // Invitations state
  const [sentInvitations, setSentInvitations] = useState<Invitation[]>([]);
  const [receivedInvitations, setReceivedInvitations] = useState<Invitation[]>([]);
  const [loadingSent, setLoadingSent] = useState(false);
  const [loadingReceived, setLoadingReceived] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const storedUserId = localStorage.getItem("user_id");
    if (storedUserId) {
      setUserId(storedUserId);
      fetchSentInvitations(storedUserId);
      fetchReceivedInvitations(storedUserId);
    } else {
      setError("User ID not found. Please log in.");
    }
  }, []);

  const fetchSentInvitations = async (uid: string) => {
    setLoadingSent(true);
    setError("");
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
        setSentInvitations(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch sent invitations");
      }
    } catch (error) {
      console.error("Error fetching sent invitations:", error);
      setError("Error connecting to server");
    } finally {
      setLoadingSent(false);
    }
  };

  const fetchReceivedInvitations = async (uid: string) => {
    setLoadingReceived(true);
    setError("");
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
        setReceivedInvitations(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch received invitations");
      }
    } catch (error) {
      console.error("Error fetching received invitations:", error);
      setError("Error connecting to server");
    } finally {
      setLoadingReceived(false);
    }
  };

  const handleRefresh = () => {
    if (userId) {
      fetchSentInvitations(userId);
      fetchReceivedInvitations(userId);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    setLoading(true);
    setError("");
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
        alert(`✓ Invitation accepted! Room created: ${data.room.title}`);
        await fetchReceivedInvitations(userId);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to accept invitation");
        alert(errorData.error || "Failed to accept invitation");
      }
    } catch (error) {
      console.error("Error accepting invitation:", error);
      setError("Error connecting to server");
      alert("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `http://localhost:5050/api/v1/invitation/rejectInvitation/${invitationId}`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      if (response.ok) {
        alert("✓ Invitation rejected");
        await fetchReceivedInvitations(userId);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to reject invitation");
        alert(errorData.error || "Failed to reject invitation");
      }
    } catch (error) {
      console.error("Error rejecting invitation:", error);
      setError("Error connecting to server");
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
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch (e) {
      return "Unknown date";
    }
  };

  const pendingReceivedCount = receivedInvitations.filter(
    (inv) => inv.status === "PENDING"
  ).length;

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border-2 border-orange-200 p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-orange-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600">
              Please log in to view your invitations.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
                  View and manage your collaboration invitations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {pendingReceivedCount > 0 && (
                <div className="px-4 py-2 bg-orange-500 text-white rounded-full font-semibold text-sm">
                  {pendingReceivedCount} New
                </div>
              )}
              <button
                onClick={handleRefresh}
                disabled={loadingSent || loadingReceived}
                className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${(loadingSent || loadingReceived) ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-orange-200 mb-6">
          <div className="flex border-b border-orange-100">
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
                  <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                )}
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
                <CheckCircle className="w-5 h-5" />
                <span>Sent ({sentInvitations.length})</span>
              </div>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "sent" && (
              <div className="space-y-3">
                {loadingSent ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
                  </div>
                ) : sentInvitations.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="w-16 h-16 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">
                      No invitations sent yet
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Your sent invitations will appear here
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
                              {invitation.receiver?.email || "No email"}
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
                          ? "bg-orange-50 border-orange-200 hover:border-orange-300 shadow-sm"
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
                              {invitation.sender?.email || "No email"}
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
                            className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {loading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectInvitation(invitation.id)}
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {loading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
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