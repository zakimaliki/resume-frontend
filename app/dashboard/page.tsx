"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '../../services/authService';
import { Button } from '../../components/atoms/Button';

interface JobPosting {
  id: string;
  title: string;
  location: string;
  recruitmentTeamName?: string;
  recruitmentManager?: string;
  recruitmentTeam?: {
    teamName: string;
    manager: string;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobPostings = async () => {
      try {
        const token = authService.getToken();
        if (!token) {
          throw new Error('No authentication token found');
        }

        const res = await fetch('http://localhost:3000/api/jobs', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const data = await res.json();
        setJobPostings(data);
      } catch (error) {
        console.error("Error fetching job postings:", error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchJobPostings();
  }, []);


  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Link href="/job/create">
            <button className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 flex items-center gap-2">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Post New Job
            </button>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Recent Job Postings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobPostings.map(job => (
                  <tr key={job.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/job/${job.id}`)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{job.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{job.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{job.recruitmentTeamName || job.recruitmentTeam?.teamName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{job.recruitmentManager || job.recruitmentTeam?.manager}</div>
                    </td>
                  </tr>
                ))}
                {jobPostings.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      No job postings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
} 