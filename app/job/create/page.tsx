"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from '../../../services/authService';

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
      name: string;
      department: string;
    }>;
  };
}

const PostNewJobPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const token = authService.getToken();
      console.log('Token available:', !!token);
      if (!token) {
        throw new Error('No authentication token found');
      }

      // First, create the job
      const jobResponse = await fetch('http://localhost:3000/api/jobs', {
        method: 'POST',
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
          recruitmentTeam: {
            teamName: formData.recruitmentTeam.teamName,
            manager: formData.recruitmentTeam.manager,
          }
        }),
      });

      if (!jobResponse.ok) {
        throw new Error('Failed to create job');
      }

      const jobData = await jobResponse.json();

      // Then, create the interviewers
      const interviewerPromises = formData.recruitmentTeam.interviewers.map(interviewer =>
        fetch('http://localhost:3000/api/interviewers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            jobId: jobData.id,
            name: interviewer.name,
            department: interviewer.department,
          }),
        })
      );

      // Wait for all interviewer creation requests to complete
      const interviewerResponses = await Promise.all(interviewerPromises);
      
      // Check if any interviewer creation failed
      const failedInterviewers = interviewerResponses.filter(response => !response.ok);
      if (failedInterviewers.length > 0) {
        throw new Error('Failed to create some interviewers');
      }

      // Only redirect after all operations are successful
      await router.push("/dashboard");
    } catch (error) {
      console.error("Error creating job:", error);
      setError(error instanceof Error ? error.message : 'An error occurred while creating the job');
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

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <main className="max-w-4xl mx-auto px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Buat Lowongan Baru</h1>

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
            <Link href="/dashboard">
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
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Post New Job
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default PostNewJobPage; 