"use client";
import { Suspense } from "react";
import { useState, useEffect } from "react";
import pdfToText from "react-pdftotext";
import { Document, Page } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { FaRegFile } from "react-icons/fa";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useSearchParams, useRouter } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";
import Link from "next/link";
import Api from "../api/api";
import { authService } from '../../services/authService';
import { API_ENDPOINTS } from '../../config/api';

interface Experience {
  company?: string;
  title?: string;
  startYear?: string;
  endYear?: string;
  location?: string;
  description?: string;
}

interface Education {
  university?: string;
  degree?: string;
  gpa?: string;
  startYear?: string;
  endYear?: string;
}

interface ResumeData {
  personal_information?: {
    name?: string;
    title?: string;
    city?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    linkedin?: string;
  };
  experience?: Experience[];
  education?: Education[];
  additional_information?: {
    technical_skills?: string;
  };
}

function ResumeContent() {
  const { output, setOutput, handleOpenAI, loading } = Api();
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [tab, setTab] = useState<string>("summarize");
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");
  const router = useRouter();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState(0.5);
  const [showAllPages, setShowAllPages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      router.push("/dashboard");
    }
  }, [jobId, router]);

  useEffect(() => {
    const handleResize = () => {
      setScale(window.innerWidth < 768 ? 1 : 0.5);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(null);

      try {
        const extractedText = await pdfToText(file);
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setPdfPreview(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);

        const token = authService.getToken();
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Get job details
        const jobResponse = await fetch(`${API_ENDPOINTS.jobs}/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!jobResponse.ok) {
          throw new Error('Failed to fetch job details');
        }

        const jobData = await jobResponse.json();
        await handleOpenAI(e, extractedText, jobData);

        const response = await fetch(API_ENDPOINTS.candidates, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(output)
        });
      } catch (error) {
        console.error('Error processing resume:', error);
        setError(error instanceof Error ? error.message : 'Failed to process resume');
      }
    }
  };

  const handleRemovePdf = () => {
    setPdfPreview(null);
    setOutput(null);
    const fileInput = document.getElementById("pdfInput") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleTab = () => {
    setTab(tab === "summarize" ? "raw" : "summarize");
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <nav className="bg-white p-4 border-b border-gray-200">
        <div className="container mx-auto">
          <Link href="/dashboard">
            <span className="text-lg font-bold cursor-pointer hover:text-gray-700 transition-colors">Warkop</span>
          </Link>
        </div>
      </nav>

      <div className="w-full bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (jobId) {
                  router.push(`/job/${jobId}`);
                } else {
                  router.push('/dashboard');
                }
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <FaArrowLeft />
              <span>Back to Job</span>
            </button>
          </div>
          <button
            onClick={handleTab}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            {tab === "summarize" ? "View Raw Data" : "View Summary"}
          </button>
        </div>
      </div>

      <main className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-80px)]">
        {/* LEFT SIDE: PDF Upload / Preview */}
        <div className="flex flex-col items-center justify-center h-full px-6 sm:px-12 py-12">
          {!pdfPreview ? (
            <label
              htmlFor="pdfInput"
              className="flex flex-col items-center cursor-pointer select-none"
            >
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 bg-white hover:bg-gray-50 transition-all">
                <FaRegFile className="text-4xl text-gray-400 mb-2" />
                <span className="text-base text-gray-600 font-medium">Upload a resume</span>
              </div>
              <input
                id="pdfInput"
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handlePdfUpload}
              />
            </label>
          ) : (
            <div className="w-full max-w-3xl overflow-auto p-4" style={{ maxHeight: '90vh' }}>
              <Document file={pdfPreview} onLoadSuccess={onDocumentLoadSuccess}>
                {showAllPages
                  ? Array.from(new Array(numPages || 0), (_, index) => (
                      <Page key={`page_${index + 1}`} pageNumber={index + 1} scale={scale} />
                    ))
                  : <Page pageNumber={1} scale={scale} />
                }
              </Document>
              {numPages && numPages > 1 && (
                <button
                  onClick={() => setShowAllPages(!showAllPages)}
                  className="mt-2 text-blue-600 underline text-sm"
                >
                  {showAllPages ? "Show Less" : "Show More"}
                </button>
              )}
              <button
                onClick={handleRemovePdf}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 mx-auto block"
              >
                Remove PDF
              </button>
            </div>
          )}
        </div>

        {/* RIGHT SIDE: Output Viewer */}
        <div className="flex flex-col justify-center px-6 sm:px-12 py-12">
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-sm p-14 min-h-[600px] flex flex-col gap-6 relative lg:max-h-[calc(100vh-150px)] overflow-y-auto">
            {tab === "summarize" ? (
              <div className="flex flex-col gap-6">
                {/* Personal Information */}
                <Section title="Personal Information" loading={loading}>
                  {output?.personal_information && (
                    <div className="text-gray-600">
                      <p className="font-medium">{output.personal_information.name}</p>
                      <p>{output.personal_information.title}</p>
                      <p>{output.personal_information.city}</p>
                    </div>
                  )}
                </Section>

                {/* Contact */}
                <Section title="Contact" loading={loading}>
                  {output?.contact && (
                    <div className="text-gray-600">
                      <p>{output.contact.email}</p>
                      <p>{output.contact.linkedin}</p>
                      <p>{output.contact.phone}</p>
                    </div>
                  )}
                </Section>

                {/* Experience */}
                <Section title="Work Experience" loading={loading} lines={3}>
                  {output?.experience && (
                    <div className="space-y-4">
                      {output.experience.map((exp: Experience, index: number) => (
                        <div key={index} className="border-l-2 border-gray-200 pl-4">
                          <h3 className="font-medium text-gray-900">{exp.company}</h3>
                          <p className="text-gray-600">{exp.title}</p>
                          <p className="text-sm text-gray-500">
                            {exp.startYear} - {exp.endYear}
                          </p>
                          <p className="text-sm text-gray-500">{exp.location}</p>
                          <p className="mt-2 text-gray-600">{exp.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>

                {/* Education */}
                <Section title="Education" loading={loading} lines={2}>
                  {output?.education && (
                    <div className="space-y-4">
                      {output.education.map((edu: Education, index: number) => (
                        <div key={index} className="border-l-2 border-gray-200 pl-4">
                          <h3 className="font-medium text-gray-900">{edu.university}</h3>
                          <p className="text-gray-600">{edu.degree}</p>
                          <p className="text-sm text-gray-500">
                            {edu.startYear} - {edu.endYear}
                          </p>
                          {edu.gpa && <p className="text-sm text-gray-500">GPA: {edu.gpa}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </Section>

                {/* Skills */}
                <Section title="Skills" loading={loading} lines={1}>
                  {output?.additional_information?.technical_skills && (
                    <div className="text-gray-600">
                      {output.additional_information.technical_skills}
                    </div>
                  )}
                </Section>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 text-red-600 rounded">
                    {error}
                  </div>
                )}
              </div>
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-gray-600">
                {JSON.stringify(output, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({
  title,
  loading,
  children,
  lines = 1,
}: {
  title: string;
  loading: boolean;
  children: React.ReactNode;
  lines?: number;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
      {loading ? (
        <Skeleton count={lines} />
      ) : (
        children
      )}
    </div>
  );
}

export default function ResumePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResumeContent />
    </Suspense>
  );
} 