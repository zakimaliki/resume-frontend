"use client";

import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
      try {
        const parsedOutput = JSON.parse(cleanedText);
        setOutput(parsedOutput);

        // If we have job data and the analysis was successful, add the candidate
        if (jobData && parsedOutput.personal_information) {
          try {
            // Wait for a short delay to ensure the analysis is complete
            await new Promise(resolve => setTimeout(resolve, 1000));

            const token = localStorage.getItem('token');
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

            const response = await fetch('http://localhost:3000/api/candidates', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(candidateData)
            });

            if (!response.ok) {
              throw new Error('Failed to add candidate');
            }

            // Show success message
            alert("Resume berhasil dianalisis dan kandidat berhasil ditambahkan!");
          } catch (error: unknown) {
            console.error("Error adding candidate:", error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Resume berhasil dianalisis, tetapi gagal menambahkan kandidat: ${errorMessage}`);
          }
        }

        return parsedOutput;
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        // If parsing fails, try to extract JSON from the response
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const extractedJson = JSON.parse(jsonMatch[0]);
            setOutput(extractedJson);
            return extractedJson;
          } catch (extractError) {
            console.error("Error extracting JSON:", extractError);
            throw new Error("Failed to parse API response as JSON");
          }
        } else {
          throw new Error("No valid JSON found in API response");
        }
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