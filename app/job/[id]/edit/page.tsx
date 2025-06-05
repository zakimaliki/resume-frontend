"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React from "react";
import { authService } from '../../../../services/authService';

interface Timestamp {
  _seconds: number;
  _nanoseconds: number;
}

interface Interviewer {
  id: string;
  jobId: string;
  department: string;
  name: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface JobData {
  id: string;
  title: string;
  location: string;
  teamDescription: string;
  jobDescription: string;
  responsibilities: string[];
  recruitmentTeamName?: string;
  recruitmentManager?: string;
  recruitmentTeam?: {
    teamName: string;
    manager: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  interviewers: Interviewer[];
  candidates: any[];
}

interface JobFormData {
  title: string;
  location: string;
  teamDescription: string;
  jobDescription: string;
  responsibilities: string[];
  recruitmentTeam: {
    teamName: string;
    manager: string;
    interviewers: Array<{
      id?: string;
      name: string;
      department: string;
    }>;
  };
}

export default function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentInterviewers, setCurrentInterviewers] = useState<Interviewer[]>([]);
  const [formData, setFormData] = useState<JobFormData>({
    title: "",
    location: "",
    teamDescription: "",
    jobDescription: "",
    responsibilities: [""],
    recruitmentTeam: {
      teamName: "",
      manager: "",
      interviewers: [{ name: "", department: "" }]
    }
  });

  const resolvedParams = React.use(params);

  useEffect(() => {
    const fetchJobData = async () => {
      try {
        const token = authService.getToken();
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`http://localhost:3000/api/jobs/${resolvedParams.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch job data: ${errorText}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Server response was not JSON");
        }

        const data: JobData = await response.json();
        setCurrentInterviewers(data.interviewers);
        setFormData({
          title: data.title,
          location: data.location,
          teamDescription: data.teamDescription,
          jobDescription: data.jobDescription,
          responsibilities: data.responsibilities,
          recruitmentTeam: {
            teamName: data.recruitmentTeamName || data.recruitmentTeam?.teamName || '',
            manager: data.recruitmentManager || data.recruitmentTeam?.manager || '',
            interviewers: data.interviewers.map(interviewer => ({
              id: interviewer.id,
              name: interviewer.name,
              department: interviewer.department
            }))
          }
        });
      } catch (error) {
        console.error("Error fetching job data:", error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      }
    };

    fetchJobData();
  }, [resolvedParams.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Update the job
      const jobResponse = await fetch(`http://localhost:3000/api/jobs/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          location: formData.location,
          teamDescription: formData.teamDescription,
          jobDescription: formData.jobDescription,
          responsibilities: formData.responsibilities,
          recruitmentTeamName: formData.recruitmentTeam.teamName,
          recruitmentManager: formData.recruitmentTeam.manager,
        }),
      });

      if (!jobResponse.ok) {
        const errorText = await jobResponse.text();
        throw new Error(`Failed to update job: ${errorText}`);
      }

      // Update interviewers
      const existingInterviewers = formData.recruitmentTeam.interviewers.filter(i => i.id);
      const newInterviewers = formData.recruitmentTeam.interviewers.filter(i => !i.id);

      // Find removed interviewers by comparing current interviewers with existing ones
      const removedInterviewers = currentInterviewers.filter(
        (ci) => !existingInterviewers.some(ei => ei.id === ci.id)
      );

