"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Sparkles,
  ArrowRight,
  User,
  LogOut,
} from "lucide-react";

interface Skill {
  skill_name: string;
  components?: string[];
  tools?: string[];
  focus_area?: string;
  experience_level: string;
  description: string;
}

interface MatchedSkill {
  skill_name: string;
  score: number;
  matched_keywords: string[];
}

interface Match {
  user: {
    id: string;
    username: string;
    name: string;
    email: string;
  };
  skills: Skill[];
  match_score: number;
  matched_skills: MatchedSkill[];
  relevance: "high" | "medium" | "low";
}

interface MatchResults {
  success: boolean;
  query: string;
  total_matches: number;
  matches: Match[];
  search_metadata: {
    keywords_extracted: string[];
    user_id: string;
    timestamp: string;
  };
}

interface CollaborationRequest {
  id: number;
  from_user_id: string;
  from_name: string;
  from_username: string;
  to_user_id: string;
  project_name: string;
  skills_needed: string[];
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}

interface Stats {
  active_projects: number;
  pending_requests: number;
  completed_projects: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [matchResults, setMatchResults] = useState<MatchResults | null>(null);
  const [requests, setRequests] = useState<CollaborationRequest[]>([]);
  const [stats, setStats] = useState<Stats>({
    active_projects: 0,
    pending_requests: 0,
    completed_projects: 0,
  });
  const [loadingRequests, setLoadingRequests] = useState<boolean>(true);
  const storedUserId = localStorage.getItem("user_id");

  useEffect(() => {
    const storedUserId = localStorage.getItem("user_id");
    if (storedUserId) {
      setUserId(storedUserId);
      //   fetchCollaborationRequests(storedUserId);
      //   fetchStats(storedUserId);
    } else {
      router.push("/signin");
    }
  }, [router]);

  //   const fetchCollaborationRequests = async (uid: string) => {
  //     try {
  //       const response = await fetch(`http://localhost:5050/`);
  //       const data = await response.json();

  //       if (data.success) {
  //         setRequests(data.data.requests);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching requests:", error);
  //     } finally {
  //       setLoadingRequests(false);
  //     }
  //   };

  //   const fetchStats = async (uid: string) => {
  //     try {
  //       const response = await fetch(`ssss`);
  //       const data = await response.json();

  //       if (data.success) {
  //         setStats(data.data);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching stats:", error);
  //     }
  //   };

  const handleSearch = async () => {
    if (!query.trim()) {
      alert("Please enter a search query");
      return;
    }

    setLoading(true);
    setMatchResults(null);

    try {
      const response = await fetch(
        "http://localhost:5050/api/v1/search/postSearch",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query, user_id: storedUserId }),
        }
      );

      console.log(response);

      //   const data: MatchResults = await response.json();

      //   if (response.ok && data.success) {
      //     setMatchResults(data);
      //     console.log("Match Results:", data);
      //   } else {
      //     alert("Failed to find matches");
      //   }
    } catch (error) {
      console.error("Error:", error);
      alert("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (
    requestId: number,
    action: "accepted" | "rejected"
  ) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/requests/${requestId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: action,
            user_id: userId,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setRequests(
          requests.map((req) =>
            req.id === requestId ? { ...req, status: action } : req
          )
        );
        alert(`Request ${action}!`);
        // Refresh stats
        // fetchStats(userId);
      } else {
        alert(data.message || "Failed to update request");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error connecting to server");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user_id");
    router.push("/signin");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-orange-500" />;
      case "accepted":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "accepted":
        return "bg-green-100 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Search */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Card */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-orange-200 p-6">
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

              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-gray-400" />
                  </div>
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., Looking for someone experienced in Docker-based backend development and AWS deployment..."
                    className="w-full pl-12 pr-4 py-3 border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all resize-none text-gray-900"
                    rows={4}
                  />
                </div>

                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Find Matches</span>
                    </>
                  )}
                </button>
              </div>

              {/* Match Results */}
              {matchResults && (
                <div className="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">
                      {matchResults.total_matches} Matches Found!
                    </h3>
                  </div>
                  <p className="text-sm text-green-700 mb-3">
                    Top matching collaborators based on your search
                  </p>
                  {matchResults.matches.slice(0, 3).map((match, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3 rounded-lg mb-2 border border-green-200"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {match.user.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            @{match.user.username}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${match.relevance === "high"
                              ? "bg-green-100 text-green-700"
                              : match.relevance === "medium"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                        >
                          {match.match_score}% Match
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {match.matched_skills.slice(0, 3).map((skill, sidx) => (
                          <span
                            key={sidx}
                            className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs"
                          >
                            {skill.skill_name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-lg border-2 border-orange-100 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      Active Projects
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.active_projects}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border-2 border-orange-100 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Pending</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.pending_requests}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border-2 border-orange-100 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      Completed
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.completed_projects}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Requests */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border-2 border-orange-200 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Collaboration Requests
                </h2>
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                  {requests.filter((r) => r.status === "pending").length} New
                </span>
              </div>

              {loadingRequests ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No collaboration requests yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {requests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 bg-orange-50 border-2 border-orange-100 rounded-xl hover:border-orange-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {request.from_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatTimestamp(request.created_at)}
                            </p>
                          </div>
                        </div>
                        {getStatusIcon(request.status)}
                      </div>

                      <p className="font-medium text-gray-800 mb-2 text-sm">
                        {request.project_name}
                      </p>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {request.skills_needed.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-white text-orange-700 rounded-md text-xs font-medium border border-orange-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      {request.status === "pending" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleRequestAction(request.id, "accepted")
                            }
                            className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() =>
                              handleRequestAction(request.id, "rejected")
                            }
                            className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <div
                          className={`px-3 py-2 rounded-lg text-xs font-semibold text-center border-2 ${getStatusColor(request.status)}`}
                        >
                          {request.status.charAt(0).toUpperCase() +
                            request.status.slice(1)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => router.push("/requests")}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-semibold hover:bg-orange-200 transition-colors"
              >
                <span>View All Requests</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
