"use client";

import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { authService } from '../../services/authService';
import { API_ENDPOINTS } from '../../config/api';

interface PersonalInformation {
  name?: string;
  title?: string;
  city?: string;
}

interface Contact {
  email?: string;
  linkedin?: string;
  phone?: string;
}

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

interface AdditionalInformation {
  technical_skills?: string;
}

interface JobData {
  id: string;
  title: string;
  jobDescription: string;
  responsibilities: string[];
}

interface Output {
  personal_information?: PersonalInformation | null;
  contact?: Contact | null;
  experience: Experience[] | null;
  education: Education[] | null;
  additional_information?: AdditionalInformation | null;
}

function Api() {
  const [output, setOutput] = useState<Output | null>();
  const [loading, setLoading] = useState(false);

  const handleOpenAI = async (
    e: React.ChangeEvent<HTMLInputElement>,
    data: string,
    jobData?: JobData
  ) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      let prompt = `please summarize this resume or CV briefly with this layout as JSON Format:
      1. first layout is name, Position or tittle, city,
      2. second layout is contact email, linkedin, and contact number,
      3. third layout is all experience,
      5. fifth layout is education,
      from this text: ${data}`;

      prompt += `\n\nmake exactly like this:
      {
        personal_information: {
          name: "",
          title: "",
          city: "",
        },
        contact: {
          email: "",
          linkedin: "",
          phone: "",
        },
        experience: [
          {
            company: "",
            title: "",
            startYear: "",
            endYear: "",
            location: "",
            description: "",
          },
        ],
        education: [
          {
            university: "",
            degree: "",
            gpa: "",
            startYear: "",
            endYear: "",
          }
        ],
        additional_information: {
          technical_skills: "",
        }
      } and return only JSON format`;

      // Initialize Gemini API
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean and parse the response text
      const cleanedText = text.replace(/```json|```/g, "").trim();
      
      // Debug the response
      console.log('Raw API Response:', text);
      console.log('Cleaned Text:', cleanedText);

      try {
        // First try to find a valid JSON object in the response
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No valid JSON found in API response");
        }

        // Additional cleaning of the JSON string
        let jsonStr = jsonMatch[0]
          .replace(/\n/g, ' ')  // Remove newlines
          .replace(/\r/g, ' ')  // Remove carriage returns
          .replace(/\t/g, ' ')  // Remove tabs
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
          .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3'); // Add quotes to property names

        console.log('Cleaned JSON string:', jsonStr);

        // Try to parse the matched JSON
        const parsedOutput = JSON.parse(jsonStr);
        
        // Validate the structure
        if (!parsedOutput || typeof parsedOutput !== 'object') {
          throw new Error("Invalid JSON structure");
        }

        // Ensure required fields exist
        const validatedOutput = {
          personal_information: parsedOutput.personal_information || null,
          contact: parsedOutput.contact || null,
          experience: Array.isArray(parsedOutput.experience) ? parsedOutput.experience : [],
          education: Array.isArray(parsedOutput.education) ? parsedOutput.education : [],
          additional_information: parsedOutput.additional_information || null
        };

        console.log('Validated Output:', validatedOutput);
        setOutput(validatedOutput);

        // If we have job data and the analysis was successful, add the candidate
        if (jobData && parsedOutput.personal_information) {
          try {
            // Wait for a short delay to ensure the analysis is complete
            await new Promise(resolve => setTimeout(resolve, 1000));

            const token = authService.getToken();
            if (!token) {
              throw new Error('No authentication token found');
            }

            const candidateData = {
              jobId: jobData.id,
              name: parsedOutput.personal_information.name || 'Unknown',
              location: parsedOutput.personal_information.city || 'Unknown',
              email: parsedOutput.contact?.email,
              phone: parsedOutput.contact?.phone,
              linkedin: parsedOutput.contact?.linkedin,
              experience: parsedOutput.experience,
              education: parsedOutput.education,
              skills: parsedOutput.additional_information?.technical_skills
            };

            console.log('Creating candidate with data:', candidateData);

            const response = await fetch("https://resume-backend-git-master-zakimalikis-projects.vercel.app/api/candidates", {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(candidateData)
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Failed to add candidate: ${errorText}`);
            }

            // Show success message
            alert("Resume berhasil dianalisis dan kandidat berhasil ditambahkan!");
          } catch (error: unknown) {
            console.error("Error adding candidate:", error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Resume berhasil dianalisis, tetapi gagal menambahkan kandidat: ${errorMessage}`);
          }
        }

        return validatedOutput;
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        throw new Error("Failed to parse API response as JSON");
      }
    } catch (error) {
      console.error("Error:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { output, setOutput, handleOpenAI, loading };
}

export default Api; 