      // Delete removed interviewers
      await Promise.all(
        removedInterviewers.map(async (interviewer) => {
          const deleteResponse = await fetch(`http://localhost:3000/api/interviewers/${interviewer.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (!deleteResponse.ok) {
            const errorText = await deleteResponse.text();
            throw new Error(`Failed to delete interviewer: ${errorText}`);
          }
        })
      );

      // Update existing interviewers
      await Promise.all(
        existingInterviewers.map(async (interviewer) => {
          const updateResponse = await fetch(`http://localhost:3000/api/interviewers/${interviewer.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              name: interviewer.name,
              department: interviewer.department,
            }),
          });
          if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            throw new Error(`Failed to update interviewer: ${errorText}`);
          }
        })
      );

      // Create new interviewers
      await Promise.all(
        newInterviewers.map(async (interviewer) => {
          const createResponse = await fetch('http://localhost:3000/api/interviewers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              jobId: resolvedParams.id,
              name: interviewer.name,
              department: interviewer.department,
            }),
          });
          if (!createResponse.ok) {
            const errorText = await createResponse.text();
            throw new Error(`Failed to create interviewer: ${errorText}`);
          }
        })
      );

      router.push(`/job/${resolvedParams.id}`);
    } catch (error) {
      console.error("Error updating job:", error);
      setError(error instanceof Error ? error.message : 'An error occurred while updating the job');
    } finally {
      setIsLoading(false);
    }
  };

  const addResponsibility = () => {
    setFormData(prev => ({
      ...prev,
      responsibilities: [...prev.responsibilities, ""]
    }));
  };

  const updateResponsibility = (index: number, value: string) => {
    const newResponsibilities = [...formData.responsibilities];
    newResponsibilities[index] = value;
    setFormData(prev => ({
      ...prev,
      responsibilities: newResponsibilities
    }));
  };

  const addInterviewer = () => {
    setFormData(prev => ({
      ...prev,
      recruitmentTeam: {
        ...prev.recruitmentTeam,
        interviewers: [...prev.recruitmentTeam.interviewers, { name: "", department: "" }]
      }
    }));
  };

  const updateInterviewer = (index: number, field: "name" | "department", value: string) => {
    const newInterviewers = [...formData.recruitmentTeam.interviewers];
    newInterviewers[index] = { ...newInterviewers[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      recruitmentTeam: {
        ...prev.recruitmentTeam,
        interviewers: newInterviewers
      }
    }));
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <nav className="bg-white p-4 border-b border-gray-200">
        <div className="container mx-auto">
          <Link href="/dashboard">
            <span className="text-lg font-bold cursor-pointer hover:text-gray-700 transition-colors">Warkop</span>
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Edit Lowongan</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-lg mb-4">Informasi Dasar</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul Pekerjaan</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-lg mb-4">Deskripsi</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Tim</label>
                <textarea
                  value={formData.teamDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, teamDescription: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Pekerjaan</label>
                <textarea
                  value={formData.jobDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, jobDescription: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-lg mb-4">Tanggung Jawab</h2>
            <div className="space-y-4">
              {formData.responsibilities.map((responsibility, index) => (
                <div key={index}>
                  <input
                    type="text"
                    value={responsibility}
                    onChange={(e) => updateResponsibility(index, e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Tanggung jawab ${index + 1}`}
                    required
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addResponsibility}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                + Tambah Tanggung Jawab
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-lg mb-4">Tim Rekrutmen</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Tim</label>
                <input
                  type="text"
                  value={formData.recruitmentTeam.teamName}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    recruitmentTeam: { ...prev.recruitmentTeam, teamName: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hiring Manager</label>
                <input
                  type="text"
                  value={formData.recruitmentTeam.manager}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    recruitmentTeam: { ...prev.recruitmentTeam, manager: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interviewers</label>
                {formData.recruitmentTeam.interviewers.map((interviewer, index) => (
                  <div key={index} className="grid grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      value={interviewer.name}
                      onChange={(e) => updateInterviewer(index, "name", e.target.value)}
                      placeholder="Nama Interviewer"
                      className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <input
                      type="text"
                      value={interviewer.department}
                      onChange={(e) => updateInterviewer(index, "department", e.target.value)}
                      placeholder="Departemen"
                      className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addInterviewer}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Tambah Interviewer
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Link href={`/job/${resolvedParams.id}`}>
              <button
                type="button"
                className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                disabled={isLoading}
              >
                Batal
              </button>
            </Link>
            <button
              type="submit"
              className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-900 flex items-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Memproses...
                </>
              ) : (
                <>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
} 