"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Send,
  Users,
  Sparkles,
  User,
  LogOut,
  Mail,
  Briefcase,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Match {
  user_id: string;
  need: string;
}

interface SearchResponse {
  success: boolean;
  data: {
    status?: string;
    message?: Match[] | string;
  };
}

export default function Dashboard() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [sendingInvite, setSendingInvite] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [searchPerformed, setSearchPerformed] = useState<boolean>(false);

  useEffect(() => {
    const storedUserId = localStorage.getItem("user_id");
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      router.push("/signin");
    }
  }, [router]);

  const handleSearch = async () => {
    if (!query.trim()) {
      alert("Please enter a search query");
      return;
    }

    setLoading(true);
    setMatches([]);
    setShowResults(false);
    setSearchPerformed(false);

    try {
      const response = await fetch(
        "http://localhost:5050/api/v1/search/postSearch",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        }
      );

      if (response.ok) {
        const data: SearchResponse = await response.json();

        // Handle the response based on its structure
        if (data.success && data.data.message) {
          if (Array.isArray(data.data.message)) {
            // If message is array of tuples [[user_id, need], ...]
            const formattedMatches = data.data.message.map((item: any) => {
              if (Array.isArray(item)) {
                return {
                  user_id: item[0],
                  need: item[1],
                };
              }
              return item;
            });
            setMatches(formattedMatches);
          } else if (typeof data.data.message === "string") {
            // If message is a string, no matches found
            setMatches([]);
          }
        }

        setShowResults(true);
        setSearchPerformed(true);
      } else {
        alert("Failed to find matches");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async (receiverId: string) => {
    setSendingInvite(receiverId);

    try {
      const response = await fetch(
        "http://localhost:5050/api/v1/invitation/send",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            receiverId,
            message: `I found your profile through search and would like to collaborate!`,
          }),
        }
      );

      if (response.ok) {
        alert("Invitation sent successfully!");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to send invitation");
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      alert("Error connecting to server");
    } finally {
      setSendingInvite(null);
    }
  };

  const handleViewProfile = async (userId: string) => {
    // Navigate to profile page or open profile modal
    // You can implement this based on your routing structure
    router.push(`/profile/${userId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("user_id");
    router.push("/signin");
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-orange-600 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-orange-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500">
                  Find your perfect collaborator
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-orange-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl border-2 border-orange-200">
          <div className="p-6">
            {/* Search Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Sparkles className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Smart Collaborator Search
                  </h2>
                  <p className="text-sm text-gray-600">
                    Describe what skills you're looking for
                  </p>
                </div>
              </div>

              {/* Search Input */}
              <div className="relative">
                <div className="absolute top-3 left-0 pl-4 pointer-events-none">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., Looking for someone experienced in Docker-based backend development and AWS deployment..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all resize-none text-gray-900"
                  rows={4}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.ctrlKey) {
                      handleSearch();
                    }
                  }}
                />
              </div>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Find Matches</span>
                  </>
                )}
              </button>

              {/* Results Section */}
              {searchPerformed && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowResults(!showResults)}
                    className="w-full flex items-center justify-between p-4 bg-orange-50 border-2 border-orange-200 rounded-xl hover:bg-orange-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {matches.length > 0 ? (
                        <>
                          <CheckCircle className="w-6 h-6 text-green-600" />
                          <div className="text-left">
                            <h3 className="font-semibold text-gray-900">
                              {matches.length} Compatible User
                              {matches.length !== 1 ? "s" : ""} Found!
                            </h3>
                            <p className="text-sm text-gray-600">
                              Click to view all matches
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-6 h-6 text-orange-500" />
                          <div className="text-left">
                            <h3 className="font-semibold text-gray-900">
                              No Matches Found
                            </h3>
                            <p className="text-sm text-gray-600">
                              Try a different search query
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    {matches.length > 0 &&
                      (showResults ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ))}
                  </button>

                  {/* Matches List */}
                  {showResults && matches.length > 0 && (
                    <div className="mt-4 space-y-3 max-h-[600px] overflow-y-auto">
                      {matches.map((match, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-white border-2 border-orange-100 rounded-xl hover:border-orange-300 transition-all hover:shadow-md"
                        >
                          <div className="flex items-start gap-3">
                            {/* User Avatar */}
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="w-6 h-6 text-white" />
                            </div>

                            {/* User Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900">
                                  User {match.user_id}
                                </h4>
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-xs font-medium">
                                  ID: {match.user_id}
                                </span>
                              </div>

                              {/* Skills/Needs */}
                              <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
                                <Briefcase className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>
                                  <span className="font-medium text-gray-700">
                                    Skills:
                                  </span>{" "}
                                  {match.need}
                                </span>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    handleSendInvitation(match.user_id)
                                  }
                                  disabled={sendingInvite === match.user_id}
                                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {sendingInvite === match.user_id ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      <span>Sending...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Mail className="w-4 h-4" />
                                      <span>Send Invite</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() =>
                                    handleViewProfile(match.user_id)
                                  }
                                  className="flex-1 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-semibold hover:bg-orange-200 transition-colors flex items-center justify-center gap-2"
                                >
                                  <User className="w-4 h-4" />
                                  <span>View Profile</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* No Results State */}
                  {showResults && matches.length === 0 && (
                    <div className="mt-4 p-8 text-center bg-orange-50 border-2 border-orange-100 rounded-xl">
                      <Users className="w-16 h-16 mx-auto mb-3 text-orange-300" />
                      <h3 className="font-semibold text-gray-900 mb-2">
                        No Compatible Users Yet
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Try refining your search query or check back later
                      </p>
                      <button
                        onClick={() => {
                          setQuery("");
                          setSearchPerformed(false);
                          setMatches([]);
                        }}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors"
                      >
                        New Search
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
