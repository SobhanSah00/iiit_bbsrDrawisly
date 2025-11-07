"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save } from "lucide-react";

export default function Page() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState([
    {
      skill_name: "",
      components: [],
      tools: [],
      focus_area: "",
      experience_level: "Beginner",
      description: "",
    },
  ]);
  const [componentInput, setComponentInput] = useState({});
  const [toolInput, setToolInput] = useState({});

  const experienceLevels = ["Beginner", "Intermediate", "Advanced", "Expert"];

  useEffect(() => {
    // Get user_id from localStorage (set during login/signup)
    const storedUserId = localStorage.getItem("user_id");
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      // If no user_id, redirect to login
      router.push("/signin");
    }
  }, [router]);

  const addSkill = () => {
    setSkills([
      ...skills,
      {
        skill_name: "",
        components: [],
        tools: [],
        focus_area: "",
        experience_level: "Beginner",
        description: "",
      },
    ]);
  };

  const removeSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const updateSkill = (index, field, value) => {
    const newSkills = [...skills];
    newSkills[index][field] = value;
    setSkills(newSkills);
  };

  const addComponent = (index) => {
    const value = componentInput[index]?.trim();
    if (value) {
      const newSkills = [...skills];
      newSkills[index].components = [
        ...(newSkills[index].components || []),
        value,
      ];
      setSkills(newSkills);
      setComponentInput({ ...componentInput, [index]: "" });
    }
  };

  const removeComponent = (skillIndex, compIndex) => {
    const newSkills = [...skills];
    newSkills[skillIndex].components = newSkills[skillIndex].components.filter(
      (_, i) => i !== compIndex
    );
    setSkills(newSkills);
  };

  const addTool = (index) => {
    const value = toolInput[index]?.trim();
    if (value) {
      const newSkills = [...skills];
      newSkills[index].tools = [...(newSkills[index].tools || []), value];
      setSkills(newSkills);
      setToolInput({ ...toolInput, [index]: "" });
    }
  };

  const removeTool = (skillIndex, toolIndex) => {
    const newSkills = [...skills];
    newSkills[skillIndex].tools = newSkills[skillIndex].tools.filter(
      (_, i) => i !== toolIndex
    );
    setSkills(newSkills);
  };

  const handleSubmit = async () => {
    if (!userId.trim()) {
      alert("User ID not found. Please login again.");
      router.push("/signin");
      return;
    }

    const hasInvalidSkill = skills.some(
      (skill) => !skill.skill_name.trim() || !skill.description.trim()
    );

    if (hasInvalidSkill) {
      alert("Please fill in all required fields (Skill Name and Description)");
      return;
    }

    const cleanedSkills = skills.map((skill) => {
      const cleaned = {
        skill_name: skill.skill_name,
        experience_level: skill.experience_level,
        description: skill.description,
      };

      if (skill.components && skill.components.length > 0) {
        cleaned.components = skill.components;
      }
      if (skill.tools && skill.tools.length > 0) {
        cleaned.tools = skill.tools;
      }
      if (skill.focus_area) {
        cleaned.focus_area = skill.focus_area;
      }

      return cleaned;
    });

    const payload = {
      user_id: userId,
      skill_set: cleanedSkills,
    };

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5050/api/v1/skill/saveSkill",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Skills saved successfully!");
        router.push("/dashboard");
      } else {
        alert(data.message || "Failed to save skills");
      }
    } catch (error) {
      console.error("Error saving skills:", error);
      alert("Error connecting to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-orange-600 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border-2 border-orange-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Skills Profile Builder</h1>
            <p className="text-orange-100">
              Create your comprehensive skills portfolio
            </p>
          </div>

          <div className="p-8">
            {/* Skills Section */}
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Skills</h2>
                <button
                  onClick={addSkill}
                  className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Plus size={20} />
                  Add Skill
                </button>
              </div>

              {skills.map((skill, index) => (
                <div
                  key={index}
                  className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 relative"
                >
                  <button
                    onClick={() => removeSkill(index)}
                    className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>

                  <div className="grid gap-4">
                    {/* Skill Name */}
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Skill Name *
                      </label>
                      <input
                        type="text"
                        value={skill.skill_name}
                        onChange={(e) =>
                          updateSkill(index, "skill_name", e.target.value)
                        }
                        className="w-full px-4 py-2 border-2 border-orange-200 rounded-lg focus:outline-none focus:border-orange-500 bg-white"
                        placeholder="e.g., MERN Stack, DevOps, DSA"
                      />
                    </div>

                    {/* Experience Level */}
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Experience Level *
                      </label>
                      <select
                        value={skill.experience_level}
                        onChange={(e) =>
                          updateSkill(index, "experience_level", e.target.value)
                        }
                        className="w-full px-4 py-2 border-2 border-orange-200 rounded-lg focus:outline-none focus:border-orange-500 bg-white"
                      >
                        {experienceLevels.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Focus Area */}
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Focus Area (Optional)
                      </label>
                      <input
                        type="text"
                        value={skill.focus_area}
                        onChange={(e) =>
                          updateSkill(index, "focus_area", e.target.value)
                        }
                        className="w-full px-4 py-2 border-2 border-orange-200 rounded-lg focus:outline-none focus:border-orange-500 bg-white"
                        placeholder="e.g., Backend Development, Cloud Infrastructure"
                      />
                    </div>

                    {/* Components */}
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Components (Optional)
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={componentInput[index] || ""}
                          onChange={(e) =>
                            setComponentInput({
                              ...componentInput,
                              [index]: e.target.value,
                            })
                          }
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addComponent(index);
                            }
                          }}
                          className="flex-1 px-4 py-2 border-2 border-orange-200 rounded-lg focus:outline-none focus:border-orange-500 bg-white"
                          placeholder="e.g., MongoDB, Express.js"
                        />
                        <button
                          onClick={() => addComponent(index)}
                          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {skill.components?.map((comp, compIndex) => (
                          <span
                            key={compIndex}
                            className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                          >
                            {comp}
                            <button
                              onClick={() => removeComponent(index, compIndex)}
                              className="hover:text-orange-200"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Tools */}
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Tools (Optional)
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={toolInput[index] || ""}
                          onChange={(e) =>
                            setToolInput({
                              ...toolInput,
                              [index]: e.target.value,
                            })
                          }
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addTool(index);
                            }
                          }}
                          className="flex-1 px-4 py-2 border-2 border-orange-200 rounded-lg focus:outline-none focus:border-orange-500 bg-white"
                          placeholder="e.g., Docker, GitHub Actions"
                        />
                        <button
                          onClick={() => addTool(index)}
                          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {skill.tools?.map((tool, toolIndex) => (
                          <span
                            key={toolIndex}
                            className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                          >
                            {tool}
                            <button
                              onClick={() => removeTool(index, toolIndex)}
                              className="hover:text-orange-200"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Description *
                      </label>
                      <textarea
                        value={skill.description}
                        onChange={(e) =>
                          updateSkill(index, "description", e.target.value)
                        }
                        className="w-full px-4 py-2 border-2 border-orange-200 rounded-lg focus:outline-none focus:border-orange-500 bg-white"
                        rows={3}
                        placeholder="Describe your experience with this skill..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} />
                {loading ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